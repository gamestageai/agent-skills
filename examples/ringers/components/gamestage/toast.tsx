'use client'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Toast, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './toast.css'

/**
 * Toast: a short message from the application, not from the game.
 *
 * Specimen 5c's notes: top of the container, 44 tall, a pill at the floating
 * depth, three seconds, one at a time. Reconnecting, saved, copied. A game
 * outcome never uses it; that is `feedback`, which knows how to celebrate and
 * how to be wrong. A toast knows neither, and is deliberately quiet: a status
 * region a screen reader mentions without interrupting, no focus, no trap,
 * nothing to press.
 *
 * One at a time is the host's job: this renders the one message it is given
 * and reports when its time is up. A host with a queue shows the head of it
 * and advances on `onDismiss`. It never fetches, never decides what to say
 * and never remembers what it said.
 */
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered when true, unmounted when false. */
  open: boolean
  /** Called when the time is up. The host closes it; a toast does not close itself. */
  onDismiss: () => void
  /** How long it stays, in milliseconds. The drawing says three seconds. `Infinity` stays until the host closes it. */
  duration?: number
  /** An optional mark before the words: a tick beside Saved. From the glyph set. */
  glyph?: React.ReactNode
}

const DURATION = 3000

export function Toast({ open, onDismiss, duration = DURATION, glyph, className, children, ...rest }: ToastProps) {
  // The handler is read through a ref so the clock is set once per opening,
  // not restarted by every re-render of the host.
  const dismissRef = React.useRef(onDismiss)
  dismissRef.current = onDismiss

  React.useEffect(() => {
    // setTimeout coerces Infinity to 0, which would dismiss a toast the host
    // asked to keep at once; so a non-finite duration sets no clock at all.
    if (!open || !Number.isFinite(duration)) return
    const timer = window.setTimeout(() => dismissRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [open, duration])

  if (!open) return null

  return (
    <div
      {...rest}
      className={['gs-toast', className].filter(Boolean).join(' ')}
      data-gs-component="toast"
      data-gs-motion="fade"
      data-gs-animates="emphasis"
      // Status, never alert: nothing here is urgent enough to interrupt a round.
      role="status"
      aria-live="polite"
    >
      {glyph !== undefined ? (
        <span className="gs-toast__glyph" data-gs-scope="toast" data-gs-part="glyph" data-gs-animates="emphasis" aria-hidden="true">
          {glyph}
        </span>
      ) : null}
      <span className="gs-toast__label" data-gs-scope="toast" data-gs-part="label">
        {children}
      </span>
    </div>
  )
}
