# PR rules

Applies to every PR command (create, view, edit, merge, comment, etc.).

## Output

- Keep the response condensed. State the action and result in as few words as possible.
- No narration of reasoning, no restating content already visible in the tool output.

## Scope

- A PR shall only include related work: one feature/area (e.g. sync, a specific set of components) or one logically tied class of change (e.g. renaming, refactoring, redesign, global cleanup) — not a mix.
- If the set of changes to include is ambiguous (spans unrelated areas or mixes a feature with cleanup/refactor), ask whether it should be split into separate PRs before creating it.

## Description

- Quick and concise overview of what the PR is about.
- Call out only the big decisions (e.g. "created new page for X", "added new table for Y", "added backend controller/service/repo for Z") — not an exhaustive list of every component or file touched.
- Enough for a reader to understand everything meaningful that was done, without needing to read the diff.
- Never include a "Generated with Claude Code" line or any AI attribution line/footer in the PR description.

## `git fastPR`

When the user types `git fastPR` in chat, do all of the following in one go, following the rules above and `.claude/rules/git.md`:

1. Stage only the files impacted by the current task (per `git.md` staging discipline).
2. Commit.
3. Push the branch.
4. Open a PR (respecting PR scope/description rules above).
5. Merge the PR.
