import { Check, Link2, MoreHorizontal, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ApiError, type IssueDetail, type IssueUpdate } from '@/api/client'
import { useDeleteIssue, useIssue, useUpdateIssue } from '@/api/hooks/issues'
import { useEpics, useLabels } from '@/api/hooks/meta'
import { useSprints } from '@/api/hooks/sprints'
import { EmptyState } from '@/components/page'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { DrawerState } from '@/hooks/use-open-issue'
import { fmtDateTime } from '@/lib/dates'
import { ActivityFeed } from './activity-feed'
import { TypeIcon } from './badges'
import { Checklist } from './checklist'
import { DescriptionEditor, TitleEditor } from './editors'
import {
  DueDatePicker,
  EpicPicker,
  LabelsPicker,
  PointsPicker,
  PriorityPicker,
  SprintPicker,
  StatusPicker,
  TypePicker,
} from './fields'

/** Detalhe da issue como side panel; a URL /issues/TCC-12 funciona direto. */
export function IssueDrawer({ issueKey }: { issueKey: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: issue, isLoading, error } = useIssue(issueKey)
  const background = (location.state as DrawerState | null)?.background
  const close = () => navigate(background ?? '/board')

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent
        className="w-full gap-0 p-0 outline-none data-[side=right]:w-full data-[side=right]:sm:max-w-4xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {issue ? (
          <IssuePanel key={issue.id} issue={issue} onClose={close} />
        ) : (
          <>
            <SheetTitle className="sr-only">{issueKey}</SheetTitle>
            {isLoading ? (
              <div className="space-y-4 p-6">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-40" />
              </div>
            ) : (
              <EmptyState icon={X} title={`Issue ${issueKey.toUpperCase()} não encontrada`} className="h-full">
                {error && !(error instanceof ApiError && error.status === 404) && <p>{error.message}</p>}
                <Button size="sm" variant="outline" className="mt-2" onClick={close}>
                  Fechar
                </Button>
              </EmptyState>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function IssuePanel({ issue, onClose }: { issue: IssueDetail; onClose: () => void }) {
  const projectId = issue.project_id
  const { data: sprints = [] } = useSprints(projectId)
  const { data: epics = [] } = useEpics(projectId)
  const { data: labels = [] } = useLabels(projectId)
  const update = useUpdateIssue(projectId)
  const remove = useDeleteIssue(projectId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const save = (body: IssueUpdate) => update.mutate({ id: issue.id, key: issue.key, body })

  const copyLink = async () => {
    await navigator.clipboard?.writeText(`${window.location.origin}/issues/${issue.key}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <TypeIcon type={issue.type} />
        <SheetTitle className="text-[13px] font-medium text-muted-foreground">{issue.key}</SheetTitle>
        <SheetDescription className="sr-only">{issue.title}</SheetDescription>
        <span className="text-xs text-muted-foreground/70">
          {update.isPending ? 'Salvando…' : `Atualizada ${fmtDateTime(issue.updated_at)}`}
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" onClick={copyLink} aria-label="Copiar link">
          {copied ? <Check /> : <Link2 />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Mais ações">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Excluir issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar (Esc)">
          <X />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <main className="min-w-0 flex-1 space-y-8 px-6 py-5 md:overflow-y-auto">
          <TitleEditor value={issue.title} onSave={(title) => save({ title })} />
          <DescriptionEditor value={issue.description} onSave={(description) => save({ description })} />
          <Checklist issue={issue} />
          <ActivityFeed issue={issue} sprints={sprints} epics={epics} />
        </main>

        <aside className="shrink-0 space-y-1 border-t p-4 md:w-72 md:overflow-y-auto md:border-t-0 md:border-l">
          <Property label="Status">
            <StatusPicker variant="row" value={issue.status} onChange={(status) => save({ status })} />
          </Property>
          <Property label="Tipo">
            <TypePicker variant="row" value={issue.type} onChange={(type) => save({ type })} />
          </Property>
          <Property label="Prioridade">
            <PriorityPicker variant="row" value={issue.priority} onChange={(priority) => save({ priority })} />
          </Property>
          <Property label="Pontos">
            <PointsPicker
              variant="row"
              value={issue.story_points}
              onChange={(story_points) => save({ story_points })}
            />
          </Property>
          <Property label="Sprint">
            <SprintPicker
              variant="row"
              value={issue.sprint_id}
              sprints={sprints}
              onChange={(sprint_id) => save({ sprint_id })}
            />
          </Property>
          <Property label="Epic">
            <EpicPicker variant="row" value={issue.epic_id} epics={epics} onChange={(epic_id) => save({ epic_id })} />
          </Property>
          <Property label="Labels">
            <LabelsPicker
              variant="row"
              value={issue.labels.map((l) => l.id)}
              labels={labels}
              onChange={(label_ids) => save({ label_ids })}
            />
          </Property>
          <Property label="Prazo">
            <DueDatePicker variant="row" value={issue.due_date} onChange={(due_date) => save({ due_date })} />
          </Property>
          <div className="space-y-1 px-2 pt-4 text-[11px] text-muted-foreground">
            <p>Criada em {fmtDateTime(issue.created_at)}</p>
            {issue.completed_at && <p>Concluída em {fmtDateTime(issue.completed_at)}</p>}
          </div>
        </aside>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {issue.key}?</AlertDialogTitle>
            <AlertDialogDescription>
              A issue, o checklist e o histórico serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                remove.mutate(issue.id, {
                  onSuccess: () => {
                    toast.success(`${issue.key} excluída`)
                    onClose()
                  },
                })
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

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/field grid grid-cols-[84px_1fr] items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
