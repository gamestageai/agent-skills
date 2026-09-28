'use client'

import { useStrings, type StringsOverrides } from './strings'

import * as React from 'react'

// The component brings its own styles. Without this a `gamestage-ui add` installs a
// working but completely unstyled Identity, and `tsc --noEmit` passes on it, so
// the gate cannot catch it.
import './identity.css'

import { IDENTITY_GLYPH, IDENTITY_GLYPHS, type IdentityGlyphName } from './glyphs'

/**
 * Identity: one player, rendered.
 *
 * An avatar, a name, and whatever the host puts beside them. `player-card`,
 * `leaderboard`, `podium`, `versus`, `presence` and `profile` all render a
 * player through this one component, so the avatar cases, the signed-out case
 * and the accessible name are decided once rather than six times.
 *
 * **It renders identity. It never performs authentication.** It makes no
 * network call, reads no cookie, writes no token and talks to no identity
 * provider. The host passes a player or passes null. `data-gs-anonymous` is the
 * host's word that there is no player, never a check this component made, and
 * never a security boundary: a host that hides content behind it has built
 * client-side access control, which this is not.
 *
 * The adapter's `player` is null before sign-in, so signed out is a first-class
 * state with its own rendering and its own test, not a fallback.
 *
 * A player with no picture gets a symbol: specimen 3a hashes the player's id to
 * one of eight hues and one of six glyphs, and says in words "never a face or
 * initial". So the fallback is deterministic, the same player is the same mark
 * on every surface, and nothing about it can be mistaken for a photograph.
 *
 * A player-supplied name is untrusted text. It is rendered as text and never as
 * HTML, and it wraps rather than escaping its row.
 */

/**
 * The shape of `GamestageAdapter.player`, restated here so the component can be
 * installed on its own. A host with a richer player passes the three fields.
 */
export interface IdentityPlayer {
  /** Stable id. Rides `data-gs-player`, so a test can find one row. */
  id: string
  /** What the player calls themselves. Untrusted text. */
  displayName?: string
  /** Where their picture is. The host's URL; this never fetches it itself. */
  avatarUrl?: string
}

export type IdentityPresence = 'online' | 'away' | 'offline'

export type IdentitySize = 'small' | 'default' | 'large'

/** Which of the three avatar cases rendered. See `data-gs-avatar`. */
export type IdentityAvatarCase = 'image' | 'fallback' | 'none'

/** Inline, the default, or the boxed row specimen 3a draws. */
export type IdentityPresentation = 'inline' | 'row'

export type IdentitySide = 'player' | 'opponent'

export interface IdentityProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Per-instance vocabulary, merged over the provider. */
  strings?: StringsOverrides

  /**
   * Who this is. `null` is the signed-out case and renders as one; it is not an
   * error and it is not an empty render.
   */
  player: IdentityPlayer | null
  /** This is the player holding the device. Carries the word "you" in the name. */
  you?: boolean
  /** Whether that player is here now. The host knows; this never asks. */
  presence?: IdentityPresence
  /** Which step of the size scale the avatar and the name render at. */
  size?: IdentitySize
  /**
   * Whether to render an avatar at all. `false` gives `data-gs-avatar="none"`,
   * which is a supported rendering rather than a degraded one: a dense
   * leaderboard row is a legitimate place to want the name alone.
   */
  avatar?: boolean
  /**
   * `row` is the boxed line from specimen 3a: avatar, name, a line of small
   * print with the presence word and the host's detail, ringed in the side's
   * colour and standing on a shelf. The default is the bare inline pair.
   */
  presentation?: IdentityPresentation
  /**
   * Which side of a contest this player is on. Colours the row's ring. `you`
   * implies `player`; an opponent has to be said.
   */
  side?: IdentitySide
  /**
   * The name to show, when the host has a better one than `displayName`. Also
   * the way to localise the two defaults below.
   */
  label?: string
  /**
   * The avatar `<img>`'s `referrerPolicy`. GSUI-155: `player.avatarUrl` is
   * usually a third-party host, and a bare `<img>` sends the page's full URL
   * to it in the `Referer` header on every request, which on a board showing
   * twenty rows is twenty uncontrolled third-party requests carrying it. The
   * default cuts that to nothing. Named here rather than left to `...rest`,
   * because `IdentityProps` extends `HTMLAttributes<HTMLDivElement>`, whose
   * `referrerPolicy` types the root `<div>`, not the avatar image; a prop that
   * only exists on `ImgHTMLAttributes` would not type-check spread onto a div,
   * so it would need forking the component to touch it at all.
   */
  avatarReferrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy']
  /**
   * The avatar `<img>`'s `crossOrigin`. Undefined by default, which is a
   * plain, credential-free image request; set it only when the host's CDN
   * needs CORS, for example to read the image into a canvas.
   */
  avatarCrossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  /**
   * The avatar `<img>`'s `loading`. `lazy` by default, so an avatar below the
   * fold is not fetched, and therefore not sent, until it is about to be seen.
   */
  avatarLoading?: React.ImgHTMLAttributes<HTMLImageElement>['loading']
  /** Anything the host wants beside the name: a stat, a badge, a control. */
  children?: React.ReactNode
}

/**
 * The words that go with the states, fixed by the attribute contract so that
 * identity, player-card, leaderboard, podium, versus, presence and profile
 * cannot ship seven vocabularies for the same three states.
 */

/** Shown when there is no player, and when a player has no name of their own. */

/** Eight hues, so identity.css can name a class per hue. */
export const IDENTITY_HUES = 8

/**
 * FNV-1a over the id. Not for security: for spreading ids evenly over 48
 * symbol-and-hue pairs, and for giving the same id the same pair on every
 * device and every render. `Math.imul` keeps it in 32 bits.
 */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** The symbol and the hue a player id lands on. Exported so a host can match them elsewhere. */
export function symbolFor(id: string): { glyph: IdentityGlyphName; hue: number } {
  const h = hash(id)
  return {
    // The modulo keeps the index inside the array; the assertion says so to
    // a compiler that cannot see it.
    glyph: IDENTITY_GLYPHS[h % IDENTITY_GLYPHS.length]!,
    hue: Math.floor(h / IDENTITY_GLYPHS.length) % IDENTITY_HUES,
  }
}

export function Identity(props: IdentityProps) {
  const { strings, ...componentProps } = props
  const copy = useStrings(strings)
  const STATE_WORD = {
    you: copy['identity.you'],
    anonymous: copy['identity.signedOut'],
  } as const
  const DEFAULT_LABEL = { anonymous: copy['identity.guest'], unnamed: copy['identity.player'] } as const
  const {
    player,
    you = false,
    presence,
    size = 'default',
    avatar = true,
    presentation = 'inline',
    side,
    label,
    avatarReferrerPolicy = 'no-referrer',
    avatarCrossOrigin,
    avatarLoading = 'lazy',
    className,
    children,
    ...rest
  } = componentProps

  // A URL that 404s must not leave a hole where a face was, so a failed image
  // falls back to the symbol. The failed URL is remembered rather than a
  // boolean, so the next player's picture is attempted rather than inheriting
  // the last one's failure.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

  const anonymous = player === null
  const src = player?.avatarUrl
  const hasImage = avatar && src !== undefined && src !== '' && src !== failedSrc

  const name =
    label ??
    player?.displayName?.trim() ??
    (anonymous ? DEFAULT_LABEL.anonymous : DEFAULT_LABEL.unnamed)
  const shown = name === '' ? DEFAULT_LABEL.unnamed : name

  const avatarCase: IdentityAvatarCase = !avatar ? 'none' : hasImage ? 'image' : 'fallback'

  // Signed out has no id to hash, so every guest shares one symbol. That is
  // right: they are not distinct players, and a symbol that changed per render
  // would read as a different person each time.
  const symbol = symbolFor(player?.id ?? '')
  const Glyph = IDENTITY_GLYPH[symbol.glyph]

  const row = presentation === 'row'
  const resolvedSide: IdentitySide | undefined = side ?? (you ? 'player' : undefined)

  // The name carries the state, because a screen reader user gets no dot, no
  // colour and no picture. Order matters: who it is, then what is true about
  // them. `data-gs-avatar="none"` adds nothing, deliberately: the player's name
  // is the name, and "no avatar" is not a fact about the player.
  const words = [shown]
  if (you) words.push(STATE_WORD.you)
  if (anonymous) words.push(STATE_WORD.anonymous)
  if (presence) words.push(copy[`identity.${presence}`])

  // Emphasis, not motion: the dot changes colour and does not move, so its
  // transition survives reduced motion, which is how a player who cannot see
  // motion still sees someone arrive. In the row it is a word with a dot
  // beside it; elsewhere it is the dot alone on the avatar's corner.
  const presenceMark =
    presence === undefined ? null : (
      <span
        className="gs-identity__presence"
        data-gs-scope="identity" data-gs-part="presence"
        data-gs-animates="emphasis"
        aria-hidden="true"
      >
        <i className="gs-identity__presence-dot" />
        {row ? <span className="gs-identity__presence-word">{presence}</span> : null}
      </span>
    )

  const hasDetail = children !== undefined && children !== null
  const detail =
    (row && presence !== undefined) || hasDetail ? (
      // Host content stays announced. It is not part of the group's label, so
      // hiding it would silently drop whatever the host put here.
      <span className="gs-identity__detail" data-gs-scope="identity" data-gs-part="detail">
        {row ? presenceMark : null}
        {hasDetail ? <span className="gs-identity__detail-text">{children}</span> : null}
      </span>
    ) : null

  return (
    <div
      {...rest}
      className={['gs-identity', className].filter(Boolean).join(' ')}
      data-gs-component="identity"
      data-gs-player={player?.id}
      data-gs-anonymous={anonymous ? 'true' : undefined}
      data-gs-you={you ? 'true' : undefined}
      data-gs-presence={presence}
      data-gs-avatar={avatarCase}
      data-gs-size={size}
      data-gs-presentation={row ? 'row' : undefined}
      data-gs-side={resolvedSide}
      role="group"
      aria-label={words.join(', ')}
    >
      {/* The avatar is decorative: the name is beside it and the group's label
          above already says who this is, so announcing the picture as well
          would read the same player twice. Hence both an empty alt and
          aria-hidden, and the same treatment on the name and the dot. */}
      {avatarCase === 'none' ? null : (
        <span
          className={[
            'gs-identity__avatar',
            avatarCase === 'fallback' ? `gs-identity__avatar--hue-${symbol.hue}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-gs-scope="identity" data-gs-part="avatar"
          aria-hidden="true"
        >
          {avatarCase === 'image' ? (
            <img
              className="gs-identity__image"
              src={src}
              alt=""
              referrerPolicy={avatarReferrerPolicy}
              crossOrigin={avatarCrossOrigin}
              loading={avatarLoading}
              onError={() => setFailedSrc(src ?? null)}
            />
          ) : (
            <span className={`gs-identity__symbol gs-identity__symbol--${symbol.glyph}`}>
              <Glyph />
            </span>
          )}
          {row ? null : presenceMark}
        </span>
      )}
      <span className="gs-identity__text">
        {/* React escapes this. A name is the player's own text and never HTML;
            nothing here reaches dangerouslySetInnerHTML, by construction. */}
        <span className="gs-identity__name" data-gs-scope="identity" data-gs-part="label" aria-hidden="true">
          {shown}
        </span>
        {detail}
      </span>
      {/* No avatar to sit on, and not a row: the dot stands after the name. */}
      {!row && avatarCase === 'none' ? presenceMark : null}
    </div>
  )
}
