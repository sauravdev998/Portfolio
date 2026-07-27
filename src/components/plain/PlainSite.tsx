import { Download, MonitorDot } from 'lucide-react'
import type { ReactNode } from 'react'
import { education, experience, profile, skills } from '@/content/profile'
import { categories, projects } from '@/content/projects'
import { useMode } from '@/store/useMode'

/**
 * The plain website — every app's content as one scrollable document.
 *
 * This is the fallback for keyboard users who'd rather not fight a window
 * manager, for small screens and old machines, and for anyone who just wants
 * the resume (§8). It reads from the same `content/*.ts` files as the apps but
 * renders them as ordinary semantic sections: real headings, real lists, no
 * springs, nothing positioned. If the OS is the trick, this is the receipts.
 */
export function PlainSite() {
  const setMode = useMode((state) => state.setMode)

  return (
    // Its own scroll container: the app root keeps `overflow: hidden` for the
    // desktop, so the document scrolls here rather than on `body`.
    <div className="fixed inset-0 select-text overflow-y-auto bg-dusk-900">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <nav className="mb-12 flex items-center justify-between gap-4 text-[13px]">
          <span className="text-white/40">Plain website mode</span>
          <button
            type="button"
            onClick={() => setMode('os')}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-white/80 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
          >
            <MonitorDot className="size-3.5" strokeWidth={2} aria-hidden />
            Boot the OS
          </button>
        </nav>

        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{profile.name}</h1>
          <p className="mt-1 text-[15px] text-white/60">
            {profile.role} · {profile.location}
          </p>
          <p className="mt-4 text-lg text-white/85">{profile.tagline}</p>

          <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-white/70">
            {profile.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px]">
            <li>
              <a href={`mailto:${profile.email}`} className={LINK}>
                {profile.email}
              </a>
            </li>
            {profile.socials.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noreferrer" className={LINK}>
                  {social.handle}
                </a>
              </li>
            ))}
            <li>
              <a href={profile.resumeUrl} download className={`${LINK} inline-flex items-center gap-1`}>
                <Download className="size-3.5" strokeWidth={2} aria-hidden />
                Resume (PDF)
              </a>
            </li>
          </ul>
        </header>

        <Section title="Projects">
          <div className="space-y-9">
            {categories.map((category) =>
              projects
                .filter((project) => project.category === category)
                .map((project) => (
                  <article key={project.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="text-[17px] font-semibold text-white">{project.name}</h3>
                      <span className="text-[13px] tabular-nums text-white/40">
                        {project.year} · {project.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[14px] text-white/55">{project.tagline}</p>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-white/75">
                      {project.description}
                    </p>
                    <ul className="mt-2.5 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-white/70 marker:text-white/30">
                      {project.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                    <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                      <span className="text-white/45">{project.stack.join(' · ')}</span>
                      {project.links?.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={LINK}
                        >
                          {link.label} ↗
                        </a>
                      ))}
                    </p>
                  </article>
                )),
            )}
          </div>
        </Section>

        <Section title="Experience">
          <div className="space-y-7">
            {experience.map((role) => (
              <article key={`${role.company}-${role.period}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-[16px] font-semibold text-white">
                    {role.title} · {role.company}
                  </h3>
                  <span className="text-[13px] tabular-nums text-white/40">{role.period}</span>
                </div>
                {role.location && <p className="text-[13px] text-white/45">{role.location}</p>}
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-relaxed text-white/70 marker:text-white/30">
                  {role.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Education">
          <div className="space-y-5">
            {education.map((entry) => (
              <article key={entry.institution}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-[16px] font-semibold text-white">{entry.institution}</h3>
                  <span className="text-[13px] tabular-nums text-white/40">{entry.period}</span>
                </div>
                <p className="text-[14px] text-white/70">{entry.qualification}</p>
                {entry.detail && <p className="text-[13px] text-white/45">{entry.detail}</p>}
              </article>
            ))}
          </div>
        </Section>

        <Section title="Skills">
          <dl className="space-y-2">
            {skills.map((group) => (
              <div key={group.label} className="flex flex-wrap gap-x-3 text-[14px]">
                <dt className="font-semibold text-white/85">{group.label}</dt>
                <dd className="text-white/60">{group.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Snake is the one app with nothing to say in a document. Rendering
            the live canvas here would put a game nobody can reach by scrolling
            in the middle of a resume, so this is a pointer, not the app. */}
        <Section title="Also in the OS">
          <p className="text-[15px] leading-relaxed text-white/75">
            Snake — a small canvas game that ships in the dock. It wants a keyboard or a
            touchscreen, so it lives in the desktop and phone shells rather than here.{' '}
            <button type="button" onClick={() => setMode('os')} className={LINK}>
              Boot the OS
            </button>{' '}
            to play it.
          </p>
        </Section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-[13px] text-white/40">
          <p>
            Prefer the full experience?{' '}
            <button type="button" onClick={() => setMode('os')} className={LINK}>
              Boot the OS
            </button>
            {' '}— windows, dock and all.
          </p>
        </footer>
      </div>
    </div>
  )
}

const LINK =
  'text-white/75 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white hover:decoration-white/60'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-white/10 pt-8">
      <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </h2>
      {children}
    </section>
  )
}
