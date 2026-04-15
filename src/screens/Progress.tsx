import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { loadProgress } from '../lib/courseProgress'
import { dayContentMap, CHECKPOINT_DAYS } from '../course/courseModel'
import { useGame } from '../hooks/useGame'
import { achievementDefinitionsForUi } from '../lib/gameState'
import { useCourseAccess } from '../context/CourseAccessContext'
import { isDayUnlocked } from '../lib/dayAccess'
import { formatDailyReportSummary } from '../lib/dailyReportForm'
import { getJSON } from '../lib/storage'

function TestsSection() {
  const p = loadProgress()
  const game = useGame()
  const initial = getJSON<{ pti?: { score: number; level: string } } | null>('pwa_v2_profile_initial', null)

  return (
    <div className="sp-card" style={{ marginBottom: 16 }}>
      <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 12 }}>
        Мои тесты
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <Link to="/app/tests/pillars" style={{ textDecoration: 'none' }} className="sp-btn-ghost">
          Диагностика четырёх столпов {game.testResults.pillars ? '✓' : ''}
        </Link>
        <Link to="/app/tests/triggers" style={{ textDecoration: 'none' }} className="sp-btn-ghost">
          Карта триггеров {game.testResults.triggers ? '✓' : ''}
        </Link>
      </div>
      {initial?.pti && (
        <div className="sp-card" style={{ marginBottom: 8 }}>
          <strong>Стартовая диагностика (PTI)</strong>
          <p className="sp-muted" style={{ marginTop: 6 }}>
            PTI: {initial.pti.score} баллов · уровень {initial.pti.level}
          </p>
        </div>
      )}
      {p.diagnostics.map((d, i) => (
        <div key={i} className="sp-card" style={{ marginBottom: 8 }}>
          <strong>Контрольная · день {d.day}</strong> — {d.resultLevel}
          <p className="sp-muted" style={{ marginTop: 6 }}>
            Средний балл: {d.totalAverage.toFixed(2)}
          </p>
        </div>
      ))}
      {p.diagnostics.length === 0 && !initial?.pti && !game.testResults.pillars && !game.testResults.triggers && (
        <p className="sp-muted" style={{ fontSize: '0.9rem' }}>
          Пройдите тесты выше — результаты появятся здесь.
        </p>
      )}
    </div>
  )
}

function ReportsSection() {
  const [open, setOpen] = useState(false)
  const p = loadProgress()
  const days = Object.keys(p.dailyState)
    .map(Number)
    .filter((d) => p.dailyState[d]?.reportData && !p.dailyState[d]?.reportData?.diagnostic)
    .sort((a, b) => a - b)

  if (days.length === 0) {
    return (
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
          Отчёты по дням
        </h2>
        <p className="sp-muted" style={{ fontSize: '0.9rem' }}>
          Пока нет отчётов. Заполняйте блок «Ежедневный отчёт» в каждом дне курса.
        </p>
      </div>
    )
  }

  return (
    <div className="sp-card" style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <h2 className="sp-display" style={{ fontSize: '1rem', margin: 0 }}>
          Отчёты по дням ({days.length})
        </h2>
        <span className="sp-muted" style={{ fontSize: '1.1rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="sp-stack" style={{ marginTop: 12 }}>
          {days.map((d) => {
            const r = p.dailyState[d]?.reportData
            return (
              <div key={d} className="sp-card">
                <strong>День {d}</strong>
                <p className="sp-muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                  {r ? formatDailyReportSummary(r) : '—'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Progress() {
  const p = loadProgress()
  const { maxUnlockedDay } = useCourseAccess()
  const game = useGame()
  const achievements = achievementDefinitionsForUi(game, p)

  return (
    <div>
      <h1 className="sp-display" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
        Прогресс
      </h1>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
          Стрик
        </h2>
        {game.streak.current > 0 ? (
          <p>
            🔥 <strong>{game.streak.current}</strong> дней подряд · лучший: {game.streak.best}
          </p>
        ) : (
          <p className="sp-muted">Завершайте дни курса подряд — растёт стрик и бонус XP.</p>
        )}
      </div>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <p className="sp-muted" style={{ marginBottom: 12 }}>
          Контрольные диагностики (дни 7, 14, 21, 30) — отдельный маршрут.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(CHECKPOINT_DAYS as readonly number[]).map((d) =>
            isDayUnlocked(d, maxUnlockedDay) ? (
              <Link key={d} to={`/app/checkpoint/${d}`} className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
                Контрольная диагностика — день {d}
              </Link>
            ) : (
              <span key={d} className="sp-muted" style={{ fontSize: '0.9rem' }}>
                Контрольная — день {d} (позже, вместе с днями курса)
              </span>
            ),
          )}
        </div>
      </div>

      <div className="sp-card" style={{ marginBottom: 16 }}>
        <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 12 }}>
          Достижения
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 10,
          }}
        >
          {achievements.map((a) => (
            <div
              key={a.id}
              className="sp-card"
              style={{
                opacity: a.unlocked ? 1 : 0.45,
                textAlign: 'center',
                padding: 10,
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontSize: '1.5rem' }} aria-hidden>
                {a.icon}
              </div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{a.title}</div>
              <div className="sp-muted" style={{ marginTop: 4 }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Link to="/app/skill-tree" className="sp-btn-primary" style={{ textDecoration: 'none' }}>
          Дерево умений
        </Link>
      </div>

      <TestsSection />

      <ReportsSection />

      <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 12 }}>
        30 дней
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
          gap: 8,
        }}
      >
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const done = p.completedDays.includes(day)
          const title = dayContentMap[day]?.title?.replace(/^День \d+:\s*/, '') ?? `День ${day}`
          const unlocked = isDayUnlocked(day, maxUnlockedDay)
          const cellStyle: CSSProperties = {
            borderRadius: 10,
            padding: '10px 6px',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: done ? 'rgba(153,247,255,0.2)' : 'rgba(255,255,255,0.06)',
            color: 'var(--sp-on-surface)',
            border: '1px solid rgba(153,247,255,0.15)',
            opacity: unlocked ? 1 : 0.4,
          }
          if (unlocked) {
            return (
              <Link key={day} to={`/app/day/${day}`} title={title} style={{ ...cellStyle, textDecoration: 'none' }}>
                {day}
              </Link>
            )
          }
          return (
            <span key={day} title={`День ${day} — в полной версии`} style={cellStyle}>
              {day}
            </span>
          )
        })}
      </div>
    </div>
  )
}
