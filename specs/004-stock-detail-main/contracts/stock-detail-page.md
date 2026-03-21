# Contract: Stock Detail Page

## Purpose

Define the internal route, query, and component contract for the stock detail
experience at `/stocks/[symbol]`.

## Route Contract

### Route

`/stocks/[symbol]`

### Route Params

`page.tsx` must await:

```ts
type StockDetailParams = Promise<{
  symbol: string;
}>;
```

### Symbol Normalization

- Incoming route symbols are normalized to uppercase before database lookup.
- `/stocks/jfc` and `/stocks/JFC` resolve to the same stock.

### Not Found Behavior

- Unknown symbol redirects to `/lists/blue-chips?toast=stock-not-found`

### No Price Data Behavior

- Valid stock with no latest `daily_prices` row stays on `/stocks/[symbol]`
- URL becomes `/stocks/[symbol]?toast=no-price-data`
- Page renders placeholders for price-dependent fields

## Toast Contract

### Reusable Client Component

`ToastHandler` receives:

- `param`
- `message`

### Behavior

- If the given URL param is present on mount, show an informational toast
- Clear the parameter from the URL after the toast appears
- Do not re-trigger on refresh after the param has been cleared

### Toast Messages

| Param | Page | Message |
| --- | --- | --- |
| `stock-not-found` | `/lists/[type]` | `We couldn't find that stock.` |
| `no-price-data` | `/stocks/[symbol]` | `Price data isn't available yet for this stock.` |

## Query Contract

### Input

```ts
type GetStockDetailInput = {
  symbol: string;
};
```

### Output

```ts
type StockDetailPageResult = {
  stock: {
    stockId: number;
    symbol: string;
    stockName: string;
    boardLot: number | null;
    companyId: number | null;
    companyName: string;
    sector: string | null;
    subsector: string | null;
    logoUrl: string | null;
    tradeDate: string | null;
    lastClose: string | null;
    prevClose: string | null;
    openPrice: string | null;
    highPrice: string | null;
    lowPrice: string | null;
    volume: number | null;
    value: string | null;
    percentChange: string | null;
    minimumInvestment: string | null;
  };
  range52: {
    low52: string | null;
    high52: string | null;
    asOfDate: string | null;
  } | null;
  state: {
    symbol: string;
    toast: "no-price-data" | null;
    isFound: true;
    hasPriceData: boolean;
  };
} | null;
```

### Query Rules

- `null` result means symbol not found and triggers redirect in `page.tsx`
- `lastClose` comes from the latest `daily_prices` row
- `prevClose` comes from the second latest `daily_prices` row
- `minimumInvestment` is derived in the query layer with numeric semantics
- `high52` and `low52` are aliased from `stock_52_week.high_52w` and
  `stock_52_week.low_52w`
- No `Number()` conversion happens in the query layer

## Component Boundary Contract

### Client Components

- `StockDetailSearch`
- `ToastHandler`

### Server Components

- `page.tsx`
- `StockDetailHeader`
- `StockDetailMinInvest`
- `StockDetailTrading`
- `StockDetailRange52`
- `loading.tsx`
- `error.tsx`

### Search Contract

`StockDetailSearch` receives:

- `initialSymbol`

Behavior:

- submit navigates to `/stocks/[enteredSymbol]`
- empty submissions do nothing
- symbol normalization may happen before navigation or on the server, but lookup
  must behave case-insensitively

## Display Contract

- Price-dependent numeric values render as `—` when null
- `volume` renders as `—` when null
- Minimum investment always shows board lot
- Data delay message renders on every stock detail page
- 52-week section shows a fallback sentence when `range52` is absent
