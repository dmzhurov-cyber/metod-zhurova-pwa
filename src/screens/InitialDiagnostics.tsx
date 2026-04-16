import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DiagnosticWizard } from '../components/DiagnosticWizard'
import { PtiWizard } from '../components/PtiWizard'
import { extendedBaselineQuestions, ptiQuestions } from '../data/diagnostics'
import { syncInitialDiagnosticsPayload } from '../lib/reportSync'
import { KEYS, setFlag, setJSON } from '../lib/storage'
import { enqueueSync } from '../lib/syncQueue'

type Phase = 'extended' | 'pti'

export function InitialDiagnostics() {
  const [phase, setPhase] = useState<Phase>('extended')
  const [extendedAnswers, setExtendedAnswers] = useState<Record<string, number> | null>(null)
  const navigate = useNavigate()

  if (phase === 'extended') {
    return (
      <div className="ff-diag-page">
        <DiagnosticWizard
          title="Расширенная диагностика"
          subtitle="Комплексная оценка перед стартом курса. 19 вопросов по четырём областям."
          dayLabel="01"
          questions={extendedBaselineQuestions}
          onComplete={(answers) => {
            setExtendedAnswers(answers)
            setPhase('pti')
          }}
          onBack={() => navigate('/install', { replace: true })}
        />
      </div>
    )
  }

  if (phase === 'pti') {
    return (
      <div className="ff-diag-page">
        <PtiWizard
          questions={ptiQuestions}
          onComplete={({ score, level }) => {
            const payload = {
              extended: extendedAnswers,
              pti: { score, level, at: new Date().toISOString() },
            }
            setJSON(KEYS.profileInitial, payload)
            setFlag(KEYS.initialDiagnostics, true)
            enqueueSync({
              type: 'diagnostic',
              payload: { kind: 'initial', ...payload },
            })
            void syncInitialDiagnosticsPayload(payload)
            navigate('/app/home', { replace: true })
          }}
          onBack={() => setPhase('extended')}
        />
      </div>
    )
  }

  return null
}
