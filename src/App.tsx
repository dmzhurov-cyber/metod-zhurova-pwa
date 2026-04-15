import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { UpdatePrompt } from './components/UpdatePrompt'
import { AppShell } from './layouts/AppShell'
import { KEYS, getFlag } from './lib/storage'
import { getSupabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { InstallOnboarding } from './screens/InstallOnboarding'
import { InitialDiagnostics } from './screens/InitialDiagnostics'
import { Home } from './screens/Home'
import { LibraryRoutes } from './screens/LibraryHub'
import { Progress } from './screens/Progress'
import { Profile } from './screens/Profile'
import { AiTrainer } from './screens/AiTrainer'
import { DayScreen } from './screens/DayScreen'
import { CheckpointScreen } from './screens/CheckpointScreen'
import { IntroDayScreen } from './screens/IntroDayScreen'
import { SkillTreeScreen } from './screens/SkillTreeScreen'
import { BookTestPillarsScreen } from './screens/BookTestPillarsScreen'
import { BookTestTriggersScreen } from './screens/BookTestTriggersScreen'
import { DayZeroInfoScreen } from './screens/DayZeroInfoScreen'
import { DayAccessGate } from './components/DayAccessGate'
import { VersionGateBanner } from './components/VersionGateBanner'

function Gate() {
  const okInstall = getFlag(KEYS.installDone)
  const okDiag = getFlag(KEYS.initialDiagnostics)

  if (!okInstall) return <Navigate to="/install" replace />
  if (!okDiag) return <Navigate to="/diagnostics/initial" replace />
  return <Navigate to="/app/home" replace />
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      // Supabase не настроен — пропускаем авторизацию (dev mode)
      setAuthChecked(true)
      setIsAuthed(true)
      return
    }

    sb.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      setAuthChecked(true)
    })

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!authChecked) return <div style={{ minHeight: '100dvh', background: '#0a0f14' }} />

  if (!isAuthed) return <AuthScreen onAuth={() => setIsAuthed(true)} />

  return (
    <>
      <VersionGateBanner />
      <UpdatePrompt />
      <Routes>
        <Route path="/" element={<Gate />} />
        <Route path="/install" element={<InstallOnboarding />} />
        <Route
          path="/diagnostics/initial"
          element={
            <div className="sp-main" style={{ maxWidth: 520, margin: '0 auto' }}>
              <InitialDiagnostics />
            </div>
          }
        />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="library/*" element={<LibraryRoutes />} />
          <Route
            path="day/:day"
            element={
              <DayAccessGate>
                <DayScreen />
              </DayAccessGate>
            }
          />
          <Route
            path="checkpoint/:day"
            element={
              <DayAccessGate>
                <CheckpointScreen />
              </DayAccessGate>
            }
          />
          <Route path="intro/:slug" element={<IntroDayScreen />} />
          <Route path="skill-tree" element={<SkillTreeScreen />} />
          <Route path="tests/pillars" element={<BookTestPillarsScreen />} />
          <Route path="tests/triggers" element={<BookTestTriggersScreen />} />
          <Route path="day-zero-info" element={<DayZeroInfoScreen />} />
          <Route path="progress" element={<Progress />} />
          <Route path="ai" element={<AiTrainer />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
