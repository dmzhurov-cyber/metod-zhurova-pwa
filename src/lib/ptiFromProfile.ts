import { getJSON } from './storage'

export type PtiLevel = 'low' | 'moderate' | 'high'

/** Уровень PTI из стартовой диагностики; если не проходили — null */
export function getPtiLevelFromProfile(): PtiLevel | null {
  const j = getJSON<{ pti?: { level?: string } } | null>('pwa_v2_profile_initial', null)
  const l = j?.pti?.level
  if (l === 'low' || l === 'moderate' || l === 'high') return l
  return null
}
