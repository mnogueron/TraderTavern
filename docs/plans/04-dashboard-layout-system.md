# Milestone 04 — Dashboard layout system

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [03 Web app shell](./03-web-app-shell.md)
**Status:** Not started

## User story

As a developer, I want to build a persistent, user-arrangeable widget grid, so that I practice designing a pluggable frontend architecture that later features can plug into without touching this code again.

## What to decide and build yourself

- Decide the overall app structure: one unified widget grid, or (as the reference notes suggest) a dashboard grid alongside several dedicated pages for larger features.
- Design how widget layout (position/size) and widget-specific config (e.g. which watchlist a widget instance shows) get persisted together.
- Pick or evaluate a grid/drag-resize library, and design a widget-registry pattern so adding a new widget type later is a small, contained change.
- Decide how the same widget type can be placed more than once with independent config (e.g. two watchlist widgets showing different lists).
- Decide your responsive strategy for the grid itself.

## Reference notes (peek only if stuck — try your own design first)

**App structure:** multiple dedicated pages, not one unified grid (this milestone's grid system covers only the "Dashboard" page):
- **Dashboard** — the customizable widget grid this milestone builds. Includes **concise/summary widgets** for other features (e.g. a compact watchlist, a compact screener-preset launcher, a compact TradeTally stats card) alongside native widgets (movers, heatmap, clock, calendar).
- **Watchlist** — dedicated page/route (built in [Milestone 06](./06-watchlist-tab.md)) for managing named symbol lists, outside the widget grid; its data is reused by the Dashboard's compact `WatchlistWidget`.
- **Screener** — dedicated page/route (built in [Milestone 11](./11-screener-tab.md)), outside the widget grid.
- **Trade Journal** — dedicated page/route (built in [Milestone 13](./13-tradetally-integration.md)), outside the widget grid.
- Nav shell ([Milestone 03](./03-web-app-shell.md)) routes between these.

**Components:**
- **API:** `DashboardLayout` schema + REST controller (`GET /dashboard-layout`, `PUT /dashboard-layout`). Two levels of config persisted in Mongo, both inside `DashboardLayout`: (1) **grid config** per widget instance (`x, y, w, h` position/size) and (2) **widget config** per instance (the widget-specific settings, e.g. watchlist symbols) — stored together as `widgets: [{ widgetId, widgetType, x, y, w, h, config }]`, so both the arrangement and each widget's settings survive reload/redeploy.
- **Web:** `react-grid-layout` integration, `WIDGET_REGISTRY` (display component + optional settings-form component per widget type — later milestones plug into this rather than inventing their own settings UI), "add widget" picker, debounced autosave on drag/resize-stop, unique widget-instance IDs (supports placing the same widget type more than once with different configs).
- **Responsive breakpoints:** `react-grid-layout`'s responsive mode with distinct layouts for desktop (full grid), tablet, and mobile (collapsed to a single column, auto-resized).

## Definition of done

- Add/move/resize/remove a placeholder widget, reload the page, confirm both grid position and widget-specific config persisted exactly as left.
- Resize the browser across desktop/tablet/mobile breakpoints: grid reflows correctly at each, collapsing to a single column on mobile.
