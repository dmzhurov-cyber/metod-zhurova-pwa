/**
 * Полноэкранные атмосферные фоны (лаборатория, лес, клетки и т.д.) —
 * отдельно от мелких иллюстраций ILL-DAY-*.svg в hero.
 */
const ATMOSPHERE_KEYS = ['liquid', 'lab', 'cells', 'forest', 'neural', 'vapor'] as const

export type AtmosphereKey = (typeof ATMOSPHERE_KEYS)[number]

export function atmosphereKeyForDay(day: number): AtmosphereKey {
  const d = Math.min(30, Math.max(1, day))
  return ATMOSPHERE_KEYS[(d - 1) % ATMOSPHERE_KEYS.length]
}

export function dayAtmosphereUrl(day: number): string {
  const key = atmosphereKeyForDay(day)
  return `${import.meta.env.BASE_URL}course-assets/atmosphere/atmos-${key}.svg`
}
