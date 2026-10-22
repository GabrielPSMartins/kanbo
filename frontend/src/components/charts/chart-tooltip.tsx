import type { ReactNode } from 'react'

export function ChartTooltipBox({
  title,
  rows,
}: {
  title: ReactNode
  rows: { label: string; value: ReactNode; swatch: ReactNode }[]
}) {
  return (
    <div className="min-w-36 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <div className="mb-1 font-medium">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          {r.swatch}
          <span className="text-muted-foreground">{r.label}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export const LineSwatch = ({ color, dashed }: { color: string; dashed?: boolean }) => (
  <svg width="16" height="4" aria-hidden className="shrink-0">
    <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} />
  </svg>
)

export const BoxSwatch = ({ color }: { color: string }) => (
  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
)

export function ChartLegend({ items }: { items: { label: string; swatch: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.swatch}
          {i.label}
        </span>
      ))}
    </div>
  )
}
