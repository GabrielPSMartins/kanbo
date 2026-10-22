import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { storage } from '@/lib/storage'

export type Theme = 'dark' | 'light'
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }

const ThemeContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'kanbo:theme'

/** Tema escuro por padrão. O index.html aplica a classe antes do primeiro paint. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (storage.get(STORAGE_KEY) === 'light' ? 'light' : 'dark'))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    storage.set(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme fora do ThemeProvider')
  return ctx
}
