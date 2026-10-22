import { useNavigate, useLocation } from 'react-router'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIssue } from '@/api/hooks/issues'
import type { DrawerState } from '@/hooks/use-open-issue'

export function IssueDrawer({ issueKey }: { issueKey: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: issue } = useIssue(issueKey)
  const background = (location.state as DrawerState | null)?.background

  const close = () => navigate(background ?? '/board')

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetTitle className="p-4">{issue ? `${issue.key} · ${issue.title}` : issueKey}</SheetTitle>
      </SheetContent>
    </Sheet>
  )
}
