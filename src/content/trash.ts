/**
 * The Trash — abandoned side projects, told with humour (the PostHog bit).
 * Content, not markup: Trash.app renders whatever is here.
 *
 * These ship as plausible defaults so the app is funny out of the box, but the
 * joke lands hardest when it's true — swap in your own dead projects. Keep the
 * epitaphs to one or two sentences; brevity is the whole gag.
 */

export interface TrashedItem {
  /** Stable id — the selection key in Trash.app's list. */
  id: string
  /** Shown as the filename, so `todo-app-v4/` reads better than "Todo App". */
  name: string
  /** Finder-style kind: 'Project folder', 'Plain text', 'Xcode graveyard'… */
  kind: string
  size: string
  /** Free text — 'March 2024' or 'a while ago' both work. */
  deleted: string
  /** The eulogy. Honest beats clever. */
  epitaph: string
}

export const trashedItems: TrashedItem[] = [
  {
    id: 'todo-app',
    name: 'todo-app-v4/',
    kind: 'Project folder',
    size: '84 MB',
    deleted: 'January 2024',
    epitaph:
      'The fourth rewrite, this time with the correct state manager. The list’s final item read "finish todo app". It remains unchecked.',
  },
  {
    id: 'crypto-tracker',
    name: 'crypto-portfolio-tracker/',
    kind: 'Project folder',
    size: '212 MB',
    deleted: 'June 2022',
    epitaph: 'Tracked the portfolio in real time, all the way down. Deleted for morale.',
  },
  {
    id: 'game-engine',
    name: 'game-engine/',
    kind: 'Project folder',
    size: '1.2 GB',
    deleted: 'September 2023',
    epitaph:
      'Three months on the renderer, two weeks on the physics, zero days on the game. A rite of passage, completed.',
  },
  {
    id: 'blog-draft',
    name: 'why-i-finish-my-side-projects.md',
    kind: 'Markdown document',
    size: '3 KB',
    deleted: 'April 2025',
    epitaph: 'Abandoned at the halfway mark, which makes the argument better than the essay ever did.',
  },
  {
    id: 'dotfiles',
    name: 'dotfiles-old-final-2/',
    kind: 'Project folder',
    size: '6 MB',
    deleted: 'Last week',
    epitaph:
      'Superseded by dotfiles-new, which was superseded by dotfiles-actual, which is three commits from being in here too.',
  },
]
