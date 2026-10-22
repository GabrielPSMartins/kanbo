import { CalendarClock, Flame, Gauge, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'
import { useDashboard } from '@/api/hooks/meta'
import { useBurndown } from '@/api/hooks/sprints'
import { BurndownChart } from '@/components/charts/burndown-chart'
import { StatusBars } from '@/components/charts/status-bars'
import { IssueList } from '@/components/issue/issue-list'
import { PageHeader } from '@/components/page'
import { Panel, StatTile } from '@/components/stat-tile'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtRange, fmtShort } from '@/lib/dates'
import { BOARD_COLUMNS } from '@/lib/meta'
import { useCurrentProject } from '@/providers/project'

export default function DashboardPage() {
  const project = useCurrentProject()
  const { data, isLoading } = useDashboard(project.id)
  const sprint = data?.active_sprint
  const { data: burndown } = useBurndown(sprint?.id)

  if (isLoading || !data) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <PageHeader
        title={project.name}
        description={
          sprint ? `${sprint.name} · ${fmtRange(sprint.start_date, sprint.end_date)}` : 'Nenhuma sprint ativa'
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Dias restantes"
          icon={<CalendarClock className="size-3.5" />}
          value={sprint?.days_remaining ?? '—'}
          hint={sprint?.end_date ? `termina em ${fmtShort(sprint.end_date)}` : 'sem sprint ativa'}
        />
        <StatTile
          label="Pontos concluídos"
          icon={<Target className="size-3.5" />}
          value={
            sprint ? (
              <>
                {sprint.done_points}
                <span className="text-base font-normal text-muted-foreground">/{sprint.total_points}</span>
              </>
            ) : (
              '—'
            )
          }
          hint={sprint ? `${sprint.done_count} de ${sprint.issue_count} issues` : undefined}
        />
        <StatTile
          label="Progresso da sprint"
          icon={<Gauge className="size-3.5" />}
          value={sprint ? `${Math.round(sprint.progress * 100)}%` : '—'}
        >
          {sprint && <Progress value={sprint.progress * 100} className="mt-2 h-1.5" />}
        </StatTile>
        <StatTile
          label="Velocity média"
          icon={<TrendingUp className="size-3.5" />}
          value={data.average_velocity ?? '—'}
          hint={
            data.velocity.length
              ? `pts/sprint · ${data.velocity.length === 1 ? 'última sprint' : `últimas ${data.velocity.length} sprints`}`
              : 'nenhuma sprint fechada'
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Burndown"
          className="lg:col-span-2"
          action={
            sprint && (
              <Button asChild variant="ghost" size="xs">
                <Link to={`/sprints/${sprint.id}`}>Ver sprint</Link>
              </Button>
            )
          }
        >
          {burndown && burndown.points.length ? (
            <BurndownChart data={burndown} height={220} />
          ) : (
            <p className="py-16 text-center text-xs text-muted-foreground">Inicie uma sprint para ver o burndown.</p>
          )}
        </Panel>
        <Panel title={sprint ? 'Issues por status (sprint)' : 'Issues por status'}>
          <StatusBars
            counts={sprint ? data.sprint_status_counts : data.project_status_counts}
            statuses={sprint ? BOARD_COLUMNS : undefined}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Projeto inteiro: {Object.values(data.project_status_counts).reduce((a, b) => a + b, 0)} issues,{' '}
            {data.project_status_counts.done ?? 0} concluídas
          </p>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-priority-high" /> Vencendo em breve
            </span>
          }
        >
          <IssueList issues={data.due_soon} empty="Nada vencendo nos próximos 7 dias." />
        </Panel>
        <Panel title="Minhas em andamento">
          <IssueList issues={data.in_progress} empty="Nenhuma issue em andamento." />
        </Panel>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
