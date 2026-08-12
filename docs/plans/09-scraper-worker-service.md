# Milestone 09 — Scraper worker service

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [04 Dashboard layout system](./04-dashboard-layout-system.md)
**Status:** Not started

## User story

As a developer, I want to stand up an isolated scraping microservice, so that I practice service isolation, internal-only networking, and designing a stale-data policy deliberately rather than by accident.

## What to decide and build yourself

- Decide whether a scraping concern belongs in its own service vs. inside the API, and design the network/isolation boundary around it (what's reachable from where).
- Decide the caching/staleness policy: what happens when a scrape fails or the cached result is past its TTL — should stale data ever be served, and why or why not.
- Decide how scheduling/triggering responsibility is split between this service and the scheduler from [Milestone 08](./08-bot-registry-scheduler.md).

## Reference notes (peek only if stuck — try your own design first)

Standalone, network-isolated scraping microservice — deliberately lightweight, since its job doesn't require stored credentials (unauthenticated ScreenerHero access). *(XTB ticker availability, originally planned as a public-page scrape here, is instead handled by a credentialed WebSocket xAPI pull in [Milestone 12](./12-ticker-universe-xtb.md) — kept out of this service since it needs the user's real broker credentials, unlike the rest of this Playwright-based scraper.)*

`apps/scraper`:
- Playwright-based internal HTTP API (e.g. `POST /scrape/screenerhero`), reachable only on the Docker-internal network (no published port) plus a shared-secret header for defense in depth.
- **Scheduling & responsibility split:** the scraper is stateless request/response only — it scrapes on request and returns formatted data, no internal cron. Triggering is owned entirely by the API's scheduler ([Milestone 08](./08-bot-registry-scheduler.md)'s `RuleSchedulerService`/BullMQ), which calls this endpoint on a schedule (e.g. 1-2x/day for ScreenerHero).
- **Caching:** scrape results are written to **Redis** by the API after each successful call (not cached inside the scraper process itself, which is stateless), keyed per scrape type with a TTL matched to the refresh cadence. **If cached data is stale (past TTL/no successful refresh), it is not served** — callers get an explicit "no fresh data available" result rather than silently falling back to old data, so downstream bots/widgets don't act on outdated ScreenerHero rows.
- ScreenerHero scrape flow limited to unauthenticated/public results, rate-limited to at most 1-2 runs/day at the service level (not just per-caller) as a courtesy/self-imposed safety margin. `POST /scrape/screenerhero` accepts a scrape-target payload built by `ScreenerHeroAdapter.buildScrapeTarget()` ([Milestone 11](./11-screener-tab.md)) so a caller can request a specific preset's filters rather than only an unfiltered view — cache key includes the preset/filter identity so different presets don't collide in Redis.

**Open items to validate during build:** confirm exactly which filters/columns ScreenerHero exposes to anonymous (logged-out) visitors — the earlier check showed anonymous browsing is capped (e.g. "1–25 of 10,000") with a default column set, so the scraped result may be a fixed top-N view rather than fully filter-driven; adjust `ScreenerScrapeBot`'s expectations ([Milestone 10](./10-notification-bots.md)) accordingly once confirmed.

## Definition of done

- Call both internal endpoints directly (e.g. via `curl` from inside the Docker network) and confirm structured JSON results.
- Confirm the service is unreachable from outside the internal network.
- Confirm a scheduled BullMQ job (Milestone 08) triggers each scrape and its result lands in Redis.
- Let a cached entry's TTL expire and confirm consumers get an explicit "no fresh data" result rather than the stale cached value.
