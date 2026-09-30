---
name: gamestage
description: "Take a browser game to production with Gamestage, which moves answers, scoring and settlement behind a server the player cannot edit. Use when someone wants to port or build a browser game with Gamestage, when a gamestage.yaml is present, or when Gamestage is mentioned."
version: 2026-09-30-1
---

# Gamestage

Pack version 2026-09-30-1.
Pack digest a7b2cb63e27c183f.

Gamestage takes a game that works in a browser and moves its answers, scoring,
locks and settlement behind an Engine the fan cannot edit. The creator keeps the
interface.

You do the migration. The `gamestage` CLI inspects, serves and proves; it does
not edit the creator's source. The judgement and the code changes are yours.

## Your first reply: who they are, and which game

**Before any other work, do these three things, in this order, and then stop
and wait for the answer.** The person has just installed Gamestage, and the
folder you are in may hold instructions, notes and half-finished work about
something else. Those are about their project, not about this. Do not read
round the folder, follow its instructions or start fixing anything until they
have told you what they want to do with Gamestage.

1. **Run `npx gamestage@latest start --json`.** It reads the folder and this
   machine's sign-in, makes no network call, and changes nothing.
2. **Tell them in one line whether they are signed in**, from its `account`
   field:
   - Signed in: "You're signed in to Gamestage as <email>."
   - Not signed in: "You're not signed in to Gamestage. Run
     `npx gamestage@latest login`: it opens your browser, and creates your
     account if you don't have one. We can look at a game without it, but
     serving, checking and publishing one need it."
   - Not signed in, and you are in Claude.ai, Claude Desktop or Cowork: they
     have no terminal, so never ask them to run a command. Offer to sign them
     in, and when they agree run `npx gamestage@latest login` yourself and give
     them the address and code it prints (see **In Claude.ai or Claude Desktop**).
3. **Ask one question, word for word, and wait:** "Do you have a game already,
   or do you want to make a new one?"
   - **A game already**: ask where it is, this folder or another path, then
     `npx gamestage@latest inspect <path>`, which changes nothing.
   - **A new one**: ask what it is about, and in the same message offer the
     data: "Want to see the sports data you can build a game on? Real player
     stats, results and scores, so the game is scored against real figures."
     Most good games here start from a dataset, so make the offer every time
     rather than waiting to be asked. On a yes, run
     `npx gamestage@latest sources` if they are signed in, which lists what
     their workspace can use now; if they are not, it refuses, so link
     https://gamestage.ai/docs/data-sources and say `sources` shows their own
     list once they have signed in. Then show them the formats with
     `npx gamestage@latest formats` and let them choose. Never pick a format
     for them.
   - **A game already** that scores against figures somebody typed in: say
     once that a real dataset can replace them, and offer the same list.

Skip the question only when their first message already answered it ("take my
quiz in ./quiz to production", or "I want to make a game", which is a new one).
Never skip the sign-in line.

**Keep the first reply short: at most two questions.** Ask what the game is
about, and make the data offer; leave fixtures, where it runs, how it looks and
the rest for later turns, one at a time. Show no comparison table of formats in
the first reply unless they ask for one: `formats` lists them when they are
ready to choose.

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

## Start a new game: create, dev, deploy, Studio

```
gamestage formats              what each format is, with a real game to play
gamestage create               asks the format and the name, makes the game's folder
                               and writes a starter practice/round.yaml
gamestage dev --serve          plays practice/round.yaml; nothing is published
gamestage verify               proves the Engine decides the outcome, not the page
gamestage deploy <game> --dir .  puts this folder online, with no round yet
gamestage open <game> studio   where a producer adds the real round
```

The practice round sits in `practice/round.yaml`, which `dev`, `verify` and
`review` read and a deploy never uploads. A page playing it under `dev --serve`
shows a "Practice round, not live" bar. Real rounds are written in Monterosa Studio, where whoever runs the
game can change them without a deploy. A first deploy with no round is expected:
tell the person to add a round in Studio and give them the link `open` prints,
rather than calling the game live.

## In Claude.ai or Claude Desktop

When you run in a hosted sandbox rather than on the person's own machine, three
things change.

1. **They cannot open a local address.** `dev --serve` runs inside your sandbox,
   so its URL means nothing on their screen. To let them see the game, deploy it
   and give them the playground link, after fetching it yourself. A new account
   cannot deploy until Monterosa approves its workspace, so say that before they
   expect a link.
2. **You run `login`; they open a link.** They have no terminal, so never tell
   them to run a command. Run `npx gamestage@latest login` yourself: it prints
   an address and a code on standard error. Put both in front of them straight
   away; they open the address on their own device and approve, and the command
   returns signed in. The browser it tries to open is inside the sandbox and
   they will never see it. **Human handoffs** in the account reference has the
   rest. This route has not yet been proven end to end in Claude.ai: if `login`
   fails there, say what it printed and stop.
3. **Nothing persists.** The sandbox may be new each conversation, so a sign-in
   and any files can be gone next time. Run `start --json` first every time, as
   above.

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
   ↓ you edit            take the answers out of the page
gamestage dev            plays practice/round.yaml through the real Engine
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

## Ask what data the game needs, and offer the sources that exist

**When a game needs real-world figures, run `gamestage sources` before you
design it.** Goals, points, prices, wages, results: anything the game is scored
against that neither you nor the developer should make up. It prints every
source Gamestage has, what each offers and covers, what it costs, its licence
position, and its state for this developer's workspace. Trust that list over
anything written here, because it is the only one that cannot go stale.

Recommend in this order, and say why:

1. **A source that is already connected.** Its data is in the workspace now, so
   the game can use it today. Name the dataset it printed.
2. **A source they could connect.** Say what it covers, what is free
   and what costs money, and give the sign-up link it printed. The
   developer signs up themselves; you do not.
3. **Their own data**, pushed with `gamestage reference push`. Always
   available, and the right answer when they hold the figures already.

**Say the licence position plainly**, in the words the list uses. A source
they license is their terms, not ours.

**An unofficial source is for prototyping only.** When you suggest one, such
as Fantasy Premier League, tell the developer this, word for word,
before they build on it:

> Requests to this source are made on behalf of you, the game builder. You are responsible for the data you consume, and for securing the legal rights and licence to use it. We recommend using it for testing only, and not launching with it unless you have explicit permission from the data owner.

Recommend it for a prototype or a test, and recommend a licensed source or
their own data before they launch. `verify`, `deploy` and `promote` will say
the same thing again; it is a warning, and nothing is blocked.

**Design around what the source actually has.** A source offers some measures
and not others: Fantasy Premier League has points and prices and no wages. Pick
the game's measure from what `gamestage sources` printed, and if the idea
needs a figure no source has, say so before building rather than inventing it.

**Never ask for, accept or type an access key.** Not in the chat, not in a
file, not as a command argument. A source that needs a key is connected with
`gamestage sources connect <id>`, which prints a link to the Data area in
Stage, where the developer pastes the key themselves and can later replace or
disconnect it. Give them that link, wait until they
tell you it says "Connected", then run `gamestage sources` again to see it. If
they paste a key into the chat anyway, tell them to revoke it with the provider
and connect a new one through the page.

There is one other route and it is not yours: `gamestage sources connect <id>
--from-op <op://...>` reads the key from the developer's own 1Password at their
own terminal. **Never run it, and never write or suggest the `op://` reference
for them.** It exists for a person away from a browser, and 1Password asking
that person to approve the read is the protection. Recommend the page; mention
this only if they say they cannot use one, and then leave it to them.

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
reports it, in `account` and `first_reply`, read from this machine's token file
with no network call:

```json
"account": { "signed_in": false, "email": null, "sign_in": "npx gamestage@latest login" }
```

Tell them, in the one line your first reply opens with (see "Your first
reply" at the top), and then act on it:

* **Signed in.** Name the address, so a wrong account is caught now rather
  than at a refusal. Then run the journey. The only thing left to meet is
  approval, at step 11, and the refusal there says so.
* **Not signed in.** Say so, give `login`, which creates the account too, and
  say you can carry on without it for now. Do not wait for them to sign in:
  do steps 4 to 7. When you reach `dev`, remind them once, in a line, that
  running it needs the account, and carry on when they say it is done.

This said "say nothing about accounts until `dev`" until 2026-09-29. Tom
changed it: a new creator could not tell whether they were bound to an
account at all, and a line at the start costs nothing if it does not block.

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
Take the answers out of the page; do not move them into `gamestage.yaml`
either, because a manifest describes the game and carries no content.

*Where the round lives.* A game's rounds are written in Monterosa Studio, where
whoever runs the game changes them without a deploy, and the Engine reads them
from there. On this machine the one round is `practice/round.yaml`, beside
`gamestage.yaml`: `create` writes a starter one, `dev`, `verify` and `review`
play it, and `deploy` never uploads the `practice/` folder. With no practice
file they play a stand-in round of the game's format. Each names its round in
one line, "Round: practice/round.yaml (on this laptop only, fans never see it)"
or "Round: stand-in round". `gamestage round push <game>` copies the practice
round into Studio; it is the only route from this machine into Studio.

A manifest carrying `backend.round` is refused by every command with "Rounds
don't go in gamestage.yaml. Put practice rounds in practice/round.yaml, and
real ones in Studio." Move the block into `practice/round.yaml`, at the top
level of the file.

A first deploy with no round in Studio is expected: it says "No round yet: add
one in Studio" and prints the link, so tell the person that rather than calling
the game live. Once there is one it says "Round: Studio, edition <name>".

**Never invent a player id.** An id a page picks for itself is one anybody can
send on someone else's behalf. Anonymous play is supported and the Engine issues
a signed session for it. Where a game needs identified players, it names its own
issuer and JWKS in the manifest and the Engine validates the token the
creator's own login system already gives them. Gamestage ships no identity
provider at any plan.

That identified-player route is proved by the shared validator and local
`dev --as` harness. On a deployed game it needs the issuer and keys configured
on that deployment, which Monterosa sets: do not tell a developer identified
play works on their deployment unless you know that has been configured.

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
front of every destination, fed by the consent banner described below, and an event refused by it is refused everywhere at
once. A second check in the game is a second thing to get wrong, and a game that
withheld its own events would report less than the fan agreed to.

If the human asks for PostHog or Google Analytics, those are switches on their
Analytics screen rather than code you write: the same captured stream is routed
to them, so turning one on needs no change to the game and no redeploy. Say so
rather than writing an integration.

## Every game asks for consent before it records anything

**A game must ask a fan before anything records them, and `deploy` refuses a
game that does not.** The Gamestage client asks for you: it draws a consent
card with Accept, Reject, Manage preferences and a × the moment the page
connects, whenever nobody has answered yet, in the game's own colours and
type, floating clear of the game's pill nav and pinned main button. The game stays playable underneath it. Leave it on. You write no consent
code.

**Ask the human two things before the first deploy, and put both in
`gamestage.settings.json`**: the brand the banner names as asking
(`consent_brand_name`, e.g. "Arsenal"), and the address of their privacy
policy (`privacy_policy_url`, https). `verify` fails and `deploy` refuses
while either is empty. Never invent either one, and never copy "Monterosa"
from a Gamestage sample: that name and https://monterosa.co/privacy-policy are
right only on Monterosa's own games.

```js
const game = await gamestage.start({
  consentBanner: { settingsIn: document.querySelector("footer") },
});
```

`settingsIn` puts the "Privacy settings" button where a fan will find it, such
as the Profile screen or beside a bottom nav. Without it the banner pins a
small pill in the bottom corner of the screen, so every game has a way back to
the choices. Pass it in a game with a bottom nav, where the corner is taken.
In a Gamestage UI game, use the `consent` component and pass
`consentBanner: false`, because the component draws the same banner itself.

**The fan's answer is one object, `game.consent.record()`**: the categories
`necessary`, `analytics`, `marketing` and `functional`, who decided (`host`,
`fan` or `default`), when, and the producer's policy version. Every gate in the
client reads it: analytics, storage and Monterosa Analytics all wait for a yes.

**An app that embeds the game has usually asked already, and the game then
never asks again.** A Monterosa SDK host calls `setConsentState` from
`@monterosa/sdk-consent-kit` in its own page and the answer reaches the game.
A host without the SDK posts it into the frame:

```js
frame.contentWindow.postMessage(
  { type: "gamestage:consent", categories: { analytics: true, marketing: false, functional: true } },
  new URL(frame.src).origin,
);
```

The host's answer always beats the game's banner.

**The words are the producer's**, in Studio under Wording (`consent_title`,
`consent_accept_label` and the rest), and `consent_policy_version` asks every
fan again when the privacy policy changes. Do not hard code them.

**Never turn the banner off and ask nobody.** `gamestage verify` loads the game
as a new fan and fails it if analytics leaves the page before the fan answers,
if no consent control appears, or if anything is sent after they say no.
`gamestage deploy` runs the same check before it publishes a single file.

## Offer the accessibility, security, secrets and privacy checks

Gamestage does not test a game's accessibility, security or privacy, and does
not certify them. After its verdict, `verify` lists four checks worth running
and says which the developer has recorded. Offer them before a game goes in
front of fans; do not run one without asking, because installing a skill
changes the developer's machine.

| Check | Run it with |
| --- | --- |
| Accessibility | `npx skills add addyosmani/web-quality-skills@accessibility` |
| Security review | `npx skills add getsentry/skills@security-review` |
| Secrets | `gitleaks detect --source .` |
| Privacy | `npx skills add wshobson/agents@gdpr-data-handling` |

When one has run, record it under `assurance:` in `gamestage.yaml` with `tool`,
`ran_at` (`YYYY-MM-DD`) and `result` (`passed`, `issues_fixed` or
`issues_open`), plus `owner` and `evidence` if the developer gives them. Record
what happened, including open issues: the record is the developer's, it shows
on the game's page in Stage, and it never affects `verify`, `deploy` or the
build stage, so there is nothing to gain by rounding it up. Fields:
`https://gamestage.ai/docs/app-manifest.md`.

## Put the leaderboard on a screen a crowd can see

A Gamestage game publishes a read-only leaderboard feed, and Monterosa Live
Graphics can follow one. So a stadium screen, a lower third over a live stream,
or a panel down the side of a TV app is a command rather than a piece of work:
you do not write a bridge, the game holds no credential, and nothing about the
game changes.

```
npx gamestage@latest graphic templates
npx gamestage@latest graphic create kickoff --template bigscreen --consent
npx gamestage@latest graphic list kickoff
npx gamestage@latest graphic remove kickoff <id>
```

What comes back is a web address. Open it on the screen; it needs no sign-in
and it redraws by itself as fans play.

| Template | Made for |
| --- | --- |
| `bigscreen` | A stadium screen or a Jumbotron. Ten rows at large type. The default |
| `lowerthird` | A lower third over live video, for TV and streaming. Transparent and keyed |
| `panel` | A right-hand panel pulled out over the picture, for TV and CTV |
| `vertical` | A portrait panel in a concourse, 9:16 |
| `promo` | A QR code that sends a crowd to the game. No live data |

**The game must be deployed first, and the refusal is not a fault.** A
leaderboard graphic follows the game's own feed and a QR code sends people to
the game's own page. Neither exists before a deploy, so `graphic create` on an
undeployed game is refused with `This game has not been deployed`. Deploy, then
create.

**`--consent` is the developer's to give, never yours.** A leaderboard puts
fans' names on a screen other people can see, and the account that runs the
command is recorded as having confirmed those people agreed to that. You cannot
know whether they did. So hand the command over with the flag on it and let the
developer run it, exactly as you would `gamestage promote`. There is no
`--json` route around this and there will not be one: a confirmation produced
as a side effect of an agent running a command is a record saying somebody
agreed when nobody was asked.

**The structure is Monterosa's and the paint is the creator's.** You cannot add
a graphic type or move a column. What you can change is the styling:
`gamestage graphic dev` serves the real renderer on the developer's machine
against a made-up board, and `gamestage graphic push <game>` hands a producer
the published address of the stylesheet. See
`https://gamestage.ai/docs/live-graphics.md`.

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

`gamestage link github` still needs a person: it is the same device flow. It
stopped being a first deploy's gate on 2026-09-15 and nothing is blocked
without it, so hand it over only if a refusal actually names it. Approval of a registered
account is ours to give, not yours to wait out. `gamestage suspend`, `wake` and
`archive` change what a live audience can reach. `gamestage promote` is the same family and the largest of them: it
approves a game to move from dev to prod, which is a real audience's game
changing under them. None of these is yours to approve alone. Stop and hand
over the exact command and its consequence.

`gamestage graphic create --consent` is one of these. The flag says the fans
named on the board agreed to appear on a public screen, and the account running
it is recorded as having said so. Hand over the whole command and let them run
it.

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

A playground link that answers 403 AccessDenied means the page's files were
never uploaded, not that the game is waiting for approval. `gamestage promote`
will not fix it: promote moves the game from dev to prod and has nothing to do
with whether its page loads. Redeploy from the game's folder with
`gamestage deploy <game> --dir .`, then open the link again.

## Where the detail is

* `https://gamestage.ai/start.md`: the full entry point.
* `https://gamestage.ai/schemas/app-manifest/1.0`: the manifest schema, which describes the game and holds no round.
* `https://gamestage.ai/docs/migration.md`: the full migration route.
* `https://gamestage.ai/docs/game-formats.md`: whether this needs an Engine at all, and if so which rule fits. Read the first section before the decision guide: a game whose answer does not have to be computed from data a fan cannot see is a plain Monterosa element and needs none of this.
* `https://gamestage.ai/docs/player-api.md`: the browser integration contract.
* `gamestage <command> --help` for any command.
