/** Клиентский гейтинг дней курса (макс. день включительно). Серверная проверка — отдельно. */

const COURSE_LAST_DAY = 30

/** Час ночи — время когда открывается следующий день. */
const UNLOCK_HOUR = 1

function parseMaxFromEnv(): number | null {
  const raw = import.meta.env.VITE_MAX_UNLOCKED_DAY
  if (raw === undefined || raw === null || String(raw).trim() === '') return null
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n)) return null
  return n
}

/** Лимит из env/билда без учёта подписки в облаке. */
export function getEnvMaxUnlockedDay(): number {
  const parsed = parseMaxFromEnv()
  if (parsed === null) return COURSE_LAST_DAY
  return Math.min(COURSE_LAST_DAY, Math.max(1, parsed))
}

/**
 * Синхронный лимит дней (только env). Для UI с подпиской используйте {@link useCourseAccess}.
 * @deprecated предпочтительно useCourseAccess().maxUnlockedDay
 */
export function getMaxUnlockedDay(): number {
  return getEnvMaxUnlockedDay()
}

/**
 * Возвращает временну́ю метку когда откроется следующий день после completionIso.
 * Правило: следующая 1:00 после даты завершения (минимум следующий день 1:00).
 */
export function nextDayUnlockAt(completionIso: string): number {
  const completed = new Date(completionIso)
  const next = new Date(completed)
  next.setDate(next.getDate() + 1)
  next.setHours(UNLOCK_HOUR, 0, 0, 0)
  if (next.getTime() <= completed.getTime()) {
    next.setDate(next.getDate() + 1)
  }
  return next.getTime()
}

/**
 * Вычисляет максимально доступный день с учётом времени — день N+1 открывается
 * в 1:00 следующих суток после завершения дня N.
 * completedDates — словарь { dayNumber: isoDateString } дат завершения.
 */
export function timeBasedMaxDay(
  completedDates: Record<number, string | undefined>,
  subscriptionMax: number,
): number {
  if (import.meta.env.VITE_TEST_MODE === 'true') return subscriptionMax

  const now = Date.now()
  let max = 1
  for (let d = 1; d < COURSE_LAST_DAY; d++) {
    const iso = completedDates[d]
    if (!iso) break
    const unlockAt = nextDayUnlockAt(iso)
    if (now >= unlockAt) {
      max = d + 1
    } else {
      break
    }
  }
  return Math.min(subscriptionMax, max, COURSE_LAST_DAY)
}

/**
 * Время (ms) когда откроется следующий день, или null если уже открыт.
 */
export function nextUnlockTime(
  completedDates: Record<number, string | undefined>,
  currentMax: number,
): number | null {
  const iso = completedDates[currentMax]
  if (!iso) return null
  const unlockAt = nextDayUnlockAt(iso)
  if (Date.now() >= unlockAt) return null
  return unlockAt
}

export function isDayUnlocked(day: number, maxUnlocked: number): boolean {
  if (!Number.isFinite(day) || day < 1) return false
  return day <= maxUnlocked
}
