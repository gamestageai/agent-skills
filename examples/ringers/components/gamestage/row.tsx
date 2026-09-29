'use client'

import * as React from 'react'

import { CrossGlyph, TickGlyph } from './glyphs'
import { useStrings, type StringsOverrides } from './strings'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Row, and `tsc --noEmit` passes on it, so the
// gate cannot catch it.
import './row.css'

// The shared rule sets, so the theme's press gesture reaches a row the player
// can open. GSUI-118: the file shipped with the tokens and nothing imported it,
// so the classes matched nothing in a real install.
import './gamestage-primitives.css'

/**
 * Row: the shell four specimens draw the same way.
 *
 * The ticket that asked for this (GSUI-190) stated a doubt with it, and the
 * doubt is worth keeping in the file rather than in a closed ticket: the 4d
 * twin calls these rows the host's, and a row is close to being nothing. What
 * settled it is that four specimens draw one shell and none of them agree by
 * accident. 4d's settings row is 50px and its Recent row 48; 4e's failed
 * submit is 52 and 4f's code row 56; every one of them is the surface fill,
 * a 3px edge, a radius of 14, a label that gives way and something at the end
 * that does not. Four hosts writing that four times is four chances to get
 * the truncation wrong, which is the one part of it that is not obvious.
 *
 * So the shell is here and the contents are not. It owns the box, the
 * height, the edge and the way a long label gives way before the value does.
 * It owns no words, no chevron and no toggle: what sits at the end arrives as
 * `actions`, because 4d puts a `toggle` there, 4e puts a retry control there
 * and 4f puts a field and a button there, and a component that tried to be
 * all three would be a worse version of each.
 *
 * Two presentations, which are the two the drawing distinguishes. `settings`
 * is a label and a control. `history` adds the result disc at the front and
 * the delta at the end: what the player did, and what it was worth.
 *
 * It performs nothing. It does not navigate, settle a result or know what a
 * delta means.
 */

export type RowPresentation = 'settings' | 'history'

/**
 * How a settled row turned out. The same two words the rest of the library
 * uses for a settled outcome, on the same attribute, so a host styling every
 * correct thing on a screen writes one selector. `rewarded` is deliberately
 * not offered: a reward is an object with a lifecycle and it has `reward` and
 * `badge` to be drawn by, not a line in a list.
 */
export type RowState = 'correct' | 'wrong'

export interface RowProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** What the row is: a setting's name, a game's name. Host copy, always. */
  label: string
  /**
   * The reading at the end: a delta of +320, a score of 2 of 5, a value a
   * setting currently holds. A node rather than a string, because a host may
   * want a `stat` there and this has no opinion about numbers.
   */
  value?: React.ReactNode
  /**
   * What sits at the end and is not a reading: the `toggle` specimen 4d draws
   * on its settings rows, a retry control, a chevron the host supplies. The
   * row never draws one of these itself.
   */
  actions?: React.ReactNode
  /** Which of the two shells. See the note at the top. */
  presentation?: RowPresentation
  /**
   * How a settled history row turned out. Draws the result disc at the front
   * and reaches `data-gs-state`. Absent means the row is not a result, which
   * is every settings row.
   */
  state?: RowState
  /**
   * The player opening the row. Supplying it makes the whole row a button;
   * what opens next is the host's. Leave it off and the row is a line of
   * text, which is what specimen 4d's Recent rows are.
   */
  onSelect?: () => void
}

export function Row(props: RowProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    label,
    value,
    actions,
    presentation = 'settings',
    state,
    onSelect,
    className,
    ...rest
  } = componentProps

  const attributes = {
    ...rest,
    className: ['gs-row', onSelect ? 'gs-pressable' : null, className].filter(Boolean).join(' '),
    'data-gs-component': 'row',
    'data-gs-presentation': presentation,
    'data-gs-state': state,
  }

  const inner = (
    <>
      {/* The result, as a filled disc with the mark knocked out of it rather
          than a coloured outline. Two things at once, per BDS-012: the fill
          and the shape of the mark. The word is beside it, clipped, because a
          player who cannot tell green from red still has to know. */}
      {state ? (
        <span
          className="gs-row__glyph"
          data-gs-scope="row"
          data-gs-part="glyph"
          data-gs-animates="emphasis"
        >
          {state === 'correct' ? <TickGlyph /> : <CrossGlyph />}
          <span className="gs-row__announcement">{copy[`row.${state}`]}</span>
        </span>
      ) : null}
      <span className="gs-row__label" data-gs-scope="row" data-gs-part="label">
        {label}
      </span>
      {value !== undefined ? (
        <span className="gs-row__value gs-display-type" data-gs-scope="row" data-gs-part="value">
          {value}
        </span>
      ) : null}
      {actions ? (
        <span className="gs-row__actions" data-gs-scope="row" data-gs-part="actions">
          {actions}
        </span>
      ) : null}
    </>
  )

  // A row the player can open is a real button, so Enter and Space work with
  // no key handling of our own. A row they cannot is a line of text and not a
  // widget: no role, no name to compute, nothing for a screen reader to
  // announce twice. A `role="group"` here would have needed an aria-label,
  // and an aria-label cannot hold the value, which is a node.
  if (!onSelect) {
    return <div {...attributes}>{inner}</div>
  }

  return (
    <button {...attributes} type="button" onClick={onSelect}>
      {inner}
    </button>
  )
}
