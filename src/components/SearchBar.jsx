import React, { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { TYPE_META } from '../lib/theme'
import Tooltip from './Tooltip'

export default function SearchBar({ query, setQuery, matches, onSelect }) {
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => setActiveIdx(0), [query])
  const shown = query.trim().length > 0

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, matches.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const m = matches[activeIdx]
      if (m) onSelect(m)
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 w-[420px] max-w-[90vw]">
      <div className="relative">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search the decision tree…"
          className="w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 focus:border-zinc-600 text-zinc-100 text-base rounded-full pl-14 pr-12 py-3 outline-none placeholder:text-zinc-600 shadow-xl transition-colors"
        />
        {query && (
          <Tooltip label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>
          </Tooltip>
        )}
      </div>

      {shown && (
        <div className="mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {matches.length === 0 && <div className="px-5 py-3.5 text-sm text-zinc-500">No matches.</div>}
          {matches.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full text-left px-5 py-3 flex items-center gap-3 text-base transition-colors ${
                i === activeIdx ? 'bg-zinc-800/80 text-white' : 'text-zinc-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_META[m.type].dot }} />
              <span className="truncate flex-1">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
