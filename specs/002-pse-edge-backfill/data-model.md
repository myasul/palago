# Data Model: PSE Edge Backfill Foundation

## Overview

This feature establishes the launch schema for identity, profile, dividend, and
historical price data sourced from PSE Edge. It also defines the transient
records and mappings used by local backfill scripts before rows are persisted.

## Entities

### Company

**Purpose**: Stores one corporate profile row per listed company.

**Fields**:

- `id`: serial primary key
- `edge_cmpy_id`: optional provider company identifier, unique
- `name`: required company name
- `logo_url`: optional absolute URL, preferably S3-backed
- `description`: optional company description
- `sector`: optional sector label
- `subsector`: optional subsector label
- `website_url`: optional website URL
- `address`: optional mailing or office address
- `email`: optional contact email
- `phone`: optional contact phone
- `incorporation_date`: optional incorporation date
- `fiscal_year_end`: optional fiscal year end text such as `12/31`
- `external_auditor`: optional auditor name
- `transfer_agent`: optional transfer agent name
- `created_at`: timestamp with timezone, default now
- `updated_at`: timestamp with timezone, default now

**Validation rules**:

- `name` is required.
- `edge_cmpy_id` may be null when the source does not provide it, but company
  seed logic skips stock creation for rows that cannot be tied safely to PSE
  Edge identity.
- `logo_url` must be an absolute URL when present.

### Stock

**Purpose**: Stores one listed security row per exchange symbol.

**Fields**:

- `id`: serial primary key
- `company_id`: optional foreign key to `companies.id`
- `symbol`: required unique stock symbol
- `name`: required stock/security name
- `edge_cmpy_id`: optional provider company identifier
- `edge_sec_id`: optional provider security identifier
- `sector`: optional sector label
- `subsector`: optional subsector label
- `description`: optional description
- `board_lot`: optional board lot size
- `par_value`: optional numeric(10,4)
- `isin`: optional ISIN
- `issue_type`: optional issue type such as `Common` or `Preferred`
- `free_float_level`: optional numeric(6,4)
- `foreign_ownership_limit`: optional numeric(6,4)
- `outstanding_shares`: optional bigint
- `listed_shares`: optional bigint
- `issued_shares`: optional bigint
- `listing_date`: optional listing date
- `is_blue_chip`: boolean default false
- `is_active`: boolean default true
- `website_url`: optional website URL
- `logo_url`: optional logo URL
- `created_at`: timestamp with timezone, default now
- `updated_at`: timestamp with timezone, default now

**Validation rules**:

- `symbol` and `name` are required.
- `company_id` may be null until company seeding resolves the parent company.
- All financial columns are numeric or bigint-backed; no float storage is
  allowed.
- Rows with null `edge_cmpy_id` are skipped by enrichment and dividends scripts.
- Rows with null `edge_cmpy_id` or `edge_sec_id` are skipped by price backfill.

### Daily Price

**Purpose**: Stores one end-of-day trading record per stock and trade date.

**Fields**:

- `id`: serial primary key
- `stock_id`: required foreign key to `stocks.id`
- `trade_date`: required date
- `open_price`: optional numeric(12,4)
- `high_price`: optional numeric(12,4)
- `low_price`: optional numeric(12,4)
- `close_price`: optional numeric(12,4)
- `volume`: optional bigint, always null for PSE Edge historical backfill
- `value`: optional numeric(18,4)
- `percent_change`: optional numeric(8,4)
- `net_foreign`: optional numeric(18,4)

**Validation rules**:

- Unique on `(stock_id, trade_date)`.
- `volume` must remain null when sourced from PSE Edge historical chart data.
- `percent_change` is recalculated after backfill for the affected date range.

### Dividend

**Purpose**: Stores one dividend row per stock and ex-date, preserving security
type for future filtering.

**Fields**:

- `id`: serial primary key
- `stock_id`: required foreign key to `stocks.id`
- `security_type`: optional raw provider security label such as `COMMON`,
  `JFCPB`, or `GLOPA`
- `dividend_type`: required type label normalized for storage
- `amount_per_share`: optional numeric(10,6)
- `declaration_date`: optional date, null for this source
- `ex_date`: optional date
- `record_date`: optional date
- `payment_date`: optional date
- `fiscal_year`: optional integer, null for this source
- `created_at`: timestamp with timezone, default now

**Validation rules**:

- All upstream dividend rows are stored; no ingestion-time filtering to
  `COMMON`.
- Upsert target is `(stock_id, ex_date)`.
- `declaration_date` and `fiscal_year` remain null because the source does not
  provide them in this feature.

### Intraday Snapshot

**Purpose**: Unchanged operational table retained for later features.

**Fields**: unchanged from the current schema.

### Market Index

**Purpose**: Unchanged operational table retained for later features.

**Fields**: unchanged from the current schema.

### Ingestion Log

**Purpose**: Unchanged operational table retained for job/script observability.

**Fields**: unchanged from the current schema.

## Transient Provider Models

### ListedCompanyEntry

Used by `seed-companies.ts` to create or update `companies` and `stocks`.

**Mapping**:

- `symbol` -> `stocks.symbol`
- `name` -> `companies.name`
- `sector` -> `companies.sector` and seed-time stock copy
- `subsector` -> `companies.subsector` and seed-time stock copy
- `listingDate` -> `stocks.listing_date`
- `edgeCmpyId` -> `companies.edge_cmpy_id`, `stocks.edge_cmpy_id`
- `edgeSecId` -> `stocks.edge_sec_id`

### CompanyProfile

Used by `seed-companies.ts` to enrich `companies`.

**Mapping**:

- `description` -> `companies.description`
- `sector` -> `companies.sector`
- `subsector` -> `companies.subsector`
- `incorporationDate` -> `companies.incorporation_date`
- `fiscalYearEnd` -> `companies.fiscal_year_end`
- `externalAuditor` -> `companies.external_auditor`
- `transferAgent` -> `companies.transfer_agent`
- `address` -> `companies.address`
- `email` -> `companies.email`
- `phone` -> `companies.phone`
- `websiteUrl` -> `companies.website_url`
- `logoUrl` -> source fallback for `companies.logo_url`

### StockDetailSnapshot

Used by `enrich-stocks.ts` to update `stocks`.

**Mapping**:

- `edgeSecId` -> `stocks.edge_sec_id`
- `boardLot` -> `stocks.board_lot`
- `isin` -> `stocks.isin`
- `issueType` -> `stocks.issue_type`
- `outstandingShares` -> `stocks.outstanding_shares`
- `listedShares` -> `stocks.listed_shares`
- `issuedShares` -> `stocks.issued_shares`
- `freeFloatLevel` -> `stocks.free_float_level`
- `parValue` -> `stocks.par_value`
- `foreignOwnershipLimit` -> `stocks.foreign_ownership_limit`
- `listingDate` -> `stocks.listing_date`

The price-like fields on this snapshot are intentionally not stored on `stocks`
by this feature.

### HistoricalPricePoint

Used by `backfill-prices.ts` to populate `daily_prices`.

**Mapping**:

- `tradeDate` -> `daily_prices.trade_date`
- `openPrice` -> `daily_prices.open_price`
- `highPrice` -> `daily_prices.high_price`
- `lowPrice` -> `daily_prices.low_price`
- `closePrice` -> `daily_prices.close_price`
- `value` -> `daily_prices.value`
- `volume` -> `daily_prices.volume` (always null)
- `edgeCmpyId` -> resolve `stocks.id`

### DividendEntry

Used by `backfill-dividends.ts` to populate `dividends`.

**Mapping**:

- `securityType` -> `dividends.security_type`
- `dividendType` -> `dividends.dividend_type`
- `dividendRate` -> `dividends.amount_per_share`
- `exDate` -> `dividends.ex_date`
- `recordDate` -> `dividends.record_date`
- `paymentDate` -> `dividends.payment_date`

`stock_id` is resolved by matching `stocks.edge_cmpy_id` to the current company.

## Relationships

- One `company` may have many `stocks`.
- One `stock` may have many `daily_prices`.
- One `stock` may have many `dividends`.
- `intraday_snapshots` remain tied to `stocks`.

## Script State Transitions

### `seed-companies.ts`

1. Read listed companies from provider.
2. Skip rows with null `edge_cmpy_id`.
3. Fetch company profile and logo candidate.
4. Attempt logo upload and choose S3 URL or source fallback.
5. Upsert `companies`.
6. Resolve `company_id`.
7. Upsert `stocks`.

### `enrich-stocks.ts`

1. Query active stocks with non-null `edge_cmpy_id`.
2. Skip rows missing `edge_cmpy_id`.
3. Fetch stock snapshot.
4. Upsert stock trading and capital-structure fields.

### `backfill-dividends.ts`

1. Query active stocks with non-null `edge_cmpy_id`.
2. Skip rows missing `edge_cmpy_id`.
3. Fetch all dividend rows for the company.
4. Upsert every row into `dividends` without filtering `security_type`.

### `backfill-prices.ts`

1. Query active stocks with non-null `edge_cmpy_id` and `edge_sec_id`.
2. Skip rows missing either identifier.
3. Resolve CLI date range.
4. Fetch historical prices.
5. Upsert `daily_prices` rows.
6. Recalculate `percent_change` for the affected date range.
7. Refresh `stock_52_week`.

### `verify-backfill.ts`

1. Read aggregate counts.
2. Read sample company, stock, price, and dividend rows for `JFC`.
3. Read gap reports for missing `daily_prices` or `company_id`.
4. Exit with status `1` when gaps exist; otherwise exit `0`.
