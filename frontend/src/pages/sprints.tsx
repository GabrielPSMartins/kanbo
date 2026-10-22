import { ChevronRight, Plus, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useSprints } from '@/api/hooks/sprints'
import { VelocityChart } from '@/components/charts/velocity-chart'
import { EmptyState, PageHeader } from '@/components/page'
import { SprintDialog } from '@/components/sprint/sprint-dialog'
import { SprintStatusBadge } from '@/components/sprint/sprint-status'
import { Panel } from '@/components/stat-tile'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtRange } from '@/lib/dates'
import { sprintPoints } from '@/lib/sprints'
import { useCurrentProject } from '@/providers/project'

export default function SprintsPage() {
  const project = useCurrentProject()
  const { data: sprints = [], isLoading } = useSprints(project.id)
  const [creating, setCreating] = useState(false)

  const closed = sprints
    .filter((s) => s.status === 'closed')
    .sort((a, b) => (a.closed_at ?? '').localeCompare(b.closed_at ?? ''))
    .slice(-8)
  const velocity = closed.map((s) => ({ name: s.name, ...toVelocity(s) }))

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <PageHeader
        title="Sprints"
        description="Histórico, compromisso vs entrega e burndown de cada sprint."
        actions={
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus /> Criar sprint
          </Button>
        }
      />

      {velocity.length > 0 && (
        <Panel title="Velocity">
          <VelocityChart data={velocity} height={200} />
        </Panel>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : sprints.length === 0 ? (
        <EmptyState icon={Timer} title="Nenhuma sprint ainda">
          Crie a primeira sprint e planeje-a no backlog.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[1fr_96px_150px_200px_24px] gap-4 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground md:grid">
            <span>Sprint</span>
            <span>Status</span>
            <span>Período</span>
            <span>Entregue / comprometido</span>
            <span />
          </div>
          {sprints.map((s) => {
            const { committed, delivered } = sprintPoints(s)
            return (
              <Link
                key={s.id}
                to={`/sprints/${s.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50 md:grid-cols-[1fr_96px_150px_200px_24px]"
              >
                <div className="min-w-0">
                  <div className="font-medium">{s.name}</div>
                  {s.goal && <div className="truncate text-xs text-muted-foreground">{s.goal}</div>}
                </div>
                <div>
                  <SprintStatusBadge status={s.status} />
                </div>
                <span className="text-xs text-muted-foreground">{fmtRange(s.start_date, s.end_date)}</span>
                <div className="flex items-center gap-2">
                  <Progress value={committed ? (delivered / committed) * 100 : 0} className="h-1.5 flex-1" />
                  <span className="w-16 text-right text-xs tabular-nums">
                    {delivered}/{committed} pts
                  </span>
                </div>
                <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
              </Link>
            )
          })}
        </div>
      )}

      <SprintDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

function toVelocity(s: Parameters<typeof sprintPoints>[0]) {
  const { committed, delivered } = sprintPoints(s)
  return { committed, completed: delivered }
}
