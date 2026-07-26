import type { PointerEvent } from 'react'

/**
 * Eight invisible grab strips straddling the window's edges and corners.
 *
 * They sit *outside* the frame as much as inside (negative margins) because a
 * 1px border is an unhittable target; macOS gives you a few pixels of slop in
 * both directions and this matches that. Purely presentational — the geometry
 * maths lives in `Window`.
 */

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/** Corners are inset by the edge strips' width so the two never overlap. */
const HANDLES: Record<ResizeDirection, string> = {
  n: 'inset-x-3 top-0 -mt-1 h-2 cursor-ns-resize',
  s: 'inset-x-3 bottom-0 -mb-1 h-2 cursor-ns-resize',
  w: 'inset-y-3 left-0 -ml-1 w-2 cursor-ew-resize',
  e: 'inset-y-3 right-0 -mr-1 w-2 cursor-ew-resize',
  nw: 'left-0 top-0 -ml-1 -mt-1 size-4 cursor-nwse-resize',
  ne: 'right-0 top-0 -mr-1 -mt-1 size-4 cursor-nesw-resize',
  sw: 'bottom-0 left-0 -mb-1 -ml-1 size-4 cursor-nesw-resize',
  se: 'bottom-0 right-0 -mb-1 -mr-1 size-4 cursor-nwse-resize',
}

export function ResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (direction: ResizeDirection, event: PointerEvent) => void
}) {
  return (
    <>
      {(Object.keys(HANDLES) as ResizeDirection[]).map((direction) => (
        <div
          key={direction}
          aria-hidden
          // touch-none keeps a resize drag from also scrolling the page on touch.
          className={`absolute touch-none ${HANDLES[direction]}`}
          onPointerDown={(event) => onResizeStart(direction, event)}
        />
      ))}
    </>
  )
}
