/** Иллюстрации дня ILL-DAY-01 … 30 — как getDayIllustrationHTML в legacy */

export function dayIllustrationUrl(day: number): string {
  if (day < 1 || day > 30) return ''
  const name = `ILL-DAY-${String(day).padStart(2, '0')}.svg`
  return `${import.meta.env.BASE_URL}course-assets/illustrations/${encodeURIComponent(name)}`
}
