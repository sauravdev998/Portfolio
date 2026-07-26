import { createContext, useContext } from 'react'
import type { MotionValue } from 'motion/react'

/**
 * The dock's shared cursor position.
 *
 * Magnification is a *relationship* between one cursor and every icon, so the
 * cursor lives in a single MotionValue that the dock writes and each icon reads.
 * Keeping it off React state is the whole point: a mousemove updates one value
 * and springs a few transforms, without re-rendering a single component.
 */
export interface Magnification {
  /** Viewport x of the cursor, or `Infinity` while it is away from the dock. */
  pointerX: MotionValue<number>
  /** False under `prefers-reduced-motion`; icons then keep their resting size. */
  enabled: boolean
}

export const MagnificationContext = createContext<Magnification | null>(null)

export function useMagnification(): Magnification {
  const magnification = useContext(MagnificationContext)
  if (!magnification) {
    throw new Error('useMagnification must be used inside the Dock')
  }
  return magnification
}
