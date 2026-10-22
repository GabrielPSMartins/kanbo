import { CheckCircle2, CircleDashed } from 'lucide-react'
import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/providers/project'

const NEW_SPRINT = '__new__'

/** Concluir sprint: resumo + destino das issues pendentes (backlog ou sprint planejada). */
export function CompleteSprintDialog({
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
          <DialogTitle>Concluir {sprint?.name}</DialogTitle>
          <DialogDescription>Revise o resultado antes de fechar a sprint.</DialogDescription>
        </DialogHeader>
        {sprint && <CompleteSprintForm sprint={sprint} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CompleteSprintForm({ sprint, onDone }: { sprint: Sprint; onDone: () => void }) {
  const project = useCurrentProject()
  const { data: sprints = [] } = useSprints(project.id)
  const { close, create } = useSprintMutations(project.id)
  const planned = sprints.filter((s) => s.status === 'planned')
  const [target, setTarget] = useState(() => (planned[0] ? String(planned[0].id) : 'backlog'))

  const pending = sprint.issue_count - sprint.done_count
  const busy = close.isPending || create.isPending

  const submit = async () => {
    try {
      let targetId: number | null = null
      if (target === NEW_SPRINT) {
        const created = await create.mutateAsync({ name: `Sprint ${sprints.length + 1}` })
        targetId = created.id
      } else if (target !== 'backlog') {
        targetId = Number(target)
      }
      await close.mutateAsync({
        id: sprint.id,
        body: targetId ? { move_to: 'sprint', target_sprint_id: targetId } : { move_to: 'backlog' },
      })
      toast.success(`${sprint.name} concluída`, {
        description: `${sprint.done_points} de ${sprint.total_points} pontos entregues`,
      })
      onDone()
    } catch {
      // erro já exibido pelo toast global de mutations
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-status-done" /> Concluídas
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{sprint.done_count}</div>
          <div className="text-xs text-muted-foreground">{sprint.done_points} pontos</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleDashed className="size-3.5" /> Pendentes
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{pending}</div>
          <div className="text-xs text-muted-foreground">{sprint.total_points - sprint.done_points} pontos</div>
        </div>
      </div>
      {pending > 0 ? (
        <div className="grid gap-1.5">
          <Label>Mover {pending === 1 ? 'a issue pendente' : `as ${pending} issues pendentes`} para</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planned.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_SPRINT}>Nova sprint</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <p className="text-muted-foreground">Todas as issues foram concluídas. 🎉</p>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={busy}>
          Concluir sprint
        </Button>
      </DialogFooter>
    </>
  )
}
