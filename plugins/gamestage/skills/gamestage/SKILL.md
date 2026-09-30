---
name: gamestage
description: "Take a browser game to production with Gamestage, which moves answers, scoring and settlement behind a server the player cannot edit. Use when someone wants to port or build a browser game with Gamestage, when a gamestage.yaml is present, or when Gamestage is mentioned."
version: 2026-09-30-2
---

# Gamestage

Pack version 2026-09-30-2.
Pack digest 905467fdd5d5aca2.

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

Put tomorrow's round in tomorrow's edition, never as a draft inside today's.
The Engine serves no round before its edition opens, so a future edition is the
way to prepare a round without fans seeing it.

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

## Read these when the task needs them

The rest of the instructions are in `references/`, beside this file. Read one when
its moment comes, not before. A section named in this file that is not in it is in
one of these.

| File | Read it | Sections |
| --- | --- | --- |
| `references/formats.md` | before you suggest a format, build a new game, or add rounds and reasons to come back | Ask what the game is before you build one; A game may hold more than one round, and a fan can be sent to the next; Design a game fans come back to |
| `references/data.md` | when the person says yes to seeing the data, or the game scores against figures | Ask what data the game needs, and offer the sources that exist |
| `references/look.md` | before you build or restyle the interface, or draw any asset | Ask how the game should look, when you are building its interface; Before you draw an asset, check the third-party registry |
| `references/build.md` | while you wire the page to Gamestage: loading, reconnection, returning players and the producer's settings | Ask where the game runs, and make it load smoothly and fast; Give anonymous players a way back to their progress; Build the loading state and the reconnection handling; Wire the producer's settings while you wire the client |
| `references/compliance.md` | before the game records anything, and before you call it finished | Name the four moments worth measuring, and nothing else; Every game asks for consent before it records anything; Offer the accessibility, security, secrets and privacy checks |
| `references/account.md` | when a command needs an account, refuses, or needs a person to approve something | Where the account sits in the journey; Human handoffs |
| `references/screens.md` | when the leaderboard or a graphic goes on a screen a crowd can see | Put the leaderboard on a screen a crowd can see |
| `references/docs.md` | when the person asks something with a definite answer: which formats exist, what a command or field does | A factual question is answered by the hosted doc, in one hop; Where the detail is |
| `references/install.md` | when the person asks how to install or update Gamestage, or this copy may be stale | Install this pack; First, check this pack is current |
