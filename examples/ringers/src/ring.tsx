/**
 * A ring for a share of something, with a figure and a caption inside. The
 * same drawing as Stat Attack's (its charts.tsx); plain SVG, and the value in
 * words for a screen reader. GS-600.
 */
/** A ring filled to `value` out of 1, with a figure and a caption inside. */
export function Ring({ value, figure, caption, label }: { value: number; figure: string; caption: string; label: string }) {
  const r = 42
  const around = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(1, value)) * around
  return (
    <figure className="ringers-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ringers-ring__track" cx="50" cy="50" r={r} />
        {filled > 0 ? <circle
          className="ringers-ring__fill"
          cx="50"
          cy="50"
          r={r}
          strokeDasharray={`${filled} ${around}`}
          transform="rotate(-90 50 50)"
        /> : null}
      </svg>
      <figcaption aria-hidden="true">
        <span className="ringers-ring__figure">{figure}</span>
        <span className="ringers-ring__caption">{caption}</span>
      </figcaption>
    </figure>
  )
}
