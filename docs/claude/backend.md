# Backend (`apps/api`)

Only load this doc when working inside `apps/api` (or `apps/api-e2e`).

## Tech stack
- NestJS (modules/controllers/services) on `@nestjs/platform-express`.
- MongoDB via Mongoose (`@nestjs/mongoose`), with a `repositories/` layer per feature module wrapping schema access.
- Auth via `@nestjs/jwt` + `bcryptjs`.
- Scheduled jobs via `@nestjs/schedule` (ticker/financial data sync from Yahoo Finance, `yahoo-finance2`).
- Validation/serialization via `class-validator` + `class-transformer` on DTOs.
- API docs via `@nestjs/swagger` + Scalar (`@scalar/nestjs-api-reference`) — this is also the source for the generated `packages/api-client` OpenAPI spec.
- DB migrations via `migrate-mongo` (`npx nx migrate-up/migrate-down/migrate-status api`).

## Directory layout
One folder per domain module (e.g. `finance`, `auth`, `user`, `watchlist`, `ticker-source`), each typically containing:
- `dto/` — request/response DTOs (validation + Swagger decorators).
- `schemas/` — Mongoose schemas (private, DB-shape entities).
- `repositories/` — data-access layer wrapping schema queries.
- `enums/`, `constants/`, `helpers/` — module-local support code.
- `*.controller.ts`, `*.service.ts` at the module root.

## Rules already established in this repo

### Private vs public entities (hard rule — repo-wide)
Never let Mongoose schemas / DB documents leak into API responses.
- **Private** (schemas/repositories): `_id`, foreign keys, join artifacts, other users' relational data.
- **Public** (DTOs returned from controllers): a conservative, explicit response type per endpoint (e.g. `TickerSummary.dto.ts`, `SyncHistoryListItem.dto.ts`) — only what the current authenticated user owns or needs.
- Compute aggregated user-specific state (e.g. `isViewed`) server-side during the main fetch and embed it in the response DTO — never expose it via a separate endpoint that leaks raw relational data.
- Review entity boundaries (what's private vs public) at the start of every new plan or feature touching this module.

### Trading days
`apps/api/src/finance/constants/trading-days.ts` is a hand-maintained list of non-Mon-Fri markets (`TRADING_DAYS_OVERRIDES`), because Yahoo's chart-meta endpoint never exposes which weekdays a market trades. When onboarding a new market whose week isn't Mon-Fri (e.g. Tel Aviv's Sun-Thu week), add it there manually — it cannot be discovered automatically.

### Codegen after DTO/controller changes
Any change to a DTO or controller under `apps/api/src/...` requires regenerating the API client: `cd packages/api-client && npm run generate` (rewrites `openapi.yaml` and `api.d.ts`), then typecheck the frontend that consumes it. Do this once per logical DTO change, not per small edit — see `docs/claude/api-client.md`.

### Local environment quirks (macOS/zsh, this repo)
- There is no local `mongosh` binary. Use `docker exec tradertavern-mongo-1 mongosh ...`, or a Node script requiring `mongodb`/`mongoose` with the absolute path to `node_modules` (relative resolution fails depending on `cwd`).
- The `timeout` shell command does not exist. Background the process and poll instead.
