'use client'

import * as React from 'react'

/**
 * How a stage occupies the screen, readable by any component inside it.
 *
 * Its own item rather than part of Stage, so a leaderboard can choose defaults
 * that suit a fixed screen without installing Stage. GSUI-282.
 */
export type StageFit = 'screen' | 'canvas' | 'launch' | 'card' | 'page' | 'sheet'

/** The layouts in which space is fixed, so a component should save height. */
export const FIXED_FITS: ReadonlySet<StageFit> = new Set(['screen', 'canvas', 'card', 'sheet'])

const StageFitContext = React.createContext<StageFit | undefined>(undefined)

/** Provided by Stage; a host with its own shell may provide it directly. */
export const StageFitProvider = StageFitContext.Provider

/**
 * The fit of the nearest stage, so a component can choose defaults that suit
 * it: a leaderboard showing the top five and your row on a fixed screen, and
 * every row on a page. Undefined outside a stage, or in one with no fit.
 */
export function useStageFit(): StageFit | undefined {
  return React.useContext(StageFitContext)
}

/** True inside a stage whose space is fixed. */
export function useFixedSpace(): boolean {
  const fit = useStageFit()
  return fit !== undefined && FIXED_FITS.has(fit)
}
