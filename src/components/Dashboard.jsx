import React from 'react'
import { ArrowRight, FileText, Zap, AlertTriangle } from 'lucide-react'

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function Dashboard({
  decisions,
  value,
  onChange,
  onSubmit,
  isDemo,
  onOpen,
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto py-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          <Zap size={32} className="text-zinc-950" fill="currentColor" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-2xl">DecisionOS</h1>
      </div>

      <form onSubmit={onSubmit} className="relative w-[500px] max-w-[90vw] shadow-2xl group">
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <input
          type="text"
          placeholder="What decision are you exploring?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="relative w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 text-zinc-100 px-8 py-5 rounded-full outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-600 transition-all text-lg placeholder:text-zinc-500 shadow-inner"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-zinc-100 text-zinc-900 rounded-full hover:bg-white hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Build decision tree"
        >
          <ArrowRight size={20} />
        </button>
      </form>

      {isDemo && (
        <div className="mt-8 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl max-w-md w-full">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex flex-col gap-1">
            <span className="text-amber-500 font-medium text-sm">API Key Required</span>
            <p className="text-xs text-amber-500/80 leading-relaxed">
              You are currently in Demo Mode and will only receive sample data. Please click <strong>Settings</strong> in the bottom-left sidebar to add your Gemini or OpenRouter API key.
            </p>
          </div>
        </div>
      )}

      {decisions.length > 0 && (
        <div className="mt-12 w-[560px] max-w-[90vw]">
          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-3">Recent decisions</div>
          <div className="flex flex-col gap-2">
            {decisions.slice(0, 6).map((d) => (
              <button
                key={d.id}
                onClick={() => onOpen(d.id)}
                className="group w-full flex items-center gap-4 bg-zinc-900/70 backdrop-blur border border-zinc-800 hover:border-zinc-600 rounded-2xl px-5 py-4 text-left transition-all hover:bg-zinc-900"
              >
                <span className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <FileText size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-200">{d.title}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    {d.nodeCount} nodes · updated {timeAgo(d.updatedAt)}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
