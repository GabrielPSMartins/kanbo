import type { Project } from '@/api/client'
import { cn } from '@/lib/utils'

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <div className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden>
          <rect x="2" y="2" width="3.5" height="12" rx="1" />
          <rect x="6.25" y="2" width="3.5" height="8" rx="1" opacity=".8" />
          <rect x="10.5" y="2" width="3.5" height="5" rx="1" opacity=".6" />
        </svg>
      </div>
      <span className="text-[15px]">Kanbo</span>
    </div>
  )
}

export function ProjectAvatar({ project, className }: { project: Pick<Project, 'key' | 'color'>; className?: string }) {
  return (
    <span
      className={cn('grid size-5 shrink-0 place-items-center rounded-[5px] text-[10px] font-bold text-white', className)}
      style={{ backgroundColor: project.color }}
    >
      {project.key.slice(0, 1)}
    </span>
  )
}
