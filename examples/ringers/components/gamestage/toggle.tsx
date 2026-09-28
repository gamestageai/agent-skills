'use client'

import * as React from 'react'

import { LockGlyph } from './glyphs'
import { useStrings, type StringsOverrides } from './strings'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Toggle, and `tsc --noEmit` passes on it, so the
// gate cannot catch it.
import './toggle.css'

// The shared rule sets, so the theme's press gesture reaches the pill. GSUI-118:
// the file shipped with the tokens and nothing imported it, so the classes
// matched nothing in a real install.
import './gamestage-primitives.css'

/**
 * Toggle: one setting that is on or off, and takes effect at once.
 *
 * Specimen 4b draws it in the form essentials beside the checkbox and the
 * radio, and 4d draws the same control at the end of the "Sound and haptics"
 * settings row. It is the third pressed control of that family, so it wears
 * `data-gs-elevation="raised"` and `.gs-pressable` exactly as they do: the
 * rule a player reads without being told it is that a thing typed into is
 * inset and a thing pressed is raised.
 *
 * It is a switch and not a checkbox, and the difference is not decoration. A
 * checkbox states an intention that a submit will act on later; a switch is
 * the act. Sound goes off when the thumb moves, not when a form is sent, so
 * the role is `switch` and the state is `aria-checked`.
 *
 * It performs nothing. It does not mute anything, remember a preference or
 * write to storage: the host owns the value and hands it back as a prop, so a
 * setting that fails to save on the server never shows as on.
 *
 * Locked keeps its shape and shows a padlock, per BDS-013, and stays in the
 * tab order: "available later" is something a player should be able to reach
 * and hear described. Disabled wins when both are set, for the reason button
 * gives at length: the two renderings contradict each other, and a padlock on
 * something that is never coming back tells the player the opposite of the
 * truth.
 */

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onChange' | 'value'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /**
   * What the setting is called, as a player reads it: "Sound". Always the
   * accessible name, and drawn beside the pill unless `labelHidden` is set.
   */
  label: string
  /**
   * Whether the setting is on. Host-driven: this renders the value it is
   * given and never keeps one of its own, so a write that fails on the server
   * cannot leave the pill saying the setting took.
   */
  checked: boolean
  /** The player moving it. Called with the value the setting would become. */
  onChange: (checked: boolean) => void
  /**
   * The words are already on screen, so draw the pill alone. Specimen 4d's
   * settings row says "Sound and haptics" in its own label and puts the
   * control at the end of it; drawing the word twice would read as two
   * settings. The label is still the accessible name.
   */
  labelHidden?: boolean
  /** Not available, and not coming back on this surface. Leaves the tab order. */
  disabled?: boolean
  /** Available later, not now. Keeps its shape, shows a padlock, stays focusable. */
  locked?: boolean
}

export function Toggle(props: ToggleProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    label,
    checked,
    onChange,
    labelHidden = false,
    disabled = false,
    locked = false,
    className,
    type = 'button',
    onClick,
    ...rest
  } = componentProps

  const labelId = React.useId()
  const isLocked = locked && !disabled
  const unpressable = disabled || isLocked

  return (
    <span
      className={['gs-toggle', className].filter(Boolean).join(' ')}
      data-gs-component="toggle"
      data-gs-active={checked ? 'true' : 'false'}
      data-gs-disabled={disabled ? 'true' : undefined}
      data-gs-locked={isLocked ? 'true' : undefined}
    >
      <button
        {...rest}
        type={type}
        className="gs-toggle__control gs-pressable"
        data-gs-scope="toggle"
        data-gs-part="control"
        // The rule a player reads without being told it: this is pressed, not
        // typed into, so it stands on a shelf the way field's tick box does.
        data-gs-elevation="raised"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        aria-disabled={unpressable || undefined}
        onClick={(event) => {
          // aria-disabled does not stop an event the way the native attribute
          // does, so a locked control has to refuse them itself. Enter and
          // Space arrive as a synthesised click on a native button, so this
          // one guard covers the thumb and the keyboard alike.
          if (unpressable) {
            event.preventDefault()
            return
          }
          onClick?.(event)
          onChange(!checked)
        }}
      >
        {/* The thumb. It is the only thing that moves, so it is the element
            that carries the motion, and motion.css stops it under reduced
            motion while the fill still changes. */}
        <span
          className="gs-toggle__thumb"
          data-gs-scope="toggle"
          data-gs-part="thumb"
          data-gs-animates="motion"
          aria-hidden="true"
        />
        {/* A padlock rather than a flat fill, and it is emphasis, so a player
            who has asked for stillness still sees that the setting is not
            theirs to change yet. */}
        {isLocked ? (
          <span
            className="gs-toggle__glyph"
            data-gs-scope="toggle"
            data-gs-part="glyph"
            data-gs-animates="emphasis"
            aria-hidden="true"
          >
            <LockGlyph />
          </span>
        ) : null}
      </button>
      {/* Content rather than aria-label, so the locked word below is part of
          the computed name instead of being replaced by it. */}
      <span
        id={labelId}
        className={labelHidden ? 'gs-toggle__announcement' : 'gs-toggle__label'}
        data-gs-scope="toggle"
        data-gs-part="label"
      >
        {label}
        {/* The state as a word, for a player who gets no padlock and no fill.
            No punctuation of its own: a comma here is copy, and the name
            computation already puts a space between the two. */}
        {isLocked ? (
          <>
            {' '}
            <span className="gs-toggle__announcement">{copy['toggle.locked']}</span>
          </>
        ) : null}
      </span>
    </span>
  )
}
