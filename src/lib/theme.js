export const TYPE_META = {
  decision: { label: 'Decision', dot: '#e4e4e7', edge: 'rgba(244,244,245,0.55)' },
  dimension: { label: 'Dimension', dot: '#818cf8', edge: 'rgba(99,102,241,0.55)' },
  opportunity: { label: 'Opportunity', dot: '#34d399', edge: 'rgba(16,185,129,0.55)' },
  risk: { label: 'Risk', dot: '#fb7185', edge: 'rgba(244,63,94,0.55)' },
  tradeoff: { label: 'Tradeoff', dot: '#fbbf24', edge: 'rgba(245,158,11,0.55)' },
  neutral: { label: 'Neutral', dot: '#a1a1aa', edge: 'rgba(161,161,170,0.4)' },
}

export const NODE_CLASS = {
  decision:
    'bg-zinc-900 border-2 border-zinc-400 text-zinc-100 shadow-[0_0_40px_rgba(255,255,255,0.08)]',
  dimension:
    'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
  opportunity:
    'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  risk: 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
  tradeoff:
    'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
  neutral: 'bg-zinc-800/80 border-zinc-600 text-zinc-300',
}

export const LIKELIHOOD_META = {
  likely: {
    label: 'Likely',
    tip: 'Expected in most situations.',
    badge: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    borderStyle: 'solid',
  },
  possible: {
    label: 'Possible',
    tip: 'Depends on circumstances.',
    badge: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    borderStyle: 'dotted',
  },
  uncertain: {
    label: 'Uncertain',
    tip: 'Outcome is plausible but highly variable.',
    badge: 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
    borderStyle: 'dashed',
  },
}

export const HORIZON_LABELS = {
  immediate: 'Immediate',
  'short-term': 'Short-term',
  'medium-term': 'Medium-term',
  'long-term': 'Long-term',
}

export const CONSEQUENCE_TYPES = ['opportunity', 'risk', 'tradeoff', 'neutral']
