# ✦ DecisionOS

> **AI-Powered Decision Intelligence** — Map a decision into a living causal tree. Zoom, pan, branch and explore every consequence.

DecisionOS is an interactive, infinite-canvas decision tree tool that uses **Google Gemini** or **OpenRouter** AI to break down any decision into structured dimensions, consequences, opportunities, risks, and trade-offs. Built with React 19 and Tailwind CSS v4.

---

## ✨ Features

### 🧠 AI-Powered Analysis
- Generates **5–7 strategic dimensions** per decision using a first-principles causal reasoning prompt
- Expands each node into **3 specific causal consequences** (opportunities, risks, trade-offs, neutral)
- Every consequence includes a **time horizon** and **likelihood** rating
- Duplicate consequences are detected and prevented across the entire tree

### 🤖 Multi-Provider AI Backend
- **Google Gemini** (direct API via `gemini-3.5-flash-lite`)
- **OpenRouter** multi-model fallback chain — tries 20+ free and cheap models in sequence so generation never stops even when a single model is throttled
- **Demo mode** — a seeded, deterministic offline generator when no key is set

### 📚 Decision Library
- Save **multiple decisions** locally (persisted to `localStorage`)
- Each decision stores its full node tree + camera viewport so it reopens exactly where you left it
- **Auto-save** (debounced 800ms) — tree and camera are written only when changed
- **Rename**, **duplicate**, and **delete** decisions from the sidebar
- One-time migration from the legacy single-tree format

### 📊 AI Executive Summary
- Generates a structured **executive summary** of the entire tree:
  - Key Opportunities, Key Risks, Key Trade-offs
  - Most Likely Outcomes
  - Highest Impact Dimension
  - Major Themes
- Summary is **cached** and invalidated automatically when the tree changes (tree hash)
- Stale indicator shown when the tree has changed since the last summary

### 🗺️ Interactive Canvas
- Infinite pan + zoom canvas (0.2×–3.0×)
- **rAF-throttled wheel zoom** — smooth trackpad pinch and mouse wheel with delta normalization
- **Pointer coalesced panning** — zero React renders during drag, DOM-direct for 1:1 tracking
- **Fit-to-view** that accounts for the sidebar offset
- **Zoom controls** (+ / − / fit) in the bottom bar
- **Stable resize** — canvas re-centers correctly when the window resizes
- **Starfield parallax** — background stars move at different speeds with the camera

### 🌳 Node Interactions
- Click any leaf node to expand consequences (auto-expands collapsed ancestors)
- **Collapse / expand** subtrees per node
- **Rename** any node inline (double-click or from detail panel)
- **Delete** nodes (recursively removes the entire subtree)
- Node detail panel shows type, time horizon, likelihood, causal path, and child list

### ↩️ Full Undo / Redo
- Up to 60-step undo stack
- Redo stack (cleared on new action)
- Undo/redo buttons in the command bar + keyboard shortcuts

### 🔍 Search
- Live node search across the full tree

### 📤 Export
- Export the full tree as a JSON file

---

## 🖥️ Tech Stack

| Layer       | Technology                               |
|-------------|------------------------------------------|
| Framework   | React 19 + Vite 8                        |
| Styling     | Tailwind CSS v4                          |
| Icons       | Lucide React                             |
| AI Backend  | Google Gemini 3.5 Flash Lite / OpenRouter|
| Persistence | `localStorage` (migration-ready provider)|
| Linting     | *(none configured in v2)*               |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or equivalent package manager

### Installation

```bash
# Clone or copy the project
cd "Default Project"

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🤖 AI Setup

DecisionOS works **out of the box in Demo mode** without any API key. To enable real AI:

### Option A — Google Gemini (direct)

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Either:
   - **Env file** (recommended): copy `.env.example` → `.env` and set `VITE_GEMINI_API_KEY=your_key`
   - **In-app**: open Settings and paste the key — it's saved to `localStorage`

### Option B — OpenRouter (multi-model fallback)

1. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys) (keys start with `sk-or-v1-`)
2. Paste it in Settings under **OpenRouter API Key**
3. OpenRouter will try 20+ free and cheap models in order, so generation is effectively unlimited

> **Priority**: OpenRouter key → Gemini key → Demo mode

---

## 🌳 Node Types

| Type          | Color   | Description                                  |
|---------------|---------|----------------------------------------------|
| 🟣 Decision   | Purple  | The root question you're exploring           |
| 🔷 Dimension  | Indigo  | A strategic category or angle of evaluation  |
| 🟢 Opportunity| Green   | A beneficial causal outcome                  |
| 🔴 Risk       | Red     | A harmful causal outcome                     |
| 🟡 Trade-off  | Amber   | A benefit that creates a cost elsewhere      |
| ⚫ Neutral    | Muted   | Neither clearly positive nor negative        |

Each consequence node also carries:

| Attribute      | Values                                          |
|----------------|-------------------------------------------------|
| Time Horizon   | `immediate` · `short-term` · `medium-term` · `long-term` |
| Likelihood     | `likely` · `possible` · `uncertain`            |

---

## ⌨️ Keyboard Shortcuts

| Shortcut       | Action                        |
|----------------|-------------------------------|
| `⌘K` / `Ctrl+K`| Open node search              |
| `Space`         | Focus / fit the root node     |
| `⌘Z` / `Ctrl+Z`| Undo                          |
| `⌘Y` / `Ctrl+Y`| Redo                          |
| `Escape`        | Dismiss open panels           |
| `Scroll`        | Zoom in/out to cursor         |
| `Drag` (canvas) | Pan                           |
| `Click` (node)  | Select / expand               |

---

## 📁 Project Structure

```
Default Project/
├── .env.example          # API key template
├── index.html            # App entry point
├── package.json          # v2.0.0 — React 19, Tailwind v4, Vite 8
├── vite.config.js
└── src/
    ├── main.jsx           # React root mount
    ├── App.jsx            # Root wrapper
    ├── DecisionOS.jsx     # Main orchestrator (~1,040 lines)
    ├── index.css          # Global styles
    │
    ├── components/
    │   ├── CommandBar.jsx      # Bottom action bar (undo/redo/export/settings)
    │   ├── Dashboard.jsx       # New-decision input screen
    │   ├── DetailPanel.jsx     # Selected node detail panel
    │   ├── EdgeLayer.jsx       # SVG bezier edge renderer
    │   ├── Legend.jsx          # Node type colour legend
    │   ├── NodeView.jsx        # Individual tree node card
    │   ├── SearchBar.jsx       # Live node search
    │   ├── SettingsPopover.jsx # API key management
    │   ├── Sidebar.jsx         # Decision library sidebar
    │   ├── Starfield.jsx       # Animated background starfield
    │   ├── StatsBar.jsx        # Node count summary bar
    │   ├── SummaryPanel.jsx    # AI executive summary panel
    │   ├── Toasts.jsx          # Toast notification stack
    │   ├── Tooltip.jsx         # Hover tooltip
    │   └── ZoomControls.jsx    # + / − / fit zoom buttons
    │
    ├── hooks/
    │   ├── useKeyboardShortcuts.js  # Global keyboard handler
    │   └── usePersistentState.js   # localStorage-backed useState
    │
    └── lib/
        ├── decisionStore.js   # Decision library CRUD (migration-ready)
        ├── gemini.js          # AI provider (Gemini + OpenRouter + Demo)
        ├── layout.js          # Tree layout engine
        ├── storage.js         # API key persistence
        ├── summary.js         # Executive summary generation + caching
        ├── theme.js           # Node type colours / styles
        └── utils.js           # uid, clamp, hash, serialize helpers
```

---

## 💾 Data Storage

All data is stored **locally** in `localStorage` under these keys:

| Key                        | Contents                             |
|----------------------------|--------------------------------------|
| `decisionos.library.v1`    | All saved decisions (tree + viewport)|
| `decisionos.lastOpened`    | ID of the last opened decision       |
| `decisionos.summaries.v1`  | Cached AI summaries (per decision)   |
| `decisionos.apiKey`        | Gemini API key                       |
| `decisionos.openRouterKey` | OpenRouter API key                   |

The persistence layer is designed as a **swappable provider** — backing it with Supabase, Firebase, or any cloud database requires only implementing the `list/get/create/update/remove` interface in `decisionStore.js`.

---

## 📊 Executive Summary Output

```json
{
  "keyOpportunities": ["..."],
  "keyRisks": ["..."],
  "keyTradeoffs": ["..."],
  "mostLikelyOutcomes": ["..."],
  "highestImpactDimension": "Financial Impact",
  "majorThemes": ["Autonomy", "Risk exposure", "Long-term commitment"]
}
```

---

## 📜 License

MIT — feel free to fork, build on, and deploy DecisionOS.

---

<p align="center">
  Built with React 19 + Tailwind CSS v4 + Gemini AI &nbsp;·&nbsp; Make every decision with clarity.
</p>
