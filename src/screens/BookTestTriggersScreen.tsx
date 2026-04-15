import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { triggersTestQuestions } from '../data/bookDiagnosticTests'
import { loadGame, setTestResult } from '../lib/gameState'

export function BookTestTriggersScreen() {
  const [idx, setIdx] = useState(0)
  const [single, setSingle] = useState<Record<string, number>>({})
  const [multi, setMulti] = useState<Record<string, number[]>>({})
  const [done, setDone] = useState(() => loadGame().testResults.triggers === true)

  const q = triggersTestQuestions[idx]
  const progress = (idx + 1) / triggersTestQuestions.length

  const canNext = useMemo(() => {
    if (!q) return false
    if (q.kind === 'single') return single[q.id] !== undefined
    return (multi[q.id]?.length ?? 0) > 0
  }, [q, single, multi])

  function toggleMulti(id: string, optIdx: number) {
    const cur = multi[id] ?? []
    const has = cur.includes(optIdx)
    const next = has ? cur.filter((x) => x !== optIdx) : [...cur, optIdx]
    setMulti({ ...multi, [id]: next })
  }

  function next() {
    if (!q || !canNext) return
    if (idx + 1 >= triggersTestQuestions.length) {
      setTestResult(loadGame(), 'triggers', true)
      setDone(true)
      return
    }
    setIdx((i) => i + 1)
  }

  function prev() {
    setIdx((i) => Math.max(0, i - 1))
  }

  if (done) {
    return (
      <div>
        <div className="sp-card" style={{ marginBottom: 16 }}>
          <h2 className="sp-display" style={{ fontSize: '1.1rem' }}>
            Карта триггеров
          </h2>
          <p className="sp-muted" style={{ marginBottom: 12 }}>Результат сохранён в разделе «Мои тесты» → Прогресс.</p>
          <button
            type="button"
            className="sp-btn-ghost"
            onClick={() => { setDone(false); setIdx(0); setSingle({}); setMulti({}) }}
            style={{ display: 'inline-block' }}
          >
            Пройти повторно
          </button>
        </div>
        <Link to="/app/progress" className="sp-btn-primary" style={{ textDecoration: 'none' }}>
          Мои результаты
        </Link>
      </div>
    )
  }

  if (!q) return null

  return (
    <div>
      <p className="sp-muted" style={{ marginBottom: 12 }}>
        <Link to="/app/library">Библиотека</Link>
      </p>
      <h1 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Карта триггеров</h1>
      <div className="sp-card" style={{ marginBottom: 16 }}>
        <div className="sp-hero-num">Книга</div>
        <div className="sp-hero-sub">Выявление факторов, ускоряющих эякуляцию</div>
      </div>
      <div className="sp-muted" style={{ marginBottom: 8 }}>
        Вопрос {idx + 1} из {triggersTestQuestions.length}
      </div>
      <div className="sp-progress-bar">
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="sp-card">
        <p className="sp-question-title">
          {idx + 1}. {q.text}
        </p>
        {q.kind === 'single' && (
          <div className="sp-stack">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                className={`sp-chip ${single[q.id] === i ? 'selected' : ''}`}
                onClick={() => setSingle({ ...single, [q.id]: i })}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {q.kind === 'multi' && (
          <div className="sp-stack">
            {q.options.map((opt, i) => {
              const on = (multi[q.id] ?? []).includes(i)
              return (
                <button
                  key={opt}
                  type="button"
                  className={`sp-chip ${on ? 'selected' : ''}`}
                  onClick={() => toggleMulti(q.id, i)}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}
        <p className="sp-muted" style={{ marginTop: 12, fontSize: '0.85rem' }}>
          {q.kind === 'multi' ? 'Можно выбрать несколько вариантов.' : 'Выберите один вариант.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="button" className="sp-btn-ghost" onClick={prev}>
          {idx === 0 ? '—' : 'Назад'}
        </button>
        <button type="button" className="sp-btn-primary" disabled={!canNext} onClick={next}>
          {idx + 1 >= triggersTestQuestions.length ? 'Готово' : 'Далее'}
        </button>
      </div>
    </div>
  )
}
