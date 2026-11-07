# Choose the motion

The mark decides the motion. Look at what its parts are, then give each part the role that fits what it is. A head pops in, an ear slides out from behind, a tail grows from where it joins, a stroke draws itself, words rise. Nothing should move in a way the drawing doesn't suggest.

## Arrival (plays once)

| Role | What it does | Fits |
|---|---|---|
| `pop` | Grows from small and fades in | The main body of a mark: a head, a badge, a shape that holds the rest |
| `fade` | Fades in where it is | Anything quiet, a background shape, a sober brand |
| `rise` | Comes up a little and fades in | Words, a baseline element |
| `drop` | Comes down a little and fades in | A tab or label above the rest |
| `slide` | Slides in from one side (`data-from`) | Parts that sit behind or beside the body: ears, arms, a second shape |
| `grow` | Scales up from a pivot (`data-origin`) | Something that sprouts from a point: a speech-bubble tail, a stem, a flag |
| `draw` | Draws its outline from start to end | Shapes made of strokes: rings, lines, frames, signatures. Needs a `stroke` and `fill="none"` |
| `open` | Opens from flat to full height | Eyes. Add `data-blink=""` for one blink after everything has arrived |
| `spin-in` | Turns in from small | A ball, a coin, a wheel |
| `letters` | Each child rises in turn | A group of `<text>` elements, one per letter or word |

`data-step` sets the order. Parts with the same step arrive together, 0.15 seconds apart per step. Order the steps the way someone reads the mark: the body first, the details next, the face or the name last.

## While looping or busy

| Role | What it does | Fits |
|---|---|---|
| `bob` | Floats up and down | The whole mark, on the group that holds everything |
| `look` | Moves left, then right, then back | A group of eyes |
| `blink` | Squashes flat for a moment | Each eye |
| `wiggle` | Squeezes in and out sideways | Ears, antennae. Add `data-reverse=""` on the second of a pair: it runs half a beat later, so they alternate |
| `pulse` | Fades a little and back | Something that should stay put: a spark, a dot, a light |
| `sway` | Tilts a little each way | A mark with no face; a sign, a flag, a letter |
| `data-spin=""` | A full turn every few seconds | The outermost group. Loop and busy versions; in the busy component the first turn waits a full period |

One element takes one role per mode. To combine, nest groups: the spin on the outside, the bob inside it, the eyes inside that.

## Calm or playful

`--style calm` (the default) eases in without overshoot and pops from 80% size. Use it for most brands, news, finance, anything formal.

`--style playful` overshoots a little and pops from 40% size. Use it for characters, mascots, games and anything with a face.

## Keep it short

- **Arrival under two seconds.** People are waiting to use the thing behind the logo. Five steps at 0.15 seconds plus the last animation is about 1.2 seconds.
- **One loop, gently.** A loader is watched for seconds, not minutes, but a fast loop looks anxious. The loop roles run at a calm pace; busy runs them twice as fast, which reads as working.
- **Plays once means once.** An intro that repeats becomes a loader. Use the loop mode for that.

## Reduced motion

Every output respects the phone's "reduce motion" setting: the arrival shows the finished mark straight away, and the loop and busy versions fade gently instead of moving. Never remove these rules.
