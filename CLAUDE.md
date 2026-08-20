# Project instructions

## Git commits
- Never add a `Co-Authored-By` line (or any AI co-author attribution) to commit messages.
- Always create and switch to a new branch before starting work if the current branch is `main` — never commit directly to `main`.
- Commit after each big implementation step (e.g. a completed feature module, migration, or self-contained chunk of a plan), unless the user has asked to work differently (e.g. pausing for manual review between steps before committing).

## Secrets / .env files
- HARD RULE: never commit, stage, or push a `.env` file (or any file containing real secrets/API keys/credentials). Only `.env.local` and `.env.example` may be committed, and only if they contain no real secret values (placeholders/dummy values only).
- `.env` is excluded via `.gitignore`. Do not remove or weaken that rule.
- Whenever a file containing environment variables is read, edited, or analysed, double-check twice: (1) is this file gitignored, and (2) does it contain a real key/secret that would become visible in the repo/git history if committed. If unsure, treat it as unsafe to commit and flag it to the user before staging.

## Frontend design direction
The TraderTavern frontend should read as a modern financial dashboard: dense, data-first layouts; tabular numbers and clear alignment in tables; a restrained, mostly-neutral palette with color reserved for meaningful signal (gains/losses, status, roles); minimal decoration. Prioritize data readability over visual flourish in every screen, not just tables.
