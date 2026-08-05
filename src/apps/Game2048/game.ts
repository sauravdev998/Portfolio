/**
 * 2048's model — the whole game, with no React and no DOM anywhere in it.
 *
 * The opposite shape to Snake's model on purpose. Snake advances on a clock and
 * mutates one board in place, because allocating per tick is waste. This
 * advances once per keypress, so every move returns a *new* board and the old
 * one is kept for undo. Cheap at four moves a second, and it makes the whole
 * game a pure function of the last board and a direction.
 *
 * Tiles carry identity (`id`) rather than being values in a grid, because the
 * view animates them: a tile that slides three cells has to be the same DOM
 * node before and after, or it flickers instead of moving.
 */

export const SIZE = 4

/** The tile the game is named after — reaching it ends the story, not the game. */
export const WIN = 2048

/** 4s make the board tighten faster; 10% is the rate the original settled on. */
const FOUR_CHANCE = 0.1

export type Direction = 'up' | 'right' | 'down' | 'left'

export interface Tile {
  id: number
  row: number
  col: number
  value: number
  /** Just appeared out of nowhere — the view pops it in. */
  spawned?: boolean
  /** The tile a merge produced. Also popped, and it counts as new. */
  merged?: boolean
  /**
   * A tile that was absorbed by a merge. It still slides to the destination so
   * you see two tiles converge, then stops existing: the next move rebuilds
   * from live tiles only, so ghosts prune themselves without a timer. Until
   * then it sits under the tile it became, which is opaque and the same size.
   */
  ghost?: boolean
}

export interface Board {
  tiles: Tile[]
  score: number
}

const VECTOR_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

/** Arrows and WASD both move the board; anything else isn't ours. */
export function directionFromKey(key: string): Direction | undefined {
  return VECTOR_KEYS[key] ?? VECTOR_KEYS[key.toLowerCase()]
}

let nextId = 0

function makeTile(row: number, col: number, value: number, flag: 'spawned' | 'merged'): Tile {
  return { id: (nextId += 1), row, col, value, [flag]: true }
}

export function createBoard(): Board {
  const tiles: Tile[] = []
  // Two tiles, both marked fresh so the opening board animates in rather than
  // being there already when the window finishes opening.
  for (let i = 0; i < 2; i++) {
    const tile = spawn(tiles)
    if (tile) tiles.push(tile)
  }
  return { tiles, score: 0 }
}

/**
 * The move. Returns `null` when nothing shifted and nothing merged — that isn't
 * a move, it's a keypress into a wall, and it must not spawn a tile or bank an
 * undo. Callers treat `null` as "ignore this press".
 */
export function move(board: Board, direction: Direction): Board | null {
  const grid = toGrid(board.tiles)
  const vertical = direction === 'up' || direction === 'down'
  // Down and right pack against the far edge, so their lanes are walked from
  // that edge inwards: the tile nearest the wall settles first and the ones
  // behind it stack against what has already stopped.
  const forward = direction === 'down' || direction === 'right'

  const tiles: Tile[] = []
  let gained = 0
  let moved = false

  for (let lane = 0; lane < SIZE; lane++) {
    const queue: Tile[] = []
    for (let i = 0; i < SIZE; i++) {
      const index = forward ? SIZE - 1 - i : i
      const tile = vertical ? grid[index][lane] : grid[lane][index]
      if (tile) queue.push(tile)
    }

    let slot = forward ? SIZE - 1 : 0
    const advance = forward ? -1 : 1

    for (let i = 0; i < queue.length; i++) {
      const tile = queue[i]
      const next = queue[i + 1]
      const row = vertical ? slot : lane
      const col = vertical ? lane : slot

      if (next && next.value === tile.value) {
        // Both originals travel to the same cell and are spent there; the sum
        // is a new tile, which is what stops it merging twice in one move.
        const value = tile.value * 2
        gained += value
        tiles.push({ ...tile, row, col, ghost: true })
        tiles.push({ ...next, row, col, ghost: true })
        tiles.push(makeTile(row, col, value, 'merged'))
        i += 1
        moved = true
      } else {
        if (tile.row !== row || tile.col !== col) moved = true
        tiles.push({ ...tile, row, col })
      }

      slot += advance
    }
  }

  if (!moved) return null

  // A move that changed anything always leaves a gap, so this can't fail — but
  // a board that filled up shouldn't throw its way out of a game either.
  const fresh = spawn(tiles)
  if (fresh) tiles.push(fresh)

  return { tiles, score: board.score + gained }
}

/** Game over is "no direction would do anything", which is cheaper to ask directly. */
export function canMove(board: Board): boolean {
  const grid = toGrid(board.tiles)
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const tile = grid[row][col]
      if (!tile) return true
      if (grid[row][col + 1]?.value === tile.value) return true
      if (grid[row + 1]?.[col]?.value === tile.value) return true
    }
  }
  return false
}

export function highestTile(board: Board): number {
  return board.tiles.reduce((best, tile) => (tile.ghost ? best : Math.max(best, tile.value)), 0)
}

/** Ghosts are history, not board state — every read of the board drops them. */
function toGrid(tiles: Tile[]): (Tile | undefined)[][] {
  const grid: (Tile | undefined)[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => undefined),
  )
  for (const tile of tiles) {
    if (!tile.ghost) grid[tile.row][tile.col] = tile
  }
  return grid
}

/**
 * Uniformly random over the free cells rather than "guess until it misses" —
 * same reasoning as Snake's food: sixteen cells is nothing to enumerate, and
 * rejection sampling is slowest exactly when the board is nearly full.
 */
function spawn(tiles: Tile[]): Tile | undefined {
  const grid = toGrid(tiles)
  const free: { row: number; col: number }[] = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!grid[row][col]) free.push({ row, col })
    }
  }
  if (free.length === 0) return undefined

  const { row, col } = free[Math.floor(Math.random() * free.length)]
  return makeTile(row, col, Math.random() < FOUR_CHANCE ? 4 : 2, 'spawned')
}
