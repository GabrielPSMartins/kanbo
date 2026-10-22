import {
  closestCenter,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Issue } from '@/api/client'

export type Containers = Record<string, Issue[]>

export type DropResult = {
  issue: Issue
  container: string
  fromContainer: string
  before: Issue | undefined // fica acima
  after: Issue | undefined // fica abaixo
}

/** Posição otimista equivalente à calculada no backend (ponto médio entre vizinhos). */
export function positionBetween(before?: Issue, after?: Issue): number {
  if (before && after) return (before.position + after.position) / 2
  if (before) return before.position + 1024
  if (after) return after.position - 1024
  return 1024
}

/**
 * Drag-and-drop de issues entre várias listas (seções do backlog / colunas do board).
 * Durante o arraste mantém uma cópia local dos ids por container; no drop informa
 * a issue, o container final e os vizinhos para o `move` da API.
 */
export function useIssueDnd(containers: Containers, onDrop: (r: DropResult) => void) {
  const [items, setItems] = useState<Record<string, number[]> | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const origin = useRef<string | null>(null)
  const lastOverId = useRef<UniqueIdentifier | null>(null)

  const base = useMemo(
    () => Object.fromEntries(Object.entries(containers).map(([k, list]) => [k, list.map((i) => i.id)])),
    [containers],
  )
  const current = items ?? base
  const byId = useMemo(() => {
    const map = new Map<number, Issue>()
    Object.values(containers).forEach((list) => list.forEach((i) => map.set(i.id, i)))
    return map
  }, [containers])

  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      if (typeof id === 'string' && id in current) return id
      return Object.keys(current).find((k) => current[k]!.includes(id as number))
    },
    [current],
  )

  const sensors = useSensors(
    // distância mínima para não confundir clique (abrir issue) com arraste
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Ponteiro dentro de um container vazio → o próprio container; senão o item mais próximo
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerHits = pointerWithin(args)
      const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
      let overId = getFirstCollision(hits, 'id')
      if (overId != null) {
        if (typeof overId === 'string' && overId in current) {
          const ids = current[overId]!
          if (ids.length > 0) {
            overId =
              closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter((c) => ids.includes(c.id as number)),
              })[0]?.id ?? overId
          }
        }
        lastOverId.current = overId
        return [{ id: overId }]
      }
      return lastOverId.current != null ? [{ id: lastOverId.current }] : []
    },
    [current],
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number)
    setItems(base)
    origin.current = findContainer(active.id) ?? null
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const from = findContainer(active.id)
    const to = findContainer(over.id)
    if (!from || !to || from === to) return
    setItems((prev) => {
      const state = prev ?? base
      const fromIds = state[from]!.filter((id) => id !== active.id)
      const toIds = [...state[to]!]
      const overIndex = toIds.indexOf(over.id as number)
      const below =
        over.rect && active.rect.current.translated
          ? active.rect.current.translated.top > over.rect.top + over.rect.height / 2
          : false
      const index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : toIds.length
      toIds.splice(index, 0, active.id as number)
      return { ...state, [from]: fromIds, [to]: toIds }
    })
  }

  const reset = () => {
    setItems(null)
    setActiveId(null)
    origin.current = null
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const container = findContainer(active.id)
    const fromContainer = origin.current
    if (!over || !container || !fromContainer) return reset()

    let ids = current[container]!
    const oldIndex = ids.indexOf(active.id as number)
    const overIndex = ids.indexOf(over.id as number)
    if (overIndex >= 0 && oldIndex !== overIndex) ids = arrayMove(ids, oldIndex, overIndex)

    const index = ids.indexOf(active.id as number)
    const unchanged = container === fromContainer && base[container]!.indexOf(active.id as number) === index
    const issue = byId.get(active.id as number)
    reset()
    if (unchanged || !issue) return

    const at = (i: number) => (ids[i] != null ? byId.get(ids[i]!) : undefined)
    onDrop({ issue, container, fromContainer, before: at(index - 1), after: at(index + 1) })
  }

  return {
    items: current,
    activeIssue: activeId != null ? byId.get(activeId) : undefined,
    get: (id: number) => byId.get(id),
    dndProps: {
      sensors,
      collisionDetection,
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel: reset,
    },
  }
}
