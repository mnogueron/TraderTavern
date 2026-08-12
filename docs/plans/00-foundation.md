# Sub-Plan 00 — Foundation

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** —
**Status:** Not started

## Goal

Monorepo skeleton, shared contracts, base tooling — nothing functional yet, but everything else builds on it.

## Components

- Root `package.json` with npm workspaces (`workspaces: ["apps/*", "packages/*"]`) — **no pnpm/yarn**
- `.nvmrc` / `engines.node` pinned to **Node 24**
- Empty `apps/web`, `apps/api`, `apps/scraper` scaffolds
- `packages/shared-types` (Bot / NotificationChannel / MarketDataProvider interfaces, `AssetClass`/`MarketRegion`/`RunStatus` enums — kept asset-class-agnostic now even though only equities are in scope, so options/futures/crypto can be added later without a rearchitecture). **Consumed as TS source directly** (project references / path aliases) by both `apps/web` and `apps/api`, not a separately-compiled `dist` — one common set of types, no build-step drift between frontend and backend.
- `packages/config` (shared eslint/tsconfig/prettier)
- `docker-compose.dev.yml` stub — Mongo and Redis pinned to `mongo:7` / `redis:7-alpine`, with **named volumes** for dev data persistence (acceptable to `docker compose down -v` / manually clean volumes when a reset is needed)
- **Testing (confirmed with user):** Vitest for `apps/web` (React); NestJS's built-in testing module (`@nestjs/testing`) for `apps/api`/`apps/scraper` — set up scaffolding/config for both now so later sub-plans can add tests as part of their own verification steps.
- **CI (confirmed with user):** GitHub Actions workflow running install/lint/build/test on push and PR against `apps/*` and `packages/*`.

**Out of scope (confirmed with user):** git repository initialization — the user will `git init` the project themselves before implementation starts.

## Verification

- `npm install` succeeds at the workspace root.
- Each app scaffold builds/lints clean.
- `docker compose -f docker-compose.dev.yml up mongo redis` starts both containers with named volumes attached.
- A placeholder test passes via `vitest run` in `apps/web` and via Nest's test runner in `apps/api`.
- GitHub Actions workflow runs green on a trivial push.
