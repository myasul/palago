# Tasks: Stock Detail Main

**Input**: Design documents from `/specs/004-stock-detail-main/`  
**Prerequisites**: [plan.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/plan.md),
[spec.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/spec.md),
[research.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/research.md),
[data-model.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/data-model.md),
[stock-detail-page.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/contracts/stock-detail-page.md),
[quickstart.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/quickstart.md)

**Tests**: Vitest coverage is required for the stock-detail query and the pure
stock-detail utility functions. UI verification is manual at 375px width.

**Organization**: Tasks follow the user-mandated sequence. Phase 1 installs the
shared toast dependency, Phase 2 builds the blocking shared infrastructure and
query layer, Phase 3 delivers the MVP above-the-fold stock detail experience,
Phase 4 adds today's trading context, Phase 5 adds 52-week context, Phase 6
completes direct stock-to-stock navigation, Phase 7 handles invalid-symbol
recovery, Phase 8 handles no-price-data recovery, and the final phase captures
manual verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label for story-phase tasks only
- Every task includes exact file paths and a Conventional Commit message

## Phase 1: Setup

**Purpose**: Install the shared toast component before any route or page work.

- [x] T001 Run `cd apps/web && npx shadcn@latest add sonner` to generate `apps/web/components/ui/sonner.tsx` and confirm the file exists without modifying the generated component; commit message `chore(web): add shadcn sonner component`

## Phase 2: Foundational Infrastructure

**Purpose**: Build the shared toast wiring, stock-detail query layer, and pure
derivation utilities that block all route and component work.

- [ ] T002 Update `apps/web/app/layout.tsx` to add `<Toaster />` imported from `apps/web/components/ui/sonner.tsx`, and do not modify any other part of the layout file; commit message `feat(web): add app-wide toaster`
- [ ] T003 Create `apps/web/components/ToastHandler.tsx` as a reusable `use client` component that accepts `param` and `message`, reads the URL on mount, calls `toast()` when the param is present, clears the param via `useRouter.replace()` so refresh does not re-trigger it, and remains shared between the stock list and stock detail pages; commit message `feat(web): add shared toast handler`
- [ ] T004 Patch `apps/web/app/lists/[type]/page.tsx` to render `ToastHandler`
      with `param="stock-not-found"` and `message="We couldn't find that stock."` for the `stock-not-found` flow as a small additive change only, without modifying any existing filtering, sorting, or pagination logic and without adding any runtime calls to PSE Edge or any external provider; commit message `feat(web): wire stock list not-found toast`
- [ ] T005 Create `apps/web/lib/queries/stock-detail.ts` with input `{ symbol: string }` and output `StockDetailPageResult | null`, normalizing the symbol to uppercase before lookup, joining `companies` via `stocks.companyId`, left joining the latest `daily_prices` row for `lastClose`, `openPrice`, `highPrice`, `lowPrice`, `volume`, `value`, `percentChange`, and `tradeDate`, left joining the second latest `daily_prices` row for `prevClose` only, verifying the actual `stock_52_week` column names in the database before writing the join and aliasing them into `high52` and `low52`, computing `minimumInvestment` in SQL with numeric semantics, returning `null` when the symbol is not found, returning `hasPriceData = false` when the stock exists but has no `daily_prices` rows, keeping `percentChange` as the stored value without recalculation, treating `volume` as `number | null` rather than `string | null`, performing no `Number()` conversion anywhere in the file, and making no runtime calls to PSE Edge or any external provider; commit message `feat(web): add stock detail query`
- [ ] T006 Create `apps/web/lib/queries/stock-detail.test.ts` with Vitest coverage for symbol not found returning `null`, symbol found with no price rows returning `hasPriceData = false` and null price fields, one price row returning `prevClose = null`, two price rows returning both `lastClose` and `prevClose`, missing `stock_52_week` returning `range52 = null`, lowercase symbol resolution via uppercase lookup, `minimumInvestment = null` when `lastClose` is null, and correct SQL-derived `minimumInvestment` when both `boardLot` and `lastClose` are present; commit message `test(web): cover stock detail query behavior`
- [ ] T007 Create `apps/web/lib/stock-detail-utils.ts` and `apps/web/lib/stock-detail-utils.test.ts` with the pure functions `getRangeBarPosition`, `getIntradaySecondaryText`, `getCloseVsOpenSubtitle`, and `get52WeekLabel`, keeping all inputs as `string | null` except `volume` which remains `number | null`, using `Number()` only inside these utilities and never in the query layer, covering normal cases, equal bounds returning `50`, all three 52-week label bands, and null-input cases for every function; commit message `feat(web): add stock detail display utilities`

## Phase 3: User Story 1 - See Price and Minimum Investment Fast (Priority: P1) 🎯 MVP

**Goal**: Deliver the above-the-fold stock detail experience with the real
route, nav search, header, minimum investment section, and route-level states.

**Independent Test**: Open a valid `/stocks/[symbol]` page at 375px width and
confirm the nav bar, company identity, last close, percent change, minimum
investment, board lot, and delayed-data disclosure are visible without
scrolling.

- [ ] T008 [US1] Replace `apps/web/app/stocks/[symbol]/page.tsx` with an async Server Component that awaits `params` because `params` is a Promise in Next.js 15, normalizes `symbol` to uppercase, calls `apps/web/lib/queries/stock-detail.ts`, redirects to `/lists/blue-chips?toast=stock-not-found` when the query returns `null`, renders the page with `?toast=no-price-data` when `hasPriceData` is false, composes `StockDetailSearch`, `ToastHandler`, `StockDetailHeader`, `StockDetailMinInvest`, `StockDetailTrading`, and `StockDetailRange52`, keeps `StockDetailSearch` and `ToastHandler` as the only client components on the page, and makes no runtime calls to PSE Edge or any external provider; commit message `feat(web): add stock detail page route`
- [ ] T009 [US1] Create `apps/web/app/stocks/[symbol]/loading.tsx` using the shadcn `Skeleton` component for a mobile-first 375px loading state that matches the stock detail page structure; commit message `feat(web): add stock detail loading state`
- [ ] T010 [US1] Create `apps/web/app/stocks/[symbol]/error.tsx` as the required `use client` error boundary with a plain user-facing message only and no exposed DB error details or stack traces; commit message `feat(web): add stock detail error boundary`
- [ ] T011 [US1] Create `apps/web/components/stock-detail/StockDetailSearch.tsx` as the first and only page-specific interactive `use client` component, accepting `initialSymbol`, rendering the nav bar with a back link to `/lists/blue-chips` and a full-width search input, navigating to `/stocks/[enteredSymbol]` via `useRouter` on submit, and doing nothing on empty submissions; commit message `feat(web): add stock detail search`
- [ ] T012 [US1] Create `apps/web/components/stock-detail/StockDetailHeader.tsx` as a Server Component with no `use client`, accepting `StockDetailPriceSnapshot` props, rendering the gold gradient header with logo or initials placeholder, company name, symbol, sector, subsector, large `lastClose`, stored `percentChange` badge, and the `Data delayed 15 minutes` disclosure using the constitution colours for positive, negative, and gold treatments; commit message `feat(web): add stock detail header`
- [ ] T013 [US1] Create `apps/web/components/stock-detail/StockDetailMinInvest.tsx` as a Server Component with no `use client`, accepting `boardLot`, `lastClose`, and `minimumInvestment`, always showing the board lot value, showing `minimumInvestment` or `—`, rendering the calculation row only when `lastClose` is non-null, and relying on query-provided values without recomputing `minimumInvestment` in the component; commit message `feat(web): add stock detail minimum investment section`

## Phase 4: User Story 2 - Understand Today's Trading Context (Priority: P2)

**Goal**: Explain how the last close compares with the day’s range and the open
using a compact, server-rendered trading section.

**Independent Test**: Open a stock with complete daily trading data and confirm
the page shows `Open`, `Last Close`, `Prev Close`, the intraday range bar, and
the correct subtitle and secondary text for the day’s movement.

- [ ] T014 [US2] Create `apps/web/components/stock-detail/StockDetailTrading.tsx` as a Server Component with no `use client`, accepting `StockDetailPriceSnapshot`, using `getRangeBarPosition`, `getIntradaySecondaryText`, and `getCloseVsOpenSubtitle` from `apps/web/lib/stock-detail-utils.ts`, rendering `Open` and `Last Close`, a labelled `Prev Close` row, the intraday range bar with a single dot, and muted `Volume` and `Value`, formatting `volume` as `number | null` with `toLocaleString()` when present, keeping `percentChange` as the stored value without recalculation, and doing all numeric conversion only through utilities and display-time formatting rather than in the query layer; commit message `feat(web): add stock detail trading section`

## Phase 5: User Story 3 - Understand 52-Week Context (Priority: P3)

**Goal**: Show whether the last close sits near the 52-week low, mid-range, or
near the 52-week high with one sentence and one range bar.

**Independent Test**: Open a stock with 52-week data and confirm the page
shows low/last-close/high values, a correctly positioned dot, and the correct
label; open a stock without 52-week data and confirm the fallback message.

- [ ] T015 [US3] Create `apps/web/components/stock-detail/StockDetailRange52.tsx` as a Server Component with no `use client`, accepting `lastClose` and `range52`, using `getRangeBarPosition` and `get52WeekLabel` from `apps/web/lib/stock-detail-utils.ts`, rendering only the fallback message when `range52` is null, and otherwise rendering the low/last-close/high labels, the 52-week range bar with a single dot, the `₱X now` chip, and the derived label sentence; commit message `feat(web): add stock detail 52-week range section`

## Phase 6: Manual Verification

**Purpose**: Verify all six user stories against the live implementation
before marking the feature complete.

> [MANUAL] T016 [US4] Direct navigation: open any stock detail page,
  submit another valid symbol from the nav search, confirm direct
  navigation to the new stock's page. Empty submissions must do nothing.

> [MANUAL] T017 [US5] Invalid symbol: open `/stocks/INVALIDSYMBOL`,
  confirm redirect to `/lists/blue-chips`, confirm
  "We couldn't find that stock." toast appears once and not on refresh.

> [MANUAL] T018 [US6] No price data: open a valid stock with no
  `daily_prices` rows, confirm the page stays on `/stocks/[symbol]`,
  confirm "Price data isn't available yet for this stock." toast
  appears once and not on refresh, confirm all price fields show `—`.

> [MANUAL] T019 Core layout: open `/stocks/JFC` at 375px width, confirm
  nav bar, header, minimum investment, today's trading, and 52-week
  range are all visible without scrolling. Confirm:
  - Company logo or initials placeholder renders
  - Last close is prominent in the header
  - Percent change badge is correct colour (green/red/neutral)
  - "Data delayed 15 min" disclosure is visible in the header
  - Minimum investment shows board lot and calculation row
  - Intraday bar handles normal, equal-bound, and null cases
  - 52-week section handles both normal and fallback cases
  - Lowercase `/stocks/jfc` resolves correctly

> [MANUAL] T020 After all checks pass, tag the feature:
  git tag 004-stock-detail-main/complete

## Final Phase: Polish & Verification

**Purpose**: Run the required manual verification for the completed feature
slice before moving to the next stock-detail spec.

> [MANUAL] Open `/stocks/JFC` at 375px width and verify the nav bar, header, minimum investment, today's trading, and 52-week range are visible without scrolling, the delayed-data disclosure appears in the header, minimum investment always shows board lot, unknown symbols redirect with the `stock-not-found` toast, valid no-price-data symbols stay on the detail page with the `no-price-data` toast and placeholders, lowercase symbols resolve correctly, the intraday bar handles normal/equal-bound/null cases, and the 52-week section handles both normal and fallback cases per [quickstart.md](/Users/matthewyasul/personal/code/palago/specs/004-stock-detail-main/quickstart.md)

## Dependencies

- Phase 1 must complete before Phase 2.
- Phase 2 blocks all user-story implementation phases.
- Phase 3 is the MVP and should be completed first.
- Phase 4 depends on Phase 2 and the route/component shell from Phase 3.
- Phase 5 depends on Phase 2 and the route/component shell from Phase 3.
- Phase 6 (manual verification) depends on Phases 1 through 5 being
  complete. No Codex work in Phase 6 — verification only.

## Parallel Execution Examples

- No implementation tasks are marked `[P]` for this feature because the user required a strict execution order for setup, query, route, and component work.
- Manual verification can begin only after T018 is complete.

## Implementation Strategy

- MVP first: complete Phases 1 through 3 to ship the core above-the-fold stock detail experience.
- Next, add Phases 4 and 5 for interpretive range context.
- Finish with Phases 6 through 8 for navigation and graceful recovery flows.
