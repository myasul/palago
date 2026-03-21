# Tasks: Stock List Page

**Input**: Design documents from `/specs/003-stock-list-page/`  
**Prerequisites**: [plan.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/plan.md),
[spec.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/spec.md),
[research.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/research.md),
[data-model.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/data-model.md),
[contracts/stock-list-page.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/contracts/stock-list-page.md),
[quickstart.md](/Users/matthewyasul/personal/code/palago/specs/003-stock-list-page/quickstart.md)

**Tests**: Query-layer Vitest coverage is required because the query and
pagination rules drive the whole page. UI verification is manual.

**Organization**: Tasks follow the user-mandated phase order. Setup tasks are
in Phase 0, foundational data work is in Phase 1, route scaffolding is in Phase
2, User Story 1 covers the core server-rendered browsing flow, User Story 2
covers interactive filtering/sorting controls, User Story 3 covers shareable
URL-state preservation, and the final phase handles cross-cutting disclosure
and beginner explanations.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label for story-phase tasks only
- Every task includes exact file paths and a Conventional Commit message

## Phase 0: shadcn/ui Setup

**Purpose**: Install the required Nova-style shadcn components before any route
or stock-list component work starts. All tasks run via the shadcn CLI and may
be completed in parallel.

- [x] T001 [P] Run `cd apps/web && npx shadcn@latest add input` to generate `apps/web/components/ui/input.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn input component`
- [x] T002 [P] Run `cd apps/web && npx shadcn@latest add select` to generate `apps/web/components/ui/select.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn select component`
- [x] T003 [P] Run `cd apps/web && npx shadcn@latest add card` to generate `apps/web/components/ui/card.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn card component`
- [x] T004 [P] Run `cd apps/web && npx shadcn@latest add badge` to generate `apps/web/components/ui/badge.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn badge component`
- [x] T005 [P] Run `cd apps/web && npx shadcn@latest add skeleton` to generate `apps/web/components/ui/skeleton.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn skeleton component`
- [x] T006 [P] Run `cd apps/web && npx shadcn@latest add accordion` to generate `apps/web/components/ui/accordion.tsx` using the confirmed `radix-nova` preset; commit message `chore(web): add shadcn accordion component`

## Phase 1: Foundational Data Layer

**Purpose**: Create the reusable stock-list query and its tests. These tasks
block all page and component work.

- [x] T007 Create `apps/web/lib/queries/stock-list.ts` with typed query params (`type`, `sector`, `search`, `sort`, `order`, `page`), `LEFT JOIN` to `companies` via `stocks.companyId`, `LEFT JOIN` to the latest `daily_prices` row per stock, server-side filters for blue-chip/all, exact `companies.sector` matching only, case-insensitive `ILIKE` search on `stocks.symbol` and `companies.name`, sort mapping for `percent_change`, `price`, and `name`, `NULLS LAST` on both sort directions, total-count pagination, page clamping before `OFFSET`, `LIMIT 25`, no runtime calls to PSE Edge or any external provider, and `minimumInvestment` computed in SQL with numeric semantics instead of TypeScript; commit message `feat(web): add stock list query`
- [x] T008 Create `apps/web/lib/queries/stock-list.test.ts` with Vitest coverage for blue-chip filtering, exact sector filtering from `companies.sector` only because `stocks.sector` does not exist, case-insensitive search, all supported sort fields in both directions, null-sort-last behavior, page 1/page N/out-of-range clamping, stocks with no `daily_prices` row still appearing, and `minimumInvestment` returning `null` when `closePrice` is null and a numeric string when valid; commit message `test(web): cover stock list query behavior`

## Phase 2: Route Entry Files

**Purpose**: Replace the placeholder route with the real async page entrypoint
and add route-level loading and error UI.

- [ ] T009 Create `apps/web/app/lists/[type]/page.tsx` as an async Server Component that awaits both `params` and `searchParams` because both are Promises in Next.js 15, redirects invalid `type` values to `/lists/blue-chips`, parses defaults (`sort = percent_change`, `order = desc`, `page = 1`, `search = ""`, `sector = null`), calls `apps/web/lib/queries/stock-list.ts`, passes the resolved `StockListPageResult` into `StockListShell` plus the server-rendered card grid, and performs no runtime calls to PSE Edge or any external provider; commit message `feat(web): add stock list page route`
- [ ] T010 Create `apps/web/app/lists/[type]/loading.tsx` with the shadcn `Skeleton` component from `apps/web/components/ui/skeleton.tsx`, rendering a 375px-friendly placeholder card grid for the list page; commit message `feat(web): add stock list loading state`
- [ ] T011 Create `apps/web/app/lists/[type]/error.tsx` as the route error boundary with a plain user-facing message only and no exposed DB error details or stack traces; commit message `feat(web): add stock list error boundary`

## Phase 3: User Story 1 - Browse Affordable Stocks (Priority: P1) 🎯 MVP

**Goal**: Deliver the server-rendered stock browsing flow with cards, grid,
empty state, and pagination.

**Independent Test**: Open `/lists/blue-chips` and confirm a user can browse
stock cards, see minimum investment prominently, keep stocks without price data
visible with `—`, and paginate through the result set.

- [ ] T012 [US1] Create `apps/web/components/stock-list/StockCard.tsx` as a Server Component with no `use client`, receiving a `StockListEntry`, reading sector from `companies.sector`, displaying the stored `logoUrl` or a placeholder, formatting `closePrice`, `percentChange`, and `minimumInvestment` as `₱`/percentage values or `—`, converting numeric strings with `Number()` only in this file because Drizzle returns `numeric` columns as strings, never recomputing `minimumInvestment` in TypeScript — it arrives as a numeric string from the SQL query and must only be passed through `Number()` for formatting, never recalculated as `boardLot * closePrice` in component code, linking to `/stocks/[symbol]`, and using Nova compact spacing without custom padding overrides; commit message `feat(web): add stock card component`
- [ ] T013 [US1] After T012 is complete, create `apps/web/components/stock-list/StockListGrid.tsx` as a Server Component with no `use client`, rendering a mobile-first 375px stock-card grid wrapper around `StockCard`; commit message `feat(web): add stock list grid`
- [ ] T014 [US1] After T013 is complete, create `apps/web/components/stock-list/EmptyState.tsx` as a Server Component with no `use client`, rendering a plain-English empty state that suggests clearing search or changing sector; commit message `feat(web): add stock list empty state`
- [ ] T015 [US1] After T014 is complete, create `apps/web/components/stock-list/Pagination.tsx` as a Server Component with no `use client`, using plain anchor tags instead of `useRouter`, deriving `?page=N` URLs from the current `StockListState`, and rendering disabled first/last-page states correctly; commit message `feat(web): add stock list pagination`

## Phase 4: User Story 2 - Narrow the List by Intent (Priority: P2)

**Goal**: Add the client-side controls that update shareable URL state without
breaking the server-first rendering model.

**Independent Test**: Starting from a populated list, change search, sector,
sort field, and sort direction and confirm the URL updates, page resets to `1`,
and the server-rendered list reflects the new state.

- [ ] T016 [US2] Create `apps/web/components/stock-list/StockListControls.tsx` as the only interactive controls component with `use client`, using `apps/web/components/ui/input.tsx` for debounced 300ms search, `apps/web/components/ui/select.tsx` for sector and sort selection, URL updates via `useRouter` and `useSearchParams`, page reset to `1` on every filter or sort change, and props-only initial values rather than direct route-state ownership; commit message `feat(web): add stock list controls`
- [ ] T017 [US2] Create `apps/web/components/stock-list/StockListShell.tsx` as the only Client Component rendered directly by `apps/web/app/lists/[type]/page.tsx`, receiving `type`, `sector`, `search`, `sort`, `order`, `page`, and `sectorOptions`, and doing no rendering logic beyond passing props into `StockListControls`; commit message `feat(web): add stock list shell`

## Phase 5: User Story 3 - Share and Resume a Specific View (Priority: P3)

**Goal**: Keep URL parameters as the single source of truth so refreshing,
sharing, and switching list types preserves the same view.

**Independent Test**: Open a filtered and paginated stock-list URL in a fresh
session and confirm the same type, filters, sorting, and page state are restored
from the URL alone.

- [ ] T018 [US3] Update `apps/web/app/lists/[type]/page.tsx`, `apps/web/components/stock-list/StockListControls.tsx`, and `apps/web/components/stock-list/Pagination.tsx` so URL parameters remain the single source of truth across refresh, direct navigation, and type switches, preserving `sector`, `sort`, `order`, `search`, and `page`, while clamping out-of-range pages server-side to the nearest valid page; commit message `feat(web): preserve stock list url state`

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Add required disclosure and beginner-help content that applies on
every page render.

- [ ] T019 [P] Add the `Data delayed 15 minutes` disclosure to `apps/web/app/lists/[type]/page.tsx` and any supporting server-rendered stock-list layout file so it appears on every render regardless of whether prices exist; commit message `feat(web): add stock list delay disclosure`
- [ ] T020 [P] Update `apps/web/components/stock-list/StockCard.tsx` to add keyboard-accessible shadcn `Accordion` sections from `apps/web/components/ui/accordion.tsx` with plain Filipino explanations for board lot and percent change, keeping `StockCard` as a Server Component with no `use client` and rendering the accordion as a nested interactive boundary rather than turning `StockCard` itself into a Client Component; commit message `feat(web): add stock card beginner explanations`

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0** must complete before any later phase because all required shadcn
  components are installed there.
- **Phase 1** blocks every later phase because the route depends on the query.
- **Phase 2** depends on Phase 1.
- **Phase 3** depends on Phase 2 because the route needs the card/grid/empty
  state/pagination components to render meaningful output.
- **Phase 4** depends on Phase 3 because the controls operate on the server
  page and its result shape.
- **Phase 5** depends on Phases 2, 3, and 4 because it integrates page,
  controls, and pagination URL behavior.
- **Phase 6** depends on Phase 3, with `T020` also depending on `T012`.

### User Story Dependencies

- **US1** depends on Setup, Foundational, and Route phases.
- **US2** depends on US1 because filtering controls need the rendered page and
  stock list result contract in place.
- **US3** depends on US1 and US2 because it is expressed through the route,
  controls, and pagination state handling.

### Within User Story 1

- `T012` before `T013`
- `T013` before `T014`
- `T014` before `T015`

## Parallel Opportunities

- `T001` through `T006` can run in parallel because each installs a different
  shadcn component file.
- `T019` and `T020` can run in parallel once US1 is complete.

## Parallel Example

```bash
# Phase 0 shadcn setup can be split across multiple workers:
Task: "Run cd apps/web && npx shadcn@latest add input for apps/web/components/ui/input.tsx"
Task: "Run cd apps/web && npx shadcn@latest add select for apps/web/components/ui/select.tsx"
Task: "Run cd apps/web && npx shadcn@latest add card for apps/web/components/ui/card.tsx"

# Polish tasks can also run in parallel after US1:
Task: "Add data delay disclosure in apps/web/app/lists/[type]/page.tsx"
Task: "Add beginner accordion explanations in apps/web/components/stock-list/StockCard.tsx"
```

## Implementation Strategy

### MVP First

1. Complete Phase 0
2. Complete Phase 1
3. Complete Phase 2
4. Complete Phase 3
5. **STOP and VALIDATE**: confirm `/lists/blue-chips` renders the core
   browsing experience before adding interactive controls

### Incremental Delivery

1. Setup shadcn dependencies
2. Deliver the stock-list query and tests
3. Deliver the async Next.js 15 page route with loading and error files
4. Deliver US1 browsing components
5. Deliver US2 filter/sort controls
6. Deliver US3 URL-state preservation
7. Deliver cross-cutting disclosure and beginner explanations

## Manual Verification

> [MANUAL] Open `/lists/blue-chips` and confirm cards render with no runtime API calls visible in the Network tab.
> [MANUAL] Confirm minimum investment is visible on every card.
> [MANUAL] Confirm a stock with no price row still renders with `—` for price, percent change, and minimum investment.
> [MANUAL] Confirm changing search, sector, sort, or order updates the URL and preserves other params.
> [MANUAL] Confirm refreshing the page restores the exact same view.
> [MANUAL] Confirm switching between `/lists/blue-chips` and `/lists/all` preserves sector, sort, order, and search params.
> [MANUAL] Confirm a sector filter that matches nothing in the new list type shows the empty state instead of clearing the filter.
> [MANUAL] Confirm an out-of-range `?page=` value clamps to the nearest valid page.
> [MANUAL] Confirm mobile layout at 375px width is readable and compact for `StockCard`, `EmptyState`, `Pagination`, and `StockListControls`.

## Notes

- `stocks.sector` does not exist anywhere in this feature. Always read sector
  from `companies.sector`.
- Drizzle returns numeric columns as strings. `Number()` conversion happens only
  in `apps/web/components/stock-list/StockCard.tsx` at display time.
- `minimumInvestment` is computed in SQL with numeric semantics, never in
  TypeScript.
- `params` and `searchParams` are Promises in Next.js 15 and must always be
  awaited.
- `StockCard` must never have `use client`, even if rendered beneath a client
  shell.
- `Pagination` uses plain anchor tags, not `useRouter`.
- No runtime calls to PSE Edge or any external provider are allowed for this
  page.
