import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DiagnosticWizard } from '../components/DiagnosticWizard'
import { pillarsTestQuestions } from '../data/bookDiagnosticTests'
import { loadGame, setTestResult } from '../lib/gameState'

export function BookTestPillarsScreen() {
  const navigate = useNavigate()
  const [done, setDone] = useState(() => loadGame().testResults.pillars === true)

  if (done) {
    return (
      <div>
        <div className="sp-card" style={{ marginBottom: 16 }}>
          <h2 className="sp-display" style={{ fontSize: '1.1rem' }}>
            Диагностика столпов
          </h2>
          <p className="sp-muted" style={{ marginBottom: 12 }}>Результат сохранён в разделе «Мои тесты» → Прогресс.</p>
          <button
            type="button"
            className="sp-btn-ghost"
            onClick={() => setDone(false)}
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

  return (
    <div>
      <p className="sp-muted" style={{ marginBottom: 12 }}>
        <Link to="/app/library">Библиотека</Link>
      </p>
      <DiagnosticWizard
        title="Диагностика четырёх столпов"
        subtitle="Оценка базовых навыков контроля. 10 вопросов."
        dayLabel="Книга"
        questions={pillarsTestQuestions}
        onComplete={() => {
          setTestResult(loadGame(), 'pillars', true)
          setDone(true)
        }}
        onBack={() => navigate('/app/library')}
      />
    </div>
  )
}
