# Sub-Plan 01 — API auth core

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [00 Foundation](./00-foundation.md)
**Status:** Not started

## Goal

NestJS backend skeleton with working single-user auth and GraphQL.

## Components

`apps/api`:
- `AppModule`, Mongo connection (Mongoose)
- `AuthModule` (passport-jwt). Single `User` document seeded from `INITIAL_USERNAME`/`INITIAL_PASSWORD` env vars on boot: created if no `User` exists; if one exists but its password hash doesn't match the current env var, it's updated to match — so rotating the password later is just editing `.env` and restarting, no manual DB step or reset flow needed.
- JWT strategy: short-lived access token (e.g. 15 min, kept small so a leaked token has a tight blast radius) + **7-day refresh token**. `refresh` mutation alongside `login`. **Refresh token is set as an `httpOnly`, `Secure`, `SameSite=Strict` cookie** on the GraphQL response (not returned in the response body) — never reachable by frontend JS, mitigating XSS token theft; the access token is returned in the `login`/`refresh` response body for the frontend to hold in memory (per [Sub-Plan 03](./03-web-app-shell.md)).
- `GraphqlModule` (code-first, emits `schema.gql`), configured for cookie parsing (`cookie-parser`) and CORS `credentials: true` restricted to the app's known origin(s) (dev: `localhost`; prod: the app's real origin — never a wildcard, required for cookies to work cross-origin at all)
- `JwtAuthGuard` applied by default to resolvers except `login`/`refresh`
- **Dev-mode CORS:** permissive `localhost` origin allowlist (still `credentials: true`, never `*`, since wildcard origin is incompatible with cookies), env-gated (locked to the real origin in production per Sub-Plan 13).

## Verification

- `login` mutation returns an access token in the response body and sets the refresh-token cookie (`httpOnly`, not visible to `document.cookie` in a browser console).
- `refresh` mutation reads the refresh cookie, returns a new access token; fails on an expired/invalid/missing cookie.
- A guarded query fails without a token and succeeds with one.
- Changing `INITIAL_USERNAME`/`INITIAL_PASSWORD` and restarting rotates the seeded user's credentials.
- GraphQL Playground/Apollo Sandbox reachable in dev from the Vite dev server origin (CORS + cookie working cross-port).
