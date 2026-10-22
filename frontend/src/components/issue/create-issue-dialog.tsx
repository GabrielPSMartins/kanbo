import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { IssueCreate } from '@/api/client'
import { useCreateIssue } from '@/api/hooks/issues'
import { useEpics, useLabels } from '@/api/hooks/meta'
import { useSprints } from '@/api/hooks/sprints'
import { Kbd } from '@/components/kbd'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useOpenIssue } from '@/hooks/use-open-issue'
import { useCurrentProject } from '@/providers/project'
import { useUI } from '@/providers/ui'
import {
  DueDatePicker,
  EpicPicker,
  LabelsPicker,
  PointsPicker,
  PriorityPicker,
  SprintPicker,
  TypePicker,
} from './fields'

type Draft = Required<Pick<IssueCreate, 'title' | 'description' | 'type' | 'priority'>> & {
  story_points: number | null
  sprint_id: number | null
  epic_id: number | null
  due_date: string | null
  label_ids: number[]
}

const empty = (d: Partial<IssueCreate> = {}): Draft => ({
  title: d.title ?? '',
  description: d.description ?? '',
  type: d.type ?? 'task',
  priority: d.priority ?? 'none',
  story_points: d.story_points ?? null,
  sprint_id: d.sprint_id ?? null,
  epic_id: d.epic_id ?? null,
  due_date: d.due_date ?? null,
  label_ids: d.label_ids ?? [],
})

export function CreateIssueDialog() {
  const { createIssue: defaults, closeCreateIssue } = useUI()
  return (
    <Dialog open={defaults !== null} onOpenChange={(o) => !o && closeCreateIssue()}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl" showCloseButton={false}>
        {/* o conteúdo desmonta ao fechar: cada abertura começa com um rascunho novo */}
        {defaults && <CreateIssueForm defaults={defaults} onClose={closeCreateIssue} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateIssueForm({ defaults, onClose }: { defaults: Partial<IssueCreate>; onClose: () => void }) {
  const closeCreateIssue = onClose
  const project = useCurrentProject()
  const { data: sprints = [] } = useSprints(project.id)
  const { data: epics = [] } = useEpics(project.id)
  const { data: labels = [] } = useLabels(project.id)
  const create = useCreateIssue(project.id)
  const openIssue = useOpenIssue()
  const [draft, setDraft] = useState<Draft>(() => empty(defaults))
  const [createMore, setCreateMore] = useState(false)

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!draft.title.trim() || create.isPending) return
    create.mutate(draft, {
      onSuccess: (issue) => {
        toast.success(`${issue.key} criada`, {
          description: issue.title,
          action: { label: 'Abrir', onClick: () => openIssue(issue.key) },
        })
        if (createMore) setDraft((d) => ({ ...d, title: '', description: '' }))
        else closeCreateIssue()
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
      }}
    >
      <div className="flex items-center gap-2 px-5 pt-4 text-xs text-muted-foreground">
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium">{project.key}</span>
        <DialogTitle className="text-xs font-normal">Nova issue</DialogTitle>
        <DialogDescription className="sr-only">Preencha o título e as propriedades da issue</DialogDescription>
      </div>
      <div className="px-5 pt-3">
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Título da issue"
          className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/60"
        />
        <Textarea
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Descrição (markdown)…"
          className="mt-2 min-h-24 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 px-5 pt-2 pb-4">
        <TypePicker value={draft.type} onChange={(v) => set('type', v)} />
        <PriorityPicker value={draft.priority} onChange={(v) => set('priority', v)} />
        <PointsPicker value={draft.story_points} onChange={(v) => set('story_points', v)} />
        <SprintPicker value={draft.sprint_id} onChange={(v) => set('sprint_id', v)} sprints={sprints} />
        <EpicPicker value={draft.epic_id} onChange={(v) => set('epic_id', v)} epics={epics} />
        <LabelsPicker value={draft.label_ids} onChange={(v) => set('label_ids', v)} labels={labels} />
        <DueDatePicker value={draft.due_date} onChange={(v) => set('due_date', v)} />
      </div>
      <div className="flex items-center gap-3 border-t px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={createMore} onCheckedChange={(v) => setCreateMore(v === true)} />
          Criar mais
        </label>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={closeCreateIssue}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!draft.title.trim() || create.isPending}>
          Criar issue <Kbd className="border-white/20 bg-white/10 text-primary-foreground">Ctrl ↵</Kbd>
        </Button>
      </div>
    </form>
  )
}
