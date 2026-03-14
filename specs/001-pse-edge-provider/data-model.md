# Data Model: PSE Edge Data Provider

## ListedCompanyEntry

**Purpose**: Represents one listed security discovered from the paginated PSE
Edge directory search.

**Fields**:

- `symbol`: string, required, trimmed ticker symbol
- `name`: string, required, company name as shown in the directory
- `sector`: string | null, optional sector label
- `subsector`: string | null, optional subsector label
- `listingDate`: Date | null, optional listing date parsed from directory data
- `edgeCmpyId`: string, required, provider company identifier extracted from
  `cmDetail(cmpy_id, security_id)` — first argument
- `edgeSecId`: string, required, provider security identifier extracted from
  `cmDetail(cmpy_id, security_id)` — second argument

**Validation rules**:

- `symbol`, `name`, `edgeCmpyId`, and `edgeSecId` are required and must be
  non-empty after trimming.
- `edgeCmpyId` and `edgeSecId` remain strings and are never coerced to numbers.
- Pagination failure invalidates the entire company-list operation; partial page
  aggregation is not allowed.

**DB mapping**:

| Provider field | DB table    | DB column        |
|----------------|-------------|------------------|
| `symbol`       | `stocks`    | `symbol`         |
| `name`         | `companies` | `name`           |
| `sector`       | `companies` | `sector`         |
| `subsector`    | `companies` | `subsector`      |
| `listingDate`  | `stocks`    | `listing_date`   |
| `edgeCmpyId`   | `stocks`    | `edge_cmpy_id`   |
| `edgeCmpyId`   | `companies` | `edge_cmpy_id`   |
| `edgeSecId`    | `stocks`    | `edge_sec_id`    |

Note: `edgeCmpyId` is stored in both tables. `stocks.company_id` (FK →
`companies.id`) links the two rows after the backfill upsert.

---

## StockDetailSnapshot

**Purpose**: Represents the current stock and capital-structure detail page for
the default listed security of a company. Price fields are written to
`daily_prices` (today's row) or `intraday_snapshots` by the backfill and
ingestion layers — they are not stored in the `stocks` reference table.

**Fields**:

- `edgeCmpyId`: string, required
- `edgeSecId`: string, required, value of the first `<option>` in the security
  selector — always the common share
- `securitySymbol`: string, required, label of the first `<option>` (e.g. "JFC")
- `currentPrice`: number | null, last traded price as published on the page
  (maps to `close_price` in `daily_prices`)
- `openPrice`: number | null
- `highPrice`: number | null
- `lowPrice`: number | null
- `volume`: number | null
- `value`: number | null, total traded value in PHP
- `percentChange`: number | null
- `high52Week`: number | null
- `low52Week`: number | null
- `boardLot`: number | null
- `isin`: string | null
- `issueType`: string | null, e.g. "Common", "Preferred"
- `outstandingShares`: number | null
- `listedShares`: number | null
- `issuedShares`: number | null
- `freeFloatLevel`: number | null, percentage as a decimal value (e.g. 46.32,
  not 0.4632)
- `parValue`: number | null
- `foreignOwnershipLimit`: number | null, percentage as a decimal value or null
  when "No Limit" is shown
- `listingDate`: Date | null

**Validation rules**:

- `edgeCmpyId`, `edgeSecId`, and `securitySymbol` are required.
- Numeric fields accept normalized decimal values or `null`.
- Invalid required page structure or missing default security option throws an
  explicit error.
- Optional missing or malformed page values degrade to `null`.
- "No Limit" for `foreignOwnershipLimit` normalizes to `null`.

**DB mapping**:

| Provider field           | DB table         | DB column                  | Notes                                                      |
|--------------------------|------------------|----------------------------|------------------------------------------------------------|
| `edgeSecId`              | `stocks`         | `edge_sec_id`              |                                                            |
| `boardLot`               | `stocks`         | `board_lot`                |                                                            |
| `isin`                   | `stocks`         | `isin`                     |                                                            |
| `issueType`              | `stocks`         | `issue_type`               |                                                            |
| `outstandingShares`      | `stocks`         | `outstanding_shares`       |                                                            |
| `listedShares`           | `stocks`         | `listed_shares`            |                                                            |
| `issuedShares`           | `stocks`         | `issued_shares`            |                                                            |
| `freeFloatLevel`         | `stocks`         | `free_float_level`         |                                                            |
| `parValue`               | `stocks`         | `par_value`                |                                                            |
| `foreignOwnershipLimit`  | `stocks`         | `foreign_ownership_limit`  | null when "No Limit"                                       |
| `listingDate`            | `stocks`         | `listing_date`             |                                                            |
| `currentPrice`           | `daily_prices`   | `close_price`              | today's row — written by backfill/ingestion jobs           |
| `openPrice`              | `daily_prices`   | `open_price`               | today's row — written by backfill/ingestion jobs           |
| `highPrice`              | `daily_prices`   | `high_price`               | today's row — written by backfill/ingestion jobs           |
| `lowPrice`               | `daily_prices`   | `low_price`                | today's row — written by backfill/ingestion jobs           |
| `volume`                 | `daily_prices`   | `volume`                   | today's row — written by backfill/ingestion jobs           |
| `value`                  | `daily_prices`   | `value`                    | today's row — written by backfill/ingestion jobs           |
| `percentChange`          | `daily_prices`   | `percent_change`           | today's row — written by backfill/ingestion jobs           |
| `high52Week`             | —                | —                          | not stored; computed by `stock_52_week` materialized view  |
| `low52Week`              | —                | —                          | not stored; computed by `stock_52_week` materialized view  |

---

## CompanyProfile

**Purpose**: Represents descriptive and contact information from the company
information page.

**Fields**:

- `edgeCmpyId`: string, required
- `symbol`: string, required, used to derive the absolute logo URL
- `description`: string | null
- `sector`: string | null
- `subsector`: string | null
- `incorporationDate`: Date | null
- `fiscalYearEnd`: string | null, raw string as published (e.g. "12/31")
- `externalAuditor`: string | null
- `transferAgent`: string | null
- `address`: string | null
- `email`: string | null
- `phone`: string | null
- `websiteUrl`: string | null
- `logoUrl`: string | null, full absolute URL constructed from the issuer symbol
  using the pattern `https://edge.pse.com.ph/clogo/co_{SYMBOL}_logo.jpg`

**Validation rules**:

- `edgeCmpyId` and `symbol` are required.
- `logoUrl` is constructed from the symbol — it is not parsed from the page.
- Contact and descriptive fields may be empty without failing the response.
- Email addresses on PSE Edge pages may be Cloudflare-obfuscated; return `null`
  rather than the encoded placeholder when the decoded value cannot be resolved.

**DB mapping**:

| Provider field      | DB table    | DB column            |
|---------------------|-------------|----------------------|
| `edgeCmpyId`        | `companies` | `edge_cmpy_id`       |
| `description`       | `companies` | `description`        |
| `sector`            | `companies` | `sector`             |
| `subsector`         | `companies` | `subsector`          |
| `incorporationDate` | `companies` | `incorporation_date` |
| `fiscalYearEnd`     | `companies` | `fiscal_year_end`    |
| `externalAuditor`   | `companies` | `external_auditor`   |
| `transferAgent`     | `companies` | `transfer_agent`     |
| `address`           | `companies` | `address`            |
| `email`             | `companies` | `email`              |
| `phone`             | `companies` | `phone`              |
| `websiteUrl`        | `companies` | `website_url`        |
| `logoUrl`           | `companies` | `logo_url`           |

---

## HistoricalPricePoint

**Purpose**: Represents one published trading-day record from the historical
chart endpoint (`POST /common/DisclosureCht.ax`).

**Fields**:

- `edgeCmpyId`: string, required
- `edgeSecId`: string, required
- `tradeDate`: Date, required, parsed from source format `Feb 16, 2026 00:00:00`
- `openPrice`: number | null
- `highPrice`: number | null
- `lowPrice`: number | null
- `closePrice`: number | null
- `value`: number | null, normalized from scientific notation
  (e.g. `8.895122E7` → `88951220`)
- `volume`: null, always `null` — the historical endpoint does not provide volume

**Validation rules**:

- `tradeDate` is required and must be parsed from the source label format
  `MMM DD, YYYY HH:mm:ss` into a Date. Invalid date strings throw an explicit
  error.
- `value` may arrive in scientific notation and must be normalized to a number;
  normalization failure degrades to `null`.
- `volume` must be explicitly set to `null` for every record — never inferred
  or backfilled from another source.
- Empty result sets are valid when the source has no rows for the requested
  range.

**DB mapping**:

| Provider field | DB table       | DB column     | Notes                                                              |
|----------------|----------------|---------------|--------------------------------------------------------------------|
| `edgeCmpyId`   | —              | —             | used to resolve `stocks.id` at write time via `stocks.edge_cmpy_id` |
| `edgeSecId`    | —              | —             | used to confirm the correct security at write time                 |
| `tradeDate`    | `daily_prices` | `trade_date`  |                                                                    |
| `openPrice`    | `daily_prices` | `open_price`  |                                                                    |
| `highPrice`    | `daily_prices` | `high_price`  |                                                                    |
| `lowPrice`     | `daily_prices` | `low_price`   |                                                                    |
| `closePrice`   | `daily_prices` | `close_price` |                                                                    |
| `value`        | `daily_prices` | `value`       |                                                                    |
| `volume`       | `daily_prices` | `volume`      | always NULL                                                        |

The `daily_prices.stock_id` FK is resolved at write time by the backfill layer
using `stocks.edge_cmpy_id = edgeCmpyId`. The provider itself does not perform
this lookup — it is read-only.

---

## Provider-to-Database Relationship Summary

```
PSEEdgeProvider returns       Written to DB by
─────────────────────────     ─────────────────────────────────────────────
ListedCompanyEntry       →    companies  (name, sector, subsector,
                                         edge_cmpy_id)
                              stocks     (symbol, listing_date,
                                         edge_cmpy_id, edge_sec_id,
                                         company_id FK)

StockDetailSnapshot      →    stocks        (capital structure fields:
                                            board_lot, isin, issue_type,
                                            shares, free_float, par_value,
                                            foreign_ownership_limit)
                              daily_prices  (price fields for today's row)

CompanyProfile           →    companies     (all descriptive and contact fields,
                                            logo_url)

HistoricalPricePoint     →    daily_prices  (one row per trading day;
                                            volume always NULL)
```

The provider is read-only. All database writes are the responsibility of the
backfill scripts and Lambda ingestion jobs that consume the provider contract.
