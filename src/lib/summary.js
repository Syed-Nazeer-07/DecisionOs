import { hashString, serializeNodes } from './utils'
import { callGemini } from './gemini'

/**
 * AI Decision Summary engine.
 *
 * Design notes (future-ready):
 * - `buildSummaryPrompt` is pure: given the tree it returns the full prompt.
 * - `generateSummary` returns a promise resolving to a structured object, so a
 *   streaming transport can later be swapped in without touching the UI.
 * - The resolved object is UI-agnostic (`{ keyOpportunities, ... }`), so the
 *   same data can feed PDF export and shareable reports later.
 */

const SUMMARY_MARKER = 'EXECUTIVE DECISION SUMMARY'

// ---- Tree analysis (pure) -------------------------------------------------

/** Render the tree as an indented hierarchy with type/timeframe/likelihood. */
function buildTreeContext(nodes) {
  const active = nodes.filter((n) => !n.isPlaceholder)
  const byParent = new Map()
  for (const n of active) {
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, [])
    byParent.get(n.parentId).push(n)
  }
  const lines = []
  const walk = (node, depth) => {
    const indent = '  '.repeat(depth)
    const attrs = []
    if (node.type && node.type !== 'decision' && node.type !== 'dimension') attrs.push(`type:${node.type}`)
    if (node.timeHorizon) attrs.push(`timeframe:${node.timeHorizon}`)
    if (node.likelihood) attrs.push(`likelihood:${node.likelihood}`)
    lines.push(`${indent}- ${node.label}${attrs.length ? ` [${attrs.join(', ')}]` : ''}`)
    for (const k of byParent.get(node.id) || []) walk(k, depth + 1)
  }
  for (const r of active.filter((n) => !n.parentId)) walk(r, 0)
  return lines.slice(0, 500).join('\n')
}

/** Counts, deepest chain, and per-dimension consequence counts. */
function computeTreeMetrics(nodes) {
  const active = nodes.filter((n) => !n.isPlaceholder)
  const byParent = new Map()
  for (const n of active) {
    if (!byParent.has(n.parentId)) byParent.set(n.parentId, [])
    byParent.get(n.parentId).push(n)
  }
  const counts = {}
  let deepest = 0
  let deepestPath = ''
  let mostConnected = null
  let mostConnectedKids = 0
  const dimKids = new Map()
  const dimNames = new Map(active.filter((n) => n.type === 'dimension').map((n) => [n.id, n.label]))

  const walk = (node, depth, path) => {
    const type = node.type || 'neutral'
    counts[type] = (counts[type] || 0) + 1
    const kids = byParent.get(node.id) || []
    if (kids.length > mostConnectedKids) {
      mostConnectedKids = kids.length
      mostConnected = node
    }
    if (depth > deepest) {
      deepest = depth
      deepestPath = path
    }
    if (node.parentId && dimNames.has(node.parentId)) {
      dimKids.set(node.parentId, (dimKids.get(node.parentId) || 0) + 1)
    }
    for (const k of kids) walk(k, depth + 1, `${path} > ${k.label}`)
  }
  for (const r of active.filter((n) => !n.parentId)) walk(r, 0, r.label)

  const dimBreakdown = [...dimKids.entries()]
    .map(([id, count]) => `${dimNames.get(id)} (${count} consequences)`)
    .sort((a, b) => b.split(' (')[1] - a.split(' (')[1])

  return { counts, deepest, deepestPath, mostConnected: mostConnected?.label, dimBreakdown }
}

/** Repeated consequence labels that appear under multiple dimensions. */
function detectPatterns(nodes) {
  const active = nodes.filter((n) => !n.isPlaceholder && n.parentId)
  const labelToDims = new Map()
  const idToDim = new Map()
  for (const n of active) {
    const parent = nodes.find((x) => x.id === n.parentId)
    if (!parent || parent.type !== 'dimension') continue
    idToDim.set(parent.id, parent.label)
    const key = n.label.toLowerCase()
    if (!labelToDims.has(key)) labelToDims.set(key, new Set())
    labelToDims.get(key).add(parent.label)
  }
  return [...labelToDims.entries()]
    .filter(([, dims]) => dims.size > 1)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 8)
    .map(([label, dims]) => `"${label}" recurs under: ${[...dims].join(', ')}`)
}

// ---- Prompt ---------------------------------------------------------------

function buildSummaryPrompt(nodes) {
  const root = nodes.find((n) => !n.parentId && !n.isPlaceholder)
  const context = buildTreeContext(nodes)
  const m = computeTreeMetrics(nodes)
  const patterns = detectPatterns(nodes)
  const countLine = Object.entries(m.counts)
    .map(([t, c]) => `${t}: ${c}`)
    .join(', ')

  return `${SUMMARY_MARKER}

You are an executive decision analyst. Produce a concise executive summary of the ENTIRE decision tree below.

DECISION:
"${root?.label ?? 'Untitled decision'}"

FULL DECISION TREE (indentation = depth; deeper = further along the causal chain):
${context || '(empty tree)'}

TREE METRICS:
- Node counts: ${countLine || 'none'}
- Deepest causal chain (${m.deepest} levels): ${m.deepestPath || 'n/a'}
- Most connected node: ${m.mostConnected || 'n/a'} (${m.mostConnectedKids} direct consequences)
- Consequence density by dimension: ${m.dimBreakdown.join('; ') || 'n/a'}

REPEATED PATTERNS ACROSS DIMENSIONS:
${patterns.length ? patterns.join('\n') : 'None detected'}

Produce these sections:

1. Key Opportunities - the most important upsides anywhere in the tree.
2. Key Risks - the most important downsides anywhere in the tree.
3. Key Tradeoffs - the core benefit-vs-cost tensions.
4. Most Likely Outcomes - the outcomes most likely to actually happen.
5. Highest Impact Dimension - the single dimension driving the most consequence chains.
6. Major Themes - 2-4 recurring themes across the whole tree.

PRIORITIZATION RULES - weight these heavily:
- Consequences marked "likelihood:likely" (highest confidence).
- Nodes that branch into many children (highly connected).
- Deep causal chains (far from the root).
- Patterns that repeat across multiple dimensions.
- Specific, concrete outcomes over vague ones.

FORMAT RULES:
- Keep every bullet concise (under ~12 words).
- Avoid generic platitudes (e.g. "growth", "risk", "better decisions").
- Highest Impact Dimension must be one of the actual dimension labels in the tree.

Output STRICT JSON:
{
  "keyOpportunities": ["..."],
  "keyRisks": ["..."],
  "keyTradeoffs": ["..."],
  "mostLikelyOutcomes": ["..."],
  "highestImpactDimension": "...",
  "majorThemes": ["..."]
}`
}

export const summarySys = `Output strictly JSON:
{
  "keyOpportunities": ["3-6 concise bullets"],
  "keyRisks": ["3-6 concise bullets"],
  "keyTradeoffs": ["2-4 concise bullets"],
  "mostLikelyOutcomes": ["1-3 concise bullets"],
  "highestImpactDimension": "single dimension label",
  "majorThemes": ["2-4 short themes"]
}`

// ---- Normalization --------------------------------------------------------

export function normalizeSummary(raw) {
  const arr = (v) =>
    Array.isArray(v)
      ? v.map((s) => String(s ?? '').trim()).filter(Boolean).slice(0, 8)
      : []
  return {
    keyOpportunities: arr(raw?.keyOpportunities),
    keyRisks: arr(raw?.keyRisks),
    keyTradeoffs: arr(raw?.keyTradeoffs),
    mostLikelyOutcomes: arr(raw?.mostLikelyOutcomes),
    highestImpactDimension: String(raw?.highestImpactDimension ?? '').trim(),
    majorThemes: arr(raw?.majorThemes),
  }
}


// ---- Generation -----------------------------------------------------------

export async function generateSummary(nodes, { signal } = {}) {
  const data = await callGemini(buildSummaryPrompt(nodes), summarySys, { signal })
  return normalizeSummary(data)
}

// ---- Local cache (invalidated by tree hash) --------------------------------

const CACHE_KEY = 'decisionos.summaries.v1'

export function summaryTreeHash(nodes) {
  return hashString(JSON.stringify(serializeNodes(nodes)))
}

function loadCache() {
  try {
    const m = JSON.parse(localStorage.getItem(CACHE_KEY))
    return m && typeof m === 'object' ? m : {}
  } catch {
    return {}
  }
}

function saveCache(map) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    /* storage full / unavailable */
  }
}

export function getCachedSummary(id) {
  return loadCache()[id] || null
}

export function putCachedSummary(id, entry) {
  const map = loadCache()
  map[id] = entry
  saveCache(map)
}

export function clearSummaryForDecision(id) {
  const map = loadCache()
  if (map[id]) {
    delete map[id]
    saveCache(map)
  }
}
