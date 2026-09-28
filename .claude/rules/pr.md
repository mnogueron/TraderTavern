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
