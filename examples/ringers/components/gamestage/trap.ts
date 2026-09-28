/**
 * The focus trap a sheet and a modal share.
 *
 * Both hold focus inside their panel while open, both close on Escape, and both
 * hand focus back to whatever had it when they opened. That is one behaviour,
 * so it is written once and each component calls it from an effect.
 *
 * It ships inside the `sheet` registry item, and `modal` depends on `sheet`
 * for it, the way `inventory` depends on `reward`: a customer installing a
 * modal should not have to know that a trap is a thing, and two copies of
 * forty lines would be two traps to keep the same.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface TrapOptions {
  /** The surface focus is held inside. */
  panel: HTMLElement
  /** What Escape does. A sheet dismisses; a modal takes its safe action. */
  onEscape: () => void
  /**
   * Where focus lands on open. A modal names its safe action so the dangerous
   * one is never the default; a sheet takes the first control it has, or the
   * panel itself when it has none.
   */
  initial?: HTMLElement | null
}

/**
 * Holds focus inside `panel` until the returned function is called, which is
 * the effect's cleanup. Focus goes back to the element that had it before.
 */
export function trapFocus({ panel, onEscape, initial }: TrapOptions): () => void {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const controls = () =>
    [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.closest('[hidden]') === null)

  // preventScroll, because a panel that opens at the foot of a scene must not
  // drag the page to it: the scene is what the player was looking at.
  const first = initial ?? controls()[0] ?? panel
  first.focus({ preventScroll: true })

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Claimed, because an open sheet or modal is the only thing Escape can
      // mean while it is open. This is the opposite of the coach mark rule,
      // and deliberately so: a modal is modal.
      event.preventDefault()
      event.stopPropagation()
      onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const items = controls()
    const active = document.activeElement
    const inside = active instanceof HTMLElement && panel.contains(active)
    if (items.length === 0) {
      event.preventDefault()
      panel.focus({ preventScroll: true })
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) return
    if (event.shiftKey ? active === first || !inside : active === last || !inside) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus({ preventScroll: true })
    }
  }

  document.addEventListener('keydown', onKeyDown, true)
  return () => {
    document.removeEventListener('keydown', onKeyDown, true)
    previous?.focus({ preventScroll: true })
  }
}
