import { CalendarDays, Check, ChevronDown, Hash, Layers, Tag, Timer, X } from 'lucide-react'
import type { Epic, IssuePriority, IssueStatus, IssueType, Label, Sprint } from '@/api/client'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fmtShort } from '@/lib/dates'
import { PRIORITY, PRIORITY_ORDER, STATUS, STATUS_ORDER, STORY_POINTS, TYPE, TYPE_ORDER } from '@/lib/meta'
import { cn } from '@/lib/utils'
import { PriorityIcon, StatusIcon } from './badges'

/** Botão-chip usado como gatilho dos pickers (estilo Linear). */
export function FieldChip({
  children,
  className,
  muted,
  ...props
}: React.ComponentProps<'button'> & { muted?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border bg-transparent px-2 text-xs whitespace-nowrap transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none data-[state=open]:bg-accent',
        muted && 'text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type PickerProps<T> = {
  value: T
  onChange: (v: T) => void
  className?: string
  variant?: 'chip' | 'row'
}

/** Gatilho: chip (modal) ou linha cheia (sidebar do drawer). */
function Trigger({
  variant = 'chip',
  className,
  children,
  muted,
  ...props
}: React.ComponentProps<'button'> & { variant?: 'chip' | 'row'; muted?: boolean }) {
  if (variant === 'row') {
    return (
      <button
        type="button"
        {...props}
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none data-[state=open]:bg-accent',
          muted && 'text-muted-foreground',
          className,
        )}
      >
        {children}
        <ChevronDown className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/field:opacity-100" />
      </button>
    )
  }
  return (
    <FieldChip muted={muted} className={className} {...props}>
      {children}
    </FieldChip>
  )
}

function Check_({ on }: { on: boolean }) {
  return <Check className={cn('ml-auto size-3.5', !on && 'invisible')} />
}

export function StatusPicker({
  value,
  onChange,
  variant,
  className,
  exclude = [],
}: PickerProps<IssueStatus> & { exclude?: IssueStatus[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className}>
          <StatusIcon status={value} />
          {STATUS[value].label}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {STATUS_ORDER.filter((s) => !exclude.includes(s)).map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onChange(s)}>
            <StatusIcon status={s} />
            {STATUS[s].label}
            <Check_ on={s === value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TypePicker({ value, onChange, variant, className }: PickerProps<IssueType>) {
  const Icon = TYPE[value].icon
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className}>
          <Icon className="size-3.5" style={{ color: TYPE[value].color }} />
          {TYPE[value].label}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {TYPE_ORDER.map((t) => {
          const I = TYPE[t].icon
          return (
            <DropdownMenuItem key={t} onSelect={() => onChange(t)}>
              <I style={{ color: TYPE[t].color }} />
              {TYPE[t].label}
              <Check_ on={t === value} />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PriorityPicker({ value, onChange, variant, className }: PickerProps<IssuePriority>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className} muted={value === 'none'}>
          <PriorityIcon priority={value} />
          {PRIORITY[value].label}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {PRIORITY_ORDER.map((p) => {
          const I = PRIORITY[p].icon
          return (
            <DropdownMenuItem key={p} onSelect={() => onChange(p)}>
              <I style={{ color: PRIORITY[p].color }} />
              {PRIORITY[p].label}
              <Check_ on={p === value} />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PointsPicker({ value, onChange, variant, className }: PickerProps<number | null>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className} muted={value == null}>
          <Hash className="size-3.5" />
          {value == null ? 'Estimar' : `${value} ${value === 1 ? 'ponto' : 'pontos'}`}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel>Story points</DropdownMenuLabel>
        {STORY_POINTS.map((p) => (
          <DropdownMenuItem key={p} onSelect={() => onChange(p)}>
            <span className="w-5 text-center tabular-nums">{p}</span>
            <Check_ on={p === value} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <X /> Sem estimativa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SprintPicker({
  value,
  onChange,
  sprints,
  variant,
  className,
}: PickerProps<number | null> & { sprints: Sprint[] }) {
  const open = sprints.filter((s) => s.status !== 'closed' || s.id === value)
  const current = sprints.find((s) => s.id === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className} muted={!current}>
          <Timer className="size-3.5" />
          <span className="truncate">{current?.name ?? 'Backlog'}</span>
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          Backlog
          <Check_ on={value == null} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {open.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => onChange(s.id)} disabled={s.status === 'closed'}>
            <span className="truncate">{s.name}</span>
            {s.status === 'active' && (
              <span className="text-[10px] font-medium text-status-in-progress uppercase">ativa</span>
            )}
            <Check_ on={s.id === value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EpicPicker({
  value,
  onChange,
  epics,
  variant,
  className,
}: PickerProps<number | null> & { epics: Epic[] }) {
  const current = epics.find((e) => e.id === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className} muted={!current}>
          {current ? (
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: current.color }} />
          ) : (
            <Layers className="size-3.5" />
          )}
          <span className="truncate">{current?.title ?? 'Sem epic'}</span>
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          Sem epic
          <Check_ on={value == null} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {epics.map((e) => (
          <DropdownMenuItem key={e.id} onSelect={() => onChange(e.id)}>
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: e.color }} />
            <span className="truncate">{e.title}</span>
            <Check_ on={e.id === value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function LabelsPicker({
  value,
  onChange,
  labels,
  variant,
  className,
}: PickerProps<number[]> & { labels: Label[] }) {
  const selected = labels.filter((l) => value.includes(l.id))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger variant={variant} className={className} muted={!selected.length}>
          {selected.length ? (
            <span className="flex -space-x-0.5">
              {selected.slice(0, 4).map((l) => (
                <span
                  key={l.id}
                  className="size-2.5 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: l.color }}
                />
              ))}
            </span>
          ) : (
            <Tag className="size-3.5" />
          )}
          <span className="truncate">
            {selected.length === 0 ? 'Labels' : selected.length === 1 ? selected[0]!.name : `${selected.length} labels`}
          </span>
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {labels.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Crie labels em Configurações</div>
        )}
        {labels.map((l) => (
          <DropdownMenuCheckboxItem
            key={l.id}
            checked={value.includes(l.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) => onChange(on ? [...value, l.id] : value.filter((id) => id !== l.id))}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Data com input nativo (sem dependência de calendário). */
export function DueDatePicker({ value, onChange, variant = 'chip', className }: PickerProps<string | null>) {
  return (
    <div className={cn('group/date relative inline-flex', variant === 'row' && 'w-full', className)}>
      <label
        className={cn(
          'relative inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/50',
          variant === 'chip' ? 'h-7 rounded-md border px-2 text-xs' : 'h-8 w-full rounded-md px-2 text-[13px]',
          !value && 'text-muted-foreground',
        )}
      >
        <CalendarDays className="size-3.5" />
        {value ? fmtShort(value) : 'Prazo'}
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="absolute inset-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          aria-label="Prazo"
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-1/2 right-1 hidden -translate-y-1/2 rounded p-0.5 text-muted-foreground group-hover/date:block hover:text-foreground"
          aria-label="Remover prazo"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
