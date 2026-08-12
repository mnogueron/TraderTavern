# Milestone 14 — Production deployment

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** all milestones 00–13
**Status:** Not started

## User story

As a developer, I want to deploy the whole stack to my home server behind a reverse proxy with HTTPS, so that I practice real deployment, network segmentation, and hardening instead of just running things on localhost.

## What to decide and build yourself

- Design your network topology: what's public-facing vs. internal-only, and how services on the same host talk to each other safely.
- Decide your reverse-proxy / HTTPS / remote-access approach for a home server.
- Decide a backup strategy for your data store and a retention policy.
- Decide basic hardening measures (rate limiting, CORS) and what you're consciously leaving out of scope for now (e.g. full observability stack).

## Reference notes (peek only if stuck — try your own design first)

Ship it to the home server, hardened for remote access.

`infra/docker`:
- Multi-stage Dockerfiles per app
- `docker-compose.prod.yml` (two networks — `frontend`: reverse-proxy + tunnel only; `backend`: api, mongo, redis, scraper — `api` bridges both, `scraper` never gets a published port)
- Reverse proxy (Nginx/Traefik) + tunnel (e.g. Cloudflare Tunnel) for HTTPS + remote access
- `@nestjs/throttler` on the login endpoint
- CORS locked to the app's own origin
- Mongo backup (scheduled `mongodump` to a volume, retention policy to decide at build time)
- **Observability scope (trimmed):** standing up Grafana/Prometheus themselves is **out of scope** for this project. This milestone's responsibility is just to make the system pluggable into an external monitoring stack later: the API exposes a `/metrics` endpoint (queue depth, failed-job count, per-rule last-success — from [Milestone 08](./08-bot-registry-scheduler.md)) on the `backend` network only, scrapable by a Prometheus instance run/managed separately (not part of this compose stack). No alerting is built or configured here.
- `apps/bots/*` services ([Milestone 10](./10-notification-bots.md)) join the `backend` network alongside `api`/`scraper` — internal-only, no published ports.

Remember: none of the real values in `.env`/`env_file` for this deployment ever get committed — see [CLAUDE.md](../../CLAUDE.md).

## Definition of done

- Full stack starts via `docker compose -f docker-compose.prod.yml up`.
- Dashboard reachable over the tunnel URL with HTTPS.
- Login rate-limiting triggers after repeated bad attempts.
- Scraper and `apps/bots/*` services confirmed unreachable from outside the backend network.
- The API's `/metrics` endpoint is reachable from inside the backend network (e.g. `curl` from another backend container) and unreachable from outside it.
- A manual backup/restore cycle succeeds.
