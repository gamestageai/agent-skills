'use client'

import { useStrings, type StringsOverrides, type Strings } from './strings'

import * as React from 'react'

// Every number a player reads is a Stat, including the score in a row. The row
// carries `data-gs-rank` and the Stat inside it carries `data-gs-value`, which
// is the split the attribute contract settles: one element's value cannot carry
// two numbers.
import { Stat } from './stat'

// The player in a row is an Identity: the avatar disc and the name beside it are
// its rendering, so a theme that changes what an avatar looks like reaches every
// row here without this file knowing.
import { Identity } from './identity'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Leaderboard and the typecheck still passes.
import './leaderboard.css'
import './gamestage-primitives.css'

import { ChevronGlyph, EmptyBoxGlyph } from './glyphs'
import { useFixedSpace } from './fit'

/**
 * Leaderboard: ranked rows, a pinned "you" row, and an empty case that is not
 * a blank rectangle.
 *
 * It performs nothing. It does not sort, page, fetch or decide who moved: the
 * host owns the order and hands it over already ranked. What this owns is the
 * rendering, the reorder motion, and the announcement, and the announcement is
 * the part that is easy to get wrong.
 *
 * The display details of a player, their name and their secondary line, are
 * props today. They become `identity` once that item lands; see the note on
 * `LeaderboardEntry`.
 */

export interface LeaderboardEntry {
  /** The player's id. Rides `data-gs-player`. */
  id: string
  /** The row's rank, 1-based. The host decides it; this never sorts. */
  rank: number
  /**
   * The player's display name. Player-supplied and therefore untrusted, so it
   * is rendered as text and never as markup. Rendered by `identity`, which
   * draws initials in the avatar disc when there is no picture.
   */
  name: string
  /** Where the player's picture is. The host's URL; `identity` renders it. */
  avatarUrl?: string
  /** The number beside the name. Rendered by `stat`, so it carries `data-gs-value`. */
  score: number
  /**
   * How many places the row just moved, signed. Positive is a gain. There is no
   * separate trend or rank-change attribute: the sign is the direction.
   */
  delta?: number
  /** The current player's row. */
  you?: boolean
  /**
   * The rank is shared with a row not in this list, such as a podium above it.
   * Rows that share a rank inside the list are found without it.
   */
  tied?: boolean
  /** The team this row stands for, when it stands for one. */
  team?: string
  /** A secondary line under the name: a team name, a time, a country. */
  detail?: string
}

export interface LeaderboardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The rows, in the order they should render. This never re-sorts them. */
  entries: LeaderboardEntry[]
  /** The surface's accessible name. */
  label?: string
  /**
   * `list` is the phone board of specimen 3e: 52px rows in one column.
   * `broadcast` is specimen 3f's big-screen treatment of the same rows: two
   * columns, 64px tall, the rank in a coloured disc, the name in the display
   * face. Same attributes, same order, one prop; see `data-gs-presentation`.
   */
  presentation?: 'list' | 'broadcast'
  /**
   * Hold a copy of the player's row on screen while the list scrolls. It is the
   * same row with `data-gs-pinned`, never a second component.
   */
  pinYou?: boolean
  /** The word beside every score. Defaults to `stat`'s own. */
  scoreLabel?: string
  /** Render a score as something other than the bare number. */
  formatScore?: (value: number) => string
  /** The heading of the designed empty case. */
  emptyHeading?: string
  /** The line under it. */
  emptyBody?: string
  /** The designed next step out of the empty case. */
  emptyAction?: React.ReactNode
  /**
   * How many rows to show before "See all". Inside a stage whose space is fixed
   * (screen, canvas, card, sheet) it defaults to 5: the top five, then a gap
   * and the player's own row if they are further down, and a "See all" button
   * that opens every row in a sheet. Elsewhere it defaults to every row.
   * Pass a number to set it, or 'all' to show every row anywhere. GSUI-282.
   */
  limit?: number | 'all'
  /**
   * What See all does. Given, the host opens every row its own way, a Sheet
   * being the usual one. Absent, the board shows every row in place. The
   * board does not install Sheet itself: doing so made it a third heavier to
   * add, for one button.
   */
  onSeeAll?: () => void
  /**
   * Rows on zero points, other than the player's own, fold into one line with
   * these words, "and 7 more on 0 points", so the board shows who scored.
   * Absent, every row is drawn. Tom, 2026-09-27.
   */
  zeroRowsLabel?: (count: number) => string
}

/**
 * The words that go with the states. `you` is fixed by the accessible-name
 * table in the attribute contract; the movement words are this component's, and
 * they are here rather than inline so leaderboard and podium cannot drift.
 */

function movementWords(delta: number | undefined, copy: Strings): string | null {
  if (delta === undefined || delta === 0) return null
  return delta > 0 ? copy['leaderboard.movedUp'](Math.abs(delta)) : copy['leaderboard.movedDown'](Math.abs(delta))
}

/** The one sentence a screen reader gets for a row, in reading order. */
function rowSentence(entry: LeaderboardEntry, scoreLabel: string, copy: Strings): string {
  const STATE_WORD = {
    you: copy['leaderboard.you'],
    empty: copy['leaderboard.empty'],
  } as const

  const words = [String(entry.rank), entry.name]
  if (entry.detail) words.push(entry.detail)
  words.push(copy['leaderboard.score'](scoreLabel, entry.score))
  if (entry.you) words.push(STATE_WORD.you)
  const movement = movementWords(entry.delta, copy)
  if (movement) words.push(movement)
  return words.join(', ')
}

interface RowProps {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  entry: LeaderboardEntry
  /** The held copy, not the row in the list. */
  pinned?: boolean
  broadcast?: boolean
  /** Another row has the same rank, so the rank reads "=1". */
  shared?: boolean
  /** Some row on the board has moved; with none, the movement slot is not drawn. */
  movementSlot?: boolean
  scoreLabel: string
  formatScore?: (value: number) => string
}

/**
 * One row. The pinned copy is this component with a second marker, so there is
 * exactly one place a row's shape is decided.
 *
 * The order is the drawing's (specimen 3e): the rank, then which way the row
 * moved, then the player, then the score anchored at the right edge. The
 * movement slot is always rendered. A row that did not move draws a dash in
 * it, which is what keeps the avatars and the scores of every row in one
 * column whether or not the row moved; leaving the slot out was how the
 * scores of still rows sat 12px further from the edge than the rest.
 *
 * Everything visible is `aria-hidden`, and the row carries one sentence for the
 * screen reader instead. Otherwise a rank, a name, a detail and a stat group
 * are announced as four things, and a list of twenty rows reads as eighty.
 */
function Row(props: RowProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const { entry, pinned = false, broadcast = false, scoreLabel, formatScore, shared = false, movementSlot = true } = componentProps

  const movement = movementWords(entry.delta, copy)

  return (
    <li
      className="gs-leaderboard__row"
      // One name, and the pinning is the attribute below. This used to read
      // `pinned ? 'pinned-row' : 'row'`, which is the exact anti-example the
      // part vocabulary is written against — "a pinned row is `row` carrying
      // `data-gs-pinned`, not `pinned-row`" — shipped because the checker only
      // read string literals and never saw it (GSUI-174). It also had no scope,
      // which every other part in this file carries.
      data-gs-scope="leaderboard"
      data-gs-part="row"
      data-gs-rank={entry.rank}
      data-gs-player={entry.id}
      data-gs-team={entry.team}
      data-gs-delta={entry.delta}
      data-gs-you={entry.you ? 'true' : undefined}
      data-gs-pinned={pinned ? 'true' : undefined}
      // The row travels when the order changes (`motion.reorder`, applied by
      // motion.css), so it is motion and stops dead under reduced motion. The
      // order itself is the DOM order, which is correct with no animation at
      // all.
      data-gs-motion="reorder"
      data-gs-animates="motion"
    >
      <span className="gs-leaderboard__sr" data-gs-scope="leaderboard" data-gs-part="summary">
        {rowSentence(entry, scoreLabel, copy)}
      </span>
      <span className="gs-leaderboard__rank" data-gs-scope="leaderboard" data-gs-part="rank" aria-hidden="true">
        {shared ? copy['leaderboard.sharedRank'](entry.rank) : entry.rank}
      </span>
      {/* The badge does not move, it changes glyph and colour, so it is
          emphasis and survives reduced motion. That is how a player who cannot
          see the reorder still sees which way they went. With no movement it is
          the drawn dash, and the slot keeps its width. */}
      {/* Only when something on the board has moved: a dash on every row of
          a board with no movement data read as a column of empty values. */}
      {movementSlot ? (
      <span
          className="gs-leaderboard__delta"
          data-gs-scope="leaderboard" data-gs-part="delta"
          data-gs-animates="emphasis"
          aria-hidden="true"
        >
          {movement ? (
            <>
              {/* The shared chevron, not a typed triangle character. The
                  characters were drawn by the reader's font, so they ignored the
                  stroke token, changed shape on every platform and could not be
                  screenshotted the same way twice: the same fault as the colour
                  emoji this library removed, and invisible to the emoji check
                  because a triangle is not an emoji. A row is 52px, so the mark
                  renders small and takes the thin weight. */}
              <ChevronGlyph
                direction={(entry.delta ?? 0) > 0 ? 'up' : 'down'}
                weight="small"
              />
              {Math.abs(entry.delta ?? 0)}
            </>
          ) : (
            <span className="gs-leaderboard__still" />
          )}
        </span>
      ) : null}
      {/* Player-supplied text, rendered as text by identity. Never
          dangerouslySetInnerHTML. The detail line rides as identity's own
          detail, under the name. The row carries data-gs-you, so identity is
          not told: two elements saying "you" in one row is two matches for a
          selector that wants one. */}
      <Identity
        strings={copy}
        player={{ id: entry.id, displayName: entry.name, avatarUrl: entry.avatarUrl }}
        size={broadcast ? 'large' : 'small'}
        aria-hidden="true"
      >
        {entry.detail}
      </Identity>
      <Stat
        strings={copy}
        className="gs-leaderboard__score"
        kind="score"
        value={entry.score}
        label={scoreLabel}
        format={formatScore}
        aria-hidden="true"
      />
    </li>
  )
}

/**
 * Move every row that changed place back to where it was, then release it, so
 * the browser animates the difference over the reorder token.
 *
 * Under reduced motion the token is `0ms`, so the release lands in the same
 * frame and nothing moves. The DOM order is already the new order either way,
 * which is the property that matters: with no animation at all the list is
 * still correct and still readable.
 */
function useReorder(deps: readonly unknown[]) {
  const listRef = React.useRef<HTMLOListElement>(null)
  const seen = React.useRef(new Map<string, number>())

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-gs-player]'))
    const next = new Map<string, number>()
    const moved: Array<[HTMLElement, number]> = []

    for (const row of rows) {
      const id = row.getAttribute('data-gs-player')
      if (!id) continue
      const top = row.offsetTop
      next.set(id, top)
      const before = seen.current.get(id)
      if (before !== undefined && before !== top) moved.push([row, before - top])
    }
    seen.current = next
    if (moved.length === 0) return

    for (const [row, dy] of moved) {
      row.style.transition = 'none'
      row.style.transform = `translateY(${dy}px)`
    }
    // Read a layout property so the browser commits the offset before the
    // transition is handed back. Without it both writes coalesce and nothing
    // animates.
    void list.offsetHeight
    for (const [row] of moved) {
      row.style.transition = ''
      row.style.transform = ''
    }
  }, deps)

  return listRef
}

export function Leaderboard(props: LeaderboardProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    you: copy['leaderboard.you'],
    empty: copy['leaderboard.empty'],
  } as const
  const {
    entries,
    label = copy['leaderboard.label'],
    presentation = 'list',
    pinYou = true,
    scoreLabel = copy['leaderboard.scoreLabel'],
    formatScore,
    emptyHeading = copy['leaderboard.emptyHeading'],
    emptyBody = copy['leaderboard.emptyBody'],
    emptyAction,
    limit: limitProp,
    onSeeAll,
    zeroRowsLabel,
    className,
    ...rest
  } = componentProps

  // A fixed screen has no room for thirty rows, so it shows the top five and
  // the player's own row, and the rest opens as a sheet. A page scrolls, so it
  // shows every row. The host can always say otherwise.
  const fixedSpace = useFixedSpace()
  const limit = limitProp === 'all' ? undefined : (limitProp ?? (fixedSpace ? 5 : undefined))
  const [expanded, setExpanded] = React.useState(false)
  const limited = limit !== undefined && entries.length > limit && !expanded
  const cut = limited ? entries.slice(0, limit) : entries
  // Zero rows fold into one line when the host asks; the player's own row
  // always stays a row.
  const folded = zeroRowsLabel ? cut.filter((entry) => entry.score === 0 && !entry.you) : []
  const shown = folded.length > 1 ? cut.filter((entry) => !folded.includes(entry)) : cut
  // A rank two rows share reads "=1"; asked of the whole board, not the page.
  const rankCount = new Map<number, number>()
  for (const entry of entries) rankCount.set(entry.rank, (rankCount.get(entry.rank) ?? 0) + 1)
  const isShared = (entry: LeaderboardEntry) => Boolean(entry.tied) || (rankCount.get(entry.rank) ?? 0) > 1
  const movementSlot = entries.some((entry) => entry.delta !== undefined && entry.delta !== 0)
  const youBeyond = limited ? entries.slice(limit).find((entry) => entry.you) : undefined

  const empty = entries.length === 0
  const you = entries.find((entry) => entry.you)
  const listRef = useReorder([entries])

  // Is the player's own row on screen? Measured, not assumed.
  //
  // The pinned copy used to render whenever there was a `you` row at all, so a
  // six-row board showed the same rank twice, two rows apart, and every reader
  // called it a bug before they called it a feature. The design says "pinned
  // bottom when off-screen" and the prop's own doc says "while the list
  // scrolls": both describe a condition nothing was checking.
  //
  // An observer is the honest way to know. Counting rows would be a guess
  // about a height the host controls.
  //
  // Against the screen, not the list's own box. A list usually does not scroll
  // itself: the page or a panel around it does, so an observer rooted on the
  // list saw the row as always inside it, and a player ranked 100th on a long
  // board was never pinned (Stat Attack, 2026-09-28). The viewport root still
  // clips by every scrolling ancestor, the list included when it scrolls, so
  // one observer covers both.
  const [youIsVisible, setYouIsVisible] = React.useState(true)

  React.useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector('[data-gs-you="true"]')
    if (!list || !row || typeof IntersectionObserver === 'undefined') {
      setYouIsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (records) => setYouIsVisible(records.some((record) => record.isIntersecting)),
      { root: null, threshold: 0.6 },
    )
    observer.observe(row)
    return () => observer.disconnect()
  }, [entries, listRef])

  // The announcement problem: a reordering list is a screen-reader trap. Put
  // the list in a live region and one host update reads out every row that
  // moved, which is unusable at twenty rows and hostile at two hundred. So the
  // list announces nothing, and one polite status announces one thing: the
  // player's own rank, and only when it actually changed. Everyone else's
  // movement is visible, and readable on demand by walking the list.
  // Store the event, so a language change also updates an existing announcement.
  const [movement, setMovement] = React.useState<{ rank: number; up: boolean } | null>(null)
  const lastRank = React.useRef<number | undefined>(you?.rank)

  React.useEffect(() => {
    const rank = entries.find((entry) => entry.you)?.rank
    const before = lastRank.current
    lastRank.current = rank
    if (rank === undefined || before === undefined || before === rank) return
    setMovement({ rank, up: before > rank })
  }, [entries])

  const announcement = movement === null ? '' : movement.up
    ? copy['leaderboard.movedUpTo'](STATE_WORD.you, movement.rank)
    : copy['leaderboard.movedDownTo'](STATE_WORD.you, movement.rank)

  return (
    <section
      {...rest}
      className={['gs-leaderboard', className].filter(Boolean).join(' ')}
      data-gs-component="leaderboard"
      data-gs-presentation={presentation}
      data-gs-empty={empty ? 'true' : undefined}
      aria-label={empty ? `${label}, ${STATE_WORD.empty}` : label}
    >
      {/* Always present, always polite, always one sentence. `aria-live` and
          no explicit `role`: a `role="status"` on an element that is empty
          until something happens reads as a control with no accessible name,
          and the live region is not a control. */}
      <div
        className="gs-leaderboard__sr"
        data-gs-scope="leaderboard" data-gs-part="announcement"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {empty ? (
        <div className="gs-leaderboard__empty" data-gs-scope="leaderboard" data-gs-part="empty">
          <span className="gs-leaderboard__empty-glyph" data-gs-scope="leaderboard" data-gs-part="glyph" aria-hidden="true">
            {/* Was U+259A, which drew as a broken image in most fonts. */}
            <EmptyBoxGlyph />
          </span>
          <p className="gs-leaderboard__empty-heading" data-gs-scope="leaderboard" data-gs-part="label">
            {emptyHeading}
          </p>
          <p className="gs-leaderboard__empty-body" data-gs-scope="leaderboard" data-gs-part="detail">
            {emptyBody}
          </p>
          {emptyAction}
        </div>
      ) : (
        <ol className="gs-leaderboard__list" data-gs-scope="leaderboard" data-gs-part="list" ref={listRef}>
          {shown.map((entry) => (
            <Row
              strings={copy}
              key={entry.id}
              entry={entry}
              broadcast={presentation === 'broadcast'}
              scoreLabel={scoreLabel}
              formatScore={formatScore}
              shared={isShared(entry)}
              movementSlot={movementSlot}
            />
          ))}
          {folded.length > 1 && zeroRowsLabel ? (
            <li className="gs-leaderboard__rest" data-gs-scope="leaderboard" data-gs-part="summary">
              {zeroRowsLabel(folded.length)}
            </li>
          ) : null}
        </ol>
      )}

      {pinYou && you && !youIsVisible && !limited ? (
        // The held copy is visual. It repeats a row the screen reader can
        // already reach in the list, so announcing it twice is noise:
        // aria-hidden, and nothing inside it is focusable.
        //
        // The gap comes first. Without something between the list and the held
        // row there is nothing to say the list was cut, so the pinned row reads
        // as the next row and its rank looks wrong. The design draws it as an
        // ellipsis and so do we.
        <>
          <p
            className="gs-leaderboard__gap"
            aria-hidden="true"
            data-gs-scope="leaderboard"
            data-gs-part="gap"
          >
            ···
          </p>
          <ol className="gs-leaderboard__pinned" aria-hidden="true">
            <Row
              strings={copy}
              entry={you}
              pinned
              broadcast={presentation === 'broadcast'}
              scoreLabel={scoreLabel}
              formatScore={formatScore}
              shared={isShared(you)}
              movementSlot={movementSlot}
            />
          </ol>
        </>
      ) : null}

      {youBeyond ? (
        // Not a held copy: on a limited board the player's row is not in the
        // list at all, so this is the row itself, reachable and announced. The
        // gap says the list was cut, so its rank does not read as the sixth.
        <>
          <p className="gs-leaderboard__gap" aria-hidden="true" data-gs-scope="leaderboard" data-gs-part="gap">
            ···
          </p>
          <ol className="gs-leaderboard__list" data-gs-scope="leaderboard" data-gs-part="list">
            <Row
              strings={copy}
              entry={youBeyond}
              broadcast={presentation === 'broadcast'}
              scoreLabel={scoreLabel}
              formatScore={formatScore}
              shared={isShared(youBeyond)}
              movementSlot={movementSlot}
            />
          </ol>
        </>
      ) : null}

      {limited ? (
        <button
          type="button"
          className="gs-leaderboard__see-all gs-pressable gs-action-type"
          data-gs-scope="leaderboard"
          data-gs-part="control"
          aria-label={copy['leaderboard.seeAllLabel'](entries.length)}
          onClick={() => (onSeeAll ? onSeeAll() : setExpanded(true))}
        >
          {copy['leaderboard.seeAll']}
        </button>
      ) : null}
    </section>
  )
}
