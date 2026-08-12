# Sub-Plan 14 — Production deployment

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** all sub-plans 00–13
**Status:** Not started

## Goal

Ship it to the home server, hardened for remote access.

## Components

`infra/docker`:
- Multi-stage Dockerfiles per app
- `docker-compose.prod.yml` (two networks — `frontend`: reverse-proxy + tunnel only; `backend`: api, mongo, redis, scraper — `api` bridges both, `scraper` never gets a published port)
- Reverse proxy (Nginx/Traefik) + tunnel (e.g. Cloudflare Tunnel) for HTTPS + remote access
- `@nestjs/throttler` on the login endpoint
- CORS locked to the app's own origin
- Mongo backup (scheduled `mongodump` to a volume, retention policy to decide at build time)
- **Observability scope (confirmed with user — trimmed):** standing up Grafana/Prometheus themselves is **out of scope** for this project. This sub-plan's responsibility is just to make the system pluggable into an external monitoring stack later: the API exposes a `/metrics` endpoint (queue depth, failed-job count, per-rule last-success — from [Sub-Plan 08](./08-bot-registry-scheduler.md)) on the `backend` network only, scrapable by a Prometheus instance the user runs/manages separately (not part of this compose stack). No alerting is built or configured here.
- `apps/bots/*` services ([Sub-Plan 10](./10-notification-bots.md)) join the `backend` network alongside `api`/`scraper` — internal-only, no published ports.

## Verification

- Full stack starts via `docker compose -f docker-compose.prod.yml up`.
- Dashboard reachable over the tunnel URL with HTTPS.
- Login rate-limiting triggers after repeated bad attempts.
- Scraper and `apps/bots/*` services confirmed unreachable from outside the backend network.
- The API's `/metrics` endpoint is reachable from inside the backend network (e.g. `curl` from another backend container) and unreachable from outside it.
- A manual backup/restore cycle succeeds.
