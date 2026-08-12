# Sub-Plan 13 — TradeTally integration

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## Goal

The dedicated Trade Journal page (not embedded in the widget grid — see [Sub-Plan 04](./04-dashboard-layout-system.md) app structure).

## Scope (confirmed with user — trimmed for v1)

The Trade Journal page hosts **only the raw embedded TradeTally iframe** — everything a user sees there is exactly what TradeTally itself renders (stats, trades, journal notes, etc.), nothing custom-built or re-implemented against a TradeTally API. **Auth happens entirely inside the iframe** (the user logs into their self-hosted TradeTally instance directly, independent of the dashboard's own auth) — no credential pass-through/SSO for v1. No custom `tradetally` API module, no `TradeTallyStatsWidget`/`RecentTradesWidget`/`JournalWidget` for now — those native summary widgets are explicitly **deferred**, to be revisited only once the iframe path is proven out. The Dashboard gets a minimal footprint for this integration (a small widget, still to be shaped later) rather than the fuller widget set originally sketched.

## Components

- **Web:** `TradeTallyIframeWidget` — iframe pointed at the user's TradeTally base URL, plus a "pop out to full-screen tab" control that opens the same URL in a new browser tab. Used on the dedicated Trade Journal page; a minimal Dashboard-widget presence (exact shape TBD, deferred) may reuse the same iframe.

## Verification

- Iframe loads the user's local TradeTally instance and renders correctly (confirms no unexpected framing restriction on the self-hosted side).
- Logging in inside the iframe works and the session persists across reloads of the dashboard page (to the extent TradeTally's own cookies allow within an iframe context — confirm during build).
- Pop-out opens the same instance full-screen in a new tab.
