import { Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/kbd'
import { useProjectContext } from '@/providers/project'
import { useTheme } from '@/providers/theme'
import { useUI } from '@/providers/ui'
import { ProjectAvatar } from './logo'

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  backlog: 'Backlog',
  board: 'Board',
  sprints: 'Sprints',
  epics: 'Epics',
  settings: 'Configurações',
}

export function Topbar({ onMenu, crumb }: { onMenu: () => void; crumb?: ReactNode }) {
  const { pathname } = useLocation()
  const { project } = useProjectContext()
  const { openCreateIssue, setPaletteOpen } = useUI()
  const { theme, toggle } = useTheme()
  const section = TITLES[pathname.split('/')[1] ?? ''] ?? ''

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-5">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onMenu} aria-label="Abrir menu">
        <Menu />
      </Button>
      <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        {project && (
          <>
            <ProjectAvatar project={project} className="size-4 text-[9px]" />
            <span className="hidden text-muted-foreground sm:inline">{project.name}</span>
            <span className="hidden text-muted-foreground/60 sm:inline">/</span>
          </>
        )}
        <span className="truncate font-medium">{section}</span>
        {crumb}
      </nav>
      <div className="flex-1" />
      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-card px-2.5 text-muted-foreground transition-colors hover:border-ring/40 sm:flex"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Buscar…</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <Button variant="ghost" size="icon-sm" className="sm:hidden" onClick={() => setPaletteOpen(true)} aria-label="Buscar">
        <Search />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
      <Button size="sm" onClick={() => openCreateIssue()} disabled={!project}>
        <Plus />
        <span className="hidden sm:inline">Nova issue</span>
        <Kbd className="hidden border-white/20 bg-white/10 text-primary-foreground sm:inline-flex">C</Kbd>
      </Button>
    </header>
  )
}
