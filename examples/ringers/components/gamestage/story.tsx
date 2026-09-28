'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The two components a story is made of. These imports come first on purpose:
// an ES module's imports are evaluated in source order, so every stylesheet
// below this line has already been injected by the time `story.css` is, and a
// rule in story.css wins a tie with one in media-frame.css or hud.css. That
// ordering is the only guarantee the library has, and it exists because story
// depends on them rather than because anything schedules it.
import { MediaFrame, type MediaFormat } from './media-frame'
import { Hud, type HudProps } from './hud'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Story, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './story.css'

// The shared action type and press gesture. Without this import a customer
// receives primitives.css and nothing points at it, so `.gs-action-type` and
// `.gs-pressable` match the controls below and the rules never arrive
// (GSUI-118).
import './gamestage-primitives.css'

import { lockAxis, dismissProgress, dismissScale, release, type Axis } from './story-gestures'

// Pressed while a finger is down, set from pointer events. iOS Safari does not
// apply `:active` to an element with no touch listener of its own, so without
// this a raised control never went down under a thumb (Tom, 2026-09-27). Set
// on the element directly: React does not own this attribute, so nothing
// re-renders on every touch. `.gs-pressable[data-gs-pressed='true']` in
// gamestage-primitives.css draws it, and leaves a disabled control still.
const UNPRESSABLE = ":disabled, [aria-disabled='true'], [data-gs-disabled='true'], [data-gs-locked='true']"
const pressHandlers = {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
    // A disabled or locked control does not move: the padlock answers instead.
    if (event.currentTarget.matches(UNPRESSABLE)) return
    event.currentTarget.setAttribute('data-gs-pressed', 'true')
  },
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
  onPointerLeave: (event: React.PointerEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-gs-pressed'),
}


/**
 * Story: the vertical format from specimen 3h. A sequence of frames a player
 * moves through, with the game's own state laid over the top.
 *
 * It is `media-frame` plus `hud` and a set of controls, and it owns no more of
 * the media than `media-frame` does. It does not play, advance on its own,
 * count elapsed time or decide that a frame is finished. The host owns `step`
 * and the story tells it which way the player asked to go; a story that
 * advanced itself would be a player with a timer in it, which is the thing the
 * media group exists not to be.
 *
 * **The pager is a placeholder and is meant to be deleted.** See the comment on
 * `StoryPager` below.
 */

export interface StoryFrame {
  /** The host's own id for this frame. Also what keeps React's list stable. */
  id?: string
  /**
   * What belongs in this frame, in the host's words. It is the frame's
   * accessible name and the words its empty state shows, so it is required for
   * the reason `media-frame` requires it.
   */
  label: string
  /** The caption plate under the media. The design's "Swipe a driver right…". */
  detail?: string
  /** The host's media for this frame. Omit it and the frame renders empty. */
  media?: React.ReactNode
  /** The host has been asked for this frame's media and has not answered. */
  busy?: boolean
  /** Playback is running on this frame. The host's word, never inferred. */
  playing?: boolean
  /**
   * How far through this frame playback is, 0 to 1. The host's word, for the
   * same reason as `playing`: the story has never touched the media and cannot
   * know. It fills the current cell of the pager, which is what the drawing
   * shows; absent, the cell stays hollow.
   */
  progress?: number
}

export interface StoryAction {
  /** The word on the control, which is the verb of its outcome. */
  label: string
  /** What the host does about it. The story does nothing else with the press. */
  onAction?: () => void
  /** Not available. Distinct from locked, which this component does not use. */
  disabled?: boolean
}

export interface StoryProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /** The frames, in order. One element per frame, always rendered in the pager. */
  frames: StoryFrame[]
  /**
   * Which frame the player is on, 1-based. The host owns it: the story renders
   * the step it is given and never moves on its own. Out-of-range values are
   * clamped rather than thrown, because a sequence must not be able to crash a
   * screen on an off-by-one.
   */
  step?: number
  /** Called with the step the player asked for. The host decides what happens. */
  onStep?: (step: number) => void
  /** The sequence's own name, read beside the count: the design's "How to play". */
  title?: string
  /** The shape the frames hold. Defaults to `portrait`, which is what 3h draws. */
  format?: MediaFormat
  /** The exact ratio, as `width:height`, when the format's default is not it. */
  ratio?: string
  /** The game state laid over the media. Rendered as a `hud`, which owns it. */
  hud?: HudProps
  /** Leaving the sequence. Omit `onSkip` and no Skip control renders. */
  onSkip?: () => void
  /** The word on the Skip control. */
  skipLabel?: string
  /** The one thing to do from here: the design's full-width "TRY IT NOW". */
  action?: StoryAction
  /** The word for the whole sequence, for a screen reader. */
  label?: string
  /** The words on the two step controls, for a host that localises. */
  previousLabel?: string
  nextLabel?: string
  /**
   * Work the story the way a phone's stories work: tap the right of the frame
   * for the next frame and the left third for the one before, swipe across to
   * do the same, and swipe down to put the whole thing away. Off by default, so
   * a host with gestures of its own is not answered twice. Moving still goes
   * through `onStep` and closing through `onSkip`, so the host keeps the step
   * and decides what closing means. A press on a control inside is the
   * control's and never moves the story. GSUI-290.
   */
  gestures?: boolean
  /**
   * Cover the whole screen, the way a phone's stories do, above everything the
   * page has: its top bar, its bottom nav, anything with a z-index. The story
   * opens in the browser's top layer as a modal `<dialog>`, so no stacking
   * context in the host can put anything over it, and its header and foot
   * clear the notch, the status bar and the home bar. Escape calls `onSkip`.
   * Render it only while it should be open: mounting opens it and unmounting
   * closes it. GSUI-290.
   */
  fullscreen?: boolean
  /**
   * A finger is down on the story (`true`) or has let go (`false`), for a host
   * that advances on a timer and should pause while the player holds. After a
   * drag that springs back, `false` arrives once the story is home.
   */
  onHold?: (held: boolean) => void
  /**
   * How far a downward drag has taken the story towards closing, 0 to 1, for a
   * host to fade whatever is behind it. `settling` is true when the story is
   * animating home or away on its own rather than following a finger, so the
   * host can animate the fade over the same time.
   */
  onDismissProgress?: (progress: number, settling: boolean) => void
}

/**
 * Inline SVG taking `currentColor`, never an emoji: an emoji carries its own
 * palette, ignores the theme and renders differently on every platform.
 * `aria-hidden`, because the button around it carries the name.
 */
function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false">
      <path
        d={back ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The close mark, drawn the same way as the chevrons beside it. */
function Cross() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The pager: which frame of how many, as a row of cells.
 *
 * **PLACEHOLDER. Do not copy this, and do not build a third one.** The shared
 * segmented track is GSUI-115, shipping as the `segments` component with
 * `presentation="pager"`, and it was not on `main` when this was written. The
 * same object is drawn three times in the design: the round indicator on 3b,
 * the segmented progress on 3c and this pager on 3h. Three names for one track
 * is exactly what GSUI-115 exists to prevent, so this is deliberately the
 * thinnest thing that renders, it is private to this file, and it emits the
 * same per-segment attributes `segments` emits, `data-gs-step`,
 * `data-gs-active` and `data-gs-complete`, so a test written against it
 * survives the swap.
 *
 * Folding it in is GSUI-126: delete this function, import `segments`, add
 * `@gamestage/segments` to `story.json`'s registryDependencies.
 *
 * It is a readout, not a control. The design draws it as one, and the frames
 * are reachable from the two step controls below, so making each cell pressable
 * would add a second way to do the same thing and a focus order to maintain.
 * `role="list"` with a named item each, so it is readable without colour and
 * without shape.
 */
function StoryPager(props: { strings?: StringsOverrides; total: number; current: number; progress?: number }) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const { total, current, progress } = componentProps

  // Clamped for the drawing only, the same way stat clamps its marks: the
  // host's number is the host's, and a fill cannot run past its cell.
  const fill = progress === undefined ? undefined : Math.min(1, Math.max(0, progress))
  return (
    <div className="gs-story__pager" data-gs-scope="story" data-gs-part="track" role="list">
      {Array.from({ length: total }, (_, index) => {
        const position = index + 1
        const done = position < current
        const active = position === current
        // Each cell is announced on its own, because "3 of 5" does not say
        // which three are behind. Position first, so the list reads in order.
        const words = [`${position}`, done ? copy['story.complete'] : active ? copy['story.current'] : copy['story.toGo']]
        return (
          <span
            key={position}
            className="gs-story__segment"
            data-gs-scope="story" data-gs-part="step"
            data-gs-step={position}
            data-gs-complete={done ? 'true' : undefined}
            data-gs-active={active ? 'true' : undefined}
            style={active && fill !== undefined ? { ['--gs-story-progress' as string]: `${fill * 100}%` } : undefined}
            role="listitem"
            aria-label={words.join(', ')}
          />
        )
      })}
    </div>
  )
}

/** Clamped rather than thrown: an off-by-one must not be able to blank a screen. */
export function clampStep(step: number, total: number): number {
  if (total < 1) return 1
  if (!Number.isFinite(step)) return 1
  return Math.min(total, Math.max(1, Math.trunc(step)))
}

export function Story(props: StoryProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)

  const {
    frames,
    step = 1,
    onStep,
    title,
    format = 'portrait',
    ratio,
    hud,
    onSkip,
    skipLabel = copy['story.skipLabel'],
    action,
    label = copy['story.label'],
    previousLabel = copy['story.previousLabel'],
    nextLabel = copy['story.nextLabel'],
    gestures = false,
    fullscreen = false,
    onHold,
    onDismissProgress,
    className,
    ...rest
  } = componentProps

  const total = frames.length
  const current = clampStep(step, total)
  const frame = frames[current - 1]

  const atStart = current <= 1
  const atEnd = current >= total

  // Focus follows the player off a control that just went disabled. A button
  // that is disabled while focused drops focus to the document body, so a
  // player who arrowed to the last frame lost their place and the next arrow
  // did nothing: a keyboard trap at the end of every sequence. The last
  // control focused is remembered at focus time, because by the time the
  // effect runs the browser has already moved focus off it.
  const previousRef = React.useRef<HTMLButtonElement>(null)
  const nextRef = React.useRef<HTMLButtonElement>(null)
  const lastFocused = React.useRef<'previous' | 'next' | null>(null)
  React.useEffect(() => {
    if (atEnd && lastFocused.current === 'next' && !atStart) previousRef.current?.focus()
    if (atStart && lastFocused.current === 'previous' && !atEnd) nextRef.current?.focus()
  }, [atStart, atEnd])

  const swipe = useStoryGestures({
    enabled: gestures,
    current,
    total,
    onStep,
    onSkip,
    onHold,
    onDismissProgress,
  })

  // The name carries the sequence, because a screen reader user gets no pager
  // and no chevrons. What it is, then where it is.
  const words = [title, label, total > 0 ? copy['story.valueOfMax'](current, total) : copy['story.empty']].filter(
    Boolean,
  )

  const story = (
    <div
      {...rest}
      {...swipe.handlers}
      ref={swipe.ref}
      className={['gs-story', className].filter(Boolean).join(' ')}
      data-gs-component="story"
      // How the story is worked, when it takes gestures. `data-gs-swipe` joins
      // it while the story is being dragged down, and is written by the drag
      // itself rather than by a render, which is what keeps the drag at the
      // frame rate.
      data-gs-interaction={gestures ? 'swipe' : undefined}
      data-gs-presentation={fullscreen ? 'fullscreen' : undefined}
      data-gs-format={format}
      // No frames means no position to be at, so the attribute is absent
      // rather than claiming step 1 of 0 to anything reading the pair.
      data-gs-step={total > 0 ? current : undefined}
      data-gs-max={total}
      role="group"
      aria-label={words.join(', ')}
    >
      {/*
        The media frame owns the space and the empty case. A story with no
        frames still renders one, so the screen has the same shape before the
        host's sequence arrives as after it. Busy and playing are the frame's
        and travel straight through untouched: the story knows no more about
        playback than the frame does, which is nothing.
      */}
      <MediaFrame
        strings={copy}
        label={frame?.label ?? title ?? label}
        format={format}
        ratio={ratio}
        busy={frame?.busy}
        playing={frame?.playing}
      >
        {frame?.media}
      </MediaFrame>

      {/*
        Everything the library lays over the host's media. The overlay itself
        takes no presses: a press that lands on the media belongs to the host,
        the same rule `stage` makes assertable for its own layers. Each control
        inside takes its own, because each is only as big as itself. There is no
        `data-gs-pointer-events` here because the contract scopes that attribute
        to a stage layer, and a story is not a stage; the rule is in story.css
        and stated here rather than borrowed.
      */}
      <div className="gs-story__overlay">
        <div className="gs-story__top">
          <StoryPager strings={copy} total={total} current={current} progress={frame?.progress} />

          <div className="gs-story__header">
            {title ? (
              <span className="gs-story__title" data-gs-scope="story" data-gs-part="label">
                {title}
              </span>
            ) : null}
            {/* aria-hidden: the group's name above already carries the count,
                and announcing it twice reads the position twice. */}
            <span className="gs-story__count" data-gs-scope="story" data-gs-part="summary" aria-hidden="true">
              {copy['story.valueOfMax'](current, total)}
            </span>
            {onSkip ? (
              <button
                type="button"
                className="gs-story__skip gs-action-type gs-pressable"
                {...pressHandlers}
                data-gs-scope="story" data-gs-part="dismiss"
                // A round mark rather than a worded pill: Tom, 2026-09-28, "it's
                // cramped in all places". The word stays the name a screen
                // reader hears and a hover shows.
                aria-label={skipLabel}
                title={skipLabel}
                onClick={onSkip}
              >
                <Cross />
              </button>
            ) : null}
          </div>

          {/* The game state over the media, as a hud, which owns every number
              in it. The story adds no number of its own and carries no
              data-gs-value: a container never repeats a value it contains. */}
          {hud ? <Hud strings={copy} placement="top-right" {...hud} /> : null}
        </div>

        {/* The two step controls. `decrement` and `increment` because a story's
            step is a bounded value and these are what move it, which is the
            same idea a stepper's two controls carry. Both stay mounted and go
            disabled at the ends, so the row does not reflow under a thumb
            reaching for it. */}
        <div className="gs-story__steps">
          <button
            type="button"
            className="gs-story__step-control gs-action-type gs-pressable"
            {...pressHandlers}
            data-gs-scope="story" data-gs-part="decrement"
            ref={previousRef}
            onFocus={() => { lastFocused.current = 'previous' }}
            onClick={() => onStep?.(current - 1)}
            disabled={atStart}
            data-gs-disabled={atStart ? 'true' : undefined}
            // Both, the way `button` does it. The native attribute stops the
            // event and takes the control out of the tab order; aria-disabled
            // is what the accessibility stage and .gs-pressable both read, and
            // a control carrying one without the other is the half-state the
            // gate exists to catch.
            aria-disabled={atStart || undefined}
            aria-label={previousLabel}
          >
            <Chevron back />
          </button>
          <button
            type="button"
            className="gs-story__step-control gs-action-type gs-pressable"
            {...pressHandlers}
            data-gs-scope="story" data-gs-part="increment"
            ref={nextRef}
            onFocus={() => { lastFocused.current = 'next' }}
            onClick={() => onStep?.(current + 1)}
            disabled={atEnd}
            data-gs-disabled={atEnd ? 'true' : undefined}
            aria-disabled={atEnd || undefined}
            aria-label={nextLabel}
          >
            <Chevron />
          </button>
        </div>

        <div className="gs-story__bottom">
          {frame?.detail ? (
            <p className="gs-story__caption" data-gs-scope="story" data-gs-part="detail">
              {frame.detail}
            </p>
          ) : null}

          {action ? (
            <div className="gs-story__actions" data-gs-scope="story" data-gs-part="actions">
              <button
                type="button"
                className="gs-story__action gs-action-type gs-pressable"
                {...pressHandlers}
                onClick={action.onAction}
                disabled={action.disabled}
                data-gs-disabled={action.disabled ? 'true' : undefined}
                aria-disabled={action.disabled || undefined}
                data-gs-variant="primary"
              >
                {action.label}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!fullscreen) return story
  return (
    <StoryScreen onCancel={onSkip} label={words.join(', ')}>
      {story}
    </StoryScreen>
  )
}

/**
 * The screen a fullscreen story opens on: a modal `<dialog>` in the browser's
 * top layer. The top layer is drawn above every stacking context the page
 * has, so a host's sticky header, a transformed container or a z-index of a
 * thousand cannot cover the story, which is what a fixed element with a
 * z-index could never promise. Mounted open and closed by unmounting, so the
 * host keeps deciding whether the story is showing.
 *
 * The screen is the story's backdrop too: a plain edge-coloured cover that the
 * drag fades as the story is pulled away, so the page shows through behind a
 * story on its way out, the way a phone's stories reveal the feed.
 */
function StoryScreen({
  onCancel,
  label,
  children,
}: {
  onCancel?: () => void
  label: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDialogElement>(null)
  const cancel = React.useRef(onCancel)
  cancel.current = onCancel
  React.useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) {
      try {
        if (typeof dialog.showModal === 'function') dialog.showModal()
        else dialog.setAttribute('open', '')
        // showModal focuses the first control, the close mark, and a ring on it
        // the moment a story opens reads as something already chosen. The
        // dialog takes focus itself; Tab reaches the close mark next.
        dialog.focus()
      } catch {
        // Not connected yet, or already open elsewhere: shown in flow instead.
        dialog.setAttribute('open', '')
      }
    }
    // Escape reaches a modal dialog as `cancel`. The host decides what closing
    // means, so the browser is stopped from closing it underneath the host.
    const onDialogCancel = (event: Event) => {
      event.preventDefault()
      cancel.current?.()
    }
    dialog.addEventListener('cancel', onDialogCancel)
    return () => {
      dialog.removeEventListener('cancel', onDialogCancel)
      if (dialog.open && typeof dialog.close === 'function') dialog.close()
    }
  }, [])
  return (
    <dialog ref={ref} className="gs-story-screen" aria-label={label} tabIndex={-1}>
      {children}
    </dialog>
  )
}

/**
 * The gestures, as a hook the root spreads. Everything a finger does to the
 * story is read here and turned into one of three requests the host already
 * understands: a step through `onStep`, closing through `onSkip`, or nothing.
 *
 * The drag writes straight to the element's style rather than through React
 * state. A render per pointer move is a render per frame of a whole story with
 * a video in it, and the point of the gesture is that it keeps up with a thumb.
 * The decisions are in story-gestures.ts, where each threshold is tested.
 */
interface GestureOptions {
  enabled: boolean
  current: number
  total: number
  onStep?: (step: number) => void
  onSkip?: () => void
  onHold?: (held: boolean) => void
  onDismissProgress?: (progress: number, settling: boolean) => void
}

interface Press {
  id: number
  x: number
  y: number
  t: number
  lastY: number
  lastT: number
  velocity: number
  axis: Axis | null
  startX: number
  width: number
  height: number
  radius: string
  still: boolean
}

/** A press that starts on one of these belongs to it and never moves the story. */
const CONTROLS = 'a,button,input,select,textarea,label,[role="button"]'

const reducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

/** The longest a settle can take, so a missing transitionend cannot strand it. */
const SETTLE_FALLBACK_MS = 450

function useStoryGestures(options: GestureOptions) {
  const ref = React.useRef<HTMLDivElement>(null)
  const press = React.useRef<Press | null>(null)
  const latest = React.useRef(options)
  latest.current = options

  // Draw the story where the finger has taken it. Progress 0 clears every
  // inline value, so the stylesheet is back in charge at rest.
  const draw = React.useCallback((dy: number, progress: number, p: Press | null, settling: boolean) => {
    const el = ref.current
    if (!el) return
    latest.current.onDismissProgress?.(progress, settling)
    // A fullscreen story's own screen fades with the drag, so the page shows
    // through behind it.
    const screen = el.parentElement?.classList.contains('gs-story-screen') ? el.parentElement : null
    if (screen) {
      screen.classList.toggle('gs-story-screen--settling', settling)
      if (progress > 0) screen.style.setProperty('--gs-story-screen-fade', String(1 - progress))
      else screen.style.removeProperty('--gs-story-screen-fade')
    }
    if (progress <= 0 && dy <= 0) {
      el.style.removeProperty('transform')
      el.style.removeProperty('border-radius')
      el.style.removeProperty('opacity')
      return
    }
    if (p?.still) {
      // Reduced motion: nothing slides or shrinks. The story fades as the
      // finger goes down, which still says where it is going.
      el.style.opacity = String(1 - progress)
      return
    }
    el.style.transform = `translate3d(0, ${dy}px, 0) scale(${dismissScale(progress)})`
    // The corners round as it shrinks, the way a card lifts off a phone's
    // stories, and never less rounded than the story already was.
    const ramp = Math.min(1, progress * 4)
    el.style.borderRadius = `max(${p?.radius ?? '0px'}, calc(var(--gs-radius-lg) * ${ramp}))`
  }, [])

  const settle = React.useCallback(
    (to: 'home' | 'away', p: Press, done: () => void) => {
      const el = ref.current
      if (!el) return done()
      el.classList.add('gs-story--settling')
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        el.removeEventListener('transitionend', onEnd)
        el.classList.remove('gs-story--settling')
        done()
      }
      const onEnd = (event: TransitionEvent) => {
        if (event.target === el) finish()
      }
      el.addEventListener('transitionend', onEnd)
      window.setTimeout(finish, SETTLE_FALLBACK_MS)
      // Wait a frame so the transition class is applied before the values
      // move, or the browser jumps straight to the end.
      requestAnimationFrame(() => {
        if (to === 'home') draw(0, 0, p, true)
        else draw(p.height, 1, p, true)
      })
    },
    [draw],
  )

  const end = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const p = press.current
      if (!p || p.id !== event.pointerId) return
      press.current = null
      const el = ref.current
      el?.removeAttribute('data-gs-swipe')
      const { onStep, onSkip, onHold, current, total } = latest.current
      const dx = event.clientX - p.x
      const dy = event.clientY - p.y
      const verdict = cancelled
        ? p.axis === 'y' && dy > 0
          ? ({ kind: 'spring-back' } as const)
          : ({ kind: 'none' } as const)
        : release({
            axis: p.axis,
            dx,
            dy,
            velocity: p.velocity,
            durationMs: performance.now() - p.t,
            startX: p.startX,
            width: p.width,
            height: p.height,
          })

      if (verdict.kind === 'dismiss' && onSkip) {
        settle('away', p, () => {
          onHold?.(false)
          onSkip()
          // A host that keeps the story mounted gets it back where it was.
          draw(0, 0, p, false)
        })
        return
      }
      if (verdict.kind === 'spring-back' || (verdict.kind === 'dismiss' && !onSkip)) {
        settle('home', p, () => onHold?.(false))
        return
      }
      onHold?.(false)
      if (verdict.kind === 'step') {
        const next = current + verdict.by
        if (next >= 1 && next <= total) onStep?.(next)
      }
    },
    [draw, settle],
  )

  const handlers = options.enabled
    ? {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          if (press.current) return
          if (event.pointerType === 'mouse' && event.button !== 0) return
          if ((event.target as HTMLElement).closest?.(CONTROLS)) return
          const el = ref.current
          if (!el) return
          const box = el.getBoundingClientRect()
          const now = performance.now()
          press.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            t: now,
            lastY: event.clientY,
            lastT: now,
            velocity: 0,
            axis: null,
            startX: event.clientX - box.left,
            width: box.width,
            height: box.height,
            radius: getComputedStyle(el).borderRadius || '0px',
            still: reducedMotion(),
          }
          // Captured, so a finger that slides off the story before lifting
          // still ends here and the hold cannot stick.
          try {
            el.setPointerCapture?.(event.pointerId)
          } catch {
            // Not captured; pointercancel ends it instead.
          }
          latest.current.onHold?.(true)
        },
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          const p = press.current
          if (!p || p.id !== event.pointerId) return
          const now = performance.now()
          const elapsed = now - p.lastT
          if (elapsed > 0) {
            // Smoothed, so one jittery sample at the moment of release cannot
            // turn a slow drag into a flick or the other way round.
            const instant = (event.clientY - p.lastY) / elapsed
            p.velocity = p.velocity * 0.4 + instant * 0.6
          }
          p.lastY = event.clientY
          p.lastT = now
          const dx = event.clientX - p.x
          const dy = event.clientY - p.y
          if (!p.axis) p.axis = lockAxis(dx, dy)
          if (p.axis !== 'y' || !latest.current.onSkip) return
          ref.current?.setAttribute('data-gs-swipe', 'down')
          const clamped = Math.max(0, dy)
          draw(clamped, dismissProgress(clamped, p.height), p, false)
        },
        onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => end(event, false),
        onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => end(event, true),
      }
    : {}

  return { ref, handlers }
}
