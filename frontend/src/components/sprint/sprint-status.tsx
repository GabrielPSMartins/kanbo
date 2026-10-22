import type { Sprint } from '@/api/client'
import { cn } from '@/lib/utils'

const STYLE: Record<Sprint['status'], { label: string; className: string }> = {
  active: { label: 'Ativa', className: 'bg-status-in-progress/15 text-status-in-progress' },
  planned: { label: 'Planejada', className: 'bg-muted text-muted-foreground' },
  closed: { label: 'Fechada', className: 'bg-status-done/15 text-status-done' },
}

export function SprintStatusBadge({ status, className }: { status: Sprint['status']; className?: string }) {
  const s = STYLE[status]
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap uppercase',
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
