import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import type { Sprint } from '@/api/client'
import { useSprintMutations } from '@/api/hooks/sprints'
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
import { addDays, todayISO } from '@/lib/dates'
import { useCurrentProject } from '@/providers/project'

export function StartSprintDialog({
  sprint,
  onOpenChange,
}: {
  sprint: Sprint | null
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={!!sprint} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar {sprint?.name}</DialogTitle>
          <DialogDescription>
            {sprint?.issue_count ?? 0} issues · {sprint?.total_points ?? 0} pontos comprometidos
          </DialogDescription>
        </DialogHeader>
        {sprint && <StartSprintForm sprint={sprint} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function StartSprintForm({ sprint, onDone }: { sprint: Sprint; onDone: () => void }) {
  const project = useCurrentProject()
  const { start } = useSprintMutations(project.id)
  const navigate = useNavigate()
  const initialStart = sprint.start_date ?? todayISO()
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(
    sprint.end_date && sprint.end_date >= initialStart ? sprint.end_date : addDays(initialStart, 13),
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    start.mutate(
      { id: sprint.id, body: { start_date: startDate, end_date: endDate } },
      {
        onSuccess: () => {
          toast.success(`${sprint.name} iniciada`)
          onDone()
          navigate('/board')
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {sprint.goal && <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">🎯 {sprint.goal}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="st-start">Início</Label>
          <Input id="st-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="st-end">Fim</Label>
          <Input id="st-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!startDate || !endDate || endDate < startDate || start.isPending}>
          Iniciar sprint
        </Button>
      </DialogFooter>
    </form>
  )
}
