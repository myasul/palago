# Implementation Plan: Stock Price Chart

**Branch**: `005-stock-price-chart`  
**Spec**: [spec.md](./spec.md)  
**Created**: 2026-03-22  
**Status**: Ready for implementation

## Summary

Add a close-price history chart below the existing 52-week range section on
`/stocks/[symbol]` without changing the rest of the stock detail page. The
implementation will follow the constitution's partial-rendering pattern: the
route awaits `params` and `searchParams`, passes `symbol` and normalized
`range` into a Suspense-wrapped async server section, and renders a client-only
chart component that owns the range toggle, chart display, and empty-state
behavior.

## Technical Context

**Language/Version**: strict TypeScript 5.x  
**Primary Dependencies**: Next.js 15 App Router, React 19, Recharts `^2.15.3`,
Tailwind CSS v4, shadcn/ui `Skeleton`, `@palago/db`  
**Storage**: PostgreSQL via Supabase (`daily_prices`)  
**Testing**: `npx tsc -p apps/web/tsconfig.json --noEmit` and targeted Vitest
coverage in `apps/web`  
**Target Platform**: Mobile-first web route at `/stocks/[symbol]`  
**Project Type**: Monorepo web application  
**Performance Goals**: Range changes refresh only the chart section, keep the
rest of the detail page visually stable, and preserve a scoped loading
placeholder at 140px chart height  
**Constraints**:
- `page.tsx` must await both `params` and `searchParams` because both are
  Promises in Next.js 15.
- `page.tsx` must normalize unsupported or missing `range` values to `1m`.
- `page.tsx` must wrap `StockDetailChartServer` in `Suspense` with
  `ChartSkeleton` as the fallback and must not call `getStockPriceHistory`
  directly.
- `StockDetailChartServer.tsx` is the only new section-level fetcher and maps
  `1w`, `1m`, `6m`, `1y` to `7`, `30`, `180`, `365` days respectively.
- `apps/web/lib/queries/stock-price-history.ts` must return ascending
  `trade_date` rows for one stock, include null close prices unchanged, and
  return `[]` for an empty range.
- Query-layer numeric strings must remain strings or `null`; `Number()` is
  forbidden in the query layer and allowed only in the component/view-model
  layer.
- The chart must render missing close prices as gaps with
  `connectNulls={false}` and must render a visible dot when the range contains
  exactly one valid close point.
- Volume, candlesticks, intraday data, annotations, extra Y-axis labels, and
  end-to-end tests are out of scope.
- No schema changes, migrations, API routes, or external provider calls are
  allowed.
**Scale/Scope**: One existing route update, three new stock-detail components,
one new query module, targeted tests, and planning artifacts for a single chart
section

### Implementation Surface

- Application: `apps/web`
- Data access: direct Drizzle queries via `@palago/db`
- Styling: Tailwind CSS v4 and the existing stock-detail visual language

## Constitution Check

### I. Beginner-First Mobile Experience

Pass.

- The chart is a mobile-first addition below the 52-week range section and must
  remain readable on the existing stock-detail layout shown in the provided
  screenshot.
- Labels remain in English and the feature introduces no new mandatory jargon.
- The chart supplements the page without displacing the minimum investment,
  trading context, or other beginner-focused sections.

### II. Source Isolation Through Provider Boundaries

Pass.

- The feature reads only persisted `daily_prices` data from the internal
  database.
- No runtime PSE Edge calls or provider mixing are introduced.

### III. Financial Data Precision & Schema Discipline

Pass.

- `daily_prices.close_price` remains a string in the query layer and is not
  converted until display-time chart mapping.
- Null close values stay null and are never replaced with zero.
- No schema changes or manual migration edits are required.

### IV. Validated, Observable Ingestion

Pass by non-applicability.

- This is a read-only web feature.
- Existing ingestion and validation pipelines remain the source of truth for
  `daily_prices`.

### V. Philippine Market Time & User Transparency

Pass.

- The feature displays stored trade dates only and must not rely on
  server-local time for range logic or formatting.
- Existing delayed-data disclosure on the stock detail page remains in place;
  this feature does not replace or remove it.
- Tooltip and axis-date formatting will follow Philippine market-date context.

## Project Structure

### Documentation (this feature)

```text
specs/005-stock-price-chart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── stock-price-chart.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   └── stocks/
│       └── [symbol]/
│           └── page.tsx
├── components/
│   └── stock-detail/
│       ├── ChartSkeleton.tsx
│       ├── StockDetailChart.tsx
│       ├── StockDetailChartServer.tsx
└── lib/
    └── queries/
        ├── stock-detail.ts
        ├── stock-price-history.ts
        └── stock-price-history.test.ts
```

**Structure Decision**: Use the existing `apps/web` App Router route plus a
new section-specific query and stock-detail components. Keep data fetching in
Server Components and direct Drizzle queries, with a single client boundary for
chart interactivity.

## Phase 0: Research

Research outputs are captured in [research.md](./research.md). Key questions
resolved:

- How to apply the constitution's partial-rendering pattern to a range-driven
  stock-detail section in Next.js 15
- How to shape `daily_prices` query results so null close values stay visible as
  chart gaps without leaking numeric conversion into the query layer
- How to make single-point chart ranges render reliably in Recharts
- How to format trade dates for chart labels and tooltips without relying on
  server-local time

## Phase 1: Design

Design outputs are captured in:

- [data-model.md](./data-model.md)
- [contracts/stock-price-chart.md](./contracts/stock-price-chart.md)
- [quickstart.md](./quickstart.md)

### Query Design

The section-level query will:

1. Accept a normalized stock symbol and a day-window value
2. Select only `trade_date` and `close_price` from `daily_prices` for the
   matching stock
3. Filter to rows within the selected trailing day window
4. Order results ascending by `trade_date`
5. Preserve `close_price` as `string | null`
6. Exclude `volume` and every other column from the result shape
7. Return `[]` when no rows match the selected period

### Rendering Design

- `page.tsx` awaits `params` and `searchParams`, normalizes `range`, and wraps
  `StockDetailChartServer` in `Suspense`.
- `StockDetailChartServer.tsx` is the only chart-data fetcher and maps the
  selected range to the day window passed into the query.
- `StockDetailChart.tsx` is a thin `use client` component that:
  - converts numeric strings to chart numbers
  - renders the Recharts line and tooltip
  - preserves null values as gaps
  - computes period low/high from non-null values only
  - handles the single-valid-point dot edge case
  - pushes `/stocks/${symbol}?range=${range}` on toggle
- `ChartSkeleton.tsx` provides a section-scoped fallback sized to the chart
  area only.

## Phase 2: Implementation Outline

1. Create `apps/web/lib/queries/stock-price-history.ts`:
   - accept `symbol` and `days`
   - resolve the stock by symbol through internal tables
   - select only `trade_date` and `close_price`
   - filter by trailing day window
   - return ascending rows
   - preserve null close rows and avoid `Number()`

2. Add `apps/web/lib/queries/stock-price-history.test.ts` covering:
   - empty result returns `[]`
   - null close rows remain present
   - ascending order is preserved
   - day-window filtering is correct for `7`, `30`, `180`, `365`

3. Create `apps/web/components/stock-detail/StockDetailChartServer.tsx` as the
   async section Server Component that:
   - accepts `symbol` and `range`
   - maps range to day count
   - fetches chart data
   - passes raw rows to the client chart

4. Create `apps/web/components/stock-detail/StockDetailChart.tsx` as the only
   new interactive Client Component that:
   - converts string prices to numbers locally
   - renders the range-toggle chips
   - renders the chart, tooltip, summary row, and footer
   - shows the plain empty-state message when there are no usable prices
   - ensures a single valid point renders with a visible dot

5. Create `apps/web/components/stock-detail/ChartSkeleton.tsx` with a 140px
   chart-height fallback using shadcn `Skeleton`.

6. Update `apps/web/app/stocks/[symbol]/page.tsx` to:
   - await both `params` and `searchParams`
   - normalize the incoming `range` (default to "1m" if absent or invalid)
   - leave the existing page query untouched
   - pass both `symbol` and `range` as props to `StockDetailChartServer`
   - insert the chart section below `StockDetailRange52`
   - wrap `StockDetailChartServer` in `Suspense` with `ChartSkeleton`
     as the fallback

7. Run manual verification from [quickstart.md](./quickstart.md) at 375px width
   using the provided stock-detail visual reference.

## Risks & Mitigations

- **Risk**: The parent page could accidentally fetch chart data and break
  section-scoped rendering.
  **Mitigation**: Keep `getStockPriceHistory` isolated to
  `StockDetailChartServer.tsx` and document that boundary in the contract.
- **Risk**: Null close values could be filtered out or zero-filled, creating a
  misleading chart.
  **Mitigation**: Preserve nulls end-to-end in the query and require visible
  chart gaps in the contract and tests.
- **Risk**: Recharts may hide a single valid data point when dots are disabled.
  **Mitigation**: Plan explicit single-point dot handling and cover it in the
  client-component verification steps.
- **Risk**: Date formatting could vary by machine locale or server time.
  **Mitigation**: Use explicit Philippine-market date formatting rules in the
  rendering layer.

## Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh codex` after the planning
artifacts are written so the agent context captures the chart-specific Next.js
15, Suspense, and Recharts constraints for this feature.

## Post-Design Constitution Check

Pass. The planned implementation still preserves:

- beginner-first mobile readability
- internal-database-only runtime behavior
- numeric precision discipline
- section-scoped partial rendering through Suspense
- Philippine-market date handling and existing delayed-data transparency
