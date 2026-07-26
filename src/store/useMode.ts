import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * OS or plain website — PostHog's "website mode" toggle (§8).
 *
 * The plain site is the accessibility and small-attention-span fallback: the
 * same `content/*.ts` rendered as one scrollable document, no windows, no
 * physics. The choice persists, so somebody who bailed out of the OS isn't
 * made to boot it again on every visit, and `?plain` in the URL forces it for
 * a shared link ("here's my resume, skip the desktop").
 */
export type SiteMode = 'os' | 'plain'

interface ModeStore {
  mode: SiteMode
  setMode: (mode: SiteMode) => void
}

export const useMode = create<ModeStore>()(
  persist((set) => ({ mode: 'os', setMode: (mode) => set({ mode }) }), {
    name: 'portfolio-mode',
  }),
)

if (new URLSearchParams(window.location.search).has('plain')) {
  useMode.setState({ mode: 'plain' })
}
