# Data and sources

Part of the Gamestage skill, pack version 2026-11-04-2. Read it when the person says yes to seeing the data, or the game scores against figures.

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
2. **A source you switch on for them: Fantasy Premier League or ESPN.** Free,
   no key, and we fetch it twice a day, so the numbers stay current through the
   season. `gamestage sources connect fpl` switches FPL on and prints the
   dataset's name, `fpl-premier-league`; `gamestage sources connect espn
   --league nba` does the same for ESPN. The first fetch lands within the hour.
3. **A source they could connect with their own key.** Say what it covers, what
   is free and what costs money, and give the sign-up link it printed. The
   developer signs up themselves; you do not.
4. **Their own data**, pushed with `gamestage reference push`. Always
   available, and the right answer when they hold the figures already.

**Never build your own copy of a source we fetch.** A dataset made with
`reference build` from the FPL or ESPN address and pushed by hand is one copy
that never refreshes: an FPL game built that way is wrong after the next
gameweek. Switch the source on instead.

**Then give the game its dataset, and its rounds.** Put the dataset's name in
`gamestage.settings.json` as `"reference_url": "fpl-premier-league"`; the next
deploy writes it into the game's Studio project, which is where a game reads
its dataset from. Then the rounds. A game that plays one round a day holds one round per edition: "How the
live round is chosen" is Calendar, the default. `round seed` adds rounds to
the current edition, which suits only a game set to Rotation; on a calendar
game the edition then holds two rounds and fans see "Come back tomorrow"
(GS-1446). So for a calendar game, `gamestage round seed <game> --count 1
--dry-run` drafts a round and writes nothing, and the developer, or their
producer, enters its players and its Measure in the round in Studio. For a
bank of rounds that rotate, set "How the live round is chosen" to Rotation in
Studio first, then `round seed --count 7` adds them. A push game with no dataset,
or no round, deploys and shows fans "Come back tomorrow", so check both before
you tell the developer it is live.

**Shape their own data with the CLI, not by hand.** When they have a file, a
spreadsheet export or an API address, run `gamestage reference inspect <file or
url>` first. It names the lists inside, the field to use as the key, the one
holding a name, and the fields holding numbers. Then `gamestage reference build
<file or url> --key <field> --measure <field> --label <field> --out
dataset.json`, `gamestage reference check dataset.json <keys>` with the keys
the round will use, and `gamestage reference push <name> dataset.json`. Write a
round's entry keys from what `inspect` printed, never from memory of a player's
name: a key the dataset does not hold is left out of its group, so that player
is never offered. A key for their
API goes in `--header`, typed by them in their own terminal, never pasted into a
chat.

`gamestage reference list` shows what the workspace already holds and which
games read it, and `reference status <name>` shows one dataset's measures,
the games that read it and the rounds built from it. Once the developer has connected a
source, `reference run <name>` pulls its dataset now and prints the entries,
measures and first keys that landed, so you can write entry keys from it
without waiting for the schedule. It never prints a value, and a dataset can
be pulled this way once every 15 minutes.
`reference download <name>` gives back a file they uploaded. Run `reference
delete` only when they ask you to remove a named dataset, and let them confirm
it.

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
