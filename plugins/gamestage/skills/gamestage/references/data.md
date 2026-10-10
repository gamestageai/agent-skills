# Data and sources

Part of the Gamestage skill, pack version 2026-10-10-2. Read it when the person says yes to seeing the data, or the game scores against figures.

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
