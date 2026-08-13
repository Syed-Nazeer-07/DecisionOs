import { uid } from './utils'

/**
 * Decision Library — local-first persistence with a migration-ready shape.
 *
 * The store is a thin adapter over a single "provider". The local provider
 * uses localStorage today; swapping to Supabase / Firebase / PostgreSQL /
 * cloud sync later only requires implementing the same provider interface
 * (list/get/create/update/remove) and passing it to `configureProvider`.
 *
 * Each decision record:
 *   {
 *     id,                       // stable identifier
 *     title,                    // user-facing title
 *     createdAt, updatedAt,     // epoch ms
 *     nodeCount,                // denormalized for list rendering
 *     nodes,                    // serialized tree (no layout x/y)
 *     viewport,                 // { x, y, scale } camera position
 *   }
 */

const LIBRARY_KEY = 'decisionos.library.v1'
const LAST_OPENED_KEY = 'decisionos.lastOpened'
const LEGACY_NODES_KEY = 'decisionos.nodes'

const localProvider = {
  read() {
    try {
      const raw = localStorage.getItem(LIBRARY_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },
  write(records) {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(records))
    } catch {
      /* storage unavailable — ignore */
    }
  },
}

let provider = localProvider
let cache = null

export function configureProvider(next) {
  provider = next
  cache = null
  readAll() // force cache initialization with the new provider
}

export function configureLocalProvider() {
  configureProvider(localProvider)
}

export function getLocalDecisions() {
  return localProvider.read()
}

export function clearLocalDecisions() {
  localProvider.write({})
}

function readAll() {
  if (!cache) cache = provider.read()
  return cache
}

function writeAll() {
  cache = provider.write(readAll())
  if (cache === undefined) cache = readAll()
}

function toSummary(d) {
  return {
    id: d.id,
    title: d.title,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    nodeCount: d.nodeCount,
  }
}

/** All decisions as summaries, newest-first. */
export function listDecisions() {
  return Object.values(readAll()).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).map(toSummary)
}

/** Full record, or null. */
export function getDecision(id) {
  if (!id) return null
  const d = readAll()[id]
  return d ? { ...d, nodes: d.nodes ? [...d.nodes] : [] } : null
}

export function createDecision({ id = uid('dec'), title, nodes = [], viewport = null }) {
  const now = Date.now()
  const record = {
    id,
    title: String(title || 'Untitled decision').slice(0, 120),
    createdAt: now,
    updatedAt: now,
    nodeCount: (nodes || []).filter((n) => !n.isPlaceholder).length,
    nodes: nodes || [],
    viewport: viewport ? { ...viewport } : null,
  }
  const all = readAll()
  all[id] = record
  writeAll()
  return record
}

export function updateDecision(id, patch, { touchTime = true } = {}) {
  const all = readAll()
  const d = all[id]
  if (!d) return null
  const next = { ...d, ...patch }
  if (touchTime) next.updatedAt = Date.now()
  if (patch.nodes) next.nodeCount = patch.nodes.filter((n) => !n.isPlaceholder).length
  all[id] = next
  writeAll()
  return next
}

export function deleteDecision(id) {
  const all = readAll()
  const existed = !!all[id]
  delete all[id]
  writeAll()
  return existed
}

export function duplicateDecision(id) {
  const d = getDecision(id)
  if (!d) return null
  const copy = createDecision({
    title: `${d.title} (copy)`,
    nodes: d.nodes,
    viewport: d.viewport,
  })
  return copy
}

export function getLastOpenedId() {
  try {
    return localStorage.getItem(LAST_OPENED_KEY)
  } catch {
    return null
  }
}

export function setLastOpenedId(id) {
  try {
    if (id) localStorage.setItem(LAST_OPENED_KEY, id)
    else localStorage.removeItem(LAST_OPENED_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * One-time migration from the legacy single-tree storage (`decisionos.nodes`)
 * into the library. Safe to call on every boot: it no-ops once migrated.
 */
export function migrateLegacy() {
  let legacy = null
  try {
    const raw = localStorage.getItem(LEGACY_NODES_KEY)
    legacy = raw ? JSON.parse(raw) : null
  } catch {
    legacy = null
  }
  if (!legacy || !Array.isArray(legacy) || !legacy.length) return
  const all = readAll()
  if (Object.keys(all).length) {
    // Library already exists — drop the orphaned legacy tree.
    try {
      localStorage.removeItem(LEGACY_NODES_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  const root = legacy.find((n) => !n.parentId)
  const record = createDecision({
    title: root?.label || 'Untitled decision',
    nodes: legacy,
    viewport: null,
  })
  setLastOpenedId(record.id)
  try {
    localStorage.removeItem(LEGACY_NODES_KEY)
  } catch {
    /* ignore */
  }
}
