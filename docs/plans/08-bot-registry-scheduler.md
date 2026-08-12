# Sub-Plan 08 — Bot registry & scheduler

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [07 Notification channels](./07-notification-channels.md)
**Status:** Not started

## Goal

The plug-in bot framework, the job queue backbone, and the rule engine tying bots to channels on a schedule. This is the architectural core of the notification system.

## Components

- **API:** Redis/BullMQ wiring (`CacheModule`/ioredis, base queue config — durability via AOF persistence, since silently losing a scheduled pre-market notification is worse than the minor overhead), `NotificationRule` + `BotRunHistory` schemas, `RuleSchedulerService` (dynamic `SchedulerRegistry` cron jobs keyed by rule id, timezone-aware, add/remove on rule create/update/delete/toggle), `execute-bot` BullMQ processor (loads rule → resolves bot → validates params against `paramsSchema` → calls it → persists history → resolves channel → sends).
- **`BotRegistryService` is now an HTTP client registry, not an in-process provider list (confirmed with user — bots are independent microservices).** Bots run as standalone deployable services, isolated the same way as the scraper ([Sub-Plan 09](./09-scraper-worker-service.md)): internal-Docker-network-only (no published port), reachable via a shared-secret header, callable from any language even though v1 bots are written in TS. Each bot service implements a small standard HTTP contract:
  - `GET /definition` → `{ id, name, description, paramsSchema }` (drives dynamic UI + rule validation, same role the old in-process `BotDefinition.paramsSchema` played)
  - `POST /run` (with shared-secret header) → `{ params }` → returns `BotResult`
  `BotRegistryService` holds a config-driven list of known bot service base URLs (env var/config, mirroring how the scraper's URL is wired) and polls/calls `GET /definition` on startup (and periodically) to populate the available-bots list. The `execute-bot` processor calls a bot's `/run` over HTTP instead of invoking an in-process function — this decouples the dashboard/API's lifecycle, language, and deploy cadence from each bot's.
- **Retry & alerting (confirmed with user, scope trimmed):** the `execute-bot` job has a max-retry count with backoff (BullMQ built-in `attempts`/`backoff`); once retries are exhausted the job is left in BullMQ's failed state and the `BotRunHistory` entry records `failed` — no internal Discord/in-app alert handler. Instead, this project's responsibility stops at making failures **observable**: it exposes a `/metrics` endpoint (e.g. `bullmq` queue metrics via `@willsoto/nestjs-prometheus` or similar — queue depth, failed-job count, per-rule last-success timestamp). Standing up Prometheus/Grafana (or any alerting on top of that endpoint) is explicitly **out of scope** — the user will plug an external monitoring stack they manage separately into this endpoint later.
- **Scheduling scope (confirmed with user):** no automatic market-holiday awareness — that's out of scope as not straightforward to source reliably for free. The scheduler only respects what's expressed in each rule's own cron expression (e.g. weekdays via `1-5` in the day-of-week field) and its timezone; a `marketSession` field is retained on `NotificationRule` as descriptive metadata (for UI grouping/labeling, e.g. "US pre-market") but does not drive any skip logic itself.
- **History retention (confirmed with user):** `BotRunHistory` entries are kept for 1 month and then gradually dropped — implemented as a Mongo TTL index on the run's timestamp field (`expireAfterSeconds` ≈ 30 days), so Mongo's background TTL monitor removes old entries incrementally rather than a manual batch-delete job.
- **Web:** `NotificationRuleEditor` (dynamic form rendered from the selected bot's `paramsSchema` and channel's `configSchema`), rule list with enable/disable/run-now/history.

## Verification

- Create a rule with a trivial test bot + the Discord channel from [Sub-Plan 07](./07-notification-channels.md) on a 1-minute cron.
- Confirm it fires on schedule in the correct timezone, appears in run history, and can be run on-demand via `runNotificationRuleNow`.
- Force a bot run to fail past its max retries; confirm the failed-job/last-success metrics are visible on the `/metrics` endpoint, and the `BotRunHistory` entry reflects the failure.
- Confirm a `BotRunHistory` entry older than 1 month is automatically removed via the TTL index.
