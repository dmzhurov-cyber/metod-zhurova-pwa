import {
  dayContentMap,
  reportPrompts,
  uniqueTasks,
  libraryContent as libraryContentLegacy,
} from './legacy/courseData.js'
import { bookTheoryLibrary } from './legacy/bookTheory.generated.js'

export const libraryContent = {
  ...libraryContentLegacy,
  theory: [...libraryContentLegacy.theory, ...bookTheoryLibrary],
}

export const COURSE_PHASES = [
  { start: 1, end: 7, name: 'Основы контроля', color: '#99f7ff' },
  { start: 8, end: 14, name: 'Укрепление навыков', color: '#6d9086' },
  { start: 15, end: 21, name: 'Продвинутые техники', color: '#9d4edd' },
  { start: 22, end: 28, name: 'Реальные условия', color: '#FF9800' },
  { start: 29, end: 30, name: 'Завершение курса', color: '#4CAF50' },
] as const

/** Как в legacy: контрольные в конце недель + день 30 */
export const CHECKPOINT_DAYS = [7, 14, 21, 30] as const

export type DayBundle = {
  day: number
  title: string
  theory: string
  task: (typeof uniqueTasks)[number] | null
  report: { focus: string; placeholder: string }
}

export function getDayBundle(day: number): DayBundle | null {
  if (day < 1 || day > 30) return null
  const dc = dayContentMap[day]
  if (!dc) return null
  const task = uniqueTasks[day] ?? null
  const report = reportPrompts[day] ?? {
    focus: 'Фокус дня',
    placeholder: 'Опишите ощущения, трудности и успехи.',
  }
  return {
    day,
    title: dc.title,
    theory: dc.theory,
    task,
    report,
  }
}

export function getPhaseForDay(day: number) {
  return COURSE_PHASES.find((p) => day >= p.start && day <= p.end) ?? COURSE_PHASES[0]
}

/** Номер фазы курса 1…5 для подписи экрана дня (как «Protocol Phase 01»). */
export function getPhaseNumberForDay(day: number): number {
  const i = COURSE_PHASES.findIndex((p) => day >= p.start && day <= p.end)
  return i >= 0 ? i + 1 : 1
}

export { dayContentMap, reportPrompts, uniqueTasks }
