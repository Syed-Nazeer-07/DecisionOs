import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Pencil, Plus, Route, Trash2, X } from 'lucide-react'
import { TYPE_META, LIKELIHOOD_META, HORIZON_LABELS, CONSEQUENCE_TYPES } from '../lib/theme'
import { getLikelihood } from '../lib/utils'
import Tooltip from './Tooltip'

export default function DetailPanel({
  node,
  path,
  onClose,
  onRename,
  onDelete,
  onAddMore,
  onToggleCollapse,
  hasChildren,
  collapsed,
  isDemo,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!node) return null

  const meta = TYPE_META[node.type] || TYPE_META.neutral
  const likMeta = LIKELIHOOD_META[getLikelihood(node)] || LIKELIHOOD_META.possible
  const isConsequence = CONSEQUENCE_TYPES.includes(node.type)
  const startEdit = () => {
    setDraft(node.label)
    setEditing(true)
  }
  const submit = () => {
    onRename(node.id, draft)
    setEditing(false)
  }
  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(path)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="absolute bottom-24 left-80 z-40 w-[340px] max-w-[90vw] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-3.5">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-base text-zinc-100 outline-none"
          />
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/40">{node.type}</div>
            <h3 className="text-base font-semibold text-white leading-snug mt-0.5 break-words">{node.label}</h3>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <Tooltip label="Rename">
              <button onClick={startEdit} aria-label="Rename" className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <Pencil size={15} />
              </button>
            </Tooltip>
          )}
          <Tooltip label="Close">
            <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <X size={17} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3.5">
        <span
          className="text-xs px-2.5 py-1 rounded-full border"
          style={{ color: meta.dot, borderColor: `${meta.dot}55`, background: `${meta.dot}14` }}
        >
          {meta.label}
        </span>
        {isConsequence && node.timeHorizon && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
            {HORIZON_LABELS[node.timeHorizon] || node.timeHorizon}
          </span>
        )}
        {isConsequence && (
          <Tooltip label={likMeta.tip}>
            <span className={`text-xs px-2.5 py-1 rounded-full border cursor-help ${likMeta.badge}`}>
              {likMeta.label}
            </span>
          </Tooltip>
        )}
      </div>

      <Tooltip label="Copy the causal path from the root" className="w-full">
        <button
          onClick={copyPath}
          className="w-full flex items-center gap-2 text-left text-xs text-zinc-400 hover:text-zinc-200 mb-4 group transition-colors"
        >
          <Route size={14} className="shrink-0" />
          <span className="truncate">{path || '—'}</span>
          <Copy size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </Tooltip>

      <div className="grid grid-cols-2 gap-2.5">
        <Tooltip label="Generate 3 more consequences" className="w-full">
          <button
            onClick={() => onAddMore(node)}
            className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <Plus size={14} /> Add more
          </button>
        </Tooltip>
        {hasChildren && (
          <Tooltip label={collapsed ? 'Show this branch again' : 'Hide this branch'} className="w-full">
            <button
              onClick={() => onToggleCollapse(node.id)}
              className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {collapsed ? 'Expand' : 'Collapse'}
            </button>
          </Tooltip>
        )}
        <Tooltip label="Delete this node and its whole branch" className="w-full">
          <button
            onClick={() => onDelete(node.id)}
            className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </Tooltip>
      </div>

      {isDemo && <div className="mt-3.5 text-xs text-zinc-500">Demo mode: sample consequences shown.</div>}
    </div>
  )
}
