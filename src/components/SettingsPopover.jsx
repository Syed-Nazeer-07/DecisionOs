import React, { useState } from 'react'
import {
  Check,
  ExternalLink,
  Globe,
  HelpCircle,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import {
  getApiKey,
  getOpenRouterKey,
  getActiveProvider,
  isValidApiKey,
  isValidOpenRouterKey,
  OPENROUTER_MODELS,
} from '../lib/gemini'

const LINKS = {
  openRouterKeys: 'https://openrouter.ai/keys',
  openRouterSite: 'https://openrouter.ai',
  gemini: 'https://aistudio.google.com/apikey',
}

function Link({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-500/40 inline-flex items-center gap-0.5"
    >
      {children} <ExternalLink size={10} />
    </a>
  )
}

function Field({
  value,
  onChange,
  invalid,
  invalidMsg,
  placeholder,
  accent,
}) {
  return (
    <div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors ${
          invalid ? 'border-rose-500/60 focus:border-rose-500' : 'border-zinc-700 focus:border-zinc-500'
        }`}
      />
      {invalid && <div className={`text-xs ${accent === 'rose' ? 'text-rose-400' : 'text-amber-400'} mt-1.5 leading-relaxed`}>{invalidMsg}</div>}
    </div>
  )
}

export default function SettingsPopover({ onSaveKey, onSaveOpenRouterKey, onClose, className = 'right-0' }) {
  const [gemVal, setGemVal] = useState(getApiKey())
  const [orVal, setOrVal] = useState(getOpenRouterKey())
  const [saved, setSaved] = useState('')

  const active = getActiveProvider()

  const gemTrim = gemVal.trim()
  const gemBad = gemTrim.length > 0 && !isValidApiKey(gemTrim)

  const orTrim = orVal.trim()
  const orBad = orTrim.length > 0 && !isValidOpenRouterKey(orTrim)

  const flashSaved = (label) => {
    setSaved(label)
    setTimeout(() => setSaved(''), 1600)
  }

  return (
    <div className={`absolute bottom-full mb-3 w-[480px] max-w-[94vw] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-5 flex flex-col max-h-[80vh] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-base text-zinc-200 font-medium">
          <KeyRound size={16} /> AI Settings
        </div>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="overflow-y-auto pr-1 -mr-1 space-y-5">
        {/* Active provider */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Status:</span>
          {active === 'openrouter' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              <Sparkles size={11} /> OpenRouter · multi-model fallback
            </span>
          ) : active === 'gemini' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Zap size={11} /> Google Gemini
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Demo mode (no key)
            </span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Check size={12} /> {saved}
            </span>
          )}
        </div>

        {/* OpenRouter */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">OpenRouter</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Recommended
            </span>
          </div>
          <Field
            value={orVal}
            onChange={setOrVal}
            invalid={orBad}
            invalidMsg={`That does not look like an OpenRouter key. Keys start with ${'`'}sk-or-v1-${'`'} and are created at ${'`'}openrouter.ai/keys${'`'}.`}
            placeholder="sk-or-v1-…"
            accent="rose"
          />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            One key routes requests across {OPENROUTER_MODELS.length} models in order,
            falling back when one is rate-limited or unavailable. Usage is subject to your
            OpenRouter account and individual model limits.
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-600">
              <Link href={LINKS.openRouterKeys}>Get a key</Link>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setOrVal('')
                  onSaveOpenRouterKey('')
                  flashSaved('cleared')
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  onSaveOpenRouterKey(orTrim)
                  flashSaved('saved')
                }}
                className="text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Google Gemini */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">Google Gemini</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              Direct
            </span>
          </div>
          <Field
            value={gemVal}
            onChange={setGemVal}
            invalid={gemBad}
            invalidMsg={`That looks too short to be a Gemini API key. Keys start with ${'`'}AIza${'`'} (standard) or ${'`'}AQ…${'`'} (new authorization keys). Get one at aistudio.google.com/apikey.`}
            placeholder="AIza… or AQ…"
            accent="rose"
          />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Both key types work — the newer authorization keys ({'`'}AQ…{`'`}) are the default from Google AI Studio.
            Also supports <code className="text-zinc-400">VITE_GEMINI_API_KEY</code> in a <code className="text-zinc-400">.env</code> file.
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-600">
              <Link href={LINKS.gemini}>Get a key</Link>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setGemVal('')
                  onSaveKey('')
                  flashSaved('cleared')
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  onSaveKey(gemTrim)
                  flashSaved('saved')
                }}
                className="text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Help */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">Help — getting & adding keys</span>
          </div>

          <div className="text-xs text-zinc-400 space-y-3 leading-relaxed">
            <div>
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                Option A — OpenRouter (recommended)
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-zinc-500">
                <li>
                  Go to <Link href={LINKS.openRouterSite}>openrouter.ai</Link> and sign in with Google or GitHub (free).
                </li>
                <li>
                  You can add optional credit, but <span className="text-zinc-300">free models need no credit at all</span>.
                </li>
                <li>
                  Open <Link href={LINKS.openRouterKeys}>openrouter.ai/keys</Link> → <span className="text-zinc-300">Create Key</span>.
                </li>
                <li>
                  Copy the key — it starts with <code className="text-zinc-300">sk-or-v1-</code>.
                </li>
                <li>Paste it into the OpenRouter box above and hit <span className="text-zinc-300">Save</span>.</li>
              </ol>
            </div>

            <div>
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                Option B — Google Gemini
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-zinc-500">
                <li>
                  Go to <Link href={LINKS.gemini}>aistudio.google.com/apikey</Link> and sign in (free).
                </li>
                <li>Click <span className="text-zinc-300">Create API key</span> and pick a Google Cloud project (or create one).</li>
                <li>
                  Copy the key — it starts with <code className="text-zinc-300">AIza</code> or <code className="text-zinc-300">AQ…</code>.
                </li>
                <li>Paste it into the Google box above and hit <span className="text-zinc-300">Save</span>.</li>
              </ol>
            </div>

            <div>
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                Which should I use?
              </div>
              <p>
                <span className="text-zinc-300">OpenRouter is preferred</span> — one key can route across many models (most free via the free tier), and DecisionOS falls back automatically when a model is rate-limited or unavailable. Usage is subject to your OpenRouter account and each model's own limits. Use a Gemini key if you already have one. If both are saved, OpenRouter is used.
              </p>
            </div>

            <div>
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                Is it safe?
              </div>
              <p>
                Keys are stored only in your browser (localStorage) and sent only to the provider you choose. Clearing a
                key removes it immediately. You can also set <code className="text-zinc-300">VITE_GEMINI_API_KEY</code> or{' '}
                <code className="text-zinc-300">VITE_OPENROUTER_API_KEY</code> in a <code className="text-zinc-300">.env</code>{' '}
                file instead of pasting keys here.
              </p>
            </div>

            <div>
              <div className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                Still stuck?
              </div>
              <p>
                OpenRouter keys never appear in the list until they are created — after creating one, refresh
                openrouter.ai/keys if you don't see it. For Gemini, make sure billing/limits are acceptable in AI
                Studio. If a request fails, the app auto-falls back to another model before giving up.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
