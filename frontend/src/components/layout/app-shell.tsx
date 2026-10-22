import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useHotkey } from '@/hooks/use-hotkey'
import { useProjectContext } from '@/providers/project'
import { useUI } from '@/providers/ui'
import { NoProject } from './no-project'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const { project, isLoading } = useProjectContext()
  const { openCreateIssue, setPaletteOpen } = useUI()
  const [mobileNav, setMobileNav] = useState(false)

  useHotkey('c', () => openCreateIssue(), { enabled: !!project })
  useHotkey('k', () => setPaletteOpen(true), { mod: true })

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <Sidebar onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileNav(true)} />
        <main className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : project ? (
            <Outlet />
          ) : (
            <NoProject />
          )}
        </main>
      </div>
    </div>
  )
}
