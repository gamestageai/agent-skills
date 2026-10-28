# Gamestage

Gamestage provides game engines, hosting and tools for browser games. Build with your preferred coding agent, use your own design and content, and connect the game to Gamestage for data, scoring and live operation.

For games with a correct answer, the answer and marking sit on the server,
not in the page. This is designed to stop a player reading the answer from
the page or editing their score.

Most arcade games rely on gameplay in the browser. There is no correct answer
to hold back, so the Arcade Engine applies mitigations that make the game more
secure: it starts and times runs on its own clock, issues a seed, accepts one
score per run, refuses reused runs and scores without runs, and checks scores
against run length and configured limits. Runs per fan per day can be capped,
limits stay fixed for an edition, and moderators can void runs. A fair-looking
score inside the limits is accepted. Use checked boards without prizes until
planned server replay ships. See [Arcade](https://gamestage.ai/docs/game-formats#arcade).

Monterosa makes reasonable efforts to prevent common forms of cheating, gives
no guarantee, and the [terms](https://gamestage.ai/terms) apply.

This repository holds the instructions your coding agent reads.

## Install the instructions

In Claude Code, add the marketplace:

```text
/plugin marketplace add gamestageai/agent-skills
```

Then install the plugin from your terminal:

```sh
claude plugin install gamestage@gamestage
```

Or install the skill for your coding agent:

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
npx gamestage@latest start
```

Use Node 22.13 or later. Start with `npx gamestage@latest`, then pin a version
for reproducible builds in CI, for example `npx gamestage@0.52.0 --json manifest validate gamestage.yaml`.

## Migrate a game

Hand your agent the game you already have. It reads the instructions, looks at
what you built, and connects it to the Engine for its format.
Your page keeps its own look and its own code.

The command line tool reports what it finds and checks the result, and it never
edits your source. Your agent makes the changes.

## Start a new game

Formats: Solve, Push Your Luck, Find the Groups, Predict, Bingo, Kicker, Place the Face, Mystery, Arcade.
Word guess, number guess and phrase solve are Solve variants, not separate formats.

```sh
npx gamestage create
```

That scaffolds a starting page for the format you choose. Start there rather
than from a game you have seen on gamestage.ai: those are ours, and they are
not templates.

## Get an account

Reading the instructions, looking at a prototype, scaffolding a manifest and
checking it all run on your own machine and need no account.

Deploying needs one, and it has to be approved first. `npx gamestage login`
creates the account if you do not have one, and tells you whether you have been
approved yet. Until you have been, `deploy` refuses and says so.

## What is not in this repository

The Engine that marks a play, the service that holds your account, the management
screens, the website, and the source of the command line tool. None of those are
open source. What is here is what your agent reads.

Documentation: <https://gamestage.ai/docs>

---

Pack version 2026-10-28-1.
