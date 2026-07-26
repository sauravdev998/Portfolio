import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Copy, Send } from 'lucide-react'
import { profile } from '@/content/profile'

/**
 * Contact.app — Mail's compose window.
 *
 * Send hands off to the visitor's own mail client via `mailto:`. A real form
 * needs a backend and a spam story, and a portfolio contact form that silently
 * drops messages is worse than no form at all. This way the message is provably
 * sent — the visitor watches it happen — and there's a copy-address escape hatch
 * for anyone without a mail client wired up.
 */
export default function Contact() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [copied, setCopied] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const query = new URLSearchParams({ subject, body })
    window.location.href = `mailto:${profile.email}?${query}`
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied outright; the address is on screen
      // anyway, so failing quietly beats an error the visitor can't act on.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 bg-black/20">
        <Field label="To">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[oklch(0.55_0.17_258)]/35 px-2 py-0.5 text-[13px] text-white ring-1 ring-inset ring-white/15">
              {profile.name} &lt;{profile.email}&gt;
            </span>
            <button
              type="button"
              onClick={copyEmail}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
              aria-label={copied ? 'Address copied' : 'Copy email address'}
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={2.2} aria-hidden />
              ) : (
                <Copy className="size-3.5" strokeWidth={2} aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </Field>

        <Field label="Subject" htmlFor="contact-subject">
          <input
            id="contact-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Hello"
            autoComplete="off"
            className="w-full bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none"
          />
        </Field>
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write something…"
        aria-label="Message"
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3.5 text-[13px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
      />

      <footer className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 bg-black/20 px-3 py-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {profile.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="text-white/50 underline-offset-2 transition-colors hover:text-white/90 hover:underline"
            >
              {social.label}
            </a>
          ))}
        </div>

        <button
          type="submit"
          className="ml-auto flex items-center gap-1.5 rounded-md bg-[oklch(0.55_0.17_258)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[oklch(0.61_0.17_258)]"
        >
          <Send className="size-3.5" strokeWidth={2} aria-hidden />
          Send
        </button>
      </footer>
    </form>
  )
}

/** Mail's compose header: a hairline-separated row with a right-aligned label. */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 px-4 py-2 last:border-b-0">
      <label
        htmlFor={htmlFor}
        className="w-14 shrink-0 text-right text-[12px] font-medium text-white/45"
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
