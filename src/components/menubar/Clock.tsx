import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Calendar } from '@/components/menubar/Calendar'
import { useMinuteTick } from '@/hooks/useMinuteTick'
import { playSound } from '@/lib/sounds'
import { springs } from '@/lib/springs'

/**
 * Formatted in the user's own locale — a 12h locale gets "Sat 26 Jul 12:34 pm",
 * a 24h one gets "Sat 26 Jul 12:34". Built once; formatters are expensive.
 */
const FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * The clock, and the calendar that drops out of it — the one menu-bar item with
 * a real menu behind it.
 *
 * Dismissal is a menu's, not a dialog's: click anywhere else, or press `Esc`.
 * Focus is deliberately *not* trapped or moved into the panel — it stays on the
 * button, so tabbing walks straight into the three navigation controls and then
 * back out into the page, the way a menu bar should behave.
 */
export function Clock({ className = '' }: { className?: string }) {
  const now = useMinuteTick()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Any press outside the clock closes it. `pointerdown` rather than `click`,
  // so the panel is gone before whatever was clicked reacts — a mousedown on a
  // window title bar should start a drag, not fight a popover for the gesture.
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function toggle() {
    setOpen((wasOpen) => !wasOpen)
    playSound('pop')
  }

  // Scoped to this subtree, so `Esc` only means "close the calendar" while the
  // calendar is what has focus — a focused window keeps its own `Esc`.
  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key !== 'Escape' || !open) return
    event.stopPropagation()
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${FORMAT.format(now)} — show calendar`}
        onClick={toggle}
      >
        <time dateTime={now.toISOString()} className="tabular-nums" aria-hidden>
          {FORMAT.format(now)}
        </time>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Calendar"
            // Opaque rather than frosted: §6 keeps `backdrop-blur` to the menu
            // bar, dock and active window, and this panel hangs off a surface
            // that is already paying for one.
            className="absolute right-0 top-[calc(100%+6px)] origin-top-right rounded-xl border border-white/12 bg-[oklch(0.21_0.035_288)] shadow-2xl shadow-black/50"
            // The bar's shadow exists to survive a bright wallpaper; on a dark
            // opaque panel it just smears the digits.
            style={{ textShadow: 'none' }}
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.94, y: prefersReducedMotion ? 0 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : { opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }
            }
            // Feedback, not choreography — a menu should already be there.
            // Opacity is a tween, not a spring: a spring overshoots, and an
            // overshoot on opacity is just a slower fade with no motion in it.
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : { ...springs.focus, opacity: { duration: 0.12, ease: 'easeOut' } }
            }
          >
            <Calendar today={now} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
