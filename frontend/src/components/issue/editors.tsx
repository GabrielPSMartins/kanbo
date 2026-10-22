import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { cn } from '@/lib/utils'

const AUTOSAVE_MS = 700

/** Título editável inline; salva com debounce e ao sair do campo. */
export function TitleEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [title, setTitle] = useState(value)
  const [debounced, flush] = useDebouncedCallback(
    (v: string) => v.trim() && v !== value && onSave(v.trim()),
    AUTOSAVE_MS,
  )

  return (
    <textarea
      value={title}
      rows={1}
      onChange={(e) => {
        setTitle(e.target.value)
        debounced(e.target.value)
      }}
      onBlur={() => {
        if (!title.trim()) setTitle(value)
        flush()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className="field-sizing-content w-full resize-none bg-transparent text-xl leading-snug font-semibold outline-none"
      aria-label="Título"
    />
  )
}

/** Descrição em markdown com abas Editar / Preview e autosave. */
export function DescriptionEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value)
  const [mode, setMode] = useState<'edit' | 'preview'>(value ? 'preview' : 'edit')
  const [debounced, flush] = useDebouncedCallback((v: string) => v !== value && onSave(v), AUTOSAVE_MS)

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1">
        <h3 className="mr-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Descrição</h3>
        {(['edit', 'preview'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              flush()
              setMode(m)
            }}
            className={cn(
              'rounded-md px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground',
              mode === m && 'bg-muted text-foreground',
            )}
          >
            {m === 'edit' ? 'Editar' : 'Preview'}
          </button>
        ))}
      </div>
      {mode === 'edit' ? (
        <Textarea
          autoFocus={!!value}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            debounced(e.target.value)
          }}
          onBlur={flush}
          placeholder="Adicione uma descrição… (suporta **markdown**, listas, `código`, tabelas)"
          className="field-sizing-content min-h-32 font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <div
          onDoubleClick={() => setMode('edit')}
          className="min-h-16 cursor-text rounded-md border border-transparent px-1 py-0.5 hover:border-border"
          title="Clique duas vezes para editar"
        >
          {text.trim() ? (
            <div className="markdown">
              <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem descrição.</p>
          )}
        </div>
      )}
    </section>
  )
}
