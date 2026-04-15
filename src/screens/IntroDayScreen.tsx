import { Link, useParams } from 'react-router-dom'
import { INTRO_DAYS } from '../course/introDays'
import { TheoryHtml } from '../components/TheoryHtml'
import { AudioPlayer } from '../components/AudioPlayer'
import { AUDIO } from '../lib/audioAssets'

const INTRO_AUDIO_KEYS: Record<string, string | null> = {
  '1': AUDIO.intro_1,
  '2': AUDIO.intro_2,
  '3': AUDIO.intro_3,
}

export function IntroDayScreen() {
  const { slug } = useParams()
  const entry = INTRO_DAYS.find((x) => x.slug === slug)
  const idx = INTRO_DAYS.findIndex((x) => x.slug === slug)
  if (!entry || idx < 0) {
    return (
      <div>
        <p className="sp-muted">Страница не найдена.</p>
        <Link to="/app/home">На главную</Link>
      </div>
    )
  }
  const prev = idx > 0 ? INTRO_DAYS[idx - 1] : null
  const next = idx < INTRO_DAYS.length - 1 ? INTRO_DAYS[idx + 1] : null
  const audioSrc = slug ? (INTRO_AUDIO_KEYS[slug] ?? null) : null

  return (
    <div>
      <p className="sp-muted" style={{ marginBottom: 12 }}>
        <Link to="/app/home">Главная</Link>
        {' · '}
        Вводный модуль {idx + 1} / {INTRO_DAYS.length}
      </p>
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <div className="sp-hero-num">i{idx + 1}</div>
        <div className="sp-hero-sub" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
          {entry.title}
        </div>
        <AudioPlayer
          src={audioSrc}
          label={`Джаан · ${entry.title}`}
        />
      </div>
      <div className="sp-card course-theory-html">
        <TheoryHtml html={entry.theory} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
        {prev && (
          <Link to={`/app/intro/${prev.slug}`} className="sp-btn-ghost" style={{ textDecoration: 'none' }}>
            ← Назад
          </Link>
        )}
        {next ? (
          <Link to={`/app/intro/${next.slug}`} className="sp-btn-primary" style={{ textDecoration: 'none' }}>
            Далее →
          </Link>
        ) : (
          <Link to="/app/home" className="sp-btn-primary" style={{ textDecoration: 'none' }}>
            К главной
          </Link>
        )}
      </div>
    </div>
  )
}
