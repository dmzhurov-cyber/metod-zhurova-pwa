import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { GameBootstrap } from '../components/GameBootstrap'
import { ToastHost } from '../components/ToastHost'
import { ThemeProvider } from '../context/ThemeProvider'

export function AppShell() {
  return (
    <ThemeProvider>
      <GameBootstrap />
      <ToastHost />
      <div className="sp-app-shell">
        <main className="sp-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  )
}
