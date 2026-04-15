import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiagnosticWizard } from '../components/DiagnosticWizard'
import { controlCheckpointQuestions } from '../data/diagnostics'
import { CHECKPOINT_DAYS } from '../course/courseModel'
import { saveCheckpointResult } from '../lib/courseProgress'
import { completeCheckpointFlow } from '../lib/gameState'
import { showToast } from '../lib/toast'

const LEVELS = ['Есть куда расти', 'Движение началось', 'Тело отвечает', 'Ты уже другой'] as const

function averageToLevel(avg: number): string {
  if (avg < 2) return LEVELS[0]
  if (avg < 3) return LEVELS[1]
  if (avg < 4) return LEVELS[2]
  return LEVELS[3]
}

export function CheckpointScreen() {
  const { day: d } = useParams()
  const day = Number(d) as 7 | 14 | 21 | 30
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState<{ avg: number; level: string } | null>(null)

  const valid = useMemo(() => (CHECKPOINT_DAYS as readonly number[]).includes(day), [day])

  if (!valid || !Number.isFinite(day)) {
    return (
      <div>
        <p className="sp-muted">Контрольная диагностика доступна для дней 7, 14, 21 и 30.</p>
        <Link to="/app/progress">К прогрессу</Link>
      </div>
    )
  }

  const title =
    day === 7
      ? 'Первая неделя позади'
      : day === 14
        ? 'Две недели пройдено'
        : day === 21
          ? 'Три недели в пути'
          : 'Финал. Ты дошёл.'

  if (done && summary) {
    return (
      <div>
        <div className="sp-card" style={{ marginBottom: 16 }}>
          <h2 className="sp-display" style={{ fontSize: '1.1rem' }}>
            Результат
          </h2>
          <p className="sp-muted" style={{ marginBottom: 8 }}>{summary.level}</p>
          <p className="sp-muted" style={{ fontSize: '0.85rem' }}>Средний балл: {summary.avg.toFixed(1)} / 5</p>
        </div>
        <Link to={`/app/day/${day}`} className="sp-btn-primary" style={{ textDecoration: 'none' }}>
          Вернуться к дню {day}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <DiagnosticWizard
        title={title}
        subtitle="Отвечай честно — не как хочется, а как есть. Это твоё зеркало, не экзамен."
        dayLabel={String(day)}
        questions={controlCheckpointQuestions}
        onComplete={(answers) => {
          const vals = controlCheckpointQuestions.map((q) => {
            const idx = answers[q.id]
            return idx === undefined ? 0 : idx + 1
          })
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length
          const level = averageToLevel(avg)
          const row = {
            day,
            type: 'basic' as const,
            answers: Object.fromEntries(vals.map((v, i) => [i, v])),
            totalAverage: avg,
            resultLevel: level,
            timestamp: new Date().toISOString(),
          }
          saveCheckpointResult(row)
          completeCheckpointFlow(day)
          showToast('Зафиксировано. XP начислен.')
          setSummary({ avg, level })
          setDone(true)
        }}
        onBack={() => navigate(-1)}
      />
    </div>
  )
}
