import type { Activity, Epic, IssueDetail, IssuePriority, IssueStatus, IssueType, Sprint } from '@/api/client'
import { fmtDateTime, fmtShort } from '@/lib/dates'
import { PRIORITY, STATUS, TYPE } from '@/lib/meta'

type Ctx = { sprints: Sprint[]; epics: Epic[] }

const b = (v: string) => <strong className="font-medium text-foreground">{v}</strong>

function describe(a: Activity, { sprints, epics }: Ctx) {
  const sprint = (id: string | null) =>
    id ? (sprints.find((s) => String(s.id) === id)?.name ?? `Sprint #${id}`) : 'Backlog'
  const epic = (id: string | null) => (id ? (epics.find((e) => String(e.id) === id)?.title ?? `Epic #${id}`) : 'nenhum')
  const from = a.from_value
  const to = a.to_value
  switch (a.action) {
    case 'created':
      return <>criou a issue</>
    case 'status_changed':
      return (
        <>
          mudou o status de {b(STATUS[from as IssueStatus]?.label ?? from ?? '—')} para{' '}
          {b(STATUS[to as IssueStatus]?.label ?? to ?? '—')}
        </>
      )
    case 'moved_to_sprint':
      return (
        <>
          moveu de {b(sprint(from))} para {b(sprint(to))}
        </>
      )
    case 'points_changed':
      return (
        <>
          alterou os pontos de {b(from ?? '–')} para {b(to ?? '–')}
        </>
      )
    case 'priority_changed':
      return <>alterou a prioridade para {b(PRIORITY[to as IssuePriority]?.label ?? to ?? '—')}</>
    case 'type_changed':
      return <>alterou o tipo para {b(TYPE[to as IssueType]?.label ?? to ?? '—')}</>
    case 'title_changed':
      return <>renomeou para {b(to ?? '')}</>
    case 'description_changed':
      return <>editou a descrição</>
    case 'epic_changed':
      return <>definiu o epic {b(epic(to))}</>
    case 'due_date_changed':
      return to ? <>definiu o prazo para {b(fmtShort(to))}</> : <>removeu o prazo</>
    case 'labels_changed':
      return to ? <>alterou as labels para {b(to)}</> : <>removeu as labels</>
    default:
      return <>{a.action}</>
  }
}

export function ActivityFeed({ issue, ...ctx }: { issue: IssueDetail } & Ctx) {
  const items = [...issue.activity].reverse()
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Atividade</h3>
      <ol className="relative space-y-3 border-l pl-4">
        {items.map((a) => (
          <li key={a.id} className="relative text-[13px] text-muted-foreground">
            <span className="absolute top-1.5 -left-[21px] size-2 rounded-full border-2 border-background bg-muted-foreground/50" />
            <span>Você {describe(a, ctx)}</span>
            <span className="ml-2 text-[11px] text-muted-foreground/70">{fmtDateTime(a.created_at)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
