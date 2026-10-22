import { useCallback } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'

export type DrawerState = { background?: Location }

/** Abre o drawer da issue mantendo a tela atual ao fundo (`/issues/TCC-12`). */
export function useOpenIssue() {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(
    (key: string) => {
      const state = location.state as DrawerState | null
      const background = state?.background ?? location
      navigate(`/issues/${key}`, { state: { background } satisfies DrawerState })
    },
    [navigate, location],
  )
}
