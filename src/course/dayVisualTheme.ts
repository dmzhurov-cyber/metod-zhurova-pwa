import type { CSSProperties } from 'react'
import { getPhaseNumberForDay } from './courseModel'

/**
 * Пер-суточные и фазовые вариации hero/свечения без смены контента.
 * Значения согласованы с Submerged Precision + референсом Control protocol.
 */
const PHASE_SKIN: Record<
  1 | 2 | 3 | 4 | 5,
  { heroMid: string; heroDeep: string; borderGlow: string; accentSoft: string }
> = {
  1: {
    heroMid: 'rgba(153, 247, 255, 0.14)',
    heroDeep: 'rgba(0, 0, 0, 0.9)',
    borderGlow: 'rgba(153, 247, 255, 0.16)',
    accentSoft: '#8ef5ff',
  },
  2: {
    heroMid: 'rgba(109, 144, 134, 0.2)',
    heroDeep: 'rgba(0, 0, 0, 0.91)',
    borderGlow: 'rgba(140, 200, 185, 0.18)',
    accentSoft: '#9ee0d0',
  },
  3: {
    heroMid: 'rgba(157, 78, 221, 0.16)',
    heroDeep: 'rgba(0, 0, 0, 0.92)',
    borderGlow: 'rgba(180, 120, 235, 0.2)',
    accentSoft: '#d4b3ff',
  },
  4: {
    heroMid: 'rgba(255, 152, 0, 0.14)',
    heroDeep: 'rgba(0, 0, 0, 0.91)',
    borderGlow: 'rgba(255, 180, 90, 0.2)',
    accentSoft: '#ffcc80',
  },
  5: {
    heroMid: 'rgba(76, 175, 80, 0.14)',
    heroDeep: 'rgba(0, 0, 0, 0.9)',
    borderGlow: 'rgba(120, 210, 140, 0.2)',
    accentSoft: '#a5d6a7',
  },
}

export function dayVisualStyleVars(day: number): CSSProperties {
  const phase = getPhaseNumberForDay(day) as 1 | 2 | 3 | 4 | 5
  const skin = PHASE_SKIN[phase]
  return {
    '--day-hero-mid': skin.heroMid,
    '--day-hero-deep': skin.heroDeep,
    '--day-hero-border-glow': skin.borderGlow,
    '--day-title-accent': skin.accentSoft,
    '--day-img-sat': String(0.84 + (day % 4) * 0.02),
    '--day-img-brightness': String(0.88 + (day % 3) * 0.02),
  } as CSSProperties
}
