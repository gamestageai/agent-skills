import * as React from 'react'
import { Feedback } from '@/components/gamestage/feedback'

/**
 * A wrong guess, answered the way Gamestage UI answers one, instead of a
 * plain toast. Tom, 2026-09-28: "Not Jacob Ramsey." in a pill above the nav
 * was boring.
 *
 * Three things happen together, and each carries the meaning on its own:
 * - the tile that was guessed shakes (`data-gs-motion="shake"`) and flashes
 *   the negative colour, then settles into its crossed-out state;
 * - Feedback's wrong plate, a cross in a dashed negative ring, shakes in over
 *   the board, holds 1200ms and fades, with its sfx and haptic cue from the
 *   game's feel provider, which the sound switch mutes;
 * - the stylesheet pops the life that was spent (app.css).
 *
 * Under reduced motion nothing moves, and the colour, the cross, the words and
 * the emptied life still say it. The shake is an "essential" motion in the
 * library's ladder, so a lower juice level keeps it: juice trims celebration,
 * never the signal that an answer was wrong.
 */
export function useWrongFeedback(className: string) {
  const [shown, setShown] = React.useState<{ tiles: string[]; label: string; message: string; n: number } | null>(null)

  // The tile is found after React has drawn the board it now sits on, since
  // a wrong guess remounts the board with that tile crossed out.
  React.useEffect(() => {
    if (!shown) return
    const found: HTMLElement[] = []
    const frame = requestAnimationFrame(() => {
      for (const id of shown.tiles) {
        const tile = document.querySelector<HTMLElement>(`[data-gs-choice="${CSS.escape(id)}"]`)
        if (!tile) continue
        tile.dataset.gsMotion = 'shake'
        tile.dataset.gsAnimates = 'motion'
        tile.dataset.wrongFlash = 'true'
        found.push(tile)
      }
    })
    const settle = window.setTimeout(() => {
      for (const tile of found) {
        delete tile.dataset.gsMotion
        delete tile.dataset.wrongFlash
      }
    }, 700)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      for (const tile of found) {
        delete tile.dataset.gsMotion
        delete tile.dataset.wrongFlash
      }
    }
  }, [shown])

  const show = React.useCallback((tiles: string[], label: string, message: string) => {
    setShown({ tiles, label, message, n: Date.now() })
  }, [])

  const node = (
    <div className={className} aria-live="assertive">
      {shown ? (
        <Feedback
          key={shown.n}
          variant="wrong"
          label={shown.label}
          message={shown.message}
          onDismiss={() => setShown(null)}
        />
      ) : null}
    </div>
  )
  // While the plate is up, the page holds any toast back: "You're Copper
  // Ferret now." after a name is saved must not compete with the answer.
  return { show, node, showing: shown !== null }
}
