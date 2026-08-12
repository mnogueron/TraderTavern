# Sub-Plan 05 — Market data

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## Goal

Free-tier quotes/movers/calendar/internals feeding several dashboard widgets. (Watchlist management and the `WatchlistWidget` were extracted into their own sub-plan — [06 Watchlist tab](./06-watchlist-tab.md) — since that surface warranted its own dedicated page; this sub-plan's `IMarketDataProvider` is what Sub-Plan 06 consumes for live quotes.)

## Components

- **API `market-data` module:** `IMarketDataProvider` implementations (Yahoo unofficial endpoints as primary, Finnhub free tier as secondary/fallback), Redis-backed caching with per-type TTLs (quotes ~10-30s, movers ~1-5min, calendar ~1hr, internals ~30-60s). Includes a `searchSymbols(query)` method (Yahoo's unofficial symbol-search endpoint) returning Yahoo-style tickers (e.g. `AAPL`, `SAP.DE`) — backs the autocomplete UI in [Sub-Plan 06](./06-watchlist-tab.md).
- **Movers definition (confirmed with user):** Yahoo Finance's own "day gainers" / "day losers" screener definition (via its unofficial endpoints), covering **both US and EU markets** — not US-only.
- **Live updates (confirmed with user):** client-side polling only for v1 — Apollo `pollInterval` per widget matching the relevant cache TTL. No GraphQL subscriptions/WebSocket push.
- **Web:** `MoversWidget` (US + EU), `EconomicCalendarWidget`, `MarketInternalsHeatmapWidget` (derived from sector-ETF quotes), `MultiMarketClockWidget` (US/EU/Asia open-close countdown).

## Open caveat to validate during build

No good free full economic-calendar API was found; Financial Modeling Prep's free tier is the best current candidate but has a capped daily call count — may need a lightweight in-house calendar for the highest-priority events (CPI, FOMC, NFP) if the free API proves too limited.

## Verification

- Movers widget populates US and EU gainers/losers using Yahoo's definition.
- Heatmap renders without a paid data source.
- Widgets auto-refresh via polling at their configured interval without a manual page reload.
