import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useSpring, useTransform } from 'motion/react'
import type { AppDefinition } from '@/apps/registry'
import { registerDockIcon } from '@/components/dock/dockIcons'
import { useMagnification } from '@/hooks/useMagnification'
import { playSound } from '@/lib/sounds'
import { springs } from '@/lib/springs'
import { useDesktop } from '@/store/useDesktop'

/**
 * One dock icon: magnification, the running indicator, and the launch bounce.
 *
 * The tile grows by animating its own width/height rather than by `scale`. That
 * is deliberate and the one place this project bends its transform-only rule:
 * because the icons are flex children, growing one *reflows* its neighbours out
 * of the way, which is exactly the macOS behaviour. Faking it with `scale` would
 * leave a magnified icon overlapping the icons beside it. The cost is a reflow
 * of five small elements inside a fixed-position bar — not the window drag path.
 */

/** Resting tile size, and the size directly under the cursor. */
const BASE_SIZE = 50
const PEAK_SIZE = 82

/** How far the cursor's influence reaches, in px either side of an icon. */
const FALLOFF = 120

/**
 * Fraction of the full lift an icon gets at half the falloff. Below the linear
 * 0.5 on purpose: it concentrates the bulge on the icon under the cursor and
 * leaves the outer ones as a gentle ripple, the way a real dock behaves.
 */
const SHOULDER = 0.35

const SHOULDER_SIZE = BASE_SIZE + SHOULDER * (PEAK_SIZE - BASE_SIZE)

export function DockIcon({ app }: { app: AppDefinition }) {
  const tileRef = useRef<HTMLButtonElement>(null)
  const { pointerX, enabled } = useMagnification()
  const [isHovered, setIsHovered] = useState(false)
  const bounce = useAnimationControls()

  const openApp = useDesktop((state) => state.openApp)
  // Selecting the boolean rather than the window list means this icon only
  // re-renders when its own running state flips, not on every window change.
  const isRunning = useDesktop((state) => state.windows.some((win) => win.appId === app.id))

  // Measured live rather than cached: the icons either side of this one are
  // resizing too, so a resting-position cache would be wrong mid-gesture.
  const distance = useTransform(pointerX, (x) => {
    const bounds = tileRef.current?.getBoundingClientRect()
    if (!bounds) return Number.POSITIVE_INFINITY
    return x - (bounds.left + bounds.width / 2)
  })

  const targetSize = useTransform(
    distance,
    [-FALLOFF, -FALLOFF / 2, 0, FALLOFF / 2, FALLOFF],
    [BASE_SIZE, SHOULDER_SIZE, PEAK_SIZE, SHOULDER_SIZE, BASE_SIZE],
    { clamp: true },
  )
  // The spring is what makes magnification feel like matter rather than a
  // cursor readout — it lags the pointer very slightly and overshoots on exit.
  const size = useSpring(targetSize, springs.dock)

  // Publish the tile so a window minimizing knows where to collapse to. The
  // window can't find it any other way: it lives in a different subtree and the
  // dock re-centres itself whenever the icons grow.
  useEffect(() => registerDockIcon(app.id, tileRef.current), [app.id])

  function handleClick() {
    // Measure before anything animates. The icon is magnified under the cursor
    // right now and the window has to grow out of where it *visually* is — and
    // starting the bounce below first would snap the tile back to its resting
    // size before this read, handing the window an origin 16px off the mark.
    const tile = tileRef.current?.getBoundingClientRect()
    const launchOrigin = tile
      ? { x: tile.left + tile.width / 2, y: tile.top + tile.height / 2 }
      : undefined

    if (enabled) {
      // Launching gets the classic damped bounce; poking an app that is already
      // running just gets a press, so the two actions never feel alike.
      if (isRunning) {
        bounce.start({ scale: [1, 0.92, 1], transition: { duration: 0.22, ease: 'easeOut' } })
      } else {
        bounce.start({
          y: [0, -18, 0, -10, 0, -4, 0],
          transition: { duration: 0.85, times: [0, 0.16, 0.34, 0.48, 0.64, 0.82, 1], ease: 'easeOut' },
        })
      }
    }

    if (!isRunning) playSound('launch')
    openApp(app.id, launchOrigin)
  }

  const Glyph = app.icon

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="pointer-events-none absolute bottom-full mb-2.5 whitespace-nowrap rounded-md border border-white/10 bg-black/65 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-md"
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={springs.focus}
          >
            {app.name}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.button
        ref={tileRef}
        type="button"
        aria-label={isRunning ? `${app.name}, open` : app.name}
        onClick={handleClick}
        animate={bounce}
        className="flex shrink-0 items-center justify-center rounded-[24%] border border-white/20 text-white shadow-[inset_0_1px_0_oklch(1_0_0_/_0.3),0_8px_18px_-8px_oklch(0_0_0_/_0.85)]"
        style={{
          width: enabled ? size : BASE_SIZE,
          height: enabled ? size : BASE_SIZE,
          backgroundImage: app.tile,
          // Keeps the press and the bounce anchored to the dock's baseline.
          transformOrigin: 'bottom',
        }}
      >
        <Glyph className="h-1/2 w-1/2" strokeWidth={1.7} aria-hidden />
      </motion.button>

      {/* Always rendered so the running dot can't shift the dock's layout. */}
      <span
        aria-hidden
        className={`mt-1.5 size-1 rounded-full bg-white transition-opacity duration-200 ${
          isRunning ? 'opacity-90' : 'opacity-0'
        }`}
      />
    </div>
  )
}
