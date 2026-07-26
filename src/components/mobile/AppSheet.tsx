import { useEffect } from 'react'
import { motion, useIsPresent, useReducedMotion } from 'motion/react'
import { AppBody } from '@/apps/AppBody'
import type { AppDefinition } from '@/apps/registry'
import { springs } from '@/lib/springs'
import type { Point } from '@/store/useDesktop'

/**
 * A full-screen app on the springboard — the mobile counterpart of `Window`,
 * with everything positional deleted: no drag, no resize, no stacking, no
 * traffic lights. It scales out of the tapped tile exactly the way a desktop
 * window scales out of its dock icon, and closes back into the same spot, so
 * the two shells share one physical grammar.
 *
 * Closing goes through the home indicator: tap it, flick it upwards, or press
 * `Esc` on a phone with a keyboard. There's deliberately no ✕ in a corner —
 * the phone metaphor has a home gesture, not a close box.
 */
export function AppSheet({
  app,
  origin,
  onClose,
}: {
  app: AppDefinition
  /** Viewport centre of the tile that launched this sheet — see `SpringboardIcon`. */
  origin: Point
  onClose: () => void
}) {
  const prefersReducedMotion = useReducedMotion()

  // False while AnimatePresence plays the exit. The sheet still covers the
  // whole screen for those ~300ms, and if it kept its hit-test area a quick
  // tap on the springboard would silently die on a sheet that is already gone.
  const isPresent = useIsPresent()

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <motion.section
      role="dialog"
      aria-label={app.name}
      // Opaque on purpose: this sheet covers the whole screen, so there is
      // nothing behind it worth blurring — and `backdrop-blur` over the full
      // viewport is exactly the cost §8 says mobile can't afford.
      className="absolute inset-0 z-20 flex flex-col bg-[oklch(0.19_0.03_288)]"
      style={{
        pointerEvents: isPresent ? undefined : 'none',
        paddingTop: 'var(--statusbar-height)',
        // The sheet fills the viewport, so the tile's viewport coordinates are
        // already in this element's own space — no rebasing, unlike Window.
        transformOrigin: `${origin.x}px ${origin.y}px`,
      }}
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : {
              opacity: 0,
              scale: 0.1,
              // The focus spring, not the window one: going home should feel
              // like a dismissal, not a landing. Opacity hangs on so the sheet
              // stays visible for most of its trip back into the tile.
              transition: { ...springs.focus, opacity: { duration: 0.25, ease: 'easeIn' } },
            }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : { ...springs.window, opacity: { duration: 0.18, ease: 'easeOut' } }
      }
    >
      <div
        className="min-h-0 flex-1 select-text overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <AppBody appId={app.id} title={app.name} />
      </div>

      <HomeIndicator onClose={onClose} />
    </motion.section>
  )
}

/**
 * The pill at the bottom of every sheet. A real button — tap to go home — that
 * also honours the flick-up gesture: it rides with the finger a little, and a
 * decisive upward release closes the sheet. Both paths call the same `onClose`;
 * closing twice is a no-op upstream, so no guard is needed.
 */
function HomeIndicator({ onClose }: { onClose: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label="Go to home screen"
      onClick={onClose}
      drag="y"
      dragSnapToOrigin
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -40 || info.velocity.y < -500) onClose()
      }}
      className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-48 touch-none items-end justify-center pt-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
    >
      <span aria-hidden className="h-1.25 w-32 rounded-full bg-white/60" />
    </motion.button>
  )
}
