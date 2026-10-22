import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useCreateProject } from '@/api/hooks/projects'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjectContext } from '@/providers/project'

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const create = useCreateProject()
  const { setProjectId } = useProjectContext()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      { name, key },
      {
        onSuccess: (p) => {
          setProjectId(p.id)
          onOpenChange(false)
          setName('')
          setKey('')
          toast.success(`Projeto ${p.name} criado`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Nome</Label>
            <Input
              id="p-name"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value)
                if (!key || key === suggestKey(name)) setKey(suggestKey(e.target.value))
              }}
              placeholder="Meu TCC"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-key">Key (prefixo das issues)</Label>
            <Input
              id="p-key"
              value={key}
              maxLength={10}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="TCC"
            />
            <p className="text-xs text-muted-foreground">
              Issues serão numeradas como {key || 'KEY'}-1, {key || 'KEY'}-2…
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || key.length < 2 || create.isPending}>
              Criar projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function suggestKey(name: string) {
  const words = name
    .normalize('NFD')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const key = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '').slice(0, 4)
  return key.toUpperCase().slice(0, 6)
}
