# Milestone 05 — Market data

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## User story

As a developer, I want to integrate free market-data sources behind my own abstraction, so that I practice designing a provider interface and a caching strategy that don't leak a specific vendor's shape into the rest of the app.

## What to decide and build yourself

- Design your own `IMarketDataProvider`-style interface (quotes, movers, calendar, internals, symbol search) before wiring up any real source.
- Research and pick which free sources back it — the reference notes list what was found before, but terms/availability change, so verify current status yourself.
- Decide a caching strategy: what gets cached, for how long, and where (in-memory vs. Redis) — and why different data types might need different TTLs.
- Decide whether "live" updates mean polling or something else, and why that's the simpler/more appropriate choice here.

## Reference notes (peek only if stuck — try your own design first)

Watchlist management and the `WatchlistWidget` live in their own milestone ([06](./06-watchlist-tab.md)) since that surface warranted its own dedicated page; this milestone's `IMarketDataProvider` is what Milestone 06 consumes for live quotes.

- **API `market-data` module:** `IMarketDataProvider` implementations (Yahoo unofficial endpoints as primary, Finnhub free tier as secondary/fallback), Redis-backed caching with per-type TTLs (quotes ~10-30s, movers ~1-5min, calendar ~1hr, internals ~30-60s). Includes a `searchSymbols(query)` method (Yahoo's unofficial symbol-search endpoint) returning Yahoo-style tickers (e.g. `AAPL`, `SAP.DE`) — backs the autocomplete UI in [Milestone 06](./06-watchlist-tab.md).
- **Movers definition:** Yahoo Finance's own "day gainers" / "day losers" screener definition (via its unofficial endpoints), covering **both US and EU markets** — not US-only.
- **Live updates:** client-side polling only for v1 — react-query `refetchInterval` per widget matching the relevant cache TTL. No WebSocket/SSE push.
- **Web:** `MoversWidget` (US + EU), `EconomicCalendarWidget`, `MarketInternalsHeatmapWidget` (derived from sector-ETF quotes), `MultiMarketClockWidget` (US/EU/Asia open-close countdown).

**Open caveat to validate during build:** no good free full economic-calendar API was found; Financial Modeling Prep's free tier is the best earlier candidate but has a capped daily call count — may need a lightweight in-house calendar for the highest-priority events (CPI, FOMC, NFP) if the free API proves too limited.

## Definition of done

- Movers widget populates US and EU gainers/losers using your chosen source's definition.
- Heatmap renders without a paid data source.
- Widgets auto-refresh via polling at their configured interval without a manual page reload.
