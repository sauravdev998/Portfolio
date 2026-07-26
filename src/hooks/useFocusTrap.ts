import { useEffect, type RefObject } from 'react'

/**
 * Keeps keyboard focus inside a container while it is the active surface —
 * a focused window on desktop, the open sheet on mobile (§8).
 *
 * Two jobs: when the container becomes active, DOM focus moves into it (unless
 * it's already there — clicking a text field must not have its focus stolen
 * back by the frame); and while focus is inside, `Tab` wraps at the edges
 * instead of walking out. The listener lives on the container, so this traps
 * nothing when focus is elsewhere — the menu bar and dock stay reachable, and
 * a window only *holds* focus once it has it. `Esc` is each caller's own exit.
 *
 * The container itself needs `tabIndex={-1}`: it's the landing spot when the
 * surface activates, and the anchor arrow-key handlers listen on.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const element = ref.current
    if (!element) return

    if (!element.contains(document.activeElement)) {
      element.focus({ preventScroll: true })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusables = Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        // Skip anything display:none'd (a collapsed panel, an inert control).
        (candidate) => candidate.getClientRects().length > 0,
      )

      if (focusables.length === 0) {
        // Nothing to move to; parking on the frame beats tabbing out the back.
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement

      if (event.shiftKey) {
        if (current === first || current === element) {
          event.preventDefault()
          last.focus()
        }
      } else if (current === last || current === element) {
        // Forward-tab from the frame enters at the first control rather than
        // wherever the DOM happens to put it after the frame.
        event.preventDefault()
        first.focus()
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [ref, active])
}
