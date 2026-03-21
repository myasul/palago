# Contract: Stock Price Chart Section

## Purpose

Define the internal route, query, and component contract for the stock price
history section on `/stocks/[symbol]`.

## Route Contract

### Route

`/stocks/[symbol]`

### Route Params

`page.tsx` must await:

```ts
type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
  searchParams: Promise<{
    range?: string;
    toast?: string;
  }>;
};
```

### Range Normalization

- Supported `range` values are `1w`, `1m`, `6m`, `1y`.
- Missing, empty, or unsupported values normalize to `1m`.
- `page.tsx` passes only `symbol` and normalized `range` into the chart server
  section.

### Suspense Boundary

- `page.tsx` wraps `StockDetailChartServer` in `Suspense`.
- `ChartSkeleton` is the section-scoped fallback.
- `page.tsx` must not call `getStockPriceHistory`.

## Query Contract

### Input

```ts
type GetStockPriceHistoryInput = {
  symbol: string;
  days: 7 | 30 | 180 | 365;
};
```

### Output

```ts
type StockPriceHistoryRow = {
  tradeDate: string;
  closePrice: string | null;
};

type StockPriceHistoryResult = StockPriceHistoryRow[];
```

### Query Rules

- The query reads from internal persisted data only.
- The query returns rows for one stock only.
- The query filters to the selected trailing day window.
- The query orders rows ascending by `tradeDate`.
- The query includes rows whose `closePrice` is null.
- The query returns `[]` when no rows match.
- The query does not fetch `volume`.
- The query does not use `Number()`.

## Server Component Contract

### Component

`StockDetailChartServer`

### Props

```ts
type StockDetailChartServerProps = {
  symbol: string;
  range: "1w" | "1m" | "6m" | "1y";
};
```

### Behavior

- Maps `1w` to `7`, `1m` to `30`, `6m` to `180`, `1y` to `365`
- Calls `getStockPriceHistory`
- Passes raw rows plus `symbol` and `range` into `StockDetailChart`

## Client Component Contract

### Component

`StockDetailChart`

### Props

```ts
type StockDetailChartProps = {
  symbol: string;
  range: "1w" | "1m" | "6m" | "1y";
  rows: Array<{
    tradeDate: string;
    closePrice: string | null;
  }>;
};
```

### Behavior

- Performs local numeric conversion for chart rendering only
- Renders range controls in the order `1W`, `1M`, `6M`, `1Y`
- Navigates with `router.push(`/stocks/${symbol}?range=${range}`)`
- Renders chart gaps for null values
- Renders a visible dot when there is exactly one valid close point
- Derives period low and high from non-null prices only
- Shows the empty-state message when there are no usable prices
- Shows footer text for trading-day count and close-price-only scope
- Never renders volume data

## Rendering Contract

- Chart section appears below `StockDetailRange52`
- The chart uses a 140px drawing area inside the existing stock-detail layout
- Empty-state message replaces the chart when there are no usable prices
- Tooltip shows trade date and close price in Philippine pesos to two decimals
- Y-axis labels remain hidden
- Unrelated stock detail sections remain stable when the range changes
