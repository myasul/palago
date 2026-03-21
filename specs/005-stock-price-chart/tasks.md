# Tasks: Stock Price Chart

**Input**: Design documents from `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/`
**Prerequisites**: `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/plan.md`, `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/spec.md`, `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/research.md`, `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/data-model.md`, `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/contracts/stock-price-chart.md`

**Tests**: Targeted Vitest coverage is required for the new stock-price-history query. Manual mobile verification is required per quickstart.

**Organization**: Tasks are grouped by phase and user story so the feature can be delivered incrementally while preserving the fixed implementation sequence requested for `T001` through `T007`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every implementation task MUST also update `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` from `[ ]` to `[x]` in the same commit
- Every implementation task includes a Conventional Commit message to use when the task is completed

## Phase 1: Query Layer

**Purpose**: Build and test the data access function that all subsequent
phases depend on.

- [ ] T001 Create `/Users/matthewyasul/personal/code/palago-2/apps/web/lib/queries/stock-price-history.ts` with `getStockPriceHistory({ symbol, days })`, resolving the stock by symbol via `stocks`, selecting only `trade_date` and `close_price` from `daily_prices`, filtering with `trade_date >= CURRENT_DATE - INTERVAL {days} days`, ordering `trade_date ASC`, preserving null `closePrice` rows, returning `[]` when no rows match, forbidding `Number()` anywhere in the file, and updating `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` in the same commit. Commit: `feat(web): add stock price history query`

---

## Phase 2: Server Component + Skeleton

**Purpose**: Build the server-side data fetcher and Suspense fallback that
the client chart depends on.

- [ ] T002 Create `/Users/matthewyasul/personal/code/palago-2/apps/web/lib/queries/stock-price-history.test.ts` with Vitest coverage for empty ranges returning `[]`, null close rows remaining included, ascending `trade_date` ordering, correct day-window filtering for `7`, `30`, `180`, and `365`, and correct single-row handling, then update `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` in the same commit. Commit: `test(web): cover stock price history query`
- [ ] T003 Create `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChartServer.tsx` as an async Server Component with no `use client`, accepting `symbol` and `range`, mapping `1w` to `7`, `1m` to `30`, `6m` to `180`, `1y` to `365`, treating any unrecognised range as `1m` (maps to 30 days) as a defensive fallback, since `page.tsx` normalises the value first, calling `getStockPriceHistory({ symbol, days })`, passing `rows`, `symbol`, and `selectedRange` to `StockDetailChart`, and updating `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` in the same commit. Commit: `feat(web): add stock detail chart server section`
- [ ] T004 [P] Create `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/ChartSkeleton.tsx` as a Server Component with no `use client`, using shadcn `Skeleton` to render the white chart card treatment with matching padding and border radius and a 140px chart skeleton area, then update `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` in the same commit. Commit: `feat(web): add stock detail chart skeleton`

**Checkpoint**: Query, query tests, server wrapper, and Suspense fallback are ready for story work.

---

## Phase 3: User Story 1 - See Recent Price History Quickly (Priority: P1) 🎯 MVP

**Goal**: Render the default one-month chart below the 52-week range section with correct close-price-only data, null-gap handling, summary values, and empty-state behavior.

**Independent Test**: Open `/stocks/[symbol]` on a mobile viewport and confirm the chart appears below the 52-week range section, defaults to `1M`, shows period low/high and trading-day count when usable data exists, and shows the empty-state message when no usable close data exists.

### Implementation for User Story 1

- [ ] T005 [US1] Create `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChart.tsx` as a `use client` Recharts component that accepts `rows`, `symbol`, and `selectedRange`; converts `closePrice` to numbers only in this file; derives `chartData`, `nonNullPrices`, `periodLow`, `periodHigh`, `tradingDayCount`, and `isEmptyState`; hides chart, summary row, and footer for the empty state; renders the `PRICE HISTORY` header, `1W · 1M · 6M · 1Y` chips, `router.push(\`/stocks/${symbol}?range=${range}\`)`, a `ResponsiveContainer`at height`140`, `connectNulls={false}`, 4 to 5 x-axis labels, hidden y-axis, horizontal dashed grid, custom tooltip with peso formatting or `No data`, a visible single-point dot edge-case override, the period low/high row, and the footer with trading-day count and no-volume copy, then update `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md`in the same commit. Commit:`feat(web): add stock detail price history chart`

**Checkpoint**: User Story 1 is complete once the chart can render usable close history, preserve gaps, and fall back cleanly for empty periods.

---

## Phase 4: User Story 2 - Change the Time Range Without Disrupting the Page (Priority: P2)

**Goal**: Keep the rest of the stock detail page stable while range selection updates only the chart section through the normalized `range` URL parameter.

**Independent Test**: Open `/stocks/[symbol]`, switch `1W`, `1M`, `6M`, and `1Y`, and confirm the URL updates and only the chart section reloads while header, minimum investment, trading, and 52-week sections stay still.

### Implementation for User Story 2

- [ ] T006 [US2] Update `/Users/matthewyasul/personal/code/palago-2/apps/web/app/stocks/[symbol]/page.tsx` to await both `params` and `searchParams`, destructure `range` from awaited `searchParams`, normalize `range` against `["1w", "1m", "6m", "1y"]` with `1m` as the fallback, leave the existing stock detail query untouched, import `Suspense`, `ChartSkeleton`, and `StockDetailChartServer`, and add `<Suspense fallback={<ChartSkeleton />}><StockDetailChartServer symbol={symbol.toUpperCase()} range={normalizedRange} /></Suspense>` directly below `StockDetailRange52`, then update `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/tasks.md` in the same commit. Commit: `feat(web): wire stock detail chart suspense section`

**Checkpoint**: User Story 2 is complete once URL-driven range changes re-render only the chart section and `page.tsx` still does not call `getStockPriceHistory` directly.

---

## Phase 5: User Story 3 - Understand When History Is Unavailable (Priority: P3)

**Goal**: Confirm the chart remains trustworthy when the selected period has no rows or only null close values.

**Independent Test**: Open a stock detail page for a period with no usable close history and confirm the plain empty-state message appears instead of a misleading chart, summary row, or footer.

### Verification for User Story 3

> [MANUAL] Execute this task yourself. Do not assign it to Codex.

- [ ] T007 [US3] Verify `/Users/matthewyasul/personal/code/palago-2/specs/005-stock-price-chart/quickstart.md` against `/Users/matthewyasul/personal/code/palago-2/apps/web/app/stocks/[symbol]/page.tsx`, `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChart.tsx`, `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChartServer.tsx`, `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/ChartSkeleton.tsx`, and `/Users/matthewyasul/personal/code/palago-2/apps/web/lib/queries/stock-price-history.ts` by checking: chart placement below the 52-week range, default `1M`, URL-updating range switches with only chart reloads, null gaps, single-point dot visibility, period low/high excluding nulls, empty-state rendering, footer copy, and mobile visual match at 375px.

**Checkpoint**: User Story 3 is complete once the empty-state and thin-data edge cases are manually validated against the approved mobile design.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: No extra polish tasks are needed beyond the required manual verification for this feature slice.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Starts immediately.
- **Phase 2: Foundational**: Depends on T001 and blocks all story work.
- **Phase 3: US1**: Depends on T001 through T004.
- **Phase 4: US2**: Depends on T005 because the page wiring must mount the completed chart section.
- **Phase 5: US3**: Depends on T005 and T006 so the manual check covers the real integrated behavior.

### User Story Dependencies

- **US1 (P1)**: Starts after T001 through T004 are complete.
- **US2 (P2)**: Starts after US1 chart implementation exists.
- **US3 (P3)**: Starts after US1 and US2 are integrated so the empty-state and range behaviors can be verified on the live page.

### Within Each Story

- Query implementation before query tests is fixed by the requested sequence.
- Server wrapper and skeleton complete before client chart implementation.
- Client chart implementation completes before page-level Suspense integration.
- Manual verification happens last.

### Parallel Opportunities

- T004 can run in parallel with T002 and T003 after T001 because it touches only `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/ChartSkeleton.tsx`.

---

## Parallel Example: Foundational Phase

```bash
Task: "T002 Create /Users/matthewyasul/personal/code/palago-2/apps/web/lib/queries/stock-price-history.test.ts"
Task: "T003 Create /Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChartServer.tsx"
Task: "T004 Create /Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/ChartSkeleton.tsx"
```

## Implementation Strategy

### MVP First

1. Complete T001 through T004.
2. Complete T005.
3. Validate User Story 1 on mobile before wiring wider range behavior.

### Incremental Delivery

1. Foundation: query, tests, server section, skeleton
2. MVP: client chart rendering and empty-state behavior
3. Integration: page-level Suspense wiring and URL range normalization
4. Final validation: manual quickstart pass

### Team Strategy

1. One developer completes T001.
2. Then T002, T003, and T004 can be split safely.
3. After that, T005 and T006 proceed in sequence, followed by the manual T007 check.

---

## Notes

- `params` and `searchParams` are Promises and must both be awaited.
- `Number()` is forbidden in `/Users/matthewyasul/personal/code/palago-2/apps/web/lib/queries/stock-price-history.ts` and allowed only in `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailChart.tsx`.
- `connectNulls={false}` is mandatory so null close values render as gaps.
- No task may fetch, pass, or display `volume`.
- No task may add runtime calls to PSE Edge or any other external provider.
- `/Users/matthewyasul/personal/code/palago-2/apps/web/components/stock-detail/StockDetailRange52.tsx` already exists and must not be recreated.
