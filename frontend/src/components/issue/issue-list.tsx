import type { Issue } from '@/api/client'
import { useOpenIssue } from '@/hooks/use-open-issue'
import { DueDate, PointsBadge, PriorityIcon, StatusIcon, TypeIcon } from './badges'

/** Lista compacta clicável (dashboard, sprint, epic). */
export function IssueList({ issues, empty }: { issues: Issue[]; empty: string }) {
  const openIssue = useOpenIssue()
  if (!issues.length) return <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="-mx-2">
      {issues.map((i) => (
        <li key={i.id}>
          <button
            onClick={() => openIssue(i.key)}
            className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors hover:bg-accent"
          >
            <StatusIcon status={i.status} />
            <TypeIcon type={i.type} />
            <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{i.key}</span>
            <span className="min-w-0 flex-1 truncate">{i.title}</span>
            <DueDate issue={i} />
            <PriorityIcon priority={i.priority} />
            <PointsBadge points={i.story_points} />
          </button>
        </li>
      ))}
    </ul>
  )
}
