'use client'

import * as React from 'react'

import { Button } from './button'

// The shared rule sets, so the theme's action face and press gesture reach the
// control this surface renders. GSUI-118: the file shipped and nothing imported
// it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled ErrorState, and `tsc --noEmit` passes on it,
// so the gate cannot catch it.
import './error-state.css'
import { CrossGlyph } from './glyphs'

/**
 * ErrorState: the surface that failed, naming the cause and the next action.
 *
 * BDS-042: "something went wrong" leaves the player with nothing to do, which
 * is worse than the error. So this component cannot be rendered without a
 * cause and cannot be rendered without a next step. Both are required props,
 * and the control is rendered here rather than passed in, which is what makes
 * `data-gs-next-action` appear exactly once for a test to count.
 *
 * ## Three shapes (GSUI-191)
 *
 * `panel` is the centred card of specimen 4e: the surface failed as a whole
 * and there is nothing for the card to sit beside. `inline` is the row where
 * the failure happened, for a submit that did not land. `banner` is the strip
 * across the top of a game that is still on screen, and it is the one shape
 * whose next step may be absent: the strip reads "Reconnecting, your answer is
 * saved", and the work is the system's rather than the player's.
 *
 * The rules the sheet gives with that strip belong to the host and are written
 * down here so nobody has to rediscover them. The banner goes at the top, the
 * game stays visible behind it, the inputs lock with `data-gs-locked` rather
 * than going a disabled grey, and the timer keeps counting from server time
 * when the connection returns. This component draws the strip and declares
 * `data-gs-busy`; it locks nothing and knows about no timer.
 *
 * It does not know what failed. `cause` is host-supplied and so is every word
 * on screen: the library has no network, no clock and no idea why a submit did
 * not land. `network`, `rejected`, `expired`, `not-found` and `unknown` are the
 * recommended vocabulary and not a closed set, which is why `cause` is a string
 * and not a union.
 *
 * It is never `data-gs-state="wrong"`. A network failure is not a wrong answer,
 * and conflating the two renders a failed submit with a cross and a
 * strikethrough. There is no apology here either, and there is no "oops": an
 * error names the cause and the next action, and nothing else.
 */

export type ErrorStateLayout = 'panel' | 'inline' | 'banner'

interface ErrorStateBaseProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * What went wrong, as a token the host chooses. `network`, `rejected`,
   * `expired`, `not-found` and `unknown` are recommended; a host with a cause
   * of its own writes its own word. It reaches `data-gs-error`, so a host can
   * style or count failures by cause without reading the copy.
   */
  cause: string
  /** The failure in a short line: "Offline", "Could not submit". */
  label: string
  /** The sentence under it: what was lost, and what was not. */
  children?: React.ReactNode
  /**
   * The cause in words, for the accessible name. Defaults to `cause`, which is
   * a machine token and reads badly; a host that cares passes the sentence a
   * person would say.
   */
  causeWord?: string
  /**
   * The host has asked and has not been answered yet: the socket is down and
   * reconnecting, the retry is in flight. Reaches `data-gs-busy`, which is how
   * a host locks the inputs around it (`data-gs-locked`, never a disabled
   * grey) without this component knowing anything about them. Declared by the
   * host; the library never infers it.
   */
  busy?: boolean
}

/**
 * The next step, and the one layout that is allowed not to have one.
 *
 * BDS-042 makes `actionLabel` and `onAction` required, because "something went
 * wrong" with nothing to do is worse than the error. The banner is the single
 * case where the next step is not the player's: specimen 4e's strip reads
 * "Reconnecting, your answer is saved", and the thing being done is being done
 * by the system. A Retry button there would offer the player a job that is
 * already running.
 *
 * So the requirement is moved into the type rather than dropped. A panel and a
 * row still cannot compile without both; a banner may have either both or
 * neither, and a banner that does pass them renders the control as the others
 * do.
 */
type ErrorStateAction =
  | {
      layout?: 'panel' | 'inline'
      /** The next step, as the verb of its outcome: "Try again". */
      actionLabel: string
      /** Called on the next-step control. The host owns the retry, not this. */
      onAction: () => void
    }
  | {
      /**
       * `panel` is the centred card of specimen 4e, for a surface that failed
       * as a whole. `inline` is the row that sits where the failure happened,
       * for a submit that did not land. `banner` is the strip across the top
       * of a game that is still on screen. Never a modal: a modal takes the
       * game away to report that part of it is unavailable.
       */
      layout: 'banner'
      actionLabel?: string
      onAction?: () => void
    }

export type ErrorStateProps = ErrorStateBaseProps & ErrorStateAction


export function ErrorState({
  cause,
  label,
  children,
  actionLabel,
  onAction,
  layout = 'panel',
  causeWord,
  busy = false,
  className,
  ...rest
}: ErrorStateProps) {
  // The accessible name is computed from the label element, which carries the
  // cause beside the visible text. A live region would be right for a failure
  // that arrives while the player is reading something else, and that is the
  // host's call to make with its own announcement, not this component's.
  const labelId = React.useId()

  return (
    <section
      {...rest}
      className={['gs-error-state', `gs-error-state--${layout}`, className]
        .filter(Boolean)
        .join(' ')}
      data-gs-component="error-state"
      data-gs-error={cause}
      // Which of the three shapes is rendering. It was a class and nothing
      // else, so a host styling across failures, or a test asking for the
      // banner specifically, had only the theme's own class name to go on,
      // which is the one thing a theme is allowed to change.
      data-gs-presentation={layout}
      data-gs-busy={busy ? 'true' : undefined}
      role="group"
      aria-labelledby={labelId}
    >
      {/* The banner draws a pulsing disc rather than a cross. A cross says the
          thing failed and stopped; the strip says it is failing and being
          worked on, and the beat is what tells a player at a glance that
          something is still happening. It loops, so it is the component's
          resting state and motion.css stops it under reduced motion, where
          the warning fill and the words still carry the whole message. */}
      {layout === 'banner' ? (
        <span
          className="gs-error-state__pulse"
          data-gs-scope="error-state"
          data-gs-part="pulse"
          data-gs-motion="pulse"
          data-gs-animates="motion"
          aria-hidden="true"
        />
      ) : (
        <span className="gs-error-state__glyph" data-gs-scope="error-state" data-gs-part="glyph">
          <CrossGlyph />
        </span>
      )}

      <div className="gs-error-state__words">
        <p id={labelId} className="gs-error-state__label" data-gs-scope="error-state" data-gs-part="label">
          {label}
          <span
            className="gs-error-state__announcement"
            data-gs-scope="error-state"
            data-gs-part="announcement"
          >
            {`, ${causeWord ?? cause}`}
          </span>
        </p>

        {children ? (
          <p className="gs-error-state__body" data-gs-scope="error-state" data-gs-part="body">
            {children}
          </p>
        ) : null}
      </div>

      {/* A banner without a next step renders no actions element at all,
          rather than an empty one: `data-gs-next-action` has to appear exactly
          once per failure a player can act on, and an empty actions row would
          leave a hole in the strip the drawing draws as one line. */}
      {actionLabel !== undefined && onAction !== undefined ? (
        <div className="gs-error-state__actions" data-gs-scope="error-state" data-gs-part="actions">
          {/* Which face the next step wears follows the drawing. A card offers
              the primary face, except that a game which has ended offers its
              results on the quieter secondary one: there is nothing to play. The
              row's control is the ghost, because a row inside the game cannot
              carry a second primary. All of them small: the drawing's state
              controls are 44px, not the 60px of a screen's main action. */}
          <Button
            variant={
              layout === 'panel' ? (cause === 'expired' ? 'secondary' : 'primary') : 'tertiary'
            }
            size="small"
            data-gs-next-action="true"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
