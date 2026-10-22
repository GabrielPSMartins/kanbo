import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap, type Project } from '../client'
import type { components } from '../schema'
import { qk } from '../keys'

export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: () => unwrap(api.GET('/api/v1/projects')),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: components['schemas']['ProjectCreate']) => unwrap(api.POST('/api/v1/projects', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  })
}

export function useUpdateProject(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: components['schemas']['ProjectUpdate']) =>
      unwrap(api.PATCH('/api/v1/projects/{project_id}', { params: { path: { project_id: projectId } }, body })),
    onSuccess: (project: Project) => {
      qc.setQueryData<Project[]>(qk.projects, (old) => old?.map((p) => (p.id === project.id ? project : p)))
      // a key do projeto compõe as keys das issues
      qc.invalidateQueries({ queryKey: ['issues', projectId] })
      qc.invalidateQueries({ queryKey: ['issue'] })
    },
  })
}
