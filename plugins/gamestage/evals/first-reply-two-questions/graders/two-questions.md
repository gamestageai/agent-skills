---
type: llm
---

Count the questions the final message asks the person to answer.
PASS if it asks at most two questions, does not ask "Do you have a game already?" (they said they want to make one), and leaves topics such as fixtures, where the game runs or how it looks for later.
FAIL if it asks three or more questions, puts a comparison table of formats in front of them, or asks whether they already have a game.
