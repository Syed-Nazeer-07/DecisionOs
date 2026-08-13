import React from 'react'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'
import Tooltip from './Tooltip'

export default function ZoomControls({ onZoomIn, onZoomOut, onFit, onReset }) {
  const btn =
    'w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/80 backdrop-blur border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors'
  return (
    <div className="absolute bottom-8 right-6 z-40 flex flex-col gap-2">
      <Tooltip label="Zoom in (])" side="left">
        <button className={btn} onClick={onZoomIn} aria-label="Zoom in">
          <ZoomIn size={18} />
        </button>
      </Tooltip>
      <Tooltip label="Zoom out ([)" side="left">
        <button className={btn} onClick={onZoomOut} aria-label="Zoom out">
          <ZoomOut size={18} />
        </button>
      </Tooltip>
      <Tooltip label="Fit tree to view (F)" side="left">
        <button className={btn} onClick={onFit} aria-label="Fit view">
          <Maximize2 size={17} />
        </button>
      </Tooltip>
      <Tooltip label="Reset to start screen (R)" side="left">
        <button className={btn} onClick={onReset} aria-label="Reset">
          <RotateCcw size={17} />
        </button>
      </Tooltip>
    </div>
  )
}
