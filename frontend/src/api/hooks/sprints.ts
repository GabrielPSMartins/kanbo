import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap, type SprintClose, type SprintCreate } from '../client'
import type { components } from '../schema'
import { qk } from '../keys'
import { invalidateProjectIssues } from './issues'

export function useSprints(projectId: number | undefined) {
  return useQuery({
    queryKey: qk.sprints(projectId ?? 0),
    enabled: !!projectId,
    queryFn: () =>
      unwrap(api.GET('/api/v1/projects/{project_id}/sprints', { params: { path: { project_id: projectId! } } })),
  })
}

export function useActiveSprint(projectId: number | undefined) {
  const query = useSprints(projectId)
  return { ...query, data: query.data?.find((s) => s.status === 'active') }
}

export function useBurndown(sprintId: number | undefined) {
  return useQuery({
    queryKey: qk.burndown(sprintId ?? 0),
    enabled: !!sprintId,
    queryFn: () =>
      unwrap(api.GET('/api/v1/sprints/{sprint_id}/burndown', { params: { path: { sprint_id: sprintId! } } })),
  })
}

export function useSprintMutations(projectId: number) {
  const qc = useQueryClient()
  const onSuccess = () => invalidateProjectIssues(qc, projectId)

  const create = useMutation({
    mutationFn: (body: SprintCreate) =>
      unwrap(api.POST('/api/v1/projects/{project_id}/sprints', { params: { path: { project_id: projectId } }, body })),
    onSuccess,
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: components['schemas']['SprintUpdate'] }) =>
      unwrap(api.PATCH('/api/v1/sprints/{sprint_id}', { params: { path: { sprint_id: id } }, body })),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: (id: number) => unwrap(api.DELETE('/api/v1/sprints/{sprint_id}', { params: { path: { sprint_id: id } } })),
    onSuccess,
  })
  const start = useMutation({
    mutationFn: ({ id, body }: { id: number; body?: components['schemas']['SprintStart'] }) =>
      unwrap(api.POST('/api/v1/sprints/{sprint_id}/start', { params: { path: { sprint_id: id } }, body })),
    onSuccess,
  })
  const close = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SprintClose }) =>
      unwrap(api.POST('/api/v1/sprints/{sprint_id}/close', { params: { path: { sprint_id: id } }, body })),
    onSuccess,
  })
  return { create, update, remove, start, close }
}
