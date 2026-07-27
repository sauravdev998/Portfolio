/**
 * Snake's model — the whole game, with no React and no canvas anywhere in it.
 *
 * Kept as a plain mutable object rather than immutable state on purpose: this
 * advances up to a dozen times a second inside a `requestAnimationFrame` loop,
 * where allocating a fresh board per tick is pure waste and a React re-render
 * per tick is worse. The component owns exactly one `Game` in a ref, hands it
 * to `step`, and only tells React about the things a person can see change —
 * the score and the state machine.
 */

/** The board is always this many cells square, whatever size the window is. */
export const GRID = 20

export interface Cell {
  x: number
  y: number
}

export type Direction = 'up' | 'right' | 'down' | 'left'

const VECTORS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

/** Arrows and WASD both drive the snake; anything else isn't ours. */
export function directionFromKey(key: string): Direction | undefined {
  return KEYS[key] ?? KEYS[key.toLowerCase()]
}

export interface Game {
  /** Head first, so `snake[0]` is where the next move comes from. */
  snake: Cell[]
  direction: Direction
  /** Turns taken but not yet advanced through — see `turn`. */
  queued: Direction[]
  food: Cell
  score: number
}

export type StepResult = 'moved' | 'ate' | 'dead'

export function createGame(): Game {
  const start = Math.floor(GRID / 2)
  // Three segments, mid-board, already pointing right — long enough to read as
  // a snake before the first tick, short enough that nothing is under it.
  const snake = [
    { x: start, y: start },
    { x: start - 1, y: start },
    { x: start - 2, y: start },
  ]
  return { snake, direction: 'right', queued: [], food: spawnFood(snake), score: 0 }
}

/**
 * Two turns can be queued, not one. A tick is ~100ms and corners are two
 * presses in quick succession — buffering only the latest would silently eat
 * the first half of every "up then right", which feels like dropped input.
 *
 * Reversals are rejected against the *last queued* direction rather than the
 * current one, because that is the direction the snake will actually be facing
 * when this turn lands; checking the live one lets you fold into your own neck
 * by pressing left-then-down faster than the clock.
 */
const MAX_QUEUED = 2

export function turn(game: Game, next: Direction): void {
  const facing = game.queued.at(-1) ?? game.direction
  if (next === facing || next === OPPOSITE[facing]) return
  if (game.queued.length >= MAX_QUEUED) return
  game.queued.push(next)
}

export function step(game: Game): StepResult {
  const direction = game.queued.shift() ?? game.direction
  game.direction = direction

  const vector = VECTORS[direction]
  const head = { x: game.snake[0].x + vector.x, y: game.snake[0].y + vector.y }

  // Classic walls, no wrap.
  if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) return 'dead'

  // The tail vacates its cell on this same tick, so moving into it is legal —
  // unless we're eating, in which case the tail stays put and it's a collision.
  const ate = head.x === game.food.x && head.y === game.food.y
  const body = ate ? game.snake : game.snake.slice(0, -1)
  if (body.some((cell) => cell.x === head.x && cell.y === head.y)) return 'dead'

  game.snake = [head, ...body]
  if (!ate) return 'moved'

  game.score += 1
  game.food = spawnFood(game.snake)
  return 'ate'
}

/**
 * Uniformly random over the *free* cells rather than "guess until it misses":
 * 400 cells is nothing to enumerate, and rejection sampling gets arbitrarily
 * slow exactly when the board is nearly full and the game is at its best.
 */
function spawnFood(snake: Cell[]): Cell {
  const taken = new Set(snake.map((cell) => `${cell.x},${cell.y}`))
  const free: Cell[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  // A full board is a won game and the last tick there can ever be, so parking
  // the food under the head is a harmless terminal value.
  if (free.length === 0) return snake[0]
  return free[Math.floor(Math.random() * free.length)]
}

/**
 * Tick length in ms — the difficulty curve, and the only thing that gets
 * harder. It tightens with every apple and then stops: past a certain speed the
 * game stops being about planning and starts being about reflexes, which isn't
 * the game this is.
 */
export function tickInterval(score: number): number {
  return Math.max(70, 130 - score * 2)
}
