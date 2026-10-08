# Consent, measurement and checks

Part of the Gamestage skill, pack version 2026-10-08. Read it before the game records anything, and before you call it finished.

## Name the four moments worth measuring, and nothing else

Analytics needs no work from you. **Monterosa Analytics is on by default and
captures a fan's activity without a single line in the game**: clicks, views and
submissions are trapped from the page itself and translated, so a game that
never calls anything still reports. Do not add a tracking library, and do not
ask the human for an analytics account.

What that gives them is activity. What it cannot give them is meaning. A trapped
click knows a button was pressed and its label; it does not know the fan went
over the limit, or ran out of guesses on the last one, or came back a second day
and finished. Those are the questions a creator actually asks, and they are the
ones only the game can answer.

So name a few. Four is usually the whole list, and more is worse:

```js
game.track("round_started", { round: round.number });
game.track("round_finished", { outcome: result.outcome, score: result.score });
game.track("attempt_spent", { remaining: state.attempts_allowed - state.attempts_used });
game.track("gave_up", { at: state.progress });
```

**Name the moment, not the mechanism.** `round_finished` with an `outcome`
survives you rewriting the board; `clicked_submit_button_v2` does not, and a
creator reading a chart six months later cannot tell what it meant. The name is
the thing a person would say out loud about their own game.

**Never put a solution in a property.** A tracked event leaves the browser and
goes to a third party. `{ answer: "jokic" }` in an event is the same leak as
`{ answer: "jokic" }` in the page, and everything else this pack says about
keeping solutions server-side applies here unchanged. Send the outcome, never
the thing that decided it.

**Do not gate it on consent yourself.** The client holds one consent gate in
front of every destination, fed by the consent banner described below, and an event refused by it is refused everywhere at
once. A second check in the game is a second thing to get wrong, and a game that
withheld its own events would report less than the fan agreed to.

If the human asks for PostHog or Google Analytics, those are switches on their
Analytics screen rather than code you write: the same captured stream is routed
to them, so turning one on needs no change to the game and no redeploy. Say so
rather than writing an integration.

## Every game asks for consent before it records anything

**A game must ask a fan before anything records them, and `deploy` refuses a
game that does not.** The Gamestage client asks for you: it draws a consent
card with Accept, Reject, Manage preferences and a × the moment the page
connects, whenever nobody has answered yet, in the game's own colours and
type, floating clear of the game's pill nav and pinned main button. The game stays playable underneath it. Leave it on. You write no consent
code.

**Ask the human two things before the first deploy, and put both in
`gamestage.settings.json`**: the brand the banner names as asking
(`consent_brand_name`, e.g. "Arsenal"), and the address of their privacy
policy (`privacy_policy_url`, https). `verify` fails and `deploy` refuses
while either is empty. Never invent either one, and never copy "Monterosa"
from a Gamestage sample: that name and https://monterosa.co/privacy-policy are
right only on Monterosa's own games.

```js
const game = await gamestage.start({
  consentBanner: { settingsIn: document.querySelector("footer") },
});
```

`settingsIn` puts the "Privacy settings" button where a fan will find it, such
as the Profile screen or beside a bottom nav. Without it the banner pins a
small pill in the bottom corner of the screen, so every game has a way back to
the choices. Pass it in a game with a bottom nav, where the corner is taken.
In a Gamestage UI game, use the `consent` component and pass
`consentBanner: false`, because the component draws the same banner itself.

**The fan's answer is one object, `game.consent.record()`**: the categories
`necessary`, `analytics`, `marketing` and `functional`, who decided (`host`,
`fan` or `default`), when, and the producer's policy version. Every gate in the
client reads it: analytics, storage and Monterosa Analytics all wait for a yes.

**An app that embeds the game has usually asked already, and the game then
never asks again.** A Monterosa SDK host calls `setConsentState` from
`@monterosa/sdk-consent-kit` in its own page and the answer reaches the game.
A host without the SDK posts it into the frame:

```js
frame.contentWindow.postMessage(
  { type: "gamestage:consent", categories: { analytics: true, marketing: false, functional: true } },
  new URL(frame.src).origin,
);
```

The host's answer always beats the game's banner.

**The words are the producer's**, in Studio under Wording (`consent_title`,
`consent_accept_label` and the rest), and `consent_policy_version` asks every
fan again when the privacy policy changes. Do not hard code them.

**Never turn the banner off and ask nobody.** `gamestage verify` loads the game
as a new fan and fails it if analytics leaves the page before the fan answers,
if no consent control appears, or if anything is sent after they say no.
`gamestage deploy` runs the same check before it publishes a single file.

## Offer the accessibility, security, secrets and privacy checks

Gamestage does not test a game's accessibility, security or privacy, and does
not certify them. After its verdict, `verify` lists four checks worth running
and says which the developer has recorded. Offer them before a game goes in
front of fans; do not run one without asking, because installing a skill
changes the developer's machine.

| Check | Run it with |
| --- | --- |
| Accessibility | `npx skills add addyosmani/web-quality-skills@accessibility` |
| Security review | `npx skills add getsentry/skills@security-review` |
| Secrets | `gitleaks detect --source .` |
| Privacy | `npx skills add wshobson/agents@gdpr-data-handling` |

When one has run, record it under `assurance:` in `gamestage.yaml` with `tool`,
`ran_at` (`YYYY-MM-DD`) and `result` (`passed`, `issues_fixed` or
`issues_open`), plus `owner` and `evidence` if the developer gives them. Record
what happened, including open issues: the record is the developer's, it shows
on the game's page in Stage, and it never affects `verify`, `deploy` or the
build stage, so there is nothing to gain by rounding it up. Fields:
`https://gamestage.ai/docs/app-manifest.md`.
