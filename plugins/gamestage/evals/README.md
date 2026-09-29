# Gamestage skill evals

Behaviour tests for the Gamestage Claude Code plugin, run with
`claude plugin eval`. GS-606.

Run them from the repo root with `node scripts/skill-eval.mjs`, which builds the
plugin from this tree into a temporary folder, copies these cases in, and runs
them. Add `--with-bash` on a machine where Claude Code's eval sandbox can grant
Bash, so the first-reply case runs `start` rather than naming it; this Mac
cannot, because its AWS config uses `credential_process`. Each run is a real Claude session on your own credential, so it costs
money and is not part of `./qa`.

| Case | What it proves |
| --- | --- |
| `quiz-prototype-first-reply` | "I have a quiz prototype" loads the skill, runs or names `start --json`, gives the sign-in line and asks before touching anything |
| `unrelated-request-no-trigger` | A request with nothing to do with games does not load the skill |
| `new-game-formats-and-data` | "Make a new game" leads to the formats and the data offer, and the agent does not pick a format |
| `hosted-login-no-terminal` | In a host with no terminal, the agent signs the person in itself and never asks them to run a command |
| `first-reply-two-questions` | A new-game request gets at most two questions, no format table, and no "do you have a game already?" |
| `consent-reads-reference` | A consent question reads `references/compliance.md` rather than answering from the core file |

The same folder is copied into the published plugin as `evals/`, so anybody can
run `claude plugin eval plugins/gamestage` against what they installed.
