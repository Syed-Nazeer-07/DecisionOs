import React from 'react'
import { TYPE_META } from '../lib/theme'

const ORDER = ['opportunity', 'risk', 'tradeoff', 'dimension', 'neutral']

export default function StatsBar({ stats, isDemo }) {
  return (
    <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-2.5">
      {isDemo && (
        <span className="text-sm px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400/90 backdrop-blur">
          Demo mode
        </span>
      )}
      <div className="flex items-center gap-4 bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-full px-5 py-2.5">
        {ORDER.map(
          (t) =>
            stats[t] > 0 && (
              <span key={t} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_META[t].dot }} />
                {stats[t]}
              </span>
            ),
        )}
        <span className="text-sm text-zinc-500 ml-1">{stats.total} nodes</span>
      </div>
    </div>
  )
}
