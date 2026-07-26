import type { ReactNode } from 'react'
import { Wallpaper } from '@/components/desktop/Wallpaper'

/**
 * Desktop — the surface everything else sits on.
 *
 * Owns the wallpaper and reserves the space below the menu bar as the working
 * area. Windows (Phase 2) and desktop icons (Phase 4) render into `children`
 * so this stays the one place that knows the desktop's geometry.
 */
export function Desktop({ children }: { children?: ReactNode }) {
  return (
    <main className="absolute inset-0 overflow-hidden">
      <Wallpaper />

      {/* The working area: full viewport minus the menu bar strip. Windows are
          positioned relative to this box, so their drag bounds come for free. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: 'var(--menubar-height)', zIndex: 'var(--z-index-windows)' }}
      >
        {children}
      </div>
    </main>
  )
}
