'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Feedback, and `tsc --noEmit` passes on it,
// so the gate cannot catch it.
import './feedback.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'
import { CrossGlyph, StarGlyph, TickGlyph } from './glyphs'

// The cue runtime. `./feel` is a local re-export shim in this repo and the
// installed sibling file in a host application, so the one specifier resolves
// in both places. With no provider above it, `useGameFeel` is a no-op.
import { useGameFeel } from './feel'

/**
 * Feedback: the response to the player's last act.
 *
 * One component, four variants, from specimen 5d. Correct is a word on a
 * positive plate with a tick, tilted three degrees and popping in. Wrong is
 * the same plate on the surface with a dashed negative ring and a cross,
 * shaking. Score is no plate at all: the bare `+100` in positive, floating up
 * beside the stat it changed. Reward is a surface card on the reward ring with
 * a star, an "Earned" kicker over the reward's name, slamming in and staying
 * until tapped.
 *
 * The element that moves is the plate itself, `data-gs-animates="motion"`,
 * and it stops dead under reduced motion. The glyph and the words inside it
 * are `data-gs-animates="emphasis"`, because a colour, glyph or text change is
 * how a player who cannot see movement still gets the answer.
 *
 * One feedback on screen at a time. The plate is keyed on what it says, so a
 * new variant or a new message replaces the old plate rather than stacking on
 * it, and replays its motion in doing so; the live region around it stays
 * put, so a screen reader hears the change.
 *
 * It performs nothing. It does not decide whether the last act was right, does
 * not know the running score, and does not settle a reward. The host has
 * already decided that by the time it hands this a variant, and this renders
 * it. Rendering is synchronous with the prop on purpose: REQ-045 puts a 100ms
 * ceiling on the gap between a tap and the first visible feedback, and nothing
 * here awaits anything between the prop landing and `[data-gs-feedback]`
 * landing in the DOM.
 */

export type FeedbackVariant = 'correct' | 'wrong' | 'score' | 'reward'

export interface FeedbackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** Which of the four contract values this renders. */
  variant: FeedbackVariant
  /**
   * The word on the plate. Each variant has a default ("Correct", "Wrong", the
   * signed delta, "Reward"), so a bare `<Feedback variant="correct" />` is a
   * complete, accessible render; a reward passes its name here.
   */
  label?: string
  /**
   * The optional line under the word: the reason an answer was wrong, what a
   * reward is for. Read after the label by a screen reader.
   */
  message?: string
  /**
   * The kicker over a reward's name. "Earned" unless the host says otherwise.
   * Rendered on the reward variant only.
   */
  note?: string
  /**
   * The signed amount a value changed by, e.g. `50` or `-10`. On `score` it is
   * the whole message; on `correct` it follows the word ("Correct +100", as
   * specimen 5e draws it). Rides `data-gs-delta`, which the attribute contract
   * shares with any element reporting a value's change rather than holding the
   * value itself.
   */
  delta?: number
  /**
   * Called when the feedback has finished. Passing it turns the lifetime on:
   * correct and wrong hold for the drawing's 1200ms and fade over 200ms; score
   * fades once its float ends; reward stays until tapped and fades then. Leave
   * it out and the feedback stays as rendered, for a host that removes it
   * itself (a changing `key`, a `null` on the next round).
   */
  onDismiss?: () => void
}

/** Fallbacks for a host that renders a variant with no label of its own. */

/** Glyphs, because colour alone is not an answer. Score has none: the number
 *  itself, floating up, is the signal. */
const GLYPH: Partial<Record<FeedbackVariant, React.ReactNode>> = {
  correct: <TickGlyph />,
  wrong: <CrossGlyph />,
  reward: <StarGlyph filled />,
}

/**
 * One capability per outcome, from specimen 5d: a correct answer pops, a wrong
 * one shakes, a score floats up, a reward slams in. motion.css plays the
 * capability on the element that carries it, which is the plate; the glyph and
 * the label inside stay emphasis, the half that survives reduced motion.
 */
const MOTION: Record<FeedbackVariant, 'pop' | 'shake' | 'floatup' | 'slam'> = {
  correct: 'pop',
  wrong: 'shake',
  score: 'floatup',
  reward: 'slam',
}

/**
 * What each variant asks for, in the order the design lists it.
 *
 * Typed off the runtime's own signature rather than by importing its cue-name
 * union: after a registry install `./feel` is the provider file alone, and a
 * type imported from a file the installer does not ship is a component that
 * only compiles inside this repo.
 */
type CueRequest = Parameters<ReturnType<typeof useGameFeel>['cue']>

const CUES: Record<FeedbackVariant, ReadonlyArray<CueRequest>> = {
  correct: [
    ['correct', 'sfx'],
    ['success', 'haptic'],
  ],
  wrong: [
    ['wrong', 'sfx'],
    ['error', 'haptic'],
  ],
  score: [
    ['score', 'sfx'],
    ['light', 'haptic'],
  ],
  reward: [
    ['reward', 'sfx'],
    ['success', 'haptic'],
  ],
}
/** The name of the exit keyframe in feedback.css, matched on animationend. */
const EXIT = 'gs-feedback-exit'

export function Feedback(props: FeedbackProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const DEFAULT_LABEL: Record<FeedbackVariant, string> = {
    correct: copy['feedback.correct'],
    wrong: copy['feedback.wrong'],
    score: copy['feedback.score'],
    reward: copy['feedback.reward'],
  }
  const {
    variant,
    label,
    message,
    note,
    delta,
    onDismiss,
    className,
    onAnimationEnd,
    ...rest
  } = componentProps

  const word =
    label ??
    (variant === 'score' && delta !== undefined
      ? copy['feedback.delta'](delta)
      : variant === 'correct' && delta !== undefined
        ? copy['feedback.correctDelta'](DEFAULT_LABEL.correct, copy['feedback.delta'](delta))
        : DEFAULT_LABEL[variant])
  const kicker = variant === 'reward' ? (note ?? copy['feedback.earned']) : undefined
  const glyph = GLYPH[variant]
  const motion = MOTION[variant]

  // The design's feedback sheet, specimens 4a to 4d, gives each variant its
  // sound and its haptic: "Correct · sfx.correct (bright, short) ·
  // haptic.success", "Wrong · sfx.wrong (low, dull, never harsh) ·
  // haptic.error", "Score +100 · sfx.score (ticks per 10 pts) · haptic.light",
  // and the reward specimen 3f's "sfx.reveal → sfx.reward · haptic.success".
  //
  // On mount, once, because a feedback is one settlement: the registry docs
  // already tell a host to mount it fresh per settlement with a changing `key`
  // rather than toggling one instance, which is the same thing the shake and
  // the float need. A `choice` that settles at the same moment asks for
  // sfx.correct too, and the runtime collapses the pair into one sound.
  const { cue } = useGameFeel()
  const fired = React.useRef(false)
  React.useEffect(() => {
    if (fired.current) return
    fired.current = true
    for (const request of CUES[variant]) cue(...request)
  }, [variant, cue])
  // The reward stays until tapped. Tapping it starts the exit fade; the fade's
  // end is what calls the host, so the host removes an element that has
  // already gone rather than one mid-fade.
  const [exiting, setExiting] = React.useState(false)
  const timed = onDismiss !== undefined && variant !== 'reward'
  const tappable = onDismiss !== undefined && variant === 'reward'

  const name = [kicker, word, message].filter(Boolean).join('. ')

  const content = (
    <>
      {glyph ? (
        <span className="gs-feedback__glyph" data-gs-scope="feedback" data-gs-part="glyph" data-gs-animates="emphasis" aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      <span className="gs-feedback__text">
        {kicker ? (
          <span className="gs-feedback__note" data-gs-scope="feedback" data-gs-part="note" data-gs-animates="emphasis" aria-hidden="true">
            {kicker}
          </span>
        ) : null}
        {/* The score's number is a display number, so it carries the shared
            display class and the theme's shadow reaches it the way it reaches
            every other number a player reads. The words on a plate are the
            title face, set in feedback.css. */}
        <span
          className={['gs-feedback__label', variant === 'score' ? 'gs-display-type' : null].filter(Boolean).join(' ')}
          data-gs-scope="feedback"
          data-gs-part="label"
          data-gs-animates="emphasis"
          aria-hidden="true"
        >
          {word}
        </span>
        {message ? (
          <span className="gs-feedback__detail" data-gs-scope="feedback" data-gs-part="detail" data-gs-animates="emphasis" aria-hidden="true">
            {message}
          </span>
        ) : null}
      </span>
    </>
  )

  // The plate. Keyed on what it says, so a new outcome is a new element and
  // its motion plays again; the live region outside it does not remount, so
  // the change is announced. The part is `motion` because the job of this
  // element is to be the thing that moves, whatever it plays.
  const plateKey = `${variant}|${word}|${message ?? ''}`
  const plateProps = {
    className: 'gs-feedback__motion',
    'data-gs-scope': 'feedback',
    'data-gs-part': 'motion',
    'data-gs-motion': motion,
    'data-gs-animates': 'motion',
  } as const

  return (
    <div
      {...rest}
      className={['gs-feedback', timed ? 'gs-feedback--timed' : null, exiting ? 'gs-feedback--exit' : null, className]
        .filter(Boolean)
        .join(' ')}
      data-gs-component="feedback"
      data-gs-feedback={variant}
      data-gs-delta={delta}
      role="status"
      aria-label={name}
      onAnimationEnd={(event) => {
        onAnimationEnd?.(event)
        if (event.animationName === EXIT && event.target === event.currentTarget) onDismiss?.()
      }}
    >
      {tappable ? (
        // A reward that stays until tapped is a control, so it is a button and
        // is reachable from a keyboard. Its name is the feedback's own.
        <button key={plateKey} {...plateProps} type="button" aria-label={copy['feedback.dismiss'](name)} onClick={() => setExiting(true)}>
          {content}
        </button>
      ) : (
        <span key={plateKey} {...plateProps} aria-hidden="true">
          {content}
        </span>
      )}
    </div>
  )
}
