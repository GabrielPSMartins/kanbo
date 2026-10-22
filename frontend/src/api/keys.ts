import type { IssueFilters } from './hooks/issues'

export const qk = {
  projects: ['projects'] as const,
  issues: (projectId: number, filters?: IssueFilters) =>
    filters ? (['issues', projectId, filters] as const) : (['issues', projectId] as const),
  issue: (key: string) => ['issue', key.toUpperCase()] as const,
  sprints: (projectId: number) => ['sprints', projectId] as const,
  sprint: (sprintId: number) => ['sprint', sprintId] as const,
  burndown: (sprintId: number) => ['burndown', sprintId] as const,
  epics: (projectId: number) => ['epics', projectId] as const,
  labels: (projectId: number) => ['labels', projectId] as const,
  dashboard: (projectId: number) => ['dashboard', projectId] as const,
}
