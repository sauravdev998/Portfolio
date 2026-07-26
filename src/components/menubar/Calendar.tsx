import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * The month grid that drops out of the menu bar clock — the Notification Centre
 * calendar, minus the notifications.
 *
 * Read-only by design: days are text, not buttons. There are no events to open
 * and a portfolio that pretends otherwise is just a dead control. The only real
 * affordances are the three navigation buttons, so keyboard users tab through
 * three things instead of forty-two.
 *
 * Everything is derived in the user's own locale, like `Clock` above it: the
 * week starts on whichever day their region starts on, and the month, weekday
 * and date strings all come from `Intl`.
 */

/** Always six rows, so the panel never changes height as you page months. */
const CELLS = 42

const TITLE = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const WEEKDAY_NARROW = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' })
const WEEKDAY_LONG = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const FULL_DATE = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * The locale's first day of the week, as a JS `getDay()` index (0 = Sunday).
 * `Intl.Locale`'s week info is 1 = Monday … 7 = Sunday, and is still missing in
 * Firefox — Sunday is the fallback, matching the default macOS calendar.
 */
function firstWeekday(): number {
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    return ((locale.getWeekInfo?.() ?? locale.weekInfo)?.firstDay ?? 7) % 7
  } catch {
    return 0
  }
}

/** Day-granularity equality — the grid only ever compares calendar days. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

export function Calendar({ today }: { today: Date }) {
  const weekStart = useMemo(firstWeekday, [])

  // The month on screen, which drifts away from `today` as you page around.
  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }))

  const weeks = useMemo(() => {
    // Date's overflow arithmetic does the work: day 0 is the previous month's
    // last day, day 32 rolls into the next — no month-length table needed.
    const leading = (new Date(view.year, view.month, 1).getDay() - weekStart + 7) % 7
    const days = Array.from(
      { length: CELLS },
      (_, index) => new Date(view.year, view.month, 1 - leading + index),
    )
    return Array.from({ length: CELLS / 7 }, (_, row) => days.slice(row * 7, row * 7 + 7))
  }, [view, weekStart])

  function step(delta: number) {
    setView((current) => {
      const moved = new Date(current.year, current.month + delta, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  return (
    <div className="w-60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 pl-1">
        <h2 className="text-[13px] font-semibold text-white">
          {TITLE.format(new Date(view.year, view.month, 1))}
        </h2>

        <div className="flex items-center gap-px text-white/70">
          <button
            type="button"
            className={NAV}
            aria-label="Previous month"
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.2} aria-hidden />
          </button>
          <button
            type="button"
            className={NAV}
            aria-label="Go to today"
            onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
          </button>
          <button type="button" className={NAV} aria-label="Next month" onClick={() => step(1)}>
            <ChevronRight className="size-3.5" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>

      <table className="w-full border-collapse text-center text-[12px] tabular-nums">
        <thead>
          <tr>
            {weeks[0].map((day) => (
              <th
                key={day.getDay()}
                scope="col"
                className="pb-1 text-[11px] font-medium text-white/45"
              >
                <span aria-hidden>{WEEKDAY_NARROW.format(day)}</span>
                {/* Narrow names are ambiguous out loud — S, S, T, T. */}
                <span className="sr-only">{WEEKDAY_LONG.format(day)}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].getTime()}>
              {week.map((day) => {
                const isToday = isSameDay(day, today)
                const inMonth = day.getMonth() === view.month

                return (
                  <td
                    key={day.getTime()}
                    className="p-0"
                    aria-current={isToday ? 'date' : undefined}
                  >
                    <span
                      className={`mx-auto flex size-7 items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-dusk-500 font-semibold text-white'
                          : inMonth
                            ? 'text-white/85'
                            : 'text-white/30'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 border-t border-white/10 pt-2 text-center text-[11px] text-white/50">
        {FULL_DATE.format(today)}
      </p>
    </div>
  )
}

/** Shared geometry for the three navigation buttons. */
const NAV =
  'flex size-5.5 items-center justify-center rounded-md transition-colors hover:bg-white/15 hover:text-white active:bg-white/25'
