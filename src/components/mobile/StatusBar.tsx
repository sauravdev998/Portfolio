import { BatteryMedium, Globe, SignalHigh, Wifi } from 'lucide-react'
import { useMinuteTick } from '@/hooks/useMinuteTick'
import { useMode } from '@/store/useMode'

/**
 * The mobile stand-in for the menu bar: time on the left, radios on the right,
 * iOS-style. It stays on top of open app sheets — like a real status bar — which
 * is most of what keeps the springboard reading as a phone rather than a page.
 *
 * Transparent on purpose: it sits over the wallpaper on the springboard and over
 * an app's own dark surface in a sheet, and a glass strip on top of either would
 * just be a smudge. The text shadow carries legibility instead.
 */

/** Time only — "9:41" — unlike the menu bar's full date. Built once. */
const FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function StatusBar() {
  const now = useMinuteTick()

  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-end justify-between px-7 pb-2.5 text-[15px] font-semibold text-white"
      style={{
        height: 'var(--statusbar-height)',
        textShadow: '0 1px 3px oklch(0 0 0 / 0.45)',
      }}
    >
      <time dateTime={now.toISOString()} className="tabular-nums">
        {FORMAT.format(now)}
      </time>

      <div className="flex items-center gap-1.5">
        {/* The one live control in the strip — the plain-website escape hatch.
            It opts back into pointer events; everything else here is décor. */}
        <button
          type="button"
          aria-label="Switch to plain website"
          onClick={() => useMode.getState().setMode('plain')}
          className="pointer-events-auto -m-2 p-2"
        >
          <Globe className="size-4" strokeWidth={2} aria-hidden />
        </button>
        <span aria-hidden className="flex items-center gap-1.5">
          <SignalHigh className="size-4" strokeWidth={2.2} />
          <Wifi className="size-4" strokeWidth={2.2} />
          <BatteryMedium className="size-5" strokeWidth={1.8} />
        </span>
      </div>
    </header>
  )
}
