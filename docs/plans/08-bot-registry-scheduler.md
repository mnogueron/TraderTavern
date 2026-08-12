# Milestone 08 — Bot registry & scheduler

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [07 Notification channels](./07-notification-channels.md)
**Status:** Not started

## User story

As a developer, I want to build a job-queue-based rule engine that schedules and executes work dynamically, so that I practice queues, cron scheduling, retries, and service-to-service HTTP contracts — this is the architectural core of the notification system.

## What to decide and build yourself

- Decide the bot execution model: in-process modules vs. independent services reachable over HTTP — and design the contract between the platform and a bot either way.
- Wire up a job queue (e.g. Redis/BullMQ) and decide durability, retry, and backoff behavior — think about what "losing a scheduled job silently" would actually cost you here.
- Design a scheduler that can add/remove cron jobs at runtime as rules are created/edited/deleted, correctly across timezones.
- Decide what "observability" means for this system (what should be visible when something fails) and consciously scope how much alerting infrastructure you actually want to build vs. plug into something external later.
- Decide a retention policy for run history and how it gets enforced.

## Reference notes (peek only if stuck — try your own design first)

The plug-in bot framework, the job queue backbone, and the rule engine tying bots to channels on a schedule.

- **API:** Redis/BullMQ wiring (`CacheModule`/ioredis, base queue config — durability via AOF persistence, since silently losing a scheduled pre-market notification is worse than the minor overhead), `NotificationRule` + `BotRunHistory` schemas, `RuleSchedulerService` (dynamic `SchedulerRegistry` cron jobs keyed by rule id, timezone-aware, add/remove on rule create/update/delete/toggle), `execute-bot` BullMQ processor (loads rule → resolves bot → validates params against `paramsSchema` → calls it → persists history → resolves channel → sends).
- **`BotRegistryService` as an HTTP client registry, not an in-process provider list** (earlier decision — bots are independent microservices). Bots run as standalone deployable services, isolated the same way as the scraper ([Milestone 09](./09-scraper-worker-service.md)): internal-Docker-network-only (no published port), reachable via a shared-secret header, callable from any language even though v1 bots are written in TS. Each bot service implements a small standard HTTP contract:
  - `GET /definition` → `{ id, name, description, paramsSchema }` (drives dynamic UI + rule validation)
  - `POST /run` (with shared-secret header) → `{ params }` → returns `BotResult`

  `BotRegistryService` holds a config-driven list of known bot service base URLs (env var/config, mirroring how the scraper's URL is wired) and polls/calls `GET /definition` on startup (and periodically) to populate the available-bots list. The `execute-bot` processor calls a bot's `/run` over HTTP instead of invoking an in-process function.
- **Retry & alerting (scope trimmed):** the `execute-bot` job has a max-retry count with backoff (BullMQ built-in `attempts`/`backoff`); once retries are exhausted the job is left in BullMQ's failed state and the `BotRunHistory` entry records `failed` — no internal Discord/in-app alert handler. Instead, the responsibility stops at making failures **observable**: a `/metrics` endpoint (e.g. `bullmq` queue metrics via `@willsoto/nestjs-prometheus` or similar — queue depth, failed-job count, per-rule last-success timestamp). Standing up Prometheus/Grafana (or any alerting on top of that endpoint) is explicitly **out of scope**.
- **Scheduling scope:** no automatic market-holiday awareness — out of scope as not straightforward to source reliably for free. The scheduler only respects what's expressed in each rule's own cron expression (e.g. weekdays via `1-5` in the day-of-week field) and its timezone; a `marketSession` field is retained on `NotificationRule` as descriptive metadata (for UI grouping/labeling, e.g. "US pre-market") but does not drive any skip logic itself.
- **History retention:** `BotRunHistory` entries are kept for 1 month and then gradually dropped — implemented as a Mongo TTL index on the run's timestamp field (`expireAfterSeconds` ≈ 30 days).
- **Web:** `NotificationRuleEditor` (dynamic form rendered from the selected bot's `paramsSchema` and channel's `configSchema`), rule list with enable/disable/run-now/history.

## Definition of done

- Create a rule with a trivial test bot + the Discord channel from [Milestone 07](./07-notification-channels.md) on a 1-minute cron.
- Confirm it fires on schedule in the correct timezone, appears in run history, and can be run on-demand via `runNotificationRuleNow`.
- Force a bot run to fail past its max retries; confirm the failed-job/last-success metrics are visible on the `/metrics` endpoint, and the `BotRunHistory` entry reflects the failure.
- Confirm a `BotRunHistory` entry older than 1 month is automatically removed via the TTL index.
