# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Portfolio OS" — a macOS-style desktop portfolio in the browser. Each portfolio section (About, Projects, Resume, Contact, Terminal, Trash) is an "app" opened in a draggable window. `PLAN.md` is the original spec and phased build plan (all phases done); its §6 animation spec and §10 working notes are still the guiding constraints.

Stack: Vite · React 19 · TypeScript · Tailwind v4 · Motion (`motion/react`) · Zustand. Package manager is **pnpm**. No test framework is set up.

## Commands

```bash
pnpm dev      # dev server at http://localhost:5173
pnpm build    # tsc -b (typecheck) + vite build — use this to typecheck
pnpm lint     # oxlint (config in .oxlintrc.json)
pnpm preview  # serve the production build
```

`@/` is aliased to `src/` (vite.config.ts + tsconfig).

## Architecture

Three parallel shells over the same content, chosen in `src/App.tsx`:

- **Desktop (≥ lg):** `Desktop` + `WindowLayer` + `MenuBar` + `Dock` — the full OS.
- **Mobile (< lg, via `useIsMobile`):** `components/mobile/Springboard` — iOS-style icon grid; apps open as full-screen sheets (`AppSheet`). It does not read the desktop store.
- **Plain mode:** `components/plain/PlainSite` — the whole portfolio as one scrollable document. Toggled via `store/useMode` (persisted) or forced with `?plain` in the URL. This is the a11y/SEO fallback; keep it working when content changes.

Two contracts everything hangs off:

- **`src/apps/registry.ts`** — the single list of apps (`AppDefinition`: id, name, icon, tile gradient, defaultSize, lazy component). Dock, menu bar, springboard, and window manager all read this; to add an app, add an entry here plus a body under `src/apps/<Name>/`. Every body is behind `React.lazy` so the initial bundle is just the shell. `AppBody.tsx` maps id → lazy body + Suspense and is shared by `Window` and `AppSheet` — app bodies must stay layout-agnostic (they render in both a resizable window and a full-screen sheet).
- **`src/store/useDesktop.ts`** — the window manager, single source of truth for all window geometry, stacking, and focus. Treat its shape as a contract (PLAN.md §3); window-state drift is the main bug source in this app. Components may hold *transient* gesture state in MotionValues, but commit results back to the store when the gesture ends. It persists to localStorage (`portfolio-desktop`) with `partialize` dropping `launchOrigin`; `workArea` is remeasured on mount and the first `setWorkArea` clamps restored windows back on-screen. Apps are single-instance: `openApp` on a running app focuses it.

Other structure:

- **`src/content/*.ts`** — portfolio data (profile, projects, trash), deliberately separate from components. The user writes this content themselves so the voice stays theirs — build machinery, don't rewrite their copy.
- **`src/lib/springs.ts`** — the three named spring presets (`dock`, `window`, `focus`). All animation must use these; don't invent per-component spring values.
- **`src/lib/sounds.ts`** — WebAudio-synthesized sounds (no audio assets), gated by `store/useSound.ts` (muted by default, persisted).
- **`components/menubar/Clock.tsx`** — the one menu-bar item with a real menu behind it: it toggles the `Calendar` month-grid popover. Menu semantics, not dialog — dismiss on outside `pointerdown` (not `click`, so a press on a title bar starts a drag instead of fighting the popover) or `Esc`; focus stays on the button rather than being trapped in the panel. Everything else in the right-hand cluster is décor. The calendar itself is read-only and locale-driven (week start, month/weekday/date strings all from `Intl`) — days are text, not buttons, because there are no events to open.
- **Terminal.app** parses commands over `content/*.ts` (`help`, `whoami`, `ls`, `cat`, `open <app>`, `neofetch`, `sudo hire-me`).

## Constraints (from PLAN.md, deliberate decisions)

- Animate `transform`/`opacity` only on the hot path — never `width/height/top/left`.
- Gate all motion on `prefers-reduced-motion`: no magnification, no bounce, quick fades instead of springs; the boot screen is skipped entirely.
- Limit `backdrop-blur` surfaces (menu bar + dock + active window only) — it's expensive. Panels that hang off one of them (the clock's calendar) are opaque instead.
- Dock icons, traffic lights, etc. are real `<button>`s with `aria-label`s; windows are focus traps (`useFocusTrap`); `Esc` closes the focused window; full keyboard path exists. `Esc` handlers outside a window stay scoped to their own subtree so they don't also close whatever is focused.
- True genie minimize and a login screen were considered and rejected on purpose (see PLAN.md Phase 8) — don't add them.
