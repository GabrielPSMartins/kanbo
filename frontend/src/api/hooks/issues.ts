import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, unwrap, type Issue, type IssueCreate, type IssueDetail, type IssueMove, type IssueUpdate } from '../client'
import type { paths } from '../schema'
import { qk } from '../keys'

export type IssueFilters = NonNullable<paths['/api/v1/projects/{project_id}/issues']['get']['parameters']['query']>

export function useIssues(projectId: number | undefined, filters: IssueFilters = {}) {
  return useQuery({
    queryKey: qk.issues(projectId ?? 0, filters),
    enabled: !!projectId,
    queryFn: async () => {
      const page = await unwrap(
        api.GET('/api/v1/projects/{project_id}/issues', {
          params: { path: { project_id: projectId! }, query: filters },
        }),
      )
      return page.items
    },
  })
}

export function useIssue(key: string | undefined) {
  return useQuery({
    queryKey: qk.issue(key ?? ''),
    enabled: !!key,
    queryFn: () => unwrap(api.GET('/api/v1/issues/by-key/{key}', { params: { path: { key: key! } } })),
  })
}

/** Invalida tudo que depende de issues de um projeto (listas, sprints, dashboard, epics). */
export function invalidateProjectIssues(qc: QueryClient, projectId: number) {
  for (const key of [qk.issues(projectId), qk.sprints(projectId), qk.dashboard(projectId), qk.epics(projectId)]) {
    qc.invalidateQueries({ queryKey: key })
  }
  qc.invalidateQueries({ queryKey: ['burndown'] })
}

function storeDetail(qc: QueryClient, issue: IssueDetail) {
  qc.setQueryData(qk.issue(issue.key), issue)
}

export function useCreateIssue(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: IssueCreate) =>
      unwrap(api.POST('/api/v1/projects/{project_id}/issues', { params: { path: { project_id: projectId } }, body })),
    onSuccess: (issue) => {
      storeDetail(qc, issue)
      invalidateProjectIssues(qc, projectId)
    },
  })
}

/** Aplica um patch otimista em todas as listas de issues em cache. */
function patchListsOptimistically(qc: QueryClient, projectId: number, id: number, patch: Partial<Issue>) {
  qc.setQueriesData<Issue[]>({ queryKey: qk.issues(projectId) }, (old) =>
    old?.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  )
}

export function useUpdateIssue(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: IssueUpdate }) =>
      unwrap(api.PATCH('/api/v1/issues/{issue_id}', { params: { path: { issue_id: id } }, body })),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: qk.issues(projectId) })
      const snapshot = qc.getQueriesData<Issue[]>({ queryKey: qk.issues(projectId) })
      const { label_ids: _ignored, ...simple } = body
      patchListsOptimistically(qc, projectId, id, simple as Partial<Issue>)
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSuccess: (issue) => storeDetail(qc, issue),
    onSettled: () => invalidateProjectIssues(qc, projectId),
  })
}

export type MoveVars = { issue: Issue; body: IssueMove; optimistic: Partial<Issue> }

/** Drag-and-drop com optimistic update: `optimistic` já traz a nova position/status/sprint. */
export function useMoveIssue(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ issue, body }: MoveVars) =>
      unwrap(api.POST('/api/v1/issues/{issue_id}/move', { params: { path: { issue_id: issue.id } }, body })),
    onMutate: async ({ issue, optimistic }) => {
      await qc.cancelQueries({ queryKey: qk.issues(projectId) })
      const snapshot = qc.getQueriesData<Issue[]>({ queryKey: qk.issues(projectId) })
      qc.setQueriesData<Issue[]>({ queryKey: qk.issues(projectId) }, (old) =>
        old
          ?.map((i) => (i.id === issue.id ? { ...i, ...optimistic } : i))
          .sort((a, b) => a.position - b.position || a.id - b.id),
      )
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSuccess: (issue) => storeDetail(qc, issue),
    onSettled: () => invalidateProjectIssues(qc, projectId),
  })
}

export function useDeleteIssue(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(api.DELETE('/api/v1/issues/{issue_id}', { params: { path: { issue_id: id } } })),
    onSuccess: () => invalidateProjectIssues(qc, projectId),
  })
}
