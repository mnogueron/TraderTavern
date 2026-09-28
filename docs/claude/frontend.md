# Frontend (`apps/TraderTavern`)

Only load this doc when working inside `apps/TraderTavern` (or `apps/TraderTavern-e2e`).

## Tech stack
- **Framework**: React 19 + React Router v7 (file-based routes in `src/app/routes.tsx`, route modules in `src/app/routes/`).
- **Data fetching**: TanStack Query (`@tanstack/react-query`) for server state; calls go through `@trader-tavern/api-client` (see `docs/claude/api-client.md`).
- **Tables**: TanStack Table (`@tanstack/react-table`) + TanStack Virtual for large lists.
- **Styling**: Tailwind CSS v4 + `tailwind-merge`/`clsx` via the `cn` helper in `src/lib/utils`.
- **UI components**: shadcn-style components in `src/components/ui`, built on `@base-ui/react` primitives. Icons from `@remixicon/react` and `lucide-react`.
- **Charts**: `lightweight-charts` (price charts) and `recharts` (other charts).
- **Build/dev**: Vite, run through Nx (`npx nx serve TraderTavern`, `npx nx build TraderTavern`).

## Directory layout
- `src/app` — router entry points, layouts (`src/app/layouts`), route modules (`src/app/routes`).
- `src/pages` — one folder per feature/page (e.g. `screener`, `tickers`, `sync`, `users`), with page-local `components/` subfolders.
- `src/components` — shared, cross-page components (`ui/` for the design-system primitives, `table/`, `charts/`, `auth/`, `screener-filters/`).
- `src/hooks`, `src/lib` — shared hooks and utilities.

## Design direction
The frontend should read as a modern financial dashboard: dense, data-first layouts; tabular numbers and clear alignment in tables; a restrained, mostly-neutral palette with color reserved for meaningful signal (gains/losses, status, roles); minimal decoration. Prioritize data readability over visual flourish in every screen, not just tables.

## Hard rules

### Library dependencies
Avoid adding new dependencies unless necessary. Check whether an existing dependency (shadcn/base-ui primitives, `date-fns`, `lucide-react`/`@remixicon/react`, `recharts`/`lightweight-charts`, etc.) already covers the need before reaching for a new package.

### One component per file
Exactly one component per file. The only exception is a structural component — one that must be wrapped in a context provider and is only ever used right after establishing that context (e.g. a provider + the single consumer component it exists for). Don't use the exception to bundle unrelated components together.

### `const` over `function`
Always define components and functions as `const` arrow functions, not `function` declarations:

```tsx
const TickerCell = ({ ticker }: TickerCellProps) => {
  return <span>{ticker}</span>;
};
```

Use `function` only when structurally required — e.g. when you need `this` binding/dynamic `this` semantics, or a named function expression is needed for recursion/hoisting that arrow functions can't provide.
