import { useEffect, useState } from 'react'

/**
 * A Date that re-renders on the minute boundary rather than every second: the
 * displays built on it only show minutes, so a 1Hz interval would be 59 wasted
 * renders and a clock that flips up to a second late. Shared by the menu bar's
 * `Clock` and the mobile status bar, so the two never disagree about the time.
 */
export function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer: number

    const scheduleNextTick = () => {
      timer = window.setTimeout(() => {
        setNow(new Date())
        scheduleNextTick()
      }, 60_000 - (Date.now() % 60_000))
    }

    scheduleNextTick()
    return () => window.clearTimeout(timer)
  }, [])

  return now
}
