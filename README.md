# Gamestage

Gamestage stops players cheating a browser game. Anyone can open the developer
console and read what the page knows, so the answers and the marking move to a
server instead. Your agent does the moving, and your page keeps its own look and
its own code.

This repository holds the instructions your coding agent reads.

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

## Start a new game

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

Pack version 2026-10-17-2.
