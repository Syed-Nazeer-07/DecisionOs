# DecisionOS

> **AI-powered decision intelligence.** Map any decision into a living causal tree — explore every consequence, risk, and opportunity with clarity.

DecisionOS is a full-stack, AI-native decision workspace. Enter any decision, and the system automatically generates a structured causal tree of dimensions, consequences, opportunities, risks, and trade-offs — rendered on an infinite, interactive canvas.

Built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **Supabase** for cloud persistence.

---

## Features

### AI Analysis Engine
- Generates **5–7 strategic dimensions** per decision using a first-principles causal reasoning prompt
- Expands every node into **3 direct causal consequences** — no generic filler, no repetition
- Every consequence carries a **time horizon** (`immediate` → `long-term`) and a **likelihood** rating (`likely` / `possible` / `uncertain`)
- A global deduplication pass prevents semantically similar consequences from appearing across the tree
- Consequences are validated against quality rules before being rendered — generic, motivational, or tautological output is rejected and regenerated

### Multi-Provider AI Backend
- **Google Gemini** — direct API via `gemini-3.5-flash-lite`
- **OpenRouter** — multi-model fallback chain across 20+ free and paid models; automatically retries on rate-limit or failure so generation never stalls
- **Demo mode** — a seeded, deterministic offline generator when no API key is configured, so the app is always usable

### Cloud Accounts & Sync
- **Google OAuth** via Supabase Auth — one-click sign-in, no passwords
- All decisions are synced to **Supabase Postgres** in real-time
- Offline-first: the app works fully without an account; decisions are stored locally and can be migrated to the cloud on first sign-in
- Row-Level Security (RLS) ensures each user can only access their own data

### Decision Library
- Save and manage **multiple decisions** simultaneously
- Each decision persists its full node tree and camera viewport — it reopens exactly where you left it
- **Auto-save** debounced at 800ms — writes only when data has actually changed
- **Rename**, **duplicate**, and **delete** decisions from the sidebar

### Executive Summary
- Generates a structured AI executive summary of the entire decision tree on demand
- Output includes: Key Opportunities, Key Risks, Key Trade-offs, Most Likely Outcomes, Highest Impact Dimension, and Major Themes
- Summary is **cached by tree hash** and marked stale automatically when the tree changes

### Interactive Canvas
- Infinite pan + zoom canvas (0.2×–3.0×)
- rAF-throttled wheel zoom with trackpad pinch and delta normalization
- Pointer-coalesced panning — zero React renders during drag; DOM-direct for pixel-perfect 1:1 tracking
- Fit-to-view with sidebar offset compensation
- Stable resize — canvas re-centers correctly on window resize
- Parallax starfield background tied to the camera transform

### Node Interactions
- Click any node to expand its causal consequences
- **Collapse / expand** subtrees per node
- **Rename** any node inline
- **Delete** any node (recursively removes its entire subtree)
- Node detail panel shows type, time horizon, likelihood, full causal path, and direct children

### Undo / Redo
- 60-step undo stack
- Keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`) and toolbar buttons

### Search & Export
- Live full-text search across all nodes in the active tree
- Export the full tree as a structured JSON file

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| AI Providers | Google Gemini 3.5 Flash Lite / OpenRouter |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase Postgres |
| Local Persistence | `localStorage` (provider-swappable) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (for cloud sync — optional for local use)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Required for cloud sync and Google login
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional — set in-app via Settings instead
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key
```

> The app runs in **Demo mode** without any API key — you get realistic, pre-seeded sample output with no setup required.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Supabase Setup

If you are enabling cloud sync, run the following SQL in your Supabase project's SQL Editor:

```sql
CREATE TABLE public.decisions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewport JSONB,
  nodecount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own decisions" ON public.decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decisions" ON public.decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decisions" ON public.decisions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own decisions" ON public.decisions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX decisions_user_id_idx ON public.decisions(user_id);
```

Then enable the **Google** provider under **Authentication → Providers** in your Supabase dashboard.

---

## AI Configuration

DecisionOS supports two AI providers. **OpenRouter is recommended** because it provides automatic multi-model fallback at no extra setup cost.

### Option A — OpenRouter (Recommended)

1. Create a free account at [openrouter.ai](https://openrouter.ai)
2. Generate a key at [openrouter.ai/keys](https://openrouter.ai/keys) — keys begin with `sk-or-v1-`
3. Paste it in the **Settings** panel (gear icon in the sidebar)

OpenRouter will route requests across 20+ models, falling back automatically on rate limits or failures.

### Option B — Google Gemini

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Paste it in Settings under **Gemini API Key**, or set `VITE_GEMINI_API_KEY` in `.env`

**Provider priority:** OpenRouter key → Gemini key → Demo mode

---

## Node Types

| Type | Color | Meaning |
|---|---|---|
| Decision | White | The root question being explored |
| Dimension | Indigo | A strategic domain or evaluation category |
| Opportunity | Green | A directly caused beneficial outcome |
| Risk | Red | A directly caused harmful outcome |
| Trade-off | Amber | A benefit that creates a cost elsewhere |
| Neutral | Muted | A consequence that is neither clearly positive nor negative |

Each consequence node carries:

| Attribute | Values |
|---|---|
| Time Horizon | `immediate` · `short-term` · `medium-term` · `long-term` |
| Likelihood | `likely` · `possible` · `uncertain` |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open node search |
| `Space` | Fit tree to viewport |
| `Ctrl+Z` / `⌘Z` | Undo |
| `Ctrl+Y` / `⌘Y` | Redo |
| `Escape` | Dismiss active panel |
| `Scroll` | Zoom to cursor |
| `Drag` | Pan canvas |
| `Click node` | Select and expand |

---

## Project Structure

```
src/
├── DecisionOS.jsx          # Root orchestrator — state, canvas, and AI lifecycle
├── App.jsx
├── main.jsx
├── index.css
│
├── components/
│   ├── CommandBar.jsx       # Bottom floating bar — input, undo/redo
│   ├── Dashboard.jsx        # Start screen — decision input and recent list
│   ├── DetailPanel.jsx      # Selected node detail drawer
│   ├── EdgeLayer.jsx        # SVG bezier connector renderer
│   ├── Legend.jsx           # Node type colour legend
│   ├── NodeView.jsx         # Individual tree node card (memoized)
│   ├── SearchBar.jsx        # Live node search
│   ├── SettingsPopover.jsx  # API key management
│   ├── Sidebar.jsx          # Decision library + auth footer
│   ├── Starfield.jsx        # Parallax background
│   ├── StatsBar.jsx         # Live node count display
│   ├── SummaryPanel.jsx     # AI executive summary slide-over
│   ├── Toasts.jsx           # Toast notification stack
│   ├── Tooltip.jsx          # Hover tooltip
│   └── ZoomControls.jsx     # Zoom button cluster
│
├── hooks/
│   ├── useAuth.js              # Supabase Auth state + Google OAuth
│   ├── useKeyboardShortcuts.js # Global keyboard handler
│   └── usePersistentState.js   # localStorage-backed useState
│
└── lib/
    ├── decisionStore.js    # Decision library CRUD with swappable provider
    ├── gemini.js           # AI providers — Gemini, OpenRouter, and Demo mode
    ├── layout.js           # Deterministic tree layout engine
    ├── storage.js          # API key and demo hint persistence
    ├── summary.js          # Executive summary — generation, caching, and prompts
    ├── supabase.js         # Supabase client initialization
    ├── supabaseStore.js    # Cloud persistence provider
    ├── theme.js            # Node type colours, styles, and metadata
    └── utils.js            # uid, clamp, hash, serialize helpers
```

---

## Data Storage

| Scope | Store | Key / Table |
|---|---|---|
| Local | `localStorage` | `decisionos.library.v1` — all saved decisions |
| Local | `localStorage` | `decisionos.lastOpened` — last opened decision ID |
| Local | `localStorage` | `decisionos.summaries.v1` — cached AI summaries |
| Local | `localStorage` | `decisionos.apiKey` — Gemini key |
| Local | `localStorage` | `decisionos.openRouterKey` — OpenRouter key |
| Cloud | Supabase Postgres | `decisions` table — synced when signed in |

The persistence layer is a **provider pattern** — swapping from localStorage to any backend requires implementing only a `{ read, write }` interface in `decisionStore.js`.

---

## Executive Summary Schema

```json
{
  "keyOpportunities": ["string"],
  "keyRisks": ["string"],
  "keyTradeoffs": ["string"],
  "mostLikelyOutcomes": ["string"],
  "highestImpactDimension": "string",
  "majorThemes": ["string"]
}
```

---

## License

MIT — fork freely, deploy anywhere.

---

<p align="center">
  DecisionOS · React 19 + Supabase + Gemini AI · Make every decision with clarity.
</p>
