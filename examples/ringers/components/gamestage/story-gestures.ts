/**
 * The decisions behind a story's gestures, as numbers in and a verdict out.
 *
 * Kept apart from the component so each threshold is a tested fact rather than a
 * line buried in a pointer handler. The component measures and moves; this file
 * decides. GSUI-290.
 *
 * The behaviour is the one a phone's stories have trained everybody to expect:
 * tap the right of the frame for the next one and the left for the one before,
 * swipe across to do the same, and swipe down to put the whole thing away.
 */

/** How far a finger travels before the gesture commits to one direction. */
export const AXIS_LOCK_PX = 10

/** A horizontal swipe shorter than this is a wobble, not a request to move. */
export const SWIPE_STEP_PX = 40

/** Past this share of the story's height, letting go closes it. */
export const DISMISS_SHARE = 1 / 3

/**
 * A downward flick this fast closes the story however short it was, in pixels
 * a millisecond. About what a thumb does when it means it, and well above a
 * slow drag somebody is still deciding about.
 */
export const FLICK_PX_PER_MS = 0.5

/** A flick still has to travel this far, so a twitch cannot close anything. */
export const FLICK_MIN_PX = 24

/** A press held longer than this was a pause, so letting go does not move on. */
export const TAP_MAX_MS = 350

/** How small the story gets at the bottom of a full-height drag. */
export const DISMISS_MIN_SCALE = 0.9

/** The share of the frame, from the left, that a tap reads as "go back". */
export const BACK_ZONE = 1 / 3

export type Axis = 'x' | 'y'

/**
 * Which way the gesture is going, once it has gone far enough to say. Null
 * until then, so a finger resting on the glass decides nothing. A tie goes to
 * the horizontal, because moving between frames is the commoner intent and a
 * dismissal should only happen when somebody plainly meant it.
 */
export function lockAxis(dx: number, dy: number, threshold = AXIS_LOCK_PX): Axis | null {
  if (Math.hypot(dx, dy) < threshold) return null
  return Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
}

/**
 * How far through a dismissal a downward drag is, 0 to 1. Dragging up gives 0:
 * the story has nowhere to go that way, so it stays put rather than following.
 */
export function dismissProgress(dy: number, height: number): number {
  if (!(height > 0) || dy <= 0) return 0
  return Math.min(1, dy / height)
}

/** The scale the story is drawn at for a given progress. */
export function dismissScale(progress: number): number {
  return 1 - (1 - DISMISS_MIN_SCALE) * Math.min(1, Math.max(0, progress))
}

/** Whether letting go of a downward drag closes the story or springs it back. */
export function shouldDismiss(dy: number, height: number, velocity: number): boolean {
  if (dy <= 0) return false
  if (height > 0 && dy >= height * DISMISS_SHARE) return true
  return velocity >= FLICK_PX_PER_MS && dy >= FLICK_MIN_PX
}

export type Release =
  | { kind: 'dismiss' }
  | { kind: 'spring-back' }
  | { kind: 'step'; by: 1 | -1 }
  | { kind: 'none' }

export interface ReleaseInput {
  /** The axis the gesture locked to, or null if it never moved far enough. */
  axis: Axis | null
  dx: number
  dy: number
  /** Downward speed at the moment of release, pixels a millisecond. */
  velocity: number
  /** How long the finger was down. */
  durationMs: number
  /** Where the press started, measured from the story's left edge. */
  startX: number
  width: number
  height: number
}

/** What letting go means. One verdict, so the handler cannot act twice. */
export function release(input: ReleaseInput): Release {
  const { axis, dx, dy, velocity, durationMs, startX, width, height } = input
  if (axis === 'y') {
    if (shouldDismiss(dy, height, velocity)) return { kind: 'dismiss' }
    return dy > 0 ? { kind: 'spring-back' } : { kind: 'none' }
  }
  if (axis === 'x') {
    if (Math.abs(dx) >= SWIPE_STEP_PX) return { kind: 'step', by: dx < 0 ? 1 : -1 }
    return { kind: 'none' }
  }
  // Never moved far enough to pick a direction: a tap, unless it was held.
  if (durationMs > TAP_MAX_MS) return { kind: 'none' }
  return { kind: 'step', by: startX < width * BACK_ZONE ? -1 : 1 }
}
