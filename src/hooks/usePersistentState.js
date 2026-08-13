import { useEffect, useRef, useState } from 'react'

/** useState that mirrors its value to localStorage (debounced). */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return typeof initial === 'function' ? initial() : initial
  })

  const timer = useRef(null)
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        /* ignore */
      }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [key, value])

  return [value, setValue]
}
