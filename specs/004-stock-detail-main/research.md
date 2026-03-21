# Research: Stock Detail Main

## Decision 1: Use two latest-price subqueries for last close and previous close

**Decision**: Retrieve the most recent `daily_prices` row as the main trading
snapshot and the second most recent row as `prevClose`, then join both onto the
stock record.

**Rationale**:

- The feature needs both the latest stored row and the prior close in one page.
- Keeping this in the query layer preserves one source of truth for the page.
- This avoids recalculating previous-close context in application code.

**Alternatives considered**:

- Loading all recent price rows and picking values in TypeScript: simpler to
  reason about initially, but leaks data-shaping work into application code.
- Window functions returning ranked rows: valid, but more verbose for a single
  stock lookup than two isolated latest-row subqueries.

## Decision 2: Treat "current" as last close for this spec

**Decision**: Use the latest stored `daily_prices.close_price` as the displayed
headline price and as the "current" comparison point in today's trading for
this spec.

**Rationale**:

- The spec explicitly limits runtime data to persisted internal tables.
- `intraday_snapshots` exists, but it is outside the approved scope for this
  feature slice.
- Standardizing on last close removes ambiguity from pricing and range logic.

**Alternatives considered**:

- Mixing in `intraday_snapshots.current_price`: rejected because it changes the
  source-of-truth model and introduces live-price semantics not covered here.
- Renaming the page to a purely historical detail view: rejected because the UX
  still needs a clear "what does this stock cost today?" answer, satisfied by
  the most recent stored close.

## Decision 3: Centralize toast behavior in one reusable client component

**Decision**: Use one reusable `ToastHandler` component that reads a single URL
param, fires an informational toast, and clears the param from the URL.

**Rationale**:

- Both stock-detail and stock-list need one-time toast behavior.
- A single reusable component keeps the client boundary thin and auditable.
- Clearing the URL in one place reduces repeat-toast bugs.

**Alternatives considered**:

- Duplicating toast logic in each page: rejected because it duplicates router
  and param-clearing behavior.
- Server-rendering the message inline instead of using a toast: rejected
  because the spec requires toast-based feedback after redirects.

## Decision 4: Keep range derivations in pure utilities with unit coverage

**Decision**: Implement dot-position calculations and plain-language range
labels as pure functions that accept nullable string inputs and return derived
display state.

**Rationale**:

- The feature requires multiple edge cases around nulls and equal bounds.
- Pure utilities are easy to cover with Vitest and keep components simple.
- This keeps financial formatting and interpretation logic close to the domain
  without making components do hidden computation.

**Alternatives considered**:

- Computing position and labels inline inside components: rejected because it
  weakens reuse and makes edge-case testing harder.
- Preformatting all labels in the query layer: rejected because it mixes
  retrieval and presentation concerns.

## Decision 5: Alias 52-week materialized-view columns in the query layer

**Decision**: Read `stock_52_week.high_52w` and `stock_52_week.low_52w` from
the existing view, then alias them to the feature's `high52` and `low52`
result fields.

**Rationale**:

- The materialized view already exists and is out of scope for schema changes.
- Aliasing preserves the feature contract without forcing a migration.
- This makes the UI model consistent with the rest of the page result shape.

**Alternatives considered**:

- Renaming the materialized view columns: rejected because schema changes are
  explicitly out of scope.
- Exposing the raw `high_52w`/`low_52w` names to components: rejected because
  it leaks storage naming into the presentation layer.
