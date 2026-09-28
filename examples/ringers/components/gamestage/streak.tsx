'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// stat renders the number, the label, the change beside it and the accessible
// name. This file adds the rising mark and nothing else.
import { Stat, type StatPresentation } from './stat'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Streak, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './streak.css'

// The cue runtime. `./feel` is a local re-export shim in this repo and the
// installed sibling file in a host application, so the one specifier resolves
// in both places. With no provider above it, `useGameFeel` is a no-op.
import { useGameFeel } from './feel'

/**
 * Streak: how many in a row, drawn as a reward pill with a rising mark.
 *
 * A thin wrapper over `stat` (BDS-021). It renders no number of its own, owns
 * no tabular numerals and invents no accessible-name vocabulary: `data-gs-value`,
 * `data-gs-delta`, the label and the announcement all come from `stat`. What
 * streak adds is the mark, a triangle pointing up, lit while the run is alive.
 *
 * ## The drawing, not the flame
 *
 * Specimen 3b draws the streak as a pill in the reward colour holding a small
 * upward triangle and the count written `x5`, and draws a broken streak as a
 * smaller, dimmer pill reading `x0` with no mark at all. This used to draw a
 * flame that went out. The drawing wins: the lit pill and the broken one differ
 * in size, in fill, in the size of the number and in whether there is a mark,
 * so a player who cannot see the colour, a greyscale screenshot and a printed
 * page all still show which one they are looking at.
 *
 * A broken streak is `value={0}`, which is a real state and reads like every
 * other zero: `data-gs-value="0"`, announced as "streak, 0". There is no
 * separate broken attribute, because the number already says it and a second
 * name for one fact drifts from the first. The `x` in front of the number is
 * rendering only: `display` carries it, so the accessible name still says the
 * bare count.
 *
 * A streak carries no `max`, deliberately. It has no ceiling, so there is
 * nothing for `data-gs-max` to hold and "7 of 7" would read as complete.
 *
 * It performs nothing. It does not count, break, or decide when a streak is
 * about to go. The host owns the number.
 */

export interface StreakProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** How many in a row. Zero is a broken streak, which is a state. */
  value: number
  /** How much it just moved, signed. One more in a row is `1`. */
  delta?: number
  /** About to go. The host decides where that line is. */
  critical?: boolean
  /** The word beside the mark. Defaults to "streak". */
  label?: string
  /**
   * The silhouette of the number inside. The design draws the streak as a pill
   * rather than as a label above a bare number (GSUI-100); the mark sits beside
   * it either way.
   */
  presentation?: StatPresentation
}

/**
 * The rising mark: a triangle 16 wide and 14 tall, which is what the drawing
 * builds out of borders. Drawn on a 16px box so the icon token sizes it.
 * currentColor throughout: the mark names no colour, so a theme owns it.
 */
const RISE = 'M8 1L16 15H0Z'

function Rise() {
  return (
    <svg className="gs-streak__rise" viewBox="0 0 16 16" focusable="false" aria-hidden="true">
      <path d={RISE} fill="currentColor" />
    </svg>
  )
}

export function Streak(props: StreakProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    value,
    delta,
    critical,
    label,
    presentation = 'pill',
    className,
    ...rest
  } = componentProps

  const lit = value > 0
  // The design, specimen 3d: "grow: motion.pop · sfx.streak(n)". The host owns
  // the number, so growing is a change in the prop and nothing else. A HUD
  // mounting at streak 5 has not just gone from 4 to 5, so the first render
  // fires nothing; so does a streak that breaks, which is a drop and has its
  // own drawing already.
  const { cue } = useGameFeel()
  const previous = React.useRef<number | null>(null)
  const [popping, setPopping] = React.useState(false)

  React.useEffect(() => {
    const was = previous.current
    previous.current = value
    if (was === null || value <= was) return
    // "grow: motion.pop · sfx.streak(n)", and n is the run's new length. The
    // host decides what a streak of eight sounds like against a streak of
    // two; this says which it is. A component naming a pitch would be
    // performing rather than reporting.
    cue('streak', 'sfx', value)
    // Specimen 4d draws the same moment as haptic.medium, which the catalogue
    // words as "commit, streak, GO".
    cue('medium', 'haptic')
    setPopping(true)
  }, [value, cue])

  return (
    <div
      {...rest}
      className={['gs-streak', className].filter(Boolean).join(' ')}
      data-gs-component="streak"
      // Only while it is popping. The attribute is a claim that this element is
      // animating now, and an element carrying it with no animation on it is an
      // element reduced motion takes nothing away from. Cleared by the
      // animation itself rather than by a duration written down twice.
      data-gs-animates={popping ? 'motion' : undefined}
      onAnimationEnd={(event) => {
        rest.onAnimationEnd?.(event)
        if (event.target === event.currentTarget) setPopping(false)
      }}
    >
      {/*
        The reserved `glyph` part: the state carried without colour, and drawn
        before the number because that is the order the drawing puts them in.
        Stat renders a glyph of its own when critical, nested inside itself, so
        a test reaches this one as a direct child of the streak root and the
        two never collide.

        Only while the streak is alive: the drawing's broken pill has no mark,
        and the pill's own size and fill are what say it went out.

        `emphasis`, not `motion`: the mark changes and never moves, so it
        survives reduced motion, which is the whole point of drawing it.
      */}
      {lit ? (
        <span
          className="gs-streak__glyph"
          data-gs-scope="streak" data-gs-part="glyph"
          data-gs-animates="emphasis"
          aria-hidden="true"
        >
          <Rise />
        </span>
      ) : null}
      <Stat
        strings={copy}
        kind="streak"
        label={label}
        value={value}
        display={copy['streak.value'](value)}
        delta={delta}
        critical={critical}
        presentation={presentation}
      />
    </div>
  )
}
