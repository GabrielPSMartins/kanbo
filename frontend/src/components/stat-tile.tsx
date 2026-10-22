import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatTile({
  label,
  value,
  hint,
  icon,
  children,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      {children}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col rounded-lg border bg-card', className)}>
      <header className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </header>
      <div className="flex-1 px-4 pb-4">{children}</div>
    </section>
  )
}
