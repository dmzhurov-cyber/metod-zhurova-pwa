import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FigmaFlowHeader } from '../components/FigmaFlowHeader'
import { IconChevronRight } from '../components/FigmaFlowIcons'
import { KEYS, setFlag } from '../lib/storage'
import { AudioPlayer } from '../components/AudioPlayer'
import { AUDIO } from '../lib/audioAssets'

// ─── ВОПРОСЫ К ДЖААНУ ────────────────────────────────────────────────────────
// Шаг 0 — личное приветствие. Что ты хочешь сказать человеку в самый первый момент?
// Что он должен почувствовать? Чего НЕ должен бояться?
// Замени текст ниже своими словами. Это твой голос, не шаблон.
// ─────────────────────────────────────────────────────────────────────────────

const steps = [
  {
    tag: 'Добро пожаловать',
    title: 'Привет. Я — Джаан.',
    audio: AUDIO.onboarding_welcome,
    audioLabel: 'Джаан · приветствие',
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="sp-muted">
          15 лет назад я оказался на месте, где ты сейчас. Я знаю этот стыд, это одиночество,
          это ощущение, что что-то сломано — и никому не расскажешь.
        </p>
        <p className="sp-muted">
          Я не буду делать из этого протокол выживания. Это путь к тому, чтобы встретить
          себя — живого, настоящего. Твоё тело не враг. Оно просто не умеет по-другому. Пока.
        </p>
        <p className="sp-muted">
          30 дней. Один шаг за раз. Я рядом — через текст, практики и живой чат.
        </p>
      </div>
    ),
  },
  {
    tag: 'Про путь',
    title: 'Что тебя ждёт',
    audio: AUDIO.onboarding_path,
    audioLabel: 'Джаан · про путь',
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="sp-muted">
          Мы будем работать с тремя вещами одновременно: телом, дыханием и вниманием.
          Не по отдельности — вместе. Потому что ПЭ — это не «проблема снизу». Это
          разрыв между головой и телом.
        </p>
        <p className="sp-muted">
          Каждый день — теория, практика и короткий отчёт. Отчёты важны: они дают
          единственное честное зеркало — время. Всё остальное в сексуальности субъективно.
          Время — нет.
        </p>
        <p className="sp-muted" style={{ fontStyle: 'italic', opacity: 0.7 }}>
          «Управление — это не контроль. Контроль — это подавление. Управление — это направление потока.»
        </p>
      </div>
    ),
  },
  {
    tag: 'Установка',
    title: 'Установите приложение на экран «Домой»',
    audio: null,
    audioLabel: undefined,
    body: (
      <>
        <p className="sp-muted">
          Так курс будет всегда под рукой — один тап, без поиска вкладки. Установка
          бесплатна и не занимает места.
        </p>
        <p className="sp-muted">Дальше — инструкция под ваш телефон.</p>
      </>
    ),
  },
  {
    tag: 'iPhone / iPad',
    title: 'Safari',
    audio: null,
    audioLabel: undefined,
    body: (
      <ol className="sp-muted" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>Откройте сайт в Safari (не внутри других приложений).</li>
        <li>
          Нажмите «Поделиться» <strong>(квадрат со стрелкой вверх)</strong>.
        </li>
        <li>Выберите «На экран «Домой»».</li>
        <li>Подтвердите — иконка появится рядом с приложениями.</li>
      </ol>
    ),
  },
  {
    tag: 'Android',
    title: 'Chrome',
    audio: null,
    audioLabel: undefined,
    body: (
      <ol className="sp-muted" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
        <li>Откройте сайт в Google Chrome.</li>
        <li>
          Нажмите меню <strong>(три точки)</strong> в правом верхнем углу.
        </li>
        <li>Выберите «Установить приложение» или «Добавить на главный экран».</li>
        <li>Подтвердите — иконка появится на рабочем столе.</li>
      </ol>
    ),
  },
  {
    tag: 'Готово',
    title: 'Начнём с диагностики',
    audio: AUDIO.onboarding_before_diagnostics,
    audioLabel: 'Джаан · перед диагностикой',
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="sp-muted">
          Перед первым днём — короткая диагностика. Она помогает мне понять, где ты
          сейчас, и сделать путь точнее.
        </p>
        <p className="sp-muted">
          Отвечай честно. Здесь нет правильных ответов. Здесь нет осуждения.
        </p>
      </div>
    ),
  },
]

export function InstallOnboarding() {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const step = steps[i]

  function done() {
    setFlag(KEYS.installDone, true)
    navigate('/diagnostics/initial', { replace: true })
  }

  return (
    <div className="ff-flow-page">
      <FigmaFlowHeader
        right={
          <div className="ff-head-meta">
            <div className="ff-head-meta-cyan">
              {i + 1} / {steps.length}
            </div>
            <div className="ff-head-meta-muted">{step.tag}</div>
          </div>
        }
      />
      <div className="ff-flow-inner">
        <div className="ff-pill ff-pill-warm">{step.tag}</div>
        <h1 className="ff-install-title">{step.title}</h1>
        {'audio' in step && (
          <AudioPlayer src={step.audio} label={step.audioLabel} />
        )}
        <div className="ff-glass-card ff-install-body">{step.body}</div>
        <div className="ff-flow-actions">
          {i < steps.length - 1 ? (
            <button type="button" className="ff-btn-gradient" onClick={() => setI((x) => x + 1)}>
              <span>Далее</span>
              <IconChevronRight />
            </button>
          ) : (
            <button type="button" className="ff-btn-gradient" onClick={done}>
              <span>К диагностике</span>
              <IconChevronRight />
            </button>
          )}
          {i > 0 && (
            <button type="button" className="ff-btn-outline" onClick={() => setI((x) => x - 1)}>
              Назад
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
