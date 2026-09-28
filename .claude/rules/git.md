# Git rules

Applies to every git command (status, diff, add, commit, branch, push, PR, merge, etc.).

## Staging discipline (hard rule)

Before any commit, check `git status` and identify exactly which files are impacted by the current task.

- Stage only those files, always by explicit path (`git add <file> <file> ...`). Never `git add -A` / `git add .` / `git add -u`.
- Never commit unrelated modified, staged, renamed, or untracked files left over from other in-progress work, even if they were already staged before you started.
- If unrelated changes are already staged, unstage them (`git reset -- <file>`) before committing — don't touch their content, don't `git reset --hard`/`git clean`/discard anything.
- Verify with `git diff --cached --stat` (or equivalent) that only the intended files are staged before running `git commit`.
- Each commit must contain only the files impacted by the task at hand — nothing else.

## Output

- Keep the response condensed. State the action and result in as few words as possible.
- No narration of reasoning, no explaining what was found or why before doing it.
- No restating file names/diffs already visible in the tool output.
- One short line per action is enough, e.g. "Unstaged 3 unrelated renames, committed docs only." Skip entirely if the action is self-evident from the tool call.
