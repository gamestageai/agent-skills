'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

import { Stat, type StatProps } from './stat'
// The cue seam, not the runtime: a component reports and the host performs.
// With no provider above it, `useGameFeel` is a no-op.
import { useGameFeel } from './feel'
import './score.css'

/**
 * Score: `stat` with `kind="score"`, plus a count-up.
 *
 * Everything a player sees is stat's: the display typeface, the tabular
 * numerals, the change beside the number, the label, the settlement states.
 * This file owns one idea and no others, the count from the old number to the
 * new one, because that is the only thing score has that no other stat does.
 *
 * It performs nothing else. The host owns the number; a value arriving is the
 * host's event, and this renders the journey to it.
 *
 * The count-up is presentation and nothing more. `data-gs-value` carries the
 * settled number from the moment the host gives it, so an interrupted count-up,
 * a suppressed one and a finished one all report the same truth, and
 * `data-gs-counting` says only that the text on screen has not caught up yet.
 *
 * It also ticks. The catalogue has always described `sfx.score` as "tick per
 * 10 pts during count-up" and nothing fired it, so a whole round of the
 * reference game produced 22 cues and the score climbed in silence while the
 * correct answer, the commit and the streak all spoke. That is the defect a
 * player notices without being able to name (GSUI-231).
 */

/** The duration the count runs over: `motion.count`, the drawing's own name
 *  for it (specimen 4a, "count-up 400ms, 10/frame"). It borrowed `motion.fill`
 *  until the token existed. 0ms under reduced motion, which is the behaviour
 *  we want anyway. */
const COUNT_UP_DURATION = '--gs-motion-count'

/** "tick per 10 pts during count-up", from the cue catalogue and the drawing. */
const POINTS_PER_TICK = 10

export interface ScoreProps
  extends Omit<StatProps, 'kind' | 'critical' | 'warning' | 'direction' | 'paused'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /**
   * Whether a change counts up. Off renders the new number at once, which is
   * what a host wants when the score is being restored rather than earned.
   * Reduced motion suppresses it regardless.
   */
  countUp?: boolean
}

export function Score(props: ScoreProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    value,
    countUp = true,
    format,
    label = copy['score.label'],
    max,
    min,
    delta,
    settlement,
    // The design draws the score as a ringed chip floating over the scene, not as
    // a label above a bare number on the page background (GSUI-100). A host that
    // wants it plain, or in a pill, says so; the silhouette is the only thing this
    // changes.
    presentation = 'chip',
    className,
    ...rest
  } = componentProps

  const root = React.useRef<HTMLDivElement>(null)
  const { cue } = useGameFeel()
  const { display, counting } = useCountUp(value, countUp, root, cue)

  const render = (n: number) => (format ? format(n) : String(n))

  // The name holds the settled number throughout, never the one mid-count: a
  // screen reader user is told what they scored, not what the animation is
  // passing through. Stat derives its own name from the same string it renders,
  // so the two cannot differ there; see the note on the wrapper below.
  const settled = render(value)
  const name = [
    label,
    max === undefined ? settled : copy['score.valueOfMax'](settled, max),
    settlement === 'corrected' ? copy['score.updated'] : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    // The wrapper exists for one reason: while the text is counting, the name
    // and the rendered string differ, and stat ties them together. It carries
    // the name and the machine-readable value; the stat inside carries
    // everything else and is hidden from the accessibility tree so the number
    // is announced once.
    <div
      {...rest}
      ref={root}
      className={['gs-score', className].filter(Boolean).join(' ')}
      data-gs-component="score"
      data-gs-value={value}
      data-gs-counting={counting ? 'true' : undefined}
      role="group"
      aria-label={name}
    >
      <Stat
        strings={copy}
        kind="score"
        value={value}
        max={max}
        min={min}
        delta={delta}
        settlement={settlement}
        label={label}
        presentation={presentation}
        format={() => render(display)}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * The count itself.
 *
 * It counts from wherever the text has got to, not from the previous settled
 * value, so a second change landing mid-count carries on from what the player
 * can see rather than jumping back. Every exit lands on `target`: suppressed,
 * reduced-motion, zero-duration and interrupted all end with the right number.
 */
function useCountUp(
  target: number,
  enabled: boolean,
  ref: React.RefObject<HTMLElement | null>,
  cue: ReturnType<typeof useGameFeel>['cue'],
) {
  const [display, setDisplay] = React.useState(target)

  // Written during render so the effect below reads what is on screen now. The
  // effect must not re-run when the text moves, only when the target does.
  const shown = React.useRef(target)
  shown.current = display

  // And the same for the cue. `cue` is a useCallback in the provider with the
  // host's `onCue` among its dependencies, so a host writing
  // `<GameFeelProvider onCue={(e) => ...}>` hands down a new function on every
  // one of its own renders. With `cue` in the effect's dependency list that
  // tears the count-up down and restarts it mid-flight, and the number
  // stutters and re-ticks for a host that did nothing wrong. Held in a ref and
  // read when a tick fires, so the effect depends on the target alone.
  const fire = React.useRef(cue)
  fire.current = cue

  React.useEffect(() => {
    const from = shown.current
    if (from === target) return

    // The score arriving says so even when there is no journey to say it
    // over. A count that is off, suppressed or zero-length still changed the
    // number, and silencing the cue with the animation would tie sound to
    // reduced motion, which are two different things a player asks for: one
    // wants stillness, not silence. One cue, carrying the number that landed.
    const landSilently = () => {
      setDisplay(target)
      if (target > from) fire.current('score', 'sfx', target)
    }

    if (!enabled || prefersReducedMotion()) {
      landSilently()
      return
    }

    const ms = durationOf(ref.current)
    if (ms <= 0) {
      landSilently()
      return
    }

    // A tick every ten points the number passes, which at the drawing's own
    // rate ("count-up 400ms, 10/frame") is about one a frame at most, so the
    // rate is bounded by the frame rate however large the gain is. Each tick
    // carries the number it passed, which is what makes it a distinct cue
    // rather than the runtime's dedup collapsing a run of them into one.
    //
    // Counting down is silent. The catalogue's word for a rank lost is
    // "silent", and a score going backwards is a correction rather than
    // something earned.
    const rising = target > from
    let ticked = from

    const startedAt = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - startedAt) / ms)
      const at = progress >= 1 ? target : Math.round(from + (target - from) * progress)
      setDisplay(at)
      if (rising && Math.floor(at / POINTS_PER_TICK) > Math.floor(ticked / POINTS_PER_TICK)) {
        ticked = at
        fire.current('score', 'sfx', at)
      }
      if (progress < 1) frame = requestAnimationFrame(step)
    })
    // Interruption: the run is abandoned, and the next one starts from the
    // number on screen and ends on the new target. Nothing here has to land the
    // old one, because `data-gs-value` was never the counting number.
    return () => cancelAnimationFrame(frame)
  }, [target, enabled, ref])

  return { display, counting: display !== target }
}

/** Reduced motion, asked of the browser rather than assumed. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The duration, from the token, as milliseconds. No token, no count-up. */
function durationOf(el: HTMLElement | null): number {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const raw = getComputedStyle(el).getPropertyValue(COUNT_UP_DURATION).trim()
  if (raw.endsWith('ms')) return Number.parseFloat(raw) || 0
  if (raw.endsWith('s')) return (Number.parseFloat(raw) || 0) * 1000
  return 0
}
