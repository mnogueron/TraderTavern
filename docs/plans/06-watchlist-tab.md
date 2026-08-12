# Sub-Plan 06 — Watchlist tab

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md), [05 Market data](./05-market-data.md)
**Status:** Not started

## Goal

A dedicated Watchlist page for managing one or more named symbol lists, plus a compact `WatchlistWidget` for the Dashboard grid that reuses the same underlying data. (Extracted from the original Sub-Plan 05 into its own sub-plan, confirmed with user, since watchlist management is a large enough surface to refine independently — mirrors how Screener and Trade Journal each get a dedicated page.)

## Components

- **API:** `Watchlist` schema/resolvers — `{ name, symbols[] }`, multiple named watchlists owned by the single user; CRUD mutations (create/rename/delete list, add/remove symbol). Quotes for a list's symbols resolved via the `IMarketDataProvider` from [Sub-Plan 05](./05-market-data.md) (same polling-driven, cache-backed approach). Symbols are stored in **Yahoo-style ticker format** (e.g. `AAPL` for US, `SAP.DE` for Frankfurt) — the same convention used by the movers/quotes providers, so no translation layer is needed between watchlist entries and market-data lookups.
- **Symbol search (confirmed with user):** a `searchSymbols(query)` resolver added to `IMarketDataProvider` ([Sub-Plan 05](./05-market-data.md)) backing an autocomplete-as-you-type UI when adding a symbol to a list — matches against real ticker data (name/symbol) rather than free-text entry, reducing typos/invalid tickers.
- **Web — dedicated Watchlist page:** manage multiple named lists, add symbols via autocomplete search, remove symbols, full-table view of live-ish quotes (polling).
- **Web — `WatchlistWidget`** for the Dashboard grid ([Sub-Plan 04](./04-dashboard-layout-system.md)): compact view, per-instance config selects which saved watchlist to display — the same widget type can be placed more than once, each showing a different list.
- XTB tradability badge/filter integration on both the Watchlist page and `WatchlistWidget` is added later in [Sub-Plan 12](./12-ticker-universe-xtb.md) — flagged here as a future touch point on these components.

## Verification

- Create a named watchlist, add/remove symbols, see quotes update via polling.
- Add a `WatchlistWidget` instance to the Dashboard pointing at that list; add a second instance pointing at a different list; confirm both render independently.
- Delete a watchlist and confirm any Dashboard widget instances referencing it degrade gracefully (e.g. an "list no longer exists" state) rather than crashing.
