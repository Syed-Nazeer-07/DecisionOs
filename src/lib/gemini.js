import { hashString, mulberry32 } from './utils'
import { loadApiKey, loadOpenRouterKey } from './storage'

const MODEL = 'gemini-3.5-flash-lite'

export const getApiKey = () => import.meta.env?.VITE_GEMINI_API_KEY || loadApiKey()
export const getOpenRouterKey = () => import.meta.env?.VITE_OPENROUTER_API_KEY || loadOpenRouterKey()

export const isDemoMode = () => !getApiKey() && !getOpenRouterKey()

/** Which provider will handle requests right now. */
export const getActiveProvider = () => (getOpenRouterKey() ? 'openrouter' : getApiKey() ? 'gemini' : 'demo')

/** Both key generations are valid: legacy Standard keys start with "AIza",
 *  and the newer Authorization keys start with "AQ." (default for all new
 *  keys created in Google AI Studio since 2026). Don't prefix-match. */
export const isValidApiKey = (key) => typeof key === 'string' && key.trim().length > 20

export const isValidOpenRouterKey = (key) => {
  if (typeof key !== 'string') return false
  const t = key.trim()
  return t.startsWith('sk-or-v1-') && t.length > 20
}

/**
 * OpenRouter model chain. Free models first (no credits needed), then cheap
 * paid ones. We try them in order and fall back on rate limits / failures so
 * usage stays effectively unlimited even when a single model is throttled.
 * Free variants change over time — any model that 404s is simply skipped.
 */
export const OPENROUTER_MODELS = [
  // Free tier (no credit required)
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.5-flash-lite:free',
  'google/gemini-2.5-flash:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'moonshotai/kimi-k2-instruct:free',
  'z-ai/glm-4-flash:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen3-8b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-small-24b-instruct:free',
  'openai/gpt-5-nano:free',
  'google/gemini-2.0-flash-exp:free',
  'open-r1/olympiccoder-7b:free',
  'z-ai/glm-4.5-air:free',
  // Cheap / capable paid tier (fallback when free models are throttled)
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash-001',
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
  'mistralai/mistral-small-24b-instruct:2501',
  'openai/gpt-4o-mini',
  'z-ai/glm-4-plus',
  'amazon/nova-lite-v1',
]

async function openRouterRequest(models, prompt, systemInstruction, signal) {
  const key = getOpenRouterKey()
  const errors = []
  for (const model of models) {
    let fatal = null
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://decisionos.app',
          'X-Title': 'DecisionOS',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction || '' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal,
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content
        if (text) return parseJsonLoose(text)
        errors.push(`${model}: empty response`)
        continue
      }
      let apiMessage = ''
      try {
        const body = await res.json()
        apiMessage = body?.error?.message || ''
      } catch {
        /* non-JSON error body */
      }
      if (res.status === 401 || res.status === 403) {
        fatal = new Error(
          apiMessage
            ? `OpenRouter rejected the key (${res.status}) — ${apiMessage}`
            : `OpenRouter rejected the key (${res.status}). Verify it at openrouter.ai/keys.`,
        )
      } else {
        errors.push(`${model}: ${apiMessage || `HTTP ${res.status}`}`)
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      errors.push(`${model}: ${err?.message || 'network error'}`)
    }
    if (fatal) throw fatal
  }
  const shown = errors.slice(0, 3).join(' | ')
  throw new Error(
    `All ${models.length} OpenRouter models failed${shown ? ` — ${shown}` : ''}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ''}. Try again in a minute or check the key.`,
  )
}

/**
 * Calls the AI provider for content generation. Provider priority:
 *   1. OpenRouter (if an OpenRouter key is set) — multi-model fallback.
 *   2. Google Gemini (if a Gemini key is set).
 *   3. Seeded demo generator (no key) so the app is always usable.
 */
export async function callGemini(prompt, systemInstruction, { signal } = {}) {
  const openRouterKey = getOpenRouterKey()
  if (openRouterKey) {
    if (!isValidOpenRouterKey(openRouterKey)) {
      throw new Error('The OpenRouter key looks invalid — it should start with "sk-or-v1-". Get one at openrouter.ai/keys.')
    }
    return openRouterRequest(OPENROUTER_MODELS, prompt, systemInstruction, signal)
  }

  const key = getApiKey()
  if (!key) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
    return demoResponse(String(prompt))
  }

  if (!isValidApiKey(key)) {
    throw new Error('That does not look like a Gemini API key. Get one at aistudio.google.com/apikey (keys start with "AIza…" or "AQ…").')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
    signal,
  })

  if (!res.ok) {
    let apiMessage = ''
    try {
      const body = await res.json()
      apiMessage = body?.error?.message || ''
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 429) {
      throw new Error(
        apiMessage ||
          'Rate limit or quota reached (429). Wait a minute, or check the key is active and has a billing quota at aistudio.google.com/apikey.',
      )
    }
    if (res.status === 401) {
      throw new Error(
        apiMessage ||
          'Unauthorized (401). The key was rejected — verify it at aistudio.google.com/apikey, or try regenerating it.',
      )
    }
    if (res.status === 403) {
      throw new Error('Access denied (403). The API key may be wrong, expired, or the API is disabled for it.')
    }
    if (res.status === 400) {
      throw new Error(`Bad request (400)${apiMessage ? ` — ${apiMessage}` : ''}.`)
    }
    throw new Error(`AI request failed (${res.status})${apiMessage ? ` — ${apiMessage}` : ''}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty AI response')
  return parseJsonLoose(text)
}

function parseJsonLoose(text) {
  const cleaned = String(text).replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('Malformed AI response')
  }
}

// ── Demo mode ─────────────────────────────────────────────────────────────────
// Category-aware offline generator. Produces realistic, causal consequences
// and decision-specific dimensions instead of generic template strings.

function detectDecisionCategory(text) {
  const t = text.toLowerCase()
  // Career check MUST come before education because "freelancing while studying"
  // should be 'career', not 'education'. Also handles: "focus on my career", "programmer".
  if (/9.5|9-5|day job|employ|salar|startup|business|entrepreneur|freelanc|quit.*job|leave.*job|own.*business|current career|my career|programming|coding|developer|software/.test(t)) return 'career'
  if (/study abroad|study local|university|college|degree|overseas|international.*school|school.*abroad|education/.test(t)) return 'education'
  if (/buy|purchase|laptop|phone|device|gadget|equipment|save.*month|saving.*month|afford|wait.*buy/.test(t)) return 'purchase'
  if (/move|relocat|city|country|rent|house|home/.test(t)) return 'relocation'
  return 'general'
}

// ── Category-specific dimension banks ──────────────────────────────────────
const CATEGORY_DIMS = {
  career: [
    'Financial stability risk',
    'Skill development rate',
    'Earning ceiling',
    'Work-life boundary control',
    'Professional network access',
    'Employment safety net',
    'Time to profitable output',
  ],
  education: [
    'Tuition and living cost',
    'Graduate employment outcome',
    'International network access',
    'Instruction quality gap',
    'Distance from home support',
    'Cultural adjustment burden',
    'Credential transferability',
  ],
  purchase: [
    'Upfront capital required',
    'Opportunity cost of savings',
    'Depreciation and obsolescence risk',
    'Immediate productivity value',
    'Financing risk',
    'Delay and availability risk',
  ],
  relocation: [
    'Cost of living difference',
    'Proximity to support network',
    'Career opportunity access',
    'Cultural adjustment burden',
    'Housing affordability',
    'Social integration timeline',
  ],
  general: [
    'Financial impact',
    'Time commitment',
    'Opportunity cost',
    'Risk exposure',
    'Long-term optionality',
    'Stakeholder alignment',
    'Personal energy required',
  ],
}

// ── Category-specific realistic consequence banks ──────────────────────────
// All consequences use hedged language, follow cause→effect structure,
// and are written as complete causal sentences (not generic filler).
const CATEGORY_CONSEQUENCES = {
  career: [
    { label: 'Loss of employer-provided benefits such as health cover may create additional out-of-pocket monthly costs.', type: 'risk', time: 'immediate', lik: 'likely' },
    { label: 'Building a client base from zero may result in revenue below a salary level for the first one to two years.', type: 'risk', time: 'short-term', lik: 'likely' },
    { label: 'Self-financing tools, software, and training removes the employer subsidy that a fixed role typically provides.', type: 'risk', time: 'immediate', lik: 'possible' },
    { label: 'Owning all business decisions may develop practical skills in sales and operations faster than a fixed role allows.', type: 'opportunity', time: 'medium-term', lik: 'possible' },
    { label: 'Successful revenue growth could eventually exceed a capped salary, raising long-term earning potential beyond employment limits.', type: 'opportunity', time: 'long-term', lik: 'uncertain' },
    { label: 'A structured employer role provides a predictable schedule, which may reduce the cognitive overhead of managing all business functions alone.', type: 'opportunity', time: 'immediate', lik: 'likely' },
    { label: 'Irregular income makes it harder to maintain fixed financial commitments like loan repayments or monthly rent.', type: 'tradeoff', time: 'immediate', lik: 'likely' },
    { label: 'Trading salary stability for business ownership means absorbing all operational risk without institutional backing or safety net.', type: 'tradeoff', time: 'short-term', lik: 'likely' },
    { label: 'An employer-set schedule limits discretionary time, which may reduce capacity for personal projects or family commitments.', type: 'neutral', time: 'immediate', lik: 'likely' },
  ],
  education: [
    { label: 'Overseas tuition, visa fees, and higher living costs may significantly increase total education debt compared to studying locally.', type: 'risk', time: 'immediate', lik: 'likely' },
    { label: 'Adapting to a new academic system and potentially a different language may temporarily lower grades during the first semester.', type: 'risk', time: 'immediate', lik: 'possible' },
    { label: 'Distance from family support networks may increase reliance on personal resilience during academically or emotionally difficult periods.', type: 'risk', time: 'short-term', lik: 'possible' },
    { label: 'International classmates and alumni networks may provide employment connections in target markets that local study would not.', type: 'opportunity', time: 'long-term', lik: 'possible' },
    { label: 'Exposure to a foreign research environment may introduce methodologies or equipment not available in the home country.', type: 'opportunity', time: 'medium-term', lik: 'possible' },
    { label: 'Managing finances independently abroad may accelerate practical budgeting skills compared to living at home during study.', type: 'opportunity', time: 'short-term', lik: 'likely' },
    { label: 'Studying locally avoids relocation costs but may reduce access to institutions with stronger international recognition or rankings.', type: 'tradeoff', time: 'medium-term', lik: 'possible' },
    { label: 'An internationally issued degree may carry different employer weight depending on the graduate\'s target job market geography.', type: 'neutral', time: 'long-term', lik: 'uncertain' },
  ],
  purchase: [
    { label: 'Buying now depletes a savings buffer that could otherwise cover unexpected medical or emergency expenses in the near term.', type: 'risk', time: 'immediate', lik: 'likely' },
    { label: 'Using credit to purchase immediately may increase the total cost through interest charges if repayment is delayed.', type: 'risk', time: 'short-term', lik: 'possible' },
    { label: 'Delaying the purchase risks price increases or stock shortages in the specific model within the six-month window.', type: 'risk', time: 'short-term', lik: 'possible' },
    { label: 'Buying now allows immediate use of the device, which may generate productivity returns during the period that would otherwise be spent saving.', type: 'opportunity', time: 'immediate', lik: 'possible' },
    { label: 'Waiting six months may expose newer models at a similar or lower price point with meaningfully better specifications.', type: 'opportunity', time: 'short-term', lik: 'possible' },
    { label: 'Saving for six months enables a debt-free purchase, removing monthly repayment obligations from the personal budget.', type: 'opportunity', time: 'short-term', lik: 'likely' },
    { label: 'Committing savings now reduces financial flexibility for other unexpected spending needs over the next six months.', type: 'tradeoff', time: 'immediate', lik: 'likely' },
    { label: 'Deferring the purchase preserves capital but may require continuing with a slower or less capable setup in the interim.', type: 'tradeoff', time: 'short-term', lik: 'likely' },
  ],
  relocation: [
    { label: 'Moving typically requires an upfront outlay for deposits, transport, and housing setup costs before income stabilises.', type: 'risk', time: 'immediate', lik: 'likely' },
    { label: 'Reduced proximity to existing social networks may increase isolation and dependency on new relationships during the adjustment period.', type: 'risk', time: 'short-term', lik: 'possible' },
    { label: 'Access to a new labour market may expose roles and industries that are structurally unavailable in the current location.', type: 'opportunity', time: 'medium-term', lik: 'possible' },
    { label: 'Cultural adjustment to a new city or country may temporarily reduce personal productivity and sense of familiarity.', type: 'risk', time: 'immediate', lik: 'possible' },
    { label: 'Staying in the current location preserves established support systems but may limit long-term career mobility and earnings.', type: 'tradeoff', time: 'long-term', lik: 'possible' },
    { label: 'Lower cost of living in the destination may increase discretionary savings rate compared to the current location.', type: 'opportunity', time: 'short-term', lik: 'possible' },
  ],
  general: [
    { label: 'Committing to this path occupies time and attention that cannot simultaneously be applied to the alternative.', type: 'neutral', time: 'immediate', lik: 'likely' },
    { label: 'Early-stage friction may reduce short-term output before the benefits of the chosen direction become visible.', type: 'risk', time: 'short-term', lik: 'possible' },
    { label: 'Sustained effort in this direction may create compounding advantages that become harder to access by starting later.', type: 'opportunity', time: 'long-term', lik: 'uncertain' },
    { label: 'The chosen path may limit access to opportunities that would have emerged from the alternative direction.', type: 'risk', time: 'medium-term', lik: 'possible' },
    { label: 'Reversing this decision later may involve sunk-cost friction that complicates the transition back to the alternative.', type: 'tradeoff', time: 'medium-term', lik: 'likely' },
    { label: 'Some downstream outcomes depend on external conditions that neither option can control or reliably predict.', type: 'neutral', time: 'long-term', lik: 'uncertain' },
  ],
}

function pickUnique(rand, count, max) {
  const picks = []
  while (picks.length < count) {
    const i = Math.floor(rand() * max)
    if (!picks.includes(i)) picks.push(i)
  }
  return picks
}

function demoResponse(prompt) {
  const rand = mulberry32(hashString(prompt))

  // ── Executive summary ───────────────────────────────────────────────────
  if (prompt.includes('EXECUTIVE DECISION SUMMARY')) {
    const quoted = prompt.match(/"[^"]*"/g) || []
    const decision = quoted.length ? quoted[0].replace(/"/g, '').slice(0, 60) : 'the decision'
    const category = detectDecisionCategory(decision)
    if (category === 'career') {
      return {
        keyOpportunities: ['Business ownership may raise long-term earnings beyond a fixed salary ceiling', 'Full control of project selection and daily schedule', 'Faster practical skill development in sales and operations than a fixed role allows'],
        keyRisks: ['Revenue may fall below salary level for one to two years during ramp-up', 'Loss of employer benefits such as health cover and paid leave', 'Client acquisition may take longer than the available financial runway'],
        keyTradeoffs: ['Salary stability vs long-term earning upside', 'Lower short-term income in exchange for autonomy and ownership'],
        mostLikelyOutcomes: ['Income below salary level during the first year', 'Accelerated development of business operations skills'],
        highestImpactDimension: 'Financial stability risk',
        majorThemes: ['Financial risk', 'Autonomy', 'Skill development', 'Long-term earning potential'],
      }
    }
    if (category === 'education') {
      return {
        keyOpportunities: ['International alumni networks may open career channels not available through local study', 'Exposure to foreign research environments and methodologies', 'Independent living abroad accelerates self-management and budgeting skills'],
        keyRisks: ['Higher tuition and living costs may significantly increase total debt', 'Adapting to a new academic system may temporarily reduce grades', 'Distance from family support during difficult periods increases personal burden'],
        keyTradeoffs: ['Lower cost of local study vs stronger international credential recognition', 'Comfort of home vs career network reach'],
        mostLikelyOutcomes: ['Increased total cost compared to studying locally', 'Stronger international professional network over five or more years'],
        highestImpactDimension: 'Tuition and living cost',
        majorThemes: ['Financial burden', 'Network access', 'Cultural adjustment', 'Credential value'],
      }
    }
    if (category === 'purchase') {
      return {
        keyOpportunities: ['Buying now enables immediate productive use during the saving period', 'Saving first allows a debt-free purchase and removes repayment obligations', 'Waiting may expose better models at a similar price point'],
        keyRisks: ['Immediate purchase depletes the emergency savings buffer', 'Delaying risks price increases or stock shortages in the target model', 'Credit financing may increase total cost through interest'],
        keyTradeoffs: ['Immediate capability vs preserved capital flexibility', 'Debt-free purchase vs delayed access to the device'],
        mostLikelyOutcomes: ['Reduced financial flexibility if purchasing now', 'Better specifications available within six months at a similar price'],
        highestImpactDimension: 'Upfront capital required',
        majorThemes: ['Capital allocation', 'Opportunity cost', 'Depreciation risk', 'Cash flow flexibility'],
      }
    }
    return {
      keyOpportunities: ['Compounding advantages from early commitment to this direction', 'Access to opportunities that the alternative path does not provide'],
      keyRisks: ['Short-term adjustment costs before the benefits materialise', 'Opportunity cost of the alternative path not taken'],
      keyTradeoffs: ['Short-term stability vs long-term optionality', 'Immediate discomfort vs deferred benefit'],
      mostLikelyOutcomes: ['Some initial friction before the chosen direction stabilises', 'Reduced flexibility to reverse direction without sunk-cost friction'],
      highestImpactDimension: 'Financial impact',
      majorThemes: ['Opportunity cost', 'Risk tolerance', 'Long-term commitment'],
    }
  }

  // ── Dimensions ─────────────────────────────────────────────────────────
  const isDimRequest = prompt.includes('evaluation dimensions') || prompt.includes('Generate 5')
  if (isDimRequest) {
    const decMatch = prompt.match(/Decision:\s*\n?"([^"]+)"/)
    const decision = decMatch ? decMatch[1] : ''
    const category = detectDecisionCategory(decision)
    const pool = CATEGORY_DIMS[category] || CATEGORY_DIMS.general
    const count = 5 + Math.floor(rand() * 2) // 5 or 6
    const picks = pickUnique(rand, Math.min(count, pool.length), pool.length)
    return {
      items: picks.map((i) => ({ label: pool[i], type: 'dimension' })),
    }
  }

  // ── Consequences ───────────────────────────────────────────────────────
  const decMatch = prompt.match(/DECISION:\s*"([^"]+)"/)
  const decision = decMatch ? decMatch[1] : ''
  const category = detectDecisionCategory(decision)
  const pool = CATEGORY_CONSEQUENCES[category] || CATEGORY_CONSEQUENCES.general
  const picks = pickUnique(rand, Math.min(3, pool.length), pool.length)
  return {
    items: picks.map((i) => ({
      label: pool[i].label,
      type: pool[i].type,
      timeHorizon: pool[i].time,
      likelihood: pool[i].lik,
    })),
  }
}
