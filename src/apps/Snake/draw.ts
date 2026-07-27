import { GRID, type Game } from '@/apps/Snake/game'

/**
 * The board, painted. One function, called once per frame from the game loop
 * and again whenever the canvas is resized.
 *
 * Everything is measured in cells and multiplied up at draw time, so the same
 * code covers a 440px window and a full-screen phone sheet — the caller decides
 * how big a cell is, this decides what goes in one.
 */

const BOARD = 'oklch(0.14 0.02 280)'
const GRID_LINE = 'oklch(1 0 0 / 0.05)'
const SNAKE_HEAD = 'oklch(0.88 0.16 158)'
const SNAKE_BODY = 'oklch(0.72 0.15 165)'
const FOOD = 'oklch(0.72 0.18 25)'

export function draw(ctx: CanvasRenderingContext2D, game: Game, cell: number) {
  const size = cell * GRID

  ctx.fillStyle = BOARD
  ctx.fillRect(0, 0, size, size)

  // Half-pixel offsets: a 1px line centred on an integer straddles two device
  // pixels and comes out grey and two wide.
  ctx.strokeStyle = GRID_LINE
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < GRID; i++) {
    const at = Math.round(i * cell) + 0.5
    ctx.moveTo(at, 0)
    ctx.lineTo(at, size)
    ctx.moveTo(0, at)
    ctx.lineTo(size, at)
  }
  ctx.stroke()

  ctx.fillStyle = FOOD
  ctx.beginPath()
  ctx.arc((game.food.x + 0.5) * cell, (game.food.y + 0.5) * cell, cell * 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Tail first, so the brighter head draws over the segment behind it when the
  // snake doubles back on itself.
  const inset = cell * 0.08
  const radius = Math.min(4, cell * 0.3)
  for (let i = game.snake.length - 1; i >= 0; i--) {
    const segment = game.snake[i]
    ctx.fillStyle = i === 0 ? SNAKE_HEAD : SNAKE_BODY
    ctx.beginPath()
    ctx.roundRect(
      segment.x * cell + inset,
      segment.y * cell + inset,
      cell - inset * 2,
      cell - inset * 2,
      radius,
    )
    ctx.fill()
  }
}
