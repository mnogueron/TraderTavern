# API client (`packages/api-client`)

Only load this doc when working inside `packages/api-client`, or when wiring the frontend/backend together through it.

## Tech stack
Generated TypeScript client built with Rslib (Rspack-based), tested with Rstest. See `packages/api-client/AGENTS.md` for the package's own command reference (`npm run build`, `npm run dev`, `npm run test`).

## Rules already established in this repo

### Never hand-edit generated output
`openapi.yaml` and `api.d.ts` are generated from the NestJS API's Swagger definitions — do not hand-edit them. Change the source DTOs/controllers in `apps/api/src/...` instead, then regenerate.

### Regeneration workflow
After changing any DTO or controller in `apps/api/src`:
1. `cd packages/api-client && npm run generate` — rewrites `openapi.yaml` and `api.d.ts`.
2. Typecheck the frontend app(s) that consume the client to catch breaking changes.

Run this once per logical DTO change, not after every small edit — batch related DTO edits before regenerating.

### Response types stay conservative
Since this client mirrors the API's response DTOs directly, the private-vs-public entity boundary (see root `CLAUDE.md` and `docs/claude/backend.md`) applies transitively: if a generated type exposes DB-internal fields (`_id`, foreign keys, other users' data), that's a signal the backend DTO leaked something and should be fixed at the source, not patched in the client.
