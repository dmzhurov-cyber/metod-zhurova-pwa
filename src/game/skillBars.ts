/** Параметры навыков (полосы в профиле) — как userState.skills в legacy */

export type SkillBars = {
  muscleControl: number
  urgeRecognition: number
  ponrRecognition: number
  breathing: number
  partnerControl: number
  sensitivity: number
  volumeIncrease: number
  arousalStrength: number
}

export const defaultSkillBars = (): SkillBars => ({
  muscleControl: 0,
  urgeRecognition: 0,
  ponrRecognition: 0,
  breathing: 0,
  partnerControl: 0,
  sensitivity: 0,
  volumeIncrease: 0,
  arousalStrength: 0,
})

const SKILL_KEYS = Object.keys(defaultSkillBars()) as (keyof SkillBars)[]

/** Детерминированный «случайный» инкремент 0.5–2.0 по дню и заголовку */
function pseudoIncrement(day: number, seed: string): number {
  let h = day * 131 + seed.length * 17
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 9973
  return 0.5 + (h % 151) / 100
}

/**
 * Логика прироста навыков по заголовку задания дня (упрощённо с legacy).
 */
export function applyTaskTitleToSkills(
  bars: SkillBars,
  taskTitle: string,
  day: number,
): SkillBars {
  const inc = pseudoIncrement(day, taskTitle)
  const next = { ...bars }
  const add = (k: keyof SkillBars, v: number) => {
    next[k] = Math.min(100, (next[k] || 0) + v)
  }

  const t = taskTitle
  if (/PC|мышц/i.test(t)) {
    add('muscleControl', inc)
  } else if (/Дых|дыхан/i.test(t)) {
    add('breathing', inc)
  } else if (/Стоп-Старт/i.test(t)) {
    add('ponrRecognition', inc)
    add('urgeRecognition', inc * 0.9)
  } else if (/Осознанн|ОМ/i.test(t)) {
    add('sensitivity', inc)
    add('urgeRecognition', inc * 0.6)
  } else if (/Триггер|Шкала|Карт/i.test(t)) {
    add('urgeRecognition', inc)
    add('ponrRecognition', inc * 0.7)
  } else if (/Темп|Визуальн|Ментальн/i.test(t)) {
    add('sensitivity', inc)
  } else if (/Комбинирован|Интеграц/i.test(t)) {
    for (const k of SKILL_KEYS) add(k, inc * 0.35)
  } else if (/Диагност/i.test(t)) {
    add('sensitivity', inc * 0.4)
    add('urgeRecognition', inc * 0.4)
  } else {
    add('sensitivity', inc * 0.7)
  }

  add('partnerControl', inc * 0.15)
  add('arousalStrength', inc * 0.08)
  add('volumeIncrease', inc * 0.05)

  return next
}
