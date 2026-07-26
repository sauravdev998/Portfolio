import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from 'motion/react'
import { dockIconCenter, dockIconElement } from '@/components/dock/dockIcons'
import { ResizeHandles, type ResizeDirection } from '@/components/window/ResizeHandles'
import { TrafficLights } from '@/components/window/TrafficLights'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { playSound } from '@/lib/sounds'
import { springs } from '@/lib/springs'
import { MIN_WINDOW_SIZE, useDesktop, type Point, type WindowState } from '@/store/useDesktop'

/**
 * A single window: chrome, drag, resize, focus and the traffic lights.
 *
 * Geometry lives in two places on purpose. The store holds the *settled* value;
 * MotionValues hold the value *during a gesture*. Dragging a window therefore
 * costs zero React renders — only a transform update — and the store learns the
 * result once the pointer comes up. Everything that isn't a gesture (maximize,
 * restore, a viewport resize) flows the other way: the store changes and the
 * effect below springs the MotionValues to match.
 *
 * A minimized window stays mounted, scaled down onto its dock icon and hidden.
 * Unmounting it would be tidier, but it would throw away whatever the app body
 * was holding — half-typed text in Contact, a scroll position in Projects — and
 * a restore would have to replay the *open* animation from a cold mount rather
 * than simply growing back out of the dock.
 */

/**
 * How small a window is when it sits on a dock icon — the size it grows out of
 * when it opens, and shrinks back into when it minimizes. Roughly a dock tile's
 * width divided by a typical window's, held as a constant rather than derived so
 * the window layer needn't know the dock's dimensions. Any value this small reads
 * as "it's on the icon"; the transform origin does the real work.
 */
const DOCKED_SCALE = 0.08

/** Fallback for a window with no dock icon to come from: a scale from its centre. */
const OPEN_SCALE_CENTRED = 0.94

/**
 * The focus pulse: a window taking focus swells by a fraction of a percent and
 * settles. Far too small to read as an animation — which is the point. It just
 * makes a click land on something with mass.
 */
const FOCUS_PULSE = 1.006
const FOCUS_PULSE_MS = 260

/** Arrow-key nudge, in px. Shift is the fine adjustment. */
const ARROW_STEP = 24
const ARROW_STEP_FINE = 4

const ARROW_KEYS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function Window({ win, children }: { win: WindowState; children?: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)
  const workArea = useDesktop((state) => state.workArea)
  const workAreaOrigin = useDesktop((state) => state.workAreaOrigin)
  const isFocused = useDesktop((state) => state.focusedId === win.id)
  const focusWindow = useDesktop((state) => state.focusWindow)
  const closeWindow = useDesktop((state) => state.closeWindow)
  const minimizeWindow = useDesktop((state) => state.minimizeWindow)
  const toggleMaximize = useDesktop((state) => state.toggleMaximize)
  const moveWindow = useDesktop((state) => state.moveWindow)
  const resizeWindow = useDesktop((state) => state.resizeWindow)

  const x = useMotionValue(win.position.x)
  const y = useMotionValue(win.position.y)
  const width = useMotionValue(win.size.width)
  const height = useMotionValue(win.size.height)

  // Dragging is started by hand from the title bar, so grabbing the window body
  // (text, buttons, a future app's scroll area) never moves the window.
  const dragControls = useDragControls()

  const prefersReducedMotion = useReducedMotion()

  /**
   * The dock icon's position in this window's own coordinates, ready to hand to
   * `transform-origin`. Collapsing the window to `DOCKED_SCALE` about that point
   * puts it exactly on top of the icon, so both open and minimize are a plain
   * scale — no width/height, no layout, nothing off the compositor.
   *
   * `undefined` means "scale about your own centre", which is what a window with
   * no dock icon behind it gets. Set at three moments and only three: at mount
   * from the icon that launched it, at minimize from wherever that icon is *now*,
   * and back to `undefined` once the window has finished arriving — a window at
   * rest is at scale 1, where the origin has nothing to act on, and leaving it
   * pointed off-screen would make the focus pulse below shove it sideways.
   */
  const [origin, setOrigin] = useState<Point | undefined>(() =>
    win.launchOrigin
      ? {
          x: win.launchOrigin.x - workAreaOrigin.x - win.position.x,
          y: win.launchOrigin.y - workAreaOrigin.y - win.position.y,
        }
      : undefined,
  )

  /**
   * True once the window has finished opening or restoring. The focus pulse is a
   * keyframe array, and Motion starts keyframes from their first value — firing
   * one mid-arrival would snap the window to full size and eat the animation.
   */
  const [hasArrived, setHasArrived] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  // Store → MotionValues. During a drag or resize the store doesn't change, so
  // this stays quiet; afterwards it re-runs with the committed value already in
  // place and springs a zero-distance animation, which is a no-op.
  useEffect(() => {
    const transition = prefersReducedMotion ? { duration: 0 } : springs.window
    const animations = [
      animate(x, win.position.x, transition),
      animate(y, win.position.y, transition),
      animate(width, win.size.width, transition),
      animate(height, win.size.height, transition),
    ]
    return () => animations.forEach((animation) => animation.stop())
  }, [
    win.position.x,
    win.position.y,
    win.size.width,
    win.size.height,
    x,
    y,
    width,
    height,
    prefersReducedMotion,
  ])

  // A minimized window is on its way back to the dock, not arrived.
  useEffect(() => {
    if (win.isMinimized) setHasArrived(false)
  }, [win.isMinimized])

  // Fires only on a false → true transition, so neither mounting focused nor a
  // re-render for some unrelated reason counts as "took focus".
  const wasFocused = useRef(isFocused)
  useEffect(() => {
    const tookFocus = isFocused && !wasFocused.current
    wasFocused.current = isFocused
    if (!tookFocus || prefersReducedMotion) return

    setIsPulsing(true)
    const timer = setTimeout(() => setIsPulsing(false), FOCUS_PULSE_MS)
    return () => clearTimeout(timer)
  }, [isFocused, prefersReducedMotion])

  // The focused window is the active surface: DOM focus lives inside it and
  // Tab wraps at its edges. The dock and menu bar stay reachable — the trap
  // only holds focus it already has (see the hook).
  useFocusTrap(sectionRef, isFocused && !win.isMinimized)

  function handleClose() {
    playSound('close')
    closeWindow(win.id)
    // If that was the last visible window, focus falls back to this app's dock
    // icon — the place the window went, and a live starting point for Tab.
    // When another window remains, its own trap picks focus up instead.
    if (!useDesktop.getState().focusedId) dockIconElement(win.appId)?.focus()
  }

  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key === 'Escape') {
      const target = event.target as HTMLElement
      // First Esc inside a text field only leaves the field — closing the
      // whole window mid-sentence would throw away what was being typed.
      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        target.blur()
        sectionRef.current?.focus()
        return
      }
      handleClose()
      return
    }

    // Arrow keys move the window, but only when the frame itself has focus —
    // inside the body they belong to the app (a text caret, a list).
    const direction = ARROW_KEYS[event.key]
    if (direction && event.target === event.currentTarget && !win.isMaximized) {
      event.preventDefault()
      const step = event.shiftKey ? ARROW_STEP_FINE : ARROW_STEP
      moveWindow(win.id, {
        x: win.position.x + direction.x * step,
        y: win.position.y + direction.y * step,
      })
    }
  }

  function handleMinimize() {
    // Measure the icon now rather than reusing the launch origin: the dock
    // re-centres as icons magnify and as the viewport changes, so where this app
    // launched from an hour ago is not where it lives now. `x`/`y` are read off
    // the MotionValues so a window minimized straight after a drag still goes to
    // the right place.
    const icon = dockIconCenter(win.appId)
    setOrigin({
      x: icon.x - workAreaOrigin.x - x.get(),
      y: icon.y - workAreaOrigin.y - y.get(),
    })
    playSound('minimize')
    minimizeWindow(win.id)
  }

  function handleResizeStart(direction: ResizeDirection, event: ReactPointerEvent) {
    // Stop the pointer from also starting a drag or selecting text.
    event.preventDefault()
    event.stopPropagation()
    focusWindow(win.id)

    const start = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: x.get(),
      y: y.get(),
      width: width.get(),
      height: height.get(),
    }
    // The edges opposite the grabbed one are pinned for the whole gesture.
    const right = start.x + start.width
    const bottom = start.y + start.height

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.pointerX
      const dy = moveEvent.clientY - start.pointerY

      let nextX = start.x
      let nextY = start.y
      let nextWidth = start.width
      let nextHeight = start.height

      if (direction.includes('e')) {
        nextWidth = clamp(start.width + dx, MIN_WINDOW_SIZE.width, workArea.width - start.x)
      }
      if (direction.includes('w')) {
        // Growing leftwards moves the frame as well as sizing it; capping the
        // width at `right` is what stops the left edge crossing x = 0.
        nextWidth = clamp(start.width - dx, MIN_WINDOW_SIZE.width, right)
        nextX = right - nextWidth
      }
      if (direction.includes('s')) {
        nextHeight = clamp(start.height + dy, MIN_WINDOW_SIZE.height, workArea.height - start.y)
      }
      if (direction.includes('n')) {
        nextHeight = clamp(start.height - dy, MIN_WINDOW_SIZE.height, bottom)
        nextY = bottom - nextHeight
      }

      x.set(nextX)
      y.set(nextY)
      width.set(nextWidth)
      height.set(nextHeight)
    }

    const handleEnd = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)

      // Size first: `moveWindow` clamps the position against the window's size.
      resizeWindow(win.id, { width: width.get(), height: height.get() })
      moveWindow(win.id, { x: x.get(), y: y.get() })
    }

    // Listen on the window, not the handle: the pointer routinely outruns a
    // 2px strip, and a resize must keep tracking when it does.
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)
  }

  const isPulseRunning = isPulsing && hasArrived && !win.isMinimized

  const transition = prefersReducedMotion
    ? { duration: 0.12 }
    : {
        ...springs.window,
        // Opacity is deliberately out of step with the spring in both directions.
        // Opening, it lands early so you watch a solid window grow rather than a
        // dissolve; minimizing, it hangs on so the window is still visible for
        // most of its trip down to the dock.
        opacity: win.isMinimized
          ? { duration: 0.3, ease: 'easeIn' as const }
          : { duration: 0.18, ease: 'easeOut' as const },
        // The pulse is three keyframes over a quarter of a second; the window
        // spring would take longer than that just to reach the first one.
        ...(isPulseRunning
          ? { scale: { duration: FOCUS_PULSE_MS / 1000, ease: 'easeInOut' as const } }
          : null),
      }

  // Blur is expensive, so only the focused window pays for it; the rest get a
  // flatter, more opaque surface, which also reads as "behind".
  const surface = isFocused
    ? 'border-white/20 bg-[oklch(0.24_0.035_288_/_0.72)] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_32px_80px_-24px_oklch(0_0_0_/_0.85)]'
    : 'border-white/10 bg-[oklch(0.19_0.03_288_/_0.94)] shadow-[0_18px_50px_-28px_oklch(0_0_0_/_0.7)]'

  return (
    <motion.section
      ref={sectionRef}
      role="dialog"
      aria-label={win.title}
      aria-modal={false}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`absolute left-0 top-0 flex flex-col overflow-hidden rounded-xl border ${surface}`}
      // A minimized window stays mounted — see the note above the component —
      // so it has to be taken out of the tab order and off the hit-test path by
      // hand. `inert` does both; the pointer rule is belt and braces.
      inert={win.isMinimized}
      style={{
        x,
        y,
        width,
        height,
        zIndex: win.zIndex,
        pointerEvents: win.isMinimized ? 'none' : undefined,
        // Pixels, not percentages — the dock sits below the window, so this
        // point is routinely outside the box, which percentages of the element's
        // own size express badly.
        transformOrigin: origin ? `${origin.x}px ${origin.y}px` : 'center',
      }}
      initial={{
        opacity: 0,
        // Reduced motion gets a pure fade: a window flying out of the dock is
        // exactly the kind of large-area motion the preference asks us to drop.
        scale: prefersReducedMotion ? 1 : origin ? DOCKED_SCALE : OPEN_SCALE_CENTRED,
      }}
      animate={
        win.isMinimized
          ? { opacity: 0, scale: prefersReducedMotion ? 1 : DOCKED_SCALE }
          : { opacity: 1, scale: isPulseRunning ? [1, FOCUS_PULSE, 1] : 1 }
      }
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={transition}
      onAnimationComplete={() => {
        if (win.isMinimized) return
        setHasArrived(true)
        // Hand the origin back to the centre now that the window has landed.
        setOrigin((current) => (current ? undefined : current))
      }}
      onPointerDownCapture={() => focusWindow(win.id)}
      drag={!win.isMaximized}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{
        left: 0,
        top: 0,
        right: Math.max(0, workArea.width - win.size.width),
        bottom: Math.max(0, workArea.height - win.size.height),
      }}
      onDragEnd={() => moveWindow(win.id, { x: x.get(), y: y.get() })}
    >
      <header
        className="flex h-9 shrink-0 touch-none items-center gap-3 border-b border-white/10 px-3"
        onPointerDown={(event) => {
          if (!win.isMaximized) dragControls.start(event)
        }}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <TrafficLights
          title={win.title}
          isMaximized={win.isMaximized}
          onClose={handleClose}
          onMinimize={handleMinimize}
          onToggleMaximize={() => toggleMaximize(win.id)}
        />

        {/* Centred over the full width like macOS, so the lights don't shift it. */}
        <h2
          className={`pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold transition-opacity ${
            isFocused ? 'text-white/90' : 'text-white/45'
          }`}
        >
          {win.title}
        </h2>
      </header>

      <div className="relative flex-1 select-text overflow-auto">{children}</div>

      {/* A maximized window has no free edges to drag. */}
      {!win.isMaximized && <ResizeHandles onResizeStart={handleResizeStart} />}
    </motion.section>
  )
}
