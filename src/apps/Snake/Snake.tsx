import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { draw } from '@/apps/Snake/draw'
import {
  createGame,
  directionFromKey,
  GRID,
  step,
  tickInterval,
  turn,
  type Direction,
  type Game,
} from '@/apps/Snake/game'
import { useHighScore } from '@/apps/Snake/useHighScore'
import { playSound } from '@/lib/sounds'
import { springs } from '@/lib/springs'

/**
 * Snake.app — the one app that wants the keyboard more than the window does.
 *
 * Three things make it different from the other bodies. It runs a clock: a
 * single `requestAnimationFrame` loop with a fixed-tick accumulator, so the
 * snake moves at the same speed on a 60Hz laptop and a 144Hz monitor and the
 * loop only exists while a game is actually being played. It draws to a canvas
 * sized by a `ResizeObserver` rather than laying anything out, because the same
 * body has to fill a resizable window *and* a full-screen phone sheet. And it
 * argues with the window manager over arrow keys and `Esc` — see `handleKeyDown`.
 *
 * Everything a person can see change (score, which screen is showing) is React
 * state. Everything the loop touches sixty times a second is a ref. The
 * overlays are DOM on top of the canvas, not pixels inside it, so they're
 * focusable, selectable and legible to a screen reader.
 */

type Status = 'idle' | 'playing' | 'paused' | 'gameover'

/** A frame after a long stall shouldn't be paid back all at once. */
const MAX_FRAME_MS = 250

export default function Snake() {
  const rootRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const gameRef = useRef<Game>(createGame())
  const cellRef = useRef(0)
  const dprRef = useRef(1)

  // Status lives twice on purpose: the loop and the key handler need to read it
  // synchronously, mid-frame, before React has re-rendered anything.
  const statusRef = useRef<Status>('idle')
  const [status, setStatusState] = useState<Status>('idle')
  const [score, setScore] = useState(0)

  const highScore = useHighScore((state) => state.highScore)
  const submitScore = useHighScore((state) => state.submit)

  const prefersReducedMotion = useReducedMotion()

  // A phone sheet has no keyboard to press Space on, so it gets a d-pad and
  // different instructions. Read once: a device doesn't grow a touchscreen.
  const [isTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  const setStatus = useCallback((next: Status) => {
    statusRef.current = next
    setStatusState(next)
  }, [])

  const render = useCallback(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    // Resizing the canvas resets its context, so the DPR scale is reapplied
    // every frame rather than set once.
    context.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0)
    draw(context, gameRef.current, cellRef.current)
  }, [])

  const start = useCallback(() => {
    gameRef.current = createGame()
    setScore(0)
    setStatus('playing')
    rootRef.current?.focus()
  }, [setStatus])

  /**
   * The board is the largest square that fits, snapped down so a cell is a
   * whole number of CSS pixels — a fractional cell puts the grid lines on
   * different subpixels and the board shimmers as the window resizes. The
   * backing store is then multiplied by DPR for a crisp result on retina.
   */
  useEffect(() => {
    const host = boardRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      const cell = Math.max(1, Math.floor(Math.min(box.width, box.height) / GRID))
      const size = cell * GRID
      const dpr = window.devicePixelRatio || 1

      cellRef.current = cell
      dprRef.current = dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      render()
    })

    observer.observe(host)
    return () => observer.disconnect()
  }, [render])

  // The clock. It exists only while a game is running: an idle app shouldn't
  // wake the compositor sixty times a second behind an overlay.
  useEffect(() => {
    if (status !== 'playing') return

    let frameId = 0
    let last = performance.now()
    let accumulator = 0

    const frame = (now: number) => {
      // The state change that stops this loop and the cleanup that cancels it
      // are a render apart; without this the frame in between still runs.
      if (statusRef.current !== 'playing') return

      accumulator += Math.min(now - last, MAX_FRAME_MS)
      last = now

      const game = gameRef.current
      let interval = tickInterval(game.score)
      while (accumulator >= interval) {
        accumulator -= interval
        const result = step(game)

        if (result === 'dead') {
          playSound('gameover')
          submitScore(game.score)
          setStatus('gameover')
          render()
          return
        }
        if (result === 'ate') {
          playSound('eat')
          setScore(game.score)
          interval = tickInterval(game.score)
        }
      }

      render()
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [status, render, setStatus, submitScore])

  // Redraw on every screen change: a restart needs the fresh board painted
  // before the loop's first frame, and a game over needs the final one to stay.
  useEffect(() => render(), [status, render])

  // A game that keeps running in a background tab is a game you come back to
  // having lost. Same for a window that lost focus — that keypress was meant
  // for whatever is in front now.
  useEffect(() => {
    const pause = () => {
      if (statusRef.current === 'playing') setStatus('paused')
    }
    const handleVisibility = () => {
      if (document.hidden) pause()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [setStatus])

  // The game only hears keys it has focus for, so it takes focus on arrival —
  // in a window this happens just after the focus trap has parked focus on the
  // frame, which is exactly the thing we want to take it from.
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  function togglePause() {
    if (statusRef.current === 'playing') setStatus('paused')
    else if (statusRef.current === 'paused') setStatus('playing')
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const current = statusRef.current
    // `Window` listens for these on the frame and they bubble to it from here,
    // so anything the game answers is stopped dead rather than merely
    // defaulted: otherwise every arrow press also shunts the window 24px.
    const consume = () => {
      event.preventDefault()
      event.stopPropagation()
    }

    if (event.key === 'Escape') {
      // Esc closes the focused window everywhere in this OS, and it still does
      // here — one press later. Mid-game it means "stop", and a key that ends
      // your run in one press is a key you learn to fear; from any other
      // screen there's nothing to interrupt, so it bubbles and closes as usual.
      if (current !== 'playing') return
      consume()
      setStatus('paused')
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      // A control inside the board has focus — let the button activate itself
      // rather than firing both it and the game.
      if (event.target !== event.currentTarget) return
      consume()
      if (current === 'playing' || current === 'paused') togglePause()
      else start()
      return
    }

    if (event.key === 'p' || event.key === 'P') {
      consume()
      togglePause()
      return
    }

    const direction = directionFromKey(event.key)
    if (!direction) return
    // Consumed on every screen, not just while playing: an arrow on the start
    // screen must not move the window out from under the game either.
    consume()

    if (current === 'idle') start()
    else if (current === 'paused') setStatus('playing')
    // A stray arrow shouldn't wipe the score you just landed — game over is
    // restarted deliberately, with Space or the button.
    else if (current === 'gameover') return

    turn(gameRef.current, direction)
  }

  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    // Tapping the d-pad or an overlay button moves focus *within* the game;
    // only focus actually leaving pauses it.
    if (event.currentTarget.contains(event.relatedTarget)) return
    if (statusRef.current === 'playing') setStatus('paused')
  }

  /**
   * Touch input: a swipe anywhere on the board turns, a tap starts, pauses or
   * resumes. `touch-none` on the board is what makes a vertical swipe steer
   * rather than scroll the sheet it's sitting in.
   */
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  function handleBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  function handleBoardPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = swipeStart.current
    swipeStart.current = null
    if (!origin) return

    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      if (statusRef.current === 'playing' || statusRef.current === 'paused') togglePause()
      else start()
      return
    }

    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  function steer(direction: Direction) {
    if (statusRef.current === 'idle') start()
    else if (statusRef.current === 'paused') setStatus('playing')
    else if (statusRef.current === 'gameover') return
    turn(gameRef.current, direction)
  }

  return (
    <div
      ref={rootRef}
      // `application` tells a screen reader to hand keystrokes straight through
      // rather than intercepting the arrows for its own browse mode.
      role="application"
      aria-label="Snake"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="flex h-full flex-col gap-3 bg-[oklch(0.17_0.025_282)] p-4 outline-none"
    >
      <div className="flex shrink-0 items-baseline justify-between text-[13px] tabular-nums">
        <p className="text-white/85">
          <span className="text-white/45">Score </span>
          {score}
        </p>
        <p className="text-white/60">
          <span className="text-white/40">Best </span>
          {Math.max(highScore, score)}
        </p>
      </div>

      <div
        ref={boardRef}
        onPointerDown={handleBoardPointerDown}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Snake board, ${GRID} by ${GRID} cells. Score ${score}.`}
          className="rounded-lg"
        />

        {status !== 'playing' && (
          <Overlay reducedMotion={Boolean(prefersReducedMotion)}>
            {status === 'idle' && (
              <>
                <h2 className="text-[15px] font-semibold text-white">Snake</h2>
                <Instructions isTouch={isTouch} />
                <Action onClick={start}>{isTouch ? 'Tap to play' : 'Play'}</Action>
              </>
            )}

            {status === 'paused' && (
              <>
                <h2 className="text-[15px] font-semibold text-white">Paused</h2>
                <p className="text-[13px] text-white/55">
                  {isTouch ? 'Tap the board to carry on.' : 'Space or P to carry on · Esc closes.'}
                </p>
                <Action onClick={() => setStatus('playing')}>Resume</Action>
              </>
            )}

            {status === 'gameover' && (
              <>
                <h2 className="text-[15px] font-semibold text-white">Game over</h2>
                <p className="text-[13px] text-white/55">
                  {score} {score === 1 ? 'apple' : 'apples'}
                  {score > 0 && score >= highScore ? ' — a new best.' : `. Best is ${highScore}.`}
                </p>
                <Action onClick={start}>Play again</Action>
              </>
            )}
          </Overlay>
        )}
      </div>

      {isTouch && <DPad onSteer={steer} />}
    </div>
  )
}

/**
 * The start / pause / game-over screen. DOM rather than something drawn into
 * the canvas, so the buttons are real buttons and the text is real text.
 * Reduced motion gets the fade without the rise — this sits over a live board,
 * and appearing instantly reads as a glitch even when nothing may move.
 */
function Overlay({ reducedMotion, children }: { reducedMotion: boolean; children: ReactNode }) {
  return (
    <motion.div
      role="status"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-[oklch(0.14_0.02_280_/_0.82)] p-6 text-center"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0.12 } : springs.focus}
    >
      {children}
    </motion.div>
  )
}

function Instructions({ isTouch }: { isTouch: boolean }) {
  return (
    <p className="max-w-[15rem] text-[13px] leading-relaxed text-white/55">
      {isTouch
        ? 'Swipe the board or use the pad below to turn. Tap to pause.'
        : 'Arrow keys or WASD to turn · Space to pause · Esc pauses, then closes.'}
    </p>
  )
}

function Action({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] text-white/85 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
    >
      {children}
    </button>
  )
}

/**
 * The touch fallback. Swiping is the better gesture and stays available, but a
 * d-pad is the one control nobody has to discover — and a game that can only
 * be played by a gesture you didn't know about is a game nobody plays.
 */
function DPad({ onSteer }: { onSteer: (direction: Direction) => void }) {
  const buttons = [
    { direction: 'up', label: 'Turn up', Icon: ChevronUp, className: 'col-start-2 row-start-1' },
    { direction: 'left', label: 'Turn left', Icon: ChevronLeft, className: 'col-start-1 row-start-2' },
    { direction: 'right', label: 'Turn right', Icon: ChevronRight, className: 'col-start-3 row-start-2' },
    { direction: 'down', label: 'Turn down', Icon: ChevronDown, className: 'col-start-2 row-start-3' },
  ] as const

  return (
    <div className="mx-auto grid shrink-0 grid-cols-3 grid-rows-3 gap-1.5">
      {buttons.map(({ direction, label, Icon, className }) => (
        <button
          key={direction}
          type="button"
          aria-label={label}
          onClick={() => onSteer(direction)}
          className={`${className} flex size-12 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white/75 transition-colors active:bg-white/20 active:text-white`}
        >
          <Icon className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      ))}
    </div>
  )
}
