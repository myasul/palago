# Data Model: Stock Price Chart

## StockChartRange

Represents the supported user-selectable chart ranges.

### Fields

- `value`: `"1w" | "1m" | "6m" | "1y"`
- `label`: `"1W" | "1M" | "6M" | "1Y"`
- `days`: `7 | 30 | 180 | 365`
- `isDefault`: boolean

### Validation Rules

- Only the four supported values are valid.
- Missing, empty, or unsupported values normalize to `1m`.
- The selected range is persisted in the page URL.

## StockPriceHistoryRow

Represents one stored trading-day row returned from `daily_prices` for the
selected stock and period.

### Fields

- `tradeDate`: string
- `closePrice`: string | null

### Validation Rules

- Rows are ordered ascending by `tradeDate`.
- `closePrice` remains `string | null` in the query layer.
- Null close rows remain present in the result and are not filtered out.
- No volume or other columns are included in this feature's query result.

## StockPriceHistoryResult

Represents the raw server payload for the chart section before client-side
conversion for rendering.

### Fields

- `symbol`: string
- `range`: `StockChartRange["value"]`
- `rows`: `StockPriceHistoryRow[]`

### Validation Rules

- `rows` may be an empty array when the selected period has no matching
  trading-day records.
- The result is scoped to one stock symbol and one normalized range.
- The result never includes interpolated or zero-filled prices.

## StockPriceChartPoint

Represents the client-side chart point passed into Recharts.

### Fields

- `date`: string
- `close`: number | null
- `label`: string  (formatted trade date for tooltip display,
  e.g. "Mar 13, 2026" — derived from `tradeDate` at display time)

### Validation Rules

- `close` is derived from `closePrice` only in the component/view-model layer.
- Null close values remain null so the chart renders gaps.
- Labels use explicit Philippine-market date formatting.
- `label` is derived from `tradeDate` using explicit Philippine-market
  date formatting. It is used for tooltip display only, not for
  x-axis tick labels (those are formatted separately in the chart).

## StockPriceHistorySummary

Represents the derived display summary for the selected chart range.

### Fields

- `periodLow`: number | null
- `periodHigh`: number | null
- `tradingDayCount`: number
- `hasUsableData`: boolean
- `isEmptyState`: boolean

### Validation Rules

- `periodLow` and `periodHigh` are derived from non-null close values only.
- `hasUsableData` is true only when at least one non-null close exists.
- `isEmptyState` is true when there are no rows or no usable close values.
- `tradingDayCount` reflects the number of returned rows, not only valid close
  rows.

## StockPriceChartSectionState

Represents the server/client contract for rendering the chart section within
the stock detail page.

### Fields

- `symbol`: string
- `selectedRange`: `StockChartRange["value"]`
- `rows`: `StockPriceHistoryRow[]`

### Validation Rules

- The section state is the only chart-specific payload passed from the server
  component to the client chart.
- Unrelated stock detail sections must not depend on this state.
