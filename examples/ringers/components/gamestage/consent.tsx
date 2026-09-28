'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles, or `gamestage-ui add` installs it
// unstyled and `tsc --noEmit` passes on it.
import './consent.css'
import './gamestage-primitives.css'

// The flat install layout puts every component in one directory. See hud/score.ts.
import { Button } from './button'
import { Toggle } from './toggle'
import { CrossGlyph } from './glyphs'

/**
 * Consent: a fan is asked before anything records them.
 *
 * A panel with Reject all and Accept all at the same size and weight, as UK and
 * EU guidance expects, and Choose, which lists the categories one at a time.
 * `expanded` opens straight onto the list, which is what a "Privacy settings"
 * link should show a fan who is changing their mind.
 *
 * **It is headless of storage.** It never stores, reads or sends an answer. The
 * host passes the fan's current choices in as `value` and receives the new ones
 * from `onDecide`. On Gamestage that is `game.consent.record()?.categories` in
 * and `game.consent.decide(categories)` out, and the page starts the game with
 * `consentBanner: false` so the client does not draw a second banner.
 *
 * The categories are the Monterosa SDK's: `necessary` is always on and never
 * offered, and `analytics`, `marketing` and `functional` are offered. An app
 * that embeds a game sets the same names with consent-kit's `setConsentState`,
 * and a host that has answered for the fan should not render this at all
 * (`game.consent.hostDecides()`).
 *
 * `data-gs-component="consent"` with `accept` and `reject` parts is the
 * contract `gamestage verify` and `deploy` look for, whatever the words say.
 */

export const CONSENT_OPTIONAL_CATEGORIES = ['analytics', 'marketing', 'functional'] as const
export type ConsentCategoryName = (typeof CONSENT_OPTIONAL_CATEGORIES)[number]

export interface ConsentProps {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides
  /** The fan's answer: every offered category, true or false. */
  onDecide: (categories: Record<ConsentCategoryName, boolean>) => void
  /** Their current choices, to start the list from. Absent categories are off. */
  value?: Partial<Record<string, boolean | undefined>>
  /** The categories this game offers. Defaults to all three. */
  categories?: readonly ConsentCategoryName[]
  /** Open straight onto the category list, as "Privacy settings" does. */
  expanded?: boolean
  /**
   * Shows a "Privacy policy" control when set, and is called when the fan
   * presses it. The host opens its own policy: the library builds no link and
   * navigates nowhere (spec.md, REQ-001 and REQ-005).
   */
  onPolicyOpened?: () => void
  title?: React.ReactNode
  detail?: React.ReactNode
  /**
   * Who is asking, beside Monterosa: the game's brand, from Studio. Replaces
   * {brand} in the detail. Without one the detail reads "Monterosa, who runs
   * this game, would like to...". The same swap as the client's banner
   * (consentDetail in @monterosa/gamestage-schema), GS-575.
   */
  brand?: string
  /**
   * Shows a × and is called when the fan closes the card with it, without
   * deciding. Nothing is recorded and nothing is stored, so the host shows it
   * again next visit. The card hides itself as well.
   */
  onClose?: () => void
  /**
   * `floating` (the default) holds the card above the foot of the screen and
   * clear of anything the page pins there, a pill nav or a main button;
   * `inline` leaves it in the page's flow.
   */
  placement?: 'floating' | 'inline'
  /**
   * Floating only: how far above the bottom edge to sit, in pixels. Without
   * it the card measures the highest fixed or sticky element in the lower half
   * of the screen and sits above that.
   */
  bottomClear?: number
}

/** How far above the bottom edge the highest thing pinned in the lower half reaches. */
function measureBottomClear(self: HTMLElement | null): number {
  if (typeof window === 'undefined') return 0
  const half = window.innerHeight / 2
  let clear = 0
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    if (self && (el === self || self.contains(el) || el.contains(self))) continue
    const position = getComputedStyle(el).position
    if (position !== 'fixed' && position !== 'sticky') continue
    const box = el.getBoundingClientRect()
    if (box.height === 0 || box.width === 0 || box.top < half || box.top > window.innerHeight) continue
    clear = Math.max(clear, window.innerHeight - box.top)
  }
  return Math.round(clear)
}

/** {brand} swapped for the brand, or the sentence re-made for Monterosa alone. */
export function consentDetail(template: string, brand = ''): string {
  const name = brand.trim()
  if (!template.includes('{brand}')) return template
  if (template.includes('{brand} and Monterosa, who run')) {
    return name
      ? template.replaceAll('{brand}', name)
      : template.replace('{brand} and Monterosa, who run', 'Monterosa, who runs').replaceAll('{brand}', 'Monterosa')
  }
  return template.replaceAll('{brand}', name || 'Monterosa')
}

export function Consent(props: ConsentProps) {
  const {
    strings,
    onDecide,
    value,
    categories = CONSENT_OPTIONAL_CATEGORIES,
    onPolicyOpened,
    onClose,
    placement = 'floating',
    bottomClear,
  } = props
  const copy = useStrings(strings)
  const titleId = React.useId()
  const [expanded, setExpanded] = React.useState(Boolean(props.expanded))
  // The heading takes focus only when the fan opens the choices, so a screen
  // reader follows them there. Never on arrival: a ring on first paint reads
  // as something already chosen. GS-575.
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const opened = React.useRef(false)
  React.useEffect(() => {
    if (expanded && opened.current) titleRef.current?.focus()
  }, [expanded])
  const [choices, setChoices] = React.useState<Record<ConsentCategoryName, boolean>>(() =>
    Object.fromEntries(
      CONSENT_OPTIONAL_CATEGORIES.map((c) => [c, value?.[c] === true]),
    ) as Record<ConsentCategoryName, boolean>,
  )

  const all = (on: boolean) =>
    Object.fromEntries(CONSENT_OPTIONAL_CATEGORIES.map((c) => [c, on && categories.includes(c)])) as Record<
      ConsentCategoryName,
      boolean
    >

  const labels: Record<ConsentCategoryName, string> = {
    analytics: copy['consent.analytics'],
    marketing: copy['consent.marketing'],
    functional: copy['consent.functional'],
  }

  const [closed, setClosed] = React.useState(false)
  const rootRef = React.useRef<HTMLElement>(null)
  const [clear, setClear] = React.useState(bottomClear ?? 0)
  React.useLayoutEffect(() => {
    if (placement !== 'floating') return
    if (bottomClear !== undefined) {
      setClear(bottomClear)
      return
    }
    const measure = () => setClear(measureBottomClear(rootRef.current))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [placement, bottomClear])

  if (closed) return null

  return (
    <section
      ref={rootRef}
      className="gs-consent"
      data-gs-component="consent"
      data-gs-presentation={expanded ? 'expanded' : 'banner'}
      data-gs-placement={placement === 'floating' ? 'bottom' : undefined}
      data-gs-closable={onClose ? 'true' : undefined}
      style={placement === 'floating' ? ({ ['--gs-consent-clear' as string]: `${clear}px` } as React.CSSProperties) : undefined}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      {/* The heading is for a screen reader: the card is its message. */}
      <h2 id={titleId} ref={titleRef} tabIndex={-1} className="gs-consent__title" data-gs-scope="consent" data-gs-part="label">
        {props.title ?? copy['consent.title']}
      </h2>
      {onClose ? (
      <button
        type="button"
        className="gs-consent__close gs-action-type gs-pressable"
        data-gs-scope="consent"
        data-gs-part="dismiss"
        aria-label={copy['consent.close']}
        title={copy['consent.close']}
        onClick={() => {
          setClosed(true)
          onClose?.()
        }}
      >
        <CrossGlyph />
      </button>
      ) : null}
      <p className="gs-consent__detail" data-gs-scope="consent" data-gs-part="detail">
        {props.detail ?? consentDetail(copy['consent.detail'], props.brand)}
        {onPolicyOpened ? (
          <>
            {' '}
            <button type="button" className="gs-consent__policy gs-action-type gs-pressable" data-gs-scope="consent" data-gs-part="control" onClick={onPolicyOpened}>
              {copy['consent.policy']}
            </button>
          </>
        ) : null}
      </p>

      {expanded ? (
        <>
          <p className="gs-consent__note" data-gs-scope="consent" data-gs-part="note">
            {copy['consent.necessary']}
          </p>
          <div className="gs-consent__list" data-gs-scope="consent" data-gs-part="list">
            {categories.map((category) => (
              <Toggle
                key={category}
                strings={strings}
                label={labels[category]}
                checked={choices[category]}
                data-gs-scope="consent"
                data-gs-part="control"
                onChange={(next) => setChoices((current) => ({ ...current, [category]: next }))}
              />
            ))}
          </div>
          <div className="gs-consent__actions" data-gs-scope="consent" data-gs-part="actions">
            <Button strings={copy} variant="secondary" data-gs-scope="consent" data-gs-part="reject" onClick={() => onDecide(all(false))}>
              {copy['consent.reject']}
            </Button>
            <Button
              strings={copy}
              variant="secondary"
              data-gs-scope="consent"
              data-gs-part="commit"
              onClick={() =>
                onDecide(
                  Object.fromEntries(
                    CONSENT_OPTIONAL_CATEGORIES.map((c) => [c, categories.includes(c) && choices[c]]),
                  ) as Record<ConsentCategoryName, boolean>,
                )
              }
            >
              {copy['consent.save']}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Accept in the game's accent and Reject in outline, at one height
              and one width, so neither is the easy one; Manage preferences a
              small link on the same row. */}
          <div className="gs-consent__actions" data-gs-scope="consent" data-gs-part="actions">
            <Button strings={copy} variant="primary" size="small" data-gs-scope="consent" data-gs-part="accept" onClick={() => onDecide(all(true))}>
              {copy['consent.accept']}
            </Button>
            <Button strings={copy} variant="secondary" size="small" data-gs-scope="consent" data-gs-part="reject" onClick={() => onDecide(all(false))}>
              {copy['consent.reject']}
            </Button>
            <button
              type="button"
              className="gs-consent__policy gs-consent__choose gs-action-type gs-pressable"
              data-gs-scope="consent"
              data-gs-part="trigger"
              onClick={() => {
                opened.current = true
                setExpanded(true)
              }}
            >
              {copy['consent.choose']}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
