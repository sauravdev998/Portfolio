/**
 * Wallpaper — a fully CSS-generated "dusk" backdrop.
 *
 * Deliberately not an image: it costs zero bytes, scales to any viewport, and
 * sidesteps shipping someone else's copyrighted desktop picture. Layered radial
 * blooms over a linear base give it depth; a faint procedural grain kills the
 * banding that large flat gradients show on 8-bit displays.
 */

// feTurbulence grain, inlined so it never hits the network.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

export function Wallpaper() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 'var(--z-index-desktop)' }}
    >
      {/* Base gradient: deep indigo at the top falling to a warm horizon. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            170deg,
            var(--color-dusk-900) 0%,
            var(--color-dusk-800) 38%,
            var(--color-dusk-700) 62%,
            var(--color-dusk-600) 82%,
            var(--color-dusk-500) 100%
          )`,
        }}
      />

      {/* Soft light blooms — the thing that makes it read as "lit" rather than flat. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 45% at 78% 96%, oklch(0.74 0.11 45 / 0.55), transparent 70%),
            radial-gradient(48% 38% at 12% 88%, oklch(0.62 0.13 20 / 0.35), transparent 72%),
            radial-gradient(70% 50% at 50% 6%, oklch(0.42 0.13 300 / 0.45), transparent 68%)
          `,
        }}
      />

      {/* A single cool rim light across the upper third, for separation. */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 0%, oklch(0.72 0.1 250 / 0.35), transparent 60%)',
        }}
      />

      {/* Grain. Very low opacity — visible only as texture, never as noise. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundRepeat: 'repeat' }}
      />

      {/* Vignette, keeps focus toward the centre where windows live. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 85% at 50% 45%, transparent 55%, oklch(0.12 0.04 285 / 0.45) 100%)',
        }}
      />
    </div>
  )
}
