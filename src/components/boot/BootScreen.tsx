import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Logo } from '@/components/menubar/Logo'

/**
 * The startup sequence: black screen, logo, a progress bar that fills in about
 * two seconds, then the whole thing fades to reveal the desktop already
 * underneath — the OS "was booting" while React mounted, which is the joke.
 *
 * Once per *session*, not per visit: a tab refresh mid-browse re-runs main.tsx
 * but shouldn't re-run the theatre, so the flag lives in sessionStorage and is
 * only written when the sequence completes. Any click or keypress skips —
 * nobody should ever wait for a fake progress bar twice.
 *
 * Under reduced motion the boot doesn't render at all. It is pure motion with
 * no information in it, which is exactly what the preference asks us to drop.
 */

const BOOTED_FLAG = 'portfolio-booted'
const FILL_SECONDS = 1.6
const FILL_DELAY = 0.4

export function BootScreen() {
  const prefersReducedMotion = useReducedMotion()
  const [booting, setBooting] = useState(
    () => !prefersReducedMotion && sessionStorage.getItem(BOOTED_FLAG) !== '1',
  )

  function finish() {
    sessionStorage.setItem(BOOTED_FLAG, '1')
    setBooting(false)
  }

  // Escape hatch for keyboards; the overlay itself catches clicks.
  useEffect(() => {
    if (!booting) return
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [booting])

  return (
    <AnimatePresence>
      {booting && (
        <motion.div
          role="status"
          aria-label="Portfolio OS is starting up"
          className="fixed inset-0 flex flex-col items-center justify-center gap-10 bg-black"
          style={{ zIndex: 'var(--z-index-boot)' }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          onClick={finish}
        >
          <Logo className="size-16 text-white" />

          <div className="h-1 w-44 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              // Ease-in-out over a fixed duration reads as "loading something
              // real"; a spring here would look like a scrubber, not a boot.
              transition={{ duration: FILL_SECONDS, delay: FILL_DELAY, ease: 'easeInOut' }}
              onAnimationComplete={finish}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
