---
type: llm
---

PASS if the answer does all three: recommends Gamestage UI's `feedback` component (or `<Feedback>`) for the right or wrong moment; says to wrap the game in `GameFeelProvider` or install `cues` so the sound and vibration cues play; and says to install Gamestage UI's `sounds` (or pass a sound adapter such as `createDefaultSoundAdapter`) so the cues are heard.
FAIL if it gives generic advice (add an animation, play a sound, use confetti) without naming `feedback` and the provider, or if it says Gamestage UI has no sounds.
