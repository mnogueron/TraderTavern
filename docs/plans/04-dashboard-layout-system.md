# Sub-Plan 04 — Dashboard layout system

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [03 Web app shell](./03-web-app-shell.md)
**Status:** Not started

## Goal

User-arrangeable widget grid, the shell every other widget plugs into.

## App structure (confirmed with user)

**Multiple dedicated pages, not one unified grid** (this sub-plan's grid system covers only the "Dashboard" page):
- **Dashboard** — the customizable widget grid this sub-plan builds. Includes **concise/summary widgets** for other features (e.g. a compact watchlist, a compact screener-preset launcher, a compact TradeTally stats card) alongside native widgets (movers, heatmap, clock, calendar).
- **Watchlist** — dedicated page/route (built in [Sub-Plan 06](./06-watchlist-tab.md)) for managing named symbol lists, outside the widget grid; its data is reused by the Dashboard's compact `WatchlistWidget`.
- **Screener** — dedicated page/route (built in [Sub-Plan 11](./11-screener-tab.md)), outside the widget grid.
- **Trade Journal** — dedicated page/route (built in [Sub-Plan 13](./13-tradetally-integration.md)), outside the widget grid.
- Nav shell ([Sub-Plan 03](./03-web-app-shell.md)) routes between these; needs a small follow-up there for responsive/mobile nav (see below).

## Components

- **API:** `DashboardLayout` schema + resolvers (`dashboardLayout` query, `saveDashboardLayout` mutation). Two levels of config persisted in Mongo, both inside `DashboardLayout`: (1) **grid config** per widget instance (`x, y, w, h` position/size) and (2) **widget config** per instance (the widget-specific settings, e.g. watchlist symbols) — stored together as `widgets: [{ widgetId, widgetType, x, y, w, h, config }]`, so both the arrangement and each widget's settings survive reload/redeploy.
- **Web:** `react-grid-layout` integration, `WIDGET_REGISTRY` (display component + optional settings-form component per widget type — later sub-plans plug into this rather than inventing their own settings UI), "add widget" picker, debounced autosave on drag/resize-stop, unique widget-instance IDs (supports placing the same widget type more than once with different configs).
- **Responsive breakpoints (confirmed with user):** `react-grid-layout`'s responsive mode with distinct layouts for desktop (full grid), tablet, and mobile (collapsed to a single column, auto-resized). This is frontend layout behavior; the collapsed/hamburger nav menu on mobile is a [Sub-Plan 03](./03-web-app-shell.md) concern — flagging as a small addition needed there when it's revisited.

## Verification

- Add/move/resize/remove a placeholder widget, reload the page, confirm both grid position and widget-specific config persisted exactly as left.
- Resize the browser across desktop/tablet/mobile breakpoints: grid reflows correctly at each, collapsing to a single column on mobile.
