/**
 * The cue vocabulary: names and intent, mirroring the `sfx` and `haptic`
 * groups in packages/tokens/tokens.json (BDS-003). Intent, never a file path;
 * GSUI-38 attaches real assets to these same names later.
 *
 * Each entry also carries a tier, which is how a juice level gates it (see
 * juice.ts). An `essential` cue is the confirmation of what the player just
 * did, or a settled outcome, and juice never silences it: only mute does.
 * `standard` and `celebration` are the flourish on top, and a lower juice
 * level trims celebration first, then standard.
 */

import type { CueKind, HapticName, SfxName } from './feel'

export type CueTier = 'essential' | 'standard' | 'celebration'

export interface CueEntry {
  tier: CueTier
  /** The intent, copied from tokens.json. Never a file path. */
  intent: string
}

export const SFX_CATALOGUE: Record<SfxName, CueEntry> = {
  press: { tier: 'essential', intent: 'tick' },
  select: { tier: 'essential', intent: 'soft click' },
  commit: { tier: 'essential', intent: 'lock, weighted' },
  correct: { tier: 'essential', intent: 'bright, short' },
  wrong: { tier: 'essential', intent: 'low, dull, never harsh' },
  score: { tier: 'essential', intent: 'tick per 10 pts during count-up' },
  tick: { tier: 'essential', intent: 'per second when timer critical' },
  streak: { tier: 'standard', intent: 'pitched by n' },
  xp: { tier: 'standard', intent: 'rising with amount' },
  rankUp: { tier: 'standard', intent: 'whoosh up; rank lost is silent' },
  hint: { tier: 'standard', intent: 'single chime' },
  countdown: { tier: 'standard', intent: '3 pips' },
  go: { tier: 'standard', intent: 'accent hit' },
  reveal: { tier: 'celebration', intent: 'build then sfx.reward' },
  reward: { tier: 'celebration', intent: 'shimmer' },
  collect: { tier: 'celebration', intent: 'pop into inventory' },
  levelUp: { tier: 'celebration', intent: 'rising 3-note' },
  win: { tier: 'celebration', intent: 'fanfare 1.5s or less' },
  celebrate: { tier: 'celebration', intent: 'burst 1.5s or less' },
}

export const HAPTIC_CATALOGUE: Record<HapticName, CueEntry> = {
  light: { tier: 'essential', intent: 'tap, select, collect' },
  error: { tier: 'essential', intent: 'wrong, life lost' },
  medium: { tier: 'standard', intent: 'commit, streak, GO' },
  success: { tier: 'standard', intent: 'correct, reward, level up' },
  heavy: { tier: 'celebration', intent: 'win' },
}

export type MotionName =
  | 'press'
  | 'pop'
  | 'shake'
  | 'squash'
  | 'reveal'
  | 'slam'
  | 'celebrate'
  | 'confetti'
  | 'floatup'
  | 'rays'
  | 'glow'
  | 'pulse'
  | 'reorder'
  | 'fill'
  | 'count'

/**
 * Motion, in the same table as sound and haptics so the three are one
 * vocabulary: a component that pops, ticks and taps names three cues, not two
 * cues and a class. The tiers follow the design's rules: the confirmation of
 * what the player just did is essential and juice never trims it; a loop or a
 * flourish is what juice trims first.
 */
export const MOTION_CATALOGUE: Record<MotionName, CueEntry> = {
  press: { tier: 'essential', intent: 'translateY(base), base to 0; no colour change' },
  pop: { tier: 'essential', intent: 'scale .6 to 1.12 to 1; correct, score increment' },
  shake: { tier: 'essential', intent: 'x plus or minus 6px, 3 cycles; wrong, life lost' },
  fill: { tier: 'essential', intent: 'a bar filling to its new value' },
  reorder: { tier: 'essential', intent: 'leaderboard rows translate, never fade' },
  count: { tier: 'essential', intent: 'score counts up, 10 per frame' },
  floatup: { tier: 'standard', intent: 'label rises 48px and fades' },
  squash: { tier: 'standard', intent: 'landing, drop-in' },
  pulse: { tier: 'standard', intent: 'loop; timer critical, coach-mark target, unrevealed reward' },
  glow: { tier: 'standard', intent: 'loop; halo on an unclaimed reward' },
  reveal: { tier: 'celebration', intent: 'scale .4 to 1, brightness 2 to 1' },
  rays: { tier: 'celebration', intent: 'loop; rays turn behind a reveal' },
  slam: { tier: 'celebration', intent: 'slam-in from 2.2; win' },
  celebrate: { tier: 'celebration', intent: 'slam-in then a burst; win, round complete' },
  confetti: { tier: 'celebration', intent: 'one piece of the burst falling' },
}

/**
 * What `describeCue` can look up, which is wider than what a component can ask
 * for. `CueKind` is the seam's word and covers sfx and haptic, because those
 * are the two a component performs through the host. Motion is applied by
 * packages/tokens/motion.css off `data-gs-motion`, so no component ever calls
 * `cue(name, 'motion')`, but the vocabulary is still one table and the
 * catalogue still has to be able to describe it.
 */
export type CatalogueKind = CueKind | 'motion'

const CATALOGUES: Record<CatalogueKind, Record<string, CueEntry>> = {
  sfx: SFX_CATALOGUE,
  haptic: HAPTIC_CATALOGUE,
  motion: MOTION_CATALOGUE,
}

/** Looks a cue up by kind and name. Undefined for a name outside the vocabulary. */
export function describeCue(kind: CatalogueKind, name: string): CueEntry | undefined {
  return CATALOGUES[kind]?.[name]
}
