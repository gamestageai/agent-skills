'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Stat, and `tsc --noEmit` passes on it, so the
// gate cannot catch it.
import './stat.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

/**
 * Stat: every number a player reads.
 *
 * Score, timer, lives, streak, rank, multiplier, level and XP are one component
 * with a different `kind`, not eight components. They differ in the word beside
 * the number and in which token sizes them; they do not differ in how a number
 * is rendered, counted up, or announced. Eight implementations of that would be
 * eight sets of the same bug, and the first theme to land would show it.
 *
 * It performs nothing. It does not count down, fetch, or decide when a value is
 * critical. The host owns the number and says what it means; this renders it and
 * reports nothing back.
 *
 * ## Presentation (GSUI-100)
 *
 * The design draws six game-state objects as six shapes: score as a ringed chip,
 * the timer as a filled pill that changes at two thresholds, lives as a pill of
 * dots, the streak as a pill, the round as a row of segment pills. All six were
 * built as a label above a number on the page background, so a player reading a
 * HUD could not tell the timer from the score except by the word above it.
 *
 * `presentation` is the fix, and it is a prop for the same reason `choice` has
 * one: six silhouettes is not six components. The engine — the number, the
 * count, the accessible name, every state and every attribute — is identical in
 * all five, and only the container changes. `dots` and `pips` additionally draw
 * a row of marks, derived from the same `value` and `max` the number already
 * carries, so nothing is a second place the number is written down.
 *
 * `plain` is the default and is what every stat rendered before this existed, so
 * a host that has never heard of the prop sees no change.
 */

export type StatKind =
  | 'score'
  | 'timer'
  | 'lives'
  | 'streak'
  | 'round'
  | 'status'
  | 'rank'
  | 'multiplier'
  | 'level'
  | 'xp'

/**
 * The silhouette, never the meaning.
 *
 * `plain` is a label above a number, on whatever is behind it. `chip` rings it.
 * `pill` fills it. `dots` and `pips` add a row of marks to the pill, one per
 * unit of `max`: `dots` for a resource that is spent and can come back, `pips`
 * for a position in a sequence.
 */
export type StatPresentation = 'plain' | 'chip' | 'pill' | 'dots' | 'pips'

export type StatSettlement = 'optimistic' | 'settled' | 'corrected'

/**
 * What one mark stands for, per presentation.
 *
 * `dots` splits at the value: the first `value` marks are still held and the
 * rest are spent. The spent one is drawn as a dashed outline rather than a
 * different fill, because the design's dashed slot is what says "this can come
 * back" — which is the thing a broken heart said the opposite of.
 *
 * `pips` splits at the value too, but the value is a 1-based position rather
 * than a count, so the mark at `value` is the one the player is on.
 */
function markStates(presentation: StatPresentation, value: number, max: number): string[] {
  const total = Math.max(0, Math.floor(max))
  // Clamped for the drawing only. `data-gs-value` keeps whatever the host said:
  // a host passing 4 of 3 has a bug, and the attribute is where it should show.
  const held = Math.max(0, Math.min(Math.floor(value), total))
  if (presentation === 'dots') {
    return Array.from({ length: total }, (_, i) => (i < held ? 'held' : 'spent'))
  }
  return Array.from({ length: total }, (_, i) =>
    i < held - 1 ? 'done' : i === held - 1 ? 'current' : 'coming',
  )
}

export interface StatProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /**
   * The drawing inside each mark, when the shipped one is wrong for the game.
   *
   * The marks are dots, and a dot is deliberate: this drew hearts and moved
   * away from them, because a broken heart says damage when what is meant is a
   * life gone. That reasoning holds for most games and not for all of them, and
   * a forest with lanterns or a client with their own brand mark had no route
   * but forking the file. Called once per mark with the mark's own state, so a
   * host can draw held and spent differently, and the CSS still owns the size.
   */
  mark?: (state: string, index: number) => React.ReactNode

  /** Which number this is. Picks the word and the token scale, nothing else. */
  kind: StatKind
  /** The settled value. Always the truth, even mid count-up. */
  value: number
  /** The ceiling, for a bounded value: lives out of three, step two of five. */
  max?: number
  /** The floor, when it is not zero. */
  min?: number
  /** How much it just moved, signed. Renders as a change beside the number. */
  delta?: number
  /**
   * Whether the host has confirmed this number. Absent means it was never in
   * doubt. `optimistic` is a local render the host has yet to reconcile, and
   * `corrected` is the host disagreeing with what the player already saw.
   */
  settlement?: StatSettlement
  /** Time or resource nearly gone. The host decides where that line is. */
  critical?: boolean
  /**
   * Time or resource going, but not nearly gone: the step before `critical`.
   * The host decides where that line is too. Setting both is allowed and
   * critical wins the drawing, the way `disabled` wins over `locked`.
   */
  warning?: boolean
  /** The silhouette. Does not change what the number means or how it is announced. */
  presentation?: StatPresentation
  /** Which way it travels on its own. A timer needs it; one sample cannot say. */
  direction?: 'up' | 'down'
  /** Stopped, not finished. */
  paused?: boolean
  /** Reached the end of its range: a quest done, a timer run out. */
  complete?: boolean
  /** The word beside the number. Defaults to the kind. */
  label?: string
  /** Render the value as something other than the bare number, e.g. `1:30`. */
  format?: (value: number) => string
  /**
   * What to show on screen when it differs from what should be announced. A
   * count-up passes the number mid-flight here; `value` stays the settled one,
   * so the accessible name never reads a number the player is not keeping.
   * Without this a wrapper has to build a second root and mirror the name,
   * which is how a second state vocabulary gets born.
   */
  display?: string
  /**
   * The registry item name a wrapper wants on the root. `score`, `timer`,
   * `lives` and `streak` are their own components to a host and to a test, and
   * a HUD carrying three of these needs to tell them apart, so a wrapper says
   * which one it is rather than every one of them reading `stat`.
   */
  component?: string
}

/**
 * The words that go with the states, from the attribute contract. They live
 * here so that score, timer, lives and streak cannot ship four vocabularies for
 * the same three states.
 */

/**
 * Which motion a change earns, by kind and direction. From the drawing's own
 * notes beside each object: `motion.pop` on the score chip and the streak
 * (3b, 3i), `motion.shake` on a life lost (4c), `motion.reveal` on a level up
 * (3i). A timer changes every second and a round changes by the host's hand,
 * so neither is an event and neither moves. Rank is the one number where down
 * is good: third to first is a gain, so a smaller rank pops.
 *
 * The value that changed carries the motion, except a life lost, which shakes
 * the whole pill: the drawing shakes the object, and a dot cannot shake on its
 * own without saying which dot went.
 */
type StatMotion = 'pop' | 'shake' | 'reveal'

const MOTION_ON_CHANGE: Partial<Record<StatKind, { up?: StatMotion; down?: StatMotion }>> = {
  score: { up: 'pop' },
  streak: { up: 'pop' },
  multiplier: { up: 'pop' },
  xp: { up: 'pop' },
  level: { up: 'reveal' },
  rank: { down: 'pop' },
  lives: { down: 'shake' },
}

/**
 * The motion the last change earned, and a counter that replays it.
 *
 * A capability plays on mount (motion.css), so replaying one is remounting the
 * element that carries it, and the counter is that element's `key`. The
 * previous value is kept in state and compared during render, the pattern
 * React documents for deriving from a prop change, so the motion lands in the
 * same commit as the new number rather than one commit later. First render
 * earns nothing: a stat arriving on screen is not a change.
 */
function useMotionOnChange(kind: StatKind, value: number) {
  const [previous, setPrevious] = React.useState(value)
  const [motion, setMotion] = React.useState<{ name: StatMotion; replay: number } | null>(null)
  if (value !== previous) {
    setPrevious(value)
    const table = MOTION_ON_CHANGE[kind]
    const name = value > previous ? table?.up : table?.down
    if (name) setMotion((last) => ({ name, replay: (last?.replay ?? 0) + 1 }))
  }
  return motion
}

export function Stat(props: StatProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    critical: copy['stat.runningOut'],
    warning: copy['stat.going'],
    paused: copy['stat.paused'],
    corrected: copy['stat.updated'],
    complete: copy['stat.complete'],
  } as const
  const {
    kind,
    value,
    max,
    min,
    delta,
    settlement,
    critical = false,
    warning = false,
    presentation = 'plain',
    mark,
    direction,
    paused = false,
    label,
    format,
    display,
    component = 'stat',
    complete = false,
    className,
    ...rest
  } = componentProps

  // What is announced is always the settled value. What is rendered may be
  // mid-animation. Keeping them separate is the whole reason `display` exists.
  const announced = format ? format(value) : String(value)
  const rendered = display ?? announced

  // The name carries the state, because a screen reader user gets no colour, no
  // glyph and no motion. Order matters: what it is, then the number, then what
  // is true about it.
  const words = [label ?? copy[`stat.${kind}`], max === undefined ? announced : copy['stat.valueOfMax'](announced, max)]
  // Critical is the stronger claim, so a stat that is both says the stronger
  // word once rather than both words in a row.
  if (critical) words.push(STATE_WORD.critical)
  else if (warning) words.push(STATE_WORD.warning)
  if (paused) words.push(STATE_WORD.paused)
  if (complete) words.push(STATE_WORD.complete)
  if (settlement === 'corrected') words.push(STATE_WORD.corrected)

  // Marks are a drawing of `value` against `max`, so there is nothing to draw
  // without a `max`. A marked presentation with no ceiling degrades to the
  // number rather than throwing or rendering an empty row: a host that has not
  // said how many lives there are has a bug in its props, not in its game.
  const marks =
    (presentation === 'dots' || presentation === 'pips') && max !== undefined
      ? markStates(presentation, value, max)
      : []

  const motion = useMotionOnChange(kind, value)
  // The shake is the whole object's; everything else is the number's. Keying
  // the root remounts its DOM and nothing else: this component's own state,
  // the motion included, lives above the element and survives.
  const rootMotion = motion?.name === 'shake' ? motion : null
  const valueMotion = motion && motion.name !== 'shake' ? motion : null

  // A critical stat pulses: the drawing's timer at three seconds swells by
  // 1.06 on motion.pulse (3b, and the 5f notes), and a beat is what a player
  // reads from the corner of an eye before the colour registers. A loop, so it
  // is a state of the root and not a replayed change; a shake in flight wins
  // the attribute for its 400ms, then the pulse resumes. Every silhouette,
  // because the presentation changes the shape and never the attributes
  // (stat.test.tsx holds that line): running out is a state, and a state
  // reads the same whether it is drawn in a pill or on the page.
  const pulsing = critical

  // How much room the number keeps. `min-inline-size` in `ch`, so a timer
  // going from 10 to 9 does not narrow and pull the pill in after it, and a
  // score growing a digit has the room already if the host said what `max` is.
  // A digit is one `ch` in tabular numerals; a separator (the colon in 0:09,
  // the comma in 12,450) is narrower and reserves half.
  const widest = max !== undefined && String(max).length > rendered.length ? String(max) : rendered
  const digits = widest.replace(/[^0-9]/g, '').length + widest.replace(/[0-9]/g, '').length / 2

  return (
    <div
      {...rest}
      key={rootMotion?.replay}
      className={['gs-stat', className].filter(Boolean).join(' ')}
      data-gs-motion={rootMotion?.name ?? (pulsing ? 'pulse' : undefined)}
      data-gs-animates={rootMotion || pulsing ? 'motion' : undefined}
      data-gs-component={component}
      data-gs-stat={kind}
      data-gs-presentation={presentation}
      data-gs-value={value}
      data-gs-max={max}
      data-gs-min={min}
      data-gs-delta={delta}
      data-gs-settlement={settlement}
      data-gs-critical={critical ? 'true' : undefined}
      data-gs-warning={warning ? 'true' : undefined}
      data-gs-direction={direction}
      data-gs-paused={paused ? 'true' : undefined}
      data-gs-complete={complete ? 'true' : undefined}
      role="group"
      aria-label={words.join(', ')}
    >
      <span className="gs-stat__label" data-gs-scope="stat" data-gs-part="label" aria-hidden="true">
        {label ?? copy[`stat.${kind}`]}
      </span>
      {/* aria-hidden throughout: the group's label above is the accessible name,
          and announcing the pieces again would read the number twice. */}
      {/* The number pops (or, for a level, reveals) when it changes for the
          better. The key is what replays it: a new key is a new element, and a
          capability plays on mount. Motion, because it scales; the colour that
          says which way it went is on the delta's sign and survives. */}
      <span
        key={valueMotion?.replay}
        className="gs-stat__value gs-display-type"
        style={{ ['--gs-stat-digits' as string]: digits }}
        data-gs-scope="stat" data-gs-part="value"
        data-gs-motion={valueMotion?.name}
        data-gs-animates={valueMotion ? 'motion' : undefined}
        aria-hidden="true"
      >
        {rendered}
        {/* The marks already draw the ceiling, so "1/3" beside three dots is the
            same fact twice and the design draws neither lives nor rounds that
            way. `data-gs-max` and the accessible name still carry it. */}
        {max !== undefined && marks.length === 0 ? (
          <span className="gs-stat__max">/{max}</span>
        ) : null}
      </span>
      {marks.length ? (
        // One element for the whole row rather than one attribute per mark: the
        // number lives on the root, and a mark carrying its own state would be a
        // second place to read it from. `emphasis`, not `motion`: the marks
        // change shape and never move, which is the whole point of drawing them.
        <span
          className="gs-stat__marks"
          data-gs-scope="stat" data-gs-part="marks"
          data-gs-animates="emphasis"
          aria-hidden="true"
        >
          {marks.map((state, index) => (
            <span key={index} className={`gs-stat__mark gs-stat__mark--${state}`}>
              {mark?.(state, index)}
            </span>
          ))}
        </span>
      ) : null}
      {delta !== undefined && delta !== 0 ? (
        // The change floats up and fades over `motion.floatUp`, the drawing's
        // "+100" rising beside the score, and settles back to rest beside the
        // number. It moves, so it is motion and stops dead under reduced
        // motion. Its colour is carried by the sign in the attribute, which is
        // emphasis and survives, so a player who cannot see it move still sees
        // which way it went. Keyed on the value so the same delta twice in a
        // row (+10, +10) rises twice.
        <span
          key={`${value}:${delta}`}
          className="gs-stat__delta"
          data-gs-scope="stat" data-gs-part="delta"
          data-gs-motion="floatup"
          data-gs-animates="motion"
          aria-hidden="true"
        >
          {delta > 0 ? '+' : '−'}
          {Math.abs(delta)}
        </span>
      ) : null}
      {critical ? (
        <span
          className="gs-stat__glyph"
          data-gs-scope="stat" data-gs-part="glyph"
          data-gs-animates="emphasis"
          aria-hidden="true"
        >
          !
        </span>
      ) : null}
    </div>
  )
}
