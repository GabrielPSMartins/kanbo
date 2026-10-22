import type { IssueStatus } from '@/api/client'
import { StatusIcon } from '@/components/issue/badges'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUS, STATUS_ORDER } from '@/lib/meta'

/**
 * Issues por status como barras horizontais rotuladas. As cores de status do design system
 * não se separam bem para daltônicos (azul/roxo), então cada barra leva ícone + nome + valor.
 */
export function StatusBars({
  counts,
  statuses = STATUS_ORDER,
}: {
  counts: Record<string, number>
  statuses?: IssueStatus[]
}) {
  const max = Math.max(1, ...statuses.map((s) => counts[s] ?? 0))
  const total = statuses.reduce((n, s) => n + (counts[s] ?? 0), 0)
  return (
    <ul className="space-y-2.5">
      {statuses.map((s) => {
        const n = counts[s] ?? 0
        return (
          <li key={s} className="grid grid-cols-[104px_1fr_28px] items-center gap-3 text-[13px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <StatusIcon status={s} />
              {STATUS[s].label}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-2 rounded-full bg-muted py-0">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(n / max) * 100}%`, backgroundColor: STATUS[s].color, minWidth: n ? 6 : 0 }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {n} {n === 1 ? 'issue' : 'issues'} · {total ? Math.round((n / total) * 100) : 0}%
              </TooltipContent>
            </Tooltip>
            <span className="text-right font-medium tabular-nums">{n}</span>
          </li>
        )
      })}
    </ul>
  )
}
