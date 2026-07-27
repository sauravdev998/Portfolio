import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Snake's one persistent fact.
 *
 * Its own store, deliberately: `useDesktop` is the window manager's contract —
 * geometry, stacking, focus — and a game score is none of those. It lives in
 * the app's own folder rather than `src/store/` for the same reason; nothing
 * outside Snake has any business reading it, and it ships in Snake's lazy
 * chunk instead of the shell's bundle.
 */
interface HighScoreStore {
  highScore: number
  /** No-ops unless the run beat the record, so call sites needn't compare. */
  submit: (score: number) => void
}

export const useHighScore = create<HighScoreStore>()(
  persist(
    (set) => ({
      highScore: 0,
      submit: (score) => set((state) => (score > state.highScore ? { highScore: score } : state)),
    }),
    { name: 'snake-highscore' },
  ),
)
