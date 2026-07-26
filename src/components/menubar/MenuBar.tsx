import { BatteryMedium, Globe, Search, SlidersHorizontal, Wifi } from "lucide-react";
import { getApp } from "@/apps/registry";
import { Clock } from "@/components/menubar/Clock";
import { Logo } from "@/components/menubar/Logo";
import { useDesktop } from "@/store/useDesktop";
import { useMode } from "@/store/useMode";

/**
 * MenuBar — the fixed frosted strip at the top of the desktop.
 *
 * The active-app name follows the focused window, which is most of what sells
 * this strip as an OS chrome rather than a header: it reacts to something you
 * did somewhere else on screen. The menus themselves are real buttons with real
 * hover states but no dropdowns — those come with the keyboard pass in Phase 7.
 */

// Shown when no window has focus — the desktop itself owns the menu bar.
const FINDER = "Portfolio";

const MENUS = ["File", "Edit", "View", "Go", "Window", "Help"];

/** Shared geometry for the small hit targets, so they line up on one baseline. */
const ITEM =
  "rounded-md px-2 py-px transition-colors hover:bg-white/15 active:bg-white/25";

export function MenuBar() {
  // Selector returns a string, not the window object, so the menu bar doesn't
  // re-render every time the focused window is dragged a pixel.
  const activeApp = useDesktop((state) => {
    const focused = state.windows.find((win) => win.id === state.focusedId);
    if (!focused) return FINDER;
    return getApp(focused.appId)?.name ?? focused.title;
  });

  return (
    <header
      className="fixed inset-x-0 top-0 flex items-center justify-between gap-4 border-b border-white/10 bg-black/25 px-2 text-[13px] text-white/90 backdrop-blur-2xl backdrop-saturate-150"
      style={{
        height: "var(--menubar-height)",
        zIndex: "var(--z-index-menubar)",
        // Keeps light wallpaper regions from washing out the text.
        textShadow: "0 1px 2px oklch(0 0 0 / 0.35)",
      }}
    >
      <nav aria-label="Application menu" className="flex items-center gap-0.5">
        <button
          type="button"
          className={`${ITEM} flex items-center`}
          aria-label="Portfolio OS menu"
        >
          <Logo className="size-3.75" />
        </button>

        <span className={`${ITEM} font-semibold`}>{activeApp}</span>

        {MENUS.map((menu) => (
          <button key={menu} type="button" className={ITEM}>
            {menu}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        {/* The PostHog-style escape hatch (§8): same content, no window manager. */}
        <button
          type="button"
          className={ITEM}
          aria-label="Switch to plain website"
          title="Switch to plain website"
          onClick={() => useMode.getState().setMode("plain")}
        >
          <Globe className="size-3.75" strokeWidth={1.9} aria-hidden />
        </button>
        <button type="button" className={ITEM} aria-label="Battery: 82 percent">
          <BatteryMedium className="size-4.25" strokeWidth={1.6} aria-hidden />
        </button>
        <button type="button" className={ITEM} aria-label="Wi-Fi">
          <Wifi className="size-3.75" strokeWidth={1.9} aria-hidden />
        </button>
        <button type="button" className={ITEM} aria-label="Search">
          <Search className="size-3.75" strokeWidth={1.9} aria-hidden />
        </button>
        <button type="button" className={ITEM} aria-label="Control centre">
          <SlidersHorizontal
            className="size-3.75"
            strokeWidth={1.9}
            aria-hidden
          />
        </button>
        <span className={ITEM}>
          <Clock />
        </span>
      </div>
    </header>
  );
}
