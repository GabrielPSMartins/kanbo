import { FolderKanban } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from './create-project-dialog'

export function NoProject() {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm text-center">
        <FolderKanban className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-base font-semibold">Nenhum projeto ainda</h2>
        <p className="mt-1 mb-4 text-muted-foreground">
          Crie um projeto para começar — ou rode <code className="rounded bg-muted px-1">make seed</code> para ver o
          exemplo do TCC.
        </p>
        <Button onClick={() => setOpen(true)}>Criar projeto</Button>
      </div>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
