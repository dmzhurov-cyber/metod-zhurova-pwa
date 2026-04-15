import type { ReactNode } from 'react'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { ThemeContext, type Theme } from './theme-context'
import { KEYS, getFlag, setFlag } from '../lib/storage'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (getFlag(KEYS.theme) ? 'light' : 'dark'))

  useEffect(() => {
    document.body.classList.toggle('sp-light', theme === 'light')
    setFlag(KEYS.theme, theme === 'light')
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
