import { getJSON, setJSON } from './storage'
import { enqueueSync } from './syncQueue'

export type DailyReport = {
  comments?: string
  diagnostic?: boolean
  /** Секунды до ПОНР (как в legacy PWA). */
  currentRecord?: number
  /** Проценты, шаг 10 (10…100). */
  arousalLevel?: number
  stopsCount?: number
  awareness?: number
  breathing?: number
  relaxation?: number
  triggers?: string
  worked?: string
  notworked?: string
  satisfaction?: number
  confidence?: number
}

export type DailyRecord = {
  date?: string
  reportData?: DailyReport
  completed?: boolean
}

export type CheckpointDiagnostic = {
  day: 7 | 14 | 21 | 30
  type: 'basic'
  answers: Record<number, number>
  totalAverage: number
  resultLevel: string
  timestamp: string
}

export type CourseProgressState = {
  currentDay: number
  completedDays: number[]
  dailyState: Record<number, DailyRecord>
  diagnostics: CheckpointDiagnostic[]
  /** ISO-дата завершения каждого дня для временного гейтинга. */
  completionDates: Record<number, string>
}

const COURSE_KEY = 'pwa_v2_course_progress'

const defaultState = (): CourseProgressState => ({
  currentDay: 1,
  completedDays: [],
  dailyState: {},
  diagnostics: [],
  completionDates: {},
})

export function loadProgress(): CourseProgressState {
  return getJSON<CourseProgressState>(COURSE_KEY, defaultState())
}

export function saveProgress(s: CourseProgressState) {
  setJSON(COURSE_KEY, s)
}

export function updateProgress(updater: (p: CourseProgressState) => CourseProgressState) {
  const next = updater(loadProgress())
  saveProgress(next)
  return next
}

export function markDayComplete(day: number, report?: DailyReport) {
  updateProgress((p) => {
    const now = new Date().toISOString()
    const completedDays = p.completedDays.includes(day) ? p.completedDays : [...p.completedDays, day].sort((a, b) => a - b)
    const dailyState = {
      ...p.dailyState,
      [day]: {
        ...p.dailyState[day],
        date: now,
        completed: true,
        reportData: report ?? p.dailyState[day]?.reportData,
      },
    }
    const completionDates = p.completionDates?.[day]
      ? p.completionDates
      : { ...(p.completionDates ?? {}), [day]: now }
    const currentDay = Math.min(30, Math.max(p.currentDay, day + 1))
    return { ...p, completedDays, dailyState, completionDates, currentDay }
  })
  enqueueSync({
    type: 'progress',
    payload: { event: 'day_complete', day },
  })
}

export function saveCheckpointResult(row: CheckpointDiagnostic) {
  updateProgress((p) => ({
    ...p,
    diagnostics: [...p.diagnostics.filter((d) => d.day !== row.day), row],
  }))
  enqueueSync({ type: 'diagnostic', payload: { kind: 'checkpoint', ...row } })
}
