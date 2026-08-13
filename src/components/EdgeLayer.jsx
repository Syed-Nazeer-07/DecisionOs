import React, { useMemo } from 'react'
import { ROOT_WIDTH, CHILD_WIDTH } from '../lib/layout'
import { TYPE_META } from '../lib/theme'

const EDGE_TYPES = ['decision', 'dimension', 'opportunity', 'risk', 'tradeoff', 'neutral']

/** Curved, color-coded edges with arrowheads and a soft glow pass. */
function EdgeLayer({ nodes, relatedIds, selectedId }) {
  const edges = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const list = []
    for (const n of nodes) {
      if (!n.parentId) continue
      const p = byId.get(n.parentId)
      if (!p) continue
      const pWidth = p.type === 'decision' ? ROOT_WIDTH : CHILD_WIDTH
      const sx = p.x + pWidth
      const sy = p.y
      const ex = n.x
      const ey = n.y
      const dx = Math.max(40, Math.abs(ex - sx) * 0.5)
      const d = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`
      list.push({
        id: n.id,
        d,
        type: n.type,
        related: !selectedId || (relatedIds.has(n.id) && relatedIds.has(p.id)),
      })
    }
    return list
  }, [nodes, relatedIds, selectedId])

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none">
      <defs>
        {EDGE_TYPES.map((t) => (
          <marker
            key={t}
            id={`arrow-${t}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={TYPE_META[t].edge.replace(/[\d.]+\)$/, '1)')} />
          </marker>
        ))}
      </defs>
      {edges.map((e) => (
        <g key={e.id} className="edge-draw" style={{ opacity: e.related ? 1 : 0.07 }}>
          <path d={e.d} pathLength={1} fill="none" stroke={TYPE_META[e.type].edge} strokeWidth="7" opacity="0.1" />
          <path
            d={e.d}
            pathLength={1}
            fill="none"
            stroke={TYPE_META[e.type].edge}
            strokeWidth="1.8"
            markerEnd={`url(#arrow-${e.type})`}
          />
        </g>
      ))}
    </svg>
  )
}

export default React.memo(EdgeLayer)
