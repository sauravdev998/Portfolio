import { useSyncExternalStore } from 'react'

/**
 * The one breakpoint the whole app branches on.
 *
 * Below Tailwind's `lg` the desktop metaphor stops being fun — dragging windows
 * on a phone is misery — so the shell swaps wholesale to the springboard
 * (§7 of the plan). It's a JS media query rather than CSS `hidden lg:block`
 * because the two shells are different component trees with different state and
 * listeners; rendering both and hiding one would leave the desktop measuring
 * work areas and the dock tracking a cursor that doesn't exist.
 */
const DESKTOP_QUERY = window.matchMedia('(min-width: 1024px)')

function subscribe(onChange: () => void) {
  DESKTOP_QUERY.addEventListener('change', onChange)
  return () => DESKTOP_QUERY.removeEventListener('change', onChange)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => !DESKTOP_QUERY.matches)
}
