'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Choice, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './gamestage-primitives.css'
import './choice.css'

// The host boundary. `./adapter` is a local re-export shim in this repo and the
// installed sibling file in a host application, so the one specifier resolves in
// both places.
import { useGamestageElement, type GamestageResult } from './adapter'
import { CrossGlyph, LockGlyph, StarGlyph, TickGlyph } from './glyphs'

// The cue runtime. `./feel` is a local re-export shim in this repo and the
// installed sibling file in a host application, so the one specifier resolves
// in both places. Deliberately not `element.cue`, which is the adapter's own
// path and gates on nothing: it plays while the library is muted (GSUI-84).
// `useGameFeel` is the gated one, and with no provider above it, it is a no-op.
import { useGameFeel } from './feel'

// How a label too long for its option is fitted. `./label-fit` is a local
// re-export shim in this repo and the installed sibling file in a host
// application, like `./feel` above. GSUI-281.
import {
  labelFitRootProps,
  useLabelFit,
  useLabelFitSettings,
  type LabelFitSettings,
} from './label-fit'

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
 * Choice: one semantic component, five presentations.
 *
 * The same question rendered as buttons, cards, a list, a wheel or an overlay is
 * the same choice. Building those as five components means five state machines,
 * five accessibility stories and five sets of bugs, and it is why this library
 * exists. Presentation is a prop.
 *
 * Choice performs nothing. It does not fetch, does not persist, does not decide
 * whether an answer is right, and does not know who the player is. It reports
 * what the player did and renders what it is told. The host settles the outcome
 * and passes it back, either as the `result` prop or, when the host has wired
 * up an adapter and given this choice an `elementId`, through the adapter's
 * `subscribeForResults`. Both routes end at the same render: the prop is the
 * direct one, the adapter is the one that survives the host being a server.
 *
 * Choice never guesses an outcome for itself, because deciding which option was
 * right is the host's job and doing it here would be the library settling the
 * game. It will render the host's guess: pass `optimistic` and what it returns
 * is on screen in the same tick as the tap, then confirmed or corrected when
 * the host's own answer arrives. Without it the sub-100ms feedback is the
 * committed state, which is synchronous and local. GSUI-127.
 */

export type ChoiceState = 'idle' | 'selected' | 'committed' | 'correct' | 'wrong' | 'rewarded'

export type ChoicePresentation = 'buttons' | 'cards' | 'list' | 'wheel' | 'overlay'

export interface ChoiceOption {
  id: string
  label: string
  /**
   * What the label names. `person` lets a name that does not fit be shortened
   * to "J. Verhoeven" under the `nameFormat` setting. Nothing is shortened
   * without it: a club or a country is never guessed to be a name. GSUI-281.
   */
  kind?: 'person'
  /**
   * The letter in the tile's corner: A, B, C, D in a quiz grid (specimen 1h).
   * Drawn on a raised square in the display face, and when the option settles
   * the tick or the cross takes its place, so the corner is where a player
   * looks for the answer as well as the key. Optional: without it the mark
   * lands in the opposite corner as before.
   */
  key?: string
  /** Optional supporting line. Never carries meaning that the label does not. */
  detail?: string
  media?: React.ReactNode
  /**
   * What this option won, already formatted and signed: `'+250'`, `'x2'`, `'a
   * free spin'`. Rendered as a badge floating clear of the corner, and only
   * when the option settles `rewarded`; at every other point in the round there
   * is nothing to have won yet. Host-formatted rather than a number, because
   * the sign, the separator and the unit are all the game's to decide.
   */
  reward?: string
  /** Not available at all. Flat, no padlock. */
  disabled?: boolean
  /** Available later, not now. Keeps its shape and shows a padlock. */
  locked?: boolean
}

export interface ChoiceResult {
  /** Which options settled which way. Absent ids are left unsettled. */
  [optionId: string]: 'correct' | 'wrong' | 'rewarded'
}

/**
 * The props Choice hands its commit control. Spread them onto whatever the
 * host renders and the control is Choice's: it commits the current selection,
 * it is a real `button` so the keyboard already works, it carries the part
 * attributes a theme and a test read, and it says "Lock it in" unless
 * `commitLabel` says otherwise.
 *
 * Anything written after the spread wins, which is how a host changes the word
 * or takes the press for its own next step:
 *
 * ```tsx
 * commit={(control, round) => (
 *   <Button {...control} onClick={round.settled ? next : control.onClick}>
 *     {round.settled ? 'Next question' : 'Lock it in'}
 *   </Button>
 * )}
 * ```
 */
export interface ChoiceCommitControl {
  type: 'button'
  className: string
  /** Locks the current selection in. A no-op when there is nothing to lock. */
  onClick: () => void
  /** Nothing is selected, or the round is already over. */
  disabled: boolean
  children: React.ReactNode
  'data-gs-scope': 'choice'
  'data-gs-part': 'commit'
  'data-gs-animates': 'motion'
}

/**
 * Where the round has got to, so a host's control can say the right word. A
 * handful of plain facts rather than one phase name: a host that only cares
 * about one of them reads one of them.
 */
export interface ChoiceRound {
  /** The option ids picked but not yet locked in. */
  selected: string[]
  /** Something is picked and the round is still open, so a commit would do something. */
  ready: boolean
  /** The player has locked an answer in. */
  committed: boolean
  /** The host has settled at least one option. */
  settled: boolean
  /** The host closed the round. */
  closed: boolean
  /**
   * Every option the player had picked has since left `options`, so the round
   * is taking answers again and the player has none. GSUI-151.
   */
  stale: boolean
}

/**
 * State colours: custom properties on the option, each defaulting to a theme
 * token, so a theme or a game restyles a state without restating the rule:
 * `--gs-choice-selected-fill`, `-selected-ink`, `-selected-edge`,
 * `-correct-fill`, `-correct-ink`, `-wrong-fill`, `-wrong-ink`, `-wrong-edge`,
 * `-disabled-fill` and `-disabled-ink`. choice.css lists each default. Selected
 * never shares a colour with the primary action or with correct.
 *
 * The label settings: `labelFit`, `maxLines`, `shrinkFloor`, `nameFormat`,
 * `groupFit` and `fitGroup`. Defaults are wrap, 2, 0.85, full, uniform and no
 * shared group; a `LabelFitProvider` above sets them app-wide. See
 * `label-fit.tsx`. GSUI-281.
 */
export interface ChoiceProps extends LabelFitSettings {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  options: ChoiceOption[]
  presentation?: ChoicePresentation
  /** The question. Rendered above the options and as the group's name. */
  label: string
  /**
   * The line under the question: a rule, a stake, how long is left. Never
   * carries meaning the question does not, exactly as an option's `detail`
   * does not carry meaning its label does not.
   */
  detail?: React.ReactNode
  /** More than one pick allowed. */
  multiple?: boolean
  /**
   * Commit as soon as the player picks, with no separate confirm step. Use it
   * for fast rounds; leave it off when a player should be able to change their
   * mind, because an accidental tap that cannot be undone reads as a bug.
   */
  commitOnSelect?: boolean
  /**
   * The word on the commit control. Defaults to "Lock it in". It is the
   * control's accessible name as well as the words on it, so it says what
   * pressing it does rather than naming the game.
   */
  commitLabel?: React.ReactNode
  /**
   * The host renders the commit control itself.
   *
   * Given this, Choice draws no commit control of its own and calls this
   * instead, at every point in the round: before a pick, after one, once the
   * answer is locked in and once the host has settled it. That is the whole
   * reason it exists. Choice's own control appears on a selection and unmounts
   * on settlement, so it can never be the one control a game screen keeps in
   * one place while its word changes from Lock it in to Next question, which
   * is what `docs/mobile-game-frame.md` asks for.
   *
   * The first argument is the control: spread it and the press still commits,
   * the keyboard still works, and the part attributes are still there. The
   * second says where the round has got to, so the host can choose the word.
   *
   * A host that takes the control owns saying what it does at every point in
   * the round, including the points where there is nothing to commit. A
   * control that sits padlocked and wordless for half a round is worse than
   * the one this replaces.
   */
  commit?: (control: ChoiceCommitControl, round: ChoiceRound) => React.ReactNode
  /** Settled outcomes from the host. Presence of this switches to result states. */
  result?: ChoiceResult
  /**
   * What to put on screen the instant the player commits, before the host has
   * answered. Only useful with `elementId`, because it is the adapter that
   * reconciles it: what this returns renders immediately, and when the host
   * settles, an answer that agrees is a confirmation and one that disagrees
   * is a correction, which `onSettled` reports as a second event.
   *
   * This is the host's guess and not Choice's. A quiz whose answer key is
   * already on the device returns the real outcome; a game that cannot know
   * yet leaves this off and the player waits, which is right for a round
   * everyone expects to wait for and wrong for a quiz. GSUI-127.
   *
   * Nothing is counted from a guess: analytics wait for the host.
   */
  optimistic?: (optionIds: string[]) => GamestageResult[]
  /**
   * Names this choice to the host adapter. With it, a select and a commit reach
   * `track` and `submit`, and settled outcomes arrive through
   * `subscribeForResults` without the host re-rendering Choice with a `result`.
   * Without it Choice behaves exactly as it did before the adapter existed:
   * every callback still fires and the host still drives `result`.
   */
  elementId?: string
  /** Locks everything without settling, for a closed round. */
  closed?: boolean

  onSelected?: (optionId: string) => void
  onCommitted?: (optionIds: string[]) => void
  /**
   * Fired once per settled option when `result` arrives.
   *
   * This said "Cues sound and haptics", which it does not do: no component in
   * the library fires a cue, which is GSUI-92. A host that wants sound or a
   * haptic on a settlement calls the feel runtime from this callback itself.
   */
  onSettled?: (optionId: string, state: 'correct' | 'wrong' | 'rewarded') => void
  /**
   * Options the player had picked are no longer in `options`, so the answer
   * they gave cannot be shown and cannot be settled. Fired with the ids that
   * went, once per change, and the host decides what to say about it: only the
   * host knows whether the bracket re-drew, the question was replaced or the
   * feed corrected itself. GSUI-151.
   */
  onSelectionLost?: (optionIds: string[]) => void
}

/** Glyphs, because colour alone is not an answer. Committed carries the
 * padlock: the drawing (1e, 1h, 2b) locks the chosen tile with one, so a fill
 * is never the only thing that says the answer can no longer change. */
const GLYPH: Record<string, React.ReactNode> = {
  committed: <LockGlyph />,
  correct: <TickGlyph />,
  wrong: <CrossGlyph />,
  rewarded: <StarGlyph filled />,
}

/** What the commit control says when nobody has said otherwise. */

export function Choice(props: ChoiceProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const DEFAULT_COMMIT_LABEL = copy['choice.commitLabel']
  const STATE_LABEL: Record<string, string> = {
    selected: copy['choice.selected'],
    committed: copy['choice.lockedIn'],
    correct: copy['choice.correct'],
    wrong: copy['choice.wrong'],
    rewarded: copy['choice.rewarded'],
  }
  const {
    options,
    presentation = 'buttons',
    label,
    detail,
    multiple = false,
    commitOnSelect = false,
    commitLabel = DEFAULT_COMMIT_LABEL,
    commit: renderCommit,
    result,
    optimistic,
    elementId,
    closed = false,
    onSelected,
    onCommitted,
    onSettled,
    onSelectionLost,
    labelFit,
    maxLines,
    minLines,
    shrinkFloor,
    nameFormat,
    groupFit,
    fitGroup,
  } = componentProps

  // The labels are fitted once the group has laid out, and again only on a
  // real resize or font load: picking, locking and settling are not inputs
  // here, so the board never moves under a thumb. GSUI-281.
  const rootRef = React.useRef<HTMLDivElement>(null)
  const fitResolved = useLabelFitSettings({ labelFit, maxLines, minLines, shrinkFloor, nameFormat, groupFit, fitGroup })
  // Every option is given room for `maxLines` unless the author says fewer, so
  // a board of one-line and two-line names is one height throughout. Tom,
  // 2026-09-27: "make all buttons 2 line height".
  const fitSettings = { ...fitResolved, minLines: fitResolved.minLines ?? fitResolved.maxLines }
  const fitItems = React.useMemo(
    () => options.map((o) => ({ id: o.id, label: o.label, person: o.kind === 'person' })),
    [options],
  )
  const fit = useLabelFit(rootRef, fitItems, fitSettings)
  const fitRoot = labelFitRootProps(fitSettings, fit)

  const [selected, setSelected] = React.useState<string[]>([])
  const [committed, setCommitted] = React.useState(false)
  // The last outcome reported for each option, not merely which options have
  // been reported. A `Set` of ids said "this option has settled" and could not
  // say "it settled the other way just now", so a host re-settling a question
  // (a goal given and then disallowed) rendered the cross and fired nothing:
  // no `onSettled`, no `report`, no cue, no analytics. Keyed on the settlement
  // rather than the option, a second settlement with a different outcome is a
  // new event and one with the same outcome is still the same event, which is
  // what the guard was for. GSUI-150.
  const settledAlready = React.useRef(new Map<string, 'correct' | 'wrong' | 'rewarded'>())

  // And the same book for analytics, kept separately because the two answer
  // different questions. What the player saw includes the guess `optimistic`
  // put on screen; what the host settled does not. Counting the guess would
  // report a pass rate the host never agreed to, so `report` waits. GSUI-127.
  const reportedAlready = React.useRef(new Map<string, 'correct' | 'wrong' | 'rewarded'>())

  // Called unconditionally, with or without an element id, because that is what
  // the rules of hooks require. Given none it subscribes to nothing and tells
  // the host nothing.
  const element = useGamestageElement(elementId)

  // What the adapter has settled, in the shape this component renders.
  const fromHost = React.useMemo<ChoiceResult | undefined>(() => {
    if (element.results.length === 0) return undefined
    const settled: ChoiceResult = {}
    for (const one of element.results) settled[one.optionId] = one.state
    return settled
  }, [element.results])

  // An explicit prop wins. A host passing `result` is answering directly, and
  // two sources of truth for one question is how a round ends up rendering the
  // previous round's answer.
  const outcome = result ?? fromHost

  const { report, settlement } = element
  const { cue } = useGameFeel()
  // A guess the host has not answered yet. The player gets the render and the
  // cue, because they tapped and they are owed feedback; analytics do not.
  const unconfirmed = settlement === 'optimistic'

  // The host settles. Report each settlement once, so a re-render does not
  // replay the sound, and report a settlement that changed, because a host
  // changing its mind is something that happened to the player.
  React.useEffect(() => {
    if (!outcome) return
    for (const [id, state] of Object.entries(outcome)) {
      if (!unconfirmed && reportedAlready.current.get(id) !== state) {
        reportedAlready.current.set(id, state)
        report(id, state)
      }
      if (settledAlready.current.get(id) === state) continue
      settledAlready.current.set(id, state)
      onSettled?.(id, state)
      // The design's feedback sheet, specimen 4a and 4b: "Correct · motion.pop
      // 400ms, overshoot 1.12 · sfx.correct (bright, short) · haptic.success"
      // and "Wrong · motion.shake 400ms, ±6px, 3 cycles · sfx.wrong (low, dull,
      // never harsh) · haptic.error · reduced-motion: dashed only". The shake
      // and the dashed stroke are choice.css; this is what it sounds like.
      //
      // `rewarded` fires nothing yet: the design settles a reward on the reward
      // component (specimen 3f, sfx.reveal then sfx.reward), and firing a
      // second cue from here would be the same state change twice.
      if (state === 'correct') {
        cue('correct', 'sfx')
        cue('success', 'haptic')
      } else if (state === 'wrong') {
        cue('wrong', 'sfx')
        cue('error', 'haptic')
      }
    }
  }, [outcome, unconfirmed, onSettled, report, cue])

  // The host's word for a round that is over: the `closed` prop, or the adapter
  // reporting this element locked or closed. Kept apart from `locked` below
  // because a round the player closed by answering is a different fact, and
  // `data-gs-closed` is only ever the host's.
  const closedByHost = closed || element.state === 'locked' || element.state === 'closed'

  // A settled round locks the board too. An *empty* result map is not a settled
  // round: it is the value a host holds before anything has settled, and
  // `useState<ChoiceResult>({})` is how a React host holds a map it fills over
  // time. `!!outcome` was true for `{}`, so passing the obvious initial value
  // decided the round was over on first render: every option aria-disabled,
  // `pick` returning before it fired a callback, and a board that did nothing
  // when a player clicked it. Found by building a game against the library and
  // clicking a card; automation only reported "element is not enabled", which
  // reads as a tooling quirk rather than a dead component.
  const roundSettled = !!outcome && Object.keys(outcome).length > 0

  // A selection can outlive the option it names. A bracket re-draws when the
  // tie feeding it resolves, and `options` arrives holding two real teams where
  // it held "Winner of match 3", which is the id the player committed to.
  //
  // Derived at render rather than repaired in an effect: an effect clears the
  // selection one paint late, and that paint is the bug, a board where every
  // option is `aria-disabled` and nothing says why. GSUI-151.
  const lost = selected.filter((id) => !options.some((option) => option.id === id))
  // Some of the picks surviving is not the same event. A multiple choice that
  // lost one of three options still has an answer, so the round stands and only
  // the option that went is dropped. Stale is the whole answer disappearing.
  const live = selected.filter((id) => options.some((option) => option.id === id))
  const stale = selected.length > 0 && live.length === 0

  // A round nobody can answer is worse than one nobody has answered, so a
  // stale commit does not lock the board. The host has been told; the player
  // gets to pick from what is actually there.
  const locked = (committed && !stale) || closedByHost || roundSettled

  // Once per change, and never for a round whose options never moved. The key
  // is the ids rather than the array, which is new on every render.
  const lostKey = lost.join('\u0000')
  React.useEffect(() => {
    if (lostKey === '') return
    onSelectionLost?.(lostKey.split('\u0000'))
    // `onSelectionLost` is deliberately out of the dependency list: a host
    // handing a fresh closure on every render would otherwise be told the same
    // options went, over and over.
  }, [lostKey])

  // A commit would do something: the player has picked, and the round is still
  // taking answers. It is the condition the built-in control appeared on, named
  // so the host's control can be told the same fact rather than working it out
  // from three props.
  const readyToCommit = !locked && live.length > 0

  function pick(option: ChoiceOption) {
    if (locked || option.disabled || option.locked) return
    const next = multiple
      ? live.includes(option.id)
        ? live.filter((id) => id !== option.id)
        : [...live, option.id]
      : [option.id]
    setSelected(next)
    // The answer that went with the old options went with them. Answering again
    // is answering, not re-answering, so the commit the player no longer has
    // does not lock the board a second time.
    if (stale) setCommitted(false)
    onSelected?.(option.id)
    element.select(option.id)
    if (commitOnSelect && !multiple) {
      // One state change, one sound (the design's cue rules, specimen 4h:
      // "one sound per state change · never on hover"). Committing on select is
      // a single act, so it gets the commit cue and not a select before it.
      commit(next)
      return
    }
    // Specimen 4g draws the same act on a carousel as "sfx.select on settle ·
    // haptic.light", and the catalogue's own words for the two are "soft click"
    // and "tap, select, collect". Picking an option is a selection, not a
    // generic button press, so it is `select` rather than `press`.
    cue('select', 'sfx')
    cue('light', 'haptic')
  }

  function commit(optionIds: string[]) {
    setCommitted(true)
    onCommitted?.(optionIds)
    // Locking an answer in: the catalogue's `commit` is "lock, weighted" and
    // haptic.medium is "commit, streak, GO".
    cue('commit', 'sfx')
    cue('medium', 'haptic')
    // The guess is the host's, handed forward as well as rendered, so the host
    // can tell whether its own answer confirms what the player already saw or
    // corrects it. Without the prop this is the call it always was.
    element.commit(optionIds, optimistic ? { optimistic: optimistic(optionIds) } : undefined)
  }

  /**
   * What the player did with this option. Independent of how it turned out: an
   * option the player committed keeps `committed` after the round settles,
   * because committed means locked in and no longer reversible, which a settled
   * option is. Reading the two as one ladder is what used to drop the player's
   * own answer off the results screen.
   */
  function pickOf(option: ChoiceOption): 'selected' | 'committed' | undefined {
    if (!selected.includes(option.id)) return undefined
    return locked ? 'committed' : 'selected'
  }

  /** How it turned out. The host's fact, not the component's. */
  function settledOf(option: ChoiceOption): 'correct' | 'wrong' | 'rewarded' | undefined {
    return outcome?.[option.id]
  }

  /** The one word the accessible name uses: the outcome if there is one, else the pick. */
  function stateOf(option: ChoiceOption): ChoiceState {
    return settledOf(option) ?? pickOf(option) ?? 'idle'
  }

  // The question, on the screen.
  //
  // `label` was the group's accessible name and nothing else, so the one thing
  // a choice exists to ask was announced to a screen reader and invisible to
  // everyone else: a sighted player saw the options and no question. That is
  // backwards from the usual failure, where the visible text exists and the
  // name is missing.
  //
  // It is `aria-labelledby` now rather than `aria-label`, so the name comes
  // from the words on the screen instead of a second copy of them. A host that
  // renders its own heading and passes the same string no longer has it read
  // twice.
  const labelId = React.useId()

  return (
    <div
      ref={rootRef}
      className="gs-choice"
      data-gs-component="choice"
      data-gs-presentation={presentation}
      data-gs-label-fit={fitRoot['data-gs-label-fit']}
      data-gs-label-lines={fitRoot['data-gs-label-lines']}
      style={fitRoot.style}
      data-gs-closed={closedByHost ? 'true' : undefined}
      data-gs-stale={stale ? 'true' : undefined}
      role={multiple ? 'group' : 'radiogroup'}
      aria-labelledby={labelId}
    >
      <p className="gs-choice__question" id={labelId} data-gs-scope="choice" data-gs-part="label">
        {label}
      </p>
      {detail ? (
        <p className="gs-choice__subtitle" data-gs-scope="choice" data-gs-part="detail">
          {detail}
        </p>
      ) : null}
      {options.map((option) => {
        const playerPick = pickOf(option)
        const settled = settledOf(option)
        const state = stateOf(option)
        const isResult = !!settled
        const unavailable = option.disabled || option.locked || (locked && !isResult)
        // Flat is for a control with nothing of its own to show. A settled
        // option, the option the player picked and an option carrying its own
        // padlock all draw something a player reads; every other option in a
        // round that is over is simply not available, and goes flat. That is
        // how the design dims the answers nobody picked once the round is over
        // (BDS-012, specimen 1h), and it is the attribute a host or a test
        // reads to see a closed round on the options themselves.
        const flat = option.disabled || (locked && !isResult && !playerPick && !option.locked)

        // The accessible name carries the state, because a screen reader user
        // gets no fill, no stroke and no glyph. The reward badge goes in here
        // too: it is the only place the amount appears that is not a drawing,
        // and a player who cannot see the badge has otherwise been told they
        // were rewarded without being told what with.
        const stateWord = STATE_LABEL[state]
        const words = [option.label]
        if (stateWord) words.push(stateWord)
        if (state === 'rewarded' && option.reward) words.push(option.reward)
        const ariaLabel = words.join(', ')

        // The mark: a padlock for a locked or committed option, the outcome's
        // glyph once settled. A settled option with a key shows the mark in
        // the key's square rather than the opposite corner.
        const mark = option.locked ? <LockGlyph /> : GLYPH[state]
        const markInKey = Boolean(option.key) && isResult

        // What is drawn, which may be a shortened name. The accessible name
        // above is built from `option.label`, so it is always the full one.
        const plan = fit.plans.get(option.id)
        const drawn = plan?.text ?? option.label
        const labelStyle =
          plan && fitSettings.groupFit === 'each'
            ? ({ ['--gs-label-scale' as string]: plan.scale } as React.CSSProperties)
            : undefined

        return (
          <button
            key={option.id}
            type="button"
            className="gs-choice__option gs-action-type gs-pressable"
            {...pressHandlers}
            data-gs-choice={option.id}
            data-gs-selected={playerPick === 'selected' ? 'true' : undefined}
            data-gs-committed={playerPick === 'committed' ? 'true' : undefined}
            data-gs-state={settled}
            data-gs-disabled={flat ? 'true' : undefined}
            data-gs-locked={option.locked ? 'true' : undefined}
            data-gs-label-name={plan?.name}
            // The option moves on press and on the wrong-answer shake, so it is
            // motion. Its fill, glyph and glow are emphasis and survive reduced
            // motion, which is how a player who cannot see movement still gets
            // the answer.
            data-gs-animates="motion"
            role={multiple ? 'checkbox' : 'radio'}
            // The pick, not the outcome. A radio that reads unchecked on the
            // results screen tells a screen reader user the player answered
            // nothing.
            aria-checked={!!playerPick}
            aria-label={ariaLabel}
            aria-disabled={unavailable || undefined}
            disabled={option.disabled}
            onClick={() => pick(option)}
          >
            {option.key ? (
              <span className="gs-choice__key" aria-hidden="true">
                {markInKey ? (
                  <span className="gs-choice__glyph" data-gs-animates="emphasis">{mark}</span>
                ) : (
                  option.key
                )}
              </span>
            ) : null}
            {option.media ? <span className="gs-choice__media">{option.media}</span> : null}
            <span
              className="gs-choice__label"
              ref={fit.labelRef(option.id)}
              style={labelStyle}
            >
              {drawn}
            </span>
            {/* A card keeps a line for its detail whether or not it has one,
                so an option that gains a line mid-play (a wrong guess saying
                why) does not grow and move the board. Tom, 2026-09-27. */}
            {option.detail ? (
              <span className="gs-choice__detail">{option.detail}</span>
            ) : presentation === 'cards' ? (
              <span className="gs-choice__detail" data-gs-empty="true" aria-hidden="true">{'\u00a0'}</span>
            ) : null}
            {mark && !markInKey ? (
              option.locked ? (
                <span className="gs-choice__glyph" aria-hidden="true">{mark}</span>
              ) : (
                <span className="gs-choice__glyph" data-gs-animates="emphasis" aria-hidden="true">
                  {mark}
                </span>
              )
            ) : null}
            {/* The amount won, floating clear of the corner rather than sitting
                inside the control (BDS-012, specimen 1e). Hidden, because the
                accessible name above already carries it; announcing it here as
                well reads the amount twice. `delta` is the part vocabulary's
                word for a signed change, which is what this is. */}
            {state === 'rewarded' && option.reward ? (
              <span
                className="gs-choice__reward"
                data-gs-scope="choice" data-gs-part="delta"
                data-gs-animates="emphasis"
                aria-hidden="true"
              >
                {option.reward}
              </span>
            ) : null}
          </button>
        )
      })}

      {renderCommit
        ? renderCommit(
            {
              type: 'button',
              // Placement only. The host's control keeps its own face, and
              // `gs-choice__commit` is what puts it across the grid under the
              // options rather than beside the last one.
              className: 'gs-choice__commit',
              onClick: () => {
                if (!readyToCommit) return
                commit(live)
              },
              disabled: !readyToCommit,
              children: commitLabel,
              'data-gs-scope': 'choice',
              'data-gs-part': 'commit',
              'data-gs-animates': 'motion',
            },
            {
              selected: live,
              ready: readyToCommit,
              committed: committed && !stale,
              settled: roundSettled,
              closed: closedByHost,
              stale,
            },
          )
        : !commitOnSelect && readyToCommit ? (
            <button
              type="button"
              className="gs-choice__commit gs-choice__commit--default gs-action-type gs-pressable"
              {...pressHandlers}
              data-gs-scope="choice" data-gs-part="commit"
              data-gs-animates="motion"
              onClick={() => commit(live)}
            >
              {commitLabel}
            </button>
          ) : null}
    </div>
  )
}
