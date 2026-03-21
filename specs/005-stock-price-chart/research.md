# Research: Stock Price Chart

## Decision 1: Use section-scoped partial rendering from `page.tsx`

**Decision**: Keep `page.tsx` responsible only for awaiting route inputs,
normalizing the `range` URL parameter, and wrapping `StockDetailChartServer` in
`Suspense` with a chart-scoped fallback.

**Rationale**:

- The constitution explicitly requires this pattern for independently
  parameterized sections such as chart ranges.
- It keeps the rest of the stock detail page stable when the range changes.
- It prevents the parent page query from growing into a second source of truth
  for chart data.

**Alternatives considered**:

- Fetching chart data directly in `page.tsx`: rejected because it would break
  the mandated partial-rendering pattern.
- Fetching chart data in the client component: rejected because Server
  Components remain the default data-fetching model.

## Decision 2: Return raw `trade_date` + `close_price` rows from the query layer

**Decision**: `getStockPriceHistory` will return ascending rows containing only
  `tradeDate` and `closePrice`, with `closePrice` preserved as `string | null`.

**Rationale**:

- The feature only needs close-price history, so fetching extra fields such as
  volume adds unnecessary coupling.
- Keeping numeric values as strings in the query layer follows the
  constitution's numeric-discipline rule and the user instruction to avoid
  `Number()` there.
- Preserving null rows allows the chart to render true gaps instead of silently
  rewriting missing market data.

**Alternatives considered**:

- Returning pre-converted numbers from the query layer: rejected because it
  leaks formatting-time coercion into data access.
- Filtering out null closes in SQL: rejected because the spec requires gaps, not
  silently compressed timelines.

## Decision 3: Convert chart values and summaries in the client view-model layer

**Decision**: `StockDetailChart.tsx` will locally convert string prices into
  numbers for Recharts, derive period low/high from non-null prices only, and
  determine whether the empty state should replace the chart.

**Rationale**:

- Recharts needs numeric input, but the query layer should stay faithful to raw
  stored values.
- The chart component already owns the range toggle and presentation-specific
  behavior, so view-model mapping belongs there.
- This isolates display logic such as tooltip formatting, summary values, and
  the single-point dot rule to the client boundary that actually needs it.

**Alternatives considered**:

- Precomputing chart view models on the server: valid, but unnecessary for this
  small section and less aligned with the requirement that the client component
  own chart-only behavior.
- Mixing conversion and summary logic into the query: rejected because it makes
  a read query responsible for presentation concerns.

## Decision 4: Handle Recharts single-point behavior explicitly

**Decision**: Treat the single-valid-close range as a first-class edge case and
  configure the rendered line so one valid point still appears visibly.

**Rationale**:

- Some Recharts versions hide single points when dots are globally disabled.
- The feature must remain trustworthy even for newly listed or thinly traded
  ranges that only return one usable close.
- This requirement is specific enough to deserve explicit planning rather than
  being left to incidental component defaults.

**Alternatives considered**:

- Relying on Recharts defaults: rejected because the known edge case can produce
  a blank-looking chart despite valid data.
- Switching to a different chart type for one point: rejected because it adds
  visual inconsistency for a narrow edge case.

## Decision 5: Format trade dates with explicit Philippine-market context

**Decision**: Use explicit date formatting for labels and tooltips so displayed
  dates reflect Philippine market context instead of server-local timezone
  behavior.

**Rationale**:

- The constitution forbids business behavior driven by server-local time.
- Trade dates come from stored market rows and should display consistently
  across environments.
- The chart only needs short date labels and full tooltip dates, so an explicit
  formatter is sufficient without adding new backend date logic.

**Alternatives considered**:

- Using implicit `Date.toLocaleDateString()` defaults: rejected because output
  can vary by runtime locale and timezone.
- Formatting dates in SQL: rejected because presentation formatting belongs in
  the rendering layer for this feature.
