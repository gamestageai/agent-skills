'use client'

import * as React from 'react'

import './preferences.css'
import './gamestage-primitives.css'
import { Row } from './row'
import { Toggle } from './toggle'
import { ChevronGlyph } from './glyphs'

/**
 * Preferences: a fan's settings for a game, as one group on their Profile.
 *
 * Tom, 2026-09-28: "this toggle is out of place, we should have a sub-area for
 * Preferences". The sound toggle floated alone on the Profile page with
 * Privacy settings and a copyright link loose underneath it. This is the
 * settings-app shape instead: a heading, then one grouped list of full-width
 * rows, a toggle at the end of a row that switches and a chevron at the end of
 * a row that opens something, and the copyright link as a small line below the
 * group rather than a row of its own.
 *
 * It owns no words: every label arrives from the host, which reads them from
 * Studio. It performs nothing: a toggle reports its new value and a row
 * reports the press.
 *
 * A `slot` row is a row the host or the Gamestage client fills. The client
 * looks for `data-gs-slot="privacy-settings"` and puts its Privacy settings
 * control there, so the control lands inside the group, drawn as a row.
 */

export type PreferencesItem =
  | { kind: 'toggle'; id: string; label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }
  | { kind: 'link'; id: string; label: string; onOpen: () => void; value?: React.ReactNode }
  | { kind: 'slot'; id: string; slot: string }

export interface PreferencesProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The heading, e.g. "Preferences". */
  title: string
  /** The rows, in order. */
  items: PreferencesItem[]
  /** A small link under the group, e.g. "Report copyright infringement". */
  footer?: { label: string; onOpen: () => void }
}

export function Preferences(props: PreferencesProps) {
  const { title, items, footer, className, ...rest } = props
  const headingId = React.useId()

  return (
    <section
      {...rest}
      className={['gs-preferences', className].filter(Boolean).join(' ')}
      data-gs-component="preferences"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="gs-preferences__title" data-gs-scope="preferences" data-gs-part="label">
        {title}
      </h2>
      <ul className="gs-preferences__group" data-gs-scope="preferences" data-gs-part="list">
        {items.map((item) => (
          <li key={item.id} className="gs-preferences__item" data-gs-scope="preferences" data-gs-part="row">
            {item.kind === 'toggle' ? (
              <Row
                label={item.label}
                actions={
                  <Toggle label={item.label} labelHidden checked={item.checked} disabled={item.disabled} onChange={item.onChange} />
                }
              />
            ) : item.kind === 'link' ? (
              <Row
                label={item.label}
                value={item.value}
                onSelect={item.onOpen}
                actions={
                  <span className="gs-preferences__chevron" aria-hidden="true">
                    <ChevronGlyph direction="right" />
                  </span>
                }
              />
            ) : (
              <div className="gs-preferences__slot" data-gs-slot={item.slot} />
            )}
          </li>
        ))}
      </ul>
      {footer ? (
        <button
          type="button"
          className="gs-preferences__footer gs-action-type gs-pressable"
          data-gs-scope="preferences"
          data-gs-part="trigger"
          onClick={footer.onOpen}
        >
          {footer.label}
        </button>
      ) : null}
    </section>
  )
}
