import { useSound } from '@/store/useSound'

/**
 * The OS's voice — a handful of tiny sounds, synthesized at play time.
 *
 * Synthesis rather than samples for the same reason the wallpaper is a
 * gradient: no assets to license, nothing to download, and the sounds can be
 * tuned in code next to the animations they accompany. Each one is a few
 * oscillator/noise nodes with an exponential envelope, gone in a third of a
 * second — UI foley, not music.
 *
 * `playSound` checks the mute store itself so call sites stay one line and
 * can't forget the check. The AudioContext is created lazily on the first
 * unmuted play: every path to a sound starts at a click or a keypress, so the
 * context is always born inside a user gesture and never hits the autoplay
 * block.
 */

export type SoundName = 'launch' | 'minimize' | 'close' | 'pop' | 'eat' | 'gameover'

let ctx: AudioContext | undefined

function ensureContext(): AudioContext | undefined {
  if (typeof AudioContext === 'undefined') return undefined
  ctx ??= new AudioContext()
  // A tab backgrounded long enough gets its context suspended; resume is
  // async but the scheduled nodes below queue up fine behind it.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function playSound(name: SoundName) {
  if (useSound.getState().muted) return
  const audio = ensureContext()
  if (!audio) return

  const now = audio.currentTime
  switch (name) {
    case 'launch': // rising blip — something is arriving
      tone(audio, now, { from: 520, to: 880, duration: 0.14 })
      break
    case 'close': // the same gesture inverted — something left
      tone(audio, now, { from: 660, to: 340, duration: 0.12 })
      break
    case 'minimize': // a falling whoosh, matching the trip down to the dock
      whoosh(audio, now, 0.3)
      break
    case 'pop': // one short tick — acknowledgement, used by the toggle itself
      tone(audio, now, { from: 900, to: 900, duration: 0.06 })
      break
    case 'eat': // Snake picking up an apple. Shorter than everything above:
      // this can fire twice a second, and anything with a tail would smear.
      tone(audio, now, { from: 680, to: 1020, duration: 0.07 })
      break
    case 'gameover': // two notes falling away — the only sound here that
      // admits to being a phrase, because it's the only one that ends something
      tone(audio, now, { from: 400, to: 260, duration: 0.16 })
      tone(audio, now + 0.13, { from: 270, to: 130, duration: 0.28 })
      break
  }
}

function tone(
  audio: AudioContext,
  at: number,
  { from, to, duration }: { from: number; to: number; duration: number },
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + duration)

  // Fast attack, exponential decay — percussive enough to read as UI, not as
  // a note. Peak gain is deliberately low; these sit under the interface.
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.06, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)

  osc.connect(gain).connect(audio.destination)
  osc.start(at)
  osc.stop(at + duration + 0.02)
}

function whoosh(audio: AudioContext, at: number, duration: number) {
  const length = Math.ceil(audio.sampleRate * duration)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

  const source = audio.createBufferSource()
  source.buffer = buffer

  // White noise through a closing low-pass filter is the whole trick: the
  // falling cutoff is what makes it "descend" alongside the window.
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, at)
  filter.frequency.exponentialRampToValueAtTime(220, at + duration)

  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.05, at + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)

  source.connect(filter).connect(gain).connect(audio.destination)
  source.start(at)
  source.stop(at + duration)
}
