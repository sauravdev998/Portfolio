import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { education, experience, profile, skills } from '@/content/profile'

/**
 * Resume.app — Preview showing a document.
 *
 * The CV is rendered as HTML on a white "page" rather than embedded as a PDF:
 * an `<iframe>` PDF viewer is unstyleable, blocked in some browsers, and dead
 * weight on mobile. The real file stays one click away in the toolbar.
 *
 * The page is deliberately light-on-dark against the window chrome — a sheet of
 * paper sitting in a viewer is what makes this read as Preview and not as a
 * section of a website.
 */
export default function Resume() {
  return (
    <div className="flex h-full flex-col bg-black/25">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-1.5">
        <span className="truncate text-[12px] text-white/55">
          {profile.name.replace(/\s+/g, '-')}-CV.pdf
        </span>
        <a
          href={profile.resumeUrl}
          download={`${profile.name.replace(/\s+/g, '_')}_Resume.pdf`}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/8 px-2.5 py-1 text-[12px] text-white/85 transition-colors hover:border-white/25 hover:bg-white/15 hover:text-white"
        >
          <Download className="size-3.5" strokeWidth={2} aria-hidden />
          Download
        </a>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <article className="mx-auto max-w-[46rem] rounded-sm bg-[oklch(0.98_0.004_90)] px-9 py-8 text-[oklch(0.28_0.01_270)] shadow-[0_18px_50px_-20px_oklch(0_0_0_/_0.7)]">
          <header className="border-b border-black/10 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.2_0.01_270)]">
              {profile.name}
            </h1>
            <p className="mt-0.5 text-sm text-[oklch(0.45_0.01_270)]">{profile.role}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[oklch(0.5_0.01_270)]">
              <span>{profile.location}</span>
              <a href={`mailto:${profile.email}`} className="underline underline-offset-2">
                {profile.email}
              </a>
              {profile.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {social.handle}
                </a>
              ))}
            </p>
          </header>

          <Section title="Summary">
            <p className="text-[13px] leading-relaxed">{profile.summary}</p>
          </Section>

          <Section title="Experience">
            {experience.map((role) => (
              <div key={`${role.company}-${role.period}`} className="mb-5 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-[15px] font-semibold text-[oklch(0.22_0.01_270)]">
                    {role.title} · {role.company}
                  </h3>
                  <span className="text-[12px] tabular-nums text-[oklch(0.52_0.01_270)]">
                    {role.period}
                  </span>
                </div>
                {role.location && (
                  <p className="text-[12px] text-[oklch(0.52_0.01_270)]">{role.location}</p>
                )}
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-relaxed marker:text-[oklch(0.7_0.01_270)]">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>

          <Section title="Education">
            {education.map((entry) => (
              <div key={entry.institution} className="mb-4 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-[15px] font-semibold text-[oklch(0.22_0.01_270)]">
                    {entry.institution}
                  </h3>
                  <span className="text-[12px] tabular-nums text-[oklch(0.52_0.01_270)]">
                    {entry.period}
                  </span>
                </div>
                <p className="text-[13px]">{entry.qualification}</p>
                {entry.detail && (
                  <p className="text-[12px] text-[oklch(0.52_0.01_270)]">{entry.detail}</p>
                )}
              </div>
            ))}
          </Section>

          <Section title="Skills">
            <dl className="space-y-1.5">
              {skills.map((group) => (
                <div key={group.label} className="flex flex-wrap gap-x-2 text-[13px]">
                  <dt className="font-semibold text-[oklch(0.22_0.01_270)]">{group.label}</dt>
                  <dd className="text-[oklch(0.4_0.01_270)]">{group.items.join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </article>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.55_0.01_270)]">
        {title}
      </h2>
      {children}
    </section>
  )
}
