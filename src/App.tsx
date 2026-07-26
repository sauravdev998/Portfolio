import { Desktop } from '@/components/desktop/Desktop'
import { Dock } from '@/components/dock/Dock'
import { MenuBar } from '@/components/menubar/MenuBar'
import { Springboard } from '@/components/mobile/Springboard'
import { PlainSite } from '@/components/plain/PlainSite'
import { WindowLayer } from '@/components/window/WindowLayer'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useMode } from '@/store/useMode'

/**
 * One OS, two shells — and an off switch. Plain mode (§8) renders the whole
 * portfolio as a scrollable document regardless of viewport; otherwise, below
 * `lg` the desktop swaps wholesale for the springboard — same registry, same
 * app bodies, different chrome (§7).
 *
 * Crossing the breakpoint unmounts one shell and mounts the other. The desktop
 * store survives the trip (it's module-level), so windows left open on desktop
 * are still there when the viewport grows back; the springboard doesn't read
 * it, and doesn't need to.
 */
export default function App() {
  const mode = useMode((state) => state.mode)
  const isMobile = useIsMobile()

  if (mode === 'plain') return <PlainSite />
  if (isMobile) return <Springboard />

  return (
    <div className="relative h-full w-full">
      <Desktop>
        <WindowLayer />
      </Desktop>
      <MenuBar />
      <Dock />
    </div>
  )
}
