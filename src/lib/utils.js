export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

export const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic PRNG so demo output is stable per node. */
export function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Strip layout fields before persisting / diffing. */
export const serializeNodes = (nodes) =>
  nodes.map(({ x, y, ...rest }) => rest)

export const sanitizeType = (t) =>
  ['dimension', 'opportunity', 'risk', 'tradeoff', 'neutral', 'decision'].includes(t)
    ? t
    : 'neutral'

export const sanitizeHorizon = (h) =>
  ['immediate', 'short-term', 'medium-term', 'long-term'].includes(h) ? h : 'medium-term'

const LIKELIHOOD_MAP = { likely: 'likely', possible: 'possible', uncertain: 'uncertain', high: 'likely', medium: 'possible', low: 'uncertain' }

/** Normalize likelihood terminology. Accepts new values (likely|possible|uncertain)
 *  and maps legacy confidence values (high|medium|low) for backward compatibility. */
export const sanitizeLikelihood = (c) => LIKELIHOOD_MAP[String(c ?? '').toLowerCase()] || 'possible'

/** Read likelihood from a node, falling back to legacy confidence field. */
export const getLikelihood = (node) => sanitizeLikelihood(node?.likelihood ?? node?.confidence)

/** Rough text-height estimate so layout can prevent vertical overlap. */
export function estimateLabelHeight(label, width) {
  const text = String(label ?? '')
  const chars = Math.max(1, Math.floor(width / 7.4))
  const lines = Math.max(1, Math.ceil(text.length / chars))
  return 42 + lines * 15
}
