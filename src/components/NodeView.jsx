import React from 'react'
import { ChevronDown, ChevronRight, Crosshair, Plus } from 'lucide-react'
import { NODE_CLASS, TYPE_META, LIKELIHOOD_META, HORIZON_LABELS, CONSEQUENCE_TYPES } from '../lib/theme'
import { ROOT_WIDTH, CHILD_WIDTH } from '../lib/layout'
import { getLikelihood } from '../lib/utils'
import Tooltip from './Tooltip'

function NodeView({
  node,
  selected,
  dimmed,
  hasChildren,
  collapsed,
  onSelect,
  onToggleCollapse,
  onAddMore,
}) {
  const isRoot = node.type === 'decision'
  const isConsequence = CONSEQUENCE_TYPES.includes(node.type)
  const width = isRoot ? ROOT_WIDTH : CHILD_WIDTH
  const meta = TYPE_META[node.type] || TYPE_META.neutral
  const likelihood = getLikelihood(node)
  const likMeta = LIKELIHOOD_META[likelihood] || LIKELIHOOD_META.possible
  const timeOpacity =
    node.timeHorizon === 'long-term' ? 0.72 : node.timeHorizon === 'medium-term' ? 0.9 : 1
  const borderStyle = isConsequence ? likMeta.borderStyle : 'solid'

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute flex items-center gap-3 cursor-pointer group backdrop-blur-md border node-in
        ${NODE_CLASS[node.type] || NODE_CLASS.neutral}
        ${isRoot ? 'px-7 py-5 rounded-3xl' : 'px-4 py-3 rounded-xl'}
        ${node.isGenerating ? 'node-pulse ring-2 ring-zinc-400/40' : ''}
        ${selected ? 'ring-2 ring-white/70 shadow-[0_0_30px_rgba(255,255,255,0.12)]' : ''}
      `}
      style={{
        left: node.x ?? 0,
        top: node.y ?? 0,
        width,
        transform: 'translate(0,-50%)',
        borderStyle,
        opacity: dimmed ? 0.18 : timeOpacity,
        filter: dimmed ? 'blur(1.5px) saturate(0.4)' : undefined,
        zIndex: selected ? 40 : dimmed ? 20 : 30,
        transition:
          'left .6s cubic-bezier(.16,1,.3,1), top .6s cubic-bezier(.16,1,.3,1), opacity .45s ease, filter .45s ease',
      }}
    >
      {!node.isPlaceholder && (
        <span
          className={`shrink-0 rounded-full ${isRoot ? 'w-3 h-3' : 'w-2.5 h-2.5'}`}
          style={{ background: meta.dot, boxShadow: `0 0 10px ${meta.dot}` }}
        />
      )}

      {node.isPlaceholder ? (
        <div className="flex items-center gap-3 w-full min-h-[28px]">
          <span className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin shrink-0" />
          <span className="text-zinc-400 italic text-sm">Analyzing consequences…</span>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className={`leading-snug break-words ${isRoot ? 'text-lg font-bold text-zinc-50' : 'text-sm font-medium'}`}>
              {node.label}
            </div>
            {!isRoot && isConsequence && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                  {HORIZON_LABELS[node.timeHorizon] || node.timeHorizon}
                </span>
                <Tooltip label={likMeta.tip}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded cursor-help ${likMeta.badge}`}>
                    {likMeta.label}
                  </span>
                </Tooltip>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-1">
            {!isRoot && (
              <Tooltip label="Add more consequences" side="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddMore(node)
                  }}
                  className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/15 transition-opacity"
                  aria-label="Add consequences"
                >
                  <Plus size={12} className="text-white/60" />
                </button>
              </Tooltip>
            )}
            {hasChildren && (
              <Tooltip label={collapsed ? 'Expand branch' : 'Collapse branch'} side="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCollapse(node.id)
                  }}
                  className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                  aria-label={collapsed ? 'Expand' : 'Collapse'}
                >
                  {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              </Tooltip>
            )}
            <Tooltip label="Explorable — click node to expand" side="top">
              <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Crosshair size={11} className="text-white/50" />
              </span>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(NodeView)
