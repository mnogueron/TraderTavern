# Project instructions

## Git commits
- Never add a `Co-Authored-By` line (or any AI co-author attribution) to commit messages.

## Secrets / .env files
- HARD RULE: never commit, stage, or push a `.env` file (or any file containing real secrets/API keys/credentials). Only `.env.local` and `.env.example` may be committed, and only if they contain no real secret values (placeholders/dummy values only).
- `.env` is excluded via `.gitignore`. Do not remove or weaken that rule.
- Whenever a file containing environment variables is read, edited, or analysed, double-check twice: (1) is this file gitignored, and (2) does it contain a real key/secret that would become visible in the repo/git history if committed. If unsure, treat it as unsafe to commit and flag it to the user before staging.
