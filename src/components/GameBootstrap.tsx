import { useEffect, useRef } from 'react'
import { onAppOpenForDailyLogin, loadGame, saveGame } from '../lib/gameState'

/** Ежедневный вход и сброс дейликов — как checkAndUpdateStreak + checkDailyReset в legacy */
export function GameBootstrap() {
  const once = useRef(false)
  useEffect(() => {
    if (once.current) return
    once.current = true
    const g = onAppOpenForDailyLogin(loadGame())
    saveGame(g)
  }, [])
  return null
}
