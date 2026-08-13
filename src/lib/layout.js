import { estimateLabelHeight } from './utils'

export const ROOT_WIDTH = 380
export const CHILD_WIDTH = 300
export const HORIZONTAL_GAP = 110
export const VERTICAL_GAP = 24

/**
 * Lays out a flat node list into an ordered, non-overlapping tree.
 *
 * Each node in `nodes` receives `x` / `y` coordinates (center-based).
 * The function is pure: it operates on shallow copies and returns a new array.
 */
export function layoutTree(nodes) {
  const list = nodes.map((n) => ({ ...n }))
  if (!list.length) return list

  const childrenMap = {}
  const roots = []
  for (const n of list) {
    if (n.parentId) {
      ;(childrenMap[n.parentId] ??= []).push(n)
    } else {
      roots.push(n)
    }
  }

  const nodeWidth = (n) => (n.type === 'decision' ? ROOT_WIDTH : CHILD_WIDTH)
  const nodeHeight = (n) =>
    n.isPlaceholder ? 44 : estimateLabelHeight(n.label, nodeWidth(n) - 70)

  const cache = new Map()
  const subtreeHeight = (n) => {
    if (cache.has(n.id)) return cache.get(n.id)
    const kids = childrenMap[n.id] || []
    let h = nodeHeight(n)
    if (kids.length) {
      const total =
        kids.reduce((s, k) => s + subtreeHeight(k), 0) +
        (kids.length - 1) * VERTICAL_GAP
      h = Math.max(h, total)
    }
    cache.set(n.id, h)
    return h
  }

  const assign = (n, x, y) => {
    n.x = x
    n.y = y
    const kids = childrenMap[n.id] || []
    if (!kids.length) return

    // Center the children block on the parent's y.
    const block = subtreeHeight(n)
    let cursor = y - block / 2
    const parentWidth = nodeWidth(n)
    for (const kid of kids) {
      const kidH = subtreeHeight(kid)
      const kidY = cursor + kidH / 2
      assign(kid, x + parentWidth + HORIZONTAL_GAP, kidY)
      cursor += kidH + VERTICAL_GAP
    }
  }

  for (const r of roots) assign(r, 0, 0)
  return list
}
