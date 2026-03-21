# Quickstart: Stock Detail Main

## Goal

Implement the `/stocks/[symbol]` stock detail page from the nav bar through the
52-week range section, including one-time toast handling for invalid symbols and
missing price data.

## Implementation Steps

1. Install `sonner` through the shadcn CLI:

```bash
cd apps/web
npx shadcn@latest add sonner
```

2. Add `<Toaster />` to `apps/web/app/layout.tsx`.

3. Create `apps/web/components/ToastHandler.tsx` as the shared thin Client
   Component for URL-driven toasts.

4. Patch `apps/web/app/lists/[type]/page.tsx` to render `ToastHandler` for
   `?toast=stock-not-found`.

5. Replace `apps/web/app/stocks/[symbol]/page.tsx` with an async Next.js 15
   page that:
   - awaits `params`
   - normalizes `symbol` to uppercase
   - redirects unknown symbols to `/lists/blue-chips?toast=stock-not-found`
   - adds `?toast=no-price-data` for found stocks with no price rows
   - renders only Server Components plus `StockDetailSearch` and `ToastHandler`

6. Build `apps/web/lib/queries/stock-detail.ts`:
   - join `stocks` and `companies`
   - left join latest `daily_prices` for last-close values
   - left join second latest `daily_prices` for previous close
   - left join `stock_52_week`
   - alias `high_52w` / `low_52w` to `high52` / `low52`
   - compute `minimumInvestment` with numeric semantics
   - do not use `Number()` in the query layer

7. Add route files:
   - `apps/web/app/stocks/[symbol]/loading.tsx`
   - `apps/web/app/stocks/[symbol]/error.tsx`

8. Implement components:
   - `StockDetailSearch.tsx`
   - `StockDetailHeader.tsx`
   - `StockDetailMinInvest.tsx`
   - `StockDetailTrading.tsx`
   - `StockDetailRange52.tsx`

9. Add Vitest coverage for the query result states and pure range/label helpers.

## Query Rules

- `daily_prices.close_price` from the most recent row is the displayed
  `lastClose`.
- `prevClose` comes from the second most recent `daily_prices` row.
- `percentChange` is read as stored.
- `volume` displays as `—` when null.
- Numeric fields stay as strings or null until display formatting.

## Rendering Rules

- Only `StockDetailSearch` and `ToastHandler` use `use client`.
- `StockDetailHeader` shows the company identity, last close, percent change,
  and delayed-data disclosure.
- `StockDetailMinInvest` always shows board lot and hides the calculation row
  when last close is missing.
- `StockDetailTrading` shows `Last Close`, `Prev Close`, `Open`, range context,
  and muted `Volume` / `Value`.
- `StockDetailRange52` shows the bar and summary when data exists, otherwise the
  fallback sentence.

## Manual Verification

1. Open `/stocks/JFC` on a 375px-wide viewport
2. Confirm the nav bar, header, minimum investment, today's trading, and
   52-week range are visible without scrolling
3. Confirm the delayed-data disclosure is visible in the header
4. Confirm minimum investment shows board lot and the calculation row when last
   close exists
5. Confirm a stock with no latest price row stays on the detail page, shows
   placeholders, and shows the `no-price-data` toast once
6. Confirm an unknown symbol redirects to `/lists/blue-chips` and shows the
   `stock-not-found` toast once
7. Confirm lowercase symbols such as `/stocks/jfc` resolve correctly
8. Confirm intraday bar behavior:
   - normal case uses proportional dot position
   - equal high/low centers the dot
   - missing values hide the bar
9. Confirm 52-week behavior:
   - normal case shows low/current/high values, dot, and summary sentence
   - missing view row shows the fallback message
