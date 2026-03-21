# Research: Stock List Page

## Decision 1: Use a left-joined latest-price subquery per stock

**Decision**: Retrieve the latest available `daily_prices` row per stock via a
subquery that isolates the latest `trade_date` row, then `LEFT JOIN` it onto
`stocks`.

**Rationale**:

- The feature requires stocks with no `daily_prices` row to remain visible.
- The spec explicitly prefers a latest-row pattern over a full window-function
  approach.
- A left join keeps null latest-price fields first-class rather than forcing
  fallback post-processing.

**Alternatives considered**:

- Window functions over `daily_prices`: workable, but more verbose and less
  aligned with the feature guidance.
- Loading latest prices in a second query and merging in memory: adds app-layer
  complexity and weakens pagination correctness.

## Decision 2: Keep numeric values as strings in the server query output

**Decision**: Keep `closePrice`, `percentChange`, and derived minimum
investment as string-or-null values through the query result and convert to
`Number()` only in presentational components.

**Rationale**:

- Drizzle returns PostgreSQL `numeric` values as strings.
- The constitution forbids float semantics for financial values.
- Rendering needs numeric conversion only for formatting, color selection, and
  human-readable display.

**Alternatives considered**:

- Converting to numbers in the query layer: simpler downstream, but violates the
  numeric precision rule.
- Returning preformatted strings from the query layer: reduces flexibility and
  mixes domain retrieval with presentation.

## Decision 3: Keep all filter state in the URL and mutate it from one thin client control layer

**Decision**: Use one thin Client Component wrapper for the controls, with
debounced search and router-based URL updates. Read the canonical state in the
Server Component page from awaited `searchParams`.

**Rationale**:

- The constitution requires URL-driven, shareable list state.
- Next.js 15 requires awaited `searchParams` in page components.
- One thin client boundary preserves the smart/dumb split while keeping
  interactive controls responsive.

**Alternatives considered**:

- Making the whole page a Client Component: rejected by constitution and would
  move DB reads to an API route or client fetch.
- Using multiple independent client control components that each read
  `useSearchParams`: increases coupling and duplicates URL-state logic.

## Decision 4: Clamp page numbers on the server after counting the filtered result set

**Decision**: Compute the filtered total count server-side, derive the last
valid page, clamp the requested page into range, and query the current page with
`LIMIT/OFFSET`.

**Rationale**:

- The feature requires clamping to the nearest valid page rather than returning
  an empty state or error.
- Server-side clamping preserves correct behavior for shared URLs and refreshes.

**Alternatives considered**:

- Returning an empty state for out-of-range pages: violates the requirement.
- Redirecting to the clamped page URL: possible, but not required, and adds
  more URL churn than necessary for MVP.

## Decision 5: Implement sorting in SQL with `NULLS LAST`

**Decision**: Map supported sort fields to SQL columns and always apply
`NULLS LAST` in both ascending and descending directions.

**Rationale**:

- The feature requires null price/change values to sort last regardless of
  direction.
- Server-side sorting keeps pagination correct and deterministic.

**Alternatives considered**:

- Sorting in memory after fetching: breaks pagination correctness.
- Coalescing nulls to fake numeric sentinels: obscures intent and can distort
  sort behavior.
