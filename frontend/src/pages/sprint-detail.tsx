import { ArrowLeft, CalendarDays, CheckCircle2, Target, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useIssues } from '@/api/hooks/issues'
import { useBurndown, useSprints } from '@/api/hooks/sprints'
import { BurndownChart } from '@/components/charts/burndown-chart'
import { IssueList } from '@/components/issue/issue-list'
import { EmptyState } from '@/components/page'
import { CompleteSprintDialog } from '@/components/sprint/complete-sprint-dialog'
import { SprintDialog } from '@/components/sprint/sprint-dialog'
import { SprintStatusBadge } from '@/components/sprint/sprint-status'
import { StartSprintDialog } from '@/components/sprint/start-sprint-dialog'
import { Panel, StatTile } from '@/components/stat-tile'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtRange } from '@/lib/dates'
import { sprintPoints } from '@/lib/sprints'
import { STATUS_ORDER } from '@/lib/meta'
import { useCurrentProject } from '@/providers/project'

export default function SprintDetailPage() {
  const { sprintId } = useParams()
  const project = useCurrentProject()
  const { data: sprints, isLoading } = useSprints(project.id)
  const sprint = sprints?.find((s) => s.id === Number(sprintId))
  const { data: burndown } = useBurndown(sprint?.id)
  const { data: issues = [] } = useIssues(project.id, { sprint_id: sprint?.id })
  const [editing, setEditing] = useState(false)
  const [action, setAction] = useState<'start' | 'complete' | null>(null)

  if (isLoading) return <Skeleton className="m-6 h-96" />
  if (!sprint) {
    return (
      <EmptyState icon={Timer} title="Sprint não encontrada" className="h-full">
        <Button asChild size="sm" variant="outline" className="mt-2">
          <Link to="/sprints">Voltar para Sprints</Link>
        </Button>
      </EmptyState>
    )
  }

  const { committed, delivered } = sprintPoints(sprint)
  const sorted = [...issues].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <Link
        to="/sprints"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Sprints
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{sprint.name}</h1>
            <SprintStatusBadge status={sprint.status} />
          </div>
          {sprint.goal && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="size-3.5" /> {sprint.goal}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" /> {fmtRange(sprint.start_date, sprint.end_date)}
          </p>
        </div>
        <div className="flex gap-2">
          {sprint.status !== 'closed' && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
          {sprint.status === 'planned' && (
            <Button size="sm" onClick={() => setAction('start')} disabled={sprints?.some((s) => s.status === 'active')}>
              Iniciar sprint
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button size="sm" onClick={() => setAction('complete')}>
              Concluir sprint
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Comprometido" value={`${committed} pts`} hint="no início da sprint" />
        <StatTile
          label="Entregue"
          icon={<CheckCircle2 className="size-3.5 text-status-done" />}
          value={`${delivered} pts`}
          hint={committed ? `${Math.round((delivered / committed) * 100)}% do compromisso` : undefined}
        />
        <StatTile label="Issues" value={sprint.issue_count} hint={`${sprint.done_count} concluídas`} />
        <StatTile
          label="Escopo atual"
          value={`${sprint.total_points} pts`}
          hint={
            sprint.status === 'closed'
              ? 'pendentes foram movidas ao fechar'
              : sprint.total_points !== committed
                ? `${sprint.total_points > committed ? '+' : ''}${sprint.total_points - committed} pts de mudança de escopo`
                : 'sem mudança de escopo'
          }
        />
      </div>

      <Panel title="Burndown">
        {burndown && burndown.points.length ? (
          <BurndownChart data={burndown} height={300} />
        ) : (
          <p className="py-16 text-center text-xs text-muted-foreground">
            Defina as datas da sprint para ver o burndown.
          </p>
        )}
      </Panel>

      <Panel title={`Issues (${issues.length})`}>
        <IssueList issues={sorted} empty="Nenhuma issue nesta sprint." />
      </Panel>

      <SprintDialog open={editing} onOpenChange={setEditing} sprint={sprint} />
      <StartSprintDialog sprint={action === 'start' ? sprint : null} onOpenChange={() => setAction(null)} />
      <CompleteSprintDialog sprint={action === 'complete' ? sprint : null} onOpenChange={() => setAction(null)} />
    </div>
  )
}
