import { ChevronDown, Search, X } from 'lucide-react'
import type { Epic, Label } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EMPTY_FILTERS, hasFilters, type Filters } from '@/lib/filters'
import { PRIORITY, PRIORITY_ORDER, TYPE, TYPE_ORDER } from '@/lib/meta'
import { cn } from '@/lib/utils'

type Option<T> = { value: T; label: string; color?: string }

function MultiFilter<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T[]
  onChange: (v: T[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground data-[state=open]:bg-accent',
            value.length > 0 && 'border-primary/50 text-foreground',
          )}
        >
          {label}
          {value.length > 0 && (
            <span className="rounded-sm bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {value.length}
            </span>
          )}
          <ChevronDown className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={value.includes(o.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
          >
            {o.color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />}
            <span className="truncate">{o.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
        {options.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nada para filtrar</div>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function IssueFilters({
  value,
  onChange,
  epics,
  labels,
}: {
  value: Filters
  onChange: (f: Filters) => void
  epics: Epic[]
  labels: Label[]
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Buscar na sprint…"
          className="h-8 w-48 rounded-md border bg-card pr-2 pl-8 text-[13px] outline-none focus:border-ring/50"
        />
      </div>
      <MultiFilter
        label="Epic"
        value={value.epics}
        onChange={(v) => set('epics', v)}
        options={epics.map((e) => ({ value: e.id, label: e.title, color: e.color }))}
      />
      <MultiFilter
        label="Tipo"
        value={value.types}
        onChange={(v) => set('types', v)}
        options={TYPE_ORDER.map((t) => ({ value: t, label: TYPE[t].label, color: TYPE[t].color }))}
      />
      <MultiFilter
        label="Prioridade"
        value={value.priorities}
        onChange={(v) => set('priorities', v)}
        options={PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY[p].label, color: PRIORITY[p].color }))}
      />
      <MultiFilter
        label="Label"
        value={value.labels}
        onChange={(v) => set('labels', v)}
        options={labels.map((l) => ({ value: l.id, label: l.name, color: l.color }))}
      />
      {hasFilters(value) && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          <X /> Limpar
        </Button>
      )}
    </div>
  )
}
