'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

import { Button } from './button'

// The shared rule sets, so the theme's action face and press gesture reach the
// control this surface renders. GSUI-118: the file shipped and nothing imported
// it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled EmptyState, and `tsc --noEmit` passes on it,
// so the gate cannot catch it.
import './empty-state.css'
import { EmptyBoxGlyph } from './glyphs'

/**
 * EmptyState: the surface with nothing to show, and the way out of it.
 *
 * BDS-042: never a blank scene. A surface with no content says what is missing,
 * says what fills it, and gives the player the control that does so. A shrug is
 * not an empty state. Nor is an illustration with no action under it: a player
 * who arrives at an inventory before they have won anything needs the way to
 * win something, on this screen, now.
 *
 * `data-gs-next-action` is how that is enforced rather than asserted. Exactly
 * one control inside carries it, and the control is rendered from `actionLabel`
 * and `onAction` rather than passed in as a node, so the count is a property of
 * the component and not of whatever the host happened to nest.
 *
 * It performs nothing. It does not fetch the missing content, retry, or decide
 * that the surface is empty. The host knows that and renders this instead.
 */

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** What is missing, as a short line: "No rewards yet". */
  label: string
  /** The sentence under it, saying what fills the surface. */
  children?: React.ReactNode
  /** The next step, as the verb of its outcome: "Play a round". */
  actionLabel: string
  /** Called on the next-step control. The host owns everything behind it. */
  onAction: () => void
  /**
   * Placeholder rows, drawn to show the shape of what is coming. Specimen 4e
   * draws two above an empty leaderboard, and they are decoration: they carry
   * no text and are hidden from assistive technology, because a screen reader
   * reading out two empty rows is worse than silence.
   */
  ghosts?: number
  /**
   * The word the accessible name carries for `data-gs-empty`. The contract
   * fixes the English as "nothing here yet"; a host may translate it, and what
   * may not change is that the name says the surface is empty.
   */
  stateWord?: string
}

export function EmptyState(props: EmptyStateProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    label,
    children,
    actionLabel,
    onAction,
    ghosts = 0,
    stateWord = copy['empty-state.stateWord'],
    className,
    ...rest
  } = componentProps

  // The accessible name is computed from the label element, which carries the
  // state word beside the visible text. aria-label would take a string and lose
  // it; a live region would announce on every mount, and an empty surface is
  // not news.
  const labelId = React.useId()

  return (
    <section
      {...rest}
      // Two arrangements, as specimen 4e draws them: a row with the mark beside
      // the words on a card, or ghost rows above one quiet line and no card.
      className={['gs-empty-state', ghosts > 0 ? 'gs-empty-state--ghosts' : null, className]
        .filter(Boolean)
        .join(' ')}
      data-gs-component="empty-state"
      data-gs-empty="true"
      role="group"
      aria-labelledby={labelId}
    >
      {ghosts > 0 ? (
        <div className="gs-empty-state__ghosts" aria-hidden="true">
          {Array.from({ length: ghosts }, (_, index) => (
            <span key={index} className="gs-empty-state__ghost" />
          ))}
        </div>
      ) : null}

      <span className="gs-empty-state__glyph" data-gs-scope="empty-state" data-gs-part="glyph">
        <EmptyBoxGlyph />
      </span>

      <div className="gs-empty-state__words">
        <p id={labelId} className="gs-empty-state__label" data-gs-scope="empty-state" data-gs-part="label">
          {label}
          <span className="gs-empty-state__announcement" data-gs-scope="empty-state" data-gs-part="announcement">
            {`, ${stateWord}`}
          </span>
        </p>

        {children ? (
          <p className="gs-empty-state__body" data-gs-scope="empty-state" data-gs-part="body">
            {children}
          </p>
        ) : null}

        <div className="gs-empty-state__actions" data-gs-scope="empty-state" data-gs-part="actions">
          {/* Small, because the drawing's state cards carry 44px controls. */}
          <Button strings={copy} variant="primary" size="small" data-gs-next-action="true" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </section>
  )
}
