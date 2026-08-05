import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import {
  canMove,
  createBoard,
  directionFromKey,
  highestTile,
  move,
  SIZE,
  WIN,
  type Board,
  type Direction,
  type Tile,
} from '@/apps/Game2048/game'
import { useBestScore } from '@/apps/Game2048/useBestScore'
import { playSound } from '@/lib/sounds'
import { springs } from '@/lib/springs'

/**
 * 2048.app — the turn-based counterweight to Snake.
 *
 * Snake is the template for a game that runs a clock: a canvas, a rAF loop, a
 * model mutated in place. This one deliberately shares none of that. It moves
 * only when a person presses something, so the board is React state, the tiles
 * are real DOM elements with real text in them, and there is no loop at all.
 *
 * The whole layout is expressed as percentages of a square board, which is why
 * there's no `ResizeObserver` here either: a tile is `CELL%` of the board and
 * sits at `col * STEP%` of *its own* width, so the same markup fills a 400px
 * window and a full-screen phone sheet with nothing measuring anything. Motion
 * animates `x`/`y`/`scale` only — never the width, top or left it could have
 * used instead.
 */

/** Gutter between cells, as a percentage of the board. */
const GAP = 2.5
/** A cell, same units — four cells and three gutters fill the board exactly. */
const CELL = (100 - GAP * (SIZE - 1)) / SIZE
/**
 * One cell of travel, as a percentage of a *tile's* width, because that's what
 * a percentage `x` transform is measured against.
 */
const STEP = ((CELL + GAP) / CELL) * 100

export default function Game2048() {
  const rootRef = useRef<HTMLDivElement>(null)

  const [board, setBoard] = useState<Board>(createBoard)
  /** One move of history. Undo is the whole reason a move returns a new board. */
  const [previous, setPrevious] = useState<Board | null>(null)
  /** Set once you choose to play past 2048, so the banner doesn't nag every move. */
  const [keptGoing, setKeptGoing] = useState(false)

  const best = useBestScore((state) => state.best)
  const submit = useBestScore((state) => state.submit)

  const prefersReducedMotion = useReducedMotion()
  const [isTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  const over = useMemo(() => !canMove(board), [board])
  const highest = useMemo(() => highestTile(board), [board])
  const won = highest >= WIN && !keptGoing

  // The game only hears keys it has focus for, so it takes focus on arrival —
  // in a window this happens just after the focus trap has parked focus on the
  // frame, which is exactly the thing we want to take it from.
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  function push(direction: Direction) {
    if (over || won) return

    const next = move(board, direction)
    // A press into a wall isn't a move: no tile, no undo, no sound.
    if (!next) return

    setPrevious(board)
    setBoard(next)
    submit(next.score)

    if (!canMove(next)) playSound('gameover')
    else if (next.score > board.score) playSound('merge')
  }

  function undo() {
    if (!previous) return
    setBoard(previous)
    // One step, not a stack — this is a take-back for a fat-fingered arrow, not
    // a way to play the board backwards until it goes your way.
    setPrevious(null)
    playSound('pop')
  }

  function restart() {
    setBoard(createBoard())
    setPrevious(null)
    setKeptGoing(false)
    rootRef.current?.focus()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    // `Window` reads arrows and Esc on the frame and they bubble to it from
    // here, so anything this game answers is stopped dead rather than merely
    // defaulted. The frame ignores arrows unless it is itself the target, and
    // this root holds focus — but the game shouldn't depend on the shell's
    // guard to keep the window still while you play.
    const consume = () => {
      event.preventDefault()
      event.stopPropagation()
    }

    // Esc is deliberately not in that list. Snake swallows the first press
    // because it has a run in progress to interrupt; nothing here is running,
    // so Esc stays what it is everywhere else in this OS and closes the window.

    if (event.key === 'u' || event.key === 'U') {
      consume()
      undo()
      return
    }

    if (event.key === 'n' || event.key === 'N') {
      consume()
      restart()
      return
    }

    const direction = directionFromKey(event.key)
    if (!direction) return
    // Consumed even when the board is finished: an arrow on the game-over
    // screen must not move the window out from under it either.
    consume()
    push(direction)
  }

  /**
   * Touch input. `touch-none` on the board is what makes a vertical swipe move
   * the tiles rather than scroll the sheet the board is sitting in.
   */
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = swipeStart.current
    swipeStart.current = null
    if (!origin) return

    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return

    push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  return (
    <div
      ref={rootRef}
      // `application` tells a screen reader to hand keystrokes straight through
      // rather than intercepting the arrows for its own browse mode.
      role="application"
      aria-label="2048"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col gap-3 bg-[oklch(0.17_0.025_282)] p-4 outline-none"
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex gap-4 text-[13px] tabular-nums">
          <p className="text-white/85">
            <span className="text-white/45">Score </span>
            {board.score}
          </p>
          <p className="text-white/60">
            <span className="text-white/40">Best </span>
            {Math.max(best, board.score)}
          </p>
        </div>

        <div className="flex gap-1.5">
          <Control onClick={undo} disabled={!previous}>
            Undo
          </Control>
          <Control onClick={restart}>New game</Control>
        </div>
      </div>

      {/* The board is the largest square that fits. `cq` units rather than a
          measured pixel size: the wrapper is the reference for how big the
          square can be, the board is the reference for everything inside it. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
        style={{ containerType: 'size' }}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center"
      >
        <div
          style={{ width: 'min(100cqw, 100cqh)', containerType: 'size' }}
          className="relative aspect-square rounded-lg bg-[oklch(0.21_0.025_282)] p-0"
        >
          {/* The empty grid, laid out by the same arithmetic as the tiles, so
              a tile can never land a subpixel off the hole it's filling. */}
          {Array.from({ length: SIZE * SIZE }, (_, index) => (
            <div
              key={index}
              aria-hidden
              className="absolute top-0 left-0 rounded-[12%] bg-white/4"
              style={{
                width: `${CELL}%`,
                height: `${CELL}%`,
                transform: `translate(${(index % SIZE) * STEP}%, ${Math.floor(index / SIZE) * STEP}%)`,
              }}
            />
          ))}

          {/* Tiles read as text to a sighted person and as noise to a screen
              reader — they're absolutely positioned, so DOM order lies about
              where they are. The live region below is the honest version. */}
          <div aria-hidden className="absolute inset-0">
            {board.tiles.map((tile) => (
              <TileView key={tile.id} tile={tile} reducedMotion={Boolean(prefersReducedMotion)} />
            ))}
          </div>

          {(over || won) && (
            <Overlay reducedMotion={Boolean(prefersReducedMotion)}>
              {won ? (
                <>
                  <h2 className="text-[15px] font-semibold text-white">2048</h2>
                  <p className="text-[13px] text-white/55">
                    You got there in {board.score} points. The board still has room.
                  </p>
                  <Action onClick={() => setKeptGoing(true)}>Keep going</Action>
                </>
              ) : (
                <>
                  <h2 className="text-[15px] font-semibold text-white">No moves left</h2>
                  <p className="text-[13px] text-white/55">
                    {board.score} points, best tile {highest}
                    {board.score > 0 && board.score >= best ? ' — a new best.' : `. Best is ${best}.`}
                  </p>
                  <div className="mt-1 flex flex-wrap justify-center gap-2">
                    <Action onClick={restart}>Play again</Action>
                    {previous && <Action onClick={undo}>Take that back</Action>}
                  </div>
                </>
              )}
            </Overlay>
          )}
        </div>
      </div>

      <p role="status" className="sr-only">
        Score {board.score}. Highest tile {highest}.
      </p>

      {isTouch ? (
        <DPad onMove={push} />
      ) : (
        <p className="shrink-0 text-center text-[12px] text-white/35">
          Arrow keys or WASD · U undoes · N starts over
        </p>
      )}
    </div>
  )
}

/**
 * One tile. Everything about it that changes is a transform: it slides with
 * `x`/`y` and arrives with `scale`, so a move never touches layout.
 *
 * A merge mounts a brand-new tile at the destination while the two it came
 * from slide underneath it as ghosts — which is why `initial` only pops the
 * tiles that are genuinely new. Anything already on the board gets `false`,
 * meaning "you are already where you were; animate from there".
 */
function TileView({ tile, reducedMotion }: { tile: Tile; reducedMotion: boolean }) {
  const fresh = Boolean(tile.spawned || tile.merged)
  const skin = skinFor(tile.value)
  const at = { x: `${tile.col * STEP}%`, y: `${tile.row * STEP}%` }

  return (
    <motion.div
      className={`absolute top-0 left-0 flex items-center justify-center rounded-[12%] font-semibold tabular-nums ${skin.text} ${sizeFor(tile.value)}`}
      style={{
        width: `${CELL}%`,
        height: `${CELL}%`,
        background: skin.background,
        // Ghosts under the tile they became, new tiles over everything they
        // slid past on the way in.
        zIndex: tile.ghost ? 1 : fresh ? 3 : 2,
      }}
      // `initial` has to carry the position too, not just the scale it wants to
      // pop from: keys left out of it start at the element's CSS value, which
      // for a transform is zero — so a tile born in the bottom-right corner
      // would fly in from the top-left one instead of appearing where it is.
      initial={fresh && !reducedMotion ? { ...at, scale: 0.4 } : false}
      animate={{ ...at, scale: 1 }}
      transition={
        reducedMotion ? { duration: 0.12 } : { ...springs.focus, scale: springs.dock }
      }
    >
      {tile.value}
    </motion.div>
  )
}

/**
 * The value ramp. The original 2048 goes cream to orange on beige; this board
 * is dark, so the ramp starts as barely-lit slate and heats up — a glance at
 * the board tells you how far along you are without reading a number.
 */
const SKINS: { background: string; text: string }[] = [
  { background: 'oklch(0.32 0.02 282)', text: 'text-white/80' }, // 2
  { background: 'oklch(0.38 0.03 282)', text: 'text-white/90' }, // 4
  { background: 'oklch(0.62 0.14 250)', text: 'text-[oklch(0.16_0.02_280)]' }, // 8
  { background: 'oklch(0.68 0.15 215)', text: 'text-[oklch(0.16_0.02_280)]' }, // 16
  { background: 'oklch(0.74 0.15 178)', text: 'text-[oklch(0.16_0.02_280)]' }, // 32
  { background: 'oklch(0.79 0.16 145)', text: 'text-[oklch(0.16_0.02_280)]' }, // 64
  { background: 'oklch(0.85 0.16 108)', text: 'text-[oklch(0.16_0.02_280)]' }, // 128
  { background: 'oklch(0.84 0.16 82)', text: 'text-[oklch(0.16_0.02_280)]' }, // 256
  { background: 'oklch(0.79 0.17 58)', text: 'text-[oklch(0.16_0.02_280)]' }, // 512
  { background: 'oklch(0.72 0.19 34)', text: 'text-white' }, // 1024
  { background: 'oklch(0.66 0.22 16)', text: 'text-white' }, // 2048
  { background: 'oklch(0.58 0.24 348)', text: 'text-white' }, // beyond
]

function skinFor(value: number) {
  return SKINS[Math.min(Math.log2(value) - 1, SKINS.length - 1)]
}

/**
 * Text scales with the board, not with the window: `cqw` is a percentage of the
 * board, so "1024" is the same fraction of its tile at every size. Written as
 * whole class strings because Tailwind reads them out of the source.
 */
function sizeFor(value: number): string {
  if (value < 100) return 'text-[11cqw]'
  if (value < 1000) return 'text-[9cqw]'
  if (value < 10000) return 'text-[7cqw]'
  return 'text-[5.5cqw]'
}

/**
 * The win / game-over screen — DOM over the board rather than something drawn
 * into it, so the buttons are real buttons and the text is real text. Reduced
 * motion gets the fade without the rise.
 */
function Overlay({ reducedMotion, children }: { reducedMotion: boolean; children: ReactNode }) {
  return (
    <motion.div
      role="status"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-lg bg-[oklch(0.14_0.02_280_/_0.86)] p-6 text-center"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0.12 } : springs.focus}
    >
      {children}
    </motion.div>
  )
}

function Action({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] whitespace-nowrap text-white/85 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
    >
      {children}
    </button>
  )
}

function Control({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/70 transition-colors hover:border-white/20 hover:bg-white/12 hover:text-white disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  )
}

/**
 * The touch fallback. Swiping is the gesture everyone already knows for this
 * game and stays available, but the pad is the control nobody has to discover —
 * and it's the only way to play with a switch or a screen reader on a phone.
 */
function DPad({ onMove }: { onMove: (direction: Direction) => void }) {
  const buttons = [
    { direction: 'up', label: 'Move up', Icon: ChevronUp, className: 'col-start-2 row-start-1' },
    { direction: 'left', label: 'Move left', Icon: ChevronLeft, className: 'col-start-1 row-start-2' },
    { direction: 'right', label: 'Move right', Icon: ChevronRight, className: 'col-start-3 row-start-2' },
    { direction: 'down', label: 'Move down', Icon: ChevronDown, className: 'col-start-2 row-start-3' },
  ] as const

  return (
    <div className="mx-auto grid shrink-0 grid-cols-3 grid-rows-3 gap-1.5">
      {buttons.map(({ direction, label, Icon, className }) => (
        <button
          key={direction}
          type="button"
          aria-label={label}
          onClick={() => onMove(direction)}
          className={`${className} flex size-12 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white/75 transition-colors active:bg-white/20 active:text-white`}
        >
          <Icon className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      ))}
    </div>
  )
}
