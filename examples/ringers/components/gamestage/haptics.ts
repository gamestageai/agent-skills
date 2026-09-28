import type { HapticName } from './feel'

/**
 * Vibration patterns in milliseconds, one per haptic intent. No web API
 * exposes "light/medium/heavy" the way a native Taptic Engine does;
 * `navigator.vibrate` is the only cross-browser primitive, so a pattern is
 * the closest approximation available and this is the one place that names
 * the numbers.
 */
const PATTERN: Record<HapticName, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  success: [10, 30, 10],
  error: [20, 40, 20],
}

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Fires the pattern for a haptic intent. Returns false wherever the device cannot vibrate. */
export function fireHaptic(name: HapticName): boolean {
  if (!canVibrate()) return false
  return navigator.vibrate(PATTERN[name])
}
