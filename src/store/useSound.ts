import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Sound on or off — off by default (§ Phase 8: "muted by default").
 *
 * A portfolio that makes noise uninvited is a portfolio that gets closed, so
 * the OS boots silent and stays silent until the visitor flips the menu-bar
 * toggle. The choice persists like the plain-mode toggle does: opting into
 * sound once shouldn't need repeating every visit.
 *
 * Kept apart from the desktop store on purpose: muting is a preference about
 * the whole OS, not a fact about any window.
 */
interface SoundStore {
  muted: boolean
  toggle: () => void
}

export const useSound = create<SoundStore>()(
  persist((set) => ({ muted: true, toggle: () => set((state) => ({ muted: !state.muted })) }), {
    name: 'portfolio-sound',
  }),
)
