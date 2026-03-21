# Quickstart: Stock Price Chart

## Goal

Implement the stock price history section for `/stocks/[symbol]` using the
constitution's partial-rendering pattern so only the chart re-renders when the
range changes.

## Implementation Steps

1. Create `apps/web/lib/queries/stock-price-history.ts`:
   - accept `symbol` and day-window input
   - resolve the stock from internal tables
   - select only `trade_date` and `close_price`
   - filter to the selected range window
   - return rows ascending by `trade_date`
   - preserve null closes and avoid `Number()`

2. Add `apps/web/lib/queries/stock-price-history.test.ts` to cover:
   - empty ranges return `[]`
   - null close rows remain present
   - rows stay in ascending order
   - day-window filtering matches `7`, `30`, `180`, and `365`

3. Create `apps/web/components/stock-detail/StockDetailChartServer.tsx` as the
   async section Server Component:
   - receives `symbol` and normalized `range`
   - maps range to day count
   - fetches chart rows
   - passes data to the client chart

4. Create `apps/web/components/stock-detail/StockDetailChart.tsx` as the chart
   Client Component:
   - convert string close values to numbers locally
   - keep null values as null for chart gaps
   - render range toggle chips and push URL updates
   - render line chart, tooltip, period low/high, and footer
   - show empty state when there are no usable close values
   - ensure a single valid point still renders visibly

5. Create `apps/web/components/stock-detail/ChartSkeleton.tsx` with a 140px
   chart-height fallback using shadcn `Skeleton`.

6. Update `apps/web/app/stocks/[symbol]/page.tsx`:
   - await both `params` and `searchParams`
   - normalize `range`
   - leave existing detail-page data fetching as-is
   - wrap `StockDetailChartServer` in `Suspense`
   - mount the chart section below `StockDetailRange52`

## Query Rules

- `daily_prices.close_price` is the only fetched price field for this feature.
- `trade_date` ordering is ascending.
- Null closes remain present as null.
- No `volume` data is fetched or displayed.
- Query-layer values remain `string | null` until the client rendering layer.

## Rendering Rules

- The chart is the only new interactive stock-detail section.
- Range changes affect only the chart section and keep the rest of the page
  stable.
- The default range is `1m`.
- Unsupported or missing `range` values fall back to `1m`.
- Visible chart gaps must appear for null close values.
- Period low and period high use non-null close values only.
- The footer shows trading-day count and close-price-only scope.
- The empty-state message is: `No price history available for this period.`

## Manual Verification

1. Open `/stocks/BPI` or another stock with price history on a 375px-wide
   viewport.
2. Confirm the chart appears directly below the 52-week range section and
   visually matches the existing stock-detail card language from the provided
   reference image.
3. Confirm `1M` is selected by default when no `range` parameter is present.
4. Switch between `1W`, `1M`, `6M`, and `1Y` and confirm the URL updates and
   only the chart section reloads.
5. Confirm rows with null close values render as visible gaps, not zeroes or
   continuous interpolation.
6. Confirm a range with exactly one valid close renders a visible point.
7. Confirm period low and period high ignore null close rows.
8. Confirm a range with no rows or all-null close values shows the empty-state
   message instead of a chart.
9. Confirm the footer shows trading-day count and no volume data.
