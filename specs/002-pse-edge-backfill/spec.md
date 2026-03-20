# Feature Specification: PSE Edge Backfill Foundation

**Feature Branch**: `002-pse-edge-backfill`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Build the database schema migration and backfill
scripts that seed palago.ph with initial data from PSE Edge using the
PSEEdgeProvider built in feature 001."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seed the canonical market directory (Priority: P1)

As an operator preparing palago.ph for first launch, I need the database to
store one canonical record for each listed company and stock so the website can
show complete identity, profile, and logo information for the full PSE roster.

**Why this priority**: The app cannot serve trustworthy stock pages, lists, or
future daily updates until the base company and stock directory exists.

**Independent Test**: Can be fully tested by starting from an empty database,
running the company-seeding workflow once, and confirming that listed companies
and stocks are created without duplicates and can be re-run safely.

**Acceptance Scenarios**:

1. **Given** an empty database, **When** the operator runs the initial company
   seed, **Then** each listed security is represented in the stock directory
   with its associated company profile when provider data exists.
2. **Given** a company profile includes a logo, **When** the seed stores that
   profile, **Then** the system preserves a usable absolute logo URL even if
   asset upload fails.
3. **Given** the seed is run a second time, **When** matching companies and
   stocks already exist, **Then** the system updates existing records instead of
   creating duplicates.

---

### User Story 2 - Enrich stocks and dividends (Priority: P2)

As an operator, I need the initial dataset to include each stock's trading
attributes, capital structure fields, and dividend history so beginner
investors see complete stock detail pages once the app launches.

**Why this priority**: After the directory exists, stock detail completeness is
the next most important requirement for launch-quality investor data.

**Independent Test**: Can be fully tested by running the enrichment workflow on
stocks that already exist in the directory and confirming that trading fields
and dividend records are populated or updated without affecting unrelated rows.

**Acceptance Scenarios**:

1. **Given** an active stock with a provider identifier, **When** the operator
   runs stock enrichment, **Then** trading and capital structure fields are
   stored on that stock record.
2. **Given** a company has both common and preferred-share dividend entries,
   **When** dividends are backfilled, **Then** all source rows are stored with
   their security type (e.g. COMMON, JFCPB, GLOPA) so user-facing MVP screens
   can filter to common-share dividends without data loss.
3. **Given** optional upstream dividend or capital-structure fields are
   missing, **When** enrichment runs, **Then** the workflow stores null values
   for those fields and continues without corrupting the record.

---

### User Story 3 - Backfill launch-ready price history (Priority: P3)

As an operator, I need the initial dataset to include historical daily prices
for each active stock so charts, 52-week ranges, and core investor comparisons
work immediately after launch.

**Why this priority**: Historical prices are essential for charts and analytics,
but they depend on the stock directory and identifiers from the earlier stories.

**Independent Test**: Can be fully tested by backfilling a controlled date
range for existing stocks and confirming that price history is created, reruns
do not duplicate rows, and empty source ranges leave no invalid records behind.

**Acceptance Scenarios**:

1. **Given** an active stock with provider identifiers, **When** the operator
   runs historical price backfill for a date range, **Then** daily price rows
   are stored for every available trading day in that range.
2. **Given** a source day does not provide volume, **When** historical prices
   are stored, **Then** the value is preserved as null rather than guessed or
   derived.
3. **Given** the requested date range has no chart data, **When** the backfill
   runs, **Then** the workflow completes without writing invalid daily rows.

### Edge Cases

- What happens when one company profile, dividend page, or historical-price
  request fails during a long-running backfill?
- What happens when an expected logo cannot be downloaded or uploaded but the
  rest of the company data is valid?
- What happens when upstream optional fields are blank, malformed, or only
  available for some listed securities?
- What happens when a backfill is re-run after partial completion or after a
  schema reset?
- What happens when preferred-share dividend rows exist but user-facing MVP
  views must only show common-share dividends?
- What happens when a stock exists in the database from the original seed
  but has no edge_cmpy_id or edge_sec_id set — enrichment and price backfill
  must skip it gracefully rather than failing the entire run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST extend the approved PSE Edge provider so it can
  return dividend records for a company, including security type, dividend type,
  dividend amount, ex-date, record date, and payment date.
- **FR-002**: The system MUST rewrite the initial reference-data schema so
  company profile data is stored separately from stock security data, with each
  stock optionally linked to its parent company.
- **FR-003**: The system MUST preserve PSE Edge company and security identifiers
  on the appropriate records to support future re-syncs and historical lookups.
- **FR-004**: The system MUST store financial amounts using precise numeric
  semantics and MUST NOT introduce floating-point storage for financial data.
- **FR-005**: The system MUST support a clean first-run migration path from an
  empty environment where existing pre-launch tables are discarded and replaced
  by the launch schema.
- **FR-006**: The system MUST provide a repeatable company-seeding workflow that
  creates or updates company and stock records from the approved provider
  without producing duplicates on rerun.
- **FR-007**: The system MUST persist a usable absolute logo URL for each
  company, preferring the managed asset location and falling back to the source
  logo URL when asset handling fails.
- **FR-008**: The system MUST provide a repeatable stock-enrichment workflow
  that updates trading attributes, ownership limits, share counts, issue type,
  and related stock metadata for existing active stocks.
- **FR-009**: The system MUST provide a repeatable dividend backfill workflow
  that stores all dividend rows returned by the approved provider, including
  preferred-share rows such as JFCPB and GLOPA, while storing the raw
  security_type value on every row so user-facing screens can filter to
  security_type = 'COMMON' without requiring a re-backfill.

- **FR-010**: The system MUST provide a repeatable historical-price backfill
  workflow that writes daily OHLC and value data by trading date for stocks with
  valid provider identifiers.
- **FR-011**: The system MUST leave historical price volume null when the
  approved provider does not supply volume for a trading day.
- **FR-012**: The system MUST validate all provider payloads before any database
  write and MUST fail explicitly for invalid required fields while degrading
  optional invalid fields to null where the provider contract allows it.
- **FR-013**: The system MUST use idempotent upsert behavior for all seed and
  backfill writes so interrupted runs can be retried safely.
- **FR-014**: The system MUST emit structured progress and summary logs for each
  local backfill workflow, including warnings for recoverable per-record issues.
- **FR-015**: The system MUST preserve UTC storage for timestamps and apply
  Philippine market-date interpretation consistently when transforming provider
  dates for stored records.
- **FR-016**: The system MUST restore the project's derived market-data views
  after the schema migration is applied so downstream features can rely on the
  refreshed launch schema.

### Key Entities *(include if feature involves data)*

- **Company**: A corporate profile record keyed by an optional PSE Edge company
  identifier, containing name, branding, contact details, classification, and
  corporate profile data.
- **Stock**: A listed PSE security keyed by symbol, linked to a company when
  known, and containing provider identifiers plus trading and capital-structure
  attributes.
- **Dividend Entry**: A dated distribution record tied to a stock, preserving
  security type, dividend type, amount per share, and key investor dates.
- **Daily Price**: One trading-day record for a stock containing OHLC, value,
  optional volume, and daily percent change.
- **Logo Asset**: A publicly retrievable company logo URL stored for web-app use
  and sourced from a managed asset location when possible.
- **External Provider Contract**: PSE Edge is the single approved source for the
  company directory, company profiles, stock metadata, dividend history, and the
  initial historical-price backfill in this feature.

## Assumptions

- The environment is still pre-launch, so replacing the existing schema is
  acceptable and no production data needs to be preserved.
- Terraform application and database migration execution are performed manually
  by Matt after the required artifacts are generated.
- Backfill workflows are local operator scripts rather than scheduled Lambda
  jobs in this feature.
- User-facing MVP screens will later filter stored dividends to
  `security_type = COMMON`, but this feature still stores all upstream dividend
  rows for auditability and future use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a clean reset and initial seed, 100% of currently listed PSE
  securities returned by the approved provider are represented in the stock
  directory with no duplicate symbols.
- **SC-002**: Re-running each seed or backfill workflow over the same input
  changes existing records in place and results in 0 duplicate company, stock,
  dividend, or daily-price rows.
- **SC-003**: For companies with an upstream logo reference, at least 95% of
  seeded company records end the run with a usable absolute logo URL.
- **SC-004**: For stocks with valid provider identifiers, the stock-enrichment
  workflow populates launch-critical trading metadata for at least 95% of
  active stocks in a full backfill run.
- **SC-005**: Historical price backfill stores one daily record per available
  trading day in the requested range and stores 0 non-null inferred volumes for
  source days where volume is not provided.
- **SC-006**: Every seed and backfill workflow produces a completion summary that
  reports fetched records, written records, and recoverable failures clearly
  enough for an operator to decide whether a rerun is needed.
