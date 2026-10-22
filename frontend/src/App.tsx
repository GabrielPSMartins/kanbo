import { Navigate, Route, Routes, useLocation, useMatch } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { IssueDrawer } from '@/components/issue/issue-drawer'
import type { DrawerState } from '@/hooks/use-open-issue'
import BacklogPage from '@/pages/backlog'
import BoardPage from '@/pages/board'
import DashboardPage from '@/pages/dashboard'
import EpicsPage from '@/pages/epics'
import NotFoundPage from '@/pages/not-found'
import SettingsPage from '@/pages/settings'
import SprintDetailPage from '@/pages/sprint-detail'
import SprintsPage from '@/pages/sprints'

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
