import { useRef, useState } from 'react'
import type { PtiQuestion } from '../data/diagnostics'
import { FigmaFlowHeader } from './FigmaFlowHeader'
import { IconChevronRight } from './FigmaFlowIcons'

type Props = {
  questions: PtiQuestion[]
  onComplete: (result: { score: number; level: 'low' | 'moderate' | 'high' }) => void
  onBack?: () => void
}

/** PTI в визуальном слое Figma Make */
export function PtiWizard({ questions, onComplete, onBack }: Props) {
  const [idx, setIdx] = useState(0)
  const [weights, setWeights] = useState<Record<string, number>>({})
  const weightsRef = useRef<Record<string, number>>({})

  const q = questions[idx]
  const progress = (idx + 1) / questions.length

  function select(w: number) {
    if (!q) return
    const merged = { ...weightsRef.current, [q.id]: w }
    weightsRef.current = merged
    setWeights({ ...merged })
  }

  function finish() {
    const score = questions.reduce((s, qq) => s + (weightsRef.current[qq.id] ?? 0), 0)
    let level: 'low' | 'moderate' | 'high'
    if (score <= 5) level = 'low'
    else if (score <= 10) level = 'moderate'
    else level = 'high'
    onComplete({ score, level })
  }

  function next() {
    if (!q || weightsRef.current[q.id] === undefined) return
    if (idx + 1 >= questions.length) finish()
    else setIdx((i) => i + 1)
  }

  function prev() {
    if (idx === 0) {
      onBack?.()
      return
    }
    setIdx((i) => i - 1)
  }

  if (!q) return null

  return (
    <div className="ff-flow-page ff-diag-root">
      <FigmaFlowHeader
        right={
          <div className="ff-head-meta">
            <div className="ff-head-meta-cyan">
              Вопрос {idx + 1} из {questions.length}
            </div>
            <div className="ff-head-meta-muted">PTI</div>
          </div>
        }
      />
      <div className="ff-flow-inner">
        <div className="ff-pill">Тонус тазового дна</div>
        <h1 className="ff-install-title">Тест PTI</h1>
        <div className="ff-glass-card ff-diag-intro">
          <div className="ff-diag-daytag">PTI</div>
          <p className="ff-muted ff-diag-intro-text">
            Короткий опрос из {questions.length} вопросов. Результат влияет на безопасность упражнений. Это не медицинский
            диагноз.
          </p>
        </div>
        <p className="ff-diag-cat">
          Вопрос {idx + 1} из {questions.length}
        </p>
        <div className="ff-progress-track">
          <div className="ff-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="ff-glass-card ff-diag-question-card">
          <p className="ff-diag-q-title">
            {idx + 1}. {q.text}
          </p>
          <div className="ff-chip-stack">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                className={`sp-chip ff-chip-wide ${weights[q.id] === q.weights[i] ? 'selected' : ''}`}
                onClick={() => select(q.weights[i])}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="ff-diag-nav">
          <button type="button" className="ff-btn-outline ff-btn-inline" onClick={prev}>
            {idx === 0 ? 'К базовой диагностике' : 'Предыдущий'}
          </button>
          <button
            type="button"
            className="ff-btn-gradient ff-btn-inline-grow"
            onClick={next}
            disabled={weights[q.id] === undefined}
            style={{ opacity: weights[q.id] === undefined ? 0.45 : 1 }}
          >
            <span>{idx + 1 >= questions.length ? 'Завершить' : 'Далее'}</span>
            <IconChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}
