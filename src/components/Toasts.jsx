import React from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

export default function Toasts({ toasts }) {
  return (
    <div className="absolute top-16 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in flex items-center gap-2.5 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-xl pl-3 pr-4 py-3 shadow-2xl max-w-sm"
        >
          {t.kind === 'success' ? (
            <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
          ) : t.kind === 'error' ? (
            <AlertCircle size={17} className="text-rose-400 shrink-0" />
          ) : (
            <Info size={17} className="text-indigo-400 shrink-0" />
          )}
          <span className="text-sm text-zinc-300">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
