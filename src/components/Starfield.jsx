import React from 'react'

/**
 * Parallax dot grids that drift with the camera.
 *
 * The offsets come from CSS custom properties (`--stars1`, `--stars2`) which
 * DecisionOS updates imperatively on the canvas element. This lets the
 * background track the camera during pan/zoom without triggering React
 * renders (the smoothest possible path).
 */
export default function Starfield() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          backgroundPosition: 'var(--stars1, 0px 0px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '64px 64px',
          backgroundPosition: 'var(--stars2, 0px 0px)',
        }}
      />
    </>
  )
}