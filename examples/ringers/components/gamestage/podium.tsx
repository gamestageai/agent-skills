'use client'

import { useStrings, type StringsOverrides, type Strings } from './strings'

import * as React from 'react'

// The score under a place is a number a player reads, so it is a Stat. The
// place carries `data-gs-rank` and the Stat inside it carries `data-gs-value`.
import { Stat } from './stat'

// The player above each block is an Identity: the avatar disc and the name
// under it are its rendering, so a theme that changes what an avatar looks
// like reaches the podium without this file knowing.
import { Identity } from './identity'

import './podium.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

/**
 * Podium: the top of a leaderboard, as the three-block shape.
 *
 * It is not a short leaderboard. A leaderboard is an ordered list a player
 * scans and scrolls; a podium is a fixed arrangement where second stands left
 * of first and third stands right of it, and where the block heights are the
 * result. Rendering that from a list component would mean a presentation
 * attribute that changes the DOM order, and the DOM order is exactly what has
 * to stay in rank order for a screen reader.
 *
 * So: DOM order is always 1, 2, 3. The visual order is CSS. Turn the
 * stylesheet off and the thing is still correct.
 *
 * Like `leaderboard`, it performs nothing. The host hands over the places
 * already ranked.
 */

export interface PodiumPlace {
  /** The player's id. Rides `data-gs-player`. */
  id: string
  /** 1, 2 or 3. The host decides; this never sorts. */
  rank: number
  /**
   * Display name. Player-supplied and therefore untrusted, so it is rendered as
   * text and never as markup. Rendered by `identity`, which draws initials in
   * the avatar disc when there is no picture.
   */
  name: string
  /** Where the player's picture is. The host's URL; `identity` renders it. */
  avatarUrl?: string
  /** The number under the name. Rendered by `stat`. */
  score: number
  /** Places moved, signed. Positive is a gain. The sign is the direction. */
  delta?: number
  /** The current player's place. */
  you?: boolean
  /** The team this place stands for, when it stands for one. */
  team?: string
  /** A secondary line under the name. */
  detail?: string
}

export interface PodiumProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The places, in rank order. Up to three are rendered. */
  places: PodiumPlace[]
  /** The surface's accessible name. */
  label?: string
  /** The word beside every score. */
  scoreLabel?: string
  /** Render a score as something other than the bare number. */
  formatScore?: (value: number) => string
  /** The heading of the designed empty case. */
  emptyHeading?: string
  /** The line under it. */
  emptyBody?: string
  /** The designed next step out of the empty case. */
  emptyAction?: React.ReactNode
}

/** Shared with `leaderboard` by convention, not by import: a registry item is
 *  installed on its own and may not reach into a sibling's file. */

function movementWords(delta: number | undefined, copy: Strings): string | null {
  if (delta === undefined || delta === 0) return null
  return delta > 0 ? copy['podium.movedUp'](Math.abs(delta)) : copy['podium.movedDown'](Math.abs(delta))
}

function placeSentence(place: PodiumPlace, scoreLabel: string, copy: Strings): string {
  const STATE_WORD = {
    you: copy['podium.you'],
    empty: copy['podium.empty'],
  } as const

  const words = [String(place.rank), place.name]
  if (place.detail) words.push(place.detail)
  words.push(copy['podium.score'](scoreLabel, place.score))
  if (place.you) words.push(STATE_WORD.you)
  const movement = movementWords(place.delta, copy)
  if (movement) words.push(movement)
  return words.join(', ')
}

/**
 * Move every place that changed position back to where it was, then release it,
 * so the browser animates the difference over the reorder token. Under reduced
 * motion the token is `0ms` and nothing travels; the DOM order is the new order
 * either way.
 */
function useReorder(order: string) {
  const listRef = React.useRef<HTMLOListElement>(null)
  const seen = React.useRef(new Map<string, number>())
  const seenOrder = React.useRef<string | null>(null)

  // Keyed on who is where, never on pixels. It ran on every render of the
  // host and animated any drift in offsetLeft as a move, so a podium under a
  // countdown that ticks twice a second slid on every tick: Tom, of Ringers,
  // "animating in a loop, like a stuck record". A place moves only when the
  // order of players by rank changes.
  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const places = Array.from(list.querySelectorAll<HTMLElement>('[data-gs-player]'))
    const next = new Map<string, number>()
    for (const place of places) {
      const id = place.getAttribute('data-gs-player')
      if (id) next.set(id, place.offsetLeft)
    }
    const before = seen.current
    const changed = seenOrder.current !== null && seenOrder.current !== order
    seen.current = next
    seenOrder.current = order
    if (!changed) return

    const moved: Array<[HTMLElement, number]> = []
    for (const place of places) {
      const id = place.getAttribute('data-gs-player')
      const was = id ? before.get(id) : undefined
      const now = id ? next.get(id) : undefined
      if (was !== undefined && now !== undefined && was !== now) moved.push([place, was - now])
    }
    if (moved.length === 0) return

    for (const [place, dx] of moved) {
      place.style.transition = 'none'
      place.style.transform = `translateX(${dx}px)`
    }
    // Commit the offset before handing the transition back, or both writes
    // coalesce and nothing animates.
    void list.offsetHeight
    for (const [place] of moved) {
      place.style.transition = ''
      place.style.transform = ''
    }
  }, [order])

  return listRef
}

export function Podium(props: PodiumProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    you: copy['podium.you'],
    empty: copy['podium.empty'],
  } as const
  const {
    places,
    label = copy['podium.label'],
    scoreLabel = copy['podium.scoreLabel'],
    formatScore,
    emptyHeading = copy['podium.emptyHeading'],
    emptyBody = copy['podium.emptyBody'],
    emptyAction,
    className,
    ...rest
  } = componentProps

  const top = places.slice(0, 3)
  const empty = top.length === 0
  const listRef = useReorder(top.map((p) => `${p.id}:${p.rank}`).join('|'))

  return (
    <section
      {...rest}
      className={['gs-podium', className].filter(Boolean).join(' ')}
      data-gs-component="podium"
      data-gs-empty={empty ? 'true' : undefined}
      aria-label={empty ? `${label}, ${STATE_WORD.empty}` : label}
    >
      {empty ? (
        <div className="gs-podium__empty" data-gs-scope="podium" data-gs-part="empty">
          <span className="gs-podium__empty-glyph" data-gs-scope="podium" data-gs-part="glyph" aria-hidden="true">
            ▚
          </span>
          <p className="gs-podium__empty-heading" data-gs-scope="podium" data-gs-part="label">
            {emptyHeading}
          </p>
          <p className="gs-podium__empty-body" data-gs-scope="podium" data-gs-part="detail">
            {emptyBody}
          </p>
          {emptyAction}
        </div>
      ) : (
        <ol className="gs-podium__list" data-gs-scope="podium" data-gs-part="list" ref={listRef}>
          {top.map((place, index) => {
            // A tie shares a rank, so the step a place stands on is its
            // position, and a shared rank reads "=1". Tom, 2026-09-27.
            const step = index + 1
            const shared = places.filter((other) => other.rank === place.rank).length > 1
            return (
              <li
                key={place.id}
                className="gs-podium__row"
                data-gs-scope="podium" data-gs-part="row"
                data-gs-rank={place.rank}
                data-gs-place={step}
                data-gs-player={place.id}
                data-gs-team={place.team}
                data-gs-delta={place.delta}
                data-gs-you={place.you ? 'true' : undefined}
                // The place travels when the order changes, so it is motion and
                // stops dead under reduced motion.
                data-gs-animates="motion"
              >
                {/* One sentence for a screen reader; everything visible below is
                    hidden from it, or a place announces as five things. */}
                <span className="gs-podium__sr" data-gs-scope="podium" data-gs-part="summary">
                  {placeSentence(place, scoreLabel, copy)}
                </span>
                {/* Specimen 3e: the avatar disc, the name under it, then the
                    block. Untrusted text, rendered as text by identity. The
                    winner's disc is identity's large step, the other two are
                    sized by podium.css. */}
                <Identity
                  strings={copy}
                  player={{ id: place.id, displayName: place.name, avatarUrl: place.avatarUrl }}
                  size={step === 1 ? 'large' : 'default'}
                  aria-hidden="true"
                >
                  {place.detail}
                </Identity>
                {/* The block. Its height is the rank, which is a fact the
                    stylesheet reads off data-gs-rank rather than a class. The
                    numeral and the score both stand on it, as drawn.

                    No movement badge. The drawing puts none on a podium: the
                    column's height is the whole statement. The movement is
                    still on the place as data-gs-delta and in the sentence a
                    screen reader gets. */}
                <span className="gs-podium__block" data-gs-scope="podium" data-gs-part="block" aria-hidden="true">
                  <span className="gs-podium__rank gs-display-type" data-gs-scope="podium" data-gs-part="rank">
                    {shared ? copy['podium.sharedRank'](place.rank) : place.rank}
                  </span>
                  <Stat
                    strings={copy}
                    className="gs-podium__score"
                    kind="score"
                    value={place.score}
                    label={scoreLabel}
                    format={formatScore}
                    aria-hidden="true"
                  />
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
