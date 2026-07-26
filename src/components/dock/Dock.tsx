import { useMemo } from 'react'
import { useMotionValue, useReducedMotion } from 'motion/react'
import { apps } from '@/apps/registry'
import { DockIcon } from '@/components/dock/DockIcon'
import { MagnificationContext } from '@/hooks/useMagnification'

/**
 * The dock — app launcher, running-app indicator, and the magnification effect.
 *
 * The bar owns exactly one piece of state: where the cursor is. Everything else
 * (which icons are big, which apps are running) is derived by the icons
 * themselves, so hovering the dock costs no React renders at all.
 *
 * The panel is `w-fit`: as icons grow the bar grows with them and stays centred,
 * which is both what macOS does and what keeps magnified icons from spilling
 * past the glass.
 */
export function Dock() {
  const pointerX = useMotionValue(Number.POSITIVE_INFINITY)
  const prefersReducedMotion = useReducedMotion()

  const magnification = useMemo(
    () => ({ pointerX, enabled: !prefersReducedMotion }),
    [pointerX, prefersReducedMotion],
  )

  return (
    // The full-width strip is only a centring device — it must not swallow
    // clicks meant for the desktop behind it.
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-2.5"
      style={{ zIndex: 'var(--z-index-dock)' }}
    >
      <MagnificationContext.Provider value={magnification}>
        <div
          role="group"
          aria-label="Dock"
          className="pointer-events-auto flex w-fit items-end gap-2.5 rounded-2xl border border-white/15 bg-black/25 px-2.5 pb-1.5 pt-2 shadow-[0_20px_45px_-18px_oklch(0_0_0_/_0.8)] backdrop-blur-2xl backdrop-saturate-150"
          onMouseMove={(event) => pointerX.set(event.clientX)}
          onMouseLeave={() => pointerX.set(Number.POSITIVE_INFINITY)}
        >
          {apps.map((app) => (
            <DockIcon key={app.id} app={app} />
          ))}
        </div>
      </MagnificationContext.Provider>
    </div>
  )
}
