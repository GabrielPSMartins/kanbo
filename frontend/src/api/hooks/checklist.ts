import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, unwrap, type ChecklistItem, type IssueDetail } from '../client'
import { qk } from '../keys'

/** Checklist com updates otimistas direto no cache do detalhe da issue. */
export function useChecklist(issue: IssueDetail) {
  const qc = useQueryClient()
  const key = qk.issue(issue.key)
  const path = { issue_id: issue.id }

  const patchCache = (fn: (items: ChecklistItem[]) => ChecklistItem[]) =>
    qc.setQueryData<IssueDetail>(key, (old) => {
      if (!old) return old
      const checklist = fn(old.checklist)
      return {
        ...old,
        checklist,
        checklist_total: checklist.length,
        checklist_done: checklist.filter((c) => c.done).length,
      }
    })

  const settle = () => {
    qc.invalidateQueries({ queryKey: key })
    qc.invalidateQueries({ queryKey: qk.issues(issue.project_id) })
  }

  const add = useMutation({
    mutationFn: (text: string) =>
      unwrap(api.POST('/api/v1/issues/{issue_id}/checklist', { params: { path }, body: { text } })),
    onSuccess: (item) => patchCache((items) => [...items, item]),
    onSettled: settle,
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; text?: string; done?: boolean }) =>
      unwrap(
        api.PATCH('/api/v1/issues/{issue_id}/checklist/{item_id}', {
          params: { path: { ...path, item_id: id } },
          body,
        }),
      ),
    onMutate: ({ id, ...body }) => patchCache((items) => items.map((c) => (c.id === id ? { ...c, ...body } : c))),
    onSettled: settle,
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/api/v1/issues/{issue_id}/checklist/{item_id}', { params: { path: { ...path, item_id: id } } })),
    onMutate: (id) => patchCache((items) => items.filter((c) => c.id !== id)),
    onSettled: settle,
  })

  return { add, update, remove }
}
