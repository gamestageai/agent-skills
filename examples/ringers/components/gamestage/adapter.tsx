'use client'

import * as React from 'react'

/**
 * The host boundary, as a type.
 *
 * Gamestage UI renders and reports. The host performs. Everything the library
 * cannot do for itself, because it touches the network, the device, the
 * player's identity or durable storage, arrives here as a plain function.
 *
 * The vocabulary is deliberately plain: `track`, `submit`, `store`,
 * `subscribeForResults` and `subscribeForStateChange`. Each one names what the
 * host does rather than how it does it, so the same seam reads the same way
 * whatever sits behind it.
 *
 * Nothing in this file imports an SDK, opens a socket or calls `fetch`, and
 * nothing in it reads `localStorage`. The built-in adapter keeps its state in
 * memory for the lifetime of the page, which is why a developer with no host at
 * all still gets a game that works.
 */

export interface GamestagePlayer {
  id: string
  displayName?: string
  avatarUrl?: string
}

/** Where a round is up to. The host owns this; the library only renders it. */
export type GamestageElementState = 'open' | 'locked' | 'settled' | 'closed'

/** How an option settled. The library never decides which of these applies. */
export type GamestageOutcome = 'correct' | 'wrong' | 'rewarded'

/**
 * Whether the number on screen is the host's answer yet.
 *
 * `optimistic` is a local render the host has not confirmed, `settled` is the
 * host agreeing, and `corrected` is the host disagreeing with what the player
 * was already shown. These are the values `data-gs-settlement` takes, so the
 * settlement this seam reports goes straight into `<Stat settlement={...} />`
 * with no mapping in between.
 */
export type GamestageSettlement = 'optimistic' | 'settled' | 'corrected'

export interface GamestageResult {
  optionId: string
  state: GamestageOutcome
  points?: number
}

export interface GamestageSubmission {
  elementId: string
  optionIds: string[]
  value?: number
  /**
   * What the player has already been shown, if the component rendered
   * optimistically. The host gets it so it can tell whether its own answer
   * agrees with the one on screen, and correct it rather than silently
   * replacing it.
   */
  optimistic?: GamestageResult[]
}

/**
 * Analytics, as events named for what the player did rather than for what the
 * host should do next. There is no `choice.rewarded`: a reward is settled by
 * the host, so the player did not do it and it arrives through
 * `subscribeForResults` instead.
 */
export type GamestageEvent =
  | { type: 'choice.selected'; elementId: string; optionId: string }
  | { type: 'choice.committed'; elementId: string; optionIds: string[] }
  | { type: 'choice.correct'; elementId: string; optionId: string }
  | { type: 'choice.wrong'; elementId: string; optionId: string }

export interface GamestageStore {
  get: (key: string) => Record<string, unknown> | null
  set: (key: string, value: Record<string, unknown>, ttl?: number) => void
  remove: (key: string) => void
}

export interface GamestageAdapter {
  /** Who is playing. Null before sign-in; components render the signed-out case. */
  player: GamestagePlayer | null

  /** Fire and forget. Never awaited, never blocks a render. */
  track: (event: GamestageEvent) => void

  /**
   * The player committed to something. The host settles it and pushes the
   * outcome back through `subscribeForResults`.
   *
   * This returns void rather than a promise on purpose. A component that could
   * await a settlement would await it, and the player would watch a spinner
   * where the feedback should be.
   */
  submit: (input: GamestageSubmission) => void

  /** Durable, host-owned state. Components never touch localStorage themselves. */
  store: (elementId: string) => GamestageStore

  /** Settled outcomes arrive here. Returns an unsubscribe function. */
  subscribeForResults: (
    elementId: string,
    callback: (results: GamestageResult[]) => void,
  ) => () => void

  /** Open, locked, settled, closed. Returns an unsubscribe function. */
  subscribeForStateChange: (
    elementId: string,
    callback: (state: GamestageElementState) => void,
  ) => () => void

  /**
   * Sound and haptics as intent. The library says what happened, never which
   * file to play, so the host owns the audio and the operating system's silent
   * switch is honoured without the library ever asking for permission.
   */
  cue?: (name: string, kind: 'sfx' | 'haptic') => void
}

// ---------------------------------------------------------------- built-in --

export interface BuiltinAdapterOptions {
  player?: GamestagePlayer | null
  /**
   * How a submission settles. Whatever this returns is published to the
   * element's result subscribers, synchronously, inside `submit`.
   *
   * The default repeats the optimistic result the component already rendered.
   * That is the whole of the built-in's cleverness, and it is deliberately
   * none: the library still does not decide whether an answer is right, it
   * confirms what the caller said. A game with an answer key passes one in.
   */
  settle?: (input: GamestageSubmission) => GamestageResult[] | void
  /** Analytics sink for a developer who wants to see the events. */
  onTrack?: (event: GamestageEvent) => void
  /** Sound and haptics. Absent means silence, which is what no host means. */
  cue?: (name: string, kind: 'sfx' | 'haptic') => void
}

const echoOptimistic = (input: GamestageSubmission) => input.optimistic ?? []

/**
 * A real adapter that performs nothing outside the page.
 *
 * State lives in a `Map` for as long as the tab does. Nothing is written to
 * storage, nothing is sent anywhere, and settlement is synchronous, so a
 * developer who has wired up no host at all still sees a game that responds to
 * a tap in the same frame.
 *
 * This is also the adapter used when there is no provider, so the unconfigured
 * path and the configured one are one code path rather than two.
 */
export function createBuiltinAdapter(options: BuiltinAdapterOptions = {}): GamestageAdapter {
  const settle = options.settle ?? echoOptimistic
  const memory = new Map<string, Record<string, unknown>>()
  const resultListeners = new Map<string, Set<(results: GamestageResult[]) => void>>()
  const stateListeners = new Map<string, Set<(state: GamestageElementState) => void>>()

  function listeners<T>(map: Map<string, Set<T>>, elementId: string): Set<T> {
    let set = map.get(elementId)
    if (!set) {
      set = new Set<T>()
      map.set(elementId, set)
    }
    return set
  }

  return {
    player: options.player ?? null,

    track(event) {
      options.onTrack?.(event)
    },

    submit(input) {
      memory.set(`${input.elementId}:committed`, { optionIds: input.optionIds })
      const results = settle(input) ?? []
      for (const listener of listeners(resultListeners, input.elementId)) listener(results)
      if (results.length > 0) {
        for (const listener of listeners(stateListeners, input.elementId)) listener('settled')
      }
    },

    store(elementId) {
      // ttl is accepted and ignored: nothing here outlives the page, so there
      // is nothing for an expiry to protect against. A real host honours it.
      return {
        get: (key) => memory.get(`${elementId}:${key}`) ?? null,
        set: (key, value) => void memory.set(`${elementId}:${key}`, value),
        remove: (key) => void memory.delete(`${elementId}:${key}`),
      }
    },

    subscribeForResults(elementId, callback) {
      const set = listeners(resultListeners, elementId)
      set.add(callback)
      return () => void set.delete(callback)
    },

    subscribeForStateChange(elementId, callback) {
      const set = listeners(stateListeners, elementId)
      set.add(callback)
      return () => void set.delete(callback)
    },

    cue: options.cue,
  }
}

/**
 * The adapter a component reaches when nothing has been provided.
 *
 * One instance per page rather than one per component, so two components in the
 * same unconfigured game share a store the way they would share a host.
 */
let fallback: GamestageAdapter | undefined

function fallbackAdapter(): GamestageAdapter {
  fallback ??= createBuiltinAdapter()
  return fallback
}

/** Test seam. Drops the shared no-provider adapter so a suite starts clean. */
export function resetBuiltinAdapter(): void {
  fallback = undefined
}

// ---------------------------------------------------------------- provider --

const GamestageContext = React.createContext<GamestageAdapter | null>(null)

export interface GamestageProviderProps {
  adapter: GamestageAdapter
  children?: React.ReactNode
}

/**
 * Supplies the host adapter to everything below it. Renders no element of its
 * own, because a provider that wrapped its children in a div would change a
 * layout by being installed.
 */
export function GamestageProvider({ adapter, children }: GamestageProviderProps) {
  return <GamestageContext.Provider value={adapter}>{children}</GamestageContext.Provider>
}

/** The adapter in scope, or the built-in one when no host has provided any. */
export function useGamestage(): GamestageAdapter {
  return React.useContext(GamestageContext) ?? fallbackAdapter()
}

// ----------------------------------------------------------------- element --

export interface UseGamestageElementOptions {
  /** Results the host has already settled, for a round rendered after the fact. */
  initialResults?: GamestageResult[]
  initialState?: GamestageElementState
}

export interface GamestageElement {
  player: GamestagePlayer | null
  state: GamestageElementState
  results: GamestageResult[]
  /** Whether `results` is the host's answer, the player's preview, or a correction. */
  settlement: GamestageSettlement
  /** Reversible. Reports intent and settles nothing. */
  select: (optionId: string) => void
  /**
   * Irreversible. Renders `optimistic` immediately and in the same tick as the
   * tap, then reconciles when the host answers.
   */
  commit: (optionIds: string[], options?: CommitOptions) => void
  /**
   * The host settled an option, and the component has rendered it. Reported as
   * analytics so the host can count outcomes without re-deriving them from its
   * own settlement.
   *
   * There is no event for `rewarded`, deliberately: a reward is settled by the
   * host, so the player did not do it, and every event on this seam is named
   * for something the player did.
   */
  report: (optionId: string, outcome: GamestageOutcome) => void
  cue: (name: string, kind: 'sfx' | 'haptic') => void
  store: GamestageStore
}

/**
 * The store a component gets before it has been given an element id. Reads
 * nothing and writes nothing, rather than sharing one anonymous bucket between
 * every un-wired component on the page.
 */
const INERT_STORE: GamestageStore = { get: () => null, set: () => {}, remove: () => {} }

export interface CommitOptions {
  /**
   * What to put on screen right now, before the host has answered. Pass it and
   * the player sees feedback in the same frame as the tap; leave it off and the
   * component waits, which is correct for a round the player expects to wait for
   * and wrong for a quiz.
   */
  optimistic?: GamestageResult[]
  value?: number
}

const sameResults = (a: GamestageResult[], b: GamestageResult[]) =>
  a.length === b.length &&
  a.every((result) => b.some((other) => other.optionId === result.optionId && other.state === result.state))

/**
 * One element's side of the boundary: what the host has settled, and how to
 * tell it what the player did.
 *
 * The optimistic path is the obvious one rather than the clever one. Pass the
 * result you would render anyway to `commit`, and it is on screen in the same
 * tick as the tap. When the host answers, an answer that agrees reads as
 * `settled` and an answer that disagrees reads as `corrected`, which is the
 * value `data-gs-settlement` wants and the difference a player is owed: a
 * number that changed under them is not the same event as a number that was
 * confirmed.
 *
 * `elementId` is optional so a component can call this unconditionally, which
 * is what React's rules of hooks require. Pass nothing and the hook subscribes
 * to nothing, tells the host nothing and reports the un-wired defaults, so a
 * component wired through the adapter keeps the props-driven behaviour it had
 * before for every host that has not opted in.
 */
export function useGamestageElement(
  elementId: string | undefined,
  options: UseGamestageElementOptions = {},
): GamestageElement {
  const adapter = useGamestage()
  const [results, setResults] = React.useState<GamestageResult[]>(options.initialResults ?? [])
  // Nothing has been rendered ahead of the host yet, so nothing is unconfirmed.
  const [settlement, setSettlement] = React.useState<GamestageSettlement>('settled')
  const [state, setState] = React.useState<GamestageElementState>(options.initialState ?? 'open')

  // What the player was shown ahead of the host, or null when nothing is
  // outstanding. Read inside the host's callback, so it has to be a ref: a
  // state value captured in the closure would be the one from the render that
  // registered the subscription. Null matters: a host answering a question the
  // player was shown no preview of has corrected nothing.
  const shown = React.useRef<GamestageResult[] | null>(null)

  React.useEffect(() => {
    // No element id means the host has not been told this component exists, so
    // there is nothing to subscribe to. A component keeps its own props-driven
    // behaviour, which is the un-wired path every component already had.
    if (!elementId) return
    const stopResults = adapter.subscribeForResults(elementId, (settled) => {
      const preview = shown.current
      setResults(settled)
      setSettlement(preview && !sameResults(preview, settled) ? 'corrected' : 'settled')
      shown.current = null
    })
    const stopState = adapter.subscribeForStateChange(elementId, setState)
    return () => {
      stopResults()
      stopState()
    }
  }, [adapter, elementId])

  const select = React.useCallback(
    (optionId: string) => {
      if (!elementId) return
      adapter.track({ type: 'choice.selected', elementId, optionId })
    },
    [adapter, elementId],
  )

  const commit = React.useCallback(
    (optionIds: string[], commitOptions: CommitOptions = {}) => {
      if (!elementId) return
      const optimistic = commitOptions.optimistic
      if (optimistic) {
        // Set synchronously, inside the handler. An effect would cost a frame,
        // and the budget being defended here is 100ms from tap to feedback.
        shown.current = optimistic
        setResults(optimistic)
        setSettlement('optimistic')
      }
      adapter.track({ type: 'choice.committed', elementId, optionIds })
      adapter.submit({ elementId, optionIds, value: commitOptions.value, optimistic })
    },
    [adapter, elementId],
  )

  const report = React.useCallback(
    (optionId: string, outcome: GamestageOutcome) => {
      if (!elementId || outcome === 'rewarded') return
      adapter.track({ type: `choice.${outcome}`, elementId, optionId })
    },
    [adapter, elementId],
  )

  const cue = React.useCallback(
    (name: string, kind: 'sfx' | 'haptic') => void adapter.cue?.(name, kind),
    [adapter],
  )

  const store = React.useMemo(
    () => (elementId ? adapter.store(elementId) : INERT_STORE),
    [adapter, elementId],
  )

  return { player: adapter.player, state, results, settlement, select, commit, report, cue, store }
}
