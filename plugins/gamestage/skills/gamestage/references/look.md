# Look and assets

Part of the Gamestage skill, pack version 2026-10-20-1. Read it before you build or restyle the interface, or draw any asset.

## Ask how the game should look, when you are building its interface

**Building from nothing, ask once**, in the same breath as the format and
subject if you can, and show them the options below.

**In a migration, keep their interface, and offer once at the end.** Their game
already has a look, and restyling it is not what they asked for, so never change
it unasked. Once the migrated game passes `verify`, say in one line that
Gamestage UI is there if they want the game to feel more like a mobile game,
with the gallery link, and leave it with them. Offer it once, not on every
reply.

| Option | Use it for | Start with |
| --- | --- | --- |
| Their own | a look they already have, or a brand kit you have been given | nothing to install |
| Gamestage UI | the game itself: scores, timers, answer buttons, rewards, leaderboards, built to feel like a mobile game rather than a form | `npx gamestage-ui init`, then `npx gamestage-ui add choice` |
| shadcn/ui | functional screens: forms, settings, sign-in, tables, anything that is an app around the game rather than the game | `npx shadcn@latest init` |
| Plain HTML and CSS | the smallest thing that plays, and what `gamestage create` scaffolds | nothing to install |
| Phaser | real-time action on a canvas: arcade, platform, physics, anything with a game loop and sprites | `npm install phaser` |
| PixiJS | fast 2D drawing when the game runs its own loop and wants no game framework | `npm install pixi.js` |
| Three.js | a game in 3D | `npm install three` |

Recommend by what the screen is for. The board a fan plays on wants to feel
like a game, so Gamestage UI is the default for it; the account and settings
screens around it can use shadcn/ui. Mixing is fine and is the sound default
for anything larger than one screen. Gamestage UI is React and installs as
source into the project, so a plain HTML game that wants it becomes a small
React app; say so before choosing it for one. The gallery is
https://ui.gamestage.ai/.

**A canvas game is two layers, and they want different tools.** Draw the play
in Phaser, PixiJS or Three.js, and build everything around it (intro, How to
play, the score, the result, the leaderboard) in Gamestage UI or HTML, over or
beside the canvas. Text drawn inside a canvas cannot be read by a screen
reader, cannot be changed by a producer in Studio, and blurs on a phone, so
keep words out of it. Recommend Phaser for an arcade game unless the developer
already uses something else. Phaser and Three.js are large: install only what
the game draws, and check `verify`'s weight report.

### Use a client's own theme

**Offer it when the client has a brand in Figma or a design system of their
own, and the game uses Gamestage UI.** A theme is the client's colours, type,
corners and fonts as Gamestage UI token values, kept privately for their org
and pinned by each game to one exact version, so changing the theme restyles no
live game until that game moves to the new version. Their people make it, with
you, and Monterosa never sees their Figma.

1. `gamestage theme init <name>` writes a package: `theme.json` (name, version,
   fonts), `tokens.json` (every role the library has, with today's value and
   what it styles) and an empty `overrides.css`.
2. Fill `tokens.json` from the client's Figma through their own Figma
   connection: read the file's variables and text styles, then set each role
   from the variable that plays that part in the designs, not the one with the
   nearest name. A primary button's fill is the colour on the designs' main
   call to action; the text on a card is the card's own ink. Leave a role at its
   value when the designs say nothing about it.
3. `gamestage theme preview` shows the main components wearing the theme, and
   rebuilds as you edit. Put it side by side with the Figma frames and fix what
   differs before going further.
4. `gamestage theme check` runs the library's own checks. An **error** blocks
   publishing: text or icons below the contrast they need on their surface, a
   key the library does not have, a type size off the scale. Fix the value, not
   the check. A **warning** does not block: each rule in `overrides.css` is
   one, naming the role that would replace it.
5. `gamestage theme publish` stores `name@version`. It refuses a theme that
   fails an accessibility check, and there is no way round that.
6. In each game: `gamestage theme use name@version`, then set
   `data-gs-theme="<name>"` on `<html>`, and `gamestage verify`.

**Fonts are the client's, from the client's host.** List each font in
`theme.json` with the address it is served from on the client's own domain.
Not a font service such as Google Fonts or Adobe Fonts: those see every fan's
address before any consent banner can ask, so `publish` refuses them and the
client must host the file themselves. Gamestage never hosts a client's font. `publish` asks the
person to declare that the client may use each font in web games; ask the
client, never answer for them, and pass `--declare-fonts` only once they have
said yes. A font that is not on the web yet must be put there by the client
first; until then, use the library's own Inter.

To change a theme, raise the version in `theme.json`, publish again, and move
each game with `gamestage theme use name@<new version>`. A published version
never changes.

Whichever they choose, the rules that make it a Gamestage game do not change:
the page holds no answers, the Engine decides every result, and every word a
fan reads can be changed by a producer.

## Make every play feel like something happened

**A tap the game does not answer feels broken, even when it worked.** A fan
cannot see the Engine; they see the screen. So every act gets an answer they
can see straight away, the same act gets the same answer every time, and a
settled outcome gets a moment of its own. Build this in from the first round,
not as polish at the end: a flat game reads as a cheap one.

**Answer every tap within 100ms, before the Engine replies.** Press the control
down on pointerdown and show the pick as chosen at once, then wait for the
Engine. Never hold the press until the network answers: the fan reads a late
response as a missed tap and taps again.

**Give a settled outcome its own moment, in one place.** With Gamestage UI
that is `feedback`, which you install with `npx gamestage-ui add feedback`:

```tsx
<Feedback variant="correct" delta={100} onDismiss={next} />
<Feedback variant="wrong" message={reason} onDismiss={next} />
<Feedback variant="score" delta={50} />
<Feedback variant="reward" label={rewardName} onDismiss={close} />
```

Render it the moment the Engine settles the play, from the Engine's answer
and never from the page's guess, in one slot in the stage's overlay, one at a
time. A right answer pops, a wrong one shakes, points float up beside the
score they changed, and a reward slams in and stays until tapped. Every word
it shows comes from Studio like every other word. Without Gamestage UI, build
the same four moments yourself and keep them as consistent as these.

**Wrap the game in `GameFeelProvider` so the cues play.** `choice`, `button`,
`score`, `streak`, `timer` and `feedback` already ask for their own sound and
haptic cues; nothing plays them until the host installs the runtime:

```sh
npx gamestage-ui add cues sounds
```

```tsx
import { createDefaultSoundAdapter } from './components/gamestage/sound-set'

const cueSounds = createDefaultSoundAdapter()

<GameFeelProvider sound={cueSounds} muted={soundOff} juice="standard">
  <Game />
</GameFeelProvider>
```

`sounds` copies Gamestage UI's own set into `public/gamestage/sfx/`: one sound
per cue, about 150 KB in all, each fetched the first time it plays. Five cues
have three takes (`correct`, `countdown`, `rankUp`, `reward`, `xp`); a game
keeps the first, picks another with `createDefaultSoundAdapter({ pick: {
rankUp: 2 } })`, or rotates them with `{ vary: true }` so a sound heard every
round does not repeat itself exactly. To use the game's own sounds, replace a
file with one of the same name.

`juice` is `none`, `reduced`, `standard` or `maximum`. A lower level trims the
celebration first and never the confirmation of what the fan just did. Give
the fan a sound switch and pass it as `muted`, and never start a sound before
the fan's first tap.

**Without `sounds`, the cues are silent.** The provider plays nothing it has no
file for, so a game that installs only `cues` moves and vibrates but makes no
sound. Vibration works where the browser allows it, which an iPhone does not,
so on an iPhone sound is the only thing a fan feels. A game without Gamestage
UI can still take sounds from the Sound effects group in
[Third-party tools and assets](https://gamestage.ai/docs/third-party), each
with its licence and any credit it needs.

**Every outcome reads without motion or sound.** A fan with reduced motion, the
sound off or colour blindness must still tell right from wrong. `feedback`
changes the word, the mark and the colour as well as the movement, and keeps
the word and the mark under reduced motion. Do the same in anything you build
yourself: honour `prefers-reduced-motion`, and never carry a result on colour
or sound alone.

## Before you draw an asset, check the third-party registry

**When the game needs a sprite, an icon, a sound, a font or a pitch to plot
data on, check [Third-party tools and assets](https://gamestage.ai/docs/third-party)
before you draw or generate one.** It lists open-source tools and CC0 asset
packs that suit a sports fan game, PitchKit for a football pitch and a set of
Kenney packs for interface art, with what each one is, its licence, its cost,
when to reach for it and when to skip it.

**Prefer a listed CC0 or MIT item over drawing your own**, when it genuinely
fits the game. A Kenney UI pack or a PitchKit pitch is tested, licensed and
free; an asset you generate from nothing costs time and still needs a licence
decided for it. The registry says when to skip an entry too: reach past it
when the game needs a look a generic pack cannot give it, such as a licensed
team's actual kit or a producer's brand identity, and say so rather than
forcing a generic sprite onto a brand that owns a better one.

**State the licence when you add something from the list.** CC0 needs no
attribution; a paid tool such as Asset Forge is paid for the app, not for what
you export with it. Both are safe to ship; say which applies so the developer
is never guessing.
**A game with a bottom nav uses the floating pill.** `<Nav presentation="floating">`
from Gamestage UI: a capsule above the home indicator, the current tab showing
its mark and word and the rest their marks alone, each at least 48px. It
reserves its own height, so nothing scrolls out of reach behind it; raise any
sheet or modal above it (it sits at z-index 50). Every tab's word comes from a
Studio setting and stays the tab's accessible name. Give "Privacy settings" a
home in the page's flow with a `data-gs-slot="privacy-settings"` element, on a
Profile screen or at the foot of one, so the client never floats it under the
pill. The starters `create` scaffolds have one screen and no nav; add the
floating one when a game grows a second.

**Every control a fan taps presses, and never selects text.** On an iPhone a
long press on a button otherwise selects its label and shows text handles, and
a raised button does not move, because Safari applies `:active` only once the
page listens for touches. Give every button, answer card and nav item
`user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`,
`-webkit-tap-highlight-color: transparent` and `touch-action: manipulation`;
press it down on pointerdown and release it on pointerup, pointercancel and
pointerleave; leave a disabled control still. Gamestage UI does all of this, and
every page `gamestage create` scaffolds carries it, so keep it when you restyle.
