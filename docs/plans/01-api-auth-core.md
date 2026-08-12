# Milestone 01 — API auth core

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [00 Foundation](./00-foundation.md)
**Status:** Not started

## User story

As a developer, I want to build a NestJS API with real single-user JWT auth, so that I understand how backend authentication actually works end-to-end instead of relying on a library's defaults blindly.

## What to decide and build yourself

- Wire up the NestJS app skeleton and its Mongo connection.
- Design how a single-user app should be seeded with its initial credentials (no signup flow needed) and how rotating the password later should work.
- Decide your JWT strategy: access vs. refresh token lifetimes, and where each token should live (response body vs. cookie) — think through *why* one might be safer than the other against XSS.
- Wire up GraphQL code-first and decide how auth guards apply by default across resolvers.
- Decide your CORS/cookie policy for local dev vs. production, and why a wildcard origin doesn't work once cookies are involved.

## Reference notes (peek only if stuck — try your own design first)

- `AppModule`, Mongo connection (Mongoose)
- `AuthModule` (passport-jwt). Single `User` document seeded from `INITIAL_USERNAME`/`INITIAL_PASSWORD` env vars on boot: created if no `User` exists; if one exists but its password hash doesn't match the current env var, it's updated to match — so rotating the password later is just editing `.env` and restarting, no manual DB step or reset flow needed. (Remember: real `.env` values are never committed — see [CLAUDE.md](../../CLAUDE.md).)
- JWT strategy: short-lived access token (e.g. 15 min, kept small so a leaked token has a tight blast radius) + **7-day refresh token**. `refresh` mutation alongside `login`. **Refresh token is set as an `httpOnly`, `Secure`, `SameSite=Strict` cookie** on the GraphQL response (not returned in the response body) — never reachable by frontend JS, mitigating XSS token theft; the access token is returned in the `login`/`refresh` response body for the frontend to hold in memory (per [Milestone 03](./03-web-app-shell.md)).
- `GraphqlModule` (code-first, emits `schema.gql`), configured for cookie parsing (`cookie-parser`) and CORS `credentials: true` restricted to the app's known origin(s) (dev: `localhost`; prod: the app's real origin — never a wildcard, required for cookies to work cross-origin at all)
- `JwtAuthGuard` applied by default to resolvers except `login`/`refresh`
- **Dev-mode CORS:** permissive `localhost` origin allowlist (still `credentials: true`, never `*`, since wildcard origin is incompatible with cookies), env-gated (locked to the real origin in production per Milestone 13).

## Definition of done

- `login` mutation returns an access token in the response body and sets the refresh-token cookie (`httpOnly`, not visible to `document.cookie` in a browser console).
- `refresh` mutation reads the refresh cookie, returns a new access token; fails on an expired/invalid/missing cookie.
- A guarded query fails without a token and succeeds with one.
- Changing `INITIAL_USERNAME`/`INITIAL_PASSWORD` and restarting rotates the seeded user's credentials.
- GraphQL Playground/Apollo Sandbox reachable in dev from the Vite dev server origin (CORS + cookie working cross-port).
