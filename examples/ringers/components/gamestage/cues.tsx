'use client'

import * as React from 'react'

import {
  type CueKind,
  type GameFeelValue,
  type HapticName,
  type JuiceLevel,
  GameFeelContext,
} from './feel'
import { describeCue } from './cue-catalogue'
import { allowsCue } from './juice'
import { fireHaptic } from './haptics'
import { watchOsMuteAfterGesture } from './os-mute'
import { type SoundAdapter, createHtmlAudioAdapter } from './sound-adapter'

/**
 * GameFeelProvider: juice, cue playback and haptics as one provider (BDS-030,
 * REQ-039 to REQ-045).
 *
 * The performing half of the cue layer, and the half a host opts into. The
 * reporting half is `./feel`, which is what a component installs; see the note
 * at the top of that file for why the two are separate registry items.
 *
 * It plays nothing itself. It decides whether a named cue is allowed through
 * (mute, haptics-off and juice all gate independently), hands an allowed sfx
 * cue to a sound adapter and an allowed haptic cue to `navigator.vibrate`,
 * and records what it handed over. No asset files exist yet (GSUI-38), so
 * today "playing" a cue is that recording: the intent event fired, in order,
 * nothing more.
 */

export interface GameFeelCueEvent {
  name: string
  kind: CueKind
  /**
   * How much of the thing happened, where the design pitches a cue by a
   * number: the run's length behind `sfx.streak`, the amount behind `sfx.xp`.
   * Undefined for every cue that is not pitched (GSUI-173).
   */
  magnitude?: number
}

export interface GameFeelProviderProps {
  children: React.ReactNode
  /**
   * The host's own mute switch (the lab's `?mute=`, or a customer's setting).
   * Combined with the OS signal by OR: either can silence sound, neither can
   * force it back on.
   */
  muted?: boolean
  hapticsOff?: boolean
  juice?: JuiceLevel
  /**
   * Watch for the iOS hardware silent switch. Off by default, and off means
   * no audio object is constructed at all (GSUI-157).
   *
   * The detection works by reading an unlocked `AudioContext`'s state, which
   * only iOS Safari ever reports as `interrupted`; Chrome leaves it
   * `suspended`, so the signal the feature exists for is unlikely to fire
   * there. An `AudioContext` is also a recognised fingerprinting surface, so
   * a host should be the one deciding to open one rather than finding that a
   * component library already did. With this on, one is still not constructed
   * until the player's first gesture: before a gesture the context cannot
   * reach the state being watched for anyway.
   *
   * With it off, the host's own `muted` prop is the only thing that silences
   * sound, which is the same answer this gave on every browser but one.
   */
  detectSilentSwitch?: boolean
  /** Defaults to an HTMLAudio-backed stub; GSUI-38 supplies a real adapter. */
  sound?: SoundAdapter
  /**
   * Fired once per cue the runtime let through, after every gate. This is the
   * test/debug and host-integration hook: the runtime performs nothing
   * itself (BDS-030), so this is how a host, or a test, observes what would
   * have played. Not analytics (REQ-005): it carries no player intent, only
   * that a cue fired.
   */
  onCue?: (event: GameFeelCueEvent) => void
}

export function GameFeelProvider({
  children,
  muted: explicitMuted = false,
  hapticsOff = false,
  juice = 'standard',
  detectSilentSwitch = false,
  sound,
  onCue,
}: GameFeelProviderProps) {
  const soundAdapter = sound ?? defaultSoundAdapter

  const [osMuted, setOsMuted] = React.useState(false)
  React.useEffect(() => {
    if (!detectSilentSwitch) return
    const watcher = watchOsMuteAfterGesture(setOsMuted)
    return () => watcher.dispose()
  }, [detectSilentSwitch])

  const muted = explicitMuted || osMuted

  // The attribute contract's provider root. `cues` ships no DOM of its own
  // (docs/attribute-contract.md, "every component names its root"), so this
  // state lives on the document root rather than on a wrapper element the
  // provider would otherwise have to render around `children`.
  React.useEffect(() => {
    const root = document.documentElement
    if (muted) root.setAttribute('data-gs-muted', 'true')
    else root.removeAttribute('data-gs-muted')
    return () => root.removeAttribute('data-gs-muted')
  }, [muted])

  React.useEffect(() => {
    const root = document.documentElement
    if (hapticsOff) root.setAttribute('data-gs-haptics-muted', 'true')
    else root.removeAttribute('data-gs-haptics-muted')
    return () => root.removeAttribute('data-gs-haptics-muted')
  }, [hapticsOff])

  React.useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-gs-juice', juice)
    return () => root.removeAttribute('data-gs-juice')
  }, [juice])

  const ledger = React.useRef<string[]>([])

  // Opened during the first render rather than in an effect, because a child's
  // effects run before its parent's. A `feedback` that fires its cue on mount
  // recorded it and then had the empty attribute written over the top, so the
  // ledger read '' for a cue that had plainly fired. Writing an attribute
  // during render is a side effect, and this is the one place it buys
  // something: the ledger has to exist before anything below it can append.
  const opened = React.useRef(false)
  if (!opened.current) {
    opened.current = true
    ledger.current = []
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-gs-cues', '')
    }
  }
  React.useEffect(() => () => document.documentElement.removeAttribute('data-gs-cues'), [])

  // Appended in memory now, written to the document when the turn ends.
  //
  // The attribute lives on `document.documentElement`, so setting it
  // invalidates style for every element on the page, and it was being set
  // synchronously inside the click handler: a tap fired two cues, so two whole
  // document invalidations landed between the tap and the frame that draws the
  // player's feedback. That frame is the library's 100ms promise.
  //
  // Nothing waits on the attribute within the turn: it is the test and debug
  // surface, and every reader of it awaits something first. `onCue` is still
  // called synchronously, because a host may want to start a sound in the
  // gesture that authorised it.
  const record = React.useCallback((entry: string) => {
    ledger.current.push(entry)
  }, [])

  const writeLedger = React.useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-gs-cues', ledger.current.join(' '))
    }
  }, [])

  // REQ-040: at most one sound per state change. One settlement reaches two
  // components — a `choice` option settles `correct` and the `feedback` that
  // answers it mounts in the same commit, and both ask for sfx.correct — so
  // two components each doing the right thing plays one sound twice. Neither
  // can see the other; the runtime sees both, so the rule lives here. The same
  // kind:name asked for twice before the browser gets back to its own work is
  // one cue, recorded once.
  const firedThisTurn = React.useRef<Set<string>>(new Set())

  const cue = React.useCallback<GameFeelValue['cue']>(
    (name, kind, magnitude) => {
      const tier = describeCue(kind, name)?.tier ?? 'standard'
      if (!allowsCue(juice, tier)) return
      // Mute is a sound concern and haptics-off a haptic one; neither crosses.
      if (kind === 'haptic' ? hapticsOff : muted) return

      // `sfx:streak@5`, and the magnitude is part of the key rather than
      // beside it. REQ-040 dedups on this string, and the whole point of a
      // pitched cue is that four in a row and five in a row are two different
      // requests: keyed on `sfx:streak` alone the second would be swallowed
      // as a repeat of the first. A cue with no magnitude keys exactly as it
      // did, which is what keeps the case the dedup exists for working: a
      // settlement reaches `choice` and `feedback` in one commit and both ask
      // for an unpitched `sfx:correct`, so both still key to `sfx:correct`
      // and one sound plays.
      const entry = magnitude === undefined ? `${kind}:${name}` : `${kind}:${name}@${magnitude}`
      // Checked after the gates, not before: a cue the gates refused has not
      // fired, so it must not hold the slot against the one that follows it.
      if (firedThisTurn.current.has(entry)) return
      firedThisTurn.current.add(entry)
      if (firedThisTurn.current.size === 1) {
        // One microtask ends the turn: it reopens the dedup for the next one
        // and writes everything this turn recorded in a single attribute set.
        //
        // A resolved promise rather than queueMicrotask or a timer: both of
        // those are things a test replaces with fakes, and a turn that never
        // ends would collapse a timer's per-second tick into one tick.
        void Promise.resolve().then(() => {
          firedThisTurn.current.clear()
          writeLedger()
        })
      }

      if (kind === 'haptic') fireHaptic(name as HapticName)
      else soundAdapter.play(name, magnitude)

      record(entry)
      onCue?.({ name, kind, magnitude })
    },
    [juice, muted, hapticsOff, soundAdapter, onCue, record, writeLedger],
  )

  const value = React.useMemo<GameFeelValue>(
    () => ({ juice, muted, hapticsOff, cue }),
    [juice, muted, hapticsOff, cue],
  )

  return <GameFeelContext.Provider value={value}>{children}</GameFeelContext.Provider>
}

const defaultSoundAdapter = createHtmlAudioAdapter()
