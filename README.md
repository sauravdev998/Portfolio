# Portfolio OS

A macOS-style desktop portfolio in the browser — dock, draggable windows, menu bar,
spring animations. Each portfolio section is an "app."

See [CLAUDE.md](./CLAUDE.md) for the architecture — the two contracts everything
hangs off, and the constraints that aren't up for renegotiation.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · Motion · Zustand

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # typecheck + production build
pnpm lint
```

## Three shells, one set of content

The same portfolio renders three ways, chosen in `src/App.tsx`:

| Shell | When | What it is |
| --- | --- | --- |
| **Desktop** | ≥ 1024px | The full OS — menu bar, wallpaper, dock, draggable/resizable windows. |
| **Springboard** | < 1024px | An iOS-style icon grid; apps open as full-screen sheets. Dragging windows on a phone is misery. |
| **Plain** | Toggled, or `?plain` in the URL | The whole portfolio as one scrollable document — the accessibility and SEO fallback. |

The apps themselves (About, Projects, Resume, Contact, Terminal, Snake, Trash) are
layout-agnostic: the same body renders inside a resizable window and inside a
full-screen sheet. Plain mode is the exception a canvas game can't follow — Snake
leaves a card there pointing back at the OS rather than a game nobody can reach by
scrolling.

## Using it

- **Dock** — click an icon to launch; a dot underneath marks a running app. Apps
  are single-instance, so clicking a running one focuses it instead.
- **Windows** — drag by the title bar, resize from any edge or corner, and use the
  traffic lights to close / minimize / zoom. Geometry survives a reload.
- **Menu bar clock** — click the date and time for a calendar.
- **Trash** — the projects that didn't make it, kept on purpose.
- **Snake** — yes, really. See below.

### Snake

A 20×20 canvas game in the dock. Arrow keys or WASD turn, `Space` starts and
pauses, `P` pauses, and the board is a square that fills whatever space you give
the window. Classic walls — no wrap. On a touchscreen, swipe the board to turn,
tap to start or pause, or use the d-pad underneath.

`Esc` is the one key that does something different here. The rest of the OS closes
the focused window on `Esc`, and a game that ends your run in one keystroke is a
game you learn to fear — so the first press pauses and the second closes, which is
what `Esc` does everywhere else, one keystroke later.

Your best score is kept in `localStorage` and survives a reload. Nothing else about
a game is remembered: reopening Snake gives you a fresh board.

### Keyboard

The whole thing is reachable without a mouse.

| Key | Does |
| --- | --- |
| `Tab` | Walks the dock, the menu bar, and the focused window (windows are focus traps). |
| `Esc` | Closes the focused window. Inside a text field, the first press just leaves the field; mid-game in Snake, it pauses first. |
| `↑ ↓ ← →` | Moves the focused window by 24px, when the frame itself has focus. An app that wants the arrows — Snake — takes them instead. |
| `Shift` + arrows | The same, but 4px at a time. |

### Terminal

`Terminal.app` runs a small shell over the same content files the other apps read:

```
help  whoami  ls  cat <file>  open <app>  pwd  date  echo  neofetch  clear  exit
```

There's also a `sudo hire-me`. `↑`/`↓` walk the command history.

## Preferences it respects

- **`prefers-reduced-motion`** — no dock magnification, no bounce, quick fades
  instead of springs, and the boot sequence is skipped entirely.
- **Sound** is off by default. The menu bar toggles it; the effects are synthesized
  with WebAudio, so there are no audio assets to download.
- **Locale** — the menu bar clock and its calendar follow your region: 12h or 24h,
  and a week that starts on whichever day yours starts on.

## Editing the content

Portfolio copy lives in `src/content/*.ts` — `profile.ts`, `projects.ts`,
`trash.ts` — deliberately separate from the components that render it. Adding an
app means an entry in `src/apps/registry.ts` plus a body under `src/apps/<Name>/`;
the dock, menu bar, springboard, and window manager all read that one list.
