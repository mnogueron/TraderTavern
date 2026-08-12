# Investment Dashboard — Learning Roadmap (Orchestrator)

## Purpose of this project

This is first and foremost a **learning project**: a way back into fullstack development after time away, and a space to practice making real architectural decisions from the ground up. The end product (a self-hosted "mission control" dashboard consolidating a trade journal, a stock screener, broker ticker availability, market data, and pre-market notifications) matters, but it is secondary to the practice.

**Ground rule: limit AI's role.** AI assistance should stay in a supporting role — explaining concepts, reviewing code you've written, unblocking a specific error, discussing tradeoffs — not writing the base implementation. Each milestone below is deliberately phrased as a user story with room to make your own calls, not a spec to hand to an AI to execute.

## How to use this roadmap

- Work through the milestones in order (roughly — see the dependency graph below for what can move in parallel).
- Each milestone's file (`00`…`14`) has:
  - **User story** — the goal, in plain language.
  - **What to decide and build yourself** — the actual decisions/tasks. Try to design and build these on your own first.
  - **Reference notes** — context and decisions captured during initial research/planning (real constraints discovered about the free data sources, third-party services, etc., plus some earlier architecture calls). This is a grounded starting point, not a mandate — revisit any of it if you land on something better.
  - **Definition of done** — how you'll know the milestone actually works.
- It's fine to deviate from the reference notes. The goal is a working system *you* designed, even if it ends up simpler or different.

## Context

The goal is a single self-hosted "mission control" dashboard for day trading, consolidating tools that are currently scattered: a self-hosted TradeTally journal, the ScreenerHero stock screener, broker (XTB) ticker availability, market data, and pre-market analysis piped into Discord. Today none of this exists — the project directory is empty; this is a from-scratch build.

The driving idea, in the user's own words, is that every integration (API call or scraping) sits behind its **own abstracted service**, and every notification is built from two independently pluggable pieces: a **bot** (produces analysis from a param list) and a **channel** (delivers a message — Discord webhook today, others later). This lets new data sources, brokers, or notification destinations be added later without reworking the core.

Some cross-cutting facts established during earlier research (grounded, not assumed — useful context regardless of which decisions you end up making yourself):
- **TradeTally** (github.com/GeneBO98/tradetally) is self-hosted (Docker, Node/Express/Postgres + Vue3), Apache-2.0, and has a documented "API & Webhooks" feature — so both iframe embedding (headers are under the user's control) and a native API client are viable.
- **ScreenerHero** (screenerhero.com/screener) sends `X-Frame-Options: DENY` and `frame-ancestors 'none'` (verified live) — iframe embedding is impossible. It has no public API. Per the user, scraping must be **unauthenticated** (no login) and infrequent (1-2x/day), which keeps it low-risk and simple — no credential handling needed for this integration.
- **XTB** has a free WebSocket "xAPI." The user does **not** want a persistent/live broker connection (redundant with TradeTally, and xAPI's one-session-per-account limit would conflict with the real XTB app) — but a brief, credentialed session **once a day** to pull the full instrument list doesn't have that conflict, and gives a more authoritative ticker-availability source than scraping XTB's public pages. See [Milestone 12](./12-ticker-universe-xtb.md).
- Free-tier data source landscape for market data / sentiment is fragmented (see [05](./05-market-data.md) and [10](./10-notification-bots.md)) — this is an accepted tradeoff since the user explicitly ruled out paid API keys.

## Cross-Cutting Architecture Decisions (reference — earlier decisions, open to revisit)

**Stack (user-specified):** React + Vite (frontend), NestJS (backend), MongoDB, REST API (documented via Swagger/OpenAPI, `@nestjs/swagger`). Node 24, npm as the package manager (no pnpm/yarn).

**Monorepo tooling:** built as an **Nx monorepo** (`npx create-nx-workspace`, npm as the package manager under the hood) rather than bare npm workspaces — see [Milestone 00](./00-foundation.md). Nx's generators, task caching, and dependency-graph visualization (`nx graph`) are worth learning deliberately as part of the "relearn fullstack, from the ground up" goal, on top of the plain workspace layout below.

**Monorepo layout:**
```
/apps
  /web        React + Vite dashboard
  /api        NestJS REST API (Swagger/OpenAPI docs) — auth, all domain modules, BullMQ consumer
  /scraper    Standalone Playwright microservice (internal-only network, no public port)
  /bots       One deployable per bot (see Bot contract below), each internal-only
    /news-sentiment
    /reddit-sentiment
    /stocktwits-sentiment
    /price-volume
    /screener-scrape
/packages (or /libs, if using Nx's own convention)
  /shared-types   NotificationChannel / IMarketDataProvider contracts, bot HTTP-contract types, shared enums
  /config         Shared eslint/tsconfig/prettier
/infra/docker     Dockerfiles, docker-compose.dev.yml, docker-compose.prod.yml, reverse-proxy config
```
The scraper is a **separate deployable service**, not a NestJS module, because headless Chromium is heavyweight/crash-prone and shouldn't affect API uptime, and keeping it off the public-facing network is good isolation even without stored credentials. The API talks to it over internal-only HTTP (Docker internal network, no published port) with a shared-secret header.

**Bot contract (earlier decision — bots are independent microservices, not in-process code):** the dashboard/API is a platform; a bot is anything reachable over a small standard HTTP contract, isolated on the internal Docker network exactly like the scraper (no public port, shared-secret header). This deliberately decouples a bot's implementation, dependencies, and language from the API's — v1 bots are written in TS for consistency, but the contract doesn't require it.
```ts
// GET /definition
interface BotDefinitionResponse {
  id: string; name: string; description: string;
  paramsSchema: JSONSchema7;   // drives dynamic UI form + REST/Swagger exposure + input validation
}
// POST /run  (body: { params }, shared-secret header)
interface BotResult { summary: string; sections?: BotResultSection[]; raw?: unknown }
```
The API's `BotRegistryService` holds a config-driven list of known bot service URLs and populates the available-bots list by calling each one's `GET /definition`; `execute-bot` jobs call `POST /run` over HTTP rather than an in-process function. **One bot per notification rule** — no multi-bot composition at the rule level; a bot can internally combine sources, e.g. a composite pre-market bot, but that's the bot author's choice. Bots default to scanning the **whole market**; a rule can narrow a bot's scope via a `universe` param (explicit ticker list or a saved [Watchlist](./06-watchlist-tab.md)) — see [Milestone 10](./10-notification-bots.md).

**Notification channel contract:**
```ts
interface NotificationChannel<TConfig = unknown> {
  type: string; configSchema: JSONSchema7;
  send(message: NotificationMessage, config: TConfig): Promise<NotificationSendResult>;
}
```
Registered the same way (`ChannelRegistryService`). Fully decoupled from bots — the scheduler glues a bot's `BotResult` to a channel's `send()` via a small formatting step. `DiscordWebhookChannel` is the only implementation for v1; adding Telegram/email later only means a new implementation.

**Scheduling:** `NotificationRule { cronExpression, timezone, marketSession, botId, botParams, channelType, channelConfigRef }`. `@nestjs/schedule`'s `SchedulerRegistry` dynamically registers/removes a `CronJob` per rule (timezone-aware, so US/EU/Asia rules run correctly). The cron handler enqueues a BullMQ `execute-bot` job rather than running inline — gives retries/backoff for flaky free data sources, prevents overlapping runs, and persists a `BotRunHistory` audit trail.

**Market data abstraction:** `IMarketDataProvider` (quotes, movers, economic calendar, market internals) implemented against free sources — Yahoo Finance's unofficial endpoints (no key, but undocumented/can break), Finnhub free tier (registration required, ~60 req/min, no cost), SEC EDGAR (free, no key), Stooq (free CSV fallback). Sector heatmap is derived in-app from sector-ETF quotes (XLF, XLK, XLE, …) rather than sourced from a dedicated (paid) heatmap API. All wrapped in a Redis cache with per-data-type TTLs to respect rate limits and reduce load on unofficial endpoints.

**Ticker-availability / brokers:** no persistent/live broker connection, but a once-a-day credentialed WebSocket xAPI session pulls XTB's full instrument list (via a generic `IBrokerProvider` abstraction, so other brokers could be added later) into a Redis-cached list, reconciled against the app's Yahoo-style ticker convention. Broker credentials are managed from a **Settings → Brokers** page (field-level encrypted via `SecretsService`, same as channel/API secrets); a global "active broker" setting picks which broker's data feeds the tradability badge/filter, exposed on watchlist and movers widgets — default to a toggleable filter + badge rather than a silent hard filter, so symbols outside the broker's universe aren't unexpectedly hidden. The cached instrument list is treated as valid even if a daily refresh is missed (tickers are essentially only ever added, not removed), an intentional exception to the "never serve stale data" rule used elsewhere (e.g. [Milestone 09](./09-scraper-worker-service.md)'s scrape cache). See [Milestone 12](./12-ticker-universe-xtb.md).

**Dashboard layout:** `react-grid-layout` for drag/resize; a frontend `WIDGET_REGISTRY: Record<widgetType, Component>` so new widget types are a one-line registration. Layout persists as `DashboardLayout { widgets: [{ widgetId, widgetType, x, y, w, h, config }] }` in Mongo, keyed by user, autosaved (debounced) on drag/resize-stop. Widget instances get unique IDs so the same widget type (e.g. two watchlists with different symbol sets) can be placed more than once.

**Secrets management:** deployment secrets (Mongo URI, JWT secret, `MASTER_ENCRYPTION_KEY`, Redis URL) via `.env`/Docker `env_file` — see [CLAUDE.md](../../CLAUDE.md) for the hard rule against ever committing real `.env` values. User-entered runtime credentials — Discord webhook URLs, XTB broker credentials ([Milestone 12](./12-ticker-universe-xtb.md)), any free-tier API keys (e.g. Finnhub) — are field-level encrypted (AES-256-GCM) via a `SecretsService` into a dedicated `Secret` collection, referenced by id, never returned in plaintext by REST API responses. TradeTally needs no stored credential for v1 since auth happens entirely inside its embedded iframe ([Milestone 13](./13-tradetally-integration.md)); ScreenerHero also needs none (unauthenticated access).

**Auth & deployment hardening:** simple single-user username/password + JWT (no 2FA required for v1). Home server behind a reverse proxy (Nginx/Traefik) + tunnel (e.g. Cloudflare Tunnel) for remote access, HTTPS terminated at the proxy, `@nestjs/throttler` rate-limiting on login, CORS locked to the app's own origin, scraper service kept off the public network entirely.

**REST API shape (representative, not exhaustive):** `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`; `GET/PUT /dashboard-layout`; `NotificationRule`/`BotRunHistoryEntry` CRUD + `POST /notification-rules/:id/run-now`, `POST /channel-configs/:id/test`; `GET /bots` (available bot definitions); `ChannelConfig` CRUD (secrets never exposed); `Watchlist`/`Quote`/`MoverEntry`/`EconomicEvent`/`MarketInternalsSnapshot` endpoints; `TickerAvailability`; `BrokerConfig` CRUD; `ScreenerPreset` CRUD. All documented via Swagger/OpenAPI (`@nestjs/swagger`), consumed on the frontend via react-query with a typed API client. (No `TradeTally` endpoints for v1 — the Trade Journal page is iframe-only, no custom API client.)

## App structure (reference)

The app is **multiple dedicated pages**, not one unified widget grid:
- **Dashboard** — customizable widget grid ([Milestone 04](./04-dashboard-layout-system.md)), holding both native widgets (watchlist, movers, heatmap, clock, calendar) and concise/summary widgets for other features (e.g. a compact screener-preset launcher; TradeTally's Dashboard footprint is a minimal widget, deferred/TBD — see [Milestone 13](./13-tradetally-integration.md)).
- **Watchlist** — dedicated page for managing named symbol lists ([Milestone 06](./06-watchlist-tab.md)), reused by the Dashboard's `WatchlistWidget`.
- **Screener** — dedicated page ([Milestone 11](./11-screener-tab.md)).
- **Trade Journal** — dedicated page ([Milestone 13](./13-tradetally-integration.md)).
- **Settings** — dedicated page ([Milestone 03](./03-web-app-shell.md) scaffolds the route; sub-tabs added by later milestones, e.g. Brokers in [Milestone 12](./12-ticker-universe-xtb.md)).

## Milestones (user stories)

| # | Milestone | User story | Depends on |
|---|-----------|-------------|------------|
| 00 | [Foundation](./00-foundation.md) | As a developer, I want to scaffold an Nx monorepo with shared tooling, so that I've practiced monorepo setup from scratch and every later piece has a consistent place to live. | — |
| 01 | [API auth core](./01-api-auth-core.md) | As a developer, I want to build a NestJS API with real JWT auth, so that I understand how backend authentication actually works end-to-end. | 00 |
| 02 | [Secrets management](./02-secrets-management.md) | As a developer, I want to encrypt sensitive runtime credentials at rest, so that I practice real-world secrets handling instead of storing plaintext. | 01 |
| 03 | [Web app shell](./03-web-app-shell.md) | As a developer, I want to scaffold a React app with routing, theming, and a working login flow, so that I relearn frontend fundamentals and how a SPA talks to a token-based API. | 01 |
| 04 | [Dashboard layout system](./04-dashboard-layout-system.md) | As a developer, I want to build a persistent, user-arrangeable widget grid, so that I practice designing a pluggable frontend architecture. | 03 |
| 05 | [Market data](./05-market-data.md) | As a developer, I want to integrate free market-data sources behind my own abstraction, so that I practice designing provider interfaces and caching strategies. | 04 |
| 06 | [Watchlist tab](./06-watchlist-tab.md) | As a developer, I want to build full CRUD watchlists backed by live quotes, so that I practice a complete feature end-to-end across API and UI. | 04, 05 |
| 07 | [Notification channels](./07-notification-channels.md) | As a developer, I want to build a pluggable notification-delivery layer, so that I practice designing extensible interfaces in a backend service. | 04 |
| 08 | [Bot registry & scheduler](./08-bot-registry-scheduler.md) | As a developer, I want to build a job-queue-based rule engine that schedules work dynamically, so that I practice queues, cron scheduling, and service-to-service HTTP contracts. | 07 |
| 09 | [Scraper worker service](./09-scraper-worker-service.md) | As a developer, I want to stand up an isolated scraping microservice, so that I practice service isolation, internal networking, and stale-data policy design. | 04 |
| 10 | [Notification bots](./10-notification-bots.md) | As a developer, I want to implement several independent bot microservices behind a shared contract, so that I practice designing and consuming a plugin architecture across process/language boundaries. | 08, 05, 09, 06, 11 |
| 11 | [Screener tab](./11-screener-tab.md) | As a developer, I want to build a source-agnostic screener with saved presets, so that I practice designing adapters that decouple my domain model from a third-party's data shape. | 04 |
| 12 | [Ticker universe / XTB availability](./12-ticker-universe-xtb.md) | As a developer, I want to pull broker data via a credentialed WebSocket session, so that I practice integrating an external real-time API and reconciling data between systems. | 02, 05, 06 |
| 13 | [TradeTally integration](./13-tradetally-integration.md) | As a developer, I want to embed an existing self-hosted tool via iframe, so that I practice scoping an integration without over-building custom glue around it. | 04 |
| 14 | [Production deployment](./14-production-deployment.md) | As a developer, I want to deploy the whole stack to my home server behind a reverse proxy with HTTPS, so that I practice real deployment, network segmentation, and hardening instead of just running things on localhost. | everything |

## Execution Order / Dependency Graph

```
00 Foundation
 └─ 01 API auth core
     ├─ 02 Secrets management
     ├─ 03 Web app shell ──► 04 Dashboard layout system
     │                          ├─ 05 Market data ──► 06 Watchlist tab
     │                          ├─ 07 Notification channels ──► 08 Bot registry & scheduler
     │                          ├─ 09 Scraper worker service
     │                          ├─ 11 Screener tab (deep-link + presets)
     │                          └─ 13 TradeTally integration
     ├─ 10 Notification bots (needs 08, 05, 09, 06, 11)
     └─ 12 Ticker universe / XTB availability (needs 02, 05, 06)
                          ⬇
              14 Production deployment (needs everything)
```
Milestones 05, 07, 09, 11, 13 can be built in parallel once 04 lands. 06 follows 05. 08 needs 07. 10 fans in after 08/05/09/06/11. 12 only needs 02/05/06 (no longer needs the scraper — it uses a credentialed broker pull instead). 14 is always last.

## Open Risks / Notes Carried Into Implementation

1. **Economic calendar free-source gap** ([05](./05-market-data.md)) — no full free API found; may need a hand-curated fallback for top-tier events.
2. **ScreenerHero anonymous-view scope** ([09](./09-scraper-worker-service.md)/[10](./10-notification-bots.md)) — need to confirm exactly what filters/rows are visible without login before finalizing `ScreenerScrapeBot`'s capabilities.
3. **Reddit/StockTwits free-tier terms** ([10](./10-notification-bots.md)) — both have tightened access historically; verify current limits/terms fit the expected call volume before relying on them long-term.
4. **TradeTally iframe session persistence** ([13](./13-tradetally-integration.md)) — v1 is iframe-only (no custom API client); confirm TradeTally's own cookies/session survive being embedded in an iframe across dashboard reloads on the live self-hosted instance.
5. **XTB xAPI instrument payload / symbol reconciliation** ([12](./12-ticker-universe-xtb.md)) — confirm the exact instrument fields returned by XTB's WebSocket xAPI and the matching approach to reconcile them against the app's Yahoo-style ticker convention during build.

## Verification (end-to-end, after all milestones)

- Full local dev stack (`docker compose -f docker-compose.dev.yml up` + `npm run dev`) runs web, api, scraper, mongo, redis together.
- Log in, arrange a dashboard with one widget from each module (TradeTally, Screener, Watchlist, Movers, Heatmap, Clock, Economic Calendar), reload, confirm layout and data all persist/render.
- Create one notification rule per bot type against a real Discord webhook, trigger each via "run now," confirm correct formatting and delivery.
- Deploy via `docker-compose.prod.yml` to the home server, confirm remote access over HTTPS, confirm scraper is not internet-reachable.
