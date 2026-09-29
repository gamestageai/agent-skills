---
type: llm
---

PASS if the final message does all three: says whether the person is signed in to Gamestage, or, when it could not run commands, gives them `npx gamestage@latest start --json` or `npx gamestage@latest login` to find out; asks where their game is or whether they have one; and stops there to wait for their answer.
FAIL if it scaffolds a new game, edits or creates files, picks a format for them, or carries on with the migration without asking. Offering to make edits later, once they answer, is not a failure.
