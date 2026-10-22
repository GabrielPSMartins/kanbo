import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CalendarDays, Columns3, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { IssueStatus, Sprint } from '@/api/client'
import { useIssues, useMoveIssue } from '@/api/hooks/issues'
import { useEpics, useLabels } from '@/api/hooks/meta'
import { useActiveSprint } from '@/api/hooks/sprints'
import { StatusIcon } from '@/components/issue/badges'
import { IssueCardContent, SortableIssueCard } from '@/components/issue/issue-card'
import { IssueFilters } from '@/components/issue/issue-filters'
import { EmptyState } from '@/components/page'
import { CompleteSprintDialog } from '@/components/sprint/complete-sprint-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { positionBetween, useIssueDnd, type Containers } from '@/hooks/use-issue-dnd'
import { daysUntil, fmtRange } from '@/lib/dates'
import { applyFilters, EMPTY_FILTERS, hasFilters, type Filters } from '@/lib/filters'
import { BOARD_COLUMNS, STATUS } from '@/lib/meta'
import { cn } from '@/lib/utils'
import { useCurrentProject } from '@/providers/project'

export default function BoardPage() {
  const project = useCurrentProject()
  const { data: sprint, isLoading } = useActiveSprint(project.id)

  if (isLoading) return <BoardSkeleton />
  if (!sprint) {
    return (
      <EmptyState icon={Columns3} title="Nenhuma sprint ativa" className="h-full">
        <p>Planeje e inicie uma sprint no backlog para usar o board.</p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/backlog">Ir para o Backlog</Link>
        </Button>
      </EmptyState>
    )
  }
  return <Board sprint={sprint} />
}

function Board({ sprint }: { sprint: Sprint }) {
  const project = useCurrentProject()
  const { data: issues = [], isLoading } = useIssues(project.id, { sprint_id: sprint.id })
  const { data: epics = [] } = useEpics(project.id)
  const { data: labels = [] } = useLabels(project.id)
  const move = useMoveIssue(project.id)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [completing, setCompleting] = useState(false)
  const epicById = useMemo(() => new Map(epics.map((e) => [e.id, e])), [epics])

  const containers = useMemo<Containers>(() => {
    const visible = applyFilters(issues, filters)
    // issues com status "backlog" dentro da sprint aparecem em To Do
    const col = (s: IssueStatus): IssueStatus => (s === 'backlog' ? 'todo' : s)
    return Object.fromEntries(BOARD_COLUMNS.map((s) => [s, visible.filter((i) => col(i.status) === s)]))
  }, [issues, filters])

  const dnd = useIssueDnd(containers, ({ issue, container, fromContainer, before, after }) => {
    const status = container as IssueStatus
    const changed = container !== fromContainer
    move.mutate({
      issue,
      body: { ...(changed && { status }), before_id: before?.id ?? null, after_id: after?.id ?? null },
      optimistic: {
        status,
        position: positionBetween(before, after),
        ...(changed && { completed_at: status === 'done' ? new Date().toISOString() : null }),
      },
    })
  })

  const total = issues.reduce((n, i) => n + (i.story_points ?? 0), 0)
  const done = issues.filter((i) => i.status === 'done').reduce((n, i) => n + (i.story_points ?? 0), 0)
  const remaining = sprint.end_date ? daysUntil(sprint.end_date) : null

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start gap-4 rounded-lg border bg-card p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{sprint.name}</h1>
            <span className="rounded-sm bg-status-in-progress/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-in-progress uppercase">
              Ativa
            </span>
          </div>
          {sprint.goal && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="size-3.5 shrink-0" /> {sprint.goal}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {fmtRange(sprint.start_date, sprint.end_date)}
            {remaining != null && (
              <span className={cn('font-medium', remaining < 0 ? 'text-priority-urgent' : 'text-foreground')}>
                ·{' '}
                {remaining < 0
                  ? `${-remaining} dias atrasada`
                  : remaining === 0
                    ? 'termina hoje'
                    : `${remaining} ${remaining === 1 ? 'dia restante' : 'dias restantes'}`}
              </span>
            )}
          </p>
        </div>
        <div className="w-48 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="tabular-nums">
              {done}/{total} pts
            </span>
          </div>
          <Progress value={total ? (done / total) * 100 : 0} className="h-1.5" />
        </div>
        <Button size="sm" onClick={() => setCompleting(true)}>
          Concluir sprint
        </Button>
      </div>

      <IssueFilters value={filters} onChange={setFilters} epics={epics} labels={labels} />

      {isLoading ? (
        <ColumnsSkeleton />
      ) : (
        <DndContext {...dnd.dndProps}>
          <div className="grid min-h-0 flex-1 auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
            {BOARD_COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                ids={dnd.items[status] ?? []}
                points={(dnd.items[status] ?? []).reduce((n, id) => n + (dnd.get(id)?.story_points ?? 0), 0)}
                filtered={hasFilters(filters)}
              >
                {(dnd.items[status] ?? []).map((id) => {
                  const issue = dnd.get(id)
                  return issue ? (
                    <SortableIssueCard key={id} issue={issue} epic={epicById.get(issue.epic_id ?? -1)} />
                  ) : null
                })}
              </Column>
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {dnd.activeIssue && (
              <IssueCardContent issue={dnd.activeIssue} epic={epicById.get(dnd.activeIssue.epic_id ?? -1)} overlay />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <CompleteSprintDialog sprint={completing ? sprint : null} onOpenChange={() => setCompleting(false)} />
    </div>
  )
}

function Column({
  status,
  ids,
  points,
  filtered,
  children,
}: {
  status: IssueStatus
  ids: number[]
  points: number
  filtered: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      className={cn(
        'flex min-h-0 flex-col rounded-lg bg-muted/40 transition-colors',
        isOver && 'bg-primary/5 ring-1 ring-primary/30',
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-1 text-[13px] font-medium">
        <StatusIcon status={status} />
        {STATUS[status].label}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{ids.length}</span>
        <span className="ml-auto rounded-full bg-background/60 px-1.5 text-[11px] text-muted-foreground tabular-nums">
          {points} pts
        </span>
      </header>
      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        {ids.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-md border border-dashed py-6 text-xs text-muted-foreground">
            {filtered ? 'Nada com esses filtros' : 'Arraste issues para cá'}
          </div>
        )}
      </div>
    </section>
  )
}

function ColumnsSkeleton() {
  return (
    <div className="grid flex-1 grid-cols-4 gap-3">
      {BOARD_COLUMNS.map((s) => (
        <div key={s} className="space-y-2 rounded-lg bg-muted/40 p-2">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ))}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-20" />
      <ColumnsSkeleton />
    </div>
  )
}
