import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Project } from '@/api/client'
import { useProjects } from '@/api/hooks/projects'
import { storage } from '@/lib/storage'

type Ctx = {
  project: Project | undefined
  projects: Project[]
  isLoading: boolean
  setProjectId: (id: number) => void
}

const ProjectContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'kanbo:project'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: projects = [], isLoading } = useProjects()
  const [projectId, setProjectId] = useState<number | null>(() => Number(storage.get(STORAGE_KEY)) || null)

  const project = projects.find((p) => p.id === projectId) ?? projects[0]

  useEffect(() => {
    if (project) storage.set(STORAGE_KEY, String(project.id))
  }, [project])

  const value = useMemo(() => ({ project, projects, isLoading, setProjectId }), [project, projects, isLoading])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjectContext fora do ProjectProvider')
  return ctx
}

/** Projeto atual — só usar dentro de telas que exigem projeto (o AppShell garante). */
export function useCurrentProject(): Project {
  const { project } = useProjectContext()
  if (!project) throw new Error('Nenhum projeto selecionado')
  return project
}
