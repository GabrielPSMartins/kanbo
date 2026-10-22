import { Moon, Plus, Sun, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { Label as LabelT, Project } from '@/api/client'
import { useLabelMutations, useLabels } from '@/api/hooks/meta'
import { useUpdateProject } from '@/api/hooks/projects'
import { ColorPicker } from '@/components/color-picker'
import { PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { SWATCHES } from '@/lib/meta'
import { cn } from '@/lib/utils'
import { useCurrentProject } from '@/providers/project'
import { useTheme, type Theme } from '@/providers/theme'

export default function SettingsPage() {
  const project = useCurrentProject()
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <PageHeader title="Configurações" description="Projeto, labels e aparência." />
      <Card title="Projeto" description="Nome, key (prefixo das issues) e cor.">
        <ProjectForm key={project.id} project={project} />
      </Card>
      <Card title="Labels" description="Etiquetas para classificar issues.">
        <Labels />
      </Card>
      <Card title="Tema" description="O tema escuro é o padrão.">
        <ThemeSwitch />
      </Card>
    </div>
  )
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-5 py-3">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ProjectForm({ project }: { project: Project }) {
  const update = useUpdateProject(project.id)
  const [name, setName] = useState(project.name)
  const [key, setKey] = useState(project.key)
  const [description, setDescription] = useState(project.description)
  const [color, setColor] = useState(project.color)
  const dirty =
    name !== project.name || key !== project.key || description !== project.description || color !== project.color

  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate({ name, key, description, color }, { onSuccess: () => toast.success('Projeto atualizado') })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="grid gap-1.5">
          <Label htmlFor="pr-name">Nome</Label>
          <Input id="pr-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pr-key">Key</Label>
          <Input
            id="pr-key"
            value={key}
            maxLength={10}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
        </div>
      </div>
      {key !== project.key && (
        <p className="-mt-2 text-xs text-priority-medium">
          As issues passarão a ser {key || '?'}-1, {key || '?'}-2… Links antigos ({project.key}-N) deixam de funcionar.
        </p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="pr-desc">Descrição</Label>
        <Textarea
          id="pr-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-16"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Cor</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div>
        <Button type="submit" size="sm" disabled={!dirty || !name.trim() || key.length < 2 || update.isPending}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}

function Labels() {
  const project = useCurrentProject()
  const { data: labels = [] } = useLabels(project.id)
  const { create } = useLabelMutations(project.id)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[1]!)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate({ name: name.trim(), color }, { onSuccess: () => setName('') })
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-md border">
        {labels.map((l) => (
          <LabelRow key={l.id} label={l} />
        ))}
        {labels.length === 0 && <li className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhuma label.</li>}
      </ul>
      <form onSubmit={submit} className="flex items-center gap-2">
        <ColorDot color={color} onChange={setColor} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova label"
          className="h-8 max-w-60"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!name.trim() || create.isPending}>
          <Plus /> Adicionar
        </Button>
      </form>
    </div>
  )
}

function LabelRow({ label }: { label: LabelT }) {
  const project = useCurrentProject()
  const { update, remove } = useLabelMutations(project.id)
  return (
    <li className="group flex items-center gap-2 px-3 py-1.5">
      <ColorDot color={label.color} onChange={(color) => update.mutate({ id: label.id, body: { color } })} />
      <input
        defaultValue={label.name}
        onBlur={(e) => {
          const v = e.target.value.trim()
          if (v && v !== label.name) update.mutate({ id: label.id, body: { name: v } })
          else e.target.value = label.name
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-7 flex-1 rounded-sm bg-transparent px-1 text-[13px] outline-none focus:bg-muted"
        aria-label="Nome da label"
      />
      <Button
        variant="ghost"
        size="icon-xs"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => remove.mutate(label.id, { onSuccess: () => toast.success(`Label “${label.name}” excluída`) })}
        aria-label={`Excluir ${label.name}`}
      >
        <Trash2 />
      </Button>
    </li>
  )
}

function ColorDot({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-5 shrink-0 rounded-full ring-1 ring-border transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
          aria-label="Escolher cor"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <ColorPicker value={color} onChange={onChange} className="grid grid-cols-6" />
      </PopoverContent>
    </Popover>
  )
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'light', label: 'Claro', icon: Sun },
  ]
  return (
    <div className="inline-flex rounded-md border p-0.5" role="radiogroup">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3 py-1 text-[13px] text-muted-foreground transition-colors',
            theme === value && 'bg-muted text-foreground',
          )}
        >
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  )
}
