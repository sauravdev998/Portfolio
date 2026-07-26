import { Desktop } from '@/components/desktop/Desktop'
import { Dock } from '@/components/dock/Dock'
import { MenuBar } from '@/components/menubar/MenuBar'
import { WindowLayer } from '@/components/window/WindowLayer'

export default function App() {
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
