import { useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { AppDefinition } from '@/apps/registry'
import { springs } from '@/lib/springs'
import type { Point } from '@/store/useDesktop'

/**
 * One springboard tile — the mobile counterpart of `DockIcon`, minus everything
 * that needs a cursor: no magnification, no hover tooltip, no running dot
 * (sheets are one-at-a-time, so "running" isn't a state that exists here).
 * A press squashes the tile slightly; that's the entire vocabulary of touch
 * feedback this OS has, so it's a spring like everything else.
 */
export function SpringboardIcon({
  app,
  showLabel = true,
  onLaunch,
}: {
  app: AppDefinition
  /** Off in the dock row — iOS doesn't label docked apps either. */
  showLabel?: boolean
  onLaunch: (app: AppDefinition, origin: Point) => void
}) {
  const tileRef = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()

  function handleClick() {
    // The sheet scales out of the tapped tile, mirroring how desktop windows
    // grow out of their dock icon. Grid tiles never move, so — unlike the dock —
    // this measurement is also still valid when the sheet later closes.
    const bounds = tileRef.current?.getBoundingClientRect()
    const origin: Point = bounds
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    onLaunch(app, origin)
  }

  const Glyph = app.icon

  return (
    <motion.button
      type="button"
      aria-label={showLabel ? undefined : app.name}
      onClick={handleClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.85 }}
      transition={springs.dock}
      className="flex w-18 flex-col items-center gap-1.5"
    >
      <span
        ref={tileRef}
        className="flex size-15 items-center justify-center rounded-[24%] border border-white/20 text-white shadow-[inset_0_1px_0_oklch(1_0_0_/_0.3),0_10px_22px_-10px_oklch(0_0_0_/_0.8)]"
        style={{ backgroundImage: app.tile }}
      >
        <Glyph className="size-1/2" strokeWidth={1.7} aria-hidden />
      </span>

      {showLabel && (
        <span
          className="text-[11px] font-medium text-white/95"
          style={{ textShadow: '0 1px 3px oklch(0 0 0 / 0.55)' }}
        >
          {app.name}
        </span>
      )}
    </motion.button>
  )
}
