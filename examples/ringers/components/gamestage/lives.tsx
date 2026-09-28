'use client'

import { type StringsOverrides } from './strings'

import * as React from 'react'

// stat renders the number, the label, the change beside it, the accessible name
// and — since GSUI-100 — the row of dots. This file adds nothing but the word
// `lives` and the presentation that draws it.
import { Stat, type StatPresentation } from './stat'

/**
 * Lives: how many attempts a player has left, drawn as a pill of dots.
 *
 * A thin wrapper over `stat` (BDS-021), and since GSUI-100 it is finally thin.
 * It renders no number of its own, owns no tabular numerals, invents no
 * accessible-name vocabulary and now draws nothing either: `data-gs-value`,
 * `data-gs-max`, `data-gs-delta`, the label, the announcement, the critical
 * treatment and the dots are all `stat`'s. What is left is the kind, the
 * component name and the silhouette, which is what a wrapper should be.
 *
 * ## Dots, where this used to draw hearts
 *
 * The design draws a ringed pill of filled circles with a dashed circle for the
 * one that is gone. This drew a solid heart and a cracked one. Neither is wrong
 * on its own, but the dashed slot is what says "this can come back", and a
 * broken heart says the opposite — which is the wrong thing to say about the
 * one resource in a game that is designed to be replenished.
 *
 * The property that mattered about the hearts is kept: the two marks differ in
 * fill, in stroke style and in weight, so a player who cannot see the colour, a
 * greyscale screenshot and a printed page all still show which lives are left.
 *
 * ## Zero is a value
 *
 * `value` is lives remaining and `max` the total, so zero reads like every other
 * stat: `data-gs-value="0"` with `data-gs-max="3"`, announced as "lives, 0 of
 * 3", and the row still draws three dashed dots so the player can see what they
 * had. A life just lost is `delta={-1}`, the same change-beside-the-number every
 * stat has; there is no separate lost state, because two sources for one fact
 * drift.
 *
 * The dots carry no attributes. A test asserting "three dots, one held" asserts
 * `data-gs-value` and `data-gs-max` on the root, never a count of marks: an
 * attribute per mark would be a second source of truth for one number.
 *
 * It performs nothing. It does not take a life, decide when one life left is
 * critical, or report anything back. The host owns the number.
 */

export interface LivesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides
  /** Lives remaining. Zero is a state, not an absence. */
  value: number
  /** The total the player started with. */
  max: number
  /** How much it just moved, signed. A life lost is `-1`. */
  delta?: number
  /** Down to the last of them. The host decides where that line is. */
  critical?: boolean
  /** The word beside the dots. Defaults to "lives". */
  label?: string
  /** The silhouette. A pill of dots is what the design draws. */
  presentation?: StatPresentation
  /**
   * The drawing inside each life, when a dot is wrong for the game. Called per
   * mark with its state, `held` or `spent`, so the two can differ. The default
   * is the dot the design draws and most games should keep it.
   */
  mark?: (state: string, index: number) => React.ReactNode
}

export function Lives({
  value,
  max,
  delta,
  critical,
  label,
  presentation = 'dots',
  mark,
  className,
  ...rest
}: LivesProps) {
  return (
    // No wrapper: `stat` takes `component` as a prop and now draws the dots too,
    // so lives names its own root without a second element, exactly as `timer`
    // and `round` already did. The wrapper existed to hold the hearts; there are
    // no hearts.
    <Stat
      {...rest}
      className={className}
      component="lives"
      kind="lives"
      value={value}
      max={max}
      delta={delta}
      critical={critical}
      label={label}
      presentation={presentation}
      mark={mark}
    />
  )
}
