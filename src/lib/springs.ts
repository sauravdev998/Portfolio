import type { Transition } from 'motion/react'

/**
 * The three motions the whole OS is built from. Defined once so a window, a dock
 * icon and a focus change all feel like they obey the same physics — coherence
 * here is what sells the illusion.
 *
 * - `dock`   snappy and light; magnification has to keep up with the cursor.
 * - `window` heavier; a window is a big object and should settle, not snap.
 * - `focus`  fast and near-critically damped; feedback, not choreography.
 */
export const springs = {
  dock: { type: 'spring', stiffness: 400, damping: 25 },
  window: { type: 'spring', stiffness: 300, damping: 30 },
  focus: { type: 'spring', stiffness: 500, damping: 40 },
} as const satisfies Record<string, Transition>
