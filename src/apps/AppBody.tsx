import { Suspense } from 'react'
import { getApp } from '@/apps/registry'

/**
 * Resolves an app id to its lazy-loaded body — the piece both shells share.
 *
 * A desktop `Window` and a mobile `AppSheet` are different chrome around the
 * same content, so the lookup, the Suspense boundary and the not-installed
 * stand-in live here rather than in either shell.
 *
 * The Suspense boundary is per-host on purpose: an app loading its chunk must
 * never blank out the apps already on screen.
 */
export function AppBody({ appId, title }: { appId: string; title: string }) {
  const App = getApp(appId)?.component
  if (!App) return <NotInstalled title={title} />

  return (
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  )
}

/**
 * Deliberately not a spinner. App chunks are small enough that they usually
 * arrive within a frame or two, and a spinner that flashes for 30ms reads as a
 * glitch — an empty pane simply looks like the window is still opening.
 */
function Loading() {
  return <div className="h-full" aria-busy />
}

/** An app that's in the dock but not built yet — see the registry. */
function NotInstalled({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 p-6 text-center">
      <p className="text-sm text-white/70">{title} isn’t installed yet.</p>
      <p className="text-[13px] text-white/40">Coming in a later update.</p>
    </div>
  )
}
