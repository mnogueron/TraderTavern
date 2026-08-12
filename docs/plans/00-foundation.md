# Milestone 00 — Foundation

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** —
**Status:** Not started

## User story

As a developer relearning fullstack development, I want to scaffold the monorepo and its shared tooling myself, so that I've practiced setting up a real project from an empty directory rather than inheriting one.

## What to decide and build yourself

- **Initialize the repo as an Nx monorepo** — `npx create-nx-workspace@latest` (npm as the package manager, no pnpm/yarn). This is new versus a bare npm-workspaces layout: spend time actually exploring what Nx gives you over plain workspaces (generators, task caching, `nx graph` for visualizing dependencies) before treating it as just another `package.json` trick.
- Decide the app/package layout inside the monorepo (`apps/*`, `libs/*` or `packages/*`) and how `web`, `api`, and `scraper` will be scaffolded as separate deployables.
- Decide how shared TypeScript contracts (interfaces/enums used by both frontend and backend) will be consumed — as an Nx library, path aliases, or something else — and why.
- Stand up local dev infrastructure (Mongo, Redis) via Docker Compose.
- Pick a testing approach per app and get one placeholder test running in each.
- Set up CI (e.g. GitHub Actions) to run install/lint/build/test on push — decide what "green" should mean before you have real code to break.

Out of scope here: `git init` — do that yourself before starting.

## Reference notes (peek only if stuck — try your own design first)

These reflect earlier research/decisions and are a reasonable starting point, not a mandate:

- Root `package.json` with npm workspaces (`workspaces: ["apps/*", "packages/*"]`) — **no pnpm/yarn**. (With Nx, this becomes Nx-managed but still npm underneath.)
- `.nvmrc` / `engines.node` pinned to **Node 24**
- Empty `apps/web`, `apps/api`, `apps/scraper` scaffolds
- `packages/shared-types` (Bot / NotificationChannel / MarketDataProvider interfaces, `AssetClass`/`MarketRegion`/`RunStatus` enums — kept asset-class-agnostic now even though only equities are in scope, so options/futures/crypto can be added later without a rearchitecture). **Consumed as TS source directly** (project references / path aliases, or an Nx library) by both `apps/web` and `apps/api`, not a separately-compiled `dist` — one common set of types, no build-step drift between frontend and backend.
- `packages/config` (shared eslint/tsconfig/prettier)
- `docker-compose.dev.yml` stub — Mongo and Redis pinned to `mongo:7` / `redis:7-alpine`, with **named volumes** for dev data persistence (acceptable to `docker compose down -v` / manually clean volumes when a reset is needed)
- **Testing:** Vitest for `apps/web` (React); NestJS's built-in testing module (`@nestjs/testing`) for `apps/api`/`apps/scraper` — set up scaffolding/config for both now so later milestones can add tests as part of their own verification steps.
- **CI:** GitHub Actions workflow running install/lint/build/test on push and PR against `apps/*` and `packages/*`.

## Definition of done

- `npm install` succeeds at the workspace root.
- Each app scaffold builds/lints clean.
- `docker compose -f docker-compose.dev.yml up mongo redis` starts both containers with named volumes attached.
- A placeholder test passes via `vitest run` in `apps/web` and via Nest's test runner in `apps/api`.
- GitHub Actions workflow runs green on a trivial push.
- You can explain, in your own words, what Nx is doing for you that plain npm workspaces wouldn't.
