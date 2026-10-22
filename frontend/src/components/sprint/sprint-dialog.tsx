import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Sprint } from '@/api/client'
import { useSprintMutations, useSprints } from '@/api/hooks/sprints'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addDays, todayISO } from '@/lib/dates'
import { useCurrentProject } from '@/providers/project'

type Props = { open: boolean; onOpenChange: (o: boolean) => void; sprint?: Sprint }

/** Criar/editar sprint: nome, objetivo e datas. */
export function SprintDialog({ open, onOpenChange, sprint }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sprint ? 'Editar sprint' : 'Criar sprint'}</DialogTitle>
          <DialogDescription>Defina o objetivo e o período da sprint.</DialogDescription>
        </DialogHeader>
        <SprintForm sprint={sprint} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function suggestion(sprints: Sprint[]) {
  // próxima sprint: número seguinte, começando após a última data conhecida
  const lastEnd = sprints
    .map((s) => s.end_date)
    .filter(Boolean)
    .sort()
    .at(-1)
  const start = lastEnd && lastEnd >= todayISO() ? addDays(lastEnd, 1) : todayISO()
  return { name: `Sprint ${sprints.length + 1}`, start, end: addDays(start, 13) }
}

function SprintForm({ sprint, onDone }: { sprint?: Sprint; onDone: () => void }) {
  const project = useCurrentProject()
  const { data: sprints = [] } = useSprints(project.id)
  const { create, update } = useSprintMutations(project.id)
  const [initial] = useState(() => suggestion(sprints))
  const [name, setName] = useState(sprint?.name ?? initial.name)
  const [goal, setGoal] = useState(sprint?.goal ?? '')
  const [start, setStart] = useState(sprint ? (sprint.start_date ?? '') : initial.start)
  const [end, setEnd] = useState(sprint ? (sprint.end_date ?? '') : initial.end)

  const invalidDates = !!start && !!end && end < start
  const pending = create.isPending || update.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = { name, goal, start_date: start || null, end_date: end || null }
    const opts = {
      onSuccess: () => {
        toast.success(sprint ? 'Sprint atualizada' : `${name} criada`)
        onDone()
      },
    }
    if (sprint) update.mutate({ id: sprint.id, body }, opts)
    else create.mutate(body, opts)
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="s-name">Nome</Label>
        <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="s-goal">Objetivo</Label>
        <Textarea
          id="s-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="O que essa sprint precisa entregar?"
          className="min-h-20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="s-start">Início</Label>
          <Input id="s-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="s-end">Fim</Label>
          <Input
            id="s-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-invalid={invalidDates}
          />
        </div>
      </div>
      {invalidDates && <p className="-mt-2 text-xs text-destructive">A data de fim deve ser após o início.</p>}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!name.trim() || invalidDates || pending}>
          {sprint ? 'Salvar' : 'Criar sprint'}
        </Button>
      </DialogFooter>
    </form>
  )
}
