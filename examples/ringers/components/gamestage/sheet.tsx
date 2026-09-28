'use client'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Sheet, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './sheet.css'

import { Button } from './button'
import { trapFocus } from './trap'

/**
 * Sheet: a surface that rises from the bottom of its container for one short
 * job, then goes.
 *
 * Specimen 5c draws it: a scrim over the scene, a panel anchored to the foot of
 * the container with a grab handle, a header row of art, kicker, title and a
 * line of body, whatever the host puts in the middle, then a primary action and
 * a ghost under it. It is for reward detail, the options of a select on touch,
 * share, filters and "more". Anything taller than sixty percent of its
 * container is a page rather than a sheet, and the panel is capped there.
 *
 * It is modal while open, which is the opposite of the coach mark rule and
 * deliberately so: focus is held inside the panel, Escape closes it, the scrim
 * closes it, and focus goes back to whatever had it. It is unmounted rather
 * than hidden when closed. A dismissed coach mark stays in the DOM carrying
 * `data-gs-dismissed` because the host may bring it back; a sheet that has
 * been dismissed is gone, and whether the player closed it is the host's
 * state, not the sheet's.
 *
 * It positions against the nearest positioned ancestor, so a host puts one
 * inside the surface it belongs to, the way a coach mark is placed. It
 * performs nothing: it decides nothing about what the actions do and holds no
 * state of its own beyond where focus was.
 */

export interface SheetAction {
  /** The verb of its outcome: Claim, Share, Apply. */
  label: string
  onClick: () => void
}

export interface SheetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Rendered when true, unmounted when false. */
  open: boolean
  /** Called on the scrim, on Escape and on the ghost action. */
  onDismiss: () => void
  /** The accessible name of the dialog. Required, because a dialog needs one. */
  label: string
  /** The heading in the header row, if the sheet has one. */
  title?: string
  /** The small line above the heading, in the warning colour: PRIZE, UNCLAIMED. */
  kicker?: string
  /** The 88px art beside the heading, supplied by the host. */
  media?: React.ReactNode
  /** The line under the heading. */
  description?: string
  /** The one thing the sheet is for. Rendered as the library's primary button. */
  primaryAction?: SheetAction
  /** The way out that is not the scrim. Rendered as a ghost; dismisses as well. */
  secondaryAction?: SheetAction
}

export function Sheet({
  open,
  onDismiss,
  label,
  title,
  kicker,
  media,
  description,
  primaryAction,
  secondaryAction,
  className,
  children,
  ...rest
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  // The trap reads the latest handler through a ref so the effect runs once
  // per opening rather than once per render, which would move focus back to
  // the first control every time the host re-rendered.
  const dismissRef = React.useRef(onDismiss)
  dismissRef.current = onDismiss

  React.useEffect(() => {
    if (!open || !panelRef.current) return
    return trapFocus({ panel: panelRef.current, onEscape: () => dismissRef.current() })
  }, [open])

  if (!open) return null

  const header = title !== undefined || kicker !== undefined || media !== undefined || description !== undefined

  return (
    <div {...rest} className={['gs-sheet', className].filter(Boolean).join(' ')} data-gs-component="sheet">
      {/* A tap on the scrim dismisses. It is emphasis rather than motion: the
          scrim darkens, it does not move, so its fade survives reduced motion
          and is what remains of the entrance there. */}
      <div
        className="gs-sheet__scrim"
        data-gs-scope="sheet"
        data-gs-part="scrim"
        data-gs-motion="fade"
        data-gs-animates="emphasis"
        aria-hidden="true"
        onClick={onDismiss}
      />
      <div
        ref={panelRef}
        className="gs-sheet__panel"
        data-gs-scope="sheet"
        data-gs-part="panel"
        data-gs-motion="sheet"
        data-gs-animates="motion"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <span className="gs-sheet__thumb" data-gs-scope="sheet" data-gs-part="thumb" aria-hidden="true" />
        {header ? (
          <div className="gs-sheet__header">
            {media !== undefined ? (
              <div className="gs-sheet__media" data-gs-scope="sheet" data-gs-part="media">
                {media}
              </div>
            ) : null}
            <div className="gs-sheet__words">
              {kicker !== undefined ? (
                <span className="gs-sheet__note" data-gs-scope="sheet" data-gs-part="note">
                  {kicker}
                </span>
              ) : null}
              {title !== undefined ? (
                <span className="gs-sheet__label" data-gs-scope="sheet" data-gs-part="label">
                  {title}
                </span>
              ) : null}
              {description !== undefined ? (
                <span className="gs-sheet__body" data-gs-scope="sheet" data-gs-part="body">
                  {description}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
        {children !== undefined && children !== null ? <div className="gs-sheet__content">{children}</div> : null}
        {primaryAction || secondaryAction ? (
          <div className="gs-sheet__actions" data-gs-scope="sheet" data-gs-part="actions">
            {primaryAction ? (
              <Button variant="primary" data-gs-scope="sheet" data-gs-part="commit" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button
                variant="tertiary"
                data-gs-scope="sheet"
                data-gs-part="dismiss"
                onClick={() => {
                  secondaryAction.onClick()
                  onDismiss()
                }}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
