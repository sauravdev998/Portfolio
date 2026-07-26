/**
 * The OS mark that anchors the left end of the menu bar.
 *
 * Deliberately an original glyph — a window with its title bar — rather than a
 * traced Apple logo. It reads as "operating system" at 14px, which is the only
 * size it will ever be drawn at.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="1.7" y="2.7" width="12.6" height="10.6" rx="2.6" />
      <path d="M1.7 6.1h12.6" />
      <circle cx="4.4" cy="4.4" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="6.4" cy="4.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
