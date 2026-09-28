'use client'

import * as React from 'react'

/**
 * The cue seam: what a component needs in order to ask for a cue, and nothing
 * else.
 *
 * A component does not need the runtime, it needs the seam. The library's own
 * sentence is that a component reports and the host performs, and this file is
 * the reporting half: a context, a hook, and the names a cue can have. The
 * performing half — the provider, the catalogue's tiers and intents, the juice
 * ladder, haptics, the silent-switch watcher and the sound adapter — is
 * `cues.tsx` beside this, and a host installs it when it wants a cue to become
 * a sound.
 *
 * That split is why they are two registry items. `timer`, `choice`, `streak`
 * and `feedback` install this file alone, at 0.8KB gzipped; installing the
 * whole runtime with each of them cost 6.4KB apiece and put six items over
 * their weight budgets, to carry code a component never executes.
 *
 * With no provider above it, `useGameFeel` is a no-op, which is the state every
 * component is built for.
 */

export type CueKind = 'sfx' | 'haptic'

/**
 * The cue vocabulary's names, mirroring the `sfx` and `haptic` groups in
 * packages/tokens/tokens.json. They live here rather than with the catalogue
 * because a component needs to name a cue and does not need to know its tier
 * or its intent: `cue-catalogue.ts` imports these back and adds the rest.
 */
export type SfxName =
  | 'press'
  | 'select'
  | 'commit'
  | 'correct'
  | 'wrong'
  | 'score'
  | 'streak'
  | 'xp'
  | 'rankUp'
  | 'hint'
  | 'countdown'
  | 'go'
  | 'tick'
  | 'reveal'
  | 'reward'
  | 'collect'
  | 'levelUp'
  | 'win'
  | 'celebrate'

export type HapticName = 'light' | 'medium' | 'heavy' | 'success' | 'error'

export type CueName = SfxName | HapticName

/**
 * How much celebration the host wants (`data-gs-juice` in the attribute
 * contract). A scalar on one code path: `none` and `maximum` bound it, and the
 * two middle values only narrow what plays between those two ends. The ladder
 * that reads it is `juice.ts`, which the provider installs.
 */
export type JuiceLevel = 'none' | 'reduced' | 'standard' | 'maximum'

export interface GameFeelValue {
  juice: JuiceLevel
  /** Explicit mute ORed with the best-effort OS silent-switch signal. */
  muted: boolean
  hapticsOff: boolean
  /**
   * Hands a cue to the runtime. Gated by juice, then by mute or haptics-off.
   *
   * `magnitude` is how much of the thing just happened, and it is the
   * difference between a cue and the cue the design actually asked for. The
   * token file pitches `sfx.streak` by n and raises `sfx.xp` with the amount,
   * and with no third argument a streak at two in a row and a streak at eight
   * were the same request. A host receives it and decides what to do with it;
   * a component only says how much.
   *
   * It is a number rather than a pitch or a rate on purpose: what four in a
   * row should sound like is the host's business, and a component that named
   * a semitone would be performing.
   */
  cue: (name: CueName, kind: CueKind, magnitude?: number) => void
}

export const DEFAULT_FEEL: GameFeelValue = {
  juice: 'standard',
  muted: false,
  hapticsOff: false,
  // No provider mounted: degrade to a no-op rather than throwing, matching
  // the rest of the library (REQ-006). There is nowhere to record a cue and
  // nothing waiting to hear about one.
  cue: () => {},
}

export const GameFeelContext = React.createContext<GameFeelValue>(DEFAULT_FEEL)

export function useGameFeel(): GameFeelValue {
  return React.useContext(GameFeelContext)
}
