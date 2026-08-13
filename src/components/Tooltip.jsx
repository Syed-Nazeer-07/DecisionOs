import React from 'react'

/** Hover/focus tooltip. Wraps a button and shows `label` above it by default.
 *  Pure CSS (group-hover) so it never blocks clicks. */
export default function Tooltip({ label, side = 'top', className = '', children }) {
  const base =
    'pointer-events-none absolute z-[70] whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800/95 px-2 py-1 text-[10px] font-medium text-zinc-200 opacity-0 shadow-lg backdrop-blur transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100'

  let cls = base
  let style = {}
  if (side === 'bottom') {
    cls += ' left-1/2 -translate-x-1/2'
    style = { top: 'calc(100% + 6px)' }
  } else if (side === 'left') {
    cls += ' right-full mr-1.5 top-1/2 -translate-y-1/2'
  } else if (side === 'right') {
    cls += ' left-full ml-1.5 top-1/2 -translate-y-1/2'
  } else {
    cls += ' left-1/2 -translate-x-1/2'
    style = { bottom: 'calc(100% + 6px)' }
  }

  // If the caller positions the wrapper (e.g. absolute), don't force relative.
  const isAbsolute = className.includes('absolute')

  return (
    <span className={`group/tooltip inline-flex ${isAbsolute ? '' : 'relative'} ${className}`}>
      {children}
      <span role="tooltip" className={cls} style={style}>
        {label}
      </span>
    </span>
  )
}
