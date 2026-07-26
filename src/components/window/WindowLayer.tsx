import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'motion/react'
import { AppBody } from '@/apps/AppBody'
import { Window } from '@/components/window/Window'
import { useDesktop } from '@/store/useDesktop'

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
            <AppBody appId={win.appId} title={win.title} />
          </Window>
        ))}
      </AnimatePresence>
    </div>
  )
}
