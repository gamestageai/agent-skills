import * as React from 'react'
import { Story, type StoryFrame } from '@/components/gamestage/story'

/**
 * The end-of-round reveal and How to play: Gamestage UI's Story, played.
 *
 * Story never advances itself (its own comment says so), so this is the host
 * that does: a frame lasts a few seconds, longer for longer words, and the
 * pager fills as it goes. Tapping moves, holding pauses and swiping down
 * closes, all through Story's own `gestures`. Story's previous and next buttons stay for a keyboard and a
 * screen reader, visually hidden until one has focus (app.css).
 *
 * Under reduced motion nothing plays by itself.
 */
export type RevealFrame = StoryFrame & { words: number }

export function Stories(props: {
  frames: RevealFrame[]
  title: string
  closeLabel: string
  previousLabel: string
  nextLabel: string
  onClose: () => void
  /**
   * Leave the nav showing and usable. How to play is one of the nav's own
   * places, so it sits above the nav like the others rather than covering it.
   * The end-of-round reveal leaves this off and stays a modal. Tom, 2026-09-28.
   */
  keepNav?: boolean
}) {
  const { frames, onClose } = props
  const [step, setStep] = React.useState(1)
  const [progress, setProgress] = React.useState(0)
  const [held, setHeld] = React.useState(false)
  const still = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // Reading time: four seconds plus a little per word, capped so a long fact
  // still moves on.
  const duration = Math.min(9000, 4000 + (frames[step - 1]?.words ?? 0) * 180)

  React.useEffect(() => setProgress(0), [step])

  React.useEffect(() => {
    if (still || held) return
    let started: number | null = null
    const from = progress
    let raf = 0
    const tick = (now: number) => {
      if (started === null) started = now
      const next = from + (now - started) / duration
      if (next >= 1) {
        if (step < frames.length) setStep(step + 1)
        else setProgress(1)
        return
      }
      setProgress(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `progress` is read once when playing resumes, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, held, still, duration, frames.length])

  const go = (next: number) => setStep(Math.min(frames.length, Math.max(1, next)))

  // Tapping, holding, swiping across and swiping down to close are Story's own
  // now (Gamestage UI's `gestures`, GSUI-290): it follows the finger down,
  // shrinks and rounds like a phone's stories, and closes through onSkip. This
  // host only pauses its timer while a finger is down and fades the screen
  // behind as the story is dragged away.
  const backdrop = React.useRef<HTMLDivElement>(null)
  const fade = (amount: number, settling: boolean) => {
    const el = backdrop.current
    if (!el) return
    el.style.transition = settling ? 'background-color 300ms linear' : 'none'
    el.style.backgroundColor = amount > 0 ? `rgb(247 247 245 / ${1 - amount})` : ''
  }

  const shown = frames.map((frame, index) =>
    index === step - 1 ? { ...frame, playing: !still && !held, progress } : frame,
  )

  return (
    <div
      ref={backdrop}
      className="ringers-stories"
      data-keep-nav={props.keepNav ? 'true' : undefined}
      data-still={still ? 'true' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
        if (event.key === 'ArrowRight') go(step + 1)
        if (event.key === 'ArrowLeft') go(step - 1)
      }}
    >
      <Story
        frames={shown}
        step={step}
        onStep={go}
        title={props.title}
        onSkip={onClose}
        skipLabel={props.closeLabel}
        previousLabel={props.previousLabel}
        nextLabel={props.nextLabel}
        format="portrait"
        gestures
        fullscreen={!props.keepNav}
        onHold={setHeld}
        onDismissProgress={fade}
      />
    </div>
  )
}
