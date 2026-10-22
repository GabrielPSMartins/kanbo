import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Epic, Issue } from '@/api/client'
import { useOpenIssue } from '@/hooks/use-open-issue'
import { cn } from '@/lib/utils'
import { DueDate, EpicChip, LabelChip, PointsBadge, PriorityIcon, StatusPill, TypeIcon } from './badges'

type Props = { issue: Issue; epic?: Epic; overlay?: boolean }

/** Linha compacta estilo Jira: tipo, key, título, epic, labels, prazo, status, prioridade, pontos. */
export function IssueRowContent({ issue, epic, overlay, className }: Props & { className?: string }) {
  const done = issue.status === 'done'
  return (
    <div
      className={cn(
        'group flex h-9 items-center gap-2.5 border-b bg-card px-3 text-[13px] transition-colors hover:bg-accent/60',
        overlay && 'rounded-md border shadow-xl ring-1 ring-primary/40',
        className,
      )}
    >
      <TypeIcon type={issue.type} />
      <span className={cn('w-16 shrink-0 text-xs text-muted-foreground tabular-nums', done && 'line-through')}>
        {issue.key}
      </span>
      <span className={cn('min-w-0 flex-1 truncate', done && 'text-muted-foreground')}>{issue.title}</span>
      <div className="hidden items-center gap-1.5 md:flex">
        {epic && <EpicChip title={epic.title} color={epic.color} />}
        {issue.labels.slice(0, 2).map((l) => (
          <LabelChip key={l.id} label={l} />
        ))}
        {issue.labels.length > 2 && (
          <span className="text-[11px] text-muted-foreground">+{issue.labels.length - 2}</span>
        )}
      </div>
      <DueDate issue={issue} className="hidden sm:inline-flex" />
      <span className="hidden w-24 justify-end sm:flex">
        <StatusPill status={issue.status} />
      </span>
      <PriorityIcon priority={issue.priority} />
      <PointsBadge points={issue.story_points} />
    </div>
  )
}

export function SortableIssueRow({ issue, epic }: Props) {
  const openIssue = useOpenIssue()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
      onClick={() => openIssue(issue.key)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter' && !e.defaultPrevented) openIssue(issue.key)
      }}
    >
      <IssueRowContent issue={issue} epic={epic} />
    </div>
  )
}
