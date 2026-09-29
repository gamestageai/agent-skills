'use client'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// glyph that sizes itself from the SVG's own attributes rather than from the
// control it sits in, and `tsc --noEmit` passes on it, so the gate cannot catch
// it.
import './glyphs.css'

/**
 * The marks the library draws, as inline SVG. GSUI-103.
 *
 * These were colour emoji, a padlock and an open box. A colour emoji is drawn by
 * the reader's operating system rather than by the library, so it ignores every
 * colour token — a gold padlock sat on an arcade-blue button — and it is a
 * different silhouette on macOS, Windows and Android, which makes a component
 * impossible to specify or screenshot. The characters are not quoted anywhere in
 * this repo, not even in a comment: `tests/lib/check-no-colour-emoji.mjs` greps
 * the source and cannot tell a mention from a use.
 *
 * Each takes `currentColor` and is `1em` square, so it inherits the colour and
 * the size the glyph element around it already computed from tokens. The stroke
 * weight comes from `stroke.glyph` through the stylesheet rather than from an
 * attribute here, so a theme can reach it. That is why
 * no call site changed anything but what goes inside the span.
 *
 * One item rather than one file per component, because `button`, `choice`,
 * `selector`, `slider` and `reward` all draw the padlock: five copies is five
 * places to change it, and three installed padlocks that can drift apart.
 *
 * Every glyph is `aria-hidden`, exactly as the emoji was. The state is in words
 * on the control's accessible name, and the glyph is the second, non-colour
 * signal beside it. One that announced itself would say "locked" twice.
 */
/** Asked for rather than derived from the size: only the caller knows whether
 *  a mark is decoration beside a word or the subject of a screen. */
export type GlyphWeight = 'small' | 'regular' | 'bold'

export interface GlyphProps {
  /** Extra classes. `gs-glyph` is always applied. */
  className?: string
  /** `regular` by default. `small` under about 14px, `bold` for a hero mark. */
  weight?: GlyphWeight
}

function svgProps(className: string | undefined, weight?: GlyphWeight, grid = 16) {
  return {
    className: ['gs-glyph', className].filter(Boolean).join(' '),
    // Omitted at the default, so the attribute means somebody chose this.
    'data-gs-weight': weight && weight !== 'regular' ? weight : undefined,
    viewBox: `0 0 ${grid} ${grid}`,
    width: '1em',
    height: '1em',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    // Hidden from the accessible tree, and out of the tab order in the one
    // browser that still puts SVG in it. The control's name carries the state.
    'aria-hidden': true,
    focusable: false,
  }
}

/**
 * Available later, not now.
 *
 * A shackle over a closed body, which is the padlock the design draws: readable
 * at the 16px control size and at the 48px hero size without a second drawing.
 */
export function LockGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M5 7V4.75a3 3 0 0 1 6 0V7" />
      <rect x="3.25" y="7" width="9.5" height="6.75" rx="1.5" />
      <path d="M8 9.5v1.75" />
    </svg>
  )
}

/**
 * Nothing here yet.
 *
 * An open, empty box seen from the front, with its flaps out. Open rather than
 * closed on purpose: a closed box reads as a parcel that has something in it,
 * which is the opposite of what the empty state says.
 */
export function EmptyBoxGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M2.25 6.25h11.5v6.5a1 1 0 0 1-1 1h-9.5a1 1 0 0 1-1-1z" />
      <path d="M2.25 6.25 4 3.25h8l1.75 3" />
      <path d="M8 3.25v3" />
    </svg>
  )
}

/**
 * Media belongs here and has not arrived.
 *
 * A film frame: a rounded rectangle with a sprocket line down each side, which
 * is what specimen 5f draws in the middle of an empty media frame. It says
 * "picture" without saying which kind, because the frame does not know: a
 * video, a 3D scene and an embed all wait behind the same glyph.
 */
export function FrameGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M5.25 3.5v9M10.75 3.5v9" />
    </svg>
  )
}

/**
 * Right, correct, done, complete.
 *
 * The library drew this five different ways: the text character in `choice`,
 * `selector`, `feedback`, `reward`, `progress-bar`, `level-ring` and
 * `tutorial-step`, and three separate paths on three separate viewBoxes in
 * `quest`/`milestones`/`segments`, `player-card`, and `field`/`prize-entry`. A
 * player saw a different tick depending on which component happened to be
 * telling them the same thing, each with its own stroke weight, and no theme
 * could change any of them together.
 *
 * This is `player-card`'s drawing, which was already on the 16 grid the rest of
 * this file uses. The weight comes from `stroke.glyph`, which is where the call
 * sites' 2, 2.2, 2.4, 2.6 and 3 went. Those were not purely drift: a mark is one
 * drawing and it scales, but the stroke cannot scale all the way down, and the
 * small ones needed the extra weight. `stroke.glyphSmall` carries that, and
 * `glyphs.css` explains where the line is.
 */
export function TickGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  )
}

/**
 * Wrong, refused, failed, dismissed.
 *
 * Four drawings before this: the text character, and paths on the 12, 16 and 24
 * grids in `segments`/`field`, `player-card` and `error-state`.
 */
export function CrossGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

/**
 * A reward. Filled when it has been won, hollow when it is there to be won.
 *
 * `reward` drew the pair as the two text characters and `player-card` drew a
 * path, so the same two states were two different shapes in two components. The
 * fill is the state, which is why it is a prop rather than two functions: a
 * hollow star and a filled star have to be the same outline or the change from
 * one to the other reads as a different object rather than the same object won.
 */
export interface StarGlyphProps extends GlyphProps {
  /** Won. Fills the star; hollow means available and not yet won. */
  filled?: boolean
}

export function StarGlyph({ className, filled = false, weight }: StarGlyphProps) {
  return (
    <svg {...svgProps(className, weight)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M8 2.5l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.8l4-.6z" />
    </svg>
  )
}

/**
 * The six identity symbols, specimen 3a: what stands in for a player who has
 * no picture. `identity` hashes the player's id to one of these and one of
 * eight hues, so the same player is always the same mark and no two players
 * in a small game are likely to share one. Never a face and never an initial,
 * which the drawing says in words.
 *
 * Each is a bare shape on the 16 grid. The colour a shape fills with is the
 * caller's: the diamond is filled with the player colour and the dot with the
 * warning colour in the drawing, and identity.css sets `fill` on them from
 * those tokens; the rest are the edge colour, which is `currentColor` there.
 */
export const IDENTITY_GLYPHS = ['diamond', 'dot', 'triangle', 'ring', 'bars', 'plus'] as const

export type IdentityGlyphName = (typeof IDENTITY_GLYPHS)[number]

export function DiamondGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <rect x="4" y="4" width="8" height="8" rx="1" transform="rotate(45 8 8)" />
    </svg>
  )
}

export function DotGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <circle cx="8" cy="8" r="5" />
    </svg>
  )
}

export function TriangleGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M8 2.5L14 13.5H2z" />
    </svg>
  )
}

export function RingGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <circle cx="8" cy="8" r="5" />
    </svg>
  )
}

export function BarsGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <rect x="3.5" y="3" width="3" height="10" rx="1.5" />
      <rect x="9.5" y="3" width="3" height="10" rx="1.5" />
    </svg>
  )
}

export function PlusGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

/** The six by name, in the order `identity` indexes them. */
export const IDENTITY_GLYPH: Record<IdentityGlyphName, (props: GlyphProps) => React.JSX.Element> = {
  diamond: DiamondGlyph,
  dot: DotGlyph,
  triangle: TriangleGlyph,
  ring: RingGlyph,
  bars: BarsGlyph,
  plus: PlusGlyph,
}

/**
 * A direction. One mark for four drawings that grew up separately: the
 * triangle characters in leaderboard, the arrow characters in selector, the
 * pager chevron in story, the outcome chevrons in versus.
 *
 * The two character ones were the emoji fault again, drawn by the reader's
 * font so they ignored the stroke token and changed shape per platform. Not
 * emoji, so check-no-colour-emoji.mjs never saw them.
 */
export type ChevronDirection = 'up' | 'down' | 'left' | 'right'

export interface ChevronGlyphProps extends GlyphProps {
  /** No default: a chevron with no direction says nothing. */
  direction: ChevronDirection
}

// One path rotated, so the four cannot drift apart.
const CHEVRON_TURN: Record<ChevronDirection, number> = { up: 0, right: 90, down: 180, left: 270 }

export function ChevronGlyph({ className, weight, direction }: ChevronGlyphProps) {
  return (
    // The direction is an attribute as well as a rotation: a transform is
    // unreadable from outside, so neither a test nor a theme could tell up
    // from down. The leaderboard's own test caught that.
    <svg {...svgProps(className, weight)} data-gs-direction={direction}>
      <g transform={`rotate(${CHEVRON_TURN[direction]} 8 8)`}>
        <path d="M3.75 10.25 8 6l4.25 4.25" />
      </g>
    </svg>
  )
}

/**
 * Attention, not refusal: a message with a moderator, a round about to close.
 *
 * Deliberately not the cross's shape. Where warning and negative are both
 * warm, the mark is the only thing telling the two answers apart.
 */
export function AlertGlyph({ className, weight }: GlyphProps) {
  return (
    <svg {...svgProps(className, weight)}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75v3.75" />
      <path d="M8 11.1v.05" />
    </svg>
  )
}

/* The four marks a game's bottom bar needs: play, the board, the player and
   how to play. Outlines only, on a 24-unit grid with every straight stroke on
   a whole unit, so they rest on whole pixels at 24px. Tom, 2026-09-28: "make
   these light thin icons and fonts". The current place is told by the pill
   behind it and full-strength colour, never by a heavier mark, so `filled` is
   accepted for the games that already pass it and changes nothing. */
export interface NavGlyphProps extends GlyphProps {
  /** Kept for callers that pass it; the marks are outlines in every state. */
  filled?: boolean
}

export function PlayGlyph({ className, weight }: NavGlyphProps) {
  return (
    <svg {...svgProps(className, weight, 24)}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function TrophyGlyph({ className, weight }: NavGlyphProps) {
  return (
    <svg {...svgProps(className, weight, 24)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v5M8 20h8" />
    </svg>
  )
}

export function PersonGlyph({ className, weight }: NavGlyphProps) {
  return (
    <svg {...svgProps(className, weight, 24)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  )
}

export function QuestionGlyph({ className, weight }: NavGlyphProps) {
  return (
    <svg {...svgProps(className, weight, 24)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17v.01" />
    </svg>
  )
}
