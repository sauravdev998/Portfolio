import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 2048's one persistent fact — its own store for the same reason Snake's high
 * score is: `useDesktop` is the window manager's contract, and a score is none
 * of geometry, stacking or focus. Lives in the app's folder so it ships in the
 * app's lazy chunk rather than the shell's bundle.
 */
interface BestScoreStore {
  best: number
  /** No-ops unless the run beat the record, so call sites needn't compare. */
  submit: (score: number) => void
}

export const useBestScore = create<BestScoreStore>()(
  persist(
    (set) => ({
      best: 0,
      submit: (score) => set((state) => (score > state.best ? { best: score } : state)),
    }),
    { name: '2048-best' },
  ),
)
