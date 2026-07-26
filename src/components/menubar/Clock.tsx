import { useEffect, useState } from 'react'

/**
 * Formatted in the user's own locale — a 12h locale gets "Sat 26 Jul 12:34 pm",
 * a 24h one gets "Sat 26 Jul 12:34". Built once; formatters are expensive.
 */
const FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: number

    // Re-render on the minute boundary rather than every second: the display
    // only shows minutes, so a 1Hz interval would be 59 wasted renders and a
    // clock that flips up to a second late.
    const scheduleNextTick = () => {
      timer = window.setTimeout(() => {
        setNow(new Date())
        scheduleNextTick()
      }, 60_000 - (Date.now() % 60_000))
    }

    scheduleNextTick()
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {FORMAT.format(now)}
    </time>
  )
}
