# Milestone 11 — Screener tab (deep-link + saved presets)

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## User story

As a developer, I want to build a source-agnostic screener with saved presets, so that I practice designing an adapter layer that decouples my own domain model from a specific third-party's data/query shape.

## What to decide and build yourself

- Design a generic filter/preset model that isn't tied to any one screener source's own query scheme.
- Design an adapter interface that translates your generic model into a source-specific representation (deep-link URL, scrape target) — implement it for one real source first.
- Decide how presets get reused elsewhere (bots, dashboard widgets) without duplicating the filter vocabulary.

## Reference notes (peek only if stuck — try your own design first)

The dedicated Screener page (not embedded in the widget grid — see [Milestone 04](./04-dashboard-layout-system.md) app structure), without iframe embedding (ScreenerHero sends `X-Frame-Options: DENY`, confirmed earlier — impossible to iframe). Presets are also reused by [`ScreenerScrapeBot`](./10-notification-bots.md) (as a scrape config parameter) and by a Dashboard widget showing last-cached results for a chosen preset.

**Architecture — source-agnostic presets:** `ScreenerPreset` filters are stored in a **generic, screener-source-agnostic shape**, not tied to ScreenerHero's own query-string scheme — same abstraction pattern as `IMarketDataProvider`. A `ScreenerCompatibilityAdapter` interface translates the generic filter set into a source-specific representation; `ScreenerHeroAdapter` is the only implementation for v1, but the seam exists so another screener source could be added later without reshaping stored presets.
```ts
interface ScreenerFilterCriterion { field: string; operator: '=' | '>' | '<' | 'between' | ...; value: unknown }
interface ScreenerPreset { name: string; filters: ScreenerFilterCriterion[] }

interface ScreenerCompatibilityAdapter {
  id: string; // e.g. 'screenerhero'
  buildDeepLinkUrl(filters: ScreenerFilterCriterion[]): string;   // for the "open in ScreenerHero" button
  buildScrapeTarget(filters: ScreenerFilterCriterion[]): unknown; // consumed by the scraper (Milestone 09) / ScreenerScrapeBot (Milestone 10)
}
```
The common filter vocabulary (field names like price range, volume, % change, market cap) is deliberately scoped to what ScreenerHero itself supports for v1, since that's the only adapter — it just isn't hard-coded to ScreenerHero's literal query-param names.

**Components:**
- **API:** `ScreenerPreset` schema/REST controller, `ScreenerCompatibilityAdapter` registry (mirrors `ChannelRegistryService`/`BotRegistryService` pattern), `ScreenerHeroAdapter` implementation (generic filters → ScreenerHero query string, and → whatever scrape-target shape the scraper endpoint from [Milestone 09](./09-scraper-worker-service.md) needs).
- **Web — dedicated Screener page:** manage presets (CRUD, built from the generic filter vocabulary), "open in ScreenerHero" deep-link button per preset via the adapter.
- **Web — Dashboard widget:** per-instance config selects a saved preset, displays the **last-cached scrape result** for it (read from the Redis cache the scraper populates, per Milestone 09 — no live scrape triggered by viewing the widget).
- **Cross-reference:** `ScreenerScrapeBot` ([Milestone 10](./10-notification-bots.md)) gets a `presetId` param — its scrape target is built via `ScreenerHeroAdapter.buildScrapeTarget()` from the selected preset's filters, rather than always hitting a fixed unfiltered view.

## Definition of done

- Save a preset, reload, click "open" and confirm ScreenerHero opens in a new tab with the expected filters applied (to the extent ScreenerHero's URL scheme supports it — confirm exact query-param support during build).
- Add the Dashboard widget pointed at that preset; confirm it shows the last cached scrape result and does not trigger a live scrape on render.
- Configure `ScreenerScrapeBot` with the same preset; confirm its scraped/notified rows reflect the preset's filters (to the extent anonymous ScreenerHero access allows — reconcile with the open item in [Milestone 09](./09-scraper-worker-service.md) about anonymous filter support during build).
