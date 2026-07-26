import { useMemo, useState } from 'react'
import { ArrowUpRight, ChevronRight, FileCode2 } from 'lucide-react'
import { categories, projects, type Project } from '@/content/projects'

/**
 * Projects.app — a Finder-style browser for your work.
 *
 * Master/detail rather than one window per project: the store keys windows by
 * app id, so spawning a window per file would mean changing the window-manager
 * contract. Finder's column view already puts the preview in the last column,
 * so this reads as Finder anyway.
 *
 * The layout is driven by container queries, not the viewport — the app has no
 * idea how wide its window is, and a window dragged down to 380px gets the
 * stacked layout that a phone will also get in Phase 6.
 */
export default function Projects() {
  const [selectedId, setSelectedId] = useState(projects[0]?.id)

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [selectedId],
  )

  // Empty categories shouldn't leave a heading stranded over nothing.
  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: projects.filter((project) => project.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [],
  )

  return (
    <div className="@container h-full">
      <div className="flex h-full flex-col @[560px]:flex-row">
        <nav
          aria-label="Projects"
          className="max-h-[38%] shrink-0 overflow-auto border-b border-white/10 bg-black/20 p-2 @[560px]:max-h-none @[560px]:w-56 @[560px]:border-b-0 @[560px]:border-r"
        >
          {groups.map((group) => (
            <div key={group.category} className="mb-3 last:mb-0">
              <h3 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {group.category}
              </h3>
              <ul>
                {group.items.map((project) => (
                  <li key={project.id}>
                    <FileRow
                      project={project}
                      isSelected={project.id === selected?.id}
                      onSelect={() => setSelectedId(project.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {selected && <Detail project={selected} />}
      </div>
    </div>
  )
}

function FileRow({
  project,
  isSelected,
  onSelect,
}: {
  project: Project
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
        isSelected
          ? 'bg-[oklch(0.55_0.17_258)] text-white'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      <FileCode2
        className={`size-4 shrink-0 ${isSelected ? 'text-white' : 'text-white/45'}`}
        strokeWidth={1.7}
        aria-hidden
      />
      <span className="truncate">{project.name}</span>
    </button>
  )
}

function Detail({ project }: { project: Project }) {
  return (
    // `key` remounts on selection change, which resets the scroll position —
    // otherwise you land halfway down the next project.
    <article key={project.id} className="flex min-w-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-7 py-6">
        <header>
          <h2 className="text-xl font-semibold tracking-tight text-white">{project.name}</h2>
          <p className="mt-1 text-sm text-white/60">{project.tagline}</p>
        </header>

        <p className="mt-5 text-sm leading-relaxed text-white/75">{project.description}</p>

        {project.highlights.length > 0 && (
          <ul className="mt-5 space-y-2">
            {project.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2.5 text-sm leading-relaxed text-white/75">
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-white/35"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-1.5">
          {project.stack.map((tool) => (
            <span
              key={tool}
              className="rounded-md border border-white/12 bg-white/6 px-2 py-0.5 text-[12px] text-white/70"
            >
              {tool}
            </span>
          ))}
        </div>

        {project.links && project.links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] text-white/85 transition-colors hover:border-white/25 hover:bg-white/12 hover:text-white"
              >
                {link.label}
                <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Finder's path bar — cheap detail, does a lot of work for the metaphor. */}
      <footer className="flex shrink-0 items-center gap-1 border-t border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/45">
        <span>Projects</span>
        <ChevronRight className="size-3" aria-hidden />
        <span>{project.category}</span>
        <ChevronRight className="size-3" aria-hidden />
        <span className="truncate text-white/70">{project.name}</span>
        <span className="ml-auto shrink-0 tabular-nums">{project.year}</span>
      </footer>
    </article>
  )
}
