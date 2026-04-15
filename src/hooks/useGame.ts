import { useEffect, useState } from 'react'
import { loadGame, type GameState } from '../lib/gameState'

export function useGame(): GameState {
  const [rev, setRev] = useState(0)
  useEffect(() => {
    const h = () => setRev((x) => x + 1)
    window.addEventListener('pwa_v2_game_update', h)
    return () => window.removeEventListener('pwa_v2_game_update', h)
  }, [])
  void rev
  return loadGame()
}
