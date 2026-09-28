'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Nav, and `tsc --noEmit` passes on it, so the
// gate cannot catch it.
import './nav.css'

// And the shared rule sets, which carry the theme's press gesture. Every
// destination applies `.gs-pressable`, and without this import a customer
// receives the file and the class matches nothing. See
// ./gamestage-primitives.css. GSUI-118.
import './gamestage-primitives.css'
import { LockGlyph } from './glyphs'

// Pressed while a finger is down, set from pointer events. iOS Safari does not
// apply `:active` to an element with no touch listener of its own, so without
// this a raised control never went down under a thumb (Tom, 2026-09-27). Set
// on the element directly: React does not own this attribute, so nothing
// re-renders on every touch. `.gs-pressable[data-gs-pressed='true']` in
// gamestage-primitives.css draws it, and leaves a disabled control still.
const UNPRESSABLE = ":disabled, [aria-disabled='true'], [data-gs-disabled='true'], [data-gs-locked='true']"
const pressHandlers = {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
    // A disabled or locked control does not move: the padlock answers instead.
    if (event.currentTarget.matches(UNPRESSABLE)) return
    event.currentTarget.setAttribute('data-gs-pressed', 'true')
  },
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
  onPointerLeave: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
}


/**
 * Nav: the places a player can go from here.
 *
 * Specimen 5a. Four presentations of one component: a bar at the foot of the
 * screen with a mark over each word, a strip of tabs with a rule under the
 * current one, a tray of pills, and a drawer of rows that can say why a place
 * is shut. A fifth, `glass`, is the bar as a floating translucent capsule in
 * the manner of the iOS tab bar, with a lens that slides to the current place.
 * Tom, 2026-09-27.
 *
 * Each destination rides on `data-gs-nav`, which is deliberately not
 * `data-gs-choice` and not `data-gs-item`: a test counting the options in a
 * question must not also count a nav bar, and browsing a collection is a third
 * thing again. `data-gs-active` is where the player is, which is not
 * `data-gs-selected`, because a destination is not a pick the player may
 * reverse.
 *
 * It performs nothing. It does not navigate, change a route, or decide which
 * destination is current. `onNavigate` reports the press and the host owns
 * everything behind it, including which one is active on the next render.
 */

export interface Destination {
  /** The host's own id. Rides on `data-gs-nav` and comes back to `onNavigate`. */
  id: string
  /** The word a player reads, and the accessible name whatever the treatment. */
  label: string
  /** The mark for it. Inline SVG taking `currentColor`, never a colour emoji. */
  icon?: React.ReactNode
  /** Where the player is now. */
  active?: boolean
  /** Not available at all. Goes flat and takes no focus. */
  disabled?: boolean
  /** Available later, not now. Keeps its shape, shows a padlock, stays focusable. */
  locked?: boolean
  /**
   * Why it refuses, in words: "opens Friday", "closed". Rendered beside the
   * label as the `note` part and read into the accessible name. The
   * reason lives here and never in the label, so the label stays the name of
   * the place. Shown in the drawer, where a row has the room for it.
   */
  note?: string
}

export interface NavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The places, in the order they are shown. */
  destinations: Destination[]
  /**
   * Which treatment is rendering.
   *
   * `bar` is the foot of the screen, marks with the words underneath; four
   * destinations at most before it drops the words. `tabs` is a strip with a
   * rule under the current one. `pills` is a tray of rounded controls that
   * scrolls sideways. `drawer` is a vertical list whose rows carry a note.
   * `glass` is the bar as a floating, translucent capsule over the scene, with
   * a lens that slides to the current destination; where the browser cannot
   * blur what is behind it, or the player asks for less transparency, it falls
   * back to a solid capsule.
   *
   * `floating` is a dark capsule held above the bottom edge and the safe area,
   * inset from the sides: the current destination is a lighter pill with its
   * mark and its word, every other one is its mark alone. It reserves its own
   * height in the page, so nothing scrolls out of reach behind it. Tom,
   * 2026-09-27, after the Ringers taster.
   */
  presentation?: 'bar' | 'tabs' | 'pills' | 'drawer' | 'glass' | 'floating'
  /**
   * What `floating` is made of. `solid` is an opaque dark capsule; `glass` is
   * frosted, over the scene, and falls back to solid where the browser cannot
   * blur or the player asks for less transparency. Ignored by the others.
   */
  material?: 'solid' | 'glass'
  /** Where it sits within its container. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Called with the destination's id. The component navigates nothing itself. */
  onNavigate?: (id: string) => void
  /** The word a player reads as this nav's name. */
  label?: string
  /**
   * `hidden` draws the marks alone: each destination's label stays its
   * accessible name and becomes a hover tooltip on a pointer that can hover.
   * Every destination needs an `icon`. Tom, 2026-09-27: "change the mobile nav
   * to be icon only no words". `shown` by default.
   */
  labels?: 'shown' | 'hidden'
}

/** From the contract's table of state words, so no component invents its own. */

export function Nav(props: NavProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    active: copy['nav.current'],
    locked: copy['nav.locked'],
  } as const
  const {
    destinations,
    presentation = 'bar',
    placement,
    onNavigate,
    label = copy['nav.label'],
    labels = 'shown',
    material = 'solid',
    className,
    ...rest
  } = componentProps

  // Where the glass lens sits: the current destination's position in the row.
  // Carried as custom properties so the slide is a CSS transition between two
  // values, and a host re-rendering with a new active id moves it for free.
  const activeIndex = destinations.findIndex((d) => d.active)
  const glass = presentation === 'glass'
  const floating = presentation === 'floating'
  const lensStyle = {
    '--gs-nav-count': String(Math.max(destinations.length, 1)),
    '--gs-nav-index': String(Math.max(activeIndex, 0)),
  } as React.CSSProperties

  // Floating centres itself, and its width comes from the current word, whose
  // width is a fraction of a pixel. Centred on a half pixel, every mark in the
  // capsule landed between two pixels and read soft on a 1x screen (Tom,
  // 2026-09-28, "blurred icons"). So the word is held to a whole pixel, and one
  // more when centring would still land on a half.
  const navRef = React.useRef<HTMLElement>(null)
  React.useLayoutEffect(() => {
    const el = navRef.current
    if (!floating || !el) return
    // The word's own width, read from its text so a min-width already set on
    // it does not feed back into the measure.
    const textWidth = (label: HTMLElement) => {
      const range = document.createRange()
      range.selectNodeContents(label)
      // A test DOM has no layout and no Range geometry; nothing to snap there.
      return typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect().width : label.scrollWidth
    }
    const snap = () => {
      const label = el.querySelector<HTMLElement>('[data-gs-active="true"] .gs-nav__label')
      el.querySelectorAll<HTMLElement>('.gs-nav__label').forEach((other) => {
        if (other !== label && other.style.minWidth) other.style.minWidth = ''
      })
      if (!label || labels === 'hidden') return
      const base = Math.ceil(textWidth(label))
      const set = (w: number) => {
        if (label.style.minWidth !== `${w}px`) label.style.minWidth = `${w}px`
      }
      set(base)
      const left = el.getBoundingClientRect().left
      if (Math.abs(left - Math.round(left)) > 0.01) set(base + 1)
    }
    snap()
    // Again whenever anything that decides where the capsule lands changes:
    // the page, the capsule's own box, the box it is centred in, or a web font
    // arriving after first paint. Points sat on a half pixel because its
    // container settled after the first snap. Setting the same width again is
    // a no-op, so the observer cannot feed itself.
    document.fonts?.ready.then(snap).catch(() => {})
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => snap())
    observer.observe(document.documentElement)
    observer.observe(el)
    if (el.parentElement) observer.observe(el.parentElement)
    return () => observer.disconnect()
  }, [floating, activeIndex, labels, destinations])

  const nav = (
    <nav
      {...rest}
      ref={navRef}
      className={['gs-nav', className].filter(Boolean).join(' ')}
      data-gs-component="nav"
      data-gs-presentation={presentation}
      data-gs-placement={placement}
      data-gs-labels={labels === 'hidden' ? 'hidden' : undefined}
      data-gs-material={floating ? material : undefined}
      aria-label={label}
      style={glass ? { ...lensStyle, ...rest.style } : rest.style}
    >
      {glass && activeIndex >= 0 ? (
        // Decoration only: the current destination already says so in its
        // name and aria-current. No part name, because it carries no state a
        // test or a screen reader needs; it is the glass catching the light.
        <span className="gs-nav__lens" aria-hidden="true" />
      ) : null}
      <div className="gs-nav__list" data-gs-scope="nav" data-gs-part="list">
        {destinations.map((destination) => {
          // Locked keeps its place in the tab order: "available later" is
          // something a player should be able to reach and hear described.
          // Only disabled, which is not coming back on this surface, leaves.
          // Disabled wins when both are set, the same way button resolves it.
          const isLocked = Boolean(destination.locked) && !destination.disabled
          const unpressable = Boolean(destination.disabled) || isLocked

          // The name carries the state and the reason, because a screen reader
          // user gets no fill, no rule, no padlock and no note.
          const words = [destination.label]
          if (destination.active) words.push(STATE_WORD.active)
          if (isLocked) words.push(STATE_WORD.locked)
          if (destination.note) words.push(destination.note)

          return (
            <button
              key={destination.id}
              type="button"
              // No `gs-action-type`: 5a draws every nav label in the interface
              // face at the label weight, never in the action face. The
              // exemption and its reason are in tests/lib/check-theme-axes.mjs.
              className="gs-nav__destination gs-pressable"
              {...pressHandlers}
              data-gs-scope="nav" data-gs-part="destination"
              data-gs-nav={destination.id}
              data-gs-active={destination.active ? 'true' : undefined}
              data-gs-disabled={destination.disabled ? 'true' : undefined}
              data-gs-locked={isLocked ? 'true' : undefined}
              // The control travels on press, so it is motion and stops dead
              // under reduced motion. The current treatment is colour, a plate
              // and a rule, which are emphasis and survive.
              data-gs-animates="motion"
              aria-current={destination.active ? 'page' : undefined}
              aria-disabled={unpressable ? 'true' : undefined}
              aria-label={words.join(', ')}
              // With no words drawn, the word is the tooltip. A title shows on
              // hover only, so a phone never sees it.
              title={labels === 'hidden' ? destination.label : undefined}
              // aria-disabled does not stop an event the way the native
              // attribute does, so an unpressable destination refuses it here.
              // The native attribute is not used, because a disabled button is
              // unreachable and a locked one must stay describable.
              onClick={unpressable ? undefined : () => onNavigate?.(destination.id)}
            >
              {/* The destination's own mark carries no part. `glyph` is
                  reserved for the mark that carries a state without colour,
                  and a home icon is decoration: naming it `glyph` would stop a
                  selector for that part meaning "a state landed here". */}
              {destination.icon ? (
                <span className="gs-nav__icon" aria-hidden="true">
                  {destination.icon}
                </span>
              ) : null}
              {/* aria-hidden: the button's own label above is the accessible
                  name, and announcing the word again would read it twice. */}
              <span className="gs-nav__label" data-gs-scope="nav" data-gs-part="label" aria-hidden="true">
                {destination.label}
              </span>
              {destination.note ? (
                <span className="gs-nav__note" data-gs-scope="nav" data-gs-part="note" aria-hidden="true">
                  {destination.note}
                </span>
              ) : null}
              {isLocked ? (
                <span
                  className="gs-nav__lock"
                  data-gs-scope="nav" data-gs-part="glyph"
                  // Emphasis, not motion: the padlock is what a reduced-motion
                  // player reads instead of the control refusing to travel.
                  data-gs-animates="emphasis"
                  aria-hidden="true"
                >
                  <LockGlyph />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </nav>
  )

  // Floating holds itself over the page, so it reserves its own height where
  // it is placed: a page's last lines scroll clear of it without the host
  // having to know how tall it is.
  return floating ? (
    <>
      <div className="gs-nav__spacer" aria-hidden="true" />
      {nav}
    </>
  ) : (
    nav
  )
}
