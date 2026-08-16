# DecisionOS

> **Transform complex decisions into AI-generated causal maps that reveal risks, opportunities, trade-offs, and long-term consequences before you commit.**

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Live Demo](https://img.shields.io/badge/Live-Demo-success)

## Live Demo

### 🚀 Try it now

**https://decisionos-nine.vercel.app/**

No signup required.

DecisionOS includes a built-in demo mode that lets you explore realistic AI-generated decision trees instantly, even without API keys or cloud configuration.

---

## What is DecisionOS?

DecisionOS is an AI-native decision intelligence platform.

Enter any decision—from choosing a job offer to launching a new product—and DecisionOS automatically builds a structured causal map showing:

* Strategic dimensions
* Opportunities
* Risks
* Trade-offs
* Probable outcomes
* Long-term consequences

Instead of creating a static pros-and-cons list, DecisionOS generates a living decision model that can be explored, expanded, edited, and analyzed on an infinite canvas.

---

## Why DecisionOS?

Most decision tools stop at pros and cons.

DecisionOS goes further by applying causal reasoning to reveal:

* What happens next
* Which risks emerge over time
* Where opportunities compound
* Which trade-offs create hidden costs
* Which dimensions drive the largest impact
* How consequences interact across the decision landscape

The result is a structured decision map that helps users understand not only what to choose, but why.

---

## Features

### AI Analysis Engine

* Generates **5–7 strategic dimensions** using first-principles reasoning
* Expands every dimension into **3 direct causal consequences**
* Assigns **time horizons**:

  * Immediate
  * Short-term
  * Medium-term
  * Long-term
* Assigns **likelihood ratings**:

  * Likely
  * Possible
  * Uncertain
* Performs semantic deduplication across the entire tree
* Rejects generic, repetitive, motivational, or low-quality outputs automatically
* Produces structured causal chains rather than disconnected ideas

### Multi-Provider AI Backend

#### Google Gemini

* Direct integration via Gemini Flash models
* Fast generation and low latency

#### OpenRouter

* Automatic multi-model fallback
* Retries on failures and rate limits
* Access to 20+ models through a single API key

#### Demo Mode

* No configuration required
* Deterministic offline generator
* Useful for onboarding and testing
* Guarantees the application is always usable

### Cloud Accounts & Sync

* Google OAuth authentication
* Real-time cloud synchronization
* Offline-first architecture
* Local-first usage without an account
* Automatic migration from local storage to cloud
* Row-Level Security (RLS) for data isolation

### Decision Library

* Save unlimited decisions
* Rename decisions
* Duplicate decisions
* Delete decisions
* Auto-save with change detection
* Restore previous viewport position automatically

### Executive Summary

Generate an AI-powered strategic summary of the entire decision tree.

Includes:

* Key Opportunities
* Key Risks
* Key Trade-offs
* Most Likely Outcomes
* Highest Impact Dimension
* Major Themes

Summaries are cached and automatically invalidated whenever the tree changes.

### Interactive Infinite Canvas

* Infinite pan and zoom
* Trackpad pinch support
* Cursor-centered zoom
* Fit-to-view functionality
* Responsive viewport management
* Smooth drag performance
* Parallax starfield visualization

### Node Interactions

* Expand consequences
* Collapse subtrees
* Rename nodes
* Delete branches recursively
* View causal paths
* Inspect metadata and relationships

### Undo / Redo

* 60-step history stack
* Keyboard shortcuts
* Toolbar controls

### Search & Export

* Live full-text node search
* JSON export
* Instant node discovery across large trees

---

## Example Use Cases

### Career Decisions

* Accepting a job offer
* Career transitions
* Graduate school evaluation
* Relocation opportunities

### Business Strategy

* Product launches
* Market expansion
* Pricing changes
* Strategic partnerships

### Personal Finance

* Home purchases
* Major investments
* Retirement planning
* Relocation decisions

### Startup Founders

* Fundraising strategy
* Hiring plans
* Product roadmap decisions
* Build-vs-buy analysis

### Teams & Executives

* Resource allocation
* Organizational restructuring
* Technology adoption
* Risk assessment

---

## Technology Stack

| Layer          | Technology                |
| -------------- | ------------------------- |
| Framework      | React 19                  |
| Build Tool     | Vite 8                    |
| Styling        | Tailwind CSS v4           |
| Icons          | Lucide React              |
| AI Providers   | Gemini + OpenRouter       |
| Authentication | Supabase Auth             |
| Database       | Supabase Postgres         |
| Persistence    | LocalStorage + Cloud Sync |

---

## Getting Started

### Prerequisites

* Node.js 18+
* Optional Supabase project for cloud sync

### Installation

```bash
npm install
npm run dev
```

Application runs at:

```text
http://localhost:5173
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key
```

---

## AI Provider Priority

DecisionOS automatically selects providers in the following order:

```text
OpenRouter
      ↓
Gemini
      ↓
Demo Mode
```

This ensures generation remains available even if a provider becomes unavailable.

---

## Architecture Highlights

### Decision Model

```text
Decision
   ↓
Dimensions
   ↓
Consequences
   ↓
Opportunities / Risks / Trade-offs
```

Every consequence includes:

| Attribute    | Values                                        |
| ------------ | --------------------------------------------- |
| Time Horizon | Immediate, Short-term, Medium-term, Long-term |
| Likelihood   | Likely, Possible, Uncertain                   |

---

## Keyboard Shortcuts

| Shortcut     | Action           |
| ------------ | ---------------- |
| Ctrl/Cmd + K | Search nodes     |
| Space        | Fit tree to view |
| Ctrl/Cmd + Z | Undo             |
| Ctrl/Cmd + Y | Redo             |
| Escape       | Close panels     |
| Scroll       | Zoom             |
| Drag         | Pan              |
| Click Node   | Expand & Inspect |

---

## Demo Mode

One of DecisionOS's core design principles is zero-friction exploration.

Even without:

* API keys
* Authentication
* Database configuration

Users can immediately generate and explore realistic decision trees.

This makes onboarding, demos, testing, and evaluation effortless.

---

## Roadmap

Potential future enhancements:

* Scenario comparison
* Monte Carlo outcome simulation
* Decision scoring models
* Collaborative workspaces
* Shared decision trees
* Version history
* PDF export
* Presentation mode
* Team knowledge graphs

---

## License

MIT License

Fork it. Deploy it. Extend it.

---

<p align="center">
  <strong>DecisionOS</strong><br>
  AI-Powered Decision Intelligence<br>
  https://decisionos-nine.vercel.app/
</p>
