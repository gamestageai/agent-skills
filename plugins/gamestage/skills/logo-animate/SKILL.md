---
name: logo-animate
version: 1.0.0
description: >
  Make an animated wordmark (title logo) for a game, quiz or feature: a framed, condensed
  title with a tab across the top and an optional badge (basketball, moon) standing in for a
  letter, which draws itself in once over about 1.6 seconds. Outputs one self-contained
  animated SVG with the font built in, a transparent PNG and a preview page. Use when someone
  asks for an "animated logo", "intro logo", "title animation", "splash logo", "wordmark" or
  "game logo" for a Gamestage game.
---

# Animated wordmark

Makes a title logo for a game: a white frame, a short tab across
the top that is read first ("DID YOU"), the main words in condensed capitals ("KNOW?"), and a
badge that replaces a round letter or the dot of a question mark. It animates once when the page
opens, then stays still.

```
 ┌──────[ DID YOU ]──────┐     tab: drops in from above
 │                       │     frame: draws itself around the edge
 │     K N (ball) W ?    │     badge: spins in from small
 │                       │     words: rise into place
 └───────────────────────┘
```

## Quickstart

Write a settings file, then run the script. Paths are relative to this skill's folder.

```json
{ "name": "did-you-know", "tab": "DID YOU", "line": "KN*W?", "badge": "ball" }
```

```bash
node scripts/make-logo.mjs did-you-know.json --out ./out
```

That writes `out/did-you-know.svg`, `out/did-you-know.png` and `out/did-you-know-preview.html`.
Ready-made settings for three styles are in `examples/`: a moon in place of a letter (`quiz-tonight`), a ball in place of a letter (`who-scored`) and a ball as the dot of a question mark (`name-that-player`).

It needs Node and Playwright with Chromium. If the script says Playwright is missing, run
`npm install -g playwright && npx playwright install chromium`.

## Make a logo

1. **Get the words.** Ask for the title if it isn't given, and decide which part goes on the tab.
   The tab is the short lead-in read first ("TRIVIA", "DID YOU", "WHO IS"). The line is the big
   word. Keep the line to one word, two at most. Long lines make a wide, thin logo that is small
   on a phone.
2. **Pick the badge.** Put `*` in the line where a round letter should become the badge
   (`T*NIGHT`, `KN*W?`). With no `*` and a line ending in `?`, the badge replaces the question
   mark's dot (`THIS?`). Use `"badge": "none"` for plain letters. The badge should mean
   something for the subject: a basketball for a basketball game, a moon for "tonight".
3. **Write the settings file** in the project that will use the logo, not in this skill.
4. **Run the script** and open the PNG. Check it the way a designer would: does the tab read
   first, is the padding even, is the badge the same visual size as the letters, is anything
   cramped or clipped? Then open the preview page and press Replay to watch the animation.
5. **Adjust and rerun.** `size` and `tabSize` change the balance between line and tab, and
   `tabSpacing` opens up the tab's letters.
6. **Put it in the game.** See the next section.

## Put it in a Gamestage game

Gamestage's intro screen draws the game's name as text from the Brand settings in Studio. This
logo is for a game that draws its own title, on its start screen or its result screen.

1. Copy the SVG into the game's own files, beside `index.html`. Never load it from another site.
2. Show it as an image: `<img src="who-scored.svg" alt="Who scored?" width="560" height="193">`.
   Give it a width and height from the script's output so the page doesn't jump when it loads.
   It replays every time the image loads, so show it once, not on every screen.
3. Keep the text name in Studio's `logo_text` the same words, so the intro screen and the logo
   agree.
4. Run `gamestage verify`. The SVG is about 23 KB with a 16 KB font inside, well within the font
   budget, and the logo paints with the first frame because nothing is fetched.

Use the PNG where an SVG can't go, such as a social card, a slide or an email.

## Settings

| Field | Type | Required | Default | What it does |
|---|---|---|---|---|
| `name` | string | yes | | File name for the outputs. Lower case and hyphens. |
| `line` | string | yes | | The main words. `*` marks where the badge replaces a round letter. |
| `tab` | string | no | none | Short lead-in on a tab across the top edge. Leave out for no tab. |
| `badge` | `ball`, `moon`, `none` | no | `ball` | What stands in for the letter or the question mark's dot. |
| `frame` | boolean | no | `true` | Draw the outline frame. Without it the tab sits above the line. |
| `colour` | colour | no | `#ffffff` | Frame, letters, tab and badge. |
| `tabInk` | colour | no | `#0b0b10` | Letters on the tab. Use the background colour of the page. |
| `badgeInk` | colour | no | `#0b0b10` | Seams on the ball. |
| `background` | colour | no | `#0b0b10` | Background of the preview page only. The logo itself is transparent. |
| `font` | path | no | Roboto Condensed ExtraBold | A `.woff2` file, relative to the settings file. |
| `fontWeight` | number | no | `800` | Weight of that font. |
| `size` | number | no | `240` | Size of the line. The frame and badge scale with it. |
| `tabSize` | number | no | `84` | Size of the tab's letters. |
| `tabSpacing` | number | no | `12` | Space between the tab's letters. |

For a light page, swap the colours: `"colour": "#0b0b10", "tabInk": "#ffffff", "badgeInk": "#ffffff"`.

## When it fails

| Message | Cause and next step |
|---|---|
| `Playwright not found` | Install it: `npm install -g playwright && npx playwright install chromium`. |
| `Settings need a "name"` | Add a `name` in lower case with hyphens. |
| `Settings need a "line"` | Add the main words as `line`. |
| `ENOENT ... .woff2` | The `font` path is wrong. It is read relative to the settings file. |
| Badge missing | The line has no `*` and doesn't end in `?`, so there's nowhere to put it. |

## Rules

- **Only original titles.** Don't recreate another company's logo or a broadcaster's or league's
  mark, even renamed. The style here is free to reuse; their logos are not.
- **Use fonts we're allowed to embed.** The SVG carries the font inside it. Roboto Condensed is
  under the SIL Open Font License (`fonts/OFL.txt`), which allows this. Check a customer's brand
  font licence before embedding it.
- **Keep the reduced-motion fallback.** Fans whose phones are set to reduce motion see the
  finished logo straight away. Don't remove that rule from the stylesheet.

## Change the style

The layout is in `scripts/layout.html`. Every part is measured from the loaded font and carries a
class naming its role (`frame`, `tab`, `word`, `badge`, `bite`). The animation is the stylesheet
in `scripts/make-logo.mjs` and works by those roles, so a new badge only needs a drawing function
in `layout.html` that returns an element with the `badge` class.
