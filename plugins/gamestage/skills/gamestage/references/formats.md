# Choosing and designing the game

Part of the Gamestage skill, pack version 2026-09-30-2. Read it before you suggest a format, build a new game, or add rounds and reasons to come back.

## Ask what the game is before you build one

**The format and the subject are the developer's to choose, and you ask for
both in one question before you scaffold anything.** Not afterwards, and not as
an assumption you record in the summary. A format decides how the game is
played and what the Engine marks, so choosing it for someone is choosing their
game for them.

There are six, and one question covers all of it. **Show the developer this
list when you ask**, so they choose from what exists rather than describing a
game and hoping:

| Format | What a fan does |
| --- | --- |
| `hunt` | finds hidden things in a board, with a limited number of tries |
| `push` | goes as far as they dare against a hidden limit, and busts if they pass it |
| `group` | sorts a set of items into the groups they belong to |
| `predict` | calls what will happen before the world decides |
| `bingo` | fills their own board from a shared pool, racing for a line |
| `shoot` | aims and shoots a penalty; the Engine plays the keeper and decides it |

This table said four until 2026-09-03, missing `bingo`, and was wrong the day
it was written. The list the tool prints is the one that cannot go stale:
`gamestage start` in an empty folder shows the current formats, and
`gamestage create` with no format shows the same menu. Trust those over this
table when they disagree. `gamestage formats <format>` (or `--json formats`)
says what each one keeps secret, what a producer writes in Studio, and names a
deployed game of that kind the developer can play before choosing.

`create` makes a folder named after the game when the current folder holds
other things and no `index.html`; `--json` reports it as `directory`, so work
there. Pass `--here` to write into the current folder regardless. Pass
`--brand` and `--privacy-url` when the developer has said who runs the game,
or `verify` and `deploy` will ask for them later.

Ask it plainly: which of these, and what is the game about. Then build.

**Never invent the subject.** If the developer says "a ball game", that is not
football, and it is not eight items about home grounds, forwards, managers and
famous stands. It is a question you have not asked yet. A scaffold full of
content nobody chose reads as the tool having decided, and the developer then
has to delete your game before they can write theirs.

Two things that are not permission to skip the question. A word in the request
that sounds like a format is not a choice: "puzzle" is not one of them, and
mapping it to one yourself is the assumption this section exists to stop. And a
`gamestage.yaml` already in the directory is a choice already made, so read it
rather than asking again.

### Draw the match before you name a format

**Every time you match a game to a format, draw the two rules side by side.
Both when one fits and when none does.** A named format on its own is an
assertion, and nobody can disagree with an assertion.

On 2026-09-08 a developer outside the team brought a game where the player
builds a chain of players and each pick's hidden score has to be at least the
one before. An agent read the list above, matched none of it, and told him to
change his game. He nearly stopped there. The answer was probably right and it
showed him nothing: not how close he was, not which single part was the
problem, not what he could change.

**The drawing is required on a yes as well**, and that is the more expensive
case rather than the polite one. A wrong format plays almost correctly until a
fan finds the edge, and the drawing is the only thing anybody could have looked
at to catch it.

Three parts, in this order.

1. **The two rules beside each other.** Left is the developer's game **in the
   developer's own words**: if they said chain, write chain, not "ordered
   picks". Right is what the format marks.
2. **A verdict table**, one line per part of the rule, so the parts that do
   match stay visible when the answer is no. "It matches none of the six" tells
   a developer nothing; "everything fits except the rule itself" tells them
   where they are.
3. **The plain next step.** If a format fits, name it and say what you are
   about to build. If none does, name the one part standing in the way and what
   the nearest format would change about their game, and let them decide. A
   refusal with nothing after it is where the trial nearly ended.

Written out for that developer's game, this is the shape to copy:

```
YOUR GAME                          WHAT push MARKS
---------------------------        ---------------------------
pick 1 -> hidden value             pick 1 -> hidden value
pick 2 -> hidden value             pick 2 -> hidden value
   ^        ^                         +---- + ----+
   +- each >= the one before             running total
                                              v
no total, no ceiling               busts if it passes the ceiling

ordered picks    yes / yes    both take picks in order
hidden values    yes / yes    neither sends numbers to the browser
the rule         NO           push adds up; yours compares neighbours
```

Then say it in words, and say what could happen next: push is the closest fit
and the rule is the one thing in the way, because push adds each pick to a
running total and ends the play when that total passes a hidden ceiling, while
your game compares each pick against the one before it and adds nothing up. The
choices from there are theirs, so put them plainly: keep the chain rule, which
Gamestage has no format for and no way to add one, or play it as push, where a
fan pushes for a high total under a hidden ceiling.

**Explain each of our words the first time you use it with the developer**, one
plain sentence, then carry on. They have not read this page and should not have
to.

- **Engine**: our server. It holds the answers and decides the outcome, so the
  page in front of a fan cannot be edited into a win.
- **Format**: the mechanic a game runs on, chosen from the list above.
- **Archetype**: the same thing under its key name. `archetype:` in the
  manifest holds the format, and the wider list of values in our published
  schema is a way of labelling games rather than a menu: only the formats
  above have an Engine behind them, and there is no custom one to ask for.
- **Manifest**: `gamestage.yaml`, the file describing the game to the tool. It
  carries no answers and no content.

The developer in that trial said the vocabulary on its own would have been
enough to make him give up. He was not confused about his own game.

## A game may hold more than one round, and a fan can be sent to the next

A game is not one board for ever. The Engine holds a pool and `rounds/current`
answers with the one the game considers live, so a fan who finishes today's
round can be offered one they have not played rather than left on a spent
board.

```js
const next = await player.getNextRound();
if (next.status === "ready") show(next.round);
```

**Read `status` rather than testing whether `round` is there.** A response that
simply omitted the round when the pool was empty would look identical to one
that failed to include it, and every client would have to guess whether to draw
an empty state or an error. `ready` and `exhausted` say which, and the Engine
answers 200 either way.

So draw **Play next** on `ready`, and on `exhausted` draw the same button greyed
and disabled, reading "Come back tomorrow" (from Studio). Decide it before the
button renders, so a fan never taps and gets refused. A button offering another
round that then cannot produce one is worse than either.

The Engine picks: a round this player has never opened before one they left
half done, never one they finished, and never one that has stopped accepting
plays. You do not order the pool yourself.

`rounds` lists the pool as summaries carrying no challenge and no solution, and
`rounds/mine` says which this player has played and which they finished. Most
games need neither: `rounds/next` is the whole feature for a Play Another
button.

## Design a game fans come back to

The rules the most successful daily games share, from Wordle and Connections to
Candy Crush and Duolingo, as things you check before deploying. The reasons and
sources are in the Game design chapter (https://gamestage.ai/docs/game-design).

1. **A fan reaches their first answer within 30 seconds, in 3 taps or fewer.**
   The round is on the first screen. How to play is a button, never a gate.
2. **One main action per screen.** After a round it is **Play next**: filled,
   full width, the loudest thing on the screen. "Come back tomorrow" greyed in
   the same place when the pool is empty. Share result and See the story sit
   beneath it, quieter.
3. **Reveal the answer after every round.** The story, if any, is 1 to 3 slides
   (the answer, the closest miss, one fact) and opens only when the fan taps it.
   Revealing the moment a fan finishes is right for a puzzle whose answer is
   known in advance and is the same for everyone (hunt, push): delaying it
   spoils the game and protects little, because once anyone solves a shared
   puzzle the answer spreads anyway. Bingo and predict have nothing to reveal
   early, because their answer does not exist until the real event happens.
4. **Design the scoring so ties are rare.** Score by closeness, fewer guesses or
   speed rather than pass or fail, and let the leaderboard rank the week's total.
5. **Give fans a reason to come back.** A round a day or per fixture, the same
   for everyone. A streak shown from two, forgiving a day with no match.
6. **Mix easy and hard,** and give a pick-one quiz six options, not four.
7. **Share without spoiling.** The share card shows the score and how the fan
   got there, never the answer.
8. **Nothing manipulative.** No lives or energy that stop play, no offers at the
   moment of failure, no paid random rewards, no guilt notifications. Many fans
   are children and the rights holder carries the reputation.

**Ask the creator: "Will this game carry a prize?"** If it will, the
leaderboard is worth cheating, and sessions are free: a fan can use a spare one
to see the answer and then score perfectly on another. So a prize game takes
entries only from signed-in fans, counts each account's first play of a round,
and its producer watches for perfect first-try plays from brand-new sessions.
Say this to the creator before they announce a prize, not after.

**Run `gamestage review` before `gamestage deploy`.** It plays the built game
against a real Engine and reports advice against these rules, each with a fix.
It never fails a deploy: read its advice, fix what you agree with, and tell the
human what you left and why.
