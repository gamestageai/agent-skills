'use client'

import { useStrings, withStringValue, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled CodeEntry, and `tsc --noEmit` passes on it,
// so the gate cannot catch it.
import './code-entry.css'
// The shared rule sets, so the resend control carries the theme's action type
// and press gesture without this file re-declaring either (GSUI-118).
import './gamestage-primitives.css'

// The flat install layout puts every component in one directory, so this
// specifier has to read `./button`. See hud/score.ts, which explains it first.
import { Button } from './button'

/**
 * CodeEntry: the one-time code surface. BDS-041.
 *
 * One character per box, the code auto-reported on the last one, and a resend
 * that is unavailable until the host says it is available again.
 *
 * **It checks nothing.** It does not know whether the code is right, it does
 * not send it, and it does not send another one. It reports the characters and
 * the two presses; the host does the rest. A wrong code comes back as `invalid`
 * with the host's own sentence, which is why a code that is simply incomplete
 * looks nothing like one that was refused.
 *
 * There is one input, not six. Six inputs break paste, break the browser's own
 * one-time-code autofill, and give a screen reader six unlabelled boxes to read
 * out. So a single labelled field takes the typing and the boxes are a
 * rendering of it, hidden from the accessibility tree.
 *
 * The countdown does not tick here. `resendIn` is a number of seconds the host
 * owns, because a timer inside a component is state a re-render loses and the
 * host is the one that knows when it last sent a code. While it is above zero
 * the resend control carries `data-gs-locked`: available later, not now, which
 * is exactly what the attribute means everywhere else.
 */

export interface CodeEntryProps {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** How many characters the code has. Six, in every design so far. */
  length?: number
  /** The characters so far, when the host holds them rather than the component. */
  value?: string
  /** The player typed. Fires on every character, not only on the last. */
  onChange?: (value: string) => void
  /**
   * Every character is in. Fired once per completed code, which is the
   * auto-submit the design asks for: nobody presses a button after typing the
   * last digit of a code they can see is complete.
   */
  onComplete?: (value: string) => void
  /** The headline. "Check your email", or whatever this game calls it. */
  title?: React.ReactNode
  /** The line under it, which is where the address the code went to belongs. */
  detail?: React.ReactNode
  /** What the field is called for a screen reader. */
  label?: string
  /** The host refused the code. This component never decides that. */
  invalid?: boolean
  /** Why, in the host's own words. Announced with the field, not only shown. */
  reason?: React.ReactNode
  /**
   * Seconds until the host will send another code. Above zero, the resend
   * control is locked and says how long; at zero or absent, it is available.
   */
  resendIn?: number
  /** The player asked for another code. The host sends it; this never can. */
  onResend?: () => void
  /** What the resend control says when it is available. */
  resendLabel?: string
  /**
   * The player pressed the commit under the boxes. Optional, because the code
   * reports itself through `onComplete` on the last character; the drawing
   * still draws a Verify for the player who does not trust that it did, and
   * it stays unavailable until every character is in.
   */
  onSubmit?: (value: string) => void
  /** What that commit says. */
  submitLabel?: React.ReactNode
  /** The host has been asked and has not answered. Host-declared. */
  busy?: boolean
  /** Anything the host wants under the code: another way in, a way back. */
  children?: React.ReactNode
}

/** "Resend in 0:42". Minutes and seconds, because 87 seconds reads as nothing. */
function countdown(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(whole / 60)
  return `${minutes}:${String(whole - minutes * 60).padStart(2, '0')}`
}

export function CodeEntry(props: CodeEntryProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const DEFAULTS = {
    length: 6,
    title: copy['code-entry.title'],
    label: copy['code-entry.label'],
    resendLabel: copy['code-entry.resendLabel'],
    submitLabel: copy['code-entry.submitLabel'],
  } as const
  const {
    length = DEFAULTS.length,
    value,
    onChange,
    onComplete,
    title = DEFAULTS.title,
    detail,
    label = DEFAULTS.label,
    invalid = false,
    reason,
    resendIn,
    onResend,
    resendLabel = DEFAULTS.resendLabel,
    onSubmit,
    submitLabel = DEFAULTS.submitLabel,
    busy = false,
    children,
  } = componentProps

  // Held here only when the host does not hold it. Component state, in memory,
  // for the length of the render: nothing is written anywhere.
  const [typed, setTyped] = React.useState('')
  const controlled = value !== undefined
  const code = (controlled ? value : typed).slice(0, length)

  const fieldId = React.useId()
  const reasonId = `${fieldId}-reason`

  // Fired once per completed code rather than on every keystroke that leaves it
  // complete, so a player correcting the last character does not send twice.
  const reported = React.useRef<string | null>(null)

  function changed(next: string) {
    const cleaned = next.replace(/\s/g, '').slice(0, length)
    if (!controlled) setTyped(cleaned)
    onChange?.(cleaned)
    if (cleaned.length < length) reported.current = null
    if (cleaned.length === length && reported.current !== cleaned) {
      reported.current = cleaned
      onComplete?.(cleaned)
    }
  }

  const waiting = resendIn !== undefined && resendIn > 0
  const boxes = Array.from({ length }, (_, index) => index)

  // Where the caret is, as a box. Clamped to the last box, because a full code
  // would otherwise put it one past the end and leave every box unmarked: no
  // "you are here" and, since the focus ring hangs off it, no focus ring either,
  // exactly when a player is tabbing back to correct a refused code.
  const at = Math.min(code.length, length - 1)

  return (
    <section
      className="gs-code-entry"
      data-gs-component="code-entry"
      data-gs-invalid={invalid ? 'true' : undefined}
      data-gs-busy={busy ? 'true' : undefined}
      // The machine-readable state of the code: how many characters are in, out
      // of how many. A test reads these rather than counting filled boxes.
      data-gs-value={String(code.length)}
      data-gs-max={String(length)}
      aria-label={typeof title === 'string' ? title : DEFAULTS.title}
    >
      <h2 className="gs-code-entry__title" data-gs-scope="code-entry" data-gs-part="label">
        {title}
      </h2>
      {detail ? (
        <p className="gs-code-entry__detail" data-gs-scope="code-entry" data-gs-part="detail">
          {detail}
        </p>
      ) : null}

      <div className="gs-code-entry__field">
        {/* One real input, over the boxes and invisible. It keeps the label, the
            autofill and paste; the boxes are the picture of what it holds. */}
        <input
          id={fieldId}
          className="gs-code-entry__input"
          data-gs-scope="code-entry"
          data-gs-part="control"
          data-gs-elevation="inset"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={length}
          value={code}
          disabled={busy}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={reason ? reasonId : undefined}
          onChange={(event) => changed(event.target.value)}
        />
        {/* Decorative: the input above is the field, and announcing six empty
            boxes as well would read the same code twice. */}
        <div className="gs-code-entry__boxes" aria-hidden="true">
          {boxes.map((index) => (
            <span
              key={index}
              className="gs-code-entry__box"
              data-gs-scope="code-entry"
              // One cell of a segmented field, which is what `segment` means
              // everywhere else in the library. It used to be `index + 1`, so
              // each box was named after its own position: a number is not a
              // name, and the position is already the DOM order and
              // `data-gs-active` (GSUI-174).
              data-gs-part="segment"
              data-gs-active={index === at ? 'true' : undefined}
            >
              {code[index] ?? ''}
            </span>
          ))}
        </div>
      </div>

      {reason ? (
        <p
          className="gs-code-entry__reason"
          id={reasonId}
          data-gs-scope="code-entry"
          data-gs-part="reason"
          role={invalid ? 'alert' : undefined}
        >
          {reason}
        </p>
      ) : null}

      {onResend && waiting ? (
        // Available later, not now. The drawing draws the wait as a sentence
        // with the time in it rather than a greyed control, and it carries
        // data-gs-locked because that is what a control that comes back later
        // carries everywhere else in the library.
        <p
          className="gs-code-entry__resend"
          data-gs-scope="code-entry"
          data-gs-part="resend"
          data-gs-locked="true"
          aria-live="off"
        >
          {withStringValue(copy['code-entry.resendIn'](countdown(resendIn)), countdown(resendIn), (
            <span className="gs-code-entry__countdown" data-gs-scope="code-entry" data-gs-part="value">
              {countdown(resendIn)}
            </span>
          ))}
        </p>
      ) : onResend ? (
        <Button
          strings={copy}
          variant="tertiary"
          className="gs-code-entry__again"
          data-gs-scope="code-entry"
          data-gs-part="resend"
          disabled={busy}
          onClick={() => onResend()}
        >
          {resendLabel}
        </Button>
      ) : null}

      {onSubmit ? (
        <Button
          strings={copy}
          type="button"
          className="gs-code-entry__commit"
          data-gs-scope="code-entry"
          data-gs-part="commit"
          disabled={code.length < length || busy}
          onClick={() => onSubmit(code)}
        >
          {submitLabel}
        </Button>
      ) : null}

      {children}
    </section>
  )
}
