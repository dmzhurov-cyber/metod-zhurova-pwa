import type { SupabaseClient } from '@supabase/supabase-js'
import { extendedBaselineQuestions } from '../data/diagnostics'
import type { CourseProgressState, DailyReport } from './courseProgress'
import { loadProgress } from './courseProgress'
import { getJSON, KEYS } from './storage'

/** Заголовки дней курса (синхрон с контентом приложения). */
export const TRAINER_DAY_TOPICS: Record<number, string> = {
  1: 'Модель «Банки» возбуждения',
  2: 'Шкала возбуждения 0-100%',
  3: 'Триггеры эякуляции',
  4: 'ПОНР — точка невозврата',
  5: 'Четыре столпа контроля',
  6: 'Базовое дыхание 4-7-8',
  7: 'Итоги недели 1 + контрольная диагностика',
  8: 'Осознанная мастурбация (ОМ) — введение',
  9: 'Тазовое дно: расслабление важнее силы',
  10: 'Обратные Кегеля',
  11: 'Триггер — ситуация',
  12: 'Триггер — внутреннее решение',
  13: 'Триггер — динамика (ускорение)',
  14: 'Итоги недели 2 + карта триггеров',
  15: 'Техника стоп-старт',
  16: 'Расслабление — базовые техники',
  17: 'ЛК и тазовое дно (персональный протокол)',
  18: 'Техника сжатия',
  19: 'Интеграция дыхания и мышц',
  20: 'Работа с триггерами',
  21: 'Итоги недели 3 + контрольная диагностика',
  22: 'Перенос навыков в секс',
  23: 'Работа со страхами',
  24: 'Коммуникация с партнёром',
  25: 'Партнёрская практика',
  26: 'Множественные циклы',
  27: 'Эмоциональный контроль',
  28: 'Итоги недели 4 · финальная подготовка',
  29: 'Полная интеграция',
  30: 'Финальная диагностика',
}

const CONTEXT_FORMAT = 'v1'
const MAX_CONTEXT_CHARS = 4000
const MAX_REPORT_DAYS = 7

type ProfileInitial = {
  extended?: Record<string, number> | null
  pti?: { score: number; level: string; at?: string } | null
}

/** В отчётах из формы часто строки; в типе — числа. */
type ReportFields = DailyReport & {
  currentRecord?: number | string
  arousalLevel?: number | string
  stopsCount?: number | string
  awareness?: number | string
  breathing?: number | string
  relaxation?: number | string
  satisfaction?: number | string
  confidence?: number | string
}

function fieldPresent(v: string | number | undefined | null): boolean {
  if (v === undefined || v === null) return false
  if (typeof v === 'number') return Number.isFinite(v)
  return v.trim() !== ''
}

function fieldStr(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return ''
  return typeof v === 'number' ? String(v) : v
}

function formatReportLines(day: number, r: DailyReport): string[] {
  const x = r as ReportFields
  const lines: string[] = [`День ${day}:`]
  if (r.diagnostic) lines.push('(тип: контрольная/диагностический день)')
  if (fieldPresent(x.currentRecord)) lines.push(`  время до ПОНР: ${fieldStr(x.currentRecord)} сек`)
  if (fieldPresent(x.arousalLevel)) lines.push(`  уровень возбуждения: ${fieldStr(x.arousalLevel)}%`)
  if (fieldPresent(x.stopsCount)) lines.push(`  остановок: ${fieldStr(x.stopsCount)}`)
  if (fieldPresent(x.awareness)) lines.push(`  осознанность (самооценка): ${fieldStr(x.awareness)}/10`)
  if (fieldPresent(x.breathing)) lines.push(`  дыхание: ${fieldStr(x.breathing)}/10`)
  if (fieldPresent(x.relaxation)) lines.push(`  расслабление: ${fieldStr(x.relaxation)}/10`)
  if (fieldPresent(x.satisfaction)) lines.push(`  удовлетворённость: ${fieldStr(x.satisfaction)}/10`)
  if (fieldPresent(x.confidence)) lines.push(`  уверенность: ${fieldStr(x.confidence)}/10`)
  if (r.triggers?.trim()) lines.push(`  триггеры: ${r.triggers.trim()}`)
  if (r.worked?.trim()) lines.push(`  сработало: ${r.worked.trim()}`)
  if (r.notworked?.trim()) lines.push(`  не сработало: ${r.notworked.trim()}`)
  if (r.comments?.trim()) lines.push(`  комментарий: ${r.comments.trim()}`)
  return lines
}

function reportHasBody(r: DailyReport): boolean {
  const x = r as ReportFields
  if (r.comments?.trim()) return true
  if (r.triggers?.trim() || r.worked?.trim() || r.notworked?.trim()) return true
  if (fieldPresent(x.currentRecord)) return true
  if (fieldPresent(x.stopsCount)) return true
  if (fieldPresent(x.arousalLevel)) return true
  return false
}

function formatInitialDiagnosticsHuman(profile: ProfileInitial): string[] {
  const lines: string[] = []
  const ext = profile.extended
  if (ext && typeof ext === 'object') {
    lines.push('Расширенная диагностика (ответы при старте):')
    const byId = new Map(extendedBaselineQuestions.map((q) => [q.id, q]))
    for (const q of extendedBaselineQuestions) {
      const idx = ext[q.id]
      if (typeof idx !== 'number' || idx < 0 || idx >= q.options.length) continue
      lines.push(`- ${q.question} — ${q.options[idx]}`)
    }
    const unknownKeys = Object.keys(ext).filter((k) => !byId.has(k))
    for (const k of unknownKeys) {
      lines.push(`- ${k}: ${JSON.stringify(ext[k])}`)
    }
  }
  const pti = profile.pti
  if (pti && typeof pti.score === 'number') {
    lines.push(
      `PTI (тонус тазового дна): сумма ${pti.score}, уровень «${pti.level}»${pti.at ? `, дата: ${pti.at}` : ''}.`,
    )
  }
  return lines
}

/**
 * Собирает текстовый блок контекста для system message (день курса, отчёты, диагностика).
 * Источник: localStorage через loadProgress / KEYS.profileInitial.
 */
export function buildTrainerUserContextString(progress?: CourseProgressState): string {
  const p = progress ?? loadProgress()
  const lines: string[] = [`КОНТЕКСТ_ФОРМАТ: ${CONTEXT_FORMAT}`, '', 'ПРОГРЕСС КУРСА:']

  const day = p.currentDay
  const completed = p.completedDays.length
  lines.push(`Текущий день: ${day} из 30`)
  lines.push(`Завершено дней курса (чеклист): ${completed}`)
  if (day >= 1 && day <= 30 && TRAINER_DAY_TOPICS[day]) {
    lines.push(`Тема текущего дня: ${TRAINER_DAY_TOPICS[day]}`)
  }
  if (day > 1 && TRAINER_DAY_TOPICS[day - 1]) {
    lines.push(`Предыдущий день (тема): ${TRAINER_DAY_TOPICS[day - 1]}`)
  }

  const completedSorted = [...p.completedDays].sort((a, b) => b - a)
  const reportBlocks: string[] = []
  let used = 0
  for (const d of completedSorted) {
    if (used >= MAX_REPORT_DAYS) break
    const rec = p.dailyState[d]
    const r = rec?.reportData
    if (!r || !reportHasBody(r)) continue
    reportBlocks.push(formatReportLines(d, r).join('\n'))
    used++
  }
  if (reportBlocks.length > 0) {
    lines.push('', 'ПОСЛЕДНИЕ ОТЧЁТЫ (до 7 завершённых дней с заполненными данными):', ...reportBlocks)
  } else {
    lines.push('', 'ПОСЛЕДНИЕ ОТЧЁТЫ: пока нет заполненных отчётов по завершённым дням.')
  }

  const rawProfile = getJSON<ProfileInitial | null>(KEYS.profileInitial, null)
  if (rawProfile && (rawProfile.extended || rawProfile.pti)) {
    lines.push('', 'СТАРТОВАЯ ДИАГНОСТИКА:')
    lines.push(...formatInitialDiagnosticsHuman(rawProfile))
  } else {
    lines.push('', 'СТАРТОВАЯ ДИАГНОСТИКА: в приложении не найдена (пользователь мог не пройти или другой браузер).')
  }

  if (p.diagnostics.length > 0) {
    lines.push('', 'КОНТРОЛЬНЫЕ ДИАГНОСТИКИ КУРСА:')
    for (const row of p.diagnostics) {
      lines.push(
        `- День ${row.day}: средний балл ${row.totalAverage.toFixed(2)}, уровень «${row.resultLevel}»`,
      )
    }
  }

  let text = lines.join('\n')
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS - 20) + '\n…(обрезано по лимиту)'
  }
  return text
}

type CohortRow = {
  stats: Record<string, unknown> | null
  sample_size: number | null
  period_start: string | null
  period_end: string | null
}

/**
 * Загружает последнюю строку агрегатов для слоя «когорта». Если таблицы нет — null.
 */
export async function fetchLatestCohortContextBlock(sb: SupabaseClient): Promise<string | null> {
  try {
    const { data, error } = await sb
      .from('trainer_cohort_stats')
      .select('stats, sample_size, period_start, period_end')
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return formatCohortRowForPrompt(data as CohortRow)
  } catch {
    return null
  }
}

function formatCohortRowForPrompt(row: CohortRow): string {
  const stats = row.stats ?? {}
  const narrative = typeof stats.narrative_ru === 'string' ? stats.narrative_ru.trim() : ''
  const n = row.sample_size ?? 0
  const lines = [
    '═══ СВОДКА ПО КОГОРТЕ (анонимно, без персональных данных других людей) ═══',
    `Период: ${row.period_start ?? '?'} — ${row.period_end ?? '?'}; выборка: ${n} пользователей (агрегат).`,
  ]
  if (narrative) lines.push(narrative)
  else lines.push('Детали (JSON):', JSON.stringify(stats).slice(0, 1200))
  lines.push(
    'Используй только как фон и нормализацию опыта; не выдумывай цифры вне этого блока; не ссылайся на конкретных людей.',
  )
  return lines.join('\n')
}
