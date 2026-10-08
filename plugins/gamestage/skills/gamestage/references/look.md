# Look and assets

Part of the Gamestage skill, pack version 2026-10-07-2. Read it before you build or restyle the interface, or draw any asset.

## Ask how the game should look, when you are building its interface

**A migration keeps the creator's interface, so do not raise this there.**
Their game already has a look, and restyling it is not what they asked for.
Ask only when you are building a game from nothing, or when the developer asks
for a new look.

Then ask once, in the same breath as the format and subject if you can, and
show them the options:

| Option | Use it for | Start with |
| --- | --- | --- |
| Their own | a look they already have, or a brand kit you have been given | nothing to install |
| Gamestage UI | the game itself: scores, timers, answer buttons, rewards, leaderboards, built to feel like a mobile game rather than a form | `npx gamestage-ui init`, then `npx gamestage-ui add choice` |
| shadcn/ui | functional screens: forms, settings, sign-in, tables, anything that is an app around the game rather than the game | `npx shadcn@latest init` |
| Plain HTML and CSS | the smallest thing that plays, and what `gamestage create` scaffolds | nothing to install |

Recommend by what the screen is for. The board a fan plays on wants to feel
like a game, so Gamestage UI is the default for it; the account and settings
screens around it can use shadcn/ui. Mixing is fine and is the sound default
for anything larger than one screen. Gamestage UI is React and installs as
source into the project, so a plain HTML game that wants it becomes a small
React app; say so before choosing it for one. The gallery is
https://ui.gamestage.ai/.

Whichever they choose, the rules that make it a Gamestage game do not change:
the page holds no answers, the Engine decides every result, and every word a
fan reads can be changed by a producer.

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
