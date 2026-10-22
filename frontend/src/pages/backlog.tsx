import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronRight, MoreHorizontal, Pencil, Play, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Issue, Sprint } from '@/api/client'
import { useIssues, useMoveIssue } from '@/api/hooks/issues'
import { useEpics } from '@/api/hooks/meta'
import { useSprintMutations, useSprints } from '@/api/hooks/sprints'
import { InlineCreate } from '@/components/issue/inline-create'
import { IssueRowContent, SortableIssueRow } from '@/components/issue/issue-row'
import { PageHeader } from '@/components/page'
import { CompleteSprintDialog } from '@/components/sprint/complete-sprint-dialog'
import { SprintDialog } from '@/components/sprint/sprint-dialog'
import { StartSprintDialog } from '@/components/sprint/start-sprint-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { positionBetween, useIssueDnd, type Containers } from '@/hooks/use-issue-dnd'
import { fmtRange } from '@/lib/dates'
import { storage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useCurrentProject } from '@/providers/project'

const BACKLOG = 'backlog'
const sprintContainer = (id: number) => `sprint:${id}`
const containerSprintId = (c: string) => (c === BACKLOG ? null : Number(c.split(':')[1]))
const COLLAPSED_KEY = 'kanbo:backlog:collapsed'

export default function BacklogPage() {
  const project = useCurrentProject()
  const { data: issues, isLoading } = useIssues(project.id)
  const { data: sprints = [], isLoading: loadingSprints } = useSprints(project.id)
  const { data: epics = [] } = useEpics(project.id)
  const move = useMoveIssue(project.id)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<string[]>(() => JSON.parse(storage.get(COLLAPSED_KEY) ?? '[]'))
  const [sprintDialog, setSprintDialog] = useState<{ open: boolean; sprint?: Sprint }>({ open: false })
  const [starting, setStarting] = useState<Sprint | null>(null)
  const [completing, setCompleting] = useState<Sprint | null>(null)
  const [deleting, setDeleting] = useState<Sprint | null>(null)
  const { remove } = useSprintMutations(project.id)

  const openSprints = sprints.filter((s) => s.status !== 'closed')
  const hasActive = openSprints.some((s) => s.status === 'active')
  const epicById = useMemo(() => new Map(epics.map((e) => [e.id, e])), [epics])

  const containers = useMemo<Containers>(() => {
    const q = query.trim().toLowerCase()
    const match = (i: Issue) => !q || i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    const result: Containers = { [BACKLOG]: [] }
    openSprints.forEach((s) => (result[sprintContainer(s.id)] = []))
    for (const issue of issues ?? []) {
      const key = issue.sprint_id == null ? BACKLOG : sprintContainer(issue.sprint_id)
      if (key in result && match(issue)) result[key]!.push(issue)
    }
    return result
  }, [issues, openSprints, query])

  const dnd = useIssueDnd(containers, ({ issue, container, fromContainer, before, after }) => {
    const sprintId = containerSprintId(container)
    const changedSection = container !== fromContainer
    let status = issue.status
    if (changedSection && sprintId == null && status !== 'done') status = 'backlog'
    if (changedSection && sprintId != null && status === 'backlog') status = 'todo'
    move.mutate({
      issue,
      body: {
        ...(changedSection && { sprint_id: sprintId }),
        before_id: before?.id ?? null,
        after_id: after?.id ?? null,
      },
      optimistic: { sprint_id: sprintId, status, position: positionBetween(before, after) },
    })
  })

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      storage.set(COLLAPSED_KEY, JSON.stringify(next))
      return next
    })

  if (isLoading || loadingSprints) return <BacklogSkeleton />

  const renderList = (container: string, defaults: { sprint_id: number | null }, emptyText: ReactNode) => (
    <DroppableList id={container} isEmpty={(dnd.items[container] ?? []).length === 0} emptyText={emptyText}>
      <SortableContext items={dnd.items[container] ?? []} strategy={verticalListSortingStrategy}>
        {(dnd.items[container] ?? []).map((id) => {
          const issue = dnd.get(id)
          return issue ? <SortableIssueRow key={id} issue={issue} epic={epicById.get(issue.epic_id ?? -1)} /> : null
        })}
      </SortableContext>
      <InlineCreate defaults={defaults} />
    </DroppableList>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <PageHeader
        title="Backlog"
        description="Planeje sprints arrastando issues entre as seções."
        actions={
          <>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar issues…"
                className="h-8 w-44 rounded-md border bg-card pr-2 pl-8 text-[13px] outline-none focus:border-ring/50 sm:w-56"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => setSprintDialog({ open: true })}>
              <Plus /> Criar sprint
            </Button>
          </>
        }
      />

      <DndContext {...dnd.dndProps}>
        {openSprints.map((sprint) => {
          const id = sprintContainer(sprint.id)
          const list = containers[id] ?? []
          const active = sprint.status === 'active'
          return (
            <Section
              key={sprint.id}
              title={sprint.name}
              badge={
                active ? (
                  <span className="rounded-sm bg-status-in-progress/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-in-progress uppercase">
                    Ativa
                  </span>
                ) : null
              }
              subtitle={fmtRange(sprint.start_date, sprint.end_date)}
              goal={sprint.goal}
              issues={list}
              collapsed={collapsed.includes(id)}
              onToggle={() => toggle(id)}
              actions={
                <>
                  {active ? (
                    <Button size="xs" variant="outline" onClick={() => setCompleting(sprint)}>
                      Concluir sprint
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button size="xs" variant="outline" disabled={hasActive} onClick={() => setStarting(sprint)}>
                            <Play /> Iniciar sprint
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {hasActive && <TooltipContent>Conclua a sprint ativa primeiro</TooltipContent>}
                    </Tooltip>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-xs" variant="ghost" aria-label="Mais ações">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setSprintDialog({ open: true, sprint })}>
                        <Pencil /> Editar sprint
                      </DropdownMenuItem>
                      {!active && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(sprint)}>
                            <Trash2 /> Excluir sprint
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            >
              {renderList(id, { sprint_id: sprint.id }, 'Arraste issues do backlog para planejar esta sprint.')}
            </Section>
          )
        })}

        <Section
          title="Backlog"
          issues={containers[BACKLOG] ?? []}
          collapsed={collapsed.includes(BACKLOG)}
          onToggle={() => toggle(BACKLOG)}
          actions={
            <Button size="xs" variant="outline" onClick={() => setSprintDialog({ open: true })}>
              <Plus /> Criar sprint
            </Button>
          }
        >
          {renderList(BACKLOG, { sprint_id: null }, 'Backlog vazio. Crie issues para planejar as próximas sprints.')}
        </Section>

        <DragOverlay dropAnimation={null}>
          {dnd.activeIssue && (
            <IssueRowContent issue={dnd.activeIssue} epic={epicById.get(dnd.activeIssue.epic_id ?? -1)} overlay />
          )}
        </DragOverlay>
      </DndContext>

      <SprintDialog
        open={sprintDialog.open}
        sprint={sprintDialog.sprint}
        onOpenChange={(open) => setSprintDialog({ open })}
      />
      <StartSprintDialog sprint={starting} onOpenChange={() => setStarting(null)} />
      <CompleteSprintDialog sprint={completing} onOpenChange={() => setCompleting(null)} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              As {deleting?.issue_count ?? 0} issues desta sprint voltam para o backlog. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleting && remove.mutate(deleting.id, { onSuccess: () => toast.success(`${deleting.name} excluída`) })
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DroppableList({
  id,
  isEmpty,
  emptyText,
  children,
}: {
  id: string
  isEmpty: boolean
  emptyText: ReactNode
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={cn('transition-colors', isOver && 'bg-primary/5')}>
      {isEmpty && (
        <div
          className={cn(
            'm-2 rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground',
            isOver && 'border-primary/60 text-foreground',
          )}
        >
          {emptyText}
        </div>
      )}
      {children}
    </div>
  )
}

function Section({
  title,
  badge,
  subtitle,
  goal,
  issues,
  collapsed,
  onToggle,
  actions,
  children,
}: {
  title: string
  badge?: ReactNode
  subtitle?: string
  goal?: string
  issues: Issue[]
  collapsed: boolean
  onToggle: () => void
  actions?: ReactNode
  children: ReactNode
}) {
  const points = (filter: (i: Issue) => boolean) => issues.filter(filter).reduce((n, i) => n + (i.story_points ?? 0), 0)
  const todo = points((i) => i.status === 'todo' || i.status === 'backlog')
  const doing = points((i) => i.status === 'in_progress' || i.status === 'review')
  const done = points((i) => i.status === 'done')

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-muted/40 px-3 py-2">
        <button onClick={onToggle} className="flex min-w-0 items-center gap-2 text-left" aria-expanded={!collapsed}>
          <ChevronRight
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !collapsed && 'rotate-90')}
          />
          <span className="truncate font-semibold">{title}</span>
          {badge}
        </button>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        <span className="text-xs text-muted-foreground">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1" title="Pontos: a fazer · em andamento · concluídos">
          <PointPill value={todo} className="bg-status-todo/20 text-foreground/80" />
          <PointPill value={doing} className="bg-status-in-progress/20 text-status-in-progress" />
          <PointPill value={done} className="bg-status-done/20 text-status-done" />
        </div>
        <div className="flex items-center gap-1">{actions}</div>
        {goal && !collapsed && <p className="basis-full pl-6 text-xs text-muted-foreground">🎯 {goal}</p>}
      </header>
      {!collapsed && <div className="border-t">{children}</div>}
    </section>
  )
}

function PointPill({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
        className,
      )}
    >
      {value}
    </span>
  )
}

function BacklogSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <Skeleton className="h-8 w-40" />
      {[0, 1].map((s) => (
        <div key={s} className="space-y-px overflow-hidden rounded-lg border">
          <Skeleton className="h-10 rounded-none" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 rounded-none opacity-60" />
          ))}
        </div>
      ))}
    </div>
  )
}
