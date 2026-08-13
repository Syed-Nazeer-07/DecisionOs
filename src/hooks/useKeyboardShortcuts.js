import { useEffect, useRef } from 'react'

/**
 * Global keyboard shortcuts. Handlers are read from a ref so they never
 * capture stale state. Inputs / contenteditable elements are ignored.
 *
 * Supported:
 *   Ctrl/Cmd+Z        undo
 *   Ctrl/Cmd+Shift+Z  redo
 *   F                 fit view
 *   R                 reset
 *   [ ]               zoom out / in
 *   Esc               clear selection
 *   Delete/Backspace  delete selected node
 */
export function useKeyboardShortcuts(handlers) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

      const H = ref.current
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()

      if (mod && k === 'z') {
        e.preventDefault()
        e.shiftKey ? H.redo?.() : H.undo?.()
        return
      }
      if (mod && k === 'y') {
        e.preventDefault()
        H.redo?.()
        return
      }
      if (k === 'f') { H.fit?.(); return }
      if (k === 'r') { H.reset?.(); return }
      if (e.key === 'Escape') { H.escape?.(); return }
      if (k === '[') { H.zoomOut?.(); return }
      if (k === ']') { H.zoomIn?.(); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { H.deleteSelected?.(); return }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
