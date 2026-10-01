# Building the page

Part of the Gamestage skill, pack version 2026-10-01. Read it while you wire the page to Gamestage: loading, reconnection, returning players and the producer's settings.

## Ask where the game runs, and make it load smoothly and fast

**Ask this with the format, before you scaffold.** Where a game is opened and
how it sits on the screen change how it is built, and they are expensive to
change later. Ask the developer where fans will open it, and show them the
choices:

| Where it runs | `--host` | What they get by default |
| --- | --- | --- |
| Full screen, from a carousel, a Hub or a link | `fullscreen` | a `screen` game that fills the phone |
| A card in an article that opens full screen | `article-launch` | `launch` |
| A box inside an article | `article-embed` | `card` |
| Inside their own native app, in a web view | `app-webview` | a `screen` game that fills the phone |

Then pass it: `gamestage create --name "…" --format hunt --host app-webview`.
Add `--layout` only if they want other than the default.

**Recommend full screen, and say why in plain words:** players come back to a
game they can play properly; a widget in an article reads as throwaway and gets
scrolled past. For an article, recommend `launch` over `card`, and use `card`
only when their host cannot open a game full screen. `create` prints the same
advice, and `docs/layout-and-loading` is the chapter to point them at.

**Build for the layout you chose.** A `screen` game fits 360×640, 390×844 and
landscape without the page scrolling; if a list must scroll, it scrolls inside
the game. `verify` measures this and warns.

**Load smoothly. Do this without being asked:**

1. **The game's colour from the first frame.** In the head, before any script:
   `<meta name="color-scheme">`, `<meta name="theme-color">` with the
   background colour, and a `<style>` painting `html, body` in it. Inside a
   native app this is the difference between the game appearing and a white
   flash first.
2. **A loading state, never text.** A centred spinner, or a bar when progress is
   known, in a box the game's size, so the game replaces it in one step. Never
   "Loading…" on its own. Scaffolds from `create` do both of these already; keep
   them. With Gamestage UI, use `Loading`.
3. **Say when it is playable.** When the round is drawn or has failed, call
   `window.gamestageReady()` (scaffolds define it), or
   `performance.mark("gamestage:playable")` if your page does not have it.

**Every scaffold from `create` opens on an intro screen**: a full-screen
gradient, the game's name in its own font, a progress bar, then a Play button.
You do not build this; call `gamestageReady()` correctly and it appears. Pass
`{ resume: true }` when the fan has a round in progress (button reads
"Continue") and `{ failed: true }` when the game could not load (shows the
error state and a retry button). Wait for `window.gamestageStart` or the
`gamestage:start` event before opening anything that asks the fan something,
such as How to play: the tap on Play is what unlocks sound and starts the
game. Its colours and words are the game's Brand and Wording settings in
Studio (`title_font`, `logo_text`, `splash_gradient_start` and the rest); see
`docs/layout-and-loading` for the full list.

**Load fast.** `verify` loads the game on a mid-range phone over 4G and warns
when it goes over its layout's budget: for a `screen` game, 350 KB of
JavaScript, 150 KB of fonts, 900 KB in all, something on screen within 1.8
seconds and playable within 3.5. Keep fonts to one family in two weights,
install only the Gamestage UI components the game draws, and size images for a
phone. When `verify` warns, fix what it names before you call the game done.

**Never hang a logo on a webfont.** A logo is the first thing a player sees,
and a font server is the thing most likely to be slow or blocked in the
browser a chat app opens. Set the logo in Studio's title and logo settings and
let the intro screen draw it: a deploy writes that font into the page, cut
down to the letters a logo uses, so it paints with the first frame. If your
page draws its own logo, make it one of these, never text in a font fetched
from another origin:

- an inline SVG, when the artwork is fixed;
- text in a font served from the game's own files, subset to the logo's
  characters and preloaded with `<link rel="preload" as="font" crossorigin>`;
- text that shows a close system font after 800ms at most.

A blank space where the logo should be is the one outcome that is always
wrong, worse than a fallback face.

**Set every size on the one type scale: 14, 17, 20, 28 and 40.** A screen
uses at most those five sizes, one typeface for all its text with tabular
figures for numbers, plus the game's own logo face, and two weights, 400 and
600. Gamestage UI's roles already sit on it; in the game's own stylesheet read
`var(--gs-type-scale-step1)` to `var(--gs-type-scale-step5)` rather than a
number, and never a size under 14px. 14 is for labels and chrome; anything a
fan reads as a sentence, a name or a button is 17 or more. Headings are
sentence case ("Pick your name"), not capitals. A game that grew a size for
each screen ends up with sixteen of them and reads as three different games.

**Serve every font from the game's own files, never from Google Fonts or a
CDN.** A `<link>` or `@import` to `fonts.googleapis.com`, Adobe Fonts or a
public CDN loads before the consent banner can ask anything, so it hands that
company the player's IP address with no way to ask first, and a German court
has fined a site for exactly that. Download the `.woff2` files into the game
(Google Fonts are under the SIL Open Font License, which allows it), write
`@font-face` rules that point at them, and remove the remote link. A Google
font is also available ready-made at `https://gamestage.ai/fonts/<family>.css`,
for example `https://gamestage.ai/fonts/bebas-neue.css`. `verify` fails a page
that loads a font from a third party (`fonts-self-hosted`), and `deploy`
refuses it.

**Give the game a strapline so a pasted link looks like the game.** Slack,
WhatsApp and iMessage read the page's Open Graph and Twitter tags without
running any script. `deploy` writes them from `display_name` and `strapline`
in `gamestage.settings.json`, and draws a centred 1200x630 `share-card.png`
from the intro screen's colours. Tags you write yourself are kept, so only
write them if you want something different, and then write the whole set with
absolute `https` image addresses and `twitter:card` set to
`summary_large_image`. Keep anything that matters in the middle 600px of your
own card: Slack often shows a small square cut from the middle. `verify` fails
a game whose published page would lack a tag or carry a relative image
(`share-tags`).

**For a native app, tell the developer what their app team must do**, because
it is in the app rather than the page: set the web view's background to the
game's background colour, and create the web view before the player taps.

## Give anonymous players a way back to their progress

**Any game whose players are anonymous gets recovery, on a Profile screen or
the page's menu.** Without it a fan who clears their browser or changes phone
loses their name, scores, streak and achievements, and nothing can bring them
back.

Two halves, and include both:

- **"Keep your progress"**: `game.client.issueRecoveryCode()` returns a code,
  four words and two digits. Show it once, large, with Copy and Share, and tell
  the fan to keep it private.
- **"I've played before"**: take the saved code in a text field (a word
  keyboard, not a number pad; case and spaces don't matter) and call
  `game.client.restoreFromRecoveryCode(code)`. A refusal throws
  `code_not_recognised`: say plainly that the code isn't recognised.

In a plain page, `mountRecovery(game, element)` from the client draws both as a
dialog in one line. In a Gamestage UI game, `npx gamestage-ui add recovery-code`
draws the same two screens. Every word is a Studio setting; put them in
`gamestage.settings.json`.

Tell the developer the three limits, because each changes what the screen
should say: it is for anonymous players only; restoring does not merge the
progress the device already had; and a code is effectively a password.

## Build the loading state and the reconnection handling

**Not optional.** A game that paints a playable board before it is connected is
a game that lies to a fan, and one that never notices the connection dropping
lies for the rest of the session. Both have happened.

`start()` is asynchronous: it resolves identity, reads the round and connects to
Interaction Cloud. Until it resolves your page knows nothing, so it must not
draw a board that looks ready.

```js
// Before start(): the page shows its loading state and nothing playable.
showLoading();

const game = await start({ identity: () => window.GAMESTAGE_TOKEN });

// After start(): the board is real, so it can be drawn and touched.
render(game.round);
hideLoading();
// Playable now: removes a scaffold's loading shell and marks the moment
// verify times load by.
window.gamestageReady?.();
```

**Then check what you are connected to.** `game.platform` is `monterosa` on a
deployed game and `local` under `gamestage dev`. A deployed page that resolves
to `local` is not connected: it will never receive a producer's change and will
poll on a timer instead. Say so rather than playing on.

```js
// The addresses a game is played from while it is being built.
const developing =
  location.protocol === "file:" ||
  ["localhost", "127.0.0.1", "[::1]", "::1", ""].includes(location.hostname);

if (game.platform === "local" && !developing) {
  showDisconnected();  // your own words; the game is not live
}
```

That case is not hypothetical. Every game deployed before 2026-08-14 was in it:
playing correctly, polling every few seconds, connected to nothing, with no
error anywhere and a page that returned 200 to every check we had.

**Handle the connection coming and going.** The SDK reconnects by itself when
the tab is brought forward or the device comes back online, and it exposes no
event for it, so the browser's own signals are what you have. A fan on a train
loses the connection and gets it back, and the round may have moved while they
were gone.

```js
addEventListener("offline", () => showOffline());
addEventListener("online", async () => {
  showReconnecting();
  // The fan's progress is on the Engine, so re-read it rather than trusting
  // what is on screen, and never start them again. A round that moved while
  // they were away arrives through `onRoundChanged`, which the client re-reads
  // from the Engine for you.
  renderState(await game.client.getRoundState(game.round.id));
  hideReconnecting();
});
```

`verify` drives both of those: it takes the browser's network away and asks
whether the screen changed, then gives it back and asks again. Showing something
on `offline` and never taking it down replaces a silent failure with a permanent
one, and is refused for the same reason.

**Three rules for what you draw:**

- **Never a playable board before `start()` resolves.** A tap on a board that
  is not connected is a tap the Engine never sees.
- **Never a silent failure.** A fan who cannot connect should be told, and a
  disconnected deployed game is a fault rather than a mode.
- **Never lose their progress on a reconnect.** The Engine holds the play; the
  page re-reads it rather than starting the fan again.

## Wire the producer's settings while you wire the client

**No copy is ever hard coded, and that includes labels.** This is a hard rule
and nothing launches without it. Not the round's words, not a button's label,
not a heading, an empty state, an error a fan reads or the name of the game.
Every word a fan sees is a producer's to change, which means it arrives at
runtime and the page renders what it is given.

**The game's words and colours start in Studio, not in the page.** Put the
values a fan sees by default (the game's name, its how-to-play text, its button
labels, its colours) in `gamestage.settings.json` beside `gamestage.yaml`, keyed
by the Studio field keys:

```json
{
  "display_name": "Wages",
  "how_to_play": "Pick one player from each line. Stay under £1,000,000 a week.",
  "play_button_label": "Select Player",
  "primary_colour": "#1D428A",
  "css_variables_backgroundMainColour": "#0B1620"
}
```

A deploy writes each value into the game's Studio project **where that field is
empty**, so a producer opening Studio sees exactly what a fan sees and edits it
there, and their edit is never overwritten by a later deploy. `gamestage create`
writes this file for you from the scaffold's own page. `manifest validate` and
`deploy` refuse a key Studio does not have and name the ones it does.

**Put no copy of any of these in the page.** Not a heading's text, not a
button's word, not a fallback colour inside `var(--gs-…, #hex)`. Leave the
element empty and let `applyPresentation` fill it from `game.presentation`.
Studio is the only home of a game's words and colours:

- **A returning fan** gets the settings their device remembered from the last
  visit at once, while Studio answers behind the page (with the fan's
  "functional" consent).
- **A first visit with Studio unreachable** gets the library's own "Can't load
  the game right now" screen with a Try again button. `start()` then throws
  `GamestageUnavailableError` with `handled: true`: stop your start-up and show
  nothing of your own.
- **`gamestage dev --serve`** feeds `gamestage.settings.json` to the page as
  Studio would, so a local page renders the same words.

A copy in the page is a second home that drifts: a producer edits a word in
Studio and a fan still reads the old one first. `gamestage verify` fails a page
that keeps one (`settings-seeded`), and `gamestage deploy` refuses it before
uploading, naming each setting and the file it is in. A colour counts only as a
literal fallback on the setting's own variable, as in
`var(--gs-highlightMainColour, #fff)`; a variable behind it, as in
`var(--gs-highlightMainColour, var(--gamestage-primary))`, is fine. Until 2026-09-27 a copy was
allowed as a safety net if it equalled the file. Tom removed that the same day.

A customer's first request is always to change the wording. A game that needs an
engineer for that is a game we run rather than one they run.

A producer can change seven things about a game from Monterosa Studio: its name,
a strapline, the how-to-play text, the word on the main button, a primary
colour, and per edition a name and a line. They arrive on the object `start()`
returns, and `applyPresentation` puts them on the elements the page nominates.
Do it in the same edit that wires the Gamestage client, because nothing later
will tell you it is missing. `verify` proves that solution material is gone,
that a client is imported and that an outcome is rendered; a game that ignores
every setting passes all three.

From the reference game:

```js
import { applyPresentation, start } from "./gamestage.js";

const game = await start();

applyPresentation(game.presentation, {
  displayName: el("game-name"),
  strapline: el("strapline"),
  playButtonLabel: el("submit"),
});
```

The other target keys are `howToPlay`, `editionName`, `editionStrapline` and
`root`, which is where `--gamestage-primary` is set and defaults to the document
element. The colour reaches a fan only where the game's CSS reads it:
`background: var(--gamestage-primary, var(--red))` keeps the game's own colour
until a producer chooses one. An element the page draws empty can ship with
`hidden`, and a filled field un-hides it.

**A producer's save reaches an open page.** Studio announces a settings change
over the same connection that carries a round change, so hold the targets in a
variable and apply them again:

```js
game.onPresentationChanged((presentation) => {
  applyPresentation(presentation, presentationTargets);
});
```

Without it a fan with the game open keeps the old words until they reload, which
on a phone left on a game screen is until the round is over. Applying twice is
safe. It never fires under `gamestage dev`, where there is no producer.

**Absence is not emptiness.** Call `applyPresentation` rather than reading
`game.presentation.displayName` yourself and assigning it with `?? ""`. A field
nobody has filled in is missing rather than empty, and a page that treats the two
alike blanks its own heading the first time a producer saves the form without
typing anything.

Under `gamestage dev --serve` there is no producer, so the page is given
`gamestage.settings.json` in Studio's place and shows those words. That is the
correct result and the wire is fine. These settings reach a fan only on a game provisioned into
Interaction Cloud, which is above the Starter plan.
