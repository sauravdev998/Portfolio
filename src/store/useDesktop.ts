import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getApp } from '@/apps/registry'

/**
 * The window manager — the single source of truth for the desktop.
 *
 * Every other component reads and writes here; nothing keeps its own copy of a
 * window's geometry or stacking order. Window components may hold *transient*
 * gesture state (a drag in flight lives in MotionValues, off the React tree),
 * but the moment a gesture ends the result is committed back to this store.
 */

export type WindowId = string

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Geometry {
  position: Point
  size: Size
}

export interface WindowState {
  id: WindowId
  appId: string
  title: string
  position: Point
  size: Size
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  /** Geometry captured before maximizing, so restore puts it back exactly. */
  prevGeometry?: Geometry
  /**
   * Viewport point the window was launched from — the centre of the dock icon
   * that opened it. The window scales out of this point, which is what ties it
   * to the icon that spawned it.
   *
   * Viewport rather than work-area coordinates because the launcher is the dock,
   * which is fixed to the viewport and knows nothing about the window layer.
   * Undefined when an app was opened some other way — the window then just
   * scales up from its own centre.
   *
   * Read once, at mount. Minimizing measures the dock icon again for itself,
   * because by then it has almost certainly moved.
   */
  launchOrigin?: Point
}

export interface DesktopStore {
  windows: WindowState[]
  focusedId: WindowId | null
  topZIndex: number
  /**
   * Size of the desktop's working area — the viewport minus the menu bar.
   * Not in the original store sketch, but placement, maximize and off-screen
   * clamping all need one agreed number, and measuring it in three different
   * components is how window state starts to drift. `WindowLayer` owns writing it.
   */
  workArea: Size
  /**
   * Where the working area sits in the viewport — its top-left corner. Only the
   * open/close animations need it, to rebase a launch origin (viewport) onto a
   * window's position (work-area relative). Written by `WindowLayer` alongside
   * `workArea`, from the same measurement.
   */
  workAreaOrigin: Point

  setWorkArea: (size: Size, origin: Point) => void
  openApp: (appId: string, launchOrigin?: Point) => void
  closeWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  toggleMaximize: (id: WindowId) => void
  moveWindow: (id: WindowId, position: Point) => void
  resizeWindow: (id: WindowId, size: Size) => void
}

/** Below this a window stops being a window and starts being a stamp. */
export const MIN_WINDOW_SIZE: Size = { width: 380, height: 260 }

/** Each new window steps down-right from the last, then wraps back to the start. */
const CASCADE_STEP = 28
const CASCADE_LENGTH = 6

/** Breathing room kept around a window that had to shrink to fit the work area. */
const EDGE_MARGIN = 32

let nextWindowId = 0

/**
 * The registry owns an app's identity; the store only owns its window. Ids that
 * aren't registered still open — a dev shortcut or a future deep link shouldn't
 * be able to throw — they just get generic chrome.
 */
function describeApp(appId: string): { title: string; size: Size } {
  const app = getApp(appId)
  if (app) return { title: app.name, size: app.defaultSize }

  const title = appId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return { title, size: { width: 760, height: 500 } }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Keeps a window's whole frame inside the work area — no dragging into the void. */
function clampPosition(position: Point, size: Size, workArea: Size): Point {
  return {
    x: clamp(position.x, 0, Math.max(0, workArea.width - size.width)),
    y: clamp(position.y, 0, Math.max(0, workArea.height - size.height)),
  }
}

/** The window that should take focus when the focused one goes away. */
function topmostVisible(windows: WindowState[]): WindowId | null {
  const visible = windows.filter((win) => !win.isMinimized)
  if (visible.length === 0) return null
  return visible.reduce((top, win) => (win.zIndex > top.zIndex ? win : top)).id
}

export const useDesktop = create<DesktopStore>()(
  persist(
    (set, get) => ({
  windows: [],
  focusedId: null,
  topZIndex: 0,
  workArea: { width: 0, height: 0 },
  workAreaOrigin: { x: 0, y: 0 },

  setWorkArea: (workArea, workAreaOrigin) =>
    set((state) => ({
      workArea,
      workAreaOrigin,
      windows: state.windows.map((win) =>
        win.isMaximized
          ? // A maximized window is *defined* as filling the work area, so it
            // has to follow the viewport rather than keep a stale size.
            { ...win, position: { x: 0, y: 0 }, size: { ...workArea } }
          : // Others keep their size but get pulled back on-screen; a window
            // stranded outside a shrunken viewport can never be reached again.
            { ...win, position: clampPosition(win.position, win.size, workArea) },
      ),
    })),

  openApp: (appId, launchOrigin) => {
    const existing = get().windows.find((win) => win.appId === appId)

    // Portfolio apps are single-instance: launching a running app raises it
    // (and un-minimizes it) rather than piling up duplicate windows.
    if (existing) {
      get().focusWindow(existing.id)
      return
    }

    const { windows, workArea, topZIndex } = get()
    const { title, size: defaultSize } = describeApp(appId)

    const size: Size = {
      width: clamp(defaultSize.width, MIN_WINDOW_SIZE.width, Math.max(MIN_WINDOW_SIZE.width, workArea.width - EDGE_MARGIN)),
      height: clamp(defaultSize.height, MIN_WINDOW_SIZE.height, Math.max(MIN_WINDOW_SIZE.height, workArea.height - EDGE_MARGIN)),
    }

    const step = (windows.length % CASCADE_LENGTH) * CASCADE_STEP
    const position = clampPosition(
      {
        x: Math.round((workArea.width - size.width) / 2) + step,
        // Slightly above centre: an optically centred window sits high.
        y: Math.round((workArea.height - size.height) / 3) + step,
      },
      size,
      workArea,
    )

    const zIndex = topZIndex + 1
    const id: WindowId = `${appId}-${nextWindowId++}`

    set({
      windows: [
        ...windows,
        {
          id,
          appId,
          title,
          position,
          size,
          zIndex,
          isMinimized: false,
          isMaximized: false,
          launchOrigin,
        },
      ],
      focusedId: id,
      topZIndex: zIndex,
    })
  },

  closeWindow: (id) =>
    set((state) => {
      const windows = state.windows.filter((win) => win.id !== id)
      return {
        windows,
        focusedId: state.focusedId === id ? topmostVisible(windows) : state.focusedId,
      }
    }),

  focusWindow: (id) =>
    set((state) => {
      const target = state.windows.find((win) => win.id === id)
      if (!target) return state

      // Already on top and focused: bail out rather than burn a z-index and
      // re-render every window on each click.
      if (state.focusedId === id && target.zIndex === state.topZIndex && !target.isMinimized) {
        return state
      }

      const zIndex = state.topZIndex + 1
      return {
        topZIndex: zIndex,
        focusedId: id,
        windows: state.windows.map((win) =>
          win.id === id ? { ...win, zIndex, isMinimized: false } : win,
        ),
      }
    }),

  minimizeWindow: (id) =>
    set((state) => {
      const windows = state.windows.map((win) =>
        win.id === id ? { ...win, isMinimized: true } : win,
      )
      return {
        windows,
        focusedId: state.focusedId === id ? topmostVisible(windows) : state.focusedId,
      }
    }),

  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((win) => {
        if (win.id !== id) return win

        if (win.isMaximized) {
          return {
            ...win,
            isMaximized: false,
            position: win.prevGeometry?.position ?? win.position,
            size: win.prevGeometry?.size ?? win.size,
            prevGeometry: undefined,
          }
        }

        return {
          ...win,
          isMaximized: true,
          prevGeometry: { position: win.position, size: win.size },
          position: { x: 0, y: 0 },
          size: { ...state.workArea },
        }
      }),
    })),

  moveWindow: (id, position) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id ? { ...win, position: clampPosition(position, win.size, state.workArea) } : win,
      ),
    })),

  resizeWindow: (id, size) =>
    set((state) => ({
      windows: state.windows.map((win) =>
        win.id === id
          ? {
              ...win,
              size: {
                width: Math.max(size.width, MIN_WINDOW_SIZE.width),
                height: Math.max(size.height, MIN_WINDOW_SIZE.height),
              },
            }
          : win,
      ),
    })),
    }),
    {
      /**
       * A refresh restores the desktop as it was left (§8). Only the durable
       * facts are written: geometry, stacking and focus. `workArea` is a
       * measurement, remeasured on every mount — and its default of 0×0 is
       * what protects restored windows, because the first real `setWorkArea`
       * clamps every position back on-screen, so a window left on a big
       * monitor can't be stranded outside a smaller one. `launchOrigin` is
       * dropped: it describes a dock icon from the previous session, and a
       * restored window should fade in where it is, not fly out of the dock.
       */
      name: 'portfolio-desktop',
      version: 1,
      partialize: (state) => ({
        windows: state.windows.map(({ launchOrigin: _launchOrigin, ...win }) => win),
        focusedId: state.focusedId,
        topZIndex: state.topZIndex,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Resume the id counter past every restored window, so a window opened
        // this session can never share a React key with one that is mid-exit.
        nextWindowId = state.windows.reduce((max, win) => {
          const suffix = Number(win.id.slice(win.id.lastIndexOf('-') + 1))
          return Number.isFinite(suffix) ? Math.max(max, suffix + 1) : max
        }, nextWindowId)
      },
    },
  ),
)
