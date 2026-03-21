# Quickstart: Stock List Page

## Goal

Implement the `/lists/[type]` stock browsing page with server-side filtering,
sorting, pagination, and beginner-first stock cards.

## Implementation Steps

1. Replace the placeholder `apps/web/app/lists/[type]/page.tsx` with an async
   Next.js 15 page that awaits `params` and `searchParams`.
2. Validate `type` and redirect invalid values to `/lists/blue-chips`.
3. Parse URL state into normalized defaults:
   - `sort = percent_change`
   - `order = desc`
   - `page = 1`
   - `search = ""`
   - `sector = null`
4. Build a server-side Drizzle query that:
   - filters active stocks
   - applies the blue-chip filter when needed
   - joins `companies`
   - left joins the latest available `daily_prices` row
   - applies search and sector filters server-side
   - sorts with `NULLS LAST`
   - computes total count
   - clamps page number
5. Pass plain serializable data to the UI component tree.
6. Install required shadcn/ui components before implementing any stock-list
   components:
```bash
   cd apps/web
   npx shadcn@latest add input select card badge skeleton tooltip
```

7. Implement:
   - `StockListShell.tsx`
   - `StockListControls.tsx`
   - `StockListGrid.tsx`
   - `StockCard.tsx`
   - `EmptyState.tsx`
   - `Pagination.tsx`
7. Add route-level `loading.tsx` and `error.tsx`.
8. Verify mobile rendering at 375px width.

## Query Rules

- Read `sector` from `companies.sector` only.
- Do not reference `stocks.sector`.
- Treat `closePrice`, `percentChange`, and `minimumInvestment` as
  string-or-null in TypeScript until render time.
- Compute minimum investment with numeric semantics in SQL.

## Rendering Rules

- `StockCard` stays a Server Component.
- Only the thin control shell uses `use client`.
- Display `—` for missing price, missing change, and missing minimum
  investment.
- Use constitution colors:
  - positive: `#B2F2BB`
  - negative: `#FFB3BB`
  - minimum investment highlight: `#B8CEFF`

## Manual Verification

1. Open `/lists/blue-chips`
2. Confirm cards render without any runtime API calls
3. Confirm minimum investment is visible on every card
4. Confirm a stock with no price row still renders with `—`
5. Confirm changing search, sector, sort, or order updates the URL
6. Confirm refreshing preserves the same state
7. Confirm switching between `blue-chips` and `all` preserves other params
8. Confirm out-of-range `page` values clamp correctly
9. Confirm mobile layout at 375px width remains readable and compact
