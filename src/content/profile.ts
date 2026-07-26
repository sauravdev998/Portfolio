/**
 * Who you are. Content, not markup — edit freely without touching a component.
 *
 * Everything here is placeholder scaffolding in your rough shape. Replace the
 * copy with your own; the apps read whatever is in this file.
 */

export interface Spec {
  /** Left column of the About window's spec table. */
  label: string
  value: string
}

export interface Social {
  label: string
  /** Shown instead of the raw URL — `github.com/you` reads better than `https://…`. */
  handle: string
  href: string
}

export interface Role {
  company: string
  title: string
  /** Free text so "2023 — Present" and "Summer 2022" both work. */
  period: string
  location?: string
  points: string[]
}

export interface Education {
  institution: string
  qualification: string
  period: string
  detail?: string
}

export interface SkillGroup {
  label: string
  items: string[]
}

export const profile = {
  name: 'Saurav Kumar Mohanta',
  role: 'Software Engineer',
  location: 'India',
  /** One line, on the About window under your name. Keep it short and confident. */
  tagline: 'I build interfaces that feel like objects.',

  /** Rendered as the avatar when there's no photo. Two letters looks best. */
  monogram: 'SM',

  email: 'sauravmohanta998@gmail.com',

  /**
   * The About window's headline copy. One paragraph per entry — two or three
   * total is plenty; this is a bio, not a cover letter.
   */
  bio: [
    'TODO: a couple of sentences on what you build and what you care about. Lead with the thing you want to be hired for.',
    'TODO: a second paragraph — background, current focus, or what you are looking for next.',
  ],

  /**
   * Skills as hardware specs — the joke that makes the About window worth
   * opening. Keep the labels machine-ish and the values honest.
   */
  specs: [
    { label: 'Processor', value: 'TypeScript · React · Node' },
    { label: 'Memory', value: 'Zustand, TanStack Query, a long changelog' },
    { label: 'Graphics', value: 'Tailwind CSS · Motion · SVG' },
    { label: 'Storage', value: 'Postgres · Prisma · Redis' },
    { label: 'Startup Disk', value: 'Arch Linux' },
    { label: 'Serial Number', value: 'TODO-0001' },
  ] satisfies Spec[],

  socials: [
    { label: 'GitHub', handle: 'github.com/todo', href: 'https://github.com/todo' },
    { label: 'LinkedIn', handle: 'linkedin.com/in/todo', href: 'https://linkedin.com/in/todo' },
    { label: 'X', handle: '@todo', href: 'https://x.com/todo' },
  ] satisfies Social[],

  /** Put the real file in `public/` and point at it; used by Resume.app. */
  resumeUrl: '/resume.pdf',
}

export const experience: Role[] = [
  {
    company: 'TODO Company',
    title: 'Software Engineer',
    period: '2024 — Present',
    location: 'Remote',
    points: [
      'TODO: what you owned, in one line. Lead with the outcome, not the ticket.',
      'TODO: a number if you have one — latency, users, build time, cost.',
    ],
  },
  {
    company: 'TODO Earlier Company',
    title: 'Frontend Developer',
    period: '2022 — 2024',
    points: ['TODO: the thing you shipped that you would still defend today.'],
  },
]

export const education: Education[] = [
  {
    institution: 'TODO University',
    qualification: 'B.Tech, Computer Science',
    period: '2018 — 2022',
    detail: 'TODO: honours, thesis, or drop this line.',
  },
]

export const skills: SkillGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
  { label: 'Frontend', items: ['React', 'Next.js', 'Tailwind CSS', 'Motion'] },
  { label: 'Backend', items: ['Node.js', 'Postgres', 'Prisma', 'REST'] },
  { label: 'Tooling', items: ['Vite', 'Git', 'Docker', 'Vercel'] },
]
