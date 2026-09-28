'use client'

import { Reward, type RewardProps } from './reward'

/**
 * Badge: `reward` drawn as the tier-ringed roundel of specimens 3d and 4d.
 *
 * A badge is an earned reward with no card: the same lifecycle, the same
 * accessible name, the same attributes, and a disc instead of a rectangle.
 * GSUI-135 settled that argument for the card and the reveal already, and
 * this is the same answer a third time, so the roundel is a presentation on
 * reward rather than a component with a lifecycle of its own. Four states
 * would otherwise be written down twice, and the second copy is where they
 * drift.
 *
 * It exists as its own item for the reason `multiplier` does. A profile
 * holding a row of badges beside a reward card needs to tell them apart, and
 * `[data-gs-component="badge"]` is how a host and a test do that; asking for
 * `[data-gs-presentation="badge"]` means knowing that a badge is a reward
 * before you can find one. It also means a host adding badges installs a
 * name it recognises.
 *
 * No stylesheet: reward already draws the roundel.
 *
 * The overflow disc at the end of the profile's row, the one reading +18, is
 * not this. It stands for the badges that are not drawn rather than for a
 * badge, so it belongs to whatever draws the row; specimen 4d puts it in the
 * profile's badge row and `inventory` is the component that owns a collection
 * of rewards.
 */

export type BadgeProps = Omit<RewardProps, 'presentation' | 'component' | 'progress' | 'max'>

export function Badge(props: BadgeProps) {
  return <Reward {...props} presentation="badge" component="badge" />
}
