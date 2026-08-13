const API_KEY_KEY = 'decisionos.apiKey'
const OPENROUTER_KEY_KEY = 'decisionos.openRouterKey'
const DEMO_HINT_KEY = 'decisionos.demoHintSeen'

export const loadApiKey = () => localStorage.getItem(API_KEY_KEY) || ''

export const saveApiKey = (key) => {
  if (key) localStorage.setItem(API_KEY_KEY, key)
  else localStorage.removeItem(API_KEY_KEY)
}

export const loadOpenRouterKey = () => localStorage.getItem(OPENROUTER_KEY_KEY) || ''

export const saveOpenRouterKey = (key) => {
  if (key) localStorage.setItem(OPENROUTER_KEY_KEY, key)
  else localStorage.removeItem(OPENROUTER_KEY_KEY)
}

export const hasSeenDemoHint = () => !!localStorage.getItem(DEMO_HINT_KEY)

export const markDemoHint = () => localStorage.setItem(DEMO_HINT_KEY, '1')
