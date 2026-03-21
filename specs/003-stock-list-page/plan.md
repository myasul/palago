# Implementation Plan: Stock List Page

**Branch**: `003-stock-list-page`  
**Spec**: [spec.md](./spec.md)  
**Created**: 2026-03-21  
**Status**: Ready for implementation

## Summary

Build a mobile-first stock browsing page at `/lists/[type]` for beginner
Filipino investors. The page will render server-fetched stock list data from
`stocks`, `companies`, and the latest available `daily_prices` row per stock,
while keeping all list state in URL parameters. Server Components remain the
default; only the interactive filter controls live in a thin Client Component
shell.

## Technical Context

**Application**: `apps/web`  
**Framework**: Next.js 15 App Router with React 19  
**Language**: strict TypeScript  
**Styling**: Tailwind CSS v4, shadcn/ui with `radix-nova`, `tw-animate-css`  
**Data access**: Direct Drizzle queries via `@palago/db`  
**Database**: PostgreSQL via Supabase  
**Runtime model**: Server Components by default, thin Client Component for list
controls only

### Confirmed Dependencies

- `next` `^15.2.4`
- `react` `^19.1.0`
- `react-dom` `^19.1.0`
- `recharts` `^2.15.3`
- `tailwind-merge` `^3.3.0`
- `clsx` `^2.1.1`
- `lucide-react` `^0.511.0`
- `class-variance-authority` `^0.7.1`
- `tailwindcss` `^4.2.2`
- `@tailwindcss/postcss` `^4.2.2`
- `tw-animate-css` `^1.4.0`
- `typescript` `^5.8.2`

### Constraints

- No API route is needed for this page.
- All list data is fetched server-side from the database only.
- `searchParams` and route `params` are Promises in Next.js 15 and must be
  awaited.
- `stocks` does not contain `sector` or `subsector`; these live on
  `companies`.
- Drizzle returns `numeric` columns as strings; conversion to `Number()` is
  allowed only at display time.
- Minimum investment must preserve numeric semantics in the query layer.
- Stocks with no latest `daily_prices` row must still render.
- Null sort values must always sort last.

## Constitution Check

### I. Beginner-First Mobile Experience

Pass.

- The page is explicitly mobile-first and oriented around scanning by company,
  sector, affordability, and latest move.
- Minimum investment is the most prominent differentiated field.
- The plan includes plain Filipino help text for beginner terms and a clear
  empty state.

### II. Source Isolation Through Provider Boundaries

Pass.

- The page reads only from persisted internal tables.
- No runtime third-party requests or provider merges are introduced.

### III. Financial Data Precision & Schema Discipline

Pass.

- The plan keeps `numeric` values in the query layer and converts only in the
  rendering layer.
- No schema changes or migrations are required for this feature.

### IV. Validated, Observable Ingestion

Pass by non-applicability.

- This feature is read-only and does not modify ingestion flows.
- Existing ingestion guarantees remain the data source.

### V. Philippine Market Time & User Transparency

Pass.

- The page will disclose delayed data on the list experience.
- Latest available price rows are read from stored market data rather than local
  machine time.

## Project Structure

### New Files
- `apps/web/lib/queries/stock-list.ts`
- `apps/web/app/lists/[type]/loading.tsx`
- `apps/web/app/lists/[type]/error.tsx`
- `apps/web/components/stock-list/StockCard.tsx`
- `apps/web/components/stock-list/StockListControls.tsx`
- `apps/web/components/stock-list/StockListGrid.tsx`
- `apps/web/components/stock-list/StockListShell.tsx`
- `apps/web/components/stock-list/EmptyState.tsx`
- `apps/web/components/stock-list/Pagination.tsx`
- `specs/003-stock-list-page/research.md`
- `specs/003-stock-list-page/data-model.md`
- `specs/003-stock-list-page/contracts/stock-list-page.md`
- `specs/003-stock-list-page/quickstart.md`

### Pagination Component Decision

`Pagination.tsx` is implemented as a Server Component. It renders prev/next
and page number controls as plain anchor tags pointing to `?page=N` URL
variants derived from the current `StockListState`. No client-side JS is
required — page changes trigger a full server navigation, which is acceptable
for MVP. This avoids adding another `use client` boundary and keeps the
component tree simpler. Revisit for client-side soft navigation in a later
iteration if page-change latency becomes a UX concern.

### Existing Files To Update

- `apps/web/app/lists/[type]/page.tsx`

## Phase 0: Research

Research outputs are captured in [research.md](./research.md). Key questions
resolved:

- How to fetch the latest price row per stock cleanly with Drizzle
- How to preserve numeric precision while still rendering beginner-friendly
  formatted values
- How to implement URL-driven controls in Next.js 15 without breaking the
  smart/dumb split
- How to implement page clamping cleanly with server-side pagination

## Phase 1: Design

Design outputs are captured in:

- [data-model.md](./data-model.md)
- [contracts/stock-list-page.md](./contracts/stock-list-page.md)
- [quickstart.md](./quickstart.md)

### Query Design

The page-level query will:

1. Start from active `stocks`
2. Inner join `companies` via `stocks.companyId`
3. Left join a latest-price subquery that returns one row per stock
4. Apply server-side filters for:
   - list type
   - exact sector
   - case-insensitive symbol/company search
5. Apply server-side ordering with `NULLS LAST`
6. Count total rows for pagination
7. Clamp the requested page to the valid range
8. Re-run or scope the final select with `LIMIT 25 OFFSET ...`

### Rendering Design

- `page.tsx` remains the data-fetching Server Component.
- `StockListShell.tsx` is the only directly rendered Client Component.
- `StockListControls.tsx` owns input interactivity and URL mutations.
- `StockCard.tsx`, `StockListGrid.tsx`, `EmptyState.tsx`, and `Pagination.tsx`
  remain presentation-first and do not fetch data.

## Phase 2: Implementation Outline

1. Install required shadcn/ui components via the CLI before any component
   implementation begins:
     npx shadcn@latest add input select card badge skeleton tooltip
   These must be present in `apps/web/components/ui/` before any stock-list
   component references them.

2. Build the Drizzle query function in `apps/web/lib/queries/stock-list.ts`:
   latest price left join, sector/search/blue-chip filters, `NULLS LAST`
   sorting, total count, and clamped pagination. No `Number()` conversion here.

3. Replace the placeholder `apps/web/app/lists/[type]/page.tsx` with a real
   Next.js 15 async page that awaits `params` and `searchParams`, parses
   defaults, validates `type`, redirects invalid types, calls the query
   function, and passes plain serializable data to the component tree.

4. Implement the stock list component set in this order:
   - `StockCard.tsx` (Server Component — no `use client`)
   - `StockListGrid.tsx` (Server Component — layout wrapper)
   - `EmptyState.tsx` (Server Component)
   - `Pagination.tsx` (Server Component — justified below)
   - `StockListControls.tsx` (Client Component — search, sector, sort)
   - `StockListShell.tsx` (thin `use client` wrapper)

5. Add route-level `loading.tsx` and `error.tsx`.

6. Verify the page against the manual verification checklist in quickstart.md.

## Risks & Mitigations

- **Risk**: Query complexity around latest price row and total count
  increases drift risk.
  **Mitigation**: Keep the latest-price join isolated and documented in one
  query helper.
- **Risk**: Numeric strings accidentally converted too early.
  **Mitigation**: Keep query output typed as strings/null and convert only in
  display helpers inside presentational components.
- **Risk**: Client controls accidentally absorb rendering logic.
  **Mitigation**: Keep `StockListShell` thin and push rendering back into Server
  Components.
- **Risk**: Next.js 15 async param rules get violated in follow-up edits.
  **Mitigation**: Enforce the async page signature in the plan and quickstart.

## Agent Context Update

The repository-local `.specify/scripts/bash/update-agent-context.sh` script is
not present, so no automated agent-context update could be run for this plan.
No additional agent context file was modified manually.

## Post-Design Constitution Check

Pass. The planned implementation still preserves:

- mobile-first beginner comprehension
- URL-driven shareable state
- internal-data-only runtime behavior
- numeric precision discipline
- server-component-first architecture
