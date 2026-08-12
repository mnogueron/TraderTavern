# Milestone 06 — Watchlist tab

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md), [05 Market data](./05-market-data.md)
**Status:** Not started

## User story

As a developer, I want to build full CRUD watchlists backed by live quotes, so that I practice a complete feature end-to-end — schema, REST endpoints, and UI — reusing shared building blocks rather than duplicating logic.

## What to decide and build yourself

- Design the Watchlist domain model: single list vs. multiple named lists, and the CRUD operations around it.
- Decide the ticker format/convention the whole app will use, and make sure market-data lookups and watchlist entries agree on it.
- Build a symbol-search/autocomplete experience backed by real ticker data rather than free-text entry.
- Design how the dedicated Watchlist page and the Dashboard's compact widget share the same underlying data without each reinventing it — including what should happen in the widget if the list it points to gets deleted.

## Reference notes (peek only if stuck — try your own design first)

A dedicated Watchlist page for managing one or more named symbol lists, plus a compact `WatchlistWidget` for the Dashboard grid that reuses the same underlying data.

- **API:** `Watchlist` schema/REST controller — `{ name, symbols[] }`, multiple named watchlists owned by the single user; CRUD endpoints (create/rename/delete list, add/remove symbol). Quotes for a list's symbols resolved via the `IMarketDataProvider` from [Milestone 05](./05-market-data.md) (same polling-driven, cache-backed approach). Symbols are stored in **Yahoo-style ticker format** (e.g. `AAPL` for US, `SAP.DE` for Frankfurt) — the same convention used by the movers/quotes providers, so no translation layer is needed between watchlist entries and market-data lookups.
- **Symbol search:** a `GET /market-data/search?query=` endpoint added to `IMarketDataProvider` ([Milestone 05](./05-market-data.md)) backing an autocomplete-as-you-type UI when adding a symbol to a list — matches against real ticker data (name/symbol) rather than free-text entry, reducing typos/invalid tickers.
- **Web — dedicated Watchlist page:** manage multiple named lists, add symbols via autocomplete search, remove symbols, full-table view of live-ish quotes (polling).
- **Web — `WatchlistWidget`** for the Dashboard grid ([Milestone 04](./04-dashboard-layout-system.md)): compact view, per-instance config selects which saved watchlist to display — the same widget type can be placed more than once, each showing a different list.
- XTB tradability badge/filter integration on both the Watchlist page and `WatchlistWidget` is added later in [Milestone 12](./12-ticker-universe-xtb.md) — a future touch point on these components.

## Definition of done

- Create a named watchlist, add/remove symbols, see quotes update via polling.
- Add a `WatchlistWidget` instance to the Dashboard pointing at that list; add a second instance pointing at a different list; confirm both render independently.
- Delete a watchlist and confirm any Dashboard widget instances referencing it degrade gracefully (e.g. a "list no longer exists" state) rather than crashing.
