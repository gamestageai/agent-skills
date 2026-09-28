'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The four wrappers and the base they all sit on. These imports come first on
// purpose: an ES module's imports are evaluated in source order, so every
// stylesheet below this line has already been injected by the time `hud.css`
// is, and a rule in hud.css wins a tie with one in stat.css or lives.css
// wherever the two have equal specificity. That ordering is the only guarantee
// the library has, and it exists because hud depends on them rather than
// because anything schedules it.
import { Score, type ScoreProps } from './score'
import { Timer, type TimerProps } from './timer'
import { Lives, type LivesProps } from './lives'
import { Streak, type StreakProps } from './streak'
import { Stat, type StatProps } from './stat'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Hud, and `tsc --noEmit` passes on it, so the
// gate cannot catch it.
import './hud.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

/**
 * Hud: everything true about the game right now, as one object.
 *
 * It is the library's first component made of components, and it is deliberately
 * thin. It renders no number, no glyph and no accessible-name vocabulary of its
 * own: the score is `score`, the clock is `timer`, the hearts are `lives`, the
 * flame is `streak`, and anything else the host wants is `stat`. What the HUD
 * adds is the row: which of them are present, in what order, and where on the
 * screen the group sits.
 *
 * It carries no `data-gs-value`. A HUD has no number, and a container that
 * repeated one of the numbers inside it would give a test two elements
 * answering for the same fact. `[data-gs-component="hud"] [data-gs-stat="score"]`
 * finds the score; nothing about the HUD needs to be parsed to get there.
 *
 * It performs nothing, with one exception it does not own: `timer` holds a real
 * clock, and passing a `timer` here starts it, exactly as rendering a `Timer`
 * would. The HUD adds no behaviour to it and forwards `onExpire` untouched.
 */

export type HudPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

/** What `score` needs, minus the things the HUD decides. */
export type HudScore = Omit<ScoreProps, 'component'>
export type HudTimer = Omit<TimerProps, 'component'>
export type HudLives = LivesProps
export type HudStreak = StreakProps

/**
 * An extra number the four named ones do not cover: a round, a rank, a
 * multiplier, an XP total. It is a `stat` and nothing more, so a host adding
 * one gets the same typeface, the same tabular numerals and the same
 * announcement as the four above rather than a second way of writing a number.
 *
 * Its `id` is the element's id, reaches the DOM, and is also what keeps React's
 * list stable. It is not a second identifier the HUD swallows: two names for
 * one thing is exactly what this library refuses everywhere else. Two stats of
 * the same kind in one HUD therefore need ids, and without them React has two
 * rows claiming the same key.
 */
export type HudStat = Omit<StatProps, 'component'>

export interface HudProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The score. Omit it and no score renders; there is no zero by default. */
  score?: HudScore
  /** The clock. Passing one starts it, because that is what `timer` does. */
  timer?: HudTimer
  /** Attempts left. */
  lives?: HudLives
  /** How many in a row. */
  streak?: HudStreak
  /** Anything the four above do not cover, rendered after them in order. */
  stats?: HudStat[]
  /** Where the group sits in whatever contains it. Defaults to `top`. */
  placement?: HudPlacement
  /** The word for the group as a whole. Defaults to "game status". */
  label?: string
}

export function Hud(props: HudProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    score,
    timer,
    lives,
    streak,
    stats,
    placement = 'top',
    label = copy['hud.label'],
    className,
    ...rest
  } = componentProps

  return (
    <div
      {...rest}
      className={['gs-hud', className].filter(Boolean).join(' ')}
      data-gs-component="hud"
      data-gs-placement={placement}
      // A group rather than a region or a toolbar: the parts are related and
      // none of them is a landmark or a control. The name is the group's own
      // and every stat inside keeps its, so a screen reader reads "game status"
      // and then each number, rather than one run-on sentence.
      role="group"
      aria-label={label}
    >
      {score ? <Score strings={copy} {...score} /> : null}
      {timer ? <Timer strings={copy} {...timer} /> : null}
      {lives ? <Lives strings={copy} {...lives} /> : null}
      {streak ? <Streak strings={copy} {...streak} /> : null}
      {stats?.map((stat) => <Stat strings={copy} key={stat.id ?? stat.kind} {...stat} />)}
    </div>
  )
}
