---
type: llm
---

PASS if the answer does all three: recommends Gamestage UI's `feedback` component (or `<Feedback>`) for the right or wrong moment; says to wrap the game in `GameFeelProvider` or install `cues` so the sound and vibration cues play; and says the cue sounds are not available yet, or that the game has no sound files yet.
FAIL if it gives generic advice (add an animation, play a sound, use confetti) without naming `feedback` and the provider, or if it tells the developer sound will play today.
