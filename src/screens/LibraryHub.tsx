import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { libraryContent } from '../course/courseModel'
import { TheoryHtml } from '../components/TheoryHtml'
import { useGame } from '../hooks/useGame'

/** SVG-схемы библиотеки лежат в `course-assets/schemes/` (единый стиль с днями курса). */
function librarySchemeAssetUrl(file: string) {
  return `${import.meta.env.BASE_URL}course-assets/schemes/${encodeURIComponent(file)}`
}

function SchemesGrid() {
  return (
    <div className="sp-stack">
      {libraryContent.schemes.map((s) => (
        <Link
          key={s.id}
          to={`/app/library/schemes/${encodeURIComponent(s.id)}`}
          className="sp-card"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 12, alignItems: 'flex-start' }}
        >
          <span style={{ fontSize: '1.5rem' }} aria-hidden>
            {s.icon}
          </span>
          <div>
            <strong>{s.title}</strong>
            <p className="sp-muted" style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
              {s.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function TheoryGrid() {
  const items = libraryContent.theory.filter((t) => !t.externalHtml)
  return (
    <div className="sp-stack">
      {items.map((t) => {
        const plain = t.content.replace(/<[^>]+>/g, '').trim()
        const excerpt = plain.length > 120 ? `${plain.slice(0, 120)}…` : plain
        return (
          <Link
            key={t.id}
            to={`/app/library/theory/${encodeURIComponent(t.id)}`}
            className="sp-card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 12, alignItems: 'flex-start' }}
          >
            <span style={{ fontSize: '1.5rem' }} aria-hidden>
              {t.icon}
            </span>
            <div>
              <strong>{t.title}</strong>
              <p className="sp-muted" style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
                {excerpt}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function BookTab() {
  const game = useGame()
  const bookItems = libraryContent.theory.filter((t) => t.externalHtml)

  return (
    <div className="sp-stack">
      <div className="sp-card">
        <strong style={{ fontSize: '1rem' }}>Тесты из книги</strong>
        <p className="sp-muted" style={{ marginTop: 8, marginBottom: 12, fontSize: '0.9rem' }}>
          Диагностики помогают понять твои стартовые позиции. Результаты сохраняются в Прогрессе.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/app/tests/pillars" style={{ textDecoration: 'none' }} className="sp-btn-ghost">
            Диагностика четырёх столпов {game.testResults.pillars ? '✓' : ''}
          </Link>
          <Link to="/app/tests/triggers" style={{ textDecoration: 'none' }} className="sp-btn-ghost">
            Карта триггеров {game.testResults.triggers ? '✓' : ''}
          </Link>
        </div>
      </div>
      {bookItems.map((t) => (
        <Link
          key={t.id}
          to={`/app/library/theory/${encodeURIComponent(t.id)}`}
          className="sp-card"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 12, alignItems: 'flex-start' }}
        >
          <span style={{ fontSize: '1.5rem' }} aria-hidden>
            {t.icon}
          </span>
          <div>
            <strong style={{ fontSize: '0.95rem' }}>{t.title.replace(/^BOOK-(?:FINAL|TRAINER-JAAN) — /, '')}</strong>
          </div>
        </Link>
      ))}
    </div>
  )
}

function LibraryHome() {
  const [tab, setTab] = useState<'schemes' | 'theory' | 'book'>('schemes')
  const navigate = useNavigate()

  return (
    <div>
      <button
        type="button"
        className="sp-btn-ghost"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 12, fontSize: '0.9rem' }}
        aria-label="Назад"
      >
        ← Назад
      </button>
      <h1 className="sp-display" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
        Библиотека
      </h1>
      <div className="library-tabs sp-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: 12 }}>
        {(
          [
            ['schemes', 'Схемы'],
            ['theory', 'Теория'],
            ['book', 'Книга'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`sp-chip ${tab === id ? 'selected' : ''}`}
            onClick={() => setTab(id)}
            style={{ flex: '1 1 auto', minWidth: 80 }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'schemes' && <SchemesGrid />}
      {tab === 'theory' && <TheoryGrid />}
      {tab === 'book' && <BookTab />}
    </div>
  )
}

export function TheoryArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = libraryContent.theory.find((t) => t.id === id)
  const [externalBody, setExternalBody] = useState<string | null>(null)
  const [externalErr, setExternalErr] = useState<string | null>(null)

  useEffect(() => {
    if (!item?.externalHtml) {
      setExternalBody(null)
      setExternalErr(null)
      return
    }
    const url = `${import.meta.env.BASE_URL}${item.externalHtml}`
    let cancelled = false
    setExternalBody(null)
    setExternalErr(null)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.text()
      })
      .then((t) => {
        if (!cancelled) setExternalBody(t)
      })
      .catch(() => {
        if (!cancelled) setExternalErr('Не удалось загрузить главу. Запустите node scripts/extract-bookv1-to-notion-content.mjs в корне Bookv2.')
      })
    return () => {
      cancelled = true
    }
  }, [item])

  if (!item) {
    return (
      <div>
        <p>Статья не найдена.</p>
        <button type="button" className="sp-btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        className="sp-muted"
        onClick={() => navigate(-1)}
        style={{ display: 'inline-block', marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: '1rem' }}
      >
        ← Назад
      </button>
      <h1 className="sp-display" style={{ fontSize: '1.2rem', marginBottom: 12 }}>
        {item.icon} {item.title}
      </h1>
      <div className="sp-card">
        {item.externalHtml ? (
          externalErr ? (
            <p className="sp-muted">{externalErr}</p>
          ) : externalBody ? (
            <div className="course-theory-html" dangerouslySetInnerHTML={{ __html: externalBody }} />
          ) : (
            <p className="sp-muted">Загрузка…</p>
          )
        ) : (
          <TheoryHtml html={item.content} />
        )}
      </div>
    </div>
  )
}

export function SchemeArticle() {
  const { schemeId } = useParams()
  const navigate = useNavigate()
  const s = libraryContent.schemes.find((x) => x.id === schemeId)
  if (!s) {
    return (
      <div>
        <p>Схема не найдена.</p>
        <button type="button" className="sp-btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
      </div>
    )
  }
  const theory = libraryContent.theory.find((t) => t.id === s.theoryId)

  return (
    <div>
      <button
        type="button"
        className="sp-muted"
        onClick={() => navigate(-1)}
        style={{ display: 'inline-block', marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: '1rem' }}
      >
        ← Назад
      </button>
      <h1 className="sp-display" style={{ fontSize: '1.2rem', marginBottom: 12 }}>
        {s.icon} {s.title}
      </h1>
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <p className="sp-muted">{s.desc}</p>
        <div
          className="day-scheme-svg-wrap"
          style={{ marginTop: 12, cursor: 'zoom-in' }}
          onClick={() => {
            const el = document.querySelector('.day-scheme-svg-wrap img') as HTMLElement | null
            if (el?.requestFullscreen) el.requestFullscreen()
          }}
          title="Нажмите для просмотра на весь экран"
        >
          <img src={librarySchemeAssetUrl(s.file)} alt={s.title} className="day-scheme-svg" loading="lazy" />
        </div>
      </div>
      {theory && (
        <>
          <h2 className="sp-display" style={{ fontSize: '1rem', marginBottom: 8 }}>
            Теория по теме
          </h2>
          <div className="sp-card">
            <TheoryHtml html={theory.content} />
          </div>
        </>
      )}
    </div>
  )
}

export function LibraryRoutes() {
  return (
    <Routes>
      <Route index element={<LibraryHome />} />
      <Route path="theory/:id" element={<TheoryArticle />} />
      <Route path="schemes/:schemeId" element={<SchemeArticle />} />
    </Routes>
  )
}
