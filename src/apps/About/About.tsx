import { profile } from '@/content/profile'

/**
 * About.app — the "About This Mac" panel, but the machine is a person.
 *
 * The spec table is the whole joke: skills rendered as hardware, in the same
 * label/value layout Apple uses. It only lands if the typography is dead
 * straight, so the two columns are a real grid rather than flexed pairs.
 *
 * Like every app body this fills its container and does its own scrolling — it
 * knows nothing about windows, so Phase 6 can drop it into a full-screen sheet
 * unchanged.
 */
export default function About() {
  return (
    <div className="h-full overflow-auto px-8 py-9">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <Avatar />

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">{profile.name}</h1>
        <p className="mt-1 text-sm text-white/60">
          {profile.role} · {profile.location}
        </p>
        <p className="mt-3 text-[15px] text-white/80">{profile.tagline}</p>

        <div className="mt-6 space-y-3 text-left text-sm leading-relaxed text-white/70">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <dl className="mt-8 w-full border-t border-white/10 pt-5 text-left text-[13px]">
          {profile.specs.map((spec) => (
            <div
              key={spec.label}
              className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-4 py-1.5 last:pb-0"
            >
              <dt className="text-right font-medium text-white/50">{spec.label}</dt>
              <dd className="text-white/85">{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {profile.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] text-white/80 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * A monogram rather than a photo: it never 404s, never needs a loading state,
 * and matches the dock's gradient tiles. Swap in an `<img>` when you have one.
 */
function Avatar() {
  return (
    <div
      className="flex size-24 items-center justify-center rounded-3xl text-3xl font-semibold tracking-wide text-white shadow-[0_16px_40px_-16px_oklch(0_0_0_/_0.9)]"
      style={{ background: 'linear-gradient(160deg, oklch(0.68 0.17 285), oklch(0.44 0.16 292))' }}
      aria-hidden
    >
      {profile.monogram}
    </div>
  )
}
