import { Link } from 'react-router-dom'
import { getJSON } from '../lib/storage'
import { loadProgress } from '../lib/courseProgress'
import { COURSE_PHASES } from '../course/courseModel'
import { useGame } from '../hooks/useGame'
import { loadGame, markBreathingDone, saveGame, xpBarSegment } from '../lib/gameState'
import { DAILY_TASKS } from '../game/dailyTasks'
import { useCourseAccess } from '../context/CourseAccessContext'

// ─── ВОПРОСЫ К ДЖААНУ ────────────────────────────────────────────────────────
// 1. Как называются фазы курса? Сейчас: "Основы контроля", "Укрепление навыков" и тд.
//    Они звучат технически. Как бы ты их назвал своим голосом?
//
// 2. Приветствие по утрам — что Джаан говорит мужчине, который открывает приложение?
//    Сейчас: нейтральное "Текущий ориентир — день X". Как должно быть?
//
// 3. Мотивационная строка под прогрессом — что она говорит? Про путь? Про тело?
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 18) return 'Добрый день'
  if (h >= 18 && h < 23) return 'Добрый вечер'
  return 'Привет'
}

// ВОПРОС К ДЖААНУ: что говорить на каждом этапе пути?
// Сейчас — заготовки. Замени своими словами.
function getDayMessage(day: number): string {
  if (day <= 3) return 'Начало пути. Самое важное — просто прийти.'
  if (day <= 7) return 'Первая неделя. Тело начинает слышать.'
  if (day <= 14) return 'Ты уже знаешь больше, чем казалось возможным.'
  if (day <= 21) return 'Середина пути. Здесь начинается настоящее.'
  if (day <= 28) return 'Финишная прямая. Всё, что ты сделал — уже твоё.'
  return 'День 30. Это не конец — это начало.'
}

export function Home() {
  const profile = getJSON<Record<string, unknown> | null>('pwa_v2_profile_initial', null)
  const p = loadProgress()
  const { maxUnlockedDay: maxDay } = useCourseAccess()
  const current = Math.min(Math.max(p.currentDay, 1), 30)
  const goDay = Math.min(current, maxDay)
  const game = useGame()
  const bar = xpBarSegment(game.xp)

  function breathingDone() {
    saveGame(markBreathingDone(loadGame()))
  }

  return (
    <div className="home-screen-protocol">

      {/* Шапка */}
      <div className="day-protocol-topbar">
        <span className="day-protocol-brand">МЖ</span>
        <span className="day-protocol-topbar-right">Метод Журова</span>
      </div>

      {/* Герой */}
      <div className="home-protocol-hero">
        <div className="home-protocol-hero-glow" aria-hidden />
        <div className="home-protocol-phase-label">{getGreeting()}</div>
        <div className="home-protocol-headline">
          <span className="home-protocol-headline-main">День </span>
          <span className="home-protocol-headline-accent">{current}</span>
          <span className="home-protocol-headline-main"> из 30</span>
        </div>
        <p className="home-protocol-sub">{getDayMessage(current)}</p>
        <div className="home-protocol-xp-row">
          <span className="home-protocol-xp-meta">
            {bar.name} · {game.totalXpEarned} XP
          </span>
          {bar.need > 0 && (
            <div className="home-protocol-progress">
              <div className="sp-progress-bar">
                <i style={{ width: `${bar.pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Подсказка после диагностики */}
      {profile != null && (
        <p className="sp-muted home-protocol-hint" style={{ marginBottom: 14 }}>
          Диагностика сохранена. Тренер видит твой старт.
        </p>
      )}

      {/* Приоритет дня */}
      <div className="home-protocol-focus sp-card day-protocol-card">
        <span className="home-protocol-pill">Сегодня</span>
        <p className="home-protocol-focus-title">День {goDay}</p>
        {/* ВОПРОС К ДЖААНУ: что писать под номером дня? Краткий анонс того, что внутри? */}
        <p className="home-protocol-focus-desc sp-muted">Теория, практика и отчёт.</p>
        <Link
          to={`/app/day/${goDay}`}
          className="sp-btn-primary"
          style={{ textDecoration: 'none', marginTop: 4 }}
        >
          Открыть день {goDay}
        </Link>
      </div>

      {/* AI-тренер — новый блок */}
      <div className="sp-card day-protocol-card" style={{ marginBottom: 16, borderLeft: '3px solid #99f7ff' }}>
        <span className="home-protocol-pill" style={{ background: 'rgba(153,247,255,0.15)', color: '#99f7ff' }}>
          Живой чат
        </span>
        <p className="home-protocol-focus-title" style={{ marginTop: 8 }}>Поговори с тренером</p>
        <p className="sp-muted" style={{ fontSize: '0.9rem', margin: '6px 0 12px' }}>
          Задай вопрос, расскажи что происходит — я отвечу.
        </p>
        <Link to="/app/ai" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
          Открыть чат
        </Link>
      </div>

      {/* Ежедневные задания */}
      <div className="sp-card day-protocol-card" style={{ marginBottom: 16 }}>
        <h2 className="day-protocol-section-title" style={{ marginTop: 0 }}>
          Ежедневные задания
        </h2>
        <p className="sp-muted" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
          {game.dailies.completed.length}/{DAILY_TASKS.length} сегодня
        </p>
        <button type="button" className="sp-btn-ghost" style={{ marginBottom: 8 }} onClick={breathingDone}>
          Дыхательная практика (4-7-8) ✓
        </button>
      </div>

      {/* Фазы курса */}
      <h2 className="day-protocol-section-title" style={{ margin: '22px 0 12px' }}>
        Путь
      </h2>
      <div className="sp-stack">
        {COURSE_PHASES.map((ph) => (
          <div
            key={ph.name}
            className="sp-card day-protocol-card home-protocol-phase-card"
            style={{ borderLeft: `4px solid ${ph.color}` }}
          >
            <strong>
              Дни {ph.start}–{ph.end}
            </strong>
            <p className="sp-muted" style={{ margin: '6px 0 0' }}>
              {ph.name}
            </p>
          </div>
        ))}
      </div>

      {/* Навигация */}
      <div style={{ marginTop: 20 }} className="sp-stack">
        <Link to="/app/library" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
          Библиотека
        </Link>
        <Link to="/app/progress" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
          Прогресс
        </Link>
        <Link to="/app/skill-tree" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
          Дерево умений
        </Link>
      </div>

      {/* Вводный модуль */}
      <div className="sp-card day-protocol-card" style={{ marginTop: 16, marginBottom: 24 }}>
        <h2 className="day-protocol-section-title" style={{ marginTop: 0 }}>
          Вводный модуль
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link to="/app/intro/1" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>Часть 1</Link>
          <Link to="/app/intro/2" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>Часть 2</Link>
          <Link to="/app/intro/3" className="sp-btn-ghost" style={{ textDecoration: 'none' }}>Часть 3</Link>
        </div>
      </div>

    </div>
  )
}
