# Account, sign-in and handoffs

Part of the Gamestage skill, pack version 2026-09-29-5. Read it when a command needs an account, refuses, or needs a person to approve something.

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
