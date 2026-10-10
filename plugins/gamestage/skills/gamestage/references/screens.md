# Big screens

Part of the Gamestage skill, pack version 2026-10-10-2. Read it when the leaderboard or a graphic goes on a screen a crowd can see.

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

## Put a live contest into the game

Live data puts a real contest into a game as it happens, in any sport: the
score, the clock, each side's numbers and every moment, seconds after it
happens. Offer it when the game is about a contest that is being played: a
prediction that settles itself, a scoreboard, a momentum chart. Say contest,
moment and side; never match or goal in anything the developer's fans read,
because the same game may follow a race.

```
npx gamestage@latest live on
npx gamestage@latest deploy <game> --dir .
```

`live on` adds `live: { provider: sportmonks }` to `gamestage.yaml` and changes
nothing else. After the deploy, each edition has a **Live contest** setting in
Studio, where a producer types the provider's id for the contest. In the page,
`game.live()` hands it over: `contest.on("state", draw)` for the contest so far
and every change, `contest.on("moment", celebrate)` for what happens from now
on, and `contest.onStatus(badge)` for the connection. Draw a moment that
arrived as part of the contest so far in the score; never celebrate it.

`gamestage dev --serve` plays a made-up contest, so build and test it locally
with no key. Live data is open to Monterosa workspaces today, and a deploy from
any other is refused with `live_not_enabled`: say so plainly and offer the game
without it. See `https://gamestage.ai/docs/live-data.md`.
