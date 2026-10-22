import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export const api = createClient<paths>({ baseUrl: '' })

// Aliases dos tipos gerados a partir do OpenAPI (não editar à mão: `make gen-api`)
type S = components['schemas']
export type Project = S['ProjectRead']
export type Issue = S['IssueRead']
export type IssueDetail = S['IssueDetail']
export type IssueCreate = S['IssueCreate']
export type IssueUpdate = S['IssueUpdate']
export type IssueMove = S['IssueMove']
export type IssueStatus = S['IssueStatus']
export type IssueType = S['IssueType']
export type IssuePriority = S['IssuePriority']
export type Sprint = S['SprintWithStats']
export type SprintCreate = S['SprintCreate']
export type SprintClose = S['SprintClose']
export type Epic = S['EpicWithProgress']
export type Label = S['LabelRead']
export type ChecklistItem = S['ChecklistItemRead']
export type Activity = S['ActivityRead']
export type Burndown = S['Burndown']
export type Dashboard = S['Dashboard']

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, detail: string) {
    super(detail)
    this.status = status
    this.code = code
  }
}

type FetchResult<T> = { data?: T; error?: unknown; response: Response }

/** Desembrulha a resposta do openapi-fetch: retorna `data` ou lança ApiError({detail, code}). */
export async function unwrap<T>(promise: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await promise
  if (error !== undefined || !response.ok) {
    const body = (error ?? {}) as { detail?: unknown; code?: unknown }
    const detail = typeof body.detail === 'string' ? body.detail : `Erro ${response.status}`
    const code = typeof body.code === 'string' ? body.code : 'error'
    throw new ApiError(response.status, code, detail)
  }
  return data as T
}
