import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Crosshair, HelpCircle, Plus } from 'lucide-react'
import { TYPE_META, LIKELIHOOD_META } from '../lib/theme'

const ORDER = ['decision', 'dimension', 'opportunity', 'risk', 'tradeoff', 'neutral']

const PROBABILITY = [
  { key: 'likely', text: 'outcome is reasonably expected' },
  { key: 'possible', text: 'outcome could occur depending on circumstances' },
  { key: 'uncertain', text: 'outcome is speculative or highly dependent on unknown factors' },
]

const CONTROLS = [
  { icon: <Plus size={13} />, label: 'Generate more consequences' },
  { icon: <ChevronDown size={13} />, label: 'Collapse / expand branch' },
  { icon: <Crosshair size={13} />, label: 'Explorable — click the node to expand' },
]

export default function Legend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-28 right-6 z-40 flex flex-col items-end" onMouseLeave={() => setOpen(false)}>
      <button
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Legend"
        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-200 bg-zinc-900/70 border border-zinc-800 backdrop-blur transition-all"
      >
        <HelpCircle size={17} />
      </button>

      <div
        className={`mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl w-80 origin-top-right transition-all duration-200 ease-out ${
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Node types</div>
        {ORDER.map((t) => (
          <div key={t} className="flex items-center gap-3 py-1.5">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPE_META[t].dot }} />
            <span className="text-sm text-zinc-300">{TYPE_META[t].label}</span>
          </div>
        ))}
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Probability</div>
          {PROBABILITY.map((p) => {
            const m = LIKELIHOOD_META[p.key]
            return (
              <div key={p.key} className="py-1">
                <span className={`text-xs font-medium ${m.badge}`}>{m.label}</span>
                <span className="text-xs text-zinc-400"> — {p.text}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Node controls</div>
          {CONTROLS.map((c) => (
            <div key={c.label} className="flex items-center gap-3 py-1.5">
              <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                {c.icon}
              </span>
              <span className="text-sm text-zinc-300">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
