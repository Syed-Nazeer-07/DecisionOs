import React, { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  FilePlus2,
  MoreHorizontal,
  Pencil,
  Settings,
  Trash2,
  Zap,
  LogOut,
} from 'lucide-react'
import SettingsPopover from './SettingsPopover'

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function Sidebar({
  decisions,
  currentId,
  saveStatus,
  lastSavedAt,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
  canSummarize,
  summaryStatus,
  onSummarize,
  user,
  signInWithGoogle,
  signOut,
  isDemo,
  onSaveKey,
  onSaveOpenRouterKey,
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const [menuId, setMenuId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [draft, setDraft] = useState('')

  const startRename = (d) => {
    setDraft(d.title)
    setRenamingId(d.id)
    setMenuId(null)
  }
  const commitRename = () => {
    if (renamingId && draft.trim()) onRename(renamingId, draft.trim())
    setRenamingId(null)
  }

  return (
    <div className="absolute top-0 left-0 z-50 h-full w-72 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800/70">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shadow-lg">
            <Zap size={16} className="text-zinc-950" fill="currentColor" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">DecisionOS</span>
        </div>

        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-[1.02] transition-all font-medium text-sm"
        >
          <FilePlus2 size={16} /> New decision
        </button>

        <button
          onClick={onSummarize}
          disabled={!canSummarize || summaryStatus === 'loading'}
          title={canSummarize ? 'Generate an executive summary of the whole tree' : 'Open a decision to summarize'}
          className="mt-2 w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900/60 disabled:hover:border-zinc-700 disabled:hover:text-zinc-200"
        >
          {summaryStatus === 'loading' ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Summarizing…
            </>
          ) : (
            <>Generate Summary</>
          )}
        </button>
      </div>

      {/* Save status */}
      <div className="px-5 py-2.5 border-b border-zinc-800/70 flex items-center gap-2 text-xs text-zinc-500">
        {saveStatus === 'saving' ? (
          <>
            <Loader2 size={12} className="animate-spin text-zinc-400" /> Saving…
          </>
        ) : (
          <>
            <Check size={12} className="text-emerald-500" /> Saved
            {lastSavedAt ? ` · ${timeAgo(lastSavedAt)}` : ''}
          </>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="px-2.5 pb-1.5 text-[10px] uppercase tracking-widest text-white/30">
          Decisions · {decisions.length}
        </div>
        {decisions.length === 0 && (
          <div className="px-2.5 py-6 text-center text-xs text-zinc-600 leading-relaxed">
            No saved decisions yet.
            <br />
            Create one to keep it here.
          </div>
        )}
        {decisions.map((d) => {
          const active = d.id === currentId
          const menuOpen = menuId === d.id
          const renaming = renamingId === d.id
          return (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors border ${
                active
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'border-transparent hover:bg-zinc-900/60'
              }`}
            >
              {renaming ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-2 py-1 text-sm text-zinc-100 outline-none"
                />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className={`truncate text-sm font-medium ${
                          active ? 'text-white' : 'text-zinc-300'
                        }`}
                      >
                        {d.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {d.nodeCount} nodes · {timeAgo(d.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuId(menuOpen ? null : d.id)
                      }}
                      aria-label="Decision options"
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        menuOpen
                          ? 'text-white bg-zinc-800'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/70'
                      }`}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>

                  {menuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-11 z-20 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1"
                    >
                      <button
                        onClick={() => startRename(d)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        onClick={() => onDuplicate(d.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <div className="my-1 h-px bg-zinc-800" />
                      <button
                        onClick={() => onDelete(d.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="relative p-4 border-t border-zinc-800/70 flex flex-col gap-3">
        {user ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0 ring-1 ring-zinc-700/50" />
              ) : (
                <div className="w-8 h-8 rounded-full shrink-0 bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/30">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="truncate text-zinc-300 font-medium text-sm">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            
            <div className="flex items-center shrink-0 ml-1">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`relative p-2 rounded-lg transition-colors ${
                  isDemo ? 'text-amber-400 hover:bg-amber-400/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title="Settings"
              >
                <Settings size={15} />
                {isDemo && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <button 
                onClick={signOut} 
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 w-full">
            <button 
              onClick={signInWithGoogle}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-colors font-medium text-sm"
            >
              Continue with Google
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`relative p-2 rounded-lg shrink-0 transition-colors ${
                isDemo ? 'text-amber-400 hover:bg-amber-400/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="Settings"
            >
              <Settings size={16} />
              {isDemo && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {showSettings && (
          <SettingsPopover 
            onSaveKey={onSaveKey} 
            onSaveOpenRouterKey={onSaveOpenRouterKey} 
            onClose={() => setShowSettings(false)} 
            className="left-4"
          />
        )}
      </div>

      {menuId && (
        <button
          className="fixed inset-0 z-10 cursor-default"
          aria-label="Close menu"
          onClick={() => setMenuId(null)}
        />
      )}
    </div>
  )
}
