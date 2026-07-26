/**
 * Your work. Content, not markup — Projects.app renders whatever is here.
 *
 * Placeholder entries below show the shape. Replace them; the Finder-style
 * browser groups by `category` and shows the first project by default.
 */

export type ProjectCategory = 'Featured' | 'Work' | 'Side projects'

export interface ProjectLink {
  label: string
  href: string
}

export interface Project {
  /** Stable id — used as the selection key and the "filename" in the browser. */
  id: string
  name: string
  category: ProjectCategory
  /** One line under the name in the detail pane. */
  tagline: string
  year: string
  /** A paragraph or two. Written as prose, not bullet points. */
  description: string
  /** The two or three things you would actually mention out loud. */
  highlights: string[]
  stack: string[]
  links?: ProjectLink[]
}

/** The sidebar's source list, in the order it should appear. */
export const categories: ProjectCategory[] = ['Featured', 'Work', 'Side projects']

export const projects: Project[] = [
  {
    id: 'portfolio-os',
    name: 'Portfolio OS',
    category: 'Featured',
    tagline: 'A desktop operating system that runs in a browser tab.',
    year: '2026',
    description:
      'TODO: this very site. Describe the trick and why it was worth doing — a window manager, spring-physics dock magnification, and every portfolio section shipped as an "app".',
    highlights: [
      'Custom window manager: drag, resize, focus stacking, maximize and restore',
      'Cursor-distance dock magnification driven by MotionValues — zero React renders per frame',
      'Every app body is layout-agnostic, so mobile reuses them as full-screen sheets',
    ],
    stack: ['React', 'TypeScript', 'Motion', 'Zustand', 'Tailwind CSS'],
    links: [{ label: 'Source', href: 'https://github.com/todo/portfolio-os' }],
  },
  {
    id: 'project-two',
    name: 'TODO Project Two',
    category: 'Featured',
    tagline: 'TODO: the one-line pitch.',
    year: '2025',
    description: 'TODO: what it does, who it was for, and the interesting constraint.',
    highlights: ['TODO: the hard part', 'TODO: the result'],
    stack: ['TypeScript', 'Next.js'],
    links: [{ label: 'Live', href: 'https://example.com' }],
  },
  {
    id: 'work-project',
    name: 'TODO Work Project',
    category: 'Work',
    tagline: 'TODO: shipped at TODO Company.',
    year: '2024',
    description: 'TODO: scope, your role, and what changed once it shipped.',
    highlights: ['TODO: measurable outcome'],
    stack: ['React', 'Node.js', 'Postgres'],
  },
  {
    id: 'side-project',
    name: 'TODO Side Project',
    category: 'Side projects',
    tagline: 'TODO: the one you built for yourself.',
    year: '2023',
    description: 'TODO: the itch it scratched. Short is fine — side projects earn brevity.',
    highlights: ['TODO: the bit you are proud of'],
    stack: ['Python'],
    links: [{ label: 'Source', href: 'https://github.com/todo/side-project' }],
  },
]
