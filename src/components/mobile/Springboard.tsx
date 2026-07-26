import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { apps, type AppDefinition } from '@/apps/registry'
import { Wallpaper } from '@/components/desktop/Wallpaper'
import { AppSheet } from '@/components/mobile/AppSheet'
import { SpringboardIcon } from '@/components/mobile/SpringboardIcon'
import { StatusBar } from '@/components/mobile/StatusBar'
import type { Point } from '@/store/useDesktop'

/**
 * The mobile shell — an iOS-style home screen that replaces the desktop below
 * `lg` (see `useIsMobile`). Same wallpaper, same app registry, entirely
 * different chrome: a grid of tiles instead of a desktop, a fixed dock row of
 * the top apps instead of the magnifying dock, and one full-screen sheet at a
 * time instead of a window manager.
 *
 * Which is why the state is a single `useState` rather than the desktop store:
 * "one app open, or none" doesn't need geometry, z-order or minimize, and
 * pointing the window manager at a phone would drag all three in for nothing.
 */

interface ActiveApp {
  app: AppDefinition
  /** Where the launching tile sits, for the sheet's open/close animation. */
  origin: Point
}

/** The bottom row holds the core four; every app stays in the grid above. */
const DOCK_APPS = apps.slice(0, 4)

export function Springboard() {
  const [active, setActive] = useState<ActiveApp | null>(null)

  const launch = (app: AppDefinition, origin: Point) => setActive({ app, origin })

  return (
    <main className="fixed inset-0 overflow-hidden">
      <Wallpaper />

      <div
        className="absolute inset-x-0 z-10 grid grid-cols-4 content-start justify-items-center gap-x-2 gap-y-6 px-4"
        style={{ top: 'calc(var(--statusbar-height) + 0.75rem)' }}
      >
        {apps.map((app) => (
          <SpringboardIcon key={app.id} app={app} onLaunch={launch} />
        ))}
      </div>

      <nav
        aria-label="Dock"
        className="absolute inset-x-0 bottom-0 z-10 flex justify-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.625rem)' }}
      >
        {/* The springboard's one blurred surface — small, and worth it: the
            frosted slab is what makes this read as a dock and not a toolbar. */}
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/15 bg-white/10 px-4 pb-2.5 pt-3 backdrop-blur-2xl backdrop-saturate-150">
          {DOCK_APPS.map((app) => (
            <SpringboardIcon key={app.id} app={app} showLabel={false} onLaunch={launch} />
          ))}
        </div>
      </nav>

      {/* Keyed by app id so switching apps (close, tap another) can't cross the
          exit animation of one sheet with the entrance of the next. */}
      <AnimatePresence>
        {active && (
          <AppSheet
            key={active.app.id}
            app={active.app}
            origin={active.origin}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>

      <StatusBar />
    </main>
  )
}
