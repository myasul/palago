# Contract: Backfill Workflows

## Purpose

Define the operator-facing contracts for the local backfill scripts introduced
by this feature.

## Shared Rules

- All scripts live in `apps/ingestion/scripts/`.
- All scripts run locally via `npx tsx`.
- All scripts use structured logging via `apps/ingestion/shared/logger.ts`.
- All database writes use idempotent upserts.
- No script in this feature runs as Lambda.

## `seed-companies.ts`

### Input

- No required CLI arguments

### Behavior

1. Fetch all listed companies from the provider.
2. For each company with non-null `edge_cmpy_id`, fetch company profile data.
3. Attempt logo download and asset upload.
4. Upsert `companies`.
5. Resolve `company_id`.
6. Upsert `stocks`.
7. Delay one second between companies.

### Output

- Structured progress logs such as `[45/300] JFC — company and stock upserted`
- Summary counts for companies, stocks, logo upload successes, and logo upload
  failures

### Error Handling

- Logo download/upload failure is warning-only and falls back to the PSE Edge
  URL.
- Rows lacking `edge_cmpy_id` are skipped, not fatal.

## `enrich-stocks.ts`

### Input

- No required CLI arguments

### Behavior

1. Query active stocks with non-null `edge_cmpy_id`.
2. Fetch stock detail snapshots one stock at a time.
3. Upsert trading and capital-structure fields.
4. Delay one second between stocks.

### Error Handling

- Stocks with null `edge_cmpy_id` are skipped, not fatal.

## `backfill-prices.ts`

### Input

- Optional `--symbol SYMBOL`
- Optional `--from YYYY-MM-DD`
- Optional `--to YYYY-MM-DD`

### Default Range

- From two years before the current date
- Through yesterday

### Behavior

1. Query active stocks with non-null `edge_cmpy_id` and `edge_sec_id`.
2. Convert CLI date arguments to the provider's required request format.
3. Fetch historical prices and upsert `daily_prices`.
4. Recompute `percent_change` scoped to the requested date range.
5. Refresh `stock_52_week`.

### Error Handling

- Stocks missing either provider identifier are skipped, not fatal.
- Empty source ranges do not create invalid rows.

## `backfill-dividends.ts`

### Input

- No required CLI arguments

### Behavior

1. Query active stocks with non-null `edge_cmpy_id`.
2. Fetch all dividends for each company.
3. Upsert every row on `(stock_id, ex_date)`.

### Error Handling

- Stocks with null `edge_cmpy_id` are skipped, not fatal.
- The script stores all security types and does not filter to `COMMON`.

## `verify-backfill.ts`

### Input

- No required CLI arguments

### Behavior

- Read and print counts for `companies`, active `stocks`, `daily_prices`, and
  `dividends`
- Print sample rows for symbol `JFC`
- Print stocks with `edge_cmpy_id` set but zero `daily_prices`
- Print stocks with `company_id IS NULL`

### Exit Contract

- Exit code `0` when no gaps are found
- Exit code `1` when any verification gap is found
- Performs zero writes
