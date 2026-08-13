import React from 'react'
import { ArrowRight, Redo2, Undo2 } from 'lucide-react'
import Tooltip from './Tooltip'

export default function CommandBar({
  value,
  onChange,
  onSubmit,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const iconBtn =
    'w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors'

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-zinc-900/85 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl pl-5 pr-2.5 py-2.5 flex items-center gap-1">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Explore another decision…"
            className="w-[300px] max-w-[38vw] bg-transparent border-none outline-none text-base text-zinc-100 placeholder:text-zinc-600"
          />
          <Tooltip label="Build a new tree from this input">
            <button
              type="submit"
              aria-label="Explore decision"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-105 transition-all"
            >
              <ArrowRight size={18} />
            </button>
          </Tooltip>
        </form>

        <div className="h-7 w-px bg-zinc-800 mx-2" />

        <Tooltip label="Undo (Ctrl+Z)">
          <button onClick={onUndo} disabled={!canUndo} aria-label="Undo" className={iconBtn}>
            <Undo2 size={17} />
          </button>
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Shift+Z)">
          <button onClick={onRedo} disabled={!canRedo} aria-label="Redo" className={iconBtn}>
            <Redo2 size={17} />
          </button>
        </Tooltip>

        <div className="h-7 w-px bg-zinc-800 mx-2" />

        <Tooltip label="Reset to start screen (R)">
          <button
            onClick={onReset}
            className="px-4 h-10 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            Reset
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
