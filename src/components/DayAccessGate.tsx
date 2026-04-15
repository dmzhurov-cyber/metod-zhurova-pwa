import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourseAccess } from '../context/CourseAccessContext'
import { loadProgress } from '../lib/courseProgress'
import { nextDayUnlockAt } from '../lib/dayAccess'

type Props = { children: ReactNode }

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

/**
 * Ограничивает маршруты `/app/day/:day` и `/app/checkpoint/:day`
 * по подписке И временному гейтингу (следующий день открывается в 1:00).
 */
export function DayAccessGate({ children }: Props) {
  const { day: dayParam } = useParams()
  const day = Number(dayParam)
  const { maxUnlockedDay: max } = useCourseAccess()
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (day <= max) return
    const progress = loadProgress()
    const prevIso = progress.completionDates?.[day - 1]
    if (!prevIso) return

    const unlockAt = nextDayUnlockAt(prevIso)
    const tick = () => {
      const diff = unlockAt - Date.now()
      setCountdown(diff > 0 ? formatCountdown(diff) : '00:00:00')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [day, max])

  if (!Number.isFinite(day) || day < 1 || day > 30) {
    return (
      <div className="sp-main" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="sp-card">
          <p className="sp-muted">Такого дня нет в курсе.</p>
          <Link to="/app/home" className="sp-btn-ghost" style={{ textDecoration: 'none', marginTop: 12, display: 'block' }}>
            На главную
          </Link>
        </div>
      </div>
    )
  }

  if (day > max) {
    const progress = loadProgress()
    const prevCompleted = progress.completedDays.includes(day - 1)

    return (
      <div className="sp-main" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="sp-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🌙</div>
          <h1 className="sp-display" style={{ fontSize: '1.15rem', marginBottom: 12 }}>
            День {day} откроется завтра
          </h1>
          {prevCompleted && countdown ? (
            <p style={{ fontFamily: 'monospace', fontSize: '1.6rem', color: 'var(--sp-primary-from)', marginBottom: 12 }}>
              {countdown}
            </p>
          ) : null}
          <p className="sp-muted" style={{ marginBottom: 16 }}>
            {prevCompleted
              ? 'День откроется в 1:00. Дай практике осесть — это часть метода.'
              : `Сначала завершите день ${day - 1}.`}
          </p>
          <Link to="/app/home" className="sp-btn-primary" style={{ textDecoration: 'none' }}>
            Вернуться
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
