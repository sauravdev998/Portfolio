import { useMinuteTick } from '@/hooks/useMinuteTick'

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
  const now = useMinuteTick()

  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {FORMAT.format(now)}
    </time>
  )
}
