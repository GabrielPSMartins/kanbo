import { Columns3, Gauge, Layers, ListTodo, Moon, Plus, Settings, Sun, Timer } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useIssues } from '@/api/hooks/issues'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useOpenIssue } from '@/hooks/use-open-issue'
import { useCurrentProject } from '@/providers/project'
import { useTheme } from '@/providers/theme'
import { useUI } from '@/providers/ui'
import { StatusIcon, TypeIcon } from './issue/badges'

const PAGES = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/backlog', label: 'Backlog', icon: ListTodo },
  { to: '/board', label: 'Board', icon: Columns3 },
  { to: '/sprints', label: 'Sprints', icon: Timer },
  { to: '/epics', label: 'Epics', icon: Layers },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

/** Ctrl+K: busca issues por key/título, navega entre telas e executa ações. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openCreateIssue } = useUI()
  const project = useCurrentProject()
  const { data: issues = [] } = useIssues(paletteOpen ? project.id : undefined)
  const navigate = useNavigate()
  const openIssue = useOpenIssue()
  const { theme, toggle } = useTheme()

  const run = (fn: () => void) => {
    setPaletteOpen(false)
    fn()
  }

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title="Busca"
      description="Buscar issues e comandos"
    >
      <Command>
        <CommandInput placeholder="Buscar issues, telas ou ações…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => run(() => openCreateIssue())}>
              <Plus /> Nova issue
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(toggle)}>
              {theme === 'dark' ? <Sun /> : <Moon />} Alternar tema
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ir para">
            {PAGES.map(({ to, label, icon: Icon }) => (
              <CommandItem key={to} onSelect={() => run(() => navigate(to))}>
                <Icon /> {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Issues">
            {issues.map((i) => (
              <CommandItem key={i.id} value={`${i.key} ${i.title}`} onSelect={() => run(() => openIssue(i.key))}>
                <StatusIcon status={i.status} />
                <TypeIcon type={i.type} />
                <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{i.key}</span>
                <span className="truncate">{i.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
