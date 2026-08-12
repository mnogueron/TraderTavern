# Sub-Plan 03 — Web app shell

**Part of:** [Orchestrator](./orchestrator.md)
**Depends on:** [01 API auth core](./01-api-auth-core.md)
**Status:** Not started

## Goal

Frontend scaffold with working auth flow.

## Components

`apps/web`:
- Vite + React scaffold, `react-router` routes
- **shadcn/ui** as the component library (Tailwind-based, headless Radix primitives) — establishes the design system every later widget builds on
- **Dark mode by default** (shadcn/ui's theme tooling; light mode available as a toggle, not the primary target)
- Apollo Client (configured with `credentials: 'include'` so the httpOnly refresh cookie from [Sub-Plan 01](./01-api-auth-core.md) is sent automatically) + GraphQL Code Generator (typed hooks from `schema.gql`)
- Login page. **Token handling:** access token held in memory only (React context/state — not `localStorage`, not a cookie readable by JS); refresh token lives solely in the httpOnly cookie set by the API. On app load / hard reload, silently call `refresh` to re-obtain an access token from the existing cookie before rendering guarded routes. An Apollo error link catches a 401 from an expired access token, transparently calls `refresh`, and retries the original request once.
- Base nav/theme shell — routes for **Dashboard**, **Watchlist**, **Screener**, **Trade Journal**, and **Settings** pages (structure confirmed in [Sub-Plan 04](./04-dashboard-layout-system.md)). Settings hosts its own sub-tabs (e.g. Brokers — added in [Sub-Plan 12](./12-ticker-universe-xtb.md) — with room for more later), scaffolded here as an empty shell/route only. **Responsive nav (confirmed with user):** full nav on desktop, collapsing to a hamburger/collapsed menu on tablet/mobile, matching the same breakpoints as the dashboard grid.

## Verification

- Log in through the UI; confirm the access token is held in memory (not present in `localStorage`/`sessionStorage`) and the refresh cookie is `httpOnly` (not visible via `document.cookie`).
- Hard-reload the page while logged in: silent refresh re-authenticates without bouncing to the login page.
- A guarded page redirects to login when unauthenticated (no valid refresh cookie).
- Dark mode renders by default; toggling to light mode works and persists across reload.
