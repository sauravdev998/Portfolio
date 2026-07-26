import { useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { FileText, Folder } from 'lucide-react'
import { trashedItems } from '@/content/trash'

/**
 * Trash.app — the graveyard of side projects, played straight. Finder-ish
 * chrome (a toolbar, a list, kind/size/date columns) wrapping content whose
 * whole job is the epitaphs.
 *
 * One column, accordion details. A two-pane layout would look more like the
 * real Trash, but app bodies must stay layout-agnostic (§7) — this same
 * component is a full-screen sheet on a phone, where panes don't fit.
 */
export default function Trash() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [emptied, setEmptied] = useState(false)
  const shake = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()

  function handleEmpty() {
    setEmptied(true)
    if (!prefersReducedMotion) {
      void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } })
    }
  }

  return (
    <div className="flex h-full flex-col text-[13px]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <p className="text-white/55">
          {trashedItems.length} items · years of lessons
        </p>
        <motion.button
          type="button"
          animate={shake}
          onClick={handleEmpty}
          className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[12px] text-white/85 transition-colors hover:bg-white/15 active:bg-white/20"
        >
          Empty Trash
        </motion.button>
      </header>

      <ul className="flex-1 overflow-auto py-1">
        {trashedItems.map((item) => {
          const isOpen = openId === item.id
          const Glyph = item.kind.includes('folder') ? Folder : FileText

          return (
            <li key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                  isOpen ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Glyph className="size-4 shrink-0 text-[oklch(0.76_0.13_235)]" strokeWidth={1.7} aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium text-white/90">{item.name}</span>
                <span className="hidden shrink-0 text-white/40 sm:block">{item.kind}</span>
                <span className="w-16 shrink-0 text-right text-white/40">{item.size}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-b border-white/5 px-11 pb-3 pt-1">
                      <p className="text-white/70">{item.epitaph}</p>
                      <p className="mt-1.5 text-[12px] text-white/35">Deleted {item.deleted}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>

      <footer className="flex h-9 shrink-0 items-center border-t border-white/10 px-4" role="status">
        <p className={`text-[12px] transition-colors ${emptied ? 'text-[oklch(0.75_0.16_25)]' : 'text-white/35'}`}>
          {emptied
            ? '“Empty Trash” failed: these items are load-bearing.'
            : 'Nothing in here was a waste of time.'}
        </p>
      </footer>
    </div>
  )
}
