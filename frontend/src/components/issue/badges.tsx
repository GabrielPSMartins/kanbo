import { CalendarDays } from 'lucide-react'
import type { Issue, IssuePriority, IssueStatus, IssueType, Label } from '@/api/client'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isOverdue, relativeDue } from '@/lib/dates'
import { PRIORITY, STATUS, TYPE } from '@/lib/meta'
import { cn } from '@/lib/utils'

export function TypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const { icon: Icon, color, label } = TYPE[type]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex shrink-0', className)} aria-label={label}>
          <Icon className="size-3.5" style={{ color }} strokeWidth={2.25} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function PriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  const { icon: Icon, color, label } = PRIORITY[priority]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex shrink-0', className)} aria-label={`Prioridade: ${label}`}>
          <Icon className="size-3.5" style={{ color }} strokeWidth={2.5} />
        </span>
      </TooltipTrigger>
      <TooltipContent>Prioridade: {label}</TooltipContent>
    </Tooltip>
  )
}

export function StatusIcon({ status, className }: { status: IssueStatus; className?: string }) {
  const { icon: Icon, color } = STATUS[status]
  return <Icon className={cn('size-3.5 shrink-0', className)} style={{ color }} strokeWidth={2.25} />
}

export function StatusPill({ status }: { status: IssueStatus }) {
  const { label, color } = STATUS[status]
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
    >
      <StatusIcon status={status} className="size-3" />
      {label}
    </span>
  )
}

export function PointsBadge({ points, className }: { points: number | null | undefined; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums',
        points == null && 'text-muted-foreground/60',
        className,
      )}
      title="Story points"
    >
      {points ?? '–'}
    </span>
  )
}

export function LabelChip({ label, className }: { label: Pick<Label, 'name' | 'color'>; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-32 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] text-muted-foreground',
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
      <span className="truncate">{label.name}</span>
    </span>
  )
}

export function EpicChip({ title, color, className }: { title: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-40 shrink-0 items-center rounded-md px-1.5 text-[11px] font-medium',
        className,
      )}
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
    >
      <span className="truncate">{title}</span>
    </span>
  )
}

export function DueDate({ issue, className }: { issue: Pick<Issue, 'due_date' | 'status'>; className?: string }) {
  if (!issue.due_date) return null
  const late = issue.status !== 'done' && isOverdue(issue.due_date)
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground',
        late && 'font-medium text-priority-urgent',
        className,
      )}
      title={late ? 'Atrasada' : 'Prazo'}
    >
      <CalendarDays className="size-3" />
      {relativeDue(issue.due_date)}
    </span>
  )
}
