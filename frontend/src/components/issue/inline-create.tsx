import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import type { IssueCreate, IssueType } from '@/api/client'
import { useCreateIssue } from '@/api/hooks/issues'
import { useCurrentProject } from '@/providers/project'
import { TypePicker } from './fields'

/** "+ Criar issue" no fim de uma seção: Enter cria e mantém o campo aberto, Esc fecha. */
export function InlineCreate({ defaults, label = 'Criar issue' }: { defaults: Partial<IssueCreate>; label?: string }) {
  const project = useCurrentProject()
  const create = useCreateIssue(project.id)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    const t = title.trim()
    if (!t) return
    create.mutate({ ...defaults, title: t, type })
    setTitle('')
    inputRef.current?.focus()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 px-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        {label}
      </button>
    )
  }

  return (
    <div className="flex h-10 items-center gap-2 bg-card px-2 ring-1 ring-primary/50 ring-inset">
      <TypePicker value={type} onChange={setType} className="h-7 border-0" />
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') {
            e.stopPropagation()
            setOpen(false)
            setTitle('')
          }
        }}
        onBlur={() => !title && setOpen(false)}
        placeholder="O que precisa ser feito? (Enter para criar, Esc para fechar)"
        className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  )
}
