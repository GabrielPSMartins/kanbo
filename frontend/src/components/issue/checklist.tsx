import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { IssueDetail } from '@/api/client'
import { useChecklist } from '@/api/hooks/checklist'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function Checklist({ issue }: { issue: IssueDetail }) {
  const { add, update, remove } = useChecklist(issue)
  const [text, setText] = useState('')
  const { checklist_done: done, checklist_total: total } = issue

  const submit = () => {
    if (!text.trim()) return
    add.mutate(text.trim())
    setText('')
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Checklist</h3>
        {total > 0 && (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              {done}/{total}
            </span>
            <Progress value={(done / total) * 100} className="h-1 max-w-40" />
          </>
        )}
      </div>
      <ul className="space-y-0.5">
        {issue.checklist.map((item) => (
          <li key={item.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50">
            <Checkbox checked={item.done} onCheckedChange={(v) => update.mutate({ id: item.id, done: v === true })} />
            <input
              defaultValue={item.text}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== item.text) update.mutate({ id: item.id, text: v })
                else e.target.value = item.text
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className={cn(
                'flex-1 bg-transparent text-[13px] outline-none',
                item.done && 'text-muted-foreground line-through',
              )}
            />
            <button
              onClick={() => remove.mutate(item.id)}
              className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
              aria-label="Remover item"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 px-1">
        <Plus className="size-4 text-muted-foreground" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Adicionar subtarefa…"
          className="h-7 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
        />
      </div>
    </section>
  )
}
