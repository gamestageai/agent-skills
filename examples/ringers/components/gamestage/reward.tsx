'use client'

import { useStrings, defaultStrings, type StringsOverrides, type Strings } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Reward, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './reward.css'

// The shared rule sets, so the theme's action face, display face and press
// gesture reach this component. GSUI-118: the file shipped with the tokens and
// nothing imported it, so the classes matched nothing in a real install.
import './gamestage-primitives.css'

import { LockGlyph, StarGlyph, TickGlyph } from './glyphs'

/**
 * Reward: one thing a player can be given.
 *
 * A prize, a badge, a pack, a ticket, a discount code. It renders the object
 * and where that object is in its lifecycle, and it does nothing else. It does
 * not decide that a reward was earned, does not fetch it, does not claim it and
 * does not know what it is worth. Rewards are settled by the host (BDS-023 and
 * the attribute contract's "`rewarded` is a state without an event"), so every
 * lifecycle change arrives as a prop.
 *
 * Four drawings on `data-gs-presentation`, three from specimen 3d and one from 5b:
 *
 *   `card`    the reward in an inventory: prize art, the name, and a tail that
 *             is the state. Earned carries the claim control, available carries
 *             a progress track, locked a padlock, claimed a tick.
 *   `reveal`  the tap-to-reveal surface a host shows once: a pulsing question
 *             mark until it is pressed, then rays, the prize and its name.
 *             Only an earned reward has a reveal; any other state asked for it
 *             renders the card, because there is nothing to open.
 *   `badge`   the roundel of specimens 3d and 4d: one disc whose ring says the
 *             tier and whose centre is a glyph slot, with no name under it,
 *             because the profile and the rewards sheet draw a row of these
 *             and read them as marks. Behaves as the compact cell does: the
 *             whole disc is the button when the host passes `onSelect`.
 *   `compact` the cell of specimen 5b's inventory grid: square art over a
 *             name, three or four to a row. The state sits on the cell rather
 *             than under it: an earned reward is ringed and wears a NEW pill,
 *             a claimed one dims behind a tick, a locked one is a dashed well
 *             with a padlock and its level, a badge's art is a circle with a
 *             tier ring, and a reward held more than once says `x3` over the
 *             art. The whole cell is the button when the host passes
 *             `onSelect`; opening a sheet with the detail is the host's job.
 *
 * The lifecycle lives on `data-gs-reward-state` and deliberately not on
 * `data-gs-state`. `data-gs-state` is the settled outcome of something the
 * player did: set once, never revisited, and the three-things rule is defined
 * against exactly its three values. This one is host-driven and revisited over
 * time. Two concerns, two attributes. A locked reward is
 * `data-gs-reward-state="locked"` and never `data-gs-locked`, which stays a
 * control attribute.
 *
 * Revealing and claiming are the two things a player does here, so both are
 * real `<button>`s and Enter and Space work without any key handling of our
 * own. Which element is the button is decided below, once, so a host can never
 * be handed a button inside a button.
 */

export type RewardState = 'locked' | 'available' | 'earned' | 'claimed'

export type RewardPresentation = 'card' | 'reveal' | 'compact' | 'badge'

/**
 * A badge's tier, drawn as the ring around its art.
 *
 * `featured` is not a fourth metal. Specimens 3d and 4d draw one badge in the
 * row larger than the others, filled in the reward colour with a glow rather
 * than ringed: it is the badge the surface is leading with, whatever metal it
 * would otherwise be. `podium` colours the same three metals by place and
 * takes no tier of its own, so the word is shared rather than duplicated.
 */
export type RewardTier = 'bronze' | 'silver' | 'gold' | 'featured'

// `onSelect` is omitted from the DOM attributes because it is ours: the press
// on a compact cell, with the reward's id, rather than the text-selection
// event of the same name that nothing here would ever fire.
export interface RewardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The reward's id. Machine-readable, and what an inventory keys on. */
  id: string
  /** Where the reward is in its lifecycle. Host-driven, always. */
  state: RewardState
  /** The reward's name, as a player reads it. */
  label: string
  /** A supporting line. Never carries meaning the label does not. */
  detail?: string
  /**
   * What the reward is worth, as a number: 500 coins, 3 packs. Rendered beside
   * the name and carried machine-readably on `data-gs-value`.
   */
  value?: number
  /** The reveal has played. Only meaningful while the reward is earned. */
  revealed?: boolean
  /**
   * The prize art: an image, a Lottie slot, anything the host draws. It fills
   * the media slot on the card and the disc on an opened reveal. Without it the
   * slot is a quiet well, and the state's glyph sits in it.
   */
  media?: React.ReactNode
  /**
   * How far the player is towards an available reward, as `progress` out of
   * `max` (2 of 5 rounds), or as a fraction when `max` is omitted. Renders the
   * track on an available card and nothing anywhere else.
   */
  progress?: number
  max?: number
  /** Which of the four drawings. See the note at the top. */
  presentation?: RewardPresentation
  /**
   * The registry item name a wrapper wants on the root. `badge` is its own
   * item to a host and to a test, the way `multiplier` is stat's, and a
   * profile holding a row of badges beside a reward card needs to tell them
   * apart. Defaults to `reward`, so nothing that has never heard of this
   * changes.
   */
  component?: string
  /**
   * The badge's tier, for a reward that is one. A compact cell draws the art
   * as a circle with the tier's ring; the card ignores it. Carried on
   * `data-gs-tier`.
   */
  tier?: RewardTier
  /**
   * How many of this reward the player holds, when it is more than one: three
   * tokens. Not `value`, which is what one of it is worth. A compact cell
   * writes it over the art as `x3`; carried on `data-gs-count`.
   */
  count?: number
  /** The words on the reveal before it opens, and on the card's control while it is waiting. */
  revealLabel?: string
  /** The word on the claim control. */
  claimLabel?: string
  /** The word on the pill an earned compact cell wears. The drawing writes NEW. */
  newLabel?: string
  /**
   * The player pressing a compact cell. Supplying it makes the whole cell a
   * button; what opens next, the drawing's sheet with the reward's detail, is
   * the host's. Ignored by the card and the reveal, which have their own acts.
   */
  onSelect?: (id: string) => void
  /**
   * The player opening the reward. Fires only while the reward is earned and
   * unrevealed; at every other point in the lifecycle there is nothing to open.
   */
  onReveal?: (id: string) => void
  /**
   * The player claiming an earned, revealed reward. Supplying it renders the
   * claim control the drawing puts on the earned card. Claiming is settled by
   * the host: this reports the press and changes nothing.
   */
  onClaim?: (id: string) => void
}

/**
 * The words that go with the states, fixed by the attribute contract's
 * accessible-name table so that reward, inventory and everything downstream
 * cannot ship three vocabularies for one lifecycle.
 */

/**
 * The waiting glyph. BDS-023 loops `motion.pulse` on an unrevealed reward, and
 * that is a `motion` element, so under reduced motion it stops dead. The
 * waiting state therefore also exists as this glyph and as the reward ring
 * around it, and `reward.test.tsx` asserts exactly that.
 */
const WAITING_GLYPH = '?'

/** The accessible name, in one place, because the inventory reads it too. */
export function rewardName({
  label,
  state,
  value,
  revealed,
}: Pick<RewardProps, 'label' | 'state' | 'value' | 'revealed'>, copy: Strings = defaultStrings): string {
  const STATE_LABEL: Record<RewardState, string> = {
    locked: copy['reward.locked'],
    available: copy['reward.available'],
    earned: copy['reward.earned'],
    claimed: copy['reward.claimed'],
  }
  const WAITING_LABEL = copy['reward.waiting']

  // What it is, then what it is worth, then what is true about it. The same
  // order `stat` uses, for the same reason: a screen reader user gets no fill,
  // no glyph and no motion, so the name has to carry all of it.
  const words: string[] = [label]
  if (value !== undefined) words.push(String(value))
  words.push(STATE_LABEL[state])
  if (state === 'earned' && !revealed) words.push(WAITING_LABEL)
  return words.join(', ')
}

/** 0 to 1, whatever the host passed. */
function fraction(progress: number, max: number | undefined): number {
  const ratio = max === undefined || max <= 0 ? progress : progress / max
  return Math.min(1, Math.max(0, ratio))
}

export function Reward(props: RewardProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const DEFAULT_REVEAL_LABEL = copy['reward.revealLabel']
  const DEFAULT_CLAIM_LABEL = copy['reward.claimLabel']
  const DEFAULT_NEW_LABEL = copy['reward.newLabel']
  const {
    id,
    state,
    label,
    detail,
    value,
    revealed = false,
    media,
    progress,
    max,
    presentation: askedFor = 'card',
    component = 'reward',
    tier,
    count,
    revealLabel = DEFAULT_REVEAL_LABEL,
    claimLabel = DEFAULT_CLAIM_LABEL,
    newLabel = DEFAULT_NEW_LABEL,
    onReveal,
    onClaim,
    onSelect,
    className,
    onClick,
    ...rest
  } = componentProps

  // Earned and not yet opened. The only point in the lifecycle where opening
  // means anything.
  const waiting = state === 'earned' && !revealed
  // Earned and open. The only point where claiming means anything.
  const claimable = state === 'earned' && revealed
  // The reveal is a drawing of an earned reward. Asking for it on anything
  // else gets the card, and the attribute says which one actually rendered.
  const presentation: RewardPresentation =
    askedFor === 'reveal' ? (state === 'earned' ? 'reveal' : 'card') : askedFor
  const compact = presentation === 'compact'
  // The roundel of specimens 3d and 4d: the disc and its ring, and nothing
  // else. It shares the compact cell's behaviour - the whole thing is the
  // button when the host passes `onSelect`, and reveal and claim happen on
  // whatever the host opens - and differs from it in drawing no name under
  // the art, because a badge row is read as a row of marks.
  const roundel = presentation === 'badge'
  const cell = compact || roundel

  // The reveal, BDS-023 and the drawing's note beside the reward: "reveal:
  // motion.reveal 600ms + rays". It plays when `revealed` flips to true while
  // the reward is earned, and it plays by remounting the face with the
  // capability on it, so `replay` is the face's key. The previous value is
  // kept in state and compared during render, so the motion lands in the same
  // commit as the revealed state. A reward that mounts already revealed has
  // nothing to reveal and does not play it.
  const [wasRevealed, setWasRevealed] = React.useState(revealed)
  const [reveal, setReveal] = React.useState<{ replay: number } | null>(null)
  if (revealed !== wasRevealed) {
    setWasRevealed(revealed)
    if (revealed && state === 'earned') setReveal((last) => ({ replay: (last?.replay ?? 0) + 1 }))
  }
  const revealing = reveal !== null && revealed && state === 'earned'

  // Which element is the button, decided once.
  //
  // With `onReveal` alone the root is the button, as it always was: the whole
  // object opens, and it stays the same element after the reveal so the press
  // that revealed it does not destroy the focused node and drop focus to the
  // body, which is the exact moment a keyboard player most needs to stay put.
  //
  // With `onClaim` on a card, the root is a group and one control inside it is
  // the button: the claim control the drawing puts on the earned card, which
  // while the reward is still waiting is the reveal control instead. One
  // element for both jobs, for the same focus reason, and it sits outside the
  // face, which remounts to play the reveal. A root button holding a claim
  // button would be a button inside a button, which HTML forbids.
  //
  // A compact cell is simpler: it is the button when the host passes
  // `onSelect`, in every state, because pressing it opens the detail rather
  // than revealing or claiming anything. Reveal and claim happen on the sheet
  // the host opens, so `onReveal` and `onClaim` do nothing here.
  const rootIsButton = cell
    ? onSelect !== undefined
    : onReveal !== undefined && (presentation === 'reveal' || onClaim === undefined)
  const innerControl =
    presentation === 'card' && onClaim !== undefined && (claimable || (waiting && onReveal !== undefined))
  // What a press on the root does, and whether it does anything at all.
  const pressable = cell ? onSelect !== undefined : waiting

  const attributes = {
    ...rest,
    // No gs-action-type here, deliberately. The root's content is an object's
    // name, its value and a line of detail rather than the word on a control
    // you press to commit. Typing the whole subtree made arcade shout the
    // reward's name at weight 900. The claim control below carries the action
    // axis, because that is the one word here a player presses.
    className: ['gs-reward', rootIsButton ? 'gs-pressable' : null, className].filter(Boolean).join(' '),
    'data-gs-component': component,
    'data-gs-reward': id,
    'data-gs-reward-state': state,
    'data-gs-presentation': presentation,
    // Boolean attributes are `true` or absent, never `"false"`: a selector for
    // the absence of `false` matches an element that does not exist.
    'data-gs-revealed': revealed ? 'true' : undefined,
    'data-gs-value': value,
    'data-gs-tier': tier,
    'data-gs-count': count,
    'aria-label': rewardName({ label, state, value, revealed }, copy),
  }

  // The state's mark, or nothing. Available is the idle state and has none, as
  // the drawing has none: the progress track is what says available. Earned
  // once open is the star; locked the padlock; claimed the tick; waiting the
  // question mark, which is text rather than a drawing so that the reveal can
  // set it in the display face at forty points.
  //
  // A compact cell keeps the padlock and the tick and drops the other two: the
  // drawing marks an earned cell with the ring and the NEW pill, whether or not
  // it has been opened, and a question mark would sit on top of the art.
  const glyph =
    state === 'locked' ? <LockGlyph /> :
    state === 'claimed' ? <TickGlyph /> :
    cell ? null :
    waiting ? WAITING_GLYPH :
    state === 'earned' ? <StarGlyph filled /> :
    null

  // Emphasis, never motion: the glyph is the change that survives reduced
  // motion, and it is how the waiting state stays visible once the pulse has
  // stopped. The pulse rides inside it, on its own element, marked motion: the
  // drawing's own `motion.pulse` loop from motion.css, scale 1 to 1.06, which
  // stops entirely under reduced motion, which is why the glyph exists.
  const mark =
    glyph === null ? null : (
      <span
        className="gs-reward__glyph"
        data-gs-scope="reward" data-gs-part="glyph"
        data-gs-animates="emphasis"
        aria-hidden="true"
      >
        {glyph}
        {waiting && !cell ? (
          <span
            className="gs-reward__pulse"
            data-gs-scope="reward" data-gs-part="pulse"
            data-gs-motion="pulse"
            data-gs-animates="motion"
            aria-hidden="true"
          />
        ) : null}
      </span>
    )

  // The rays behind a revealed reward, turning on the rays token. A loop, so
  // it is motion and stops under reduced motion, where the rays stay drawn and
  // still. Clipped by the face, behind its contents (reward.css). On the card
  // they turn only while the reveal is playing; on the reveal they are the
  // drawing's open state, so they are there whenever it is open.
  const rays = (
    <span
      className="gs-reward__rays"
      data-gs-scope="reward" data-gs-part="rays"
      data-gs-motion="rays"
      data-gs-animates="motion"
      aria-hidden="true"
    />
  )

  const track =
    state === 'available' && progress !== undefined ? (
      <span
        className="gs-reward__track"
        data-gs-scope="reward" data-gs-part="track"
        style={{ '--gs-progress': fraction(progress, max) } as React.CSSProperties}
      >
        <span className="gs-reward__fill" data-gs-scope="reward" data-gs-part="fill" data-gs-animates="motion" />
      </span>
    ) : null

  const control = innerControl ? (
    <button
      type="button"
      className="gs-reward__commit gs-action-type gs-pressable"
      data-gs-scope="reward" data-gs-part="commit"
      data-gs-animates="motion"
      // The control's own name says what it does to which reward, because the
      // root's name is hidden from it and "Claim" alone is not a name.
      aria-label={copy['reward.action'](waiting ? revealLabel : claimLabel, label)}
      onClick={() => (waiting ? onReveal?.(id) : onClaim?.(id))}
    >
      {waiting ? revealLabel : claimLabel}
    </button>
  ) : null

  // Everything but the control is hidden: the root's label above is the
  // accessible name, and announcing the pieces again would read the reward
  // twice. The face is the surface the reveal plays on; it remounts to play.
  const face = (
    <span
      key={reveal?.replay}
      className="gs-reward__face"
      data-gs-scope="reward" data-gs-part="face"
      data-gs-motion={revealing ? 'reveal' : undefined}
      data-gs-animates="motion"
      aria-hidden="true"
    >
      {roundel ? (
        // The roundel: one disc, the ring saying the tier, and the state's
        // mark inside it where the glyph goes. No name under it, which is the
        // whole difference from the compact cell: specimens 3d and 4d draw a
        // row of these and the names are not in the row.
        <span className="gs-reward__media" data-gs-scope="reward" data-gs-part="media">
          {media}
          {mark}
        </span>
      ) : compact ? (
        // The cell: square art with the state's mark in it, the name under
        // it, and for a locked reward the level line the drawing writes under
        // the padlock. A locked cell has no art slot: the drawing draws the
        // padlock straight onto the dashed well.
        <>
          {state === 'locked' ? (
            mark
          ) : (
            <span className="gs-reward__media" data-gs-scope="reward" data-gs-part="media">
              {media}
              {mark}
            </span>
          )}
          {state === 'locked' && detail ? (
            <span className="gs-reward__detail" data-gs-scope="reward" data-gs-part="detail">
              {detail}
            </span>
          ) : (
            <span className="gs-reward__label" data-gs-scope="reward" data-gs-part="label">
              {label}
            </span>
          )}
        </>
      ) : presentation === 'reveal' ? (
        revealed ? (
          <>
            {rays}
            <span className="gs-reward__media" data-gs-scope="reward" data-gs-part="media">
              {media ?? mark}
            </span>
            <span className="gs-reward__label" data-gs-scope="reward" data-gs-part="label">
              {label}
            </span>
          </>
        ) : (
          <>
            {mark}
            <span className="gs-reward__note" data-gs-scope="reward" data-gs-part="note">
              {revealLabel}
            </span>
          </>
        )
      ) : (
        <>
          {revealing ? rays : null}
          <span className="gs-reward__media" data-gs-scope="reward" data-gs-part="media">
            {media}
            {mark}
          </span>
          <span className="gs-reward__label" data-gs-scope="reward" data-gs-part="label">
            {label}
          </span>
          {value !== undefined ? (
            <span className="gs-reward__value gs-display-type" data-gs-scope="reward" data-gs-part="value">
              {value}
            </span>
          ) : null}
          {detail ? (
            <span className="gs-reward__detail" data-gs-scope="reward" data-gs-part="detail">
              {detail}
            </span>
          ) : null}
          {track}
        </>
      )}
    </span>
  )

  // The two things a compact cell wears outside its face, because the face
  // clips to its radius and both of these hang over the art: the count, and
  // the NEW pill on an earned reward. Both are read through the root's name.
  const badges = compact ? (
    <>
      {count !== undefined ? (
        <span className="gs-reward__value" data-gs-scope="reward" data-gs-part="value" aria-hidden="true">
          {copy['reward.count'](count)}
        </span>
      ) : null}
      {state === 'earned' ? (
        <span className="gs-reward__note" data-gs-scope="reward" data-gs-part="note" aria-hidden="true">
          {newLabel}
        </span>
      ) : null}
    </>
  ) : null

  const inner = (
    <>
      {face}
      {control}
      {badges}
    </>
  )

  if (!rootIsButton) {
    return (
      <div {...attributes} role="group" onClick={onClick as React.MouseEventHandler<HTMLDivElement>}>
        {inner}
      </div>
    )
  }

  return (
    <button
      {...attributes}
      type="button"
      // Honest about what the press does. A claimed reward rendered inside an
      // inventory that passes one `onReveal` for the whole collection is still
      // a button, and telling a screen reader it can be pressed would be a lie.
      // aria-disabled rather than the native attribute: the reward stays
      // reachable, so it can still be read.
      aria-disabled={pressable ? undefined : true}
      onClick={(event) => {
        if (!pressable) {
          // A host may have overridden `type`, and a reward that is not waiting
          // must not submit a form.
          event.preventDefault()
          return
        }
        ;(onClick as React.MouseEventHandler<HTMLButtonElement> | undefined)?.(event)
        if (cell) onSelect?.(id)
        else onReveal?.(id)
      }}
    >
      {inner}
    </button>
  )
}
