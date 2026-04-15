import { useMemo, useRef, useState } from 'react'
import type { DiagnosticQuestion } from '../data/diagnostics'
import { categoryTitle } from '../data/diagnostics'
import { FigmaFlowHeader } from './FigmaFlowHeader'
import { IconChevronRight } from './FigmaFlowIcons'

type Props = {
  title: string
  subtitle?: string
  dayLabel: string
  questions: DiagnosticQuestion[]
  onComplete: (answers: Record<string, number>) => void
  onBack?: () => void
}

/** Диагностика в визуальном слое Figma Make */
export function DiagnosticWizard({
  title,
  subtitle,
  dayLabel,
  questions,
  onComplete,
  onBack,
}: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const answersRef = useRef<Record<string, number>>({})

  const q = questions[idx]
  const progress = (idx + 1) / questions.length

  const catLabel = useMemo(() => (q ? categoryTitle(q.category) : ''), [q])

  function select(optionIndex: number) {
    if (!q) return
    const merged = { ...answersRef.current, [q.id]: optionIndex }
    answersRef.current = merged
    setAnswers({ ...merged })
  }

  function next() {
    if (!q) return
    const val = answersRef.current[q.id]
    if (val === undefined) return
    const merged = { ...answersRef.current, [q.id]: val }
    if (idx + 1 >= questions.length) {
      onComplete(merged)
      return
    }
    setIdx((i) => i + 1)
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
            <div className="ff-head-meta-muted">Диагностика</div>
          </div>
        }
      />
      <div className="ff-flow-inner">
        <div className="ff-pill">Расширенная база</div>
        <h1 className="ff-install-title">{title}</h1>
        <div className="ff-glass-card ff-diag-intro">
          <div className="ff-diag-daytag">{dayLabel}</div>
          <p className="ff-muted ff-diag-intro-text">{subtitle ?? 'Ответьте честно — это влияет на персональные подсказки.'}</p>
        </div>
        <p className="ff-diag-cat">
          {catLabel} · вопрос {idx + 1} из {questions.length}
        </p>
        <div className="ff-progress-track">
          <div className="ff-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="ff-glass-card ff-diag-question-card">
          <p className="ff-diag-q-title">
            {idx + 1}. {q.question}
          </p>
          <div className="ff-chip-stack">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                className={`sp-chip ff-chip-wide ${answers[q.id] === i ? 'selected' : ''}`}
                onClick={() => select(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="ff-diag-nav">
          <button type="button" className="ff-btn-outline ff-btn-inline" onClick={prev}>
            {idx === 0 ? 'Назад' : 'Предыдущий'}
          </button>
          <button
            type="button"
            className="ff-btn-gradient ff-btn-inline-grow"
            onClick={next}
            disabled={answers[q.id] === undefined}
            style={{ opacity: answers[q.id] === undefined ? 0.45 : 1 }}
          >
            <span>{idx + 1 >= questions.length ? 'Дальше: PTI' : 'Далее'}</span>
            <IconChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}
