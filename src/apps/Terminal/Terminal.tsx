import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { apps } from '@/apps/registry'
import { profile } from '@/content/profile'
import { projects } from '@/content/projects'
import { useDesktop } from '@/store/useDesktop'

/**
 * Terminal.app — the Phase 8 easter egg: a small command parser over the same
 * `content/*.ts` everything else renders. There is no real shell here; each
 * command is a function from arguments to React nodes, and the "filesystem" is
 * a bit of theatre over the profile and project data.
 *
 * The scrollback is plain state. Entries only ever append (or clear), so the
 * ids are a counter and rendering is a straight map — no virtualization; nobody
 * types four thousand commands into a portfolio.
 */

const USER = 'guest'
const HOST = 'portfolio'

/** True when the desktop shell is up — `open` can only mean something there. */
function hasWindowManager(): boolean {
  return window.matchMedia('(min-width: 1024px)').matches
}

interface Entry {
  id: number
  /** The line as typed, echoed behind the prompt. Absent for the banner. */
  command?: string
  output: ReactNode
}

function Prompt() {
  return (
    <span className="shrink-0 whitespace-pre">
      <span className="text-[oklch(0.82_0.15_160)]">{USER}@{HOST}</span>
      <span className="text-white/50"> ~ % </span>
    </span>
  )
}

/** `cat`-able "files" — each one renders a slice of the content layer. */
const FILES: Record<string, () => ReactNode> = {
  'about.txt': () => (
    <div className="space-y-2">
      {profile.bio.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  ),
  'socials.txt': () => (
    <div>
      {profile.socials.map((social) => (
        <p key={social.label}>
          {social.label.padEnd(10)}
          <a href={social.href} target="_blank" rel="noreferrer" className="underline decoration-white/40 underline-offset-2 hover:text-white">
            {social.handle}
          </a>
        </p>
      ))}
      <p>{'Email'.padEnd(10)}{profile.email}</p>
    </div>
  ),
  'resume.pdf': () => (
    <p className="text-white/60">
      resume.pdf is a binary file. Try <Code>open resume</Code> instead.
    </p>
  ),
}

function Code({ children }: { children: ReactNode }) {
  return <span className="rounded bg-white/10 px-1 text-white/90">{children}</span>
}

function ErrorLine({ children }: { children: ReactNode }) {
  return <p className="text-[oklch(0.75_0.16_25)]">{children}</p>
}

function Help() {
  const rows: [string, ReactNode][] = [
    ['help', 'what you are reading'],
    ['whoami', 'who is asking'],
    ['ls [projects]', 'look around'],
    ['cat <file>', <>read a file — start with <Code>cat about.txt</Code></>],
    ['open <app>', `launch an app: ${apps.map((app) => app.id).join(', ')}`],
    ['neofetch', 'system information, as is the ritual'],
    ['date · echo · pwd', 'the classics'],
    ['clear', 'wipe the scrollback'],
    ['sudo hire-me', 'the fast path'],
    ['exit', 'close the terminal'],
  ]
  return (
    <div>
      {rows.map(([cmd, description]) => (
        <p key={cmd}>
          <span className="inline-block w-44 text-[oklch(0.85_0.1_85)]">{cmd}</span>
          <span className="text-white/70">{description}</span>
        </p>
      ))}
    </div>
  )
}

function Neofetch() {
  const rows: [string, string][] = [
    ['OS', 'Portfolio OS 1.0 "Dusk"'],
    ['Host', profile.name],
    ['Kernel', profile.role],
    ['Uptime', 'shipping since 2022'],
    ['Shell', 'psh (portfolio shell)'],
    ...profile.specs.slice(0, 4).map(({ label, value }): [string, string] => [label, value]),
    ['Location', profile.location],
  ]
  return (
    <div className="flex gap-6">
      <pre className="shrink-0 leading-tight text-[oklch(0.68_0.17_285)]">
        {'   ▄▄▄▄▄▄▄▄▄\n  ██▀▀▀▀▀▀▀██\n  ██  ' + profile.monogram + '   ██\n  ██▄▄▄▄▄▄▄██\n   ▀▀▀▀▀▀▀▀▀'}
      </pre>
      <div>
        <p>
          <span className="text-[oklch(0.82_0.15_160)]">{USER}@{HOST}</span>
        </p>
        <p className="text-white/40">{'─'.repeat(16)}</p>
        {rows.map(([label, value]) => (
          <p key={label}>
            <span className="inline-block w-24 text-[oklch(0.85_0.1_85)]">{label}</span>
            <span className="text-white/80">{value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

/** One command in, nodes out. `'clear'` is the only side-channel. */
function run(input: string): ReactNode | 'clear' {
  const [cmd = '', ...args] = input.trim().split(/\s+/)

  switch (cmd) {
    case '':
      return null
    case 'help':
      return <Help />
    case 'whoami':
      return (
        <div>
          <p>{USER} — but you are probably here about:</p>
          <p className="text-white/90">{profile.name} · {profile.role} · {profile.location}</p>
        </div>
      )
    case 'pwd':
      return <p>/Users/{USER}</p>
    case 'date':
      return <p>{new Date().toString()}</p>
    case 'echo':
      return <p>{args.join(' ')}</p>
    case 'neofetch':
      return <Neofetch />
    case 'clear':
      return 'clear'
    case 'ls': {
      if (args[0]?.replace(/\/$/, '') === 'projects') {
        return (
          <div>
            {projects.map((project) => (
              <p key={project.id}>
                {project.id}
                <span className="text-white/40">  — {project.tagline}</span>
              </p>
            ))}
          </div>
        )
      }
      if (args.length > 0) return <ErrorLine>ls: {args[0]}: No such file or directory</ErrorLine>
      return (
        <p>
          <span className="text-[oklch(0.76_0.13_235)]">projects/</span>
          {'  '}{Object.keys(FILES).join('  ')}
        </p>
      )
    }
    case 'cat': {
      const name = args[0]
      if (!name) return <ErrorLine>usage: cat &lt;file&gt; — try <Code>cat about.txt</Code></ErrorLine>

      const file = FILES[name]
      if (file) return file()

      // `cat projects/<id>` (or the bare id) prints the project's detail pane.
      const id = name.replace(/^projects\//, '')
      const project = projects.find((entry) => entry.id === id)
      if (project) {
        return (
          <div className="space-y-2">
            <p className="text-white/90">{project.name} ({project.year}) — {project.tagline}</p>
            <p className="text-white/70">{project.description}</p>
            <div>
              {project.highlights.map((highlight) => (
                <p key={highlight} className="text-white/70">• {highlight}</p>
              ))}
            </div>
            <p className="text-white/50">stack: {project.stack.join(', ')}</p>
          </div>
        )
      }
      return <ErrorLine>cat: {name}: No such file or directory</ErrorLine>
    }
    case 'open': {
      const id = args[0]?.toLowerCase()
      const app = apps.find((entry) => entry.id === id)
      if (!app) {
        return <ErrorLine>open: unknown app — one of: {apps.map((entry) => entry.id).join(', ')}</ErrorLine>
      }
      if (!hasWindowManager()) {
        return <p className="text-white/60">The window manager isn't running on this screen size — tap {app.name} on the home screen instead.</p>
      }
      useDesktop.getState().openApp(app.id)
      return <p>Opening {app.name}.app…</p>
    }
    case 'sudo': {
      if (args.join(' ') !== 'hire-me') {
        return <ErrorLine>{USER} is not in the sudoers file. This incident will be reported.</ErrorLine>
      }
      if (hasWindowManager()) useDesktop.getState().openApp('contact')
      return (
        <div>
          <p className="text-white/50">Password: ••••••••</p>
          <p>Access granted — of course.</p>
          <p>Drafting offer letter… done.</p>
          <p>
            Opening Contact.app so you can make it official
            {hasWindowManager() ? '.' : <> — or just write to {profile.email}.</>}
          </p>
        </div>
      )
    }
    case 'hire-me':
      return <ErrorLine>hire-me: permission denied. Try <Code>sudo hire-me</Code>.</ErrorLine>
    case 'exit': {
      const { windows, closeWindow } = useDesktop.getState()
      const own = windows.find((win) => win.appId === 'terminal')
      if (own && hasWindowManager()) {
        closeWindow(own.id)
        return <p>logout</p>
      }
      return <p className="text-white/60">There is no escape. (Swipe the sheet away instead.)</p>
    }
    default:
      return <ErrorLine>psh: command not found: {cmd}. Type <Code>help</Code>.</ErrorLine>
  }
}

export default function Terminal() {
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)

  const [entries, setEntries] = useState<Entry[]>([])
  const [value, setValue] = useState('')

  // Up/down arrow recall. The index is "distance from the end"; null means
  // live typing. The draft is stashed so walking into history and back out
  // doesn't eat what was half-typed.
  const history = useRef<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const draft = useRef('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [entries])

  function submit() {
    const command = value
    setValue('')
    setHistoryIndex(null)
    if (command.trim()) history.current.push(command)

    const output = run(command)
    if (output === 'clear') {
      setEntries([])
      return
    }
    setEntries((current) => [...current, { id: nextId.current++, command, output }])
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      submit()
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const past = history.current
      if (past.length === 0) return

      let next: number | null
      if (event.key === 'ArrowUp') {
        if (historyIndex === null) draft.current = value
        next = Math.min((historyIndex ?? 0) + 1, past.length)
      } else {
        next = historyIndex === null ? null : historyIndex - 1
        if (next !== null && next < 1) next = null
      }

      setHistoryIndex(next)
      setValue(next === null ? draft.current : past[past.length - next])
    }
  }

  return (
    // Clicks land focus on the prompt — unless the visitor is selecting output.
    // `min-h-full`, not `h-full`: the window body is the scroll container, so a
    // fixed height would cut the background off at one screenful of scrollback.
    <div
      className="min-h-full cursor-text bg-[oklch(0.14_0.02_280_/_0.85)] p-3 font-mono text-[12.5px] leading-relaxed text-white/85"
      onClick={() => {
        if (window.getSelection()?.isCollapsed) inputRef.current?.focus()
      }}
    >
      <p className="text-white/40">Last login: {new Date().toDateString()} on ttys001</p>
      <p className="mb-2 text-white/60">
        Portfolio OS shell. Type <Code>help</Code> to look around.
      </p>

      {entries.map((entry) => (
        <div key={entry.id}>
          <p className="flex">
            <Prompt />
            <span className="whitespace-pre-wrap">{entry.command}</span>
          </p>
          {entry.output && <div className="mb-1">{entry.output}</div>}
        </div>
      ))}

      <div className="flex">
        <Prompt />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent caret-[oklch(0.82_0.15_160)] outline-none"
          aria-label="Terminal command input"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div ref={endRef} />
    </div>
  )
}
