'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Button, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './button.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

import { LockGlyph } from './glyphs'
// The cue seam, not the runtime: a component reports and the host performs, so
// this is 0.8KB and the provider is the host's to install. The registry ships
// the two as separate items and `./feel` resolves to both layouts. With no
// provider above it, `useGameFeel` is a no-op.
import { useGameFeel } from './feel'
// Label fit, as Choice uses it. A local shim here, the installed sibling file
// in a host. GSUI-281.
import {
  labelFitRootProps,
  useLabelFit,
  useLabelFitSettings,
  type LabelFitSettings,
} from './label-fit'

/**
 * Button: the action a player takes that is not a choice.
 *
 * Start, continue, play again, claim, share. `choice` is for picking between
 * options; this is for committing to the one thing on offer.
 *
 * Five treatments, which with the large size are the six specimen 1f draws:
 * `primary`, `secondary`, `tertiary` for a dismissal, `destructive` for an
 * action that warns, and `icon` for a square control holding one glyph.
 *
 * It performs nothing. It does not navigate, submit, fetch or decide. It
 * renders a control and reports the press. Everything behind the press is the
 * host's.
 *
 * Two states are separate on purpose (BDS-013). Disabled goes flat: not
 * available at all. Locked keeps its shape and shows a padlock: available
 * later, not now. A player can tell "not yet" from "not ever" at a glance,
 * which is why they are two attributes rather than one.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'icon'

/** The contract's three steps. `small` is the 44px control on a state card. */
export type ButtonSize = 'small' | 'default' | 'large'

interface ButtonCommonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    LabelFitSettings {
  /**
   * What a text label names. `person` lets a name too long for the button be
   * drawn as "J. Verhoeven" under `nameFormat`; the accessible name stays the
   * full name. Applies only when the children are plain text. GSUI-281.
   */
  labelKind?: 'person'

  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides
  /** Large is the hero action: start, play again, claim. */
  size?: ButtonSize
  /** Not available at all. Goes flat, takes no focus. */
  disabled?: boolean
  /**
   * Available later, not now. Keeps its shape, shows a padlock, stays
   * focusable. Ignored when `disabled` is also set: "not available at all" is
   * the stronger claim, and a control cannot be flat and keep its shape at once.
   */
  locked?: boolean
}

/** Any button carrying words: four emphasis levels, loudest to quietest. */
export interface LabelledButtonProps extends ButtonCommonProps {
  /**
   * `primary` is the one action on the surface, `secondary` everything beside
   * it, `tertiary` the dismissal that must not weigh as much as the thing it
   * declines, and `destructive` the action that warns rather than invites.
   */
  variant?: Exclude<ButtonVariant, 'icon'>
  /** Only an icon control takes a label; a labelled one has its children. */
  label?: never
}

/** A square control holding one glyph and no words. */
export interface IconButtonProps extends ButtonCommonProps {
  variant: 'icon'
  /**
   * What the control does, in words. Required, because a glyph is a drawing
   * and a drawing is not a name: without this the only thing a screen reader
   * could announce is "button".
   */
  label: string
}

export type ButtonProps = LabelledButtonProps | IconButtonProps

/**
 * The implementation sees one shape. Both members of the union are assignable
 * to it, so this widens without a cast and `tsc` still refuses an icon control
 * with no label at every call site.
 */
type ButtonImplProps = ButtonCommonProps & { variant?: ButtonVariant; label?: string }

// The glyph, because a state that is only a colour is not a state, is
// `LockGlyph` from `@gamestage/glyphs`. It was a colour emoji padlock, which
// painted itself gold on an arcade-blue control and changed silhouette per
// operating system (GSUI-103). The character is not repeated here: the gate
// greps the source for emoji, and a mention would read as a use.

export function Button(props: ButtonProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_LABEL = { locked: copy['button.locked'] } as const

  const {
    variant = 'primary',
    size = 'default',
    disabled = false,
    locked = false,
    label,
    className,
    children,
    onClick,
    type = 'button',
    labelFit,
    maxLines,
    minLines,
    shrinkFloor,
    nameFormat,
    groupFit,
    fitGroup,
    labelKind,
    style,
    ...rest
  }: ButtonImplProps = componentProps

  // A text label is fitted to the room the button has; any other children are
  // the host's to lay out. Called either way, as hooks must be.
  const text = typeof children === 'string' && variant !== 'icon' ? children : null
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const fitSettings = useLabelFitSettings({ labelFit, maxLines, minLines, shrinkFloor, nameFormat, groupFit, fitGroup })
  const fitItems = React.useMemo(
    () => (text === null ? [] : [{ id: 'label', label: text, person: labelKind === 'person' }]),
    [text, labelKind],
  )
  const fit = useLabelFit(buttonRef, fitItems, fitSettings)
  const fitRoot = text === null ? null : labelFitRootProps(fitSettings, fit)
  const plan = fit.plans.get('label')

  const { cue } = useGameFeel()

  // Locked stays in the tab order. "Available later" is something a player
  // should be able to reach and hear described. Only disabled, which is never
  // coming back on this surface, leaves.
  //
  // Disabled wins when both are set. BDS-013 gives them contradictory
  // renderings, flat against keeps-its-shape, so a control carrying both would
  // have to break one of them; and a padlock on something that is never coming
  // back tells the player the opposite of the truth.
  const isIcon = variant === 'icon'
  const isLocked = locked && !disabled
  const unpressable = disabled || isLocked

  const stateWord = isLocked ? STATE_LABEL.locked : undefined

  // aria-disabled does not stop an event the way the native attribute does, so
  // a locked control has to refuse them itself. Every press handler, not only
  // onClick: a host's onKeyDown or onPointerDown would otherwise fire on a
  // control the player has been told they cannot use yet.
  //
  // Refusing means not calling the host's handler. It does not mean
  // preventDefault, which is reserved for the click below. Cancelling mousedown
  // would suppress the browser's own click-to-focus, so a player who clicked a
  // locked control would not focus it and would never hear it described.
  function refuseWhenUnpressable<E extends React.SyntheticEvent>(
    handler: ((event: E) => void) | undefined,
  ) {
    return (event: E) => {
      if (unpressable) return
      handler?.(event)
    }
  }

  // Pressed while a pointer is down on it, set from pointer events so the
  // press shows on a phone as well as under a mouse. See primitives.css.
  const [pressed, setPressed] = React.useState(false)
  const release = () => setPressed(false)

  return (
    <button
      {...rest}
      ref={buttonRef}
      data-gs-pressed={pressed && !unpressable ? 'true' : undefined}
      onPointerCancel={(event) => { release(); rest.onPointerCancel?.(event) }}
      onPointerLeave={(event) => { release(); rest.onPointerLeave?.(event) }}
      style={fitRoot ? { ...fitRoot.style, ...style } : style}
      data-gs-label-fit={fitRoot?.['data-gs-label-fit']}
      data-gs-label-lines={fitRoot?.['data-gs-label-lines']}
      data-gs-label-name={plan?.name}
      type={type}
      className={['gs-button', 'gs-action-type', 'gs-pressable', text === null ? null : 'gs-label-box', className].filter(Boolean).join(' ')}
      data-gs-component="button"
      data-gs-variant={variant}
      data-gs-size={size}
      data-gs-disabled={disabled ? 'true' : undefined}
      data-gs-locked={isLocked ? 'true' : undefined}
      // The control moves on press and does not otherwise animate, so it is
      // motion. The padlock is emphasis and survives reduced motion, which is
      // how a player who cannot see movement still sees that it is locked.
      data-gs-animates="motion"
      disabled={disabled}
      aria-disabled={unpressable || undefined}
      // Enter and Space arrive as a synthesised click on a native button, so
      // guarding onClick covers the keyboard as well as the pointer. The rest
      // are guarded because a host may hang its own behaviour on any of them.
      //
      // Click is the one that also cancels: a host may override type to submit,
      // and a locked control must not submit a form.
      onClick={(event) => {
        if (unpressable) {
          event.preventDefault()
          return
        }
        // The press a player can hear and feel. Every control in the library
        // is a `.gs-pressable` and until now none of them asked for a cue, so
        // the one gesture a player makes most often was the one that answered
        // least (GSUI-92). The catalogue's `press` is "tick" and `light` is
        // "tap, select, collect"; both are essential, so juice never trims
        // them and only mute or haptics-off stops them.
        //
        // Fired here rather than on pointerdown because Enter and Space
        // arrive as a synthesised click on a native button, so this one place
        // covers the thumb and the keyboard and cannot fire twice for one
        // press. A locked or disabled control fires nothing: it has refused
        // the press, and a cue would say it had not.
        cue('press', 'sfx')
        cue('light', 'haptic')
        onClick?.(event)
      }}
      onKeyDown={refuseWhenUnpressable(rest.onKeyDown)}
      onKeyUp={refuseWhenUnpressable(rest.onKeyUp)}
      onPointerDown={(event) => {
        if (!unpressable) setPressed(true)
        refuseWhenUnpressable(rest.onPointerDown)(event)
      }}
      onPointerUp={(event) => {
        release()
        refuseWhenUnpressable(rest.onPointerUp)(event)
      }}
      onMouseDown={refuseWhenUnpressable(rest.onMouseDown)}
      onMouseUp={refuseWhenUnpressable(rest.onMouseUp)}
      onTouchStart={refuseWhenUnpressable(rest.onTouchStart)}
      onTouchEnd={refuseWhenUnpressable(rest.onTouchEnd)}
    >
      {/* An icon control's children are its glyph, and a glyph is hidden from
          the name: the gallery's naming check zeroes out aria-hidden subtrees
          for exactly this case, so a visible drawing would otherwise read as a
          name while a screen reader announced nothing a player could act on.
          A locked icon control shows the padlock instead of its glyph, because
          a 56px face has room for one mark and "not yet" is the one that
          matters. */}
      {/* The padlock comes before the word: specimens 1f and 2b draw "Level 8"
          and "Lv 8" with the mark first, and a locked icon control shows only
          the mark. It is hidden from the name; the locked word below carries
          the state to a screen reader. */}
      {isLocked ? (
        <span className="gs-button__glyph" data-gs-animates="emphasis" aria-hidden="true">
          <LockGlyph />
        </span>
      ) : null}
      {isIcon ? (
        isLocked ? null : (
          <span className="gs-button__glyph" aria-hidden="true">
            {children}
          </span>
        )
      ) : (
        text !== null && plan && plan.text !== text ? (
          // A shortened name is drawn and the full one is announced, because a
          // screen reader user is owed the name, not the abbreviation.
          <>
            <span className="gs-button__label" ref={fit.labelRef('label')} aria-hidden="true">
              <span className="gs-button__text">{plan.text}</span>
            </span>
            <span className="gs-button__announcement">{text}</span>
          </>
        ) : (
          <span className="gs-button__label" ref={text === null ? undefined : fit.labelRef('label')}>
            <span className="gs-button__text">{children}</span>
          </span>
        )
      )}
      {/* The label is content rather than aria-label on purpose. aria-label
          replaces the whole computed name, so the locked word below would
          vanish and a locked pause control would announce itself as available. */}
      {isIcon && label ? <span className="gs-button__announcement">{label}</span> : null}
      {/* The state belongs in the accessible name, and children are arbitrary
          nodes, so it cannot go in aria-label without stringifying them. No
          separator here: the span is absolutely positioned, which blockifies
          it, and a browser inserts the space itself during name computation. */}
      {stateWord ? <span className="gs-button__announcement">{stateWord}</span> : null}
    </button>
  )
}
