# Court wordmark recipe

A ready-made title logo for when there is no mark to animate: a white court frame, a short tab
across the top that is read first ("DID YOU"), the main words in condensed capitals ("KNOW?"), and a
badge that replaces a round letter or the dot of a question mark. Use it only when that look fits;
it is one recipe, not the default.

```
 ┌──────[ DID YOU ]──────┐     tab: drops in from above
 │                       │     frame: draws itself around the edge
 │     K N (ball) W ?    │     badge: spins in from small
 │                       │     words: rise into place
 └───────────────────────┘
```

```json
{ "name": "who-scored", "tab": "WHO", "line": "SC*RED?", "badge": "ball" }
```

```bash
node scripts/make-logo.mjs who-scored.json --out ./out
```

That writes `who-scored.svg` (animated, plays once), `who-scored.png` (transparent still) and
`who-scored-preview.html`. Settings for Quiz Tonight, Who Scored? and Name That Player? are in
`examples/court-wordmark/`.

## Make one

1. **Get the words.** The tab is the short lead-in read first ("TRIVIA", "DID YOU", "WHO IS"). The line
   is the big word. Keep the line to one word, two at most: long lines make a wide, thin logo that is
   small on a phone.
2. **Pick the badge.** Put `*` in the line where a round letter becomes the badge (`T*NIGHT`, `KN*W?`).
   With no `*` and a line ending in `?`, the badge replaces the question mark's dot (`THIS?`). Use
   `"badge": "none"` for plain letters. The badge should mean something: a basketball for basketball, a
   moon for "tonight".
3. **Run the script** and open the PNG. Does the tab read first, is the padding even, is the badge the
   same visual size as the letters? Then press Replay on the preview to watch it.
4. **Adjust and rerun.** `size` and `tabSize` change the balance between line and tab; `tabSpacing`
   opens up the tab's letters.

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
| `Settings need a "name"` | Add a `name` in lower case with hyphens. |
| `Settings need a "line"` | Add the main words as `line`. |
| `ENOENT ... .woff2` | The `font` path is wrong. It is read relative to the settings file. |
| Badge missing | The line has no `*` and doesn't end in `?`, so there's nowhere to put it. |

## Change it

The layout is in `scripts/layout.html`. Every part is measured from the loaded font and carries a
class naming its role (`frame`, `tab`, `word`, `badge`, `bite`). The animation is the stylesheet in
`scripts/make-logo.mjs`, so a new badge only needs a drawing function in `layout.html` that returns
an element with the `badge` class.
