# Project instructions

## Overview
TraderTavern is a stock market screener and portfolio-tracking app: a NestJS API syncs ticker/financial data from Yahoo Finance into MongoDB, and a React Router frontend lets users screen, watch, and inspect tickers.

## Architecture
Nx monorepo (npm workspaces) with three main projects:
- `apps/TraderTavern` — frontend, React 19 + React Router v7 + TanStack Query/Table + Tailwind v4 + shadcn/base-ui components.
- `apps/api` — backend, NestJS + Mongoose (MongoDB), scheduled sync jobs against Yahoo Finance, JWT auth.
- `packages/api-client` — generated TypeScript client (OpenAPI, built with Rslib) shared between frontend and backend; regenerated from the API's OpenAPI spec, not hand-edited.

`apps/TraderTavern-e2e` and `apps/api-e2e` hold Playwright/e2e tests for their respective apps.

## Hard no rules
- Never commit, stage, or push a `.env` file or any file containing real secrets/API keys/credentials. Only `.env.local` and `.env.example` may be committed, and only with placeholder values.
- Never add a `Co-Authored-By` line or any AI co-author attribution to commit messages.
- Never commit directly to `main` — always create/switch to a new branch first.
- Never let internal DB/backend entities leak into API responses (see API design rule below).

## Git commits
- Always create and switch to a new branch before starting work if the current branch is `main`.
- Commit after each big implementation step (a completed feature module, migration, or self-contained chunk of a plan), unless the user asks to work differently (e.g. pausing for manual review between steps).

## Secrets / .env files
- `.env` is excluded via `.gitignore`. Do not remove or weaken that rule.
- Whenever a file containing environment variables is read, edited, or analysed, double-check: (1) is this file gitignored, and (2) does it contain a real key/secret that would become visible in the repo/git history if committed. If unsure, treat it as unsafe to commit and flag it to the user before staging.

## API design — private vs public entities
Always separate DB/backend entities from API response types. Never let internal models leak into responses.
- **Private** (DB layer): contains `_id`, foreign keys, join artifacts, relational data from other users.
- **Public** (API response): a conservative subset — only what the current authenticated user owns or needs.
- Aggregated user-specific state (e.g. `isViewed: boolean`) must be computed server-side during the main fetch and embedded in the response type — never as a separate endpoint that exposes raw relational data.
- Define an explicit response type (e.g. `JobOfferResponse`) for every API endpoint; verify nothing private leaks before shipping.
- Review entity boundaries at the start of every new plan or feature.

## Documentation — load only what's relevant to the task
Do not load a stack's doc unless you are actually working in that stack. A pure frontend task should not pull in backend context, and vice versa.
- Working on the frontend (`apps/TraderTavern`)? Read `docs/claude/frontend.md`.
- Working on the backend (`apps/api`)? Read `docs/claude/backend.md`.
- Working on the API client (`packages/api-client`) or wiring frontend/backend through it? Read `docs/claude/api-client.md`.

## Market trading days
Yahoo's chart-meta endpoint (the only automatic market-hours discovery source) never exposes which days of the week a market trades, only session times. `apps/api/src/finance/constants/trading-days.ts` is therefore a hand-maintained list: everything defaults to Mon-Fri, and non-Mon-Fri markets (e.g. Tel Aviv's Sun-Thu week) must be added manually to `TRADING_DAYS_OVERRIDES`. When onboarding a new market whose week doesn't match Mon-Fri, add it there — it cannot be fetched automatically.
