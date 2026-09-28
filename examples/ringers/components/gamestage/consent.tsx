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
}

/** {brand} swapped for the brand, or the sentence re-made for Monterosa alone. */
export function consentDetail(template: string, brand = ''): string {
  const name = brand.trim()
  if (!template.includes('{brand}')) return template
  return name
    ? template.replaceAll('{brand}', name)
    : template.replace('{brand} and Monterosa, who run', 'Monterosa, who runs').replaceAll('{brand}', 'Monterosa')
}

export function Consent(props: ConsentProps) {
  const { strings, onDecide, value, categories = CONSENT_OPTIONAL_CATEGORIES, onPolicyOpened } = props
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

  return (
    <section
      className="gs-consent"
      data-gs-component="consent"
      data-gs-presentation={expanded ? 'expanded' : 'banner'}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} ref={titleRef} tabIndex={-1} className="gs-consent__title" data-gs-scope="consent" data-gs-part="label">
        {props.title ?? copy['consent.title']}
      </h2>
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
          {/* Same component, same variant, same size: neither answer is the easy one. */}
          <div className="gs-consent__actions" data-gs-scope="consent" data-gs-part="actions">
            <Button strings={copy} variant="secondary" data-gs-scope="consent" data-gs-part="reject" onClick={() => onDecide(all(false))}>
              {copy['consent.reject']}
            </Button>
            <Button strings={copy} variant="secondary" data-gs-scope="consent" data-gs-part="accept" onClick={() => onDecide(all(true))}>
              {copy['consent.accept']}
            </Button>
          </div>
          <Button
            strings={copy}
            variant="tertiary"
            data-gs-scope="consent"
            data-gs-part="trigger"
            onClick={() => {
              opened.current = true
              setExpanded(true)
            }}
          >
            {copy['consent.choose']}
          </Button>
        </>
      )}
    </section>
  )
}
