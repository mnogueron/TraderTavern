# Milestone 12 — Ticker universe / XTB availability

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [02 Secrets management](./02-secrets-management.md), [05 Market data](./05-market-data.md), [06 Watchlist tab](./06-watchlist-tab.md)
**Status:** Not started

## User story

As a developer, I want to pull broker data via a credentialed WebSocket session, so that I practice integrating an external real-time API and reconciling its identifiers against my own app's data conventions.

## What to decide and build yourself

- Design a broker abstraction (mirroring your market-data provider abstraction) and decide when/how often to connect — a persistent connection vs. a brief periodic session, and why one fits this use case better.
- Decide how broker credentials are stored and managed in the UI.
- Design a reconciliation strategy between the broker's own instrument identifiers and your app's ticker convention — decide what happens to instruments you can't confidently match.
- Decide a staleness policy for this specific data type — should it behave the same as other cached data in the app, or differently, and why.

## Reference notes (peek only if stuck — try your own design first)

Surface which tickers are actually tradable on the user's broker (XTB).

**Architecture (revised — supersedes an earlier "public scrape, no login" approach):** Instead of scraping XTB's public instrument pages, the API connects to **XTB's WebSocket xAPI with the user's real credentials once a day** to pull the full authoritative instrument list, then disconnects. A single short daily session doesn't meaningfully conflict with normal use of the real XTB app (unlike a persistent/live connection, which was the original concern) — this is a low-frequency credentialed pull, not a live trading integration; no order placement, no live quote streaming.

- **Broker abstraction:** `IBrokerProvider` interface (mirrors `IMarketDataProvider`) — `{ id: string; fetchInstruments(credentials): Promise<BrokerInstrument[]> }`. `XtbBrokerProvider` is the only implementation for v1, but the seam allows other brokers later.
- **Credentials:** stored via `SecretsService` ([Milestone 02](./02-secrets-management.md)), managed from a new **Settings → Brokers tab** — add/edit/remove broker credentials (e.g. XTB login), same pattern as `ChannelConfig` in [Milestone 07](./07-notification-channels.md). This is the first broker; the tab is built generically enough to list multiple broker types later.
- **Active broker:** a global setting (single value, e.g. on the user/app settings document) selects which configured broker's data is used platform-wide to drive the "tradable" badge/filter on `WatchlistWidget` ([Milestone 06](./06-watchlist-tab.md)) and `MoversWidget` ([Milestone 05](./05-market-data.md)). The existing per-widget filter toggle (default off) still governs whether the filter is actually applied on each widget instance; the global setting just determines *which broker's* availability data feeds those badges/toggles.
- **Daily sync job:** an internal scheduled job (system-level, not a user-facing `NotificationRule`) logs into the xAPI once a day, pulls the full instrument list, and writes it to Redis.
- **Symbol reconciliation:** performed after each daily pull — XTB's own instrument identifiers are matched against the app's Yahoo-style ticker convention (used everywhere else) to build the `tickerAvailability` lookup. The exact matching approach (e.g. by symbol string transformation, ISIN, or name) is a build-time detail to confirm against XTB's real instrument payload; unmatched XTB instruments are simply excluded rather than guessed at.
- **Staleness policy (intentional exception to Milestone 09's "never serve stale data" rule):** the last successfully cached instrument list is treated as valid even past its nominal daily-refresh window, since tickers are essentially only ever *added*, rarely removed — a missed daily refresh just means a newly-added ticker doesn't show up as tradable until the next successful sync, which is an acceptable, low-impact staleness (vs. e.g. movers/quotes data going stale, which actively misleads).
- **API:** exposes a `tickerAvailability(symbol)` lookup / bulk tag over the reconciled, cached list.
- **Web:** an "available on [active broker]" badge and an optional filter toggle on `WatchlistWidget` and `MoversWidget` (default off, so symbols outside the broker's universe aren't silently hidden); Settings → Brokers tab for credential CRUD + a manual "sync now" action.

## Definition of done

- Add XTB credentials in Settings → Brokers; trigger a manual sync; confirm the instrument list is pulled and cached.
- Confirm a known XTB-tradable symbol and a known non-tradable one are tagged correctly after reconciliation.
- Toggling the filter hides/shows accordingly on both `WatchlistWidget` and `MoversWidget`.
- Simulate a missed daily sync (e.g. XTB temporarily unreachable) and confirm the previous day's cached tradability data is still served rather than falling back to "unknown."
