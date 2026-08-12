# Milestone 03 — Web app shell

**Part of:** [Roadmap](./orchestrator.md)
**Depends on:** [01 API auth core](./01-api-auth-core.md)
**Status:** Not started

## User story

As a developer, I want to scaffold a React app with routing, theming, and a working login flow, so that I relearn frontend fundamentals and how a token-based SPA actually talks to an API.

## What to decide and build yourself

- Scaffold the Vite + React app and pick a routing approach.
- Choose a component library / design system and decide your theming approach (and whether dark mode is the default).
- Decide where the access token should live on the frontend, and be able to explain why `localStorage` is a worse choice than the alternative you pick.
- Wire up a GraphQL client and design how token refresh happens transparently (on load, and on a 401 mid-session) without bouncing the user to the login page unnecessarily.
- Build the nav/theme shell and decide your responsive strategy (what changes between desktop, tablet, mobile).

## Reference notes (peek only if stuck — try your own design first)

- Vite + React scaffold, `react-router` routes
- **shadcn/ui** as the component library (Tailwind-based, headless Radix primitives) — establishes the design system every later widget builds on
- **Dark mode by default** (shadcn/ui's theme tooling; light mode available as a toggle, not the primary target)
- Apollo Client (configured with `credentials: 'include'` so the httpOnly refresh cookie from [Milestone 01](./01-api-auth-core.md) is sent automatically) + GraphQL Code Generator (typed hooks from `schema.gql`)
- Login page. **Token handling:** access token held in memory only (React context/state — not `localStorage`, not a cookie readable by JS); refresh token lives solely in the httpOnly cookie set by the API. On app load / hard reload, silently call `refresh` to re-obtain an access token from the existing cookie before rendering guarded routes. An Apollo error link catches a 401 from an expired access token, transparently calls `refresh`, and retries the original request once.
- Base nav/theme shell — routes for **Dashboard**, **Watchlist**, **Screener**, **Trade Journal**, and **Settings** pages (structure detailed in [Milestone 04](./04-dashboard-layout-system.md)). Settings hosts its own sub-tabs (e.g. Brokers — added in [Milestone 12](./12-ticker-universe-xtb.md) — with room for more later), scaffolded here as an empty shell/route only. **Responsive nav:** full nav on desktop, collapsing to a hamburger/collapsed menu on tablet/mobile, matching the same breakpoints as the dashboard grid.

## Definition of done

- Log in through the UI; confirm the access token is held in memory (not present in `localStorage`/`sessionStorage`) and the refresh cookie is `httpOnly` (not visible via `document.cookie`).
- Hard-reload the page while logged in: silent refresh re-authenticates without bouncing to the login page.
- A guarded page redirects to login when unauthenticated (no valid refresh cookie).
- Dark mode renders by default; toggling to light mode works and persists across reload.
