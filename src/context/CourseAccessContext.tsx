import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getSupabase } from '../lib/supabase'
import { getEnvMaxUnlockedDay, timeBasedMaxDay, nextUnlockTime } from '../lib/dayAccess'
import { loadProgress } from '../lib/courseProgress'

export type CourseAccessState = {
  /** Эффективный максимум дня (1…30) с учётом подписки И временного гейтинга. */
  maxUnlockedDay: number
  loading: boolean
  /** Краткая подпись для профиля или null */
  accessLabel: string | null
  /** Сырое значение plan из Supabase subscriptions: 'free'|'basic'|'week1'|'full'|'premium' */
  userPlan: string
  /** ms до открытия следующего дня, или null если уже открыт */
  nextUnlockMs: number | null
  /** Перезапросить после логина/логаута */
  refresh: () => void
  /** Пересчитать временной гейт (вызывать после завершения дня). */
  refreshTimeGate: () => void
}

const defaultCtx: CourseAccessState = {
  maxUnlockedDay: 1,
  loading: true,
  accessLabel: null,
  userPlan: 'free',
  nextUnlockMs: null,
  refresh: () => {},
  refreshTimeGate: () => {},
}

const CourseAccessContext = createContext<CourseAccessState>(defaultCtx)

function planToMaxDay(plan: string): number | null {
  const p = plan.toLowerCase()
  if (p === 'premium' || p === 'full' || p === 'complete') return 30
  if (p === 'basic' || p === 'week1' || p === 'week_1') return 7
  return null
}

function planToLabel(plan: string, maxDay: number): string {
  if (maxDay >= 30) return 'Премиум — полный доступ'
  if (maxDay >= 7) return 'Базовый — 7 дней'
  return `Активен (${plan})`
}

export function CourseAccessProvider({ children }: { children: ReactNode }) {
  const [subscriptionMax, setSubscriptionMax] = useState(() => getEnvMaxUnlockedDay())
  const [loading, setLoading] = useState(true)
  const [accessLabel, setAccessLabel] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Вычислить текущий maxUnlockedDay с учётом времени. */
  const computeTimeMax = useCallback((subMax: number) => {
    const progress = loadProgress()
    return timeBasedMaxDay(progress.completionDates ?? {}, subMax)
  }, [])

  const [maxUnlockedDay, setMaxUnlockedDay] = useState(() => computeTimeMax(getEnvMaxUnlockedDay()))

  /** Перепланировать автоматическое обновление когда откроется следующий день. */
  const scheduleNextUnlock = useCallback((subMax: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const progress = loadProgress()
    const currentMax = timeBasedMaxDay(progress.completionDates ?? {}, subMax)
    const unlockAt = nextUnlockTime(progress.completionDates ?? {}, currentMax)
    if (unlockAt !== null) {
      const delay = Math.max(0, unlockAt - Date.now())
      timerRef.current = setTimeout(() => {
        setMaxUnlockedDay(computeTimeMax(subMax))
        scheduleNextUnlock(subMax)
      }, delay)
    }
  }, [computeTimeMax])

  const refresh = useCallback(() => {
    const sb = getSupabase()
    const envMax = getEnvMaxUnlockedDay()

    async function run() {
      try {
        if (!sb) {
          setSubscriptionMax(envMax)
          setMaxUnlockedDay(computeTimeMax(envMax))
          setAccessLabel(null)
          scheduleNextUnlock(envMax)
          return
        }
        const {
          data: { session },
        } = await sb.auth.getSession()
        if (!session?.user) {
          setSubscriptionMax(envMax)
          setMaxUnlockedDay(computeTimeMax(envMax))
          setAccessLabel(null)
          scheduleNextUnlock(envMax)
          return
        }

        const { data: sub, error } = await sb
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error || !sub) {
          setSubscriptionMax(envMax)
          setMaxUnlockedDay(computeTimeMax(envMax))
          setAccessLabel(null)
          scheduleNextUnlock(envMax)
          return
        }

        const st = String(sub.status ?? '').toLowerCase()
        const active = st === 'active' || st === 'trialing'
        if (!active) {
          setSubscriptionMax(envMax)
          setMaxUnlockedDay(computeTimeMax(envMax))
          setAccessLabel('Подписка неактивна')
          setUserPlan('free')
          scheduleNextUnlock(envMax)
          return
        }

        const plan = String(sub.plan ?? '')
        setUserPlan(plan)
        const pm = planToMaxDay(plan)
        const subMax = pm !== null ? Math.min(30, Math.max(1, pm)) : envMax
        setSubscriptionMax(subMax)
        const effective = computeTimeMax(subMax)
        setMaxUnlockedDay(effective)
        setAccessLabel(planToLabel(plan, subMax))
        scheduleNextUnlock(subMax)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    void run()
  }, [computeTimeMax, scheduleNextUnlock])

  useEffect(() => {
    void refresh()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [refresh])

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => subscription.unsubscribe()
  }, [refresh])

  /** После завершения дня — пересчитать maxUnlockedDay без запроса в Supabase. */
  const refreshTimeGate = useCallback(() => {
    setMaxUnlockedDay(computeTimeMax(subscriptionMax))
    scheduleNextUnlock(subscriptionMax)
  }, [computeTimeMax, scheduleNextUnlock, subscriptionMax])

  const nextUnlockMs = useMemo(() => {
    const progress = loadProgress()
    return nextUnlockTime(progress.completionDates ?? {}, maxUnlockedDay)
  }, [maxUnlockedDay])

  const value = useMemo(
    () => ({
      maxUnlockedDay,
      loading,
      accessLabel,
      userPlan,
      nextUnlockMs,
      refresh,
      refreshTimeGate,
    }),
    [maxUnlockedDay, loading, accessLabel, userPlan, nextUnlockMs, refresh, refreshTimeGate],
  )

  return <CourseAccessContext.Provider value={value}>{children}</CourseAccessContext.Provider>
}

export function useCourseAccess(): CourseAccessState {
  return useContext(CourseAccessContext)
}
