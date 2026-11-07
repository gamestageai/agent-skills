---
name: logo-animate
description: >
  Animate a logo, mark or icon so it plays in once on load, loops as a loader, or moves while an
  app is busy (a web component you switch on and off). Keeps the brand's own shapes, colours,
  letters and font: traces a PNG into SVG when there is no vector file, and finds the font of its
  words. Makes a new title logo only when there is no mark to start from. Use when someone asks to
  "animate this logo", "make a loader from our icon", "an intro animation", "a splash logo", "an
  animated mark", "a busy indicator with our mascot", or "a logo for my game", including
  for a Gamestage game.
---

# Animate a logo

Takes someone's logo and makes it move, without changing how it looks. You get standalone files
that work anywhere: an SVG that plays once, an SVG that loops, a web component that moves while the
app is busy, and a still.

```
 their logo ─► SVG? ─yes─────────────────┐
                │no                       ▼
                └─► trace the PNG ─► tag each part with a role ─► animate.mjs ─► once / loop / busy / still
                    (trace-check,         (pop, slide, grow,
                     font-match)           draw, rise, blink...)

 no logo at all ─► design one for them, or use the court wordmark recipe (make-logo.mjs)
```

## Quickstart

Tag the parts of an SVG with the role each one plays, then run the script. Paths are relative to
this skill's folder.

```bash
node scripts/animate.mjs examples/monogram/quizbox.svg --out ./out --modes all --tag quiz-box --label Quizbox
open out/quizbox-preview.html
```

That writes `quizbox.svg` (plays once), `quizbox-loop.svg` (loops), `quizbox.js` (the `<quiz-box>`
component), `quizbox-still.svg` and a preview page showing each on light and dark.

It needs Node and Playwright with Chromium. If a script says Playwright is missing, run
`npm install -g playwright && npx playwright install chromium`.

## Animate someone's logo

1. **Get the real files.** Ask for the logo as SVG first. If there is only a PNG, ask for the
   largest one, and ask whether the brand has a named font and colours. Their logo is the spec:
   keep its shapes, colours, case, spacing and any ™ or ® exactly. Never restyle it into a house look.
2. **Trace it if there is no SVG.** See [Trace a PNG](#trace-a-png). Stop at 95% overlap or better.
3. **Split it into parts.** Each part that should move on its own needs to be its own element:
   the head, each ear, the tail, each eye, the words. Group parts that move together.
4. **Tag each part with a role.** Read [`reference/motion.md`](reference/motion.md) and pick the
   role that fits what the part is. Set `data-step` so parts arrive in the order people read them.
   Put `data-loop` roles on the parts that move while looping or busy, and `data-spin=""` on the
   outermost group if it should turn now and then.
5. **Run the script** with the modes they need: `once` for an intro or splash, `loop` for a loader,
   `component` for a busy indicator, `all` for every one.
6. **Check it the way a designer would.** Open the preview. Take screenshots part way through and at
   the end, on light and dark, at phone width. Does the finished frame match the original logo
   exactly? Does anything arrive in an odd order, overlap, or pivot from the wrong point? Is the
   loop calm? Fix the tags and rerun.
7. **Hand it over** with a short README listing each file, what it does and the line of HTML to use
   it. Say which parts you measured rather than were given, such as a font you matched or colours
   you read off pixels.

## Trace a PNG

1. **Draw in the image's pixel coordinates.** Use `viewBox="0 0 <width> <height>"` of the PNG, so the
   tracing lies exactly over it. Crop the viewBox once the tracing is right.
2. **Draw simple shapes.** Most marks are rounded rectangles, circles, ellipses and a few paths.
   Measure where each edge is from the image, then write the shapes.
3. **Score it and adjust.**
   ```bash
   node scripts/trace-check.mjs logo.png tracing.svg --diff diff.png
   ```
   Red in the diff is in the image only (draw more there), blue is in the tracing only (draw less).
   When the shapes are described by a few numbers, it is quicker to write a small script that nudges
   each number and keeps any change that raises the overlap.
4. **Words: find the font.** Measure the box the words fill, from the top of the capitals to the baseline.
   ```bash
   node scripts/font-match.mjs logo.png --text "Quizbox" --box 450,157,681,164 --save fit.json
   ```
   Near 90% with letters fitted is very likely the font. Around 70% is a lookalike: use it for now,
   say so, and ask for the real font. Write the words as one `<text>` per letter at the fitted
   positions so the spacing matches.
5. **Build the font in.** Download only the letters you need from Google Fonts (the command
   `font-match` prints), then pass it: `--font letters.woff2 --font-weight 450`. A logo with words and
   no font inside it shows in a different font on every device.
6. **Colours.** Read them off the image's pixels, and say they are measured. Gradients are usually
   top to bottom or corner to corner: sample the ends and the middle.

## Put it in a Gamestage game

A game's logo goes in Studio, under Brand > Logo. The page reads it as `presentation.logoUrl` and
shows it as an image at the top of the game, and Live Graphics puts it in the corner of each graphic.

1. **Upload the plays-once SVG to Brand > Logo.** An animated SVG plays inside an image, so it
   arrives once when the page opens. Upload the still instead if the logo appears on every screen,
   or the arrival will replay each time.
2. **Or put it in the game's own files**, if the page draws its own title: copy the SVG beside
   `index.html` and show it with `<img src="quizbox.svg" alt="Quizbox" width="240" height="240">`.
   Never load it from another site. Give it a width and height so the page doesn't jump.
3. **Use the busy component while the game waits**, such as for a round to open or a result to
   settle: copy `<name>.js` into the game's files and switch `busy` on and off.
4. **Keep Studio's `logo_text` the same words**, so the intro screen and the logo agree.
5. **Run `gamestage verify`.** Nothing is fetched, so the logo paints with the first frame.

## Roles

Put these attributes on SVG elements. In SVG every attribute needs a value: write `data-spin=""`,
not `data-spin`.

| Attribute | Values | What it does |
|---|---|---|
| `data-enter` | `pop` `fade` `rise` `drop` `slide` `grow` `draw` `open` `spin-in` `letters` | How the part arrives in the once version |
| `data-step` | 0, 1, 2... | Arrival order; the same number arrives together. Default: document order |
| `data-from` | `left` `right` `top` `bottom` | Which side a `slide` comes from. Default `left` |
| `data-origin` | `x y` in the SVG's units, or `center`, `left bottom`... | The pivot for `pop`, `grow`, `wiggle`, `sway` and the spin. Default: the part's centre |
| `data-blink` | `""` | On an `open` part: one blink after everything has arrived |
| `data-loop` | `bob` `look` `blink` `wiggle` `pulse` `sway` | What the part does in the loop and busy versions |
| `data-reverse` | `""` | Runs the loop half a beat later, so the second of a pair alternates |
| `data-spin` | `""` | The group that turns a full circle every few seconds (loop and busy) |

What each role looks like, and which to choose, is in [`reference/motion.md`](reference/motion.md).

## Options

| Option | Default | What it does |
|---|---|---|
| `--out <folder>` | next to the SVG | Where the files go |
| `--name <name>` | the SVG's file name | File names, lower case with hyphens |
| `--modes` | `once` | `once`, `loop`, `component`, or `all`, comma separated |
| `--style` | `calm` | `calm` eases without overshoot; `playful` overshoots, for characters and games |
| `--tag <name>` | `<name>-mark` | The component's element name. Needs a hyphen: `quiz-box` |
| `--label <words>` | from the name | What screen readers hear. While busy: "<label> is working" |
| `--spin <seconds>` | `4` | Seconds between turns in the loop and busy versions. `0` never turns |
| `--font <file>` | none | A `.woff2` or `.ttf` to build in, for marks with words |
| `--font-family`, `--font-weight` | from the SVG's text | Name and weight of that font |

## Use the busy component

```html
<script src="quizbox.js"></script>
<quiz-box style="width:48px"></quiz-box>
<script>
  const bot = document.querySelector('quiz-box');
  bot.busy = true;               // moves until you stop it
  bot.busy = false;              // settles with one blink
  bot.blink();                   // one blink, as an acknowledgement
  await bot.track(fetch(url));   // busy until the request finishes
</script>
```

In React 18, custom elements don't take `className`, so size it with an inline `style`.

## When there is no logo

Ask what the thing is called, who it is for and what it should feel like, then design a mark for it
and tag it as above. The court wordmark is one ready-made recipe: a frame, a tab and condensed
capitals with a badge for one letter. Use it only when that look fits.

```bash
node scripts/make-logo.mjs examples/court-wordmark/who-scored.json --out ./out
```

Its settings are in [`reference/court-wordmark.md`](reference/court-wordmark.md).

## When it fails

| Message | Cause and next step |
|---|---|
| `Playwright not found` | Install it: `npm install -g playwright && npx playwright install chromium`. |
| `The file is not valid SVG` | Usually an attribute with no value. Write `data-spin=""`, not `data-spin`. |
| `The SVG needs a viewBox` | Add `viewBox="0 0 <width> <height>"` to the `<svg>`. |
| `data-enter="..." is not a role` | Use one of the roles in the table above. |
| `The SVG has text but no font built in` | Pass `--font`, or turn the text into paths. |
| A part pivots from the wrong place | Set `data-origin="x y"` in the SVG's own units. |
| A gradient moves with the part | Expected with `gradientUnits="userSpaceOnUse"` on a moving part; put the gradient on the group that stays still. |
| `font-match` loads no fonts | It needs the network to reach fonts.googleapis.com. |
| The overlap stays under 85% | The tracing is not in the image's pixel coordinates, or a shape is missing. Open the diff. |

## Rules

- **Their logo is the spec.** Keep the brand's shapes, colours, case, spacing, font and marks such as
  ™ exactly. Animate it; don't redesign it, and don't put it in the court wordmark frame.
- **Only original or permitted marks.** Animate a logo for the people who own it. Don't recreate
  another company's or a league's mark for anyone else.
- **Say what you measured.** A matched font or colours read off pixels are guesses until the brand
  confirms them. Write that in the README.
- **Fonts we may embed.** Google Fonts are under the SIL Open Font License, which allows building them
  in. Check a brand font's licence before embedding it.
- **Keep the reduced-motion rules.** Every output has them. Don't remove them.

## What's here

| Path | What it is |
|---|---|
| `scripts/animate.mjs` | Animates a role-tagged SVG: once, loop, busy component, still, preview |
| `scripts/trace-check.mjs` | Scores a tracing against its PNG and draws the differences |
| `scripts/font-match.mjs` | Finds the Google Font a logo's words use, and fits each letter |
| `scripts/make-logo.mjs`, `scripts/layout.html` | The court wordmark recipe |
| `reference/motion.md` | Which role fits which part, calm or playful, timing |
| `reference/court-wordmark.md` | The court wordmark recipe's settings |
| `examples/monogram/` | A stroke monogram: draw, grow, pop; sway and pulse |
| `examples/court-wordmark/` | Settings for Quiz Tonight, Who Scored? and Name That Player? |
