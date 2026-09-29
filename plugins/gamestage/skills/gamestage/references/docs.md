# Where the facts are

Part of the Gamestage skill, pack version 2026-09-29-6. Read it when the person asks something with a definite answer: which formats exist, what a command or field does.

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

## Where the detail is

* `https://gamestage.ai/start.md`: the full entry point.
* `https://gamestage.ai/schemas/app-manifest/1.0`: the manifest schema, which describes the game and holds no round.
* `https://gamestage.ai/docs/migration.md`: the full migration route.
* `https://gamestage.ai/docs/game-formats.md`: whether this needs an Engine at all, and if so which rule fits. Read the first section before the decision guide: a game whose answer does not have to be computed from data a fan cannot see is a plain Monterosa element and needs none of this.
* `https://gamestage.ai/docs/player-api.md`: the browser integration contract.
* `gamestage <command> --help` for any command.
