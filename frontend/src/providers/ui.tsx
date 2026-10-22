import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { IssueCreate } from '@/api/client'

export type CreateIssueDefaults = Partial<IssueCreate>

type Ctx = {
  createIssue: CreateIssueDefaults | null
  openCreateIssue: (defaults?: CreateIssueDefaults) => void
  closeCreateIssue: () => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

const UIContext = createContext<Ctx | null>(null)

/** Estado global de modais (nova issue, command palette) acionados por atalhos de qualquer tela. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [createIssue, setCreateIssue] = useState<CreateIssueDefaults | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openCreateIssue = useCallback((defaults: CreateIssueDefaults = {}) => setCreateIssue(defaults), [])
  const closeCreateIssue = useCallback(() => setCreateIssue(null), [])

  const value = useMemo(
    () => ({ createIssue, openCreateIssue, closeCreateIssue, paletteOpen, setPaletteOpen }),
    [createIssue, openCreateIssue, closeCreateIssue, paletteOpen],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI fora do UIProvider')
  return ctx
}
