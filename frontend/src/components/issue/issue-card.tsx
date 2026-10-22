import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListChecks } from 'lucide-react'
import type { Epic, Issue } from '@/api/client'
import { useOpenIssue } from '@/hooks/use-open-issue'
import { cn } from '@/lib/utils'
import { DueDate, LabelChip, PointsBadge, PriorityIcon, TypeIcon } from './badges'

type Props = { issue: Issue; epic?: Epic; overlay?: boolean }

export function IssueCardContent({ issue, epic, overlay }: Props) {
  const { checklist_done: done, checklist_total: total } = issue
  return (
    <div
      className={cn(
        'group space-y-2 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-ring/40',
        overlay && 'rotate-1 shadow-xl ring-1 ring-primary/40',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TypeIcon type={issue.type} />
        <span className="shrink-0 whitespace-nowrap tabular-nums">{issue.key}</span>
        {epic && (
          <span className="ml-auto flex min-w-0 items-center gap-1 truncate text-[11px]">
            <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: epic.color }} />
            <span className="truncate">{epic.title}</span>
          </span>
        )}
      </div>
      <p className="line-clamp-3 text-[13px] leading-snug font-medium">{issue.title}</p>
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <PriorityIcon priority={issue.priority} />
        {total > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums',
              done === total && 'text-status-done',
            )}
            title="Checklist"
          >
            <ListChecks className="size-3" />
            {done}/{total}
          </span>
        )}
        <DueDate issue={issue} />
        <PointsBadge points={issue.story_points} className="ml-auto" />
      </div>
      {total > 0 && (
        <div className="h-0.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-status-done transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      )}
    </div>
  )
}

export function SortableIssueCard({ issue, epic }: Props) {
  const openIssue = useOpenIssue()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
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
      <IssueCardContent issue={issue} epic={epic} />
    </div>
  )
}
