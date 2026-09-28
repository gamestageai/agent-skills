import type { CueTier } from './cue-catalogue'
// The level itself is the seam's, because `GameFeelValue` carries it and a
// component reads it; this file is the ladder that decides what each level
// lets through, which only the provider runs.
import type { JuiceLevel } from './feel'

const SCALAR: Record<JuiceLevel, number> = { none: 0, reduced: 1, standard: 2, maximum: 3 }

const THRESHOLD: Record<CueTier, number> = { essential: 0, standard: 1, celebration: 2 }

/**
 * Whether a cue of this tier plays at this juice level. `essential` always
 * returns true: juice scales the flourish on top of a state change, never the
 * confirmation of the state change itself. Only mute silences an essential cue.
 */
export function allowsCue(level: JuiceLevel, tier: CueTier): boolean {
  return SCALAR[level] >= THRESHOLD[tier]
}
