import type { DailyReport } from './courseProgress'

export function formatDailyReportSummary(r: DailyReport): string {
  const lines: string[] = []
  if (r.currentRecord != null) lines.push(`До ПОНР: ${r.currentRecord} с`)
  if (r.arousalLevel != null) lines.push(`Макс. возбуждение: ${r.arousalLevel}%`)
  if (r.stopsCount != null) lines.push(`Остановок: ${r.stopsCount}`)
  if (r.awareness != null) lines.push(`Осознанность: ${r.awareness}/10`)
  if (r.breathing != null) lines.push(`Дыхание: ${r.breathing}/10`)
  if (r.relaxation != null) lines.push(`Расслабление: ${r.relaxation}/10`)
  if (r.satisfaction != null) lines.push(`Удовлетворённость: ${r.satisfaction}/10`)
  if (r.confidence != null) lines.push(`Уверенность: ${r.confidence}/10`)
  if (r.triggers) lines.push(`Триггеры: ${r.triggers}`)
  if (r.worked) lines.push(`Сработало: ${r.worked}`)
  if (r.notworked) lines.push(`Не сработало: ${r.notworked}`)
  if (r.comments) lines.push(`Фокус дня: ${r.comments}`)
  return lines.length ? lines.join('\n') : '—'
}

/** Поля формы как строки для контролируемых input/select. */
export type DailyReportFormState = {
  currentRecord: string
  arousalLevel: string
  stopsCount: string
  awareness: string
  breathing: string
  relaxation: string
  triggers: string
  worked: string
  notworked: string
  comments: string
  satisfaction: string
  confidence: string
}

export const AROUSAL_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const
export const SCALE_1_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

const defaultForm = (): DailyReportFormState => ({
  currentRecord: '',
  arousalLevel: '70',
  stopsCount: '',
  awareness: '5',
  breathing: '5',
  relaxation: '5',
  triggers: '',
  worked: '',
  notworked: '',
  comments: '',
  satisfaction: '7',
  confidence: '5',
})

export function formStateFromSaved(r?: DailyReport): DailyReportFormState {
  const d = defaultForm()
  if (!r) return d
  return {
    currentRecord: r.currentRecord != null ? String(r.currentRecord) : '',
    arousalLevel: r.arousalLevel != null ? String(r.arousalLevel) : d.arousalLevel,
    stopsCount: r.stopsCount != null ? String(r.stopsCount) : '',
    awareness: r.awareness != null ? String(r.awareness) : d.awareness,
    breathing: r.breathing != null ? String(r.breathing) : d.breathing,
    relaxation: r.relaxation != null ? String(r.relaxation) : d.relaxation,
    triggers: r.triggers ?? '',
    worked: r.worked ?? '',
    notworked: r.notworked ?? '',
    comments: r.comments ?? '',
    satisfaction: r.satisfaction != null ? String(r.satisfaction) : d.satisfaction,
    confidence: r.confidence != null ? String(r.confidence) : d.confidence,
  }
}

function parseOptInt(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? n : undefined
}

/** Снимок для сохранения: переносит прошлые служебные поля (diagnostic) и очищает текст при пустой строке. */
export function fullReportFromFormState(s: DailyReportFormState, prev?: DailyReport): DailyReport {
  const next: DailyReport = { ...prev, diagnostic: prev?.diagnostic }

  const cr = parseOptInt(s.currentRecord)
  if (cr !== undefined) next.currentRecord = cr
  else delete next.currentRecord

  const sc = parseOptInt(s.stopsCount)
  if (sc !== undefined) next.stopsCount = sc
  else delete next.stopsCount

  const al = parseOptInt(s.arousalLevel)
  if (al !== undefined) next.arousalLevel = al
  const aw = parseOptInt(s.awareness)
  if (aw !== undefined) next.awareness = aw
  const br = parseOptInt(s.breathing)
  if (br !== undefined) next.breathing = br
  const rl = parseOptInt(s.relaxation)
  if (rl !== undefined) next.relaxation = rl
  const sat = parseOptInt(s.satisfaction)
  if (sat !== undefined) next.satisfaction = sat
  const conf = parseOptInt(s.confidence)
  if (conf !== undefined) next.confidence = conf

  const t = s.triggers.trim()
  if (t) next.triggers = t
  else delete next.triggers
  const w = s.worked.trim()
  if (w) next.worked = w
  else delete next.worked
  const n = s.notworked.trim()
  if (n) next.notworked = n
  else delete next.notworked
  const c = s.comments.trim()
  if (c) next.comments = c
  else delete next.comments

  return next
}

/** Достаточно ли данных отчёта, чтобы засчитать ежедневное задание «отчёт» (XP). */
export function dailyReportWorthReportTask(r: DailyReport): boolean {
  if ([r.comments, r.triggers, r.worked, r.notworked].some((x) => x && x.trim().length > 0)) return true
  if (r.currentRecord != null && r.currentRecord > 0) return true
  if (r.stopsCount != null && r.stopsCount >= 0) return true
  return false
}
