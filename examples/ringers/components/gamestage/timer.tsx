'use client'

import { type StringsOverrides } from './strings'

import * as React from 'react'

import { Stat, type StatPresentation } from './stat'

// The cue runtime. `./feel` is a local re-export shim in this repo and the
// installed sibling file in a host application, so the one specifier resolves
// in both places. With no provider above it, `useGameFeel` is a no-op.
import { useGameFeel } from './feel'


/**
 * Timer: a countdown that owns its own clock.
 *
 * It renders nothing of its own. `stat` draws the number, sizes it, gives it
 * tabular numerals and writes the accessible name, and this adds the one thing
 * `stat` refuses to do: it performs. It holds the interval, it decides what
 * second it is now, and it tells the host once when time is up.
 *
 * `data-gs-value` is always seconds and never a formatted string, so a test
 * reads 90 while a player reads 1:30. `format` is how the clock face gets
 * there. `direction` is mandatory in practice because one sample of
 * `data-gs-value="90"` cannot say whether that is ninety elapsed or ninety
 * remaining.
 */

export interface TimerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides
  /** How long the timer runs, in seconds. Changing it restarts the clock. */
  duration: number
  /**
   * Which run of the clock this is. Change it and the clock starts again at
   * the full duration, without the host remounting anything.
   *
   * A game whose rounds are all the same length could not start round two:
   * the clock only restarted when `duration` changed, so round two inherited
   * round one's spent time, and if round one ran out round two began expired.
   * The only way out was a new React `key`, and a Timer normally renders
   * through `Hud`'s `timer` slot, so keying it meant keying the whole HUD and
   * remounting the score and the lives with it. The question id is the usual
   * value. GSUI-129, GSUI-168.
   */
  runId?: string | number
  /**
   * When the round ends, as an absolute moment rather than a length: epoch
   * milliseconds, or a `Date`. Every client then shows the same remaining
   * time however long after the question opened its tab loaded.
   *
   * Without it the clock counts `duration` from the moment it mounts, which
   * is right for a demo and wrong for a live question: a player joining
   * twenty seconds in saw a full clock and twenty extra seconds to answer.
   *
   * `duration` stays required and stays the span the whole component is
   * scaled to, so `direction="up"`, `criticalAt` and `warningAt` mean what
   * they always meant. The deadline re-anchors the clock; it does not resize
   * it. `paused` is ignored while a deadline is set, because an absolute
   * moment does not stop. GSUI-156.
   */
  deadline?: number | Date
  /**
   * Milliseconds to add to this device's clock to get the server's, which is
   * the clock the deadline is quoted in: `serverNow - Date.now()` at the time
   * the host measured it. Ignored without a `deadline`.
   */
  clockOffset?: number
  /**
   * Which way the number travels. `down` counts `duration` to zero, `up`
   * counts zero to `duration`. Either way the timer ends at the same moment.
   */
  direction?: 'up' | 'down'
  /**
   * How many seconds from the end counts as critical. The host declares the
   * line; the component does not guess one. Absent means never critical.
   */
  criticalAt?: number
  /**
   * How many seconds from the end counts as a warning: the step before
   * critical. The host declares this line too, and absent means never warning.
   * The design draws three timers — running, ten seconds, three seconds — and
   * these are the two lines between them, so a game with different numbers gets
   * the same three drawings at its own thresholds.
   *
   * Set below `criticalAt` and the warning is unreachable, because critical is
   * the stronger claim and wins. That is the host's arithmetic, not something
   * this corrects: silently swapping them would make a typo invisible.
   */
  warningAt?: number
  /**
   * The silhouette. The design draws the timer as a filled pill whose fill
   * changes at each threshold, which is what makes it tell apart from the score
   * at a glance (GSUI-100).
   */
  presentation?: StatPresentation
  /** Stopped, not finished. The clock holds its place and loses no time. */
  paused?: boolean
  /** Fired once, when time runs out. Never twice, and never after unmount. */
  onExpire?: () => void
  /** The word beside the number. Defaults to `timer`. */
  label?: string
  /** How the seconds reach the screen. Defaults to `m:ss`. */
  format?: (seconds: number) => string
}

/**
 * The clock is read four times a second and rendered once, so a tab that was
 * throttled or a machine that stalled catches up on the next read instead of
 * losing the seconds it missed. Nothing counts ticks; every value is derived
 * from the wall clock, which is what "must not drift" means.
 */
const READ_INTERVAL_MS = 250

/** `m:ss` under an hour, `h:mm:ss` from an hour up. A format, not a
 * rendering: `stat` still draws it. The minutes take two digits only when an
 * hour precedes them, so a five minute clock reads 5:00 and not 05:00, and a
 * clock crossing the hour mark reads 1:00:00 rather than 60:00. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = String(whole % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export function Timer({
  duration,
  runId,
  deadline,
  clockOffset = 0,
  direction = 'down',
  criticalAt,
  warningAt,
  presentation = 'pill',
  paused = false,
  onExpire,
  label,
  format,
  className,
  ...rest
}: TimerProps) {
  const durationMs = duration * 1000
  const deadlineMs = deadline === undefined ? undefined : new Date(deadline).getTime()

  /**
   * How much of the run is already gone, read off the deadline. Null when the
   * host gave none, which is the mount-anchored clock this component has
   * always been.
   *
   * Its own derivation rather than a value threaded through `bankedMs` and
   * `startedAt`: those two exist to survive a pause, and an absolute moment
   * has nothing to survive. Every read is the wall clock minus the deadline,
   * so a stalled tab and a late joiner get the same answer as everyone else.
   */
  const spentAgainstDeadline = React.useCallback((): number | null => {
    if (deadlineMs === undefined) return null
    const left = Math.max(0, deadlineMs - (Date.now() + clockOffset))
    return Math.min(durationMs, Math.max(0, durationMs - left))
  }, [deadlineMs, clockOffset, durationMs])

  /** Whole seconds, from milliseconds already run. */
  const wholeSeconds = React.useCallback(
    (ran: number) => (ran >= durationMs ? duration : Math.floor(ran / 1000)),
    [durationMs, duration],
  )

  // Elapsed whole seconds. Whole, because this is also what the accessible
  // name says, and a name that changes four times a second is a name nobody
  // can read. A deadline already half spent opens half spent, on the first
  // paint rather than on the first read a quarter of a second later.
  const [elapsed, setElapsed] = React.useState(() => {
    const ran = spentAgainstDeadline()
    return ran === null ? 0 : wholeSeconds(ran)
  })

  // Time already banked before the current run, and when the current run
  // started. Pausing banks; resuming re-anchors. The pair is what survives a
  // pause without losing or inventing time.
  const bankedMs = React.useRef(0)
  const startedAt = React.useRef<number | null>(null)
  const expired = React.useRef(false)

  // The host may hand a new closure on every render; the interval must not be
  // torn down and rebuilt for that, or a re-rendering host resets the anchor
  // forever and the clock never advances.
  const expiryHandler = React.useRef(onExpire)
  React.useEffect(() => {
    expiryHandler.current = onExpire
  })

  // A new duration is a new timer, and so is a new run of the same duration,
  // and so is a new deadline. Declared before the ticking effect so that on
  // any of those React runs the tick cleanup, which banks time, and then this,
  // which throws that banked time away.
  //
  // The first render is not one of these: React runs the effect on mount too,
  // and setting the elapsed value it was already given costs nothing.
  React.useEffect(() => {
    bankedMs.current = 0
    startedAt.current = null
    expired.current = false
    const ran = spentAgainstDeadline()
    setElapsed(ran === null ? 0 : wholeSeconds(ran))
  }, [durationMs, runId, deadlineMs, spentAgainstDeadline, wholeSeconds])

  React.useEffect(() => {
    const finish = () => {
      if (expired.current) return
      expired.current = true
      expiryHandler.current?.()
    }

    // Anchored to a moment. Nothing is banked and nothing is resumed, because
    // an absolute deadline arrives whether the tab watches it or not, which is
    // also why `paused` is not read here.
    if (deadlineMs !== undefined) {
      let done = false
      const read = () => {
        const ran = spentAgainstDeadline() ?? 0
        setElapsed(wholeSeconds(ran))
        if (ran >= durationMs) {
          done = true
          finish()
        }
      }
      read()
      if (done) return
      const id = setInterval(() => {
        read()
        if (done) clearInterval(id)
      }, READ_INTERVAL_MS)
      return () => clearInterval(id)
    }

    if (paused) return

    // Already over: a resumed expired timer, or a zero-length one.
    if (bankedMs.current >= durationMs) {
      finish()
      return
    }

    startedAt.current = Date.now()

    const id = setInterval(() => {
      const anchor = startedAt.current ?? Date.now()
      const ran = Math.min(durationMs, bankedMs.current + (Date.now() - anchor))
      // At the end the value is exactly the end of the range, not the floor of
      // it, so a 90.5s timer still finishes at 90.5 and not at 90.
      setElapsed(ran >= durationMs ? duration : Math.floor(ran / 1000))
      if (ran >= durationMs) {
        clearInterval(id)
        bankedMs.current = durationMs
        startedAt.current = null
        finish()
      }
    }, READ_INTERVAL_MS)

    // Runs on pause and on unmount. Both bank the time; only one of them has
    // anywhere to spend it, and the leaked interval is the bug this catches.
    return () => {
      clearInterval(id)
      if (startedAt.current !== null) {
        bankedMs.current = Math.min(durationMs, bankedMs.current + (Date.now() - startedAt.current))
        startedAt.current = null
      }
    }
  }, [paused, durationMs, duration, runId, deadlineMs, spentAgainstDeadline, wholeSeconds])

  const remaining = Math.max(0, duration - elapsed)
  const complete = elapsed >= duration
  // The end of the range, whichever end the host asked to watch.
  const value = direction === 'up' ? elapsed : remaining
  // Critical is about how much time is left, so it means the same thing in
  // both directions. It ends when the timer does: time is not running out any
  // more once it has run out.
  const critical = criticalAt !== undefined && !complete && remaining <= criticalAt
  // The step before it, on the same rule and for the same reason: a warning is
  // about how much time is left, and it stops when the timer does. Both may be
  // true at once and `stat` lets critical win, so nothing here has to subtract
  // one line from the other.
  const warning = warningAt !== undefined && !complete && remaining <= warningAt

  // The design, specimen 3b: "critical: motion.pulse 1s loop · sfx.tick each
  // second · haptic.light · reduced-motion: static red fill". The pulse and the
  // red fill are stat.css; this is the second half, the part a player hears and
  // feels.
  //
  // Keyed on the whole second rather than on the 250ms read, so it fires once
  // per second and not four times. A paused clock is not running out of time,
  // and an expired one has finished running out, so neither ticks: `critical`
  // is already false once `complete`, and `paused` is checked here.
  // Held in a ref for the same reason `onExpire` is, one screen up: the
  // runtime rebuilds `cue` whenever a host hands the provider a fresh `onCue`
  // closure, and an effect keyed on its identity would tick again on a render
  // rather than on a second. The dependency list is the second, which is what
  // "each second" means.
  const { cue } = useGameFeel()
  const cueRef = React.useRef(cue)
  React.useEffect(() => {
    cueRef.current = cue
  })
  React.useEffect(() => {
    if (!critical || paused) return
    cueRef.current('tick', 'sfx')
    cueRef.current('light', 'haptic')
  }, [critical, paused, elapsed])

  return (
    // No wrapper: `stat` takes `component` and `complete` as props now, so the
    // timer names its own root and reports expiry through the same vocabulary
    // every other number uses. Passing data-gs-complete through the spread
    // would be silently overwritten, which is the bug this replaced.
    <Stat
      {...rest}
      className={className}
      component="timer"
      kind="timer"
      value={value}
      direction={direction}
      paused={paused}
      critical={critical}
      warning={warning}
      presentation={presentation}
      complete={complete}
      label={label}
      format={format ?? formatClock}
    />
  )
}
