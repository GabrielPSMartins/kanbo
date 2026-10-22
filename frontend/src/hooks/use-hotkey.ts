import { useEffect, useLayoutEffect, useRef } from 'react'

type Options = { mod?: boolean; enabled?: boolean; allowInInputs?: boolean }

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Atalho global. `mod` = Ctrl (ou ⌘ no macOS). Ignora quando o foco está num campo de texto. */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, opts: Options = {}) {
  const { mod = false, enabled = true, allowInInputs = mod } = opts
  const ref = useRef(handler)
  useLayoutEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      const hasMod = e.ctrlKey || e.metaKey
      if (mod !== hasMod || e.altKey) return
      if (!allowInInputs && isTyping(e.target)) return
      // não dispara atalhos de letra quando um dialog/menu está aberto
      if (!mod && document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, mod, enabled, allowInInputs])
}
