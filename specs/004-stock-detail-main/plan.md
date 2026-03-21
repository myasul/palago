# Implementation Plan: Stock Detail Main

**Branch**: `004-stock-detail-main`  
**Spec**: [spec.md](./spec.md)  
**Created**: 2026-03-21  
**Status**: Ready for implementation

## Summary

Build the first stock detail experience at `/stocks/[symbol]` for beginner
Filipino investors. The page will render server-fetched stock identity,
last-close pricing, minimum investment, today's trading context, and 52-week
range context from internal database tables only. Server Components remain the
default; only the nav search input and reusable toast handler cross the client
boundary.

## Technical Context

**Application**: `apps/web`  
**Framework**: Next.js 15 App Router with React 19  
**Language**: strict TypeScript  
**Styling**: Tailwind CSS v4, shadcn/ui with `radix-nova`, `tw-animate-css`  
**Notifications**: `sonner` via shadcn/ui  
**Data access**: Direct Drizzle queries via `@palago/db`  
**Database**: PostgreSQL via Supabase  
**Runtime model**: Server Components by default; only `StockDetailSearch` and
`ToastHandler` use `use client`

### Confirmed Dependencies

- `next` `^15.x`
- `react` `^19.x`
- `react-dom` `^19.x`
- `lucide-react`
- `sonner` via `npx shadcn@latest add sonner`
- `tailwindcss` `^4.x`
- `@tailwindcss/postcss` `^4.x`
- `tw-animate-css`
- `typescript` `^5.x`

### Constraints

- No API routes are allowed for this feature.
- All data is fetched in Server Components using direct Drizzle queries.
- No runtime calls to PSE Edge or any other external provider are allowed.
- Route `params` are Promises in Next.js 15 and must be awaited.
- Only two Client Components are allowed on this page:
  - `apps/web/components/stock-detail/StockDetailSearch.tsx`
  - `apps/web/components/ToastHandler.tsx`
- Drizzle returns PostgreSQL `numeric` values as strings; conversion to
  `Number()` is allowed only at display time.
- `daily_prices.percent_change` is read as stored and must never be
  recalculated on the detail page.
- `volume` is expected to be null for backfilled rows and must display as `—`.
- The 52-week materialized view exists, but its actual SQL column names are
  `high_52w` and `low_52w`; the query layer should alias them to the page model
  expected by this feature.

## Constitution Check

### I. Beginner-First Mobile Experience

Pass.

- The page is explicitly mobile-first and must answer the three beginner
  questions above the fold.
- Labels remain in English.
- This slice does not expose the jargon accordion yet; it is deferred to spec
  `006`, which keeps this scope clean and aligned with the approved roadmap.

### II. Source Isolation Through Provider Boundaries

Pass.

- The page reads only persisted rows from `stocks`, `companies`,
  `daily_prices`, and `stock_52_week`.
- No provider mixing or runtime provider calls are introduced.

### III. Financial Data Precision & Schema Discipline

Pass.

- Numeric values stay as strings in the query layer.
- Minimum investment uses numeric semantics from stored values.
- No schema changes or migrations are required.

### IV. Validated, Observable Ingestion

Pass by non-applicability.

- This is a read-only UI feature.
- Existing ingestion guarantees remain the source of truth.

### V. Philippine Market Time & User Transparency

Pass.

- The page must disclose the 15-minute delay in the header.
- Trade-date display comes from stored market rows, not server-local time.
- No new timezone logic is introduced beyond reading the persisted latest rows.

## Project Structure

### New Files

- `apps/web/app/stocks/[symbol]/loading.tsx`
- `apps/web/app/stocks/[symbol]/error.tsx`
- `apps/web/lib/queries/stock-detail.ts`
- `apps/web/components/stock-detail/StockDetailHeader.tsx`
- `apps/web/components/stock-detail/StockDetailMinInvest.tsx`
- `apps/web/components/stock-detail/StockDetailTrading.tsx`
- `apps/web/components/stock-detail/StockDetailRange52.tsx`
- `apps/web/components/stock-detail/StockDetailSearch.tsx`
- `apps/web/components/ToastHandler.tsx`
- `specs/004-stock-detail-main/research.md`
- `specs/004-stock-detail-main/data-model.md`
- `specs/004-stock-detail-main/contracts/stock-detail-page.md`
- `specs/004-stock-detail-main/quickstart.md`

### Existing Files To Update

- `apps/web/app/stocks/[symbol]/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/lists/[type]/page.tsx`

## Phase 0: Research

Research outputs are captured in [research.md](./research.md). Key questions
resolved:

- How to model latest and previous `daily_prices` rows cleanly for one stock
- How to handle the two toast flows without introducing page-specific client
  logic everywhere
- How to keep range-bar and subtitle derivations pure, testable, and server-safe
- How to alias the existing `stock_52_week` materialized-view columns into the
  UI model without schema changes

## Phase 1: Design

Design outputs are captured in:

- [data-model.md](./data-model.md)
- [contracts/stock-detail-page.md](./contracts/stock-detail-page.md)
- [quickstart.md](./quickstart.md)

### Query Design

The page-level query will:

1. Normalize the requested symbol to uppercase before lookup
2. Start from `stocks`
3. Inner join `companies` via `stocks.companyId`
4. Left join the most recent `daily_prices` row per stock
5. Left join the second most recent `daily_prices` row per stock for
   `prevClose`
6. Left join `stock_52_week` and alias `high_52w`/`low_52w` into the page
   result model
7. Return one `StockDetailPageResult` with nullable price-dependent fields
8. Signal `not found` distinctly from `found with no price rows`

### Rendering Design

- `page.tsx` remains the data-fetching Server Component and owns redirect or
  toast-parameter decisions.
- `StockDetailSearch.tsx` is the only page-specific interactive Client
  Component and owns nav-bar search submission.
- `ToastHandler.tsx` is a reusable thin Client Component that reads a single URL
  param, triggers `sonner`, then clears the param.
- `StockDetailHeader.tsx`, `StockDetailMinInvest.tsx`,
  `StockDetailTrading.tsx`, and `StockDetailRange52.tsx` remain presentational
  Server Components.
- Pure formatting and range-derivation helpers should live next to the query or
  within the stock-detail module and be unit tested without React.

## Phase 2: Implementation Outline

1. Install `sonner` through the shadcn CLI and add `<Toaster />` to
   `apps/web/app/layout.tsx`.

2. Create `apps/web/components/ToastHandler.tsx` as a reusable thin Client
   Component that:
   - checks for one URL parameter
   - triggers an informational toast
   - clears the parameter with `useRouter.replace()`

3. Patch `apps/web/app/lists/[type]/page.tsx` to render `ToastHandler` for
   `?toast=stock-not-found`.

4. Build `apps/web/lib/queries/stock-detail.ts`:
   - uppercase symbol normalization
   - stock/company lookup
   - latest row for last close and today's metrics
   - second latest row for previous close
   - optional 52-week join
   - no `Number()` conversion
   - explicit distinction between not-found and no-price-data states

5. Replace `apps/web/app/stocks/[symbol]/page.tsx` with a real async Next.js 15
   page that:
   - awaits `params`
   - redirects invalid symbols to `/lists/blue-chips?toast=stock-not-found`
   - appends `?toast=no-price-data` when the symbol exists but has no price data
   - renders only Server Components plus `StockDetailSearch` and
     `ToastHandler`

6. Add `loading.tsx` and `error.tsx` for the stock-detail route.

7. Implement the stock-detail components in this order. Each component
   depends on the query function from step 4 being complete. The
   ordering within components is for logical grouping, not strict
   dependency — all five can reference the same query result shape:
   - `StockDetailSearch.tsx` (Client Component — no query dependency)
   - `StockDetailHeader.tsx`
   - `StockDetailMinInvest.tsx`
   - `StockDetailTrading.tsx`
   - `StockDetailRange52.tsx`

8. Add Vitest coverage for:
   - stock-detail query result states
   - last-close/open subtitle logic
   - intraday range dot position
   - today's range secondary text
   - 52-week label logic
   - lowercase symbol normalization

9. Verify the page manually at 375px width using [quickstart.md](./quickstart.md).

## Risks & Mitigations

- **Risk**: Confusion between "current" price and last close could leak into the
  implementation.
  **Mitigation**: Standardize on "Last Close" across the query model, plan, and
  UI components for this spec.
- **Risk**: The `stock_52_week` materialized view column names differ from the
  user-facing naming in the spec.
  **Mitigation**: Alias the SQL columns in the query layer and document the
  mapping in the data model and contract.
- **Risk**: Toast-trigger navigation could re-trigger on refresh.
  **Mitigation**: Centralize URL-param clearing in `ToastHandler`.
- **Risk**: The route could accidentally grow extra client boundaries.
  **Mitigation**: Keep the client-component allowance explicit in the plan and
  tasks.

## Agent Context Update

The repository-local `.specify/scripts/bash/update-agent-context.sh` script is
not present, so no automated agent-context update could be run for this plan.
No additional agent context file was modified manually.

## Post-Design Constitution Check

Pass. The planned implementation still preserves:

- mobile-first beginner comprehension
- minimum investment and delayed-data disclosure
- internal-data-only runtime behavior
- numeric precision discipline
- server-component-first architecture
