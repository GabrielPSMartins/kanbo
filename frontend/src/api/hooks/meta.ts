import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'
import { qk } from '../keys'
import { invalidateProjectIssues } from './issues'

type S = components['schemas']

export function useEpics(projectId: number | undefined) {
  return useQuery({
    queryKey: qk.epics(projectId ?? 0),
    enabled: !!projectId,
    queryFn: () =>
      unwrap(api.GET('/api/v1/projects/{project_id}/epics', { params: { path: { project_id: projectId! } } })),
  })
}

export function useLabels(projectId: number | undefined) {
  return useQuery({
    queryKey: qk.labels(projectId ?? 0),
    enabled: !!projectId,
    queryFn: () =>
      unwrap(api.GET('/api/v1/projects/{project_id}/labels', { params: { path: { project_id: projectId! } } })),
  })
}

export function useDashboard(projectId: number | undefined) {
  return useQuery({
    queryKey: qk.dashboard(projectId ?? 0),
    enabled: !!projectId,
    queryFn: () =>
      unwrap(api.GET('/api/v1/projects/{project_id}/dashboard', { params: { path: { project_id: projectId! } } })),
  })
}

export function useEpicMutations(projectId: number) {
  const qc = useQueryClient()
  const onSuccess = () => invalidateProjectIssues(qc, projectId)
  return {
    create: useMutation({
      mutationFn: (body: S['EpicCreate']) =>
        unwrap(api.POST('/api/v1/projects/{project_id}/epics', { params: { path: { project_id: projectId } }, body })),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: S['EpicUpdate'] }) =>
        unwrap(api.PATCH('/api/v1/epics/{epic_id}', { params: { path: { epic_id: id } }, body })),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => unwrap(api.DELETE('/api/v1/epics/{epic_id}', { params: { path: { epic_id: id } } })),
      onSuccess,
    }),
  }
}

export function useLabelMutations(projectId: number) {
  const qc = useQueryClient()
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: qk.labels(projectId) })
    invalidateProjectIssues(qc, projectId)
  }
  return {
    create: useMutation({
      mutationFn: (body: S['LabelCreate']) =>
        unwrap(api.POST('/api/v1/projects/{project_id}/labels', { params: { path: { project_id: projectId } }, body })),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: S['LabelUpdate'] }) =>
        unwrap(api.PATCH('/api/v1/labels/{label_id}', { params: { path: { label_id: id } }, body })),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: number) => unwrap(api.DELETE('/api/v1/labels/{label_id}', { params: { path: { label_id: id } } })),
      onSuccess,
    }),
  }
}
