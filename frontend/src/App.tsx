import { lazy } from 'react'
import { Navigate, Route, Routes, useLocation, useMatch } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { IssueDrawer } from '@/components/issue/issue-drawer'
import type { DrawerState } from '@/hooks/use-open-issue'
import NotFoundPage from '@/pages/not-found'

// páginas carregadas sob demanda (Recharts, dnd-kit e markdown ficam fora do bundle inicial)
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const BacklogPage = lazy(() => import('@/pages/backlog'))
const BoardPage = lazy(() => import('@/pages/board'))
const SprintsPage = lazy(() => import('@/pages/sprints'))
const SprintDetailPage = lazy(() => import('@/pages/sprint-detail'))
const EpicsPage = lazy(() => import('@/pages/epics'))
const SettingsPage = lazy(() => import('@/pages/settings'))

export default function App() {
  const location = useLocation()
  const issueMatch = useMatch('/issues/:key')
  // Com o drawer aberto, a tela de fundo é a de origem; acessando a URL direto, o Board.
  const background = (location.state as DrawerState | null)?.background
  const pageLocation = issueMatch ? (background ?? '/board') : location

  return (
    <>
      <Routes location={pageLocation}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="sprints" element={<SprintsPage />} />
          <Route path="sprints/:sprintId" element={<SprintDetailPage />} />
          <Route path="epics" element={<EpicsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {issueMatch?.params.key && <IssueDrawer issueKey={issueMatch.params.key} />}
    </>
  )
}
