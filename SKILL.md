---
name: gamestage
description: "Take a browser game to production with Gamestage: move answers, scoring, locks and settlement behind a server the player cannot edit. Use when migrating a game prototype, when a gamestage.yaml is present, or when the user mentions Gamestage. Run everything as `npx gamestage@latest`; there is no gamestage binary on PATH, so do not check for one."
version: 2026-09-09
---

# Gamestage

Pack version 2026-09-09.
Pack digest 63b91bc855cb5ea7.

Gamestage takes a game that works in a browser and moves its answers, scoring,
locks and settlement behind an Engine the fan cannot edit. The creator keeps the
interface.

You do the migration. The `gamestage` CLI inspects, serves and proves; it does
not edit the creator's source. The judgement and the code changes are yours.

## Install this pack

```sh
npx skills add https://gamestage.ai/skill
```

This writes the current Gamestage instructions for the coding agent. It
installs nothing globally. Then orient with `npx gamestage start`.

## First, check this pack is current

This file was written into your host once, by the installer, and nothing
updates it on its own. The product moves, so a copy that has sat here for a
while can be confidently wrong. **Do this check every time you start working
with Gamestage, before you act on anything below.**

```sh
curl -fsSL https://gamestage.ai/agent.md | grep -m1 "Pack digest"
```

Compare it to the `Pack digest` line at the top of this file. The digest is a
fingerprint of the pack's words: if the two match, this copy is current, carry
on. If they differ, this copy is stale, whatever the dates say. A version is a
date and cannot tell two packs apart on a day both shipped, so the digest is
the yes-or-no and the version is only how you read the notes below.

If this copy has no `Pack digest` line at all, it predates this check and is
stale by definition. Treat that the same as a mismatch.

When the digest differs, or is absent here, do three things, in order:

1. **Fetch the release notes and read what changed since your version.**

   ```sh
   curl -fsSL https://gamestage.ai/agent-changelog.md
   ```

   Show the developer the entries dated after the version at the top of this
   file. That is the point of the check: they hear what moved before they
   decide, rather than being told only that a number is different.

2. **Suggest the update in one line**, naming the file you are reading this from
   and giving the command that rewrites it:

   ```sh
   # a Claude Code skill at ~/.claude/skills/gamestage/SKILL.md
   npx skills add https://gamestage.ai/skill

   # any host: this rewrites the Claude Code skill and the blocks the installer
   # put in ~/.codex/AGENTS.md, ~/.gemini/GEMINI.md and ~/.cursor/rules
   curl -fsSL https://gamestage.ai/install | bash
   ```

3. **Work from the version you fetched, not this one.** Do not guess at what
   changed; the release notes say.

## Running the CLI

**`npx gamestage@latest <command>`.** Nothing needs installing first.

**There is no `gamestage` on your PATH and you should not go looking for one.**
Every command below is written bare for reading; prefix each with `npx
gamestage@latest`, or once per session:

```
alias gamestage="npx gamestage@latest"
```

Written because this page said `gamestage start` a dozen times and never said
where the binary comes from. On 2026-08-12 an agent built a whole game, checked
it, and then stopped at "the `gamestage` executable is not currently available on
the shell's PATH" — one line from the thing it had been asked to do. A tool a
reader cannot invoke is a tool that does not exist.

## A factual question is answered by the hosted doc, in one hop

When the developer asks something with a definite answer, which formats exist,
what a command does, what a field means, **go straight to the hosted doc for it
and fetch that one file.** Do not answer it from this pack, and do not explore
the shell to work it out. This pack carries the method; the hosted docs carry
the facts, and they are the copy that cannot be stale.

The map, so you fetch once rather than hunt:

| The question | Fetch |
| --- | --- |
| Which formats exist, and which fits this game | `https://gamestage.ai/docs/game-formats.md` |
| What a command does, its options and defaults | `gamestage <command> --help`, or `gamestage --json --help` for all of them |
| The manifest's fields | `https://gamestage.ai/schemas/app-manifest/1.0` |
| The full migration route | `https://gamestage.ai/docs/migration.md` |
| The browser integration contract | `https://gamestage.ai/docs/player-api.md` |

"How many formats are there" is one `curl` of `game-formats.md`, not three
commands and a guess. The full list of these lives under **Where the detail
is** at the end of this pack.

## How to work

**Run `gamestage start` and follow what it says.** It reads the current
directory and names the next step, and it keeps doing that at every stage. The
method lives in the tool's output rather than in this file, so it cannot go
stale here.

Add `--json` to any command when you want to branch on the result rather than
read prose.

Add it to `--help` and you get the whole command tree instead of this page:

```
gamestage --json --help
```

Every command, its subcommands, arguments, options, aliases and defaults, read
out of the tool itself. Ask it rather than trusting a list. This file and the
CLI reference are written by hand and can fall behind a release; the tree is the
program describing itself and cannot.

Each command that does something also carries what it needs before it will work:

| `account` | What you need |
| --- | --- |
| `none` | Nothing. It works on the machine in front of you. |
| `session` | To be signed in. Nobody has to have approved you. |
| `approved` | An account the control plane has approved. |

Read it before you run something rather than after it refuses. `login` is
`none`, because it is the command that creates the account.

The shape of a migration:

```
gamestage inspect .        read-only. reports what must move, with line numbers
   ↓ you edit            move answers into the server-owned container
gamestage dev            serves that container through the real Engine
   ↓ you play it         open it in a browser and make a play
gamestage verify         proves the Engine decided the outcome, not the page
gamestage deploy         publishes through Backstage, where one is available
```

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
table when they disagree.

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

## Never hand over a URL you have not fetched

**Fetch it, read what came back, and only then put it in front of a person.**
One line of curl, every time:

```sh
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000
```

`gamestage dev` prints its address as `API`, and that is what it is: the player
API the page talks to, not the page. Opening it in a browser gives a fan
`{"error":{"code":"not_found"}}`, which is the correct answer to the wrong
question. The three `window.GAMESTAGE_*` lines beside it are what a page needs;
the page itself is served by whatever the developer already runs.

**A port that was taken is a step that did not happen.** If the server you meant
to start could not bind, say so and pick another, then fetch the new one. Do not
report a different port's address as the thing to look at, and never write "see
it here" against a URL you have not just proved answers. An address that returns
JSON to somebody expecting a game is worse than saying the server did not start.

## Where the account sits in the journey

A human registers, and gets approved before you can publish. Registering is
their job and it takes a browser, so it is never yours to do. But do not assume
it has happened: plenty of people install the tool and point an agent at a game
before they have an account, which is the right way round, because most of the
work needs nobody. You may meet registration in the middle and approval at the
end, and both are a sentence to the developer rather than a stop.

```
human   1  install the tool and this pack  npx skills add, or the installer
human   2  register, if they have not        gamestage login      may come later
─────────── from here the work is yours ───────────────────────────────
agent   3  orient                          gamestage start      no account
agent   4  inspect the prototype           gamestage inspect .  no account
agent   5  decide what must move           your reasoning       no account
agent   6  write the round                 edit gamestage.yaml  no account
agent   7  rewrite the page                edit the html and js no account
agent   8  run it                          gamestage dev        signed in
agent   9  prove it                        gamestage verify     signed in
agent  10  repair on failure               your reasoning
agent  11  publish                         gamestage deploy     approved account
agent  12  confirm a fan can play          a real browser
human  13  operate the live game           Monterosa Studio
```

**Steps 3 to 7 need no account, so get on with them.** Do not stop partway
through a migration to ask whether the developer has signed in for these.
Orient, inspect, work out what must move, write the round and rewrite the
page. That is most of the work and none of it touches our backend.

**You already know whether they are registered, so do not ask.** `start`
reports it, in `account` and in `authentication`, read from this machine's
token file with no network call:

```json
"account": { "signed_in": false, "email": null, "sign_in": "npx gamestage@latest login" }
```

Use it once, at the start, and then act on it rather than mentioning it:

* **Signed in.** Say nothing about accounts. Run the journey. The only thing
  left to meet is approval, at step 11, and the refusal there says so.
* **Not signed in.** Still say nothing yet, and do steps 4 to 7. Then, when you
  reach `dev`, tell the developer once, in a line: the migration is written and
  running it needs an account, `login` creates one and signs in, and you will
  carry on when they say it is done.

Raising it at the start costs them a browser trip before they have seen
anything work. Raising it at `dev` costs them nothing, because by then there is
something worth running.

**Steps 8 and 9 need a signed-in account, and run a real Engine on the
developer's own machine.** `dev` serves their round through the same code
that will serve it in the cloud, and `verify` marks a play with it. Neither
makes a network call to the control plane and neither needs the account
*approved*, only signed in: `gamestage login` registers and signs in in one
step, so if the developer has never run it, that is the whole ask. If `dev` or
`verify` refuses with "You are not signed in", that is the entire fix; nothing
about the migration itself is wrong.

**Step 11 is the first one that needs an approved account.** `deploy` is the
moment the game becomes something a fan can reach, and that is ours to allow.
An unapproved account is handed back rather than worked around.

**Let the tool tell you which side of the line you are on.** Run the command. If
it works, keep going. If it refuses for want of an approved account, the
refusal names the account state and the next move; read it and hand over.

### What to say to the human at a refusal

Stop, and say these four things in a couple of lines:

* which command was refused, and the account state it reported;
* that the migration up to this point is done and their files are edited;
* what they do next: `gamestage login` if they have never registered, or wait
  for approval and rerun if they are pending;
* that you will pick the run back up from that command when they tell you the
  account is approved.

Then stop. Do not poll, and do not start unrelated work to fill the time.

### A refusal is a hand-over, never an obstacle

Four things you must not do, in the order you are most likely to be tempted:

1. **Never put the answers back in the page.** Not to see the game work, not
   temporarily, not behind a flag. A page a fan can read the answers out of is
   the exact thing this product exists to remove, and it is worse than an
   unfinished migration.
2. **Never invent a local runtime.** No stub Engine, no mock server, no
   fixture that returns "correct", no rewriting the client to score in the
   browser. A game proved against something we did not build is not proved.
3. **Never edit the manifest to make `verify` pass.** Removing a check,
   weakening a rule or renaming a field to dodge a refusal makes the report
   lie, and the report is the only evidence anybody has.
4. **Never report a step you did not complete.** Say plainly which steps ran
   and which are blocked. "Blocked at step 11, waiting on approval" is a good
   outcome. A green summary over a blocked run is not.

## Four rules the output cannot teach you

**Answers never reach the client.** Not in the HTML, not in a bundle, not in a
JSON file next to the game. If a player can download it, treat it as public.
Move the answer set into `backend.round` in `gamestage.yaml`, where a deploy
provisions it into the Engine. Deleting the answers without moving them leaves
the Engine nothing to mark against.

*Where the round ends up, and why the manifest is not it.* A finished
Gamestage game keeps its round in Monterosa Studio, so whoever runs the game can
change a word without you. The manifest is the way to get a round moving today
and a place it passes through, not where it belongs: a manifest describes a game
and carries no content. Put the round there, deploy, and expect it to move on.
Nothing you write here is wasted when it does, because the shape is the same
either way.

**Never invent a player id.** An id a page picks for itself is one anybody can
send on someone else's behalf. Anonymous play is supported and the Engine issues
a signed session for it. Where a game needs identified players, it names its own
issuer and JWKS in the manifest and the Engine validates the token the
creator's own login system already gives them. Gamestage ships no identity
provider at any plan.

That identified-player route is proved by the shared validator and local
`dev --as` harness. The deployed Engine adapter does not yet load a game's
declared issuer and keys, so do not claim identified hosted play works.

**`verify` is the arbiter. Your own reading of the code is not.** When a browser
is available it makes a real play. A status code, a green build and a page that
looks right can all hide a broken game. Exit code `0` means every check was
verified, `1` means a check is open, and `2` means the result could not be
fully proved. A skipped browser check is not browser proof.

**Two of its checks are worth knowing before you write the page.** `verify`
takes the browser's network away and asks whether anything on the screen
changed, in both directions, so the reconnection handling below is a check
rather than advice: a page that says nothing when a fan loses their signal is
refused, and so is one that says something and never takes it back. And a game
whose manifest carries no round is checked against a stand-in Gamestage
supplies, which proves the wiring and nothing about the game, so that run ends
at `2` rather than at "done".

**Do not weaken a refusal to get past it.** Starter refusing a second live
game, an invalid manifest, a rejected play: these are the product working. Read
the reason, which is written to be acted on, and change the cause.

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
hideLoading();
render(game.round);
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

Readable defaults in the page are fine and are not the same thing. A default is
what shows until a producer sets that field; `applyPresentation` leaves an
element alone when nothing is set, so a game keeps the words it shipped with
rather than blanking. The test is not whether words appear in your file. It is
whether a producer can change every word a fan reads without you deploying. If
they cannot, that copy is hard coded however it got there.

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

Under `gamestage dev` there is no producer, so `game.presentation` is empty and
the game keeps every word it was built with. That is the correct result and the
wire is fine. These settings reach a fan only on a game provisioned into
Interaction Cloud, which is above the Starter plan.

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

So draw the control only on `ready`. A button offering another round that then
cannot produce one is worse than no button.

The Engine picks: a round this player has never opened before one they left
half done, never one they finished, and never one that has stopped accepting
plays. You do not order the pool yourself.

`rounds` lists the pool as summaries carrying no challenge and no solution, and
`rounds/mine` says which this player has played and which they finished. Most
games need neither: `rounds/next` is the whole feature for a Play Another
button.

## Name the four moments worth measuring, and nothing else

Analytics needs no work from you. **Monterosa Analytics is on by default and
captures a fan's activity without a single line in the game**: clicks, views and
submissions are trapped from the page itself and translated, so a game that
never calls anything still reports. Do not add a tracking library, and do not
ask the human for an analytics account.

What that gives them is activity. What it cannot give them is meaning. A trapped
click knows a button was pressed and its label; it does not know the fan went
over the limit, or ran out of guesses on the last one, or came back a second day
and finished. Those are the questions a creator actually asks, and they are the
ones only the game can answer.

So name a few. Four is usually the whole list, and more is worse:

```js
game.track("round_started", { round: round.number });
game.track("round_finished", { outcome: result.outcome, score: result.score });
game.track("attempt_spent", { remaining: state.attempts_allowed - state.attempts_used });
game.track("gave_up", { at: state.progress });
```

**Name the moment, not the mechanism.** `round_finished` with an `outcome`
survives you rewriting the board; `clicked_submit_button_v2` does not, and a
creator reading a chart six months later cannot tell what it meant. The name is
the thing a person would say out loud about their own game.

**Never put a solution in a property.** A tracked event leaves the browser and
goes to a third party. `{ answer: "jokic" }` in an event is the same leak as
`{ answer: "jokic" }` in the page, and everything else this pack says about
keeping solutions server-side applies here unchanged. Send the outcome, never
the thing that decided it.

**Do not gate it on consent yourself.** The client holds one consent gate in
front of every destination, and an event refused by it is refused everywhere at
once. A second check in the game is a second thing to get wrong, and a game that
withheld its own events would report less than the fan agreed to.

If the human asks for PostHog or Google Analytics, those are switches on their
Analytics screen rather than code you write: the same captured stream is routed
to them, so turning one on needs no change to the game and no redeploy. Say so
rather than writing an integration.

## Human handoffs

**`gamestage login` is the one you run rather than hand over**, when `start`
said this machine is not signed in. Running it beats handing over a command to
type: it is a few seconds of the developer's attention instead of a
conversation to resume. It is still their approval, though, so you run the
command and they do the approving.

What it does, and the part you must not skip. It emits a JSON notice **on
standard error** with `status: "awaiting_approval"`, a `verification_uri_complete`
and a `user_code`, then waits. **Put that address in front of the developer
immediately**, with the code beside it. It also tries to open their browser,
and that is best effort: over SSH, in a container or in a sandbox it opens
nothing, and a developer who was never shown the address is waiting on a window
that will not appear. When they approve, the command returns signed in and you
carry on.

Two things it can return instead. The code expires after a couple of minutes,
which comes back as a plain message rather than an error: run it again and give
them the **new** address, because each run mints its own and older ones stop
working. And `awaiting_approval` is not signed in. It is the notice, not the
result, so do not read it as a green light and run the next command.

A brand-new account is a longer wait than that. `login` creates the account as
well as signing in, so there is nothing for them to do first, but a new
workspace is approved by a person at Monterosa. Signing in will work; `deploy`
at step 11 will not until that approval lands. Say so when you see a new
account rather than letting them discover it eight steps later.

Do not run it on a machine that `start` said is already signed in. It rebinds
the machine to whichever account the browser is holding, and a developer who
has two is now working in the wrong workspace with nothing saying so.

`gamestage link github` still needs a person: it is the same device flow, but
it is a first deploy's gate rather than a step in the migration, so it belongs
in the handover with the refusal that named it. Approval of a registered
account is ours to give, not yours to wait out. `gamestage suspend`, `wake` and
`archive` change what a live audience can reach. `gamestage promote` is the same family and the largest of them: it
approves a game to move from dev to prod, which is a real audience's game
changing under them. None of these is yours to approve alone. Stop and hand
over the exact command and its consequence.

The developer must accept the Terms of Service themselves in a browser. You
must never accept them. When `login` or a refusal names
`https://gamestage.ai/terms`, give that address to the developer and wait; do
not read, summarise or accept the terms on their behalf. There is no
command-line option for accepting the terms, and there will not be one.

A refusal at step 11 is an account waiting for approval, not a service that is
shut. The route runs on the CLI's own default with nothing to configure. Read
what the command said, tell the developer what it was, and stop. Never report a
deploy, or a hosted game, on the strength of a command you did not run to
completion.

## Where the detail is

* `https://gamestage.ai/start.md`: the full entry point.
* `https://gamestage.ai/schemas/app-manifest/1.0`: the manifest schema, and what to consult when writing `backend.round`.
* `https://gamestage.ai/docs/migration.md`: the full migration route.
* `https://gamestage.ai/docs/game-formats.md`: whether this needs an Engine at all, and if so which rule fits. Read the first section before the decision guide: a game whose answer does not have to be computed from data a fan cannot see is a plain Monterosa element and needs none of this.
* `https://gamestage.ai/docs/player-api.md`: the browser integration contract.
* `gamestage <command> --help` for any command.
