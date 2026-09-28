import * as React from 'react'
import { Button } from '@/components/gamestage/button'
import { Choice } from '@/components/gamestage/choice'
import { GameFeelProvider } from '@/components/gamestage/cues'
import { EmptyState } from '@/components/gamestage/empty-state'
import { ErrorState } from '@/components/gamestage/error-state'
import { Identity } from '@/components/gamestage/identity'
import { Leaderboard } from '@/components/gamestage/leaderboard'
import { Nav } from '@/components/gamestage/nav'
import { PlayGlyph, TrophyGlyph, PersonGlyph, QuestionGlyph } from '@/components/gamestage/glyphs'
import { Podium } from '@/components/gamestage/podium'
import { Sheet } from '@/components/gamestage/sheet'
import { Streak } from '@/components/gamestage/streak'
import { Toast } from '@/components/gamestage/toast'
import { Toggle } from '@/components/gamestage/toggle'
import { Stories, type RevealFrame } from './stories'

/**
 * Ringers, drawn with Gamestage UI in a monochrome demo register.
 *
 * Sixteen names; four never played for the club. A fan picks the ones they
 * think are ringers and locks them in. The page never knows which four they
 * are: the Engine marks every pick and says only which were right, and what a
 * fan found stays found in `progress.solved`.
 *
 * Every word a fan reads is a producer's. Studio settings named `label_<key>`
 * arrive as `presentation.labels.<key>`, and the fixed fields as
 * `presentation.<field>`. Their starting values are `gamestage.settings.json`,
 * which a deploy seeds into empty Studio fields. The page keeps no copy. The
 * colours are Studio's too: the palette becomes Gamestage UI's tokens through
 * the client's bridge, so a producer can recolour the demo without a deploy.
 */

type Round = {
  id: string
  number?: number
  version: number
  timer_seconds?: number
  challenge: { prompt?: string; board: string[]; pick?: number }
}
type RoundState = {
  attempts_used: number
  attempts_allowed?: number
  mistakes_used: number
  mistakes_allowed?: number
  finished?: boolean
  outcome?: string
  score?: number
  progress?: { solved?: string[]; answer?: string[] }
  started_at?: string
}
type Presentation = Record<string, any> & { labels?: Record<string, string> }
type LabelKey = Extract<keyof typeof import('../gamestage.settings.json'), `label_${string}`>
type Place = 'play' | 'leaderboard' | 'profile' | 'how'
type Me = { id?: string; name?: string; avatar?: string; avatarUrl?: string }

declare global {
  interface Window {
    __gamestage: Promise<any>
    GAMESTAGE_TOKEN?: string
  }
}

const SEEN_KEY = 'ringers.seen'
const SOUND_KEY = 'ringers.sound'

function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''))
}
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // A private window keeps nothing; the game still plays.
  }
}
/** Every name on the board has words in it, so the round can be played. */
function boardReady(r: { challenge?: { board?: unknown } }): boolean {
  const board = r.challenge?.board
  return Array.isArray(board) && board.length > 1 && board.every((name) => typeof name === 'string' && name.trim().length > 0)
}
function pickOne<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

/**
 * The podium and the list, from one read of the board. Memoised on the rows'
 * content, so a page re-render hands the podium the same places and nothing
 * moves unless a rank changed. The podium only when the top three hold three
 * different places; a true tie is the list alone, reading "=1".
 */
const Standings = React.memo(function Standings(props: {
  entries: any[]
  me?: string
  scoreLabel: string
  zeroLabel: (n: number) => string
}) {
  const { entries, me, scoreLabel, zeroLabel } = props
  const rows = React.useMemo(
    () =>
      entries.map((e: any) => ({
        id: e.player_id,
        rank: e.rank,
        name: e.display_name ?? '',
        avatarUrl: e.avatar_url,
        score: e.score,
        you: e.player_id === me,
      })),
    [entries, me],
  )
  const top = rows.slice(0, 3)
  const podium = top.length === 3 && new Set(top.map((e) => e.rank)).size === 3
  const rest = podium ? rows.slice(3) : rows
  return (
    <>
      {podium ? <Podium places={top} scoreLabel={scoreLabel} /> : null}
      {rest.length > 0 ? <Leaderboard entries={rest} scoreLabel={scoreLabel} zeroRowsLabel={zeroLabel} /> : null}
    </>
  )
})

export function App() {
  const game = React.useRef<any>(null)
  const [presentation, setPresentation] = React.useState<Presentation>({})
  const [deployedName, setDeployedName] = React.useState<string>()
  const [failure, setFailure] = React.useState<string | null>(null)
  const [loadAsk, setLoadAsk] = React.useState(0)
  const [round, setRound] = React.useState<Round | null>(null)
  const [state, setState] = React.useState<RoundState | null>(null)
  const [pool, setPool] = React.useState<{ id: string; number?: number }[]>([])
  const [playedIds, setPlayedIds] = React.useState<string[]>([])
  const [resumed, setResumed] = React.useState(0)
  const [chosen, setChosen] = React.useState<string[]>([])
  // Names this fan locked in that did play for the club, from the Engine's
  // feedback this visit. The Engine keeps what was found, not what was missed,
  // so after a reload these are fresh again and a fan may try them.
  const [missed, setMissed] = React.useState<string[]>([])
  const [sending, setSending] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [place, setPlace] = React.useState<Place>('play')
  const [me, setMe] = React.useState<Me>({})
  const [sound, setSound] = React.useState(() => readLocal(SOUND_KEY) !== 'off')
  const [nonce, setNonce] = React.useState(0)
  const startedAt = React.useRef(0)
  const [offline, setOffline] = React.useState(false)
  const [notReady, setNotReady] = React.useState(false)
  // The server's clock, ticking, for the fan's own round timer. Ringers gives
  // each fan three minutes (the round's `timer_seconds`) from the moment they
  // open it; the Engine refuses a play after that with `time_expired`, so the
  // page shows the clock and, when it runs out, says so plainly.
  const [clock, setClock] = React.useState(0)
  const [expired, setExpired] = React.useState(false)
  const pending = React.useRef<{ intent: string; key: string } | null>(null)

  const word = React.useCallback(
    (key: LabelKey, values: Record<string, string | number> = {}) =>
      fill(presentation.labels?.[key.slice('label_'.length)] || '', values),
    [presentation],
  )
  const title = presentation.displayName || deployedName || ''

  React.useEffect(() => {
    document.getElementById('boot')?.remove()
  }, [])

  const loadState = React.useCallback(async (r: Round) => {
    // A board with a blank name is not a round a fan can play, and reading its
    // state would start their clock on it. Shown as not ready instead. GS-584.
    if (!boardReady(r)) {
      setRound(r)
      setState(null)
      setNotReady(true)
      return
    }
    setNotReady(false)
    const [fresh, rounds, mine] = await Promise.all([
      game.current.client.getRoundState(r.id) as Promise<RoundState>,
      game.current.client.getRounds().catch(() => null),
      game.current.client.getPlayedRounds?.().catch(() => null),
    ])
    if (rounds?.rounds) setPool(rounds.rounds)
    setResumed(fresh && !fresh.finished ? fresh.attempts_used ?? 0 : 0)
    if (mine?.played) setPlayedIds(mine.played.map((p: { round_id: string }) => p.round_id))
    setRound(r)
    setState(fresh)
    setChosen([])
    setMissed([])
    setExpired(false)
    pending.current = null
    setNonce((n) => n + 1)
  }, [])

  const loadMe = React.useCallback(async () => {
    const profile = await game.current.client.getProfile()
    setMe({ id: profile.player_id, name: profile.display_name, avatar: profile.avatar, avatarUrl: profile.avatar_url })
    return profile
  }, [])

  React.useEffect(() => {
    let cancelled = false
    setFailure(null)
    ;(async () => {
      const client = await window.__gamestage
      const started = await client.start({ identity: () => window.GAMESTAGE_TOKEN })
      if (cancelled) return
      game.current = started
      setPresentation(started.presentation ?? {})
      setDeployedName(started.deployedName)
      started.onPresentationChanged?.((next: Presentation) => setPresentation(next ?? {}))
      started.onRoundChanged?.((announced: Round) => {
        void loadState(announced).catch(() => setNotice(null))
      })
      const [rounds] = await Promise.all([
        started.client.getRounds().catch(() => ({ rounds: [] })),
        loadMe().catch(() => null),
      ])
      if (cancelled) return
      setPool(rounds.rounds ?? [])
      await loadState(started.round)
      started.track('round_opened', { round: started.round.number ?? null })
      // How to play waits for Play on the intro screen, so it never opens
      // behind it. GS-564.
      const intro = (window as Window & { gamestageStart?: Promise<void> }).gamestageStart
      await intro
      // The tap that pressed Play must not also land on the card under it once
      // the intro screen fades. Only when there was an intro screen to press.
      if (!intro) {
        if (!readLocal(SEEN_KEY)) setPlace('how')
        return
      }
      startedAt.current = performance.now()
      const swallow = (event: MouseEvent) => {
        if (event.isTrusted && performance.now() - startedAt.current < 450) {
          event.stopPropagation()
          event.preventDefault()
        }
        window.removeEventListener('click', swallow, true)
      }
      window.addEventListener('click', swallow, true)
      window.setTimeout(() => window.removeEventListener('click', swallow, true), 450)
      if (!readLocal(SEEN_KEY)) setPlace('how')
    })().catch((error: Error) => !cancelled && setFailure(error.message))
    return () => {
      cancelled = true
    }
  }, [loadAsk, loadMe, loadState])

  // Studio's palette onto Gamestage UI's tokens, through the client's bridge.
  React.useEffect(() => {
    void window.__gamestage.then((client: any) =>
      client.applyPresentation?.(presentation, { root: document.documentElement }, { displayName: deployedName }),
    )
  }, [presentation, deployedName])

  // The connection going and coming back. The Engine holds the play, so on
  // return the round is re-read rather than trusting what is on the screen.
  React.useEffect(() => {
    const down = () => setOffline(true)
    const up = () => {
      setOffline(false)
      const r = game.current?.round
      if (r) void loadState(r).catch(() => undefined)
    }
    window.addEventListener('offline', down)
    window.addEventListener('online', up)
    return () => {
      window.removeEventListener('offline', down)
      window.removeEventListener('online', up)
    }
  }, [loadState])

  React.useEffect(() => {
    // Only while the board is on screen and the round is open: a tick re-renders
    // the page, and every other screen (the leaderboard's podium above all) has
    // nothing to redraw twice a second. GS-584.
    if (!round?.timer_seconds || place !== 'play' || state?.finished) return
    const tick = () => setClock(game.current?.now?.() ?? Date.now())
    tick()
    const timer = window.setInterval(tick, 500)
    return () => window.clearInterval(timer)
  }, [round?.id, round?.timer_seconds, place, state?.finished])

  // When the fan's clock runs out, read their state again: the Engine now
  // names the four, which the end card shows. GS-584.
  const [timedOutRead, setTimedOutRead] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!round || !state || state.finished || timedOutRead === round.id) return
    const up = expired || (round.timer_seconds && state.started_at && clock >= Date.parse(state.started_at) + round.timer_seconds * 1000)
    if (!up) return
    setTimedOutRead(round.id)
    void game.current?.client.getRoundState(round.id).then((fresh: RoundState) => setState(fresh)).catch(() => undefined)
  }, [clock, expired, round, state, timedOutRead])

  const board = round?.challenge.board ?? []
  const names = ((round?.challenge as { names?: Record<string, { given?: string; family?: string }> } | undefined)?.names ?? {})
  const wanted = typeof round?.challenge.pick === 'number' ? round.challenge.pick : 4
  const solved = state?.progress?.solved ?? []
  const deadline =
    round?.timer_seconds && state?.started_at ? Date.parse(state.started_at) + round.timer_seconds * 1000 : undefined
  const secondsLeft = deadline !== undefined && clock ? Math.max(0, Math.ceil((deadline - clock) / 1000)) : undefined
  const timeUp = !state?.finished && (expired || secondsLeft === 0)
  const finished = Boolean(state?.finished) || timeUp
  const won = state?.outcome === 'won'
  const attemptsAllowed = state?.attempts_allowed ?? 10
  const mistakesAllowed = state?.mistakes_allowed ?? 4
  // A fan may select only as many as are still to find, so a lock-in can never
  // be a guaranteed mistake. Ported from the taster's HuntBoard.
  const remaining = Math.max(0, wanted - solved.length)

  // The intro screen shows Play, Continue when a round is part played, or its
  // error state. Called once the board is drawn and the fonts are in. GS-564.
  React.useEffect(() => {
    const ready = (window as Window & { gamestageReady?: (o?: { failed?: boolean; resume?: boolean }) => void }).gamestageReady
    if (failure) ready?.({ failed: true })
    else if (round && state) {
      const resume = !state.finished && state.attempts_used > 0
      void document.fonts.ready.then(() => ready?.({ resume }))
    }
  }, [round, state, failure])

  async function lockIn() {
    if (!round || chosen.length === 0 || !game.current) return
    const picks = [...chosen]
    const intent = `${round.id}:${round.version}:${state?.attempts_used}:${picks.sort().join('|')}`
    if (pending.current?.intent !== intent) pending.current = { intent, key: crypto.randomUUID() }
    setSending(true)
    try {
      const played = await game.current.client.play(round.id, { picks, roundVersion: round.version }, pending.current.key)
      if (played.outcome === 'stale') {
        const fresh = await game.current.client.getRound(round.id)
        await loadState(fresh)
        setNotice(word('label_notice_moved'))
      } else if (played.outcome === 'busy') {
        setNotice(word('label_notice_busy', { seconds: played.retry_after_seconds ?? 1 }))
      } else if (played.outcome === 'rejected') {
        // Say what the Engine said. A generic "didn't go through" is only for a
        // request that never arrived.
        const reason = String(played.reason ?? '')
        if (reason === 'time_expired') {
          setExpired(true)
          setChosen([])
        } else {
          await loadState(round)
          setNotice(
            reason === 'round_closed'
              ? word('label_taster_refused_closed')
              : reason === 'round_finished'
                ? word('label_taster_refused_finished')
                : reason === 'attempts_exhausted'
                  ? word('label_taster_refused_no_tries')
                  : reason === 'mistakes_exhausted'
                    ? word('label_taster_refused_too_many_wrong')
                    : word('label_taster_refused'),
          )
        }
      } else {
        pending.current = null
        const feedback: { key: string; verdict: string }[] = played.feedback ?? []
        const right = feedback.filter((f) => f.verdict === 'correct').length
        const wrongNames = feedback.filter((f) => f.verdict !== 'correct').map((f) => f.key)
        setNotice(
          wrongNames.length === 0
            ? word('label_right', { n: right })
            : right === 0
              ? word('label_wrong', { n: wrongNames.length })
              : word('label_mixed', { right, wrong: wrongNames.length }),
        )
        setMissed((m) => [...new Set([...m, ...wrongNames])])
        setChosen([])
        setResumed(0)
        setNonce((n) => n + 1)
        if (played.round_state) setState(played.round_state)
        game.current.track('picks_marked', { correct: right, submitted: picks.length })
        if (played.round_state?.finished) void loadMe().catch(() => undefined)
      }
    } catch (error) {
      const status = (error as { status?: number })?.status
      setNotice(status ? word('label_notice_failed') : word('label_notice_network'))
    } finally {
      setSending(false)
    }
  }

  // Whether a round is left for this fan, asked as soon as a round finishes, so
  // the end card knows before it is drawn whether its button says Play next or
  // Come back tomorrow.
  const [nextRound, setNextRound] = React.useState<'ready' | 'exhausted' | null>(null)
  React.useEffect(() => {
    if (!finished || !game.current) return
    let live = true
    setNextRound(null)
    game.current.client
      .getNextRound()
      .then((n: any) => live && setNextRound(n.status === 'ready' ? 'ready' : 'exhausted'))
      .catch(() => live && setNextRound('ready'))
    return () => {
      live = false
    }
  }, [finished, round?.id])

  async function playAnother() {
    try {
      const next = await game.current.client.getNextRound()
      if (next.status !== 'ready') {
        setNextRound('exhausted')
        return
      }
      await loadState(next.round)
      game.current.track('round_opened', { round: next.round.number ?? null })
    } catch {
      setNotice(word('label_notice_failed'))
    }
  }

  async function share() {
    if (!round || !state) return
    const squares = [
      ...Array.from({ length: solved.length }, () => '⬛'),
      ...Array.from({ length: Math.max(0, wanted - solved.length) }, () => '⬜'),
    ]
    const url = window.location.href.split('#')[0]
    const text = [
      word('label_share_heading', { name: title, round: round.number ?? '' }),
      squares.join(''),
      word('label_points', { points: state.score ?? 0 }),
    ].join('\n')
    try {
      if (navigator.share) await navigator.share({ text, url })
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        setNotice(word('label_share_copied'))
      }
      game.current.track('score_shared', { round: round.number ?? null })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNotice(word('label_share_failed'))
    }
  }

  function closeHow() {
    const first = !readLocal(SEEN_KEY)
    writeLocal(SEEN_KEY, '1')
    setPlace('play')
    if (first) setYouOpen(true)
  }

  // --- Name and picture ----------------------------------------------------
  const [youOpen, setYouOpen] = React.useState(false)
  const [options, setOptions] = React.useState<{ adjectives: string[]; animals: string[]; avatars: { id: string; url: string }[] } | null>(null)
  const [draft, setDraft] = React.useState<{ adjective: string; animal: string; avatar?: string } | null>(null)

  React.useEffect(() => {
    if (!youOpen || !game.current) return
    let live = true
    ;(async () => {
      const offered = options ?? (await game.current.client.getIdentityOptions())
      if (!live) return
      setOptions(offered)
      const [first, second] = String(me.name ?? '').split(' ')
      setDraft({
        adjective: offered.adjectives.includes(first) ? first : pickOne(offered.adjectives),
        animal: offered.animals.includes(second) ? second : pickOne(offered.animals),
        avatar: offered.avatars.some((a: { id: string }) => a.id === me.avatar) ? me.avatar : pickOne(offered.avatars as { id: string }[]).id,
      })
    })().catch(() => {
      if (!live) return
      setYouOpen(false)
      setNotice(word('label_you_load_failed'))
    })
    return () => {
      live = false
    }
    // Opening is the trigger; the names are read once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youOpen])

  async function saveYou() {
    if (!draft) return
    try {
      const profile = await game.current.client.setIdentity({
        name: { adjective: draft.adjective, animal: draft.animal },
        ...(draft.avatar ? { avatar: draft.avatar } : {}),
      })
      setMe({ id: profile.player_id, name: profile.display_name, avatar: profile.avatar, avatarUrl: profile.avatar_url })
      setNotice(word('label_you_saved', { name: profile.display_name }))
      setYouOpen(false)
      setBoardAsk((n) => n + 1)
    } catch {
      setNotice(word('label_you_failed'))
    }
  }

  // --- Leaderboard ---------------------------------------------------------
  const [boardAsk, setBoardAsk] = React.useState(0)
  const [ranking, setRanking] = React.useState<{ entries: any[] } | 'failed' | null>(null)
  const [boardScope, setBoardScope] = React.useState<'edition' | 'round'>('edition')
  React.useEffect(() => {
    if (place !== 'leaderboard' || !game.current) return
    let live = true
    setRanking(null)
    const client = game.current.client
    const read = boardScope === 'edition' && client.getEditionLeaderboard ? client.getEditionLeaderboard() : client.getLeaderboard()
    read
      .then((b: any) => {
        if (!live) return
        const entries = b.entries ?? []
        const mine = b.me && !entries.some((e: any) => e.player_id === b.me.player_id) ? [b.me] : []
        setRanking({ entries: [...entries, ...mine] })
      })
      .catch(() => live && setRanking('failed'))
    return () => {
      live = false
    }
  }, [place, boardAsk, boardScope])

  // --- Profile -------------------------------------------------------------
  const [profileAsk, setProfileAsk] = React.useState(0)
  const [profile, setProfile] = React.useState<any | 'failed' | null>(null)
  const [recovery, setRecovery] = React.useState<{ has_code: boolean } | null>(null)
  const [code, setCode] = React.useState<string | null>(null)
  const [restoreText, setRestoreText] = React.useState('')
  React.useEffect(() => {
    if (place !== 'profile' || !game.current) return
    let live = true
    setProfile(null)
    Promise.all([loadMe(), game.current.client.getRecoveryStatus?.().catch(() => null)])
      .then(([p, r]) => {
        if (!live) return
        setProfile(p)
        setRecovery(r)
      })
      .catch(() => live && setProfile('failed'))
    return () => {
      live = false
    }
  }, [place, profileAsk, loadMe])

  async function issueCode() {
    try {
      const issued = await game.current.client.issueRecoveryCode()
      setCode(issued.code)
      setRecovery({ has_code: true })
    } catch {
      setNotice(word('label_notice_failed'))
    }
  }
  async function restore() {
    try {
      await game.current.client.restoreFromRecoveryCode(restoreText.trim())
      const p = await loadMe()
      setRestoreText('')
      setNotice(word('label_restore_done', { name: p.display_name ?? '' }))
      setProfileAsk((n) => n + 1)
      setLoadAsk((n) => n + 1)
    } catch {
      setNotice(word('label_restore_failed'))
    }
  }

  // --- The board -------------------------------------------------------------
  // Found names stay found and a missed name is set aside, each carrying one
  // short line under the name. New selections stop at what is left to find.
  const boardOptions = board.map((name) => {
    const isFound = solved.includes(name)
    const isMissed = missed.includes(name)
    const full = chosen.length >= remaining && !chosen.includes(name)
    // A person's name on two lines, given above family: from the producer's
    // own given and family names when the round carries them, otherwise the
    // library splits the label at its first space.
    const named = names[name]
    return {
      id: name,
      label: name,
      kind: 'person' as const,
      ...(named?.given ? { given: named.given } : {}),
      ...(named?.family ? { family: named.family } : {}),
      disabled: isFound || isMissed || full,
      detail: isFound ? word('label_detail_found') : isMissed ? word('label_detail_wrong') : '',
      // A marker the stylesheet reads, so a found card can wear the accent
      // and a missed one step back, while both stay disabled controls.
      ...(isFound || isMissed
        ? { media: <span className="ringers-mark" data-mark={isFound ? 'found' : 'missed'} aria-hidden="true" /> }
        : {}),
    }
  })
  // --- How to play, as a story -------------------------------------------------
  const howFrames: RevealFrame[] = [
    { id: 'board', title: word('label_how_step_board_title'), body: presentation.howToPlay || '' },
    { id: 'pick', title: word('label_how_step_pick_title'), body: word('label_how_step_pick_body') },
    { id: 'limits', title: word('label_how_step_limits_title'), body: word('label_how_step_limits_body') },
  ].map((step, index) => ({
    id: step.id,
    label: step.title,
    words: step.body.split(/\s+/).length,
    media: (
      <div className="ringers-frame">
        <p className="ringers-frame-count" aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
        <h2 className="ringers-frame-title">{step.title}</h2>
        <p className="ringers-frame-body">{step.body}</p>
      </div>
    ),
  }))
  howFrames.push({
    id: 'play',
    label: word('label_how_step_play_title'),
    words: 4,
    media: (
      <div className="ringers-frame">
        <h2 className="ringers-frame-title">{word('label_how_step_play_title')}</h2>
        <p className="ringers-frame-body">{word('label_how_step_play_body')}</p>
        <div className="ringers-frame-actions">
          <Button variant="primary" size="large" onClick={closeHow}>
            {word('label_how_start')}
          </Button>
        </div>
      </div>
    ),
  })

  // --- Render --------------------------------------------------------------
  if (failure) {
    return (
      <div className="ringers ringers-centre">
        <ErrorState
          cause="network"
          label={word('label_load_failed')}
          actionLabel={word('label_load_failed_action')}
          onAction={() => setLoadAsk((n) => n + 1)}
        />
      </div>
    )
  }

  if (notReady) {
    return (
      <div className="ringers ringers-centre">
        <ErrorState
          cause="empty"
          label={word('label_taster_unavailable')}
          actionLabel={word('label_retry')}
          onAction={() => setLoadAsk((n) => n + 1)}
        />
      </div>
    )
  }

  if (!round || !state) {
    return (
      <div className="ringers ringers-centre" role="status" aria-live="polite">
        <span className="ringers-spinner" aria-hidden="true" />
        <span className="ringers-visually-hidden">{word('label_loading')}</span>
      </div>
    )
  }

  const roundIndex = new Set([...playedIds.filter((id) => pool.some((r) => r.id === id)), round.id]).size
  const roundTotal = Math.max(pool.length, roundIndex)

  // The four the round wants, as slots that say what they stand for: a found
  // name in ink with the accent tick, a name still to find as a figure. Once
  // the round is over the Engine names the four, so a missed name is shown
  // too, greyed, and a fan learns the answer. GS-584.
  const answer = state?.progress?.answer ?? []
  const slots = Array.from({ length: wanted }, (_, i) => {
    const name = solved[i]
    if (name) return { name, kind: 'found' as const }
    const missedName = answer.filter((a) => !solved.includes(a))[i - solved.length]
    return missedName ? { name: missedName, kind: 'missed' as const } : { name: '', kind: 'open' as const }
  })
  const found = (
    <div className="ringers-slots" role="list" aria-label={word('label_found_aria', { n: solved.length, max: wanted })}>
      {slots.map((slot, i) => (
        <div key={i} className="ringers-slot" data-kind={slot.kind} role="listitem">
          <span className="ringers-slot-mark" aria-hidden="true">
            {slot.kind === 'found' ? '✓' : slot.kind === 'missed' ? '✕' : <PersonGlyph />}
          </span>
          <span className="ringers-slot-name">
            {slot.name || <span className="ringers-visually-hidden">{word('label_found')}</span>}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <GameFeelProvider muted={!sound} hapticsOff={!sound}>
      <div className="ringers">
        <header className="ringers-top">
          <h1 className="ringers-title" data-gamestage-title>{title}</h1>
          {pool.length && place === 'play' ? (
            <p className="ringers-round" aria-label={word('label_round_aria', { n: roundIndex, max: roundTotal })}>
              {word('label_round_of', { n: roundIndex, max: roundTotal })}
            </p>
          ) : null}
        </header>

        {offline ? (
          <p className="ringers-offline" role="status">
            {word('label_offline')}
          </p>
        ) : null}

        <main className="ringers-main">
          {place === 'leaderboard' ? (
            <section className="ringers-panel">
              <h2 className="ringers-visually-hidden">{word('label_board_title')}</h2>
              <Nav
                className="ringers-board-tabs"
                presentation="tabs"
                label={word('label_board_title')}
                onNavigate={(id) => setBoardScope(id as 'edition' | 'round')}
                destinations={[
                  { id: 'edition', label: word('label_board_tab_total'), active: boardScope === 'edition' },
                  { id: 'round', label: word('label_board_tab_round'), active: boardScope === 'round' },
                ]}
              />
              {ranking === null ? (
                <span className="ringers-spinner" aria-hidden="true" />
              ) : ranking === 'failed' ? (
                <ErrorState
                  cause="network"
                  label={word('label_board_failed')}
                  actionLabel={word('label_retry')}
                  onAction={() => setBoardAsk((n) => n + 1)}
                />
              ) : ranking.entries.length === 0 ? (
                <EmptyState
                  label={word('label_board_empty')}
                  actionLabel={word('label_board_empty_action')}
                  onAction={() => setPlace('play')}
                />
              ) : (
                <Standings entries={ranking.entries} me={me.id} scoreLabel={word('label_board_score')} zeroLabel={(n) => word('label_board_zero_rows', { n })} />
              )}
            </section>
          ) : place === 'profile' ? (
            <section className="ringers-panel">
              <h2 className="ringers-visually-hidden">{word('label_profile_title')}</h2>
              {profile === null ? (
                <span className="ringers-spinner" aria-hidden="true" />
              ) : profile === 'failed' ? (
                <ErrorState
                  cause="network"
                  label={word('label_profile_failed')}
                  actionLabel={word('label_retry')}
                  onAction={() => setProfileAsk((n) => n + 1)}
                />
              ) : (
                <>
                  <div className="ringers-me">
                    <Identity player={{ id: profile.player_id, displayName: me.name, avatarUrl: me.avatarUrl }} size="large" you />
                    <Button variant="secondary" size="small" onClick={() => setYouOpen(true)}>
                      {word('label_profile_change')}
                    </Button>
                  </div>
                  <dl className="ringers-stats">
                    <div><dt>{word('label_profile_played')}</dt><dd>{profile.played ?? 0}</dd></div>
                    <div><dt>{word('label_profile_won')}</dt><dd>{profile.won ?? 0}</dd></div>
                    <div><dt>{word('label_profile_best')}</dt><dd>{profile.best_score ?? 0}</dd></div>
                    <div><dt>{word('label_profile_max_streak')}</dt><dd>{profile.max_streak ?? 0}</dd></div>
                  </dl>
                  {/* A streak shows from two in a row. At nought the badge read
                      "x0" in a box, which looked like an empty field. GS-590. */}
                  {(profile.current_streak ?? 0) >= 2 ? (
                    <Streak value={profile.current_streak ?? 0} label={word('label_profile_streak')} />
                  ) : null}
                  <Toggle
                    label={word('label_sound')}
                    checked={sound}
                    onChange={(on) => {
                      setSound(on)
                      writeLocal(SOUND_KEY, on ? 'on' : 'off')
                    }}
                  />
                  {/* Where the client puts Privacy settings and the copyright
                      link: in the flow of Profile, never over a control. */}
                  <div className="ringers-privacy" data-gs-slot="privacy-settings" />
                  <div className="ringers-card">
                    <h3>{word('label_keep_title')}</h3>
                    <p>{word('label_keep_body')}</p>
                    {code ? (
                      <>
                        <p className="ringers-code">{code}</p>
                        <Button
                          variant="secondary"
                          onClick={() => void navigator.clipboard.writeText(code).then(() => setNotice(word('label_keep_copied')))}
                        >
                          {word('label_keep_copy')}
                        </Button>
                      </>
                    ) : (
                      <>
                        {recovery?.has_code ? <p className="ringers-note">{word('label_keep_replace_warning')}</p> : null}
                        <Button variant="secondary" onClick={() => void issueCode()}>
                          {recovery?.has_code ? word('label_keep_replace') : word('label_keep_issue')}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="ringers-card">
                    <h3>{word('label_restore_title')}</h3>
                    <p>{word('label_restore_body')}</p>
                    <label className="ringers-field">
                      <span>{word('label_restore_field')}</span>
                      <input
                        value={restoreText}
                        onChange={(e) => setRestoreText(e.target.value)}
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </label>
                    <Button variant="secondary" disabled={!restoreText.trim()} onClick={() => void restore()}>
                      {word('label_restore_submit')}
                    </Button>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="ringers-play">
              <div className="ringers-prompt-card">
                <p className="ringers-prompt">{round.challenge.prompt || presentation.strapline}</p>
              </div>

              {finished ? (
                <div className="ringers-result" data-won={won ? 'true' : 'false'}>
                  <h2 className="ringers-heading">
                    {timeUp ? word('label_taster_time_up_label') : word(won ? 'label_won_heading' : 'label_lost_heading')}
                  </h2>
                  <p>{word('label_found_count', { n: solved.length, max: wanted })}</p>
                  <p className="ringers-points">{word('label_points', { points: state.score ?? 0 })}</p>
                  {found}
                  <div className="ringers-end-actions">
                    {nextRound === 'exhausted' ? (
                      <Button variant="primary" size="large" disabled aria-disabled="true">
                        {word('label_come_back')}
                      </Button>
                    ) : (
                      <Button variant="primary" size="large" disabled={nextRound === null} onClick={() => void playAnother()}>
                        {presentation.playAgainLabel || ''}
                      </Button>
                    )}
                    <Button variant="secondary" size="large" onClick={() => void share()}>
                      {presentation.shareButtonLabel || ''}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {resumed > 0 ? (
                    <p className="ringers-resume" role="status">
                      {word('label_resumed', { used: resumed, max: attemptsAllowed })}
                    </p>
                  ) : null}
                  <div className="ringers-meta">
                    {found}
                    <p className="ringers-counts">
                      <span>{word('label_tries', { n: state.attempts_used, max: attemptsAllowed })}</span>
                      <span>{word('label_mistakes', { n: state.mistakes_used, max: mistakesAllowed })}</span>
                      {secondsLeft !== undefined ? (
                        <span className="ringers-clock" data-low={secondsLeft <= 30 ? 'true' : undefined}>
                          {word('label_taster_time_left_label')}{' '}
                          <b>{`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}</b>
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Choice
                    key={`${round.id}:${nonce}`}
                    label={word('label_pick_prompt')}
                    presentation="cards"
                    multiple
                    labelFit="wrap"
                    nameFormat="full"
                    maxLines={2}
                    minLines={2}
                    options={boardOptions}
                    closed={sending}
                    onSelected={(id: string) => {
                      setResumed(0)
                      setChosen((now) => (now.includes(id) ? now.filter((n) => n !== id) : [...now, id]))
                    }}
                    commit={(control) => (
                      <Button {...control} size="large" disabled={chosen.length === 0 || sending} onClick={() => void lockIn()}>
                        {presentation.playButtonLabel || ''}
                      </Button>
                    )}
                  />
                  <p className="ringers-picked" aria-live="polite">
                    {word('label_picked', { n: chosen.length, max: remaining })}
                  </p>
                </>
              )}
            </section>
          )}
        </main>

        <Nav
          className="ringers-nav"
          presentation="floating"
          placement="bottom"
          label={word('label_nav')}
          onNavigate={(id) => setPlace(id as Place)}
          destinations={[
            { id: 'play', label: word('label_tab_play'), icon: <PlayGlyph filled={place === 'play'} />, active: place === 'play' },
            { id: 'leaderboard', label: word('label_tab_leaderboard'), icon: <TrophyGlyph filled={place === 'leaderboard'} />, active: place === 'leaderboard' },
            { id: 'profile', label: word('label_tab_profile'), icon: <PersonGlyph filled={place === 'profile'} />, active: place === 'profile' },
            { id: 'how', label: word('label_tab_how_to_play'), icon: <QuestionGlyph filled={place === 'how'} />, active: place === 'how' },
          ]}
        />

        {place === 'how' ? (
          <Stories
            frames={howFrames}
            title={word('label_how_title')}
            closeLabel={word('label_how_close')}
            previousLabel={word('label_how_back')}
            nextLabel={word('label_how_next')}
            onClose={closeHow}
          />
        ) : null}

        <Sheet
          className="ringers-you-sheet"
          open={youOpen}
          onDismiss={() => setYouOpen(false)}
          label={word('label_you_title')}
          title={word('label_you_title')}
          description={word('label_you_body')}
          primaryAction={{ label: word('label_you_save'), onClick: () => void saveYou() }}
          secondaryAction={{
            label: me.name ? word('label_you_keep', { name: me.name }) : word('label_how_close'),
            onClick: () => setYouOpen(false),
          }}
        >
          {options && draft ? (
            <div className="ringers-you">
              <div className="ringers-you-preview">
                <img src={options.avatars.find((a) => a.id === draft.avatar)?.url} alt="" />
                <strong>{`${draft.adjective} ${draft.animal}`}</strong>
              </div>
              <div className="ringers-you-names">
                <label className="ringers-field">
                  <span>{word('label_you_first')}</span>
                  <select value={draft.adjective} onChange={(e) => setDraft({ ...draft, adjective: e.target.value })}>
                    {options.adjectives.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
                <label className="ringers-field">
                  <span>{word('label_you_second')}</span>
                  <select value={draft.animal} onChange={(e) => setDraft({ ...draft, animal: e.target.value })}>
                    {options.animals.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => setDraft({ ...draft, adjective: pickOne(options.adjectives), animal: pickOne(options.animals) })}
              >
                {word('label_you_shuffle')}
              </Button>
              <p className="ringers-field-label">{word('label_you_picture')}</p>
              <div className="ringers-avatars" role="radiogroup" aria-label={word('label_you_picture')}>
                {options.avatars.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.avatar === a.id}
                    className="ringers-avatar"
                    onClick={() => setDraft({ ...draft, avatar: a.id })}
                  >
                    <img src={a.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="ringers-spinner" aria-hidden="true" />
          )}
        </Sheet>

        {/* The toast sits at the top of its nearest positioned ancestor, as
            Gamestage UI places it; this layer is that ancestor, under the
            header, so a toast never covers the name or the round count. */}
        <div className="ringers-toast-layer">
          <Toast open={Boolean(notice)} onDismiss={() => setNotice(null)}>
            {notice}
          </Toast>
        </div>
      </div>
    </GameFeelProvider>
  )
}
