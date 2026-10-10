# Installing and staying current

Part of the Gamestage skill, pack version 2026-10-10-2. Read it when the person asks how to install or update Gamestage, or this copy may be stale.

## Install this pack

```sh
npx skills add https://gamestage.ai/skill
```

This writes the current Gamestage instructions for the coding agent. It
installs nothing globally. Then orient with `npx gamestage start`.

**In the Claude app**, on the web or the desktop, there is no terminal: the
person adds the Gamestage plugin, which brings this pack and the connector
together. If you are in that chat and `list_games` is among your tools, they
have it already: install nothing.

1. In Claude, open Customize, then Plugins, then Add marketplace, then Add from
   a repository.
2. Paste `gamestageai/agent-skills`, press Sync, then install Gamestage.
3. Start a new chat. They sign in to Gamestage when Claude asks.

If Gamestage cannot make games in Claude, their copy of the plugin may be out of
date: Customize, then Plugins, then Add, then Manage marketplaces, then Check
for updates beside agent-skills.

If they cannot add plugins, the connector alone gives Claude the tools but not
this pack, so it guesses more: Customize, then Connectors, add
`https://gamestage.ai/mcp`. Custom connectors need a paid Claude plan.

## First, check this pack is current

This file was written into your host once, by the installer, and nothing
updates it on its own. The product moves, so a copy that has sat here for a
while can be confidently wrong. **Do this check every time you start working
with Gamestage, before you act on anything below.**

```sh
curl -fsSL https://gamestage.ai/agent.md | grep -m1 "Pack digest"
```

Compare it to the `Pack digest` line at the top of this file. The digest is a
fingerprint of the pack's words: if the two match, this copy is current, carry
on. If they differ, this copy is stale, whatever the dates say. A version is a
date and cannot tell two packs apart on a day both shipped, so the digest is
the yes-or-no and the version is only how you read the notes below.

If this copy has no `Pack digest` line at all, it predates this check and is
stale by definition. Treat that the same as a mismatch.

When the digest differs, or is absent here, do three things, in order:

1. **Fetch the release notes and read what changed since your version.**

   ```sh
   curl -fsSL https://gamestage.ai/agent-changelog.md
   ```

   Show the developer the entries dated after the version at the top of this
   file. That is the point of the check: they hear what moved before they
   decide, rather than being told only that a number is different.

2. **Suggest the update in one line**, naming the file you are reading this from
   and giving the command that rewrites it:

   ```sh
   # a Claude Code skill at ~/.claude/skills/gamestage/SKILL.md
   npx skills add https://gamestage.ai/skill

   # any host: this rewrites the Claude Code skill and the blocks the installer
   # put in ~/.codex/AGENTS.md, ~/.gemini/GEMINI.md and ~/.cursor/rules
   curl -fsSL https://gamestage.ai/install | bash
   ```

3. **Work from the version you fetched, not this one.** Do not guess at what
   changed; the release notes say.
