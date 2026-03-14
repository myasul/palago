# Feature Specification: PSE Edge Data Provider

**Feature Branch**: `001-pse-edge-provider`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "Build the PSEEdgeProvider for public PSE Edge company,
stock, profile, and historical price data for shared use across palago.ph."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sync Listed Companies (Priority: P1)

As a data ingestion maintainer, I need a complete list of listed companies and
their PSE Edge identifiers so the platform can seed and refresh stock coverage
without manual data entry.

**Why this priority**: Stock coverage depends on having an authoritative list of
listed companies before any detail or history can be collected reliably.

**Independent Test**: Run the company list operation and confirm it returns the
full listed-company set with each entry carrying symbol, company name, sector,
subsector, listing date, and the two provider-specific identifiers needed for
follow-up detail retrieval.

**Acceptance Scenarios**:

1. **Given** the public listed-company directory is available, **When** a
   consumer requests the company list, **Then** the system returns every listed
   stock across all pages as one consolidated result set.
2. **Given** a company row contains embedded provider identifiers, **When** the
   company list is returned, **Then** those identifiers are extracted and stored
   with the matching company record.

---

### User Story 2 - Retrieve Company and Stock Details (Priority: P2)

As an application or ingestion consumer, I need current stock details and
company profile information for a listed issuer so the platform can show a
complete, beginner-friendly stock page and store provider-backed reference data.

**Why this priority**: Once listed companies are known, the next highest-value
work is enriching each issuer with the pricing, ownership, and profile details
that power stock pages and downstream ingestion.

**Independent Test**: Request stock details and company profile information for
one company and confirm the result includes the published market figures,
company metadata, and a usable absolute logo URL when available.

**Acceptance Scenarios**:

1. **Given** a valid company identifier, **When** a consumer requests stock
   details, **Then** the system returns the published market snapshot, share
   details, ownership limits, listing date, and board lot for the default
   listed security.
2. **Given** a valid company identifier, **When** a consumer requests company
   profile information, **Then** the system returns the published descriptive
   and contact fields together with a full absolute logo URL derived from the
   issuer symbol.

---

### User Story 3 - Retrieve Historical Prices (Priority: P3)

As an application or ingestion consumer, I need daily historical prices for a
specific listed security over a date range so the platform can power charts,
backfills, and historical analysis from the same provider contract.

**Why this priority**: Historical data is valuable, but it depends on company
and security identifiers already being available from higher-priority flows.

**Independent Test**: Request historical prices for a valid company-security
pair and date range, then confirm each returned trading day includes the
published open, high, low, close, and value figures while volume is explicitly
left empty when the source does not provide it.

**Acceptance Scenarios**:

1. **Given** valid company and security identifiers and a valid date range,
   **When** a consumer requests historical prices, **Then** the system returns
   one record per trading day published by the source within that range.
2. **Given** the historical source omits volume, **When** historical prices are
   returned, **Then** volume is explicitly represented as empty rather than
   guessed or backfilled from another source.

### Edge Cases

- The listed-company directory spans multiple pages and the provider must
  continue until all listed companies are collected. If a directory page request fails, the operation must fail with an explicit error rather than returning a partial company list.
- A company may expose multiple securities; the default detail response must use
  the first listed security unless a future enhancement adds explicit selection.
- Some company profile fields, logos, or contact details may be absent; the
  provider must return empty values rather than failing the whole response.
- Historical prices may be unavailable for a requested date range or for newly
  listed securities; the provider must return an empty result set rather than
  synthetic records.
- Source pages may contain formatting noise such as commas, percent signs, or
  embedded identifiers; the provider must normalize them without changing the
  published meaning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide one reusable public-market data provider
  that can be consumed by both data ingestion workflows and the web application.
- **FR-002**: The system MUST return a consolidated list of all listed companies
  from the public company directory in a single company-list operation.
- **FR-003**: Each company-list result MUST include symbol, company name,
  sector, subsector, listing date, company identifier, and security identifier.
- **FR-004**: The system MUST extract provider-specific company and security
  identifiers from the published directory content rather than requiring manual
  configuration.
- **FR-005**: The stock-detail operation MUST return the published current
  price, open, high, low, close, volume, traded value, percent change, 52-week
  high, 52-week low, board lot, ISIN, issue type, outstanding shares, listed
  shares, issued shares, free float level, par value, foreign ownership limit,
  and listing date for the default listed security.
- **FR-006**: The company-profile operation MUST return the published company
  description, sector, subsector, incorporation date, fiscal year end, external
  auditor, transfer agent, address, email, phone, website, and logo URL.
- **FR-007**: The logo URL returned by the company-profile operation MUST be a
  full absolute URL that consumers can use directly.
- **FR-008**: The historical-price operation MUST return daily open, high, low,
  close, and traded value for each trading day made available by the source
  within the requested date range.
- **FR-009**: When the historical source omits volume, the historical-price
  operation MUST return volume as empty rather than inferred.
- **FR-010**: All provider operations MUST validate source data before returning
  it and MUST fail with explicit errors when required fields cannot be parsed
  into a valid response shape. This this means per-record validation failures are logged and skipped, while missing structural fields (the entire response is unparseable) cause the operation to fail.
- **FR-011**: Provider operations MUST respect polite source access limits so
  repeated requests do not hit the public source in an aggressive manner.
- **FR-012**: The feature MUST exclude dividend retrieval from this scope.
- **FR-013**: The feature MUST exclude market-index retrieval from this scope.

### Key Entities *(include if feature involves data)*

- **Listed Company Entry**: A listed stock in the public directory with identity
  fields, sector classification, listing date, and the provider identifiers
  needed for downstream calls.
- **Stock Detail Snapshot**: The current market and capital-structure details
  published for one issuer's default listed security.
- **Company Profile**: The descriptive and contact information published for one
  issuer, including the externally usable logo URL.
- **Historical Price Point**: One trading day's published price and traded value
  for a company-security pair, with volume explicitly empty when unavailable.

## Assumptions

- The provider serves internal palago.ph consumers rather than direct end users.
- The public source remains accessible without authentication for the supported
  operations in this feature.
- The first listed security represents the common-share view that downstream
  consumers need by default.
- Missing optional source fields are acceptable as empty values when the source
  does not publish them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can retrieve the full listed-company directory in one
  invocation without manual page-by-page intervention.
- **SC-002**: For agreed sample issuers used during feature validation, 100% of
  required company-list, stock-detail, company-profile, and historical-price
  fields are returned in the expected response shapes.
- **SC-003**: Historical-price requests preserve source fidelity by returning
  one record for every trading day supplied by the source and leaving volume
  empty for 100% of returned rows when the source does not provide it.
- **SC-004**: Both planned internal consumer surfaces can use the same provider
  contract for these four operations without requiring separate scraping flows.
