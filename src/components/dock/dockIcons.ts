import type { Point } from '@/store/useDesktop'

/**
 * Where each app's dock tile currently is.
 *
 * A window minimizing has to know the viewport point to collapse toward, and
 * only the dock knows that. This is deliberately *not* in the Zustand store:
 * icon positions change on every magnification frame and every viewport resize,
 * so keeping them in state would mean writing to the store on mousemove. Holding
 * the elements instead and measuring on demand costs one `getBoundingClientRect`
 * at the moment somebody minimizes, and can never be stale.
 */

const tiles = new Map<string, HTMLElement>()

/** Returns the cleanup, so an effect can be a one-liner. */
export function registerDockIcon(appId: string, element: HTMLElement | null): () => void {
  if (!element) return () => {}

  tiles.set(appId, element)
  return () => {
    // Guarded: under StrictMode's double-mount the second registration wins, and
    // the first one's cleanup must not delete it.
    if (tiles.get(appId) === element) tiles.delete(appId)
  }
}

/**
 * The tile element itself — for handing keyboard focus back to the dock when
 * the last window of an app closes, so a keyboard user isn't dropped on `body`.
 */
export function dockIconElement(appId: string): HTMLElement | undefined {
  return tiles.get(appId)
}

/**
 * Viewport centre of an app's dock tile. Apps with no tile (a deep link, a dev
 * shortcut) fall back to the middle of the dock's strip, which is close enough
 * that the animation still reads as "it went down there".
 */
export function dockIconCenter(appId: string): Point {
  const tile = tiles.get(appId)
  if (!tile) return { x: window.innerWidth / 2, y: window.innerHeight }

  const bounds = tile.getBoundingClientRect()
  return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
}
