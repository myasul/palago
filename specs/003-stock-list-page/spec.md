# Feature Specification: Stock List Page

**Feature Branch**: `003-stock-list-page`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Build the Stock List page for palago.ph — a
browsable, filterable list of all PSE-listed stocks for beginner Filipino
investors. URL: /lists/[type] where type is blue-chips or all"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Affordable Stocks (Priority: P1)

A beginner investor opens the stock list to scan listed companies without
knowing stock symbols in advance. They compare stocks by company name, sector,
latest price movement, and especially the minimum amount needed to start
investing.

**Why this priority**: This is the core discovery journey. The page is only
useful if a first-time investor can immediately browse a complete stock list and
see the minimum investment required for each option.

**Independent Test**: Open the page for either list type and confirm a user can
see multiple stock cards, identify the minimum investment for each card, and
open a stock detail page from any card without using filters first.

**Acceptance Scenarios**:

1. **Given** a user opens `/lists/blue-chips`, **When** the page loads,
   **Then** the page shows only blue-chip stocks with each card displaying the
   stock symbol, company name, sector, company logo or placeholder, latest
   price or placeholder, latest percent change or placeholder, and minimum
   investment.
2. **Given** a stock has no latest daily price data, **When** it appears in the
   list, **Then** the stock still renders as a card and shows `—` for the price
   and change values rather than being hidden or causing an error.
3. **Given** a user selects a stock card, **When** they tap or click it,
   **Then** they are taken to that stock's detail page.

---

### User Story 2 - Narrow the List by Intent (Priority: P2)

A beginner investor refines the list by searching for a company or symbol,
filtering to a sector, and reordering the list to match how they want to
compare opportunities.

**Why this priority**: Browsing is more useful when the investor can quickly
reduce the list to a manageable set and sort by what matters most to them,
especially recent change, price, or name.

**Independent Test**: Starting from a populated list, apply a search term,
sector filter, and sort option and confirm the results update correctly while
preserving the selected state in the URL.

**Acceptance Scenarios**:

1. **Given** a user enters a search term, **When** the term matches part of a
   stock symbol or company name (case-insensitive), **Then** the list shows
   only matching stocks.
2. **Given** a user selects a sector filter, **When** the filter is applied,
   **Then** the list shows only stocks in that exact sector.
3. **Given** a user changes the sort field or sort direction, **When** the page
   updates, **Then** the list reflects the selected ordering across the current
   result set.

---

### User Story 3 - Share and Resume a Specific View (Priority: P3)

A beginner investor or mentor shares a filtered stock list view with another
person, or returns later to continue browsing from the same search, filter, and
page state.

**Why this priority**: Shareable, restorable URLs make the page useful for
research, conversation, and repeated visits instead of forcing users to rebuild
their filters every time.

**Independent Test**: Open a filtered and paginated list URL in a new browser
session and confirm the same list type, filters, sorting, and page number are
restored from the URL alone.

**Acceptance Scenarios**:

1. **Given** a user has applied search, sector, sort, order, and page
   parameters, **When** they refresh the page, **Then** the same list view is
   restored from the URL.
2. **Given** a user shares a filtered list URL, **When** another person opens
   it, **Then** they see the same filtered and sorted result set.
3. **Given** a user switches between the blue-chip and all-stocks list types,
   **When** the page updates, **Then** the list type change is reflected in the
   URL and the correct stock set is shown.

### Edge Cases

- What happens when a stock has no latest daily price data, no percent change,
  or no logo?
- How does the page behave when a search or sector filter returns zero results?
- What happens when a user requests a page number beyond the available pages for
  the current filter set?
- How is the minimum investment shown when the latest price is unavailable?
- How does the page explain terms such as board lot and percent change in plain
  Filipino for a first-time investor?
- How does the page disclose delayed market data and reflect Philippine market
  context when showing the latest available values?
- What happens when a user switches list types and the previously selected
  sector filter has no matching stocks in the new list type?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a stock list page at `/lists/[type]`
  where `type` supports `blue-chips` and `all`.
- **FR-002**: The `blue-chips` list type MUST show only stocks designated as
  blue-chip stocks, while the `all` list type MUST show all PSE-listed stocks
  available in the internal market data store.
- **FR-003**: Each stock card MUST display the company logo, stock symbol,
  company name, sector, latest available closing price, latest available percent
  change, and minimum investment.
- **FR-004**: The system MUST calculate minimum investment as board lot
  multiplied by the latest available closing price and present it prominently on
  every stock card.
- **FR-005**: The system MUST allow users to filter the list by exact sector
  match.
- **FR-006**: The system MUST allow users to search by stock symbol or company
  name using a case-insensitive contains match.
- **FR-007**: The system MUST allow users to sort the current result set by
  price, latest percent change, or company name in ascending or descending
  order.
- **FR-008**: The system MUST paginate results at 25 stocks per page.
- **FR-009**: The system MUST treat URL parameters as the source of truth for
  list type, sector filter, search term, sort field, sort direction, and page
  number.
- **FR-010**: The default list view MUST open as blue-chip stocks sorted by
  latest available percent change in descending order on page 1.
- **FR-011**: The system MUST preserve the user's current list state across page
  refresh and URL sharing.
- **FR-012**: Stocks without latest daily price data MUST still appear in the
  list and MUST show `—` for price and percent change values.
- **FR-013**: Stocks without latest daily price data MUST show `—` for minimum
  investment rather than an incorrect calculated value.
- **FR-014**: Each stock card MUST link directly to the corresponding stock
  detail page.
- **FR-015**: The page MUST allow users to switch between blue-chip and
  all-stocks list views. When switching list types, all URL parameters MUST be
  preserved. If the preserved sector filter returns zero results in the new list
  type, the page MUST display the empty state defined in FR-016 rather than
  clearing the filter silently.
- **FR-016**: The page MUST provide a clear empty state when no stocks match the
  active search and filter criteria.
- **FR-017**: For user-facing stock data, the system MUST disclose the
  15-minute delay and show minimum investment as board lot × price when
  relevant.
- **FR-018**: The page MUST provide plain Filipino explanations for beginner
  terms that appear in the list experience, including board lot and percent
  change.
- **FR-019**: The page MUST use only internally stored stock, company, and
  latest-price data during page load and MUST NOT depend on live third-party
  requests to render the list.
- **FR-020**: If a requested page number falls outside the available range for
  the current result set, the system MUST show the nearest valid page instead of
  failing.
- **FR-021**: Each stock card MUST display the company logo from the stored
  absolute URL when available, and MUST show a placeholder when the logo URL is
  null or unavailable.

### Assumptions

- Sector filter options are limited to sectors currently present in the stored
  company data.
- Latest price and latest percent change are derived from the most recent
  available trading day for each stock.
- Currency amounts are displayed in Philippine peso formatting consistent with
  the rest of palago.ph.
- The stock detail page (`/stocks/[symbol]`) is not yet built. Stock card links
  MUST use the correct destination URL so they function immediately once the
  detail page is implemented, and will return a 404 during development of this
  feature.
- Volume is not displayed on stock list cards; `daily_prices.volume` is null
  for all backfilled rows and is not relevant to the list view.

### Key Entities *(include if feature involves data)*

- **Stock List Entry**: A browsable stock record containing symbol, company
  name, blue-chip status, board lot, latest closing price, latest percent
  change, and derived minimum investment.
- **Company Classification**: The company-level metadata attached to a stock for
  browsing, including sector, subsector, and logo URL.
- **Latest Market Snapshot**: The most recent available end-of-day values used
  for display, including closing price and percent change, with support for
  missing values.
- **List View State**: The shareable combination of list type, sector filter,
  search term, sort field, sort direction, and page number.
- **External Provider Contract**: The page reads only from persisted market data
  sourced from approved upstream providers through the existing ingestion
  workflow; no new runtime provider contract is introduced by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability testing, at least 90% of beginner investors can
  identify the minimum investment for a stock from the list page in under 30
  seconds.
- **SC-002**: In usability testing, at least 85% of beginner investors can use
  search, sector filtering, or sorting to narrow the list to a desired stock
  set on their first attempt.
- **SC-003**: Opening, refreshing, or sharing a filtered stock-list URL
  reproduces the same visible results, ordering, and page state in 100% of test
  cases.
- **SC-004**: 100% of stocks included in the selected list type render in the
  list even when latest price data is unavailable, with placeholders shown for
  missing values.
- **SC-005**: At least 80% of beginner investors report that the page makes it
  easier to compare affordability across stocks than the current PSE browsing
  experience.
