import { Check, ChevronsUpDown, Columns3, Gauge, Layers, ListTodo, Plus, Settings, Timer } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useProjectContext } from '@/providers/project'
import { CreateProjectDialog } from './create-project-dialog'
import { Logo, ProjectAvatar } from './logo'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/backlog', label: 'Backlog', icon: ListTodo },
  { to: '/board', label: 'Board', icon: Columns3 },
  { to: '/sprints', label: 'Sprints', icon: Timer },
  { to: '/epics', label: 'Epics', icon: Layers },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { project, projects, setProjectId } = useProjectContext()
  const [creating, setCreating] = useState(false)

  return (
    <aside className="flex h-full w-60 flex-col gap-4 border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground">
      <div className="px-2">
        <Logo />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-sidebar-border px-2 py-1.5 text-left hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
          {project ? <ProjectAvatar project={project} /> : null}
          <span className="flex-1 truncate font-medium">{project?.name ?? 'Sem projeto'}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Projetos</DropdownMenuLabel>
          {projects.map((p) => (
            <DropdownMenuItem key={p.id} onSelect={() => setProjectId(p.id)}>
              <ProjectAvatar project={p} />
              <span className="flex-1 truncate">{p.name}</span>
              {p.id === project?.id && <Check className="size-3.5" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus /> Novo projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => (
          <SidebarLink key={item.to} {...item} onClick={onNavigate} />
        ))}
        <div className="flex-1" />
        <SidebarLink to="/settings" label="Configurações" icon={Settings} onClick={onNavigate} />
      </nav>

      <CreateProjectDialog open={creating} onOpenChange={setCreating} />
    </aside>
  )
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string
  label: string
  icon: typeof Gauge
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}
