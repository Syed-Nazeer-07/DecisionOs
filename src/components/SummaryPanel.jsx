import React from 'react'
import {
  Focus,
  Layers,
  Loader2,
  RefreshCw,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  X,
} from 'lucide-react'

const SECTIONS = [
  { key: 'keyOpportunities', title: 'Key Opportunities', icon: TrendingUp, accent: 'text-emerald-400', dot: 'bg-emerald-500' },
  { key: 'keyRisks', title: 'Key Risks', icon: TriangleAlert, accent: 'text-rose-400', dot: 'bg-rose-500' },
  { key: 'keyTradeoffs', title: 'Key Tradeoffs', icon: Scale, accent: 'text-amber-400', dot: 'bg-amber-500' },
  { key: 'mostLikelyOutcomes', title: 'Most Likely Outcomes', icon: Target, accent: 'text-sky-400', dot: 'bg-sky-500' },
]

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SummaryPanel({ open, data, status, error, stale, generatedAt, onClose, onGenerate }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`absolute inset-0 left-72 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 z-50 w-[380px] max-w-[92vw] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">Decision Summary</h2>
              {stale && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  stale
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onGenerate}
                disabled={status === 'loading'}
                title="Regenerate summary"
                aria-label="Regenerate summary"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                aria-label="Close summary"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {status === 'loading' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Loader2 size={15} className="animate-spin text-violet-400" />
                  Analyzing your decision tree…
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2.5 w-28 rounded-full bg-zinc-800 animate-pulse" />
                    <div className="h-2 w-full rounded-full bg-zinc-800/70 animate-pulse" />
                    <div className="h-2 w-4/5 rounded-full bg-zinc-800/70 animate-pulse" />
                    <div className="h-2 w-3/5 rounded-full bg-zinc-800/70 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center text-center py-10 px-4 gap-3">
                <TriangleAlert size={22} className="text-rose-400" />
                <p className="text-sm text-zinc-300">Could not generate the summary.</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{error}</p>
                <button
                  onClick={onGenerate}
                  className="mt-1 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-medium hover:bg-white transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {status === 'ready' && data && (
              <div className="flex flex-col gap-5">
                {SECTIONS.map((s) => (
                  <section key={s.key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <s.icon size={13} className={s.accent} />
                      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{s.title}</h3>
                    </div>
                    <ul className="space-y-1.5 pl-4">
                      {data[s.key]?.length ? (
                        data[s.key].map((item, i) => (
                          <li key={i} className="text-[13px] leading-snug text-zinc-200 relative">
                            <span className={`absolute -left-4 top-[7px] h-1 w-1 rounded-full ${s.dot}`} />
                            {item}
                          </li>
                        ))
                      ) : (
                        <li className="text-[13px] text-zinc-500 italic">None identified.</li>
                      )}
                    </ul>
                  </section>
                ))}

                {data.highestImpactDimension && (
                  <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Focus size={13} className="text-violet-400" />
                      <h3 className="text-[11px] uppercase tracking-wider text-violet-300 font-semibold">
                        Highest Impact Dimension
                      </h3>
                    </div>
                    <p className="text-sm text-violet-100 font-medium">{data.highestImpactDimension}</p>
                  </section>
                )}

                {data.majorThemes?.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={13} className="text-zinc-400" />
                      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Major Themes</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.majorThemes.map((t, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-[11px] text-zinc-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {status === 'idle' && (
              <div className="flex flex-col items-center text-center py-12 px-4 gap-3">
                <Sparkles size={22} className="text-violet-400" />
                <p className="text-sm text-zinc-300">No summary yet.</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Analyze the full tree for key opportunities, risks, tradeoffs, likely outcomes, and the highest-impact
                  dimension.
                </p>
                <button
                  onClick={onGenerate}
                  className="mt-1 px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-xs font-medium hover:bg-white transition-colors"
                >
                  Generate Summary
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {(status === 'ready' || status === 'error') && (
            <div className="px-4 py-2.5 border-t border-zinc-800/70 text-[10px] text-zinc-600 flex items-center justify-between">
              <span>
                AI-generated{generatedAt ? ` · ${timeAgo(generatedAt)}` : ''}
                {stale ? ' · tree has changed — regenerate' : ''}
              </span>
              <span className="uppercase tracking-widest">DecisionOS</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
