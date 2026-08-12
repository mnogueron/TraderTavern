# Sub-Plan 10 — Notification bots (concrete implementations)

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [08 Bot registry & scheduler](./08-bot-registry-scheduler.md), [05 Market data](./05-market-data.md), [09 Scraper worker service](./09-scraper-worker-service.md), [06 Watchlist tab](./06-watchlist-tab.md), [11 Screener tab](./11-screener-tab.md)
**Status:** Not started

## Goal

The actual pre-market analysis bots users select in notification rules.

## Architecture (confirmed with user — supersedes the in-process `BotDefinition` provider model)

Bots are **independent microservices**, not modules inside `apps/api`. The dashboard/API is a platform that only talks to bots over the standard HTTP contract from [Sub-Plan 08](./08-bot-registry-scheduler.md) (`GET /definition`, `POST /run`) — a bot's internals, dependencies, and even implementation language are decoupled from the API. All v1 bots are written in TS for consistency, but nothing in the contract requires that. Each bot is its own deployable under `apps/bots/<bot-name>` (own `Dockerfile`, own small HTTP server, e.g. a minimal Fastify/Express app — no need for full Nest), isolated the same way as the scraper: internal-Docker-network-only, no published port, shared-secret header.

## Ticker scope (confirmed with user)

Bots default to scanning the **whole market**, not a fixed ticker list — a bot only narrows to specific symbols when the notification rule explicitly configures it to. This is expressed as a `universe` param in each bot's `paramsSchema`:
```ts
type Universe =
  | { mode: 'whole-market' }
  | { mode: 'tickers'; tickers: string[] }
  | { mode: 'watchlist'; watchlistId: string };   // resolved via Sub-Plan 06's Watchlist
```
`whole-market` is the default when a rule doesn't set `universe`. `PriceVolumeBot` and `ScreenerScrapeBot` are naturally whole-market by design (movers/screener already scan broadly) — for them, `universe` acts as an optional *filter* down to a watchlist/ticker subset rather than the primary input. For `NewsSentimentBot`/`RedditSentimentBot`/`StockTwitsSentimentBot`, whole-market mode means scanning general market-wide sources (e.g. general market news feeds, trending tickers on Reddit/StockTwits) rather than per-symbol queries.

## Components

Each `apps/bots/<name>` service implements the standard bot HTTP contract:
- `NewsSentimentBot` — pulls free RSS (Yahoo Finance, Google News, PR Newswire/BusinessWire, SEC EDGAR full-text search), summarizes/scores sentiment **using a local library, no LLM calls for v1** (e.g. a lightweight lexicon-based sentiment package) — LLM-based scoring is a possible future upgrade, deliberately deferred.
- `RedditSentimentBot` — Reddit's free API via a registered OAuth app (personal-script tier); validate current free-tier volume limits are sufficient before relying on it; local sentiment scoring, no LLM.
- `StockTwitsSentimentBot` — StockTwits' public endpoints (verify current unauthenticated access at build time — has tightened historically); local sentiment scoring, no LLM.
- `PriceVolumeBot` — pre-market gappers/unusual volume via the `IMarketDataProvider` from [Sub-Plan 05](./05-market-data.md) (calls the API internally, or the API's market-data endpoints, over the same internal network).
- `ScreenerScrapeBot` — calls the scraper service's ScreenerHero endpoint ([Sub-Plan 09](./09-scraper-worker-service.md)), formats scraped rows into a notification. Takes a `presetId` param referencing a saved `ScreenerPreset` ([Sub-Plan 11](./11-screener-tab.md)) — the preset's generic filters are translated into a scrape target via `ScreenerHeroAdapter.buildScrapeTarget()`, so the rule controls which filtered view gets scraped rather than always hitting an unfiltered default.

Each is independently selectable per notification rule (per the "one bot per rule" decision) — a composite "pre-market brief" experience is achieved by creating several rules against the same schedule/channel rather than one multi-source bot, unless later revisited.

## Note (flagged, not yet resolved)

X/Twitter's free API tier is effectively unusable for sentiment pulls now (requires a paid tier) — deliberately excluded as a source; the above four/five sources are the realistic free-tier set.

## Verification

- Register a bot service; confirm the API's `BotRegistryService` picks it up via `GET /definition` without any code change in `apps/api`.
- Run each bot manually via `runNotificationRuleNow` in whole-market mode, then again scoped to a saved Watchlist, and confirm the output narrows accordingly.
- Confirm graceful failure (not a crash) when a free source is rate-limited or unreachable, and that a bot service being down doesn't crash the API — only fails that job.
