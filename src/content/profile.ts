/**
 * Who you are. Content, not markup — edit freely without touching a component.
 *
 * Everything here is placeholder scaffolding in your rough shape. Replace the
 * copy with your own; the apps read whatever is in this file.
 */

export interface Spec {
  /** Left column of the About window's spec table. */
  label: string;
  value: string;
}

export interface Social {
  label: string;
  /** Shown instead of the raw URL — `github.com/you` reads better than `https://…`. */
  handle: string;
  href: string;
}

export interface Role {
  company: string;
  title: string;
  /** Free text so "2023 — Present" and "Summer 2022" both work. */
  period: string;
  location?: string;
  points: string[];
}

export interface Education {
  institution: string;
  qualification: string;
  period: string;
  detail?: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export const profile = {
  name: "Saurav Kumar Mohanta",
  role: "Software Engineer",
  location: "India",
  /** One line, on the About window under your name. Keep it short and confident. */
  tagline: "I build interfaces that feel like objects.",

  /** Rendered as the avatar when there's no photo. Two letters looks best. */
  monogram: "SM",

  email: "sauravmohanta998@gmail.com",

  /**
   * The About window's headline copy. One paragraph per entry — two or three
   * total is plenty; this is a bio, not a cover letter.
   */
  bio: [
    "I build backends that hold up when things get messy — the Java/Spring Boot kind that quietly move money, data, and requests around without falling over. I care about the unglamorous stuff: clean schemas, sane APIs, and error messages that don't make the next person cry. If it runs on the JVM and someone's counting on it not to break at 2am, that's my happy place.",
    "By day I work deep in enterprise banking systems — Oracle, WebLogic, and the kind of production puzzles that don't come with Stack Overflow answers. By night I'm building khanpan, a full-stack restaurant platform (Spring Boot + React), mostly to keep building things end-to-end and remember why I like this. Currently poking at Rust to see what all the fuss is about. Looking for backend roles where the problems are hard and the coffee is optional but appreciated.",
  ],

  /**
   * Skills as hardware specs — the joke that makes the About window worth
   * opening. Keep the labels machine-ish and the values honest.
   */
  specs: [
    { label: "Processor", value: "Spring Boot · TypeScript · React · Node" },
    { label: "Memory", value: "Zustand, TanStack Query, a long changelog" },
    { label: "Graphics", value: "Tailwind CSS · Motion · SVG" },
    { label: "Storage", value: "Postgres · Prisma · Redis" },
    { label: "Startup Disk", value: "Arch Linux" },
    { label: "Serial Number", value: "TODO-0001" },
  ] satisfies Spec[],

  socials: [
    {
      label: "GitHub",
      handle: "github.com/todo",
      href: "https://github.com/sauravdev998",
    },
    {
      label: "LinkedIn",
      handle: "linkedin.com/in/todo",
      href: "https://www.linkedin.com/in/saurav-kumar-mohanta998/",
    },
    // { label: "X", handle: "@todo", href: "https://x.com/todo" },
  ] satisfies Social[],

  /** Put the real file in `public/` and point at it; used by Resume.app. */
  resumeUrl: "/resume.pdf",
};

export const experience: Role[] = [
  {
    company: "TODO Company",
    title: "Software Engineer",
    period: "2024 — Present",
    location: "Remote",
    points: [
      "TODO: what you owned, in one line. Lead with the outcome, not the ticket.",
      "TODO: a number if you have one — latency, users, build time, cost.",
    ],
  },
  {
    company: "TODO Earlier Company",
    title: "Frontend Developer",
    period: "2022 — 2024",
    points: ["TODO: the thing you shipped that you would still defend today."],
  },
];

export const education: Education[] = [
  {
    institution: "TODO University",
    qualification: "B.Tech, Computer Science",
    period: "2018 — 2022",
    detail: "TODO: honours, thesis, or drop this line.",
  },
];

export const skills: SkillGroup[] = [
  { label: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
  { label: "Frontend", items: ["React", "Next.js", "Tailwind CSS", "Motion"] },
  { label: "Backend", items: ["Node.js", "Postgres", "Prisma", "REST"] },
  { label: "Tooling", items: ["Vite", "Git", "Docker", "Vercel"] },
];
