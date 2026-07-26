import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { FileText, Folder, Mail, Terminal, UserRound, type LucideIcon } from 'lucide-react'
import type { Size } from '@/store/useDesktop'

/**
 * The app registry — the single list of what this OS can run.
 *
 * It decouples *what an app is* (name, icon, preferred size, window body) from
 * *window mechanics* (drag, focus, stacking), so the dock, the menu bar and the
 * window manager read these definitions instead of each keeping their own list.
 *
 * Every body is behind `React.lazy`, so the initial bundle is just the shell —
 * an app's code arrives the first time somebody launches it.
 */
export interface AppDefinition {
  id: string
  name: string
  /** Glyph sitting on the dock tile. */
  icon: LucideIcon
  /**
   * The tile's CSS gradient. Dock icons read as *objects* rather than glyphs —
   * a bare line icon on glass looks like a toolbar, not a dock.
   */
  tile: string
  defaultSize: Size
  /**
   * The window body. Optional: an app can sit in the dock before it's built,
   * and `WindowLayer` renders a stand-in rather than an empty window.
   */
  component?: LazyExoticComponent<ComponentType>
}

export const apps: AppDefinition[] = [
  {
    id: 'about',
    name: 'About',
    icon: UserRound,
    tile: 'linear-gradient(160deg, oklch(0.68 0.17 285), oklch(0.44 0.16 292))',
    defaultSize: { width: 720, height: 480 },
    component: lazy(() => import('@/apps/About/About')),
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: Folder,
    tile: 'linear-gradient(160deg, oklch(0.76 0.13 235), oklch(0.5 0.16 252))',
    defaultSize: { width: 880, height: 560 },
    component: lazy(() => import('@/apps/Projects/Projects')),
  },
  {
    id: 'resume',
    name: 'Resume',
    icon: FileText,
    tile: 'linear-gradient(160deg, oklch(0.85 0.1 85), oklch(0.63 0.14 55))',
    defaultSize: { width: 680, height: 620 },
    component: lazy(() => import('@/apps/Resume/Resume')),
  },
  {
    id: 'contact',
    name: 'Contact',
    icon: Mail,
    tile: 'linear-gradient(160deg, oklch(0.8 0.12 205), oklch(0.55 0.15 232))',
    defaultSize: { width: 560, height: 520 },
    component: lazy(() => import('@/apps/Contact/Contact')),
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: Terminal,
    tile: 'linear-gradient(160deg, oklch(0.36 0.02 280), oklch(0.17 0.015 280))',
    defaultSize: { width: 700, height: 440 },
    // TODO(phase-8): the command parser. Until then it launches a stand-in.
  },
]

const byId = new Map(apps.map((app) => [app.id, app]))

export function getApp(id: string): AppDefinition | undefined {
  return byId.get(id)
}
