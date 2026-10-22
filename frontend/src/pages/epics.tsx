import { ChevronRight, Layers, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Epic } from '@/api/client'
import { useIssues } from '@/api/hooks/issues'
import { useEpicMutations, useEpics } from '@/api/hooks/meta'
import { ColorPicker } from '@/components/color-picker'
import { IssueList } from '@/components/issue/issue-list'
import { EmptyState, PageHeader } from '@/components/page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { SWATCHES } from '@/lib/meta'
import { cn } from '@/lib/utils'
import { useCurrentProject } from '@/providers/project'

export default function EpicsPage() {
  const project = useCurrentProject()
  const { data: epics = [], isLoading } = useEpics(project.id)
  const [dialog, setDialog] = useState<{ open: boolean; epic?: Epic }>({ open: false })
  const [deleting, setDeleting] = useState<Epic | null>(null)
  const { remove } = useEpicMutations(project.id)

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <PageHeader
        title="Epics"
        description="Grandes blocos de trabalho e o progresso de cada um (pontos concluídos / total)."
        actions={
          <Button size="sm" variant="outline" onClick={() => setDialog({ open: true })}>
            <Plus /> Novo epic
          </Button>
        }
      />
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : epics.length === 0 ? (
        <EmptyState icon={Layers} title="Nenhum epic ainda">
          Agrupe issues em epics como “Capítulo 2” ou “Apresentação” para acompanhar o progresso.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              onEdit={() => setDialog({ open: true, epic })}
              onDelete={() => setDeleting(epic)}
            />
          ))}
        </div>
      )}

      <EpicDialog open={dialog.open} epic={dialog.epic} onOpenChange={(open) => setDialog({ open })} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>As issues do epic são mantidas, apenas ficam sem epic.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleting && remove.mutate(deleting.id, { onSuccess: () => toast.success('Epic excluído') })
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EpicCard({ epic, onEdit, onDelete }: { epic: Epic; onEdit: () => void; onDelete: () => void }) {
  const project = useCurrentProject()
  const [open, setOpen] = useState(false)
  const { data: issues = [], isLoading } = useIssues(open ? project.id : undefined, { epic_id: epic.id })
  const pct = epic.total_points ? Math.round((epic.done_points / epic.total_points) * 100) : 0

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
          />
          <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: epic.color }} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{epic.title}</div>
            {epic.description && <div className="truncate text-xs text-muted-foreground">{epic.description}</div>}
          </div>
        </button>
        <div className="hidden w-64 shrink-0 space-y-1 sm:block">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {epic.done_count}/{epic.issue_count} issues
            </span>
            <span className="tabular-nums">
              {epic.done_points}/{epic.total_points} pts · <span className="font-medium text-foreground">{pct}%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: epic.color }}
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Ações do epic">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {open && (
        <div className="border-t px-4 py-2">
          {isLoading ? <Skeleton className="h-20" /> : <IssueList issues={issues} empty="Nenhuma issue neste epic." />}
        </div>
      )}
    </section>
  )
}

function EpicDialog({ open, epic, onOpenChange }: { open: boolean; epic?: Epic; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{epic ? 'Editar epic' : 'Novo epic'}</DialogTitle>
          <DialogDescription>Ex.: “Capítulo 2 – Referencial teórico”.</DialogDescription>
        </DialogHeader>
        <EpicForm epic={epic} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function EpicForm({ epic, onDone }: { epic?: Epic; onDone: () => void }) {
  const project = useCurrentProject()
  const { create, update } = useEpicMutations(project.id)
  const [title, setTitle] = useState(epic?.title ?? '')
  const [description, setDescription] = useState(epic?.description ?? '')
  const [color, setColor] = useState(epic?.color ?? SWATCHES[0]!)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = { title, description, color }
    const onSuccess = () => {
      toast.success(epic ? 'Epic atualizado' : 'Epic criado')
      onDone()
    }
    if (epic) update.mutate({ id: epic.id, body }, { onSuccess })
    else create.mutate(body, { onSuccess })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="e-title">Título</Label>
        <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="e-desc">Descrição</Label>
        <Textarea
          id="e-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-16"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Cor</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!title.trim() || create.isPending || update.isPending}>
          {epic ? 'Salvar' : 'Criar epic'}
        </Button>
      </DialogFooter>
    </form>
  )
}
