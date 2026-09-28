'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

import { FrameGlyph } from './glyphs'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled MediaFrame, and `tsc --noEmit` passes on it,
// so the gate cannot catch it.
import './media-frame.css'

/**
 * MediaFrame: the space a piece of the host's media occupies, and nothing else.
 *
 * **This is not a video player and must never become one.** The video, the 3D
 * scene, the canvas and the embed belong to the host, the same way a `stage`'s
 * scene does (BDS-032). The frame reserves the space, holds the shape, says
 * what belongs in it and renders whatever the host passes as children. It does
 * not load, decode, buffer, play, pause, seek, mute, poster or time anything,
 * and it renders no `<video>` element and no controls. If a future change adds
 * one, the component has stopped being a frame and the library has started
 * owning media, which is a decision for the CTO and not for a pull request.
 *
 * Three things carry it.
 *
 * **The frame reserves its space before the media arrives.** It has an aspect
 * ratio and a floor height, so a frame whose source has not come back, or whose
 * source failed, is the same size as one that worked. That is the whole reason
 * it exists as a component rather than as a div in the host's layout: a media
 * surface that collapses to nothing and then springs open shifts everything
 * under it at the worst possible moment.
 *
 * **A frame with nothing in it says what belongs there.** An empty frame is a
 * designed state carrying `data-gs-empty`: a glyph, the `label` and the shape
 * it is waiting for, "Portrait video, 9:16", inside a dashed edge. It is never
 * a blank rectangle. A busy frame is the same promise kept differently: a
 * striped surface, a turning ring and the words "Loading <label>", which is
 * what specimen 5f draws and what the contract asks for when it says a test
 * finds `data-gs-busy` and asserts the frame still has visible content.
 *
 * **Everything the frame says about playback is the host's word.** `playing`
 * is a prop, reflected to `data-gs-playing`, on exactly the footing
 * `data-gs-busy` is already on: the host declares it and the library never
 * infers it. The frame has no way to know, because it never touches the media.
 *
 * The LIVE pill and the progress bar the drawing lays over a playing frame are
 * the host's overlays, placed through `stage`'s hud layer. They are not parts
 * of this component and it renders neither.
 */

/** The shapes the design lays out around, matching `data-gs-format`. */
export type MediaFormat = 'portrait' | 'landscape' | 'square'

/** The ratio each format falls back to when the host does not name one. */
const DEFAULT_RATIO: Record<MediaFormat, string> = {
  portrait: '9:16',
  landscape: '16:9',
  square: '1:1',
}

export interface MediaFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /**
   * What belongs in this frame, in the host's own words: "portrait video",
   * "the qualifying replay", "the track in 3D". It is read out as the frame's
   * name and it is what the empty state shows, so it is required rather than
   * defaulted: a frame that cannot say what it is waiting for is the blank
   * rectangle this component exists to prevent.
   */
  label: string
  /** The shape the frame holds. Defaults to `portrait`, which is what 3h and 5f draw. */
  format?: MediaFormat
  /**
   * The exact ratio, as `width:height`, when the format's default is not it.
   * It travels to the stylesheet as a custom property rather than an attribute,
   * the same way `--gs-progress` does: a ratio is geometry, nothing selects on
   * it and no test reads it as state.
   */
  ratio?: string
  /**
   * The host has been asked for the media and has not answered yet. Host-declared,
   * never inferred, exactly as the contract requires: the library cannot know.
   */
  busy?: boolean
  /**
   * Playback is running. The host's word, for the same reason. The frame starts
   * nothing, stops nothing and times nothing; it repeats what it was told so a
   * theme and a test can both see it.
   */
  playing?: boolean
  /**
   * The host's media: a `<video>`, a `<canvas>`, an `<img>`, an iframe, a Unity
   * build. Rendered untouched into the frame. Pass nothing and the frame renders
   * its empty state instead, which is a supported case rather than a failure.
   */
  children?: React.ReactNode
}

/**
 * `9:16` as the `9 / 16` CSS accepts. String work, no measurement: the frame
 * never asks the media how big it is, because asking is how a library starts
 * having an opinion about what media is.
 *
 * A ratio it cannot read falls back to the format's default rather than
 * throwing or rendering flat, because a malformed prop must not be able to
 * collapse the frame.
 */
export function aspectRatio(ratio: string, format: MediaFormat): string {
  const parts = ratio.split(':')
  if (parts.length !== 2) return aspectRatio(DEFAULT_RATIO[format], format)
  const width = Number(parts[0])
  const height = Number(parts[1])
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_RATIO[format].replace(':', ' / ')
  }
  return `${width} / ${height}`
}

/** From the contract's table of state words, so no component invents its own. */

export function MediaFrame(props: MediaFrameProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    busy: copy['media-frame.busy'],
    empty: copy['media-frame.empty'],
    playing: copy['media-frame.playing'],
  } as const
  const {
    label,
    format = 'portrait',
    ratio,
    busy = false,
    playing = false,
    className,
    children,
    ...rest
  } = componentProps

  const shape = ratio ?? DEFAULT_RATIO[format]

  // Empty is "the host passed nothing", which is a fact about this render and
  // not something the frame works out about the media. `React.Children.count`
  // counts what was passed; it does not look inside it.
  const empty = React.Children.count(children) === 0

  // The name carries every state, because a screen reader user gets no
  // placeholder, no shape and no spinner. Order: what it is, then what is true
  // of it, then the shape it is holding.
  const words = [label]
  if (busy) words.push(STATE_WORD.busy)
  if (empty) words.push(STATE_WORD.empty)
  if (playing) words.push(STATE_WORD.playing)
  words.push(shape)

  return (
    <div
      {...rest}
      className={['gs-media-frame', className].filter(Boolean).join(' ')}
      style={{ ['--gs-media-frame-aspect' as string]: aspectRatio(shape, format), ...rest.style }}
      data-gs-component="media-frame"
      data-gs-format={format}
      data-gs-busy={busy ? 'true' : undefined}
      data-gs-empty={empty ? 'true' : undefined}
      data-gs-playing={playing ? 'true' : undefined}
      // A group rather than a figure or a region: the frame is related content
      // with a name, it is not a landmark, and it is not a control.
      role="group"
      aria-label={words.join(', ')}
      // The one aria the frame owes the host case: busy is exactly aria-busy,
      // which is why the contract merged data-gs-loading into data-gs-busy.
      aria-busy={busy ? true : undefined}
    >
      {/*
        The host's media, rendered untouched and with nothing wrapped round it.
        The same rule `stage` keeps about its scene: no ref, no cloneElement, no
        measurement. The stylesheet places every child in the one grid cell, so
        the frame holds the shape without the media being asked to cooperate.
      */}
      {children}

      {/*
        Waiting. The drawing (5f) fills the surface with a faint diagonal
        stripe, turns a ring and writes "Loading replay" under it: three things
        a player reads as "coming", none of them a blank. It renders whenever
        the host says busy, over the media if the host has passed a poster and
        on the bare surface if not, and it never shows the shape words: a frame
        that is loading has already said what it is for.

        aria-hidden, because the group's name above already says "working".
        The ring carries data-gs-animates="motion" because it turns; the
        stylesheet stops it under reduced motion and the words stay.
      */}
      {busy ? (
        <div className="gs-media-frame__busy" data-gs-scope="media-frame" data-gs-part="busy" aria-hidden="true">
          <span className="gs-media-frame__ring" data-gs-animates="motion" />
          <span className="gs-media-frame__label" data-gs-scope="media-frame" data-gs-part="label">
            {copy['media-frame.loadingLabel'](copy['media-frame.loading'], label)}
          </span>
        </div>
      ) : null}

      {/*
        Never a blank rectangle. The placeholder renders whenever the host has
        passed nothing and is not busy: the glyph, what is coming, and how big
        it will be. Busy takes its place rather than stacking on it, because
        the drawing shows one message at a time in the middle of the frame.

        aria-hidden, because the group's own name above already carries every
        one of these words and announcing them twice reads the frame twice.
      */}
      {empty && !busy ? (
        <div className="gs-media-frame__empty" data-gs-scope="media-frame" data-gs-part="empty" aria-hidden="true">
          <span className="gs-media-frame__glyph" data-gs-scope="media-frame" data-gs-part="glyph">
            <FrameGlyph />
          </span>
          <span className="gs-media-frame__label" data-gs-scope="media-frame" data-gs-part="label">
            {label}
          </span>
          <span className="gs-media-frame__detail" data-gs-scope="media-frame" data-gs-part="detail">
            {shape}
          </span>
        </div>
      ) : null}
    </div>
  )
}
