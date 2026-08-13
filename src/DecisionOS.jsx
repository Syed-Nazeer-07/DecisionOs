import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { layoutTree, ROOT_WIDTH, CHILD_WIDTH } from './lib/layout'
import { callGemini, isDemoMode } from './lib/gemini'
import { clamp, uid, serializeNodes, sanitizeType, sanitizeHorizon, sanitizeLikelihood } from './lib/utils'
import { saveApiKey, saveOpenRouterKey, hasSeenDemoHint, markDemoHint } from './lib/storage'
import {
  listDecisions,
  getDecision,
  createDecision,
  updateDecision,
  deleteDecision,
  duplicateDecision,
  getLastOpenedId,
  setLastOpenedId,
  migrateLegacy,
  configureProvider,
  configureLocalProvider,
  getLocalDecisions,
  clearLocalDecisions,
} from './lib/decisionStore'
import { usePersistentState } from './hooks/usePersistentState'
import { useAuth } from './hooks/useAuth'
import { supabaseProvider, initSupabaseStore, clearSupabaseStore, mergeLocalToCloud } from './lib/supabaseStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import Starfield from './components/Starfield'
import EdgeLayer from './components/EdgeLayer'
import NodeView from './components/NodeView'
import DetailPanel from './components/DetailPanel'
import Legend from './components/Legend'
import SearchBar from './components/SearchBar'
import StatsBar from './components/StatsBar'
import ZoomControls from './components/ZoomControls'
import CommandBar from './components/CommandBar'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Toasts from './components/Toasts'
import SummaryPanel from './components/SummaryPanel'
import {
  generateSummary,
  normalizeSummary,
  summaryTreeHash,
  getCachedSummary,
  putCachedSummary,
  clearSummaryForDecision,
} from './lib/summary'

const dimensionPrompt = (text) => `Decision:
"${text}"

${/\bvs\.?\b|\bor\b|\bversus\b/i.test(text) ? 'This decision compares multiple options — identify them before generating dimensions.' : ''}

Generate 5–7 evaluation dimensions for this decision.

A DIMENSION is a broad, independently meaningful category used to compare the options. It names a domain of concern — not an outcome, advice, or prediction.

RULES (enforce strictly):
- Each dimension must be directly relevant to "${text}".
- Dimensions must not overlap in meaning — each reveals a distinct trade-off.
- Use 2–5 word noun phrases only.
- Do NOT write outcome statements (e.g. "Higher income", "Better lifestyle").
- Do NOT write advice or recommendations (e.g. "Consider priorities").
- Do NOT use vague catch-alls (e.g. "Other factors", "Life impact", "Future").
- Do NOT copy phrases from the decision text verbatim.

For a decision like "Continue 9–5 job vs start a business":
  ✓ Financial stability risk
  ✓ Skill development rate
  ✓ Earning ceiling
  ✓ Work-life boundary control
  ✓ Professional network access
  ✗ Career (too vague)
  ✗ Your future income (outcome statement)
  ✗ Things to consider (advice)

For a decision like "Study abroad vs study locally":
  ✓ Tuition and living cost
  ✓ International network access
  ✓ Instruction quality gap
  ✓ Distance from home support
  ✓ Graduate employment outcome
  ✗ Education (too vague)
  ✗ You will grow (outcome, not a category)

Output STRICT JSON:

{
  "items": [
    {
      "label": "Dimension Name",
      "type": "dimension"
    }
  ]
}`

const dimensionSys = `You are a decision analysis expert. Output strictly JSON: { "items": [ { "label": "2-5 word noun phrase naming a domain of concern specific to the given decision", "type": "dimension" } ] }. Never use generic labels like 'Career' or 'Life impact'. Never use outcome statements or advice.`

const consequencePrompt = (root, dimension, path, node, existing, treeExisting) => `You are a causal reasoning engine that builds decision trees by tracing direct, concrete effects of specific nodes.

CONTEXT:
  DECISION:   "${root?.label ?? ''}"
  DIMENSION:  "${dimension?.label ?? ''}"
  CAUSAL PATH: "${path}"
  CURRENT NODE: "${node.label}"

TASK:
Generate EXACTLY 3 consequences that answer: "What directly and concretely happens BECAUSE OF '${node.label}'?"

The full causal chain must be:
  [Decision] → [Dimension] → ... → [${node.label}] → [YOUR CONSEQUENCE]

━━━ REQUIRED for every consequence ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Directly caused by "${node.label}" — not by the decision in general.
• Describes a concrete, observable real-world effect.
• Uses hedged language: "may", "can", "could", "tends to", "is likely to".
• Specific to the context of "${root?.label ?? ''}" — not generic advice.
• A complete cause-and-effect sentence under ~22 words.
• Does NOT start with a vague noun: avoid openers like "Opportunity", "Risk", "Impact", "Growth", "Success".

━━━ FORBIDDEN — replace any item that contains ━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Generic filler: "improve your skills", "better outcomes", "unlock potential", "great opportunity"
✗ Motivational language: "grow as a person", "become stronger", "this is your chance"
✗ Tautologies: restating "${node.label}" with different words
✗ Certainty claims: "will definitely", "always leads to", "guarantees success"
✗ Advice or recommendations: "you should", "it is best to", "make sure to"
✗ Deterministic personal predictions: "you will succeed", "this will change your life"
✗ Claims requiring evidence the model does not have
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAUSAL SELF-CHECK (apply before finalising each consequence):
Ask: "If '${node.label}' were NOT true, would this consequence still occur?"
If YES → it is not caused by this node. Replace it.

EXAMPLES:

Node: "Unpredictable revenue"
  ✗ BAD:  "Starting a business will cause financial stress." (generic, deterministic)
  ✓ GOOD: "Unpredictable monthly revenue may make it harder to maintain fixed commitments like rent."

Node: "Learning operations on the job"
  ✗ BAD:  "You will improve your business skills." (generic, certain, no mechanism)
  ✓ GOOD: "Managing operations without prior experience may slow early decision-making speed."

Node: "Distance from home"
  ✗ BAD:  "Living abroad is an exciting experience." (opinion, not causal)
  ✓ GOOD: "Being far from family support networks may increase reliance on personal resilience during difficult periods."

Node: "Fixed monthly salary"
  ✗ BAD:  "A salary provides financial security." (vague restatement of the node)
  ✓ GOOD: "A fixed salary allows multi-year financial planning such as loan repayments or savings goals."

TIMEFRAME:
  immediate = within weeks | short-term = within months | medium-term = 1–3 years | long-term = 3+ years

TYPE:
  opportunity = net beneficial | risk = net harmful | tradeoff = benefit that creates a cost elsewhere | neutral = neither

LIKELIHOOD:
  likely = expected in most cases | possible = depends on context | uncertain = highly individual

━━━ EXISTING CONSEQUENCES OF THIS NODE (do NOT repeat these ideas) ━━━
${existing.length ? existing.join('\n') : 'None yet.'}

━━━ OTHER TREE NODES (avoid semantic duplicates) ━━━━━━━━━━━━━━━━━━━━━━
${treeExisting && treeExisting.length ? treeExisting.slice(0, 60).join('\n') : 'None.'}

Return STRICT JSON ONLY — no markdown, no explanation outside the JSON:
{
  "items": [
    {
      "label": "one hedged causal sentence under ~22 words stating what concretely happens because of the current node",
      "type": "opportunity|risk|tradeoff|neutral",
      "timeframe": "immediate|short-term|medium-term|long-term",
      "likelihood": "likely|possible|uncertain"
    }
  ]
}`

const consequenceSys = `You are a causal reasoning engine. Output strictly JSON: { "items": [ { "label": "one hedged causal sentence under ~22 words — must state what concretely happens because of the current node, using hedged language (may/can/could/tends to)", "type": "opportunity|risk|tradeoff|neutral", "timeframe": "immediate|short-term|medium-term|long-term", "likelihood": "likely|possible|uncertain" } ] }. Never use generic phrases, motivational language, certainty claims, or advice.`

// ── Post-processing validation ───────────────────────────────────────────────
// Filters consequences that are clearly too short or structurally generic.
// Intentionally permissive: only removes items that a prompt improvement would
// have prevented. Falls back to unfiltered items if everything is caught,
// so the tree never stalls due to over-aggressive filtering.
const GENERIC_CONSEQUENCE_OPENERS = /^(improve|better |more success|grow as|unlock your|reach your|achieve your|fulfill your|enhance your|build on|this is (a|an)|great opportunity|become a better|become stronger|help you|support your|provide you|allow you to thrive|create success|ensure (a|the)|gain (more|better|a better))/i
const GENERIC_CONSEQUENCE_PHRASES = /better outcomes|great opportunity|unlock (your )?potential|this is a chance|become stronger|reach your (goal|dream|potential)|realize your (dream|potential)|motivat|inspiring/i

function sanitizeConsequences(items) {
  if (!Array.isArray(items)) return []
  const valid = items.filter((item) => {
    const label = String(item?.label ?? '').trim()
    if (!label) return false
    if (label.split(/\s+/).length < 6) return false          // too short to be a causal sentence
    if (GENERIC_CONSEQUENCE_OPENERS.test(label)) return false
    if (GENERIC_CONSEQUENCE_PHRASES.test(label)) return false
    return true
  })
  // Fallback: if all items were filtered, return the originals so the tree
  // always shows something rather than throwing an avoidable error.
  return valid.length ? valid : items
}

export default function DecisionOS() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const [migrationPrompt, setMigrationPrompt] = useState(false)
  const [localToMigrate, setLocalToMigrate] = useState(null)
  
  const [appState, setAppState] = usePersistentState('decisionos.appState', 'idle')
  const [decisionText, setDecisionText] = usePersistentState('decisionos.decisionText', '')
  const [nodes, setNodes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState([])
  const [isDemo, setIsDemo] = useState(() => isDemoMode())
  const [hist, setHist] = useState({ undo: 0, redo: 0 })

  const [decisions, setDecisions] = useState(() => listDecisions())
  const [currentId, setCurrentId] = useState(null)
  const [saveState, setSaveState] = useState({ status: 'idle', lastSavedAt: null })

  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [summaryStatus, setSummaryStatus] = useState('idle')
  const [summaryError, setSummaryError] = useState('')
  const [summaryStale, setSummaryStale] = useState(false)
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState(null)

  const [transform, setTransform] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 1200,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 800,
    scale: 1,
  }))

  const canvasRef = useRef(null)
  const contentRef = useRef(null)
  const nodesRef = useRef([])
  const transformRef = useRef(transform)
  const selectedIdRef = useRef(null)
  const appStateRef = useRef(appState)
  const decisionTextRef = useRef(decisionText)
  const currentIdRef = useRef(null)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const lastSize = useRef({ w: 0, h: 0 })
  const summaryLoadingRef = useRef(false)
  const wheelAccumRef = useRef({ mx: 0, my: 0, delta: 0 })
  const wheelRafRef = useRef(null)
  const userViewportRef = useRef(false)

  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { appStateRef.current = appState }, [appState])
  useEffect(() => { decisionTextRef.current = decisionText }, [decisionText])
  useEffect(() => { currentIdRef.current = currentId }, [currentId])

  // ---- Toasts ----
  const pushToast = useCallback((message, kind = 'info') => {
    const id = uid('toast')
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200)
  }, [])
  const pushToastRef = useRef(pushToast)
  useEffect(() => { pushToastRef.current = pushToast }, [pushToast])

  // ---- Camera ----
  const SIDEBAR_WIDTH = 288
  const viewCenterX = () => SIDEBAR_WIDTH + (window.innerWidth - SIDEBAR_WIDTH) / 2
  const viewCenterY = () => window.innerHeight / 2

  /**
   * Single write-path for the camera: updates the live ref, moves the content
   * div, and advances the starfield parallax — all directly on the DOM, so
   * manual pan/zoom never needs a React render. Programmatic transforms are
   * routed through here via the layout effect below.
   */
  const applyTransform = useCallback((t) => {
    transformRef.current = t
    const c = contentRef.current
    if (c) c.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`
    const cs = canvasRef.current
    if (cs) {
      cs.style.setProperty('--stars1', `${(t.x * 0.2).toFixed(2)}px ${(t.y * 0.2).toFixed(2)}px`)
      cs.style.setProperty('--stars2', `${(t.x * 0.5).toFixed(2)}px ${(t.y * 0.5).toFixed(2)}px`)
    }
  }, [])

  // Route committed state changes (focus, fit, resize, programmatic moves)
  // to the DOM before paint. The content div itself is styled from the live
  // ref so an interleaved render can never show a stale camera.
  useLayoutEffect(() => {
    applyTransform(transform)
  }, [transform, applyTransform])

  const focusCameraOn = useCallback((x, y, scale) => {
    userViewportRef.current = false
    setTransform((t) => {
      const s = scale ?? t.scale
      return { x: viewCenterX() - x * s, y: viewCenterY() - y * s, scale: s }
    })
  }, [])
  const focusCameraOnRef = useRef(focusCameraOn)
  useEffect(() => { focusCameraOnRef.current = focusCameraOn }, [focusCameraOn])

  const zoomBy = useCallback((factor) => {
    userViewportRef.current = true
    setTransform((t) => ({ ...t, scale: clamp(t.scale * factor, 0.2, 3) }))
  }, [])

  const fitView = useCallback(() => {
    userViewportRef.current = false
    const list = nodesRef.current
    if (!list.length) return
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of list) {
      if (n.isPlaceholder) continue
      const w = n.type === 'decision' ? ROOT_WIDTH : CHILD_WIDTH
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + w)
      minY = Math.min(minY, n.y - 40); maxY = Math.max(maxY, n.y + 40)
    }
    const pad = 160
    const sw = Math.max(1, window.innerWidth - SIDEBAR_WIDTH - pad * 2)
    const sh = Math.max(1, window.innerHeight - pad * 2)
    const scale = clamp(Math.min(sw / Math.max(1, maxX - minX), sh / Math.max(1, maxY - minY)), 0.2, 1.5)
    setTransform({
      scale,
      x: viewCenterX() - ((minX + maxX) / 2) * scale,
      y: viewCenterY() - ((minY + maxY) / 2) * scale,
    })
  }, [])

  // ---- Open a decision from the library ----
  const openDecision = useCallback((id) => {
    const rec = getDecision(id)
    if (!rec) return
    const laid = layoutTree(rec.nodes || [])
    setNodes(laid)
    setCurrentId(id)
    setSelectedId(null)
    setCollapsedIds(new Set())
    setAppState('active')
    userViewportRef.current = false
    if (rec.viewport) {
      setTransform(rec.viewport)
    } else {
      const root = laid.find((n) => !n.parentId)
      if (root) focusCameraOnRef.current(root.x, root.y)
    }
    setLastOpenedId(id)
    setDecisions(listDecisions())
    setDecisionText('')
  }, [setDecisionText])
  const openDecisionRef = useRef(openDecision)
  useEffect(() => { openDecisionRef.current = openDecision }, [openDecision])

  // ---- Auth and Persistence Initialization ----
  useEffect(() => {
    migrateLegacy()
    
    if (authLoading) return
    
    if (user) {
      initSupabaseStore(user).then(() => {
        const locals = getLocalDecisions()
        if (Object.keys(locals).length > 0 && !localStorage.getItem('decisionos.migration.ignored')) {
          setLocalToMigrate(locals)
          setMigrationPrompt(true)
        } else {
          configureProvider(supabaseProvider)
          setAppState((s) => (s === 'animating' ? 'active' : s))
          const list = listDecisions()
          setDecisions(list)
          if (list.length) {
            const lastId = getLastOpenedId()
            const target = list.find((d) => d.id === lastId) || list[0]
            openDecisionRef.current(target.id)
          } else {
            setAppState('idle')
          }
        }
      })
    } else {
      clearSupabaseStore()
      configureLocalProvider()
      setAppState((s) => (s === 'animating' ? 'active' : s))
      const list = listDecisions()
      setDecisions(list)
      if (list.length) {
        const lastId = getLastOpenedId()
        const target = list.find((d) => d.id === lastId) || list[0]
        openDecisionRef.current(target.id)
      } else {
        setAppState('idle')
      }
      
      if (isDemoMode() && !hasSeenDemoHint()) {
        markDemoHint()
        pushToastRef.current(
          'Demo mode — add an API key (Settings, bottom bar): OpenRouter for free multi-model fallback, or Google Gemini for direct access.',
          'info',
        )
      }
    }
  }, [user, authLoading])

  const handleMigration = useCallback((saveToCloud) => {
    if (saveToCloud && localToMigrate) {
      mergeLocalToCloud(localToMigrate)
      clearLocalDecisions()
    } else if (!saveToCloud) {
      localStorage.setItem('decisionos.migration.ignored', 'true')
    }
    configureProvider(supabaseProvider)
    const list = listDecisions()
    setDecisions(list)
    setMigrationPrompt(false)
    setLocalToMigrate(null)
    if (list.length) {
      openDecisionRef.current(list[0].id)
    } else {
      setAppState('idle')
    }
  }, [localToMigrate])

// ---- Auto-save to the decision library (debounced) ----
// The tree AND the camera viewport are persisted so a decision reopens
// exactly where you left it. Debounced (not per event) and batched: rapid
// pan/zoom/edits coalesce into a single write once you stop interacting.
// Viewport is persisted only when the user actually moved the camera (not on
// programmatic re-centering), and viewport-only saves don't bump updatedAt,
// so passive navigation never churns the "Saved · just now" / list ordering.
useEffect(() => {
  const id = currentIdRef.current
  if (!id) return
  const t = setTimeout(() => {
    const rec = getDecision(id)
    if (!rec) return
    const nextNodes = serializeNodes(nodesRef.current)
    const vp = transformRef.current
    const storedVp = rec.viewport
    const nodesSame = JSON.stringify(rec.nodes || []) === JSON.stringify(nextNodes)
    const vpSame = !!storedVp && storedVp.x === vp.x && storedVp.y === vp.y && storedVp.scale === vp.scale
    const saveViewport = !vpSame && userViewportRef.current
    if (nodesSame && !saveViewport) return
    const patch = { nodes: nextNodes }
    if (saveViewport) patch.viewport = vp
    updateDecision(id, patch, { touchTime: !nodesSame })
    userViewportRef.current = false
    setSaveState({ status: 'saved', lastSavedAt: Date.now() })
    setDecisions(listDecisions())
  }, 800)
  return () => clearTimeout(t)
}, [nodes, transform])

  // ---- Decision Summary: cache + invalidation when the tree changes ----
  useEffect(() => {
    if (summaryLoadingRef.current) return
    const id = currentId
    if (!id) {
      setSummaryData(null)
      setSummaryStatus('idle')
      setSummaryStale(false)
      setSummaryGeneratedAt(null)
      return
    }
    const cached = getCachedSummary(id)
    if (cached?.data) {
      const hash = summaryTreeHash(nodesRef.current)
      setSummaryData(normalizeSummary(cached.data))
      setSummaryStale(cached.treeHash !== hash ? 'Outdated' : null)
      setSummaryGeneratedAt(cached.generatedAt || null)
      setSummaryStatus('ready')
    } else {
      setSummaryData(null)
      setSummaryStatus('idle')
      setSummaryStale(false)
      setSummaryGeneratedAt(null)
    }
  }, [currentId, nodes])

  const handleGenerateSummary = useCallback(async () => {
    const id = currentIdRef.current
    const list = nodesRef.current.filter((n) => !n.isPlaceholder)
    if (!id || !list.length) return
    setSummaryOpen(true)
    setSummaryStatus('loading')
    setSummaryError('')
    summaryLoadingRef.current = true
    const hash = summaryTreeHash(list)
    try {
      const data = await generateSummary(list)
      putCachedSummary(id, { data, treeHash: hash, generatedAt: Date.now() })
      setSummaryData(data)
      setSummaryStale(null)
      setSummaryGeneratedAt(Date.now())
      setSummaryStatus('ready')
      pushToast('Decision summary generated.', 'success')
    } catch (err) {
      setSummaryStatus('error')
      setSummaryError(err.message || 'Something went wrong.')
    } finally {
      summaryLoadingRef.current = false
    }
  }, [pushToast])

  // ---- Keep center stable on resize ----
  useEffect(() => {
    lastSize.current = { w: window.innerWidth, h: window.innerHeight }
    const onResize = () => {
      const dw = window.innerWidth - lastSize.current.w
      const dh = window.innerHeight - lastSize.current.h
      lastSize.current = { w: window.innerWidth, h: window.innerHeight }
      userViewportRef.current = false
      setTransform((t) => ({ ...t, x: t.x + dw / 2, y: t.y + dh / 2 }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ---- Wheel zoom-to-cursor ----
  // rAF-throttled: wheel events are coalesced into one transform update per
  // frame (instead of one React render per event) so trackpad scroll/pinch
  // stays smooth, and deltas are normalized across mouse lines/pages.
  const flushWheelZoom = useCallback(() => {
    wheelRafRef.current = null
    const acc = wheelAccumRef.current
    if (!acc.delta) {
      // No pending zoom — ensure state matches the live camera.
      setTransform(transformRef.current)
      return
    }
    const { mx, my } = acc
    // Apply at most ~160px of accumulated delta per frame so a fast flick
    // can't jump the scale; the remainder carries into the next frame.
    const dy = clamp(acc.delta, -160, 160)
    acc.delta -= dy
    const t = transformRef.current
    // Negative dy keeps the conventional direction: wheel-down / pinch-in
    // (positive deltaY) zooms OUT, wheel-up / pinch-out zooms IN.
    // 1.0055^px ≈ +73% per mouse notch, ~10-14% per small trackpad step.
    const factor = Math.pow(1.0055, -dy)
    const scale = clamp(t.scale * factor, 0.2, 3)
    const wx = (mx - t.x) / t.scale
    const wy = (my - t.y) / t.scale
    applyTransform({ scale, x: mx - wx * scale, y: my - wy * scale })
    if (acc.delta) {
      wheelRafRef.current = requestAnimationFrame(flushWheelZoom)
    } else {
      // Zoom settled — push the final camera to state so persistence and
      // any state-driven consumers see it.
      setTransform(transformRef.current)
    }
  }, [applyTransform])

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault()
      userViewportRef.current = true
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 33 // lines → px (mouse wheels)
      else if (e.deltaMode === 2) dy *= window.innerHeight // pages → px
      const acc = wheelAccumRef.current
      acc.mx = e.clientX - rect.left
      acc.my = e.clientY - rect.top
      acc.delta += dy
      if (!wheelRafRef.current) wheelRafRef.current = requestAnimationFrame(flushWheelZoom)
    },
    [flushWheelZoom],
  )
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      c.removeEventListener('wheel', handleWheel)
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current)
      wheelRafRef.current = null
    }
  }, [handleWheel])

  // ---- Pan ----
  // Panning writes the transform straight to the DOM (see applyTransform) so
  // the tree tracks the pointer 1:1 with zero React renders mid-drag; the
  // committed position is pushed to state once on release for persistence.
  const draggingRef = useRef(false)
  const dragRef = useRef({ x: 0, y: 0 })

  const onCanvasPointerDown = (e) => {
    if (e.target !== canvasRef.current) return
    dragRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y }
    draggingRef.current = true
    userViewportRef.current = true
    setSelectedId(null)
    try { canvasRef.current?.setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
  }
  const onCanvasPointerMove = (e) => {
    if (!draggingRef.current) return
    // Use coalesced events when available so every intermediate pointer
    // position is applied — the tree tracks the mouse with zero drop.
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e]
    for (const ev of evs) {
      applyTransform({
        ...transformRef.current,
        x: ev.clientX - dragRef.current.x,
        y: ev.clientY - dragRef.current.y,
      })
    }
  }
  const stopDrag = () => {
    if (draggingRef.current) setTransform(transformRef.current)
    draggingRef.current = false
  }

  // ---- State helpers ----
  const setNodesWithLayout = useCallback((updater) => {
    setNodes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return layoutTree(next)
    })
  }, [])

  // ---- History (undo / redo) ----
  const commit = useCallback(() => {
    const current = serializeNodes(nodesRef.current)
    const last = undoStack.current[undoStack.current.length - 1]
    if (last && JSON.stringify(last) === JSON.stringify(current)) return
    undoStack.current.push(current)
    if (undoStack.current.length > 60) undoStack.current.shift()
    redoStack.current = []
    setHist({ undo: undoStack.current.length, redo: 0 })
  }, [])

  const restoreSnapshot = useCallback((snapshot) => {
    if (!snapshot.length) {
      setNodes([])
      setAppState('idle')
      setSelectedId(null)
      return
    }
    const laid = layoutTree(snapshot)
    setNodes(laid)
    setAppState('active')
    const root = laid.find((n) => !n.parentId)
    if (root) focusCameraOn(root.x, root.y)
  }, [focusCameraOn])

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(serializeNodes(nodesRef.current))
    setHist({ undo: undoStack.current.length, redo: redoStack.current.length })
    restoreSnapshot(prev)
  }, [restoreSnapshot])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(serializeNodes(nodesRef.current))
    setHist({ undo: undoStack.current.length, redo: redoStack.current.length })
    restoreSnapshot(next)
  }, [restoreSnapshot])

  // ---- Path building ----
  const buildPath = useCallback((node) => {
    const parts = []
    let cur = nodes.find((n) => n.id === node?.id)
    const guard = new Set()
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id)
      parts.unshift(cur.label)
      cur = nodes.find((n) => n.id === cur.parentId)
    }
    return parts.join(' → ')
  }, [nodes])

  // ---- Generate a new decision tree ----
  const handleNewDecision = useCallback(async (ev) => {
    if (ev?.preventDefault) ev.preventDefault()
    const text = decisionTextRef.current.trim()
    if (!text || appStateRef.current === 'animating') return
    commit()
    const rec = createDecision({ title: text.slice(0, 120), nodes: [], viewport: null })
    setCurrentId(rec.id)
    setLastOpenedId(rec.id)
    setDecisions(listDecisions())
    setAppState('animating')
    const root = { id: 'root', type: 'decision', label: text, isGenerating: true, createdAt: Date.now() }
    setNodesWithLayout([root])
    focusCameraOn(0, 0)
    try {
      const parsed = await callGemini(dimensionPrompt(text), dimensionSys)
      if (!parsed?.items?.length) throw new Error('The AI returned an empty response.')
      const dims = parsed.items.map((it, idx) => ({
        id: uid('dim'),
        parentId: 'root',
        type: 'dimension',
        label: String(it.label ?? '').slice(0, 90),
        x: 0,
        y: 0,
        createdAt: Date.now() + idx,
      }))
      setNodesWithLayout((prev) => {
        const r = prev.find((n) => n.id === 'root')
        if (!r) return prev
        return [{ ...r, isGenerating: false }, ...dims]
      })
      setAppState('active')
      pushToast(`Mapped across ${dims.length} dimensions. Click any node to expand consequences.`, 'success')
      setTimeout(() => fitView(), 80)
    } catch (err) {
      pushToast(`Could not generate dimensions — ${err.message}`, 'error')
      setNodesWithLayout([{ ...root, isGenerating: false }])
      setAppState('active')
    }
  }, [commit, fitView, pushToast, setNodesWithLayout])

  // ---- Expand a node with consequences ----
  const expandNode = useCallback(async (node) => {
    const current = nodesRef.current.find((n) => n.id === node.id) || node
    if (current.isPlaceholder || current.isGenerating) return
    if (nodesRef.current.some((n) => n.parentId === current.id)) {
      setCollapsedIds((prev) => {
        if (!prev.has(current.id)) return prev
        const next = new Set(prev)
        next.delete(current.id)
        return next
      })
      return
    }

    const activeNodes = nodesRef.current.filter((n) => !n.isPlaceholder).length
    if (activeNodes + 3 > 120) {
      pushToast('Decision map limit reached. Focus on an existing branch or remove a branch to continue exploring.', 'error')
      return
    }

    let depth = 0
    let curParent = current
    while (curParent && curParent.parentId) {
      depth++
      curParent = nodesRef.current.find((n) => n.id === curParent.parentId)
    }
    if (depth >= 3) {
      pushToast('Maximum automatic depth reached. Focus on an existing branch.', 'warning')
      return
    }

    if (activeNodes <= 80 && activeNodes + 3 > 80) {
      pushToast('Your decision map is getting detailed. Focus on a branch to explore it further.', 'info')
    }

    commit()
    setSelectedId(current.id)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(current.id)
      return next
    })

    const placeholders = [1, 2, 3].map(() => ({
      id: uid('tmp'),
      parentId: current.id,
      isPlaceholder: true,
      label: 'Analyzing consequences…',
      type: 'neutral',
      x: current.x,
      y: current.y,
      timeHorizon: 'medium-term',
      likelihood: 'possible',
    }))

    setNodesWithLayout((prev) => {
      const upd = prev.map((n) => (n.id === current.id ? { ...n, isGenerating: true } : n))
      return [...upd, ...placeholders]
    })

    try {
      const root = nodesRef.current.find((n) => !n.parentId)
      const dimension = nodesRef.current.find((n) => n.id === current.parentId)
      const path = buildPath(current)
      const existing = nodesRef.current
        .filter((n) => n.parentId === current.id && !n.isPlaceholder)
        .map((n) => n.label)
      const treeExisting = nodesRef.current
        .filter((n) => !n.isPlaceholder && n.id !== current.id && n.parentId !== current.id)
        .map((n) => n.label)
        .slice(-80)
      const parsed = await callGemini(
        consequencePrompt(root, dimension, path, current, existing, treeExisting),
        consequenceSys,
      )
      if (!parsed?.items?.length) throw new Error('The AI returned an empty response.')
      const kids = sanitizeConsequences(parsed.items).map((it, idx) => ({
        id: uid('n'),
        parentId: current.id,
        type: sanitizeType(it.type),
        label: String(it.label ?? '').slice(0, 160),
        description: String(it.description ?? '').slice(0, 240),
        timeHorizon: sanitizeHorizon(it.timeframe ?? it.timeHorizon),
        likelihood: sanitizeLikelihood(it.likelihood ?? it.confidence),
        x: current.x,
        y: current.y,
        createdAt: Date.now() + idx,
      }))
      setNodesWithLayout((prev) => {
        const filtered = prev.filter((n) => !n.isPlaceholder)
        const upd = filtered.map((n) => (n.id === current.id ? { ...n, isGenerating: false } : n))
        return [...upd, ...kids]
      })
      pushToast(`Added ${kids.length} consequence${kids.length === 1 ? '' : 's'}.`, 'success')
    } catch (err) {
      pushToast(`Generation failed — ${err.message}`, 'error')
      setNodesWithLayout((prev) =>
        prev.filter((n) => !n.isPlaceholder).map((n) => (n.id === current.id ? { ...n, isGenerating: false } : n)),
      )
    }
  }, [buildPath, commit, pushToast, setNodesWithLayout])

  // ---- Node interactions ----
  const handleNodeClick = useCallback((node) => {
    if (node.isPlaceholder || node.isGenerating) return
    setSelectedId(node.id)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      let cur = nodesRef.current.find((n) => n.id === node.id)
      while (cur) {
        next.delete(cur.id)
        cur = nodesRef.current.find((n) => n.id === cur.parentId)
      }
      return next
    })
    const hasChildren = nodesRef.current.some((n) => n.parentId === node.id)
    if (!hasChildren) expandNode(node)
  }, [expandNode, focusCameraOn])

  const handleToggleCollapse = useCallback((nodeId) => {
    commit()
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [commit])

  const handleDelete = useCallback((nodeId) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node) return
    commit()
    if (!node.parentId) {
      // Deleting the root deletes the whole decision from the library.
      const id = currentIdRef.current
      if (id) {
        deleteDecision(id)
        clearSummaryForDecision(id)
        setDecisions(listDecisions())
        setCurrentId(null)
        if (getLastOpenedId() === id) setLastOpenedId(null)
      }
      setNodes([])
      setSelectedId(null)
      setCollapsedIds(new Set())
      setSummaryOpen(false)
      setAppState('idle')
      userViewportRef.current = false
      setTransform((t) => ({ ...t, x: viewCenterX(), y: viewCenterY(), scale: 1 }))
      pushToast('Decision deleted.', 'info')
      return
    }
    const doomed = new Set()
    const collect = (id) => {
      doomed.add(id)
      for (const n of nodesRef.current) if (n.parentId === id) collect(n.id)
    }
    collect(nodeId)
    setNodesWithLayout((prev) => prev.filter((n) => !doomed.has(n.id)))
    if (selectedIdRef.current && doomed.has(selectedIdRef.current)) setSelectedId(null)
    pushToast('Node removed.', 'info')
  }, [commit, pushToast, setNodesWithLayout])

  const handleRename = useCallback((nodeId, label) => {
    const clean = String(label ?? '').trim()
    if (!clean) return
    commit()
    setNodesWithLayout((prev) => prev.map((n) => (n.id === nodeId ? { ...n, label: clean } : n)))
  }, [commit, setNodesWithLayout])

  const handleReset = useCallback(() => {
    // Return to the dashboard / start screen. The current decision stays
    // saved in the library (do not destroy it) — keep nodes & currentId so
    // auto-save never runs on an empty tree.
    if (nodesRef.current.length) commit()
    setSelectedId(null)
    setCollapsedIds(new Set())
    setSummaryOpen(false)
    setAppState('idle')
    setDecisionText('')
  }, [commit, setDecisionText])

  // ---- Library actions (sidebar / dashboard) ----
  const handleLibraryDelete = useCallback((id) => {
    const wasCurrent = currentIdRef.current === id
    deleteDecision(id)
    clearSummaryForDecision(id)
    setDecisions(listDecisions())
    if (wasCurrent) {
      setCurrentId(null)
      setNodes([])
      setSelectedId(null)
      setCollapsedIds(new Set())
      setSummaryOpen(false)
      setAppState('idle')
      pushToast('Decision deleted.', 'info')
    } else {
      pushToast('Decision deleted.', 'info')
    }
  }, [pushToast])

  const handleLibraryRename = useCallback((id, title) => {
    const clean = String(title ?? '').trim()
    if (!clean) return
    updateDecision(id, { title: clean.slice(0, 120) })
    setDecisions(listDecisions())
  }, [])

  const handleLibraryDuplicate = useCallback((id) => {
    const copy = duplicateDecision(id)
    if (copy) {
      setDecisions(listDecisions())
      pushToast('Decision duplicated.', 'success')
    }
  }, [pushToast])

  const handleNewFromSidebar = useCallback(() => {
    // Start fresh: detach from the current decision (already auto-saved) so
    // clearing the canvas never overwrites it.
    setCurrentId(null)
    setDecisionText('')
    setNodes([])
    setSelectedId(null)
    setCollapsedIds(new Set())
    setSummaryOpen(false)
    setAppState('idle')
  }, [setDecisionText])

  const handleSaveKey = useCallback((key) => {
    saveApiKey(key.trim())
    setIsDemo(isDemoMode())
    pushToast(key.trim() ? 'API key saved. AI generation is live.' : 'API key cleared — demo mode on.', 'success')
  }, [pushToast])

  const handleSaveOpenRouterKey = useCallback((key) => {
    saveOpenRouterKey(key.trim())
    setIsDemo(isDemoMode())
    pushToast(
      key.trim() ? 'OpenRouter key saved — multi-model fallback is live.' : 'OpenRouter key cleared.',
      'success',
    )
  }, [pushToast])

  // ---- Keyboard shortcuts ----
  useKeyboardShortcuts({
    fit: fitView,
    reset: handleReset,
    escape: () => setSelectedId(null),
    zoomIn: () => zoomBy(1.2),
    zoomOut: () => zoomBy(1 / 1.2),
    undo,
    redo,
    deleteSelected: () => {
      const id = selectedIdRef.current
      if (id) handleDelete(id)
    },
  })

  // ---- Derived state ----
  const isUnderCollapsed = useCallback((n) => {
    let cur = n
    const guard = new Set()
    while (cur && cur.parentId && !guard.has(cur.id)) {
      guard.add(cur.id)
      const p = nodes.find((x) => x.id === cur.parentId)
      if (!p) break
      if (collapsedIds.has(p.id)) return true
      cur = p
    }
    return false
  }, [nodes, collapsedIds])

  const renderedNodes = useMemo(() => nodes.filter((n) => !isUnderCollapsed(n)), [nodes, isUnderCollapsed])

  const relatedIds = useMemo(() => {
    if (!selectedId) return new Set()
    const set = new Set()
    const addTree = (id) => {
      set.add(id)
      for (const n of nodes) if (n.parentId === id) addTree(n.id)
    }
    addTree(selectedId)
    let cur = nodes.find((n) => n.id === selectedId)
    const guard = new Set()
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id)
      set.add(cur.id)
      cur = nodes.find((n) => n.id === cur.parentId)
    }
    return set
  }, [selectedId, nodes])

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId])
  const selectedPath = useMemo(() => (selectedNode ? buildPath(selectedNode) : ''), [selectedNode, buildPath])

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return nodes.filter((n) => !n.isPlaceholder && n.label.toLowerCase().includes(q))
  }, [searchQuery, nodes])

  const selectSearchMatch = useCallback((node) => {
    setSelectedId(node.id)
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      let cur = nodesRef.current.find((n) => n.id === node.id)
      while (cur) {
        next.delete(cur.id)
        cur = nodesRef.current.find((n) => n.id === cur.parentId)
      }
      return next
    })
    focusCameraOn(node.x, node.y)
  }, [focusCameraOn])

  const stats = useMemo(() => {
    const c = { total: renderedNodes.length, decision: 0, dimension: 0, opportunity: 0, risk: 0, tradeoff: 0, neutral: 0 }
    for (const n of renderedNodes) c[n.type] = (c[n.type] || 0) + 1
    return c
  }, [renderedNodes])

  const nodeHasChildren = useCallback((id) => nodes.some((n) => n.parentId === id), [nodes])

  return (
    <div className="relative w-full h-screen bg-[#09090b] font-sans overflow-hidden select-none">
      {!user && !authLoading && (
        <div className="absolute top-6 right-8 z-[60]">
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center h-11 px-6 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition-all font-semibold text-base cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue with Google
          </button>
        </div>
      )}
      {migrationPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Save your existing decisions to your account?</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              We found decisions created on this device. Would you like to save them to your cloud account?
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleMigration(true)}
                className="w-full bg-white text-zinc-950 font-medium py-2 rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Save to Account
              </button>
              <button 
                onClick={() => handleMigration(false)}
                className="w-full bg-transparent border border-zinc-700 text-zinc-300 font-medium py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Keep on This Device
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar
        decisions={decisions}
        currentId={currentId}
        saveStatus={saveState.status}
        lastSavedAt={saveState.lastSavedAt}
        onSelect={openDecision}
        onNew={handleNewFromSidebar}
        onRename={handleLibraryRename}
        onDelete={handleLibraryDelete}
        onDuplicate={handleLibraryDuplicate}
        canSummarize={!!currentId && nodes.length > 0 && appState !== 'idle'}
        summaryStatus={summaryStatus}
        onSummarize={handleGenerateSummary}
        user={user}
        signInWithGoogle={signInWithGoogle}
        signOut={signOut}
        isDemo={isDemo}
        onSaveKey={handleSaveKey}
        onSaveOpenRouterKey={handleSaveOpenRouterKey}
      />

      {/* Dashboard / start screen */}
      <div
        className={`absolute inset-0 left-72 z-30 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          appState !== 'idle'
            ? 'opacity-0 scale-95 blur-md translate-y-20 pointer-events-none'
            : 'opacity-100 scale-100 blur-0 translate-y-0'
        }`}
      >
        <Dashboard
          decisions={decisions}
          value={decisionText}
          onChange={setDecisionText}
          onSubmit={handleNewDecision}
          isDemo={isDemo}
          onOpen={openDecision}
        />
      </div>

      {/* Main canvas */}
      <div
        ref={canvasRef}
        className={`absolute inset-0 left-72 cursor-grab active:cursor-grabbing transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          appState === 'idle' ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100 blur-0'
        }`}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
      >
        <Starfield />
        <div
          ref={contentRef}
          className="absolute origin-top-left will-change-transform"
          style={{ transform: `translate3d(${transformRef.current.x}px, ${transformRef.current.y}px, 0) scale(${transformRef.current.scale})` }}
        >
          <EdgeLayer nodes={renderedNodes} relatedIds={relatedIds} selectedId={selectedId} />
          {renderedNodes.map((node) => (
            <NodeView
              key={node.id}
              node={node}
              selected={selectedId === node.id}
              dimmed={!!selectedId && !relatedIds.has(node.id)}
              hasChildren={nodeHasChildren(node.id)}
              collapsed={collapsedIds.has(node.id)}
              onSelect={handleNodeClick}
              onToggleCollapse={handleToggleCollapse}
              onAddMore={expandNode}
            />
          ))}
        </div>
      </div>

      {/* Chrome overlays (active state only) */}
      {appState !== 'idle' && (
        <>
          <Legend />
          <SearchBar query={searchQuery} setQuery={setSearchQuery} matches={searchMatches} onSelect={selectSearchMatch} />
          <StatsBar stats={stats} isDemo={isDemo} />
          <DetailPanel
            node={selectedNode}
            path={selectedPath}
            onClose={() => setSelectedId(null)}
            onRename={handleRename}
            onDelete={handleDelete}
            onAddMore={expandNode}
            onToggleCollapse={handleToggleCollapse}
            hasChildren={selectedNode ? nodeHasChildren(selectedNode.id) : false}
            collapsed={selectedNode ? collapsedIds.has(selectedNode.id) : false}
            isDemo={isDemo}
          />
          <ZoomControls
            onZoomIn={() => zoomBy(1.25)}
            onZoomOut={() => zoomBy(0.8)}
            onFit={fitView}
            onReset={handleReset}
          />
          <CommandBar
            value={decisionText}
            onChange={setDecisionText}
            onSubmit={handleNewDecision}
            onReset={handleReset}
            onUndo={undo}
            onRedo={redo}
            canUndo={hist.undo > 0}
            canRedo={hist.redo > 0}
          />
          <SummaryPanel
            open={summaryOpen}
            data={summaryData}
            status={summaryStatus}
            error={summaryError}
            stale={summaryStale}
            generatedAt={summaryGeneratedAt}
            onClose={() => setSummaryOpen(false)}
            onGenerate={handleGenerateSummary}
          />
        </>
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}
