import { Minus, Plus, X } from 'lucide-react'

/**
 * The three window buttons. Glyphs stay hidden until the cluster is hovered —
 * that reveal is most of what makes them read as macOS rather than as decoration.
 *
 * They are real buttons with labels: the traffic lights are the primary way to
 * control a window, so they have to work from the keyboard too.
 */

interface TrafficLightsProps {
  title: string
  isMaximized: boolean
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
}

const LIGHT =
  'grid size-3 place-items-center rounded-full border border-black/20 text-black/55 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.35)] transition-[filter] active:brightness-90'

/** Glyphs are sized to the dot and only appear on hover of the whole cluster. */
const GLYPH = 'size-2 opacity-0 transition-opacity group-hover/lights:opacity-100'

export function TrafficLights({
  title,
  isMaximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: TrafficLightsProps) {
  return (
    <div className="group/lights flex items-center gap-2">
      <button
        type="button"
        onClick={onClose}
        className={`${LIGHT} bg-[oklch(0.68_0.19_25)]`}
        aria-label={`Close ${title}`}
      >
        <X className={GLYPH} strokeWidth={3} aria-hidden />
      </button>

      <button
        type="button"
        onClick={onMinimize}
        className={`${LIGHT} bg-[oklch(0.82_0.16_85)]`}
        aria-label={`Minimize ${title}`}
      >
        <Minus className={GLYPH} strokeWidth={3} aria-hidden />
      </button>

      <button
        type="button"
        onClick={onToggleMaximize}
        className={`${LIGHT} bg-[oklch(0.75_0.19_145)]`}
        aria-label={`${isMaximized ? 'Restore' : 'Maximize'} ${title}`}
      >
        <Plus className={GLYPH} strokeWidth={3} aria-hidden />
      </button>
    </div>
  )
}
