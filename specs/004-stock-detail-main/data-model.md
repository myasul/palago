# Data Model: Stock Detail Main

## RequestedStockSymbol

Represents the symbol supplied in the route or search field.

### Fields

- `rawSymbol`: string
- `normalizedSymbol`: string

### Validation Rules

- `normalizedSymbol` is the uppercase form of `rawSymbol`.
- Empty or whitespace-only submissions are invalid for navigation.
- Lookup always uses `normalizedSymbol`.

## StockDetailPriceSnapshot

Represents the joined stock, company, and latest two `daily_prices` rows used
to render the in-scope stock detail experience.

### Fields

- `stockId`: number
- `symbol`: string
- `stockName`: string
- `boardLot`: number | null
- `isActive`: boolean | null
- `companyId`: number | null
- `companyName`: string
- `sector`: string | null
- `subsector`: string | null
- `logoUrl`: string | null
- `tradeDate`: string | null
- `lastClose`: string | null
- `prevClose`: string | null
- `openPrice`: string | null
- `highPrice`: string | null
- `lowPrice`: string | null
- `volume`: number | null
- `value`: string | null
- `percentChange`: string | null
- `minimumInvestment`: string | null

### Validation Rules

- `symbol` is required and normalized before lookup.
- `companyName` is required.
- `sector` and `subsector` come from `companies` only.
- All numeric market fields remain string-or-null until display formatting.
- `minimumInvestment` is nullable and derived from board lot × last close using
  numeric semantics in the query layer.
- `prevClose` comes from the second most recent `daily_prices` row for the same
  stock, not from recalculation.
- `volume` arrives as `number | null` from Drizzle because the schema
  defines it as `bigint` with `mode: "number"`. It is not a string
  field. Display as — when null, formatted with commas when present.

### Relationships

- Derived from `stocks`
- Joined to `companies` via `stocks.companyId`
- Joined to latest `daily_prices` row via `stocks.id = daily_prices.stockId`
- Joined to second latest `daily_prices` row for `prevClose`

## StockDetailRange52

Represents the optional 52-week context attached to the stock detail page.

### Fields

- `low52`: string | null
- `high52`: string | null
- `asOfDate`: string | null

### Validation Rules

- The entire object may be absent when the materialized view has no row.
- Source columns are the materialized-view fields `low_52w` and `high_52w`,
  aliased into this result shape.
- Values remain string-or-null until display formatting.

## StockDetailState

Represents the page-level state used for routing and one-time notifications.

### Fields

- `symbol`: string
- `toast`: `"stock-not-found" | "no-price-data" | null`
- `isFound`: boolean
- `hasPriceData`: boolean

### Validation Rules

- `stock-not-found` only appears on the redirected stock-list URL.
- `no-price-data` only appears on a valid stock-detail URL.
- `toast` is cleared client-side after the message displays once.

## StockDetailPageResult

Represents the full server payload passed into the rendering layer.

### Fields

- `stock`: `StockDetailPriceSnapshot`
- `range52`: `StockDetailRange52 | null`
- `state`: `StockDetailState`

### Validation Rules

- The page result is returned only for found stocks.
- A found stock may still have `hasPriceData = false`.
- All price-dependent display sections must tolerate null values.

## DerivedPresentationState

Represents non-persisted display derivations for the stock detail page.

### Fields

- `displayLastClose`: formatted peso string or `—`
- `displayPrevClose`: formatted peso string or `—`
- `displayOpen`: formatted peso string or `—`
- `displayHigh`: formatted peso string or `—`
- `displayLow`: formatted peso string or `—`
- `displayVolume`: formatted number string with commas or `—`
- `displayValue`: formatted string (e.g. ₱242M) or `—`
- `displayMinimumInvestment`: formatted peso string or `—`
- `displayPercentChange`: formatted text for positive, negative, neutral, or `—`
- `closeVsOpenTone`: `"positive" | "negative" | "neutral"`
- `closeVsOpenSubtitle`: string | null
- `intradayDotPosition`: number | null
- `intradaySecondaryText`: string | null
- `range52DotPosition`: number | null
- `range52Label`: string
- `logoMode`: `"image" | "placeholder"`

### Validation Rules

- `Number()` conversion happens only here.
- Dot position is `50` when upper and lower bounds are equal.
- Dot position is `null` when required values are missing.
- Secondary text is omitted when required values are missing.
