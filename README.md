# Gamestage

Gamestage stops players cheating a browser game. Anyone can open the developer
console and read what the page knows, so the answers and the marking move to a
server instead. Your agent does the moving, and your page keeps its own look and
its own code.

This repository holds the instructions your coding agent reads, and one worked
example of each game format.

## Install the instructions

```sh
npx skills add gamestageai/agent-skills
```

That writes `SKILL.md` into your coding agent's instructions. The site serves the
same file, if you would rather install from there:

```sh
npx skills add https://gamestage.ai/skill
```

Then start:

```sh
npx gamestage start
```

There is no `gamestage` command on your PATH. Everything runs through `npx`, so
you get the current version each time.

## Migrate a game

Hand your agent the game you already have. It reads the instructions, looks at
what you built, and moves the answers and the scoring onto the Gamestage Engine.
Your page keeps its own look and its own code.

The command line tool reports what it finds and checks the result, and it never
edits your source. Your agent makes the changes.

## Read an example

There are six, one per format, and each one is live on gamestage.ai.

| Example | Format | What a player does |
| --- | --- | --- |
| [`examples/ringers`](examples/ringers) | `hunt` | Find the four players who match the clue. |
| [`examples/wagebill`](examples/wagebill) | `push` | Spend up to the cap without going over. |
| [`examples/hidden-fours`](examples/hidden-fours) | `group` | Sort sixteen tiles into four groups. |
| [`examples/calledit`](examples/calledit) | `predict` | Call it before the world decides. |
| [`examples/fulltime`](examples/fulltime) | `bingo` | Nine things that might happen. Lock your board. |
| [`examples/penalties`](examples/penalties) | `shoot` | Five penalties, three goals to win. |

Each one carries its `gamestage.yaml` and its page. Two things to know before you
copy one.

* **Change the `id` in `gamestage.yaml`.** It names the live game the example came
  from, and ids are not scoped to a workspace yet, so an unchanged copy points at
  a game that is not yours. `npx gamestage create` writes you a new one.
* **The client library is not in this repository.** Each page loads it from
  `gamestage.ai/client/0.51.0/gamestage.js`, which is what a real
  deploy writes. That way your game cannot end up running a library older than the
  service it is talking to.

## Get an account

Reading the instructions, looking at a prototype, scaffolding a manifest and
checking it all run on your own machine and need no account.

Deploying needs one, and it has to be approved first. `npx gamestage login`
creates the account if you do not have one, and tells you whether you have been
approved yet. Until you have been, `deploy` refuses and says so.

## What is not in this repository

The Engine that marks a play, the service that holds your account, the management
screens, the website, and the source of the command line tool. None of those are
open source. What is here is what your agent reads, and the examples it learns
from.

Documentation: <https://gamestage.ai/docs>

---

Pack version 2026-09-15. Built from the Gamestage monorepo by
`scripts/build-public-repo.mjs`. Do not edit this repository by hand.
