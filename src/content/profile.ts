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
  role: "Full-Stack Developer · Java | Spring Boot | React",
  location: "Bengaluru, India",
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

  /**
   * The opening paragraph of the CV — the one the Resume window leads with.
   * Deliberately drier than `bio`: this is the version a recruiter skims.
   */
  summary:
    "Full-stack developer with 2+ years of experience building and troubleshooting enterprise banking platforms and modern web applications. Strong across Java/Spring Boot backends, Oracle and PostgreSQL databases, and React/TypeScript frontends. Comfortable owning features end to end — from secure API and data-model design to production troubleshooting and platform extensibility.",

  /** The real file lives in `public/`; used by Resume.app and PlainSite. */
  resumeUrl: "/resume.pdf",
};

export const experience: Role[] = [
  {
    company: "JMR Infotech",
    title: "Associate Consultant",
    period: "Mar 2024 — Present",
    location: "Bengaluru, India · Enterprise Banking (Oracle OBDX)",
    points: [
      "Configure, customize, and troubleshoot Oracle Banking Digital Experience (OBDX) deployments across WebLogic and Oracle HTTP Server for enterprise banking clients.",
      "Diagnosed and resolved production incidents including OHS startup failures (missing configuration, orphaned worker processes) and proxy-induced malformed service URLs, restoring platform availability.",
      "Debugged and fixed Oracle SQL errors (ORA-00933, ORA-00904, ORA-01873) in customized adapter layers, improving the reliability of bespoke banking integrations.",
      "Authored a comprehensive OBDX Extensibility Guide documenting every major extension point with Java contracts and DB registration scripts, accelerating team onboarding and custom development.",
    ],
  },
];

export const education: Education[] = [
  {
    institution: "ITER, Bhubaneswar",
    qualification: "B.Tech, Mechanical Engineering",
    period: "2019 — 2023",
    detail: "CGPA: 7.71 / 10",
  },
  {
    institution: "Vijayanjali Science Rec. H.S. School, Kuruda",
    qualification: "Senior Secondary (12th), Science",
    period: "2019",
  },
  {
    institution: "Jawahar Vidyapitha, Chitrada",
    qualification: "Secondary (10th)",
    period: "2017",
  },
];

export const skills: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Java", "TypeScript", "JavaScript", "SQL", "Rust (learning)"],
  },
  {
    label: "Backend",
    items: ["Spring Boot", "REST APIs", "OAuth2", "JPA / Hibernate", "Maven"],
  },
  {
    label: "Frontend",
    items: ["React 19", "TypeScript", "Tailwind CSS", "Zustand", "Vite"],
  },
  { label: "Databases", items: ["Oracle DB", "PostgreSQL"] },
  {
    label: "Banking / Enterprise",
    items: ["Oracle OBDX", "WebLogic", "Oracle HTTP Server", "UBS integration"],
  },
  {
    label: "DevOps & Tools",
    items: ["Git", "GitHub Actions", "Docker / Docker Compose", "pnpm"],
  },
];
