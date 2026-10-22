import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

/** Retorna [debounced, flush]. Em unmount, executa a chamada pendente (não perde edição). */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
  const fnRef = useRef(fn)
  useLayoutEffect(() => {
    fnRef.current = fn
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<A | null>(null)

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (pending.current) {
      const args = pending.current
      pending.current = null
      fnRef.current(...args)
    }
  }, [])

  const debounced = useCallback(
    (...args: A) => {
      pending.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delay)
    },
    [delay, flush],
  )

  useEffect(() => flush, [flush])
  return [debounced, flush] as const
}
