# Data Model: Stock List Page

## StockListEntry

Represents one rendered stock card in the `/lists/[type]` experience.

### Fields

- `stockId`: number
- `symbol`: string
- `boardLot`: number | null
- `isBlueChip`: boolean | null
- `isActive`: boolean | null
- `companyId`: number | null
- `companyName`: string
- `sector`: string | null
- `logoUrl`: string | null
- `tradeDate`: string | null
- `closePrice`: string | null
- `percentChange`: string | null
- `minimumInvestment`: string | null

### Validation Rules

- `symbol` is required and links to `/stocks/[symbol]`.
- `companyName` is required.
- `sector` comes from `companies.sector` only.
- `closePrice`, `percentChange`, and `minimumInvestment` remain nullable.
- `minimumInvestment` is computed in SQL as `board_lot * close_price` using
  numeric semantics and arrives from Drizzle as a string or null. It is
  nullable when either `boardLot` or `closePrice` is null. It must NOT be
  computed in the TypeScript application layer.

### Relationships

- Derived from `stocks`
- Joined to `companies` via `stocks.companyId`
- Joined to latest `daily_prices` row via `stocks.id = daily_prices.stockId`

## StockListState

Represents the shareable URL-driven state for the stock list.

### Fields

- `type`: `"blue-chips" | "all"`
- `sector`: string | null
- `search`: string | null
- `sort`: `"percent_change" | "price" | "name"`
- `order`: `"asc" | "desc"`
- `page`: number

### Validation Rules

- Invalid `type` redirects to `/lists/blue-chips`.
- Missing values fall back to defaults:
  - `type = "blue-chips"`
  - `sort = "percent_change"`
  - `order = "desc"`
  - `page = 1`
- `page` clamps to the valid page range for the filtered result set.
- `sector` is exact-match only.
- `search` is case-insensitive and applied to both symbol and company name.

## StockListPageResult

Represents the full server payload passed into the rendering layer.

### Fields

- `stocks`: `StockListEntry[]`
- `sectors`: `string[]`
- `totalCount`: number
- `page`: number
- `pageSize`: number
- `totalPages`: number
- `state`: `StockListState`

### Validation Rules

- `pageSize` is always `25`.
- `totalPages` is at least `1` when there are results and may be `0` before
  clamping logic is normalized into display behavior.
- `sectors` are drawn from active, joinable stock/company rows only.

## PresentationState

Represents user-facing derived display behavior per card.

### Fields

- `displayPrice`: formatted peso string or `—`
- `displayPercentChange`: formatted percentage string or `—`
- `displayMinimumInvestment`: formatted peso string or `—`
- `changeTone`: `"positive" | "negative" | "neutral"`
- `logoMode`: `"image" | "placeholder"`

### Validation Rules

- Numeric conversion to `Number()` happens only here.
- Positive values use green `#B2F2BB`.
- Negative values use red `#FFB3BB`.
- Minimum investment highlight uses blue `#B8CEFF`.
