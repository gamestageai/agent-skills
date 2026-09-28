/**
 * Best-effort detection of the OS silent switch, off by default.
 *
 * There is no web platform API for "the hardware mute switch is on." The one
 * observable signal, on iOS Safari, is that an unlocked `AudioContext` moves
 * to `state: "interrupted"` while the switch is engaged; every other engine
 * simply never reports it. So this can tell the provider "the device says it
 * is silenced," and it can never tell it "sound is definitely allowed." The
 * provider ORs this with the explicit `muted` prop: either can silence sound,
 * neither can force it back on.
 *
 * Why it is opt-in, and why it waits for a gesture (GSUI-157). It used to
 * construct an `AudioContext` the moment the provider mounted, before any
 * gesture and before any consent. Two things were wrong with that. A context
 * constructed before a gesture is `suspended` rather than `interrupted` in
 * Chrome, so the one signal the whole thing exists for was unlikely ever to
 * fire there; and an `AudioContext` is a recognised fingerprinting surface, so
 * every customer's data protection assessment would have had a question about
 * it, for a feature that mostly did not work. Now the default path constructs
 * no audio object at all, a host asks for the detection with
 * `detectSilentSwitch`, and even then nothing is constructed until the player
 * has touched the page.
 *
 * Deliberately not `prefers-reduced-motion`: that media feature describes
 * motion sensitivity, not sound, and wiring it to mute would silence a player
 * who only asked for stillness.
 */
export interface OsMuteWatcher {
  dispose(): void
}

const NOTHING: OsMuteWatcher = { dispose: () => {} }

/** The gestures a browser accepts as the player having arrived. */
const GESTURES = ['pointerdown', 'keydown', 'touchend'] as const

/**
 * Constructs the context now. Exported for the host that already knows it is
 * inside a gesture, and used by `watchOsMuteAfterGesture` once one arrives.
 */
export function createOsMuteWatcher(onChange: (muted: boolean) => void): OsMuteWatcher {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return NOTHING
  }

  let ctx: AudioContext
  try {
    ctx = new window.AudioContext()
  } catch {
    return NOTHING
  }

  const handleChange = () => onChange(ctx.state === 'interrupted')
  ctx.addEventListener('statechange', handleChange)

  return {
    dispose: () => {
      ctx.removeEventListener('statechange', handleChange)
      void ctx.close().catch(() => {})
    },
  }
}

/**
 * Waits for the first gesture, then starts watching. Constructs nothing until
 * it arrives, and nothing at all if the player never touches the page.
 */
export function watchOsMuteAfterGesture(onChange: (muted: boolean) => void): OsMuteWatcher {
  if (typeof window === 'undefined') return NOTHING

  let inner: OsMuteWatcher | null = null
  let disposed = false

  const start = () => {
    stopListening()
    if (disposed) return
    inner = createOsMuteWatcher(onChange)
  }

  const stopListening = () => {
    for (const gesture of GESTURES) window.removeEventListener(gesture, start)
  }

  for (const gesture of GESTURES) {
    window.addEventListener(gesture, start, { once: true, passive: true })
  }

  return {
    dispose: () => {
      disposed = true
      stopListening()
      inner?.dispose()
    },
  }
}
