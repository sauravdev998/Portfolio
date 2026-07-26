import { Suspense, useEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { getApp } from '@/apps/registry'
import { Window } from '@/components/window/Window'
import { useDesktop, type WindowState } from '@/store/useDesktop'

/**
 * Renders every open window and owns the measurement of the work area.
 *
 * This element *is* the coordinate space windows live in: it fills the desktop
 * below the menu bar, so a window's stored position is simply its offset inside
 * this box, and drag bounds fall out of its size.
 */
export function WindowLayer() {
  const layerRef = useRef<HTMLDivElement>(null)
  const windows = useDesktop((state) => state.windows)
  const setWorkArea = useDesktop((state) => state.setWorkArea)

  useEffect(() => {
    const element = layerRef.current
    if (!element) return

    // ResizeObserver rather than a window resize listener: this box also moves
    // when the menu bar's height changes, which `resize` would never report.
    const observer = new ResizeObserver(() => {
      // Read the box off the element rather than the entry: `contentRect` gives
      // a size but no viewport position, and the open animation needs both to
      // map a dock icon's screen coordinates into this layer's space.
      const { width, height, left, top } = element.getBoundingClientRect()
      setWorkArea({ width, height }, { x: left, y: top })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [setWorkArea])

  return (
    <div ref={layerRef} className="absolute inset-0">
      {/* AnimatePresence covers closing only. Minimized windows are deliberately
          still in this list: `Window` shrinks them onto their dock icon and hides
          them there, keeping the app body — and its state — alive. */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} win={win}>
            <AppBody win={win} />
          </Window>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Resolves a window to its app's body.
 *
 * The Suspense boundary is per-window on purpose: a window loading its chunk
 * must never blank out the windows already on screen.
 */
function AppBody({ win }: { win: WindowState }) {
  const App = getApp(win.appId)?.component
  if (!App) return <NotInstalled title={win.title} />

  return (
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  )
}

/**
 * Deliberately not a spinner. App chunks are small enough that they usually
 * arrive within a frame or two, and a spinner that flashes for 30ms reads as a
 * glitch — an empty pane simply looks like the window is still opening.
 */
function Loading() {
  return <div className="h-full" aria-busy />
}

/** An app that's in the dock but not built yet — see the registry. */
function NotInstalled({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
      <p className="text-sm text-white/70">{title} isn’t installed yet.</p>
      <p className="text-[13px] text-white/40">Coming in a later update.</p>
    </div>
  )
}
