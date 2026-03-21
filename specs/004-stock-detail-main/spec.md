# Feature Specification: Stock Detail Main

**Feature Branch**: `004-stock-detail-main`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: User description: "Build the main stock detail page at /stocks/[symbol] for palago.ph covering the top-of-page stock detail experience through the 52-week range bar, including stock lookup, navigation, informational toasts, minimum investment, today's trading context, and 52-week context for beginner Filipino investors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Price and Minimum Investment Fast (Priority: P1)

A beginner Filipino investor opens a stock detail page and immediately sees the current price, whether the stock is up or down today, and the minimum amount needed to buy the stock without having to scroll.

**Why this priority**: This is the page's core value. If the page does not answer "What does this stock cost today?" and "How much do I need to invest?" immediately, the page fails its primary purpose.

**Independent Test**: Can be fully tested by opening a valid stock detail URL on a 375px-wide viewport and confirming the navigation bar, company identity, price, percent change, minimum investment, and board lot are visible before scrolling.

**Acceptance Scenarios**:

1. **Given** a valid stock with recent price data, **When** the investor opens `/stocks/[symbol]`, **Then** the top of the page shows the company identity, last close price, percent change, minimum investment, board lot, and delayed-data disclosure without requiring scrolling.
2. **Given** a valid stock with a missing logo, **When** the investor opens the page, **Then** the page shows an initials-based placeholder instead of a broken image.
3. **Given** a valid stock with no recent price data, **When** the investor opens the page, **Then** the page still loads, shows placeholder values for price-dependent fields, and explains that price data is not yet available via an informational toast.

---

### User Story 2 - Understand Today's Trading Context (Priority: P2)

A beginner investor uses the today's trading section to understand how the last close price compares with the market open and where it sits within the day's low-to-high range, with plain-language interpretation rather than mental math.

**Why this priority**: After seeing the headline price, the next question is whether today's movement is strong or weak. This section turns raw numbers into immediate context.

**Independent Test**: Can be fully tested by opening a stock detail page with complete daily trading data and confirming the page shows open versus current, an intraday range indicator, and a short interpretation sentence that matches the values shown.

**Acceptance Scenarios**:

1. **Given** a stock with open, last close, low, and high values, **When** the investor views today's trading, **Then** the page shows both open and last close values, a range indicator with the last close position, and a sentence explaining whether the stock closed near today's low, high, or between them.
2. **Given** a stock where last close is above open, **When** the investor views the last close value, **Then** the last close metric uses positive treatment and explains that the price closed up from the open.
3. **Given** a stock where open, low, or high data is missing, **When** the investor views today's trading, **Then** the page shows placeholders for missing values and hides the range interpretation that cannot be calculated.

---

### User Story 3 - Understand 52-Week Context (Priority: P3)

A beginner investor uses the 52-week range section to understand whether the last close price is near its historical low, in the middle of its yearly range, or near its yearly high.

**Why this priority**: Historical context helps the investor judge whether the current price feels low, average, or high without needing to compare numbers manually.

**Independent Test**: Can be fully tested by opening a stock detail page for a stock with 52-week data and confirming the page shows low, current, and high values, a position indicator, and a one-sentence interpretation.

**Acceptance Scenarios**:

1. **Given** a stock with 52-week range data, **When** the investor reaches the 52-week section, **Then** the page shows the 52-week low, last close, and 52-week high values, a visual position indicator, and a single plain-English summary of whether the last close price is near the low, mid-range, or near the high.
2. **Given** a stock without sufficient 52-week history, **When** the investor reaches the 52-week section, **Then** the page shows a clear fallback message instead of an empty or broken visual.

---

### User Story 4 - Navigate to Another Stock Quickly (Priority: P3)

A beginner investor uses the stock-detail navigation bar to go back to the stock list or search directly for another stock symbol without returning to the list page first.

**Why this priority**: Direct navigation supports comparison behavior and makes the detail page usable as a browsing tool, not only as a dead-end view.

**Independent Test**: Can be fully tested by using the back control and search field from a stock detail page and confirming each action reaches the correct destination in a single step.

**Acceptance Scenarios**:

1. **Given** the investor is on a stock detail page, **When** they tap the back control, **Then** they are returned to the stock list at `/lists/blue-chips`.
2. **Given** the investor enters another valid stock symbol in the search field, **When** they submit it, **Then** they are taken directly to that stock's detail page.

---

### User Story 5 - Handle Invalid Stock URLs Gracefully (Priority: P2)

A beginner investor who opens a stock URL that does not exist is returned to the stock list with a clear informational message rather than seeing an error page.

**Why this priority**: Invalid symbols are likely from typos, stale links, or manual URL edits. The experience must recover gracefully and avoid technical failure states.

**Independent Test**: Can be fully tested by opening a nonexistent stock symbol URL and confirming the user lands on the blue-chip list, sees a short informational toast once, and does not see the toast again on refresh.

**Acceptance Scenarios**:

1. **Given** a symbol that does not exist, **When** the investor opens `/stocks/[symbol]`, **Then** they are redirected to `/lists/blue-chips` with an informational message explaining that the stock could not be found.
2. **Given** the investor has already seen the invalid-symbol toast, **When** they refresh the stock list page, **Then** the message does not appear again.

---

### User Story 6 - Handle Missing Price Data Gracefully (Priority: P2)

A beginner investor can still view the stock detail page for a valid stock that does not yet have price data, with placeholder values and a clear informational message instead of a blank or broken screen.

**Why this priority**: Some valid stocks may not yet have historical coverage. The page must remain useful and trustworthy even when pricing data is incomplete.

**Independent Test**: Can be fully tested by opening a valid stock symbol that has no latest price row and confirming the detail page loads, shows placeholders for price-dependent values, and displays a one-time informational toast.

**Acceptance Scenarios**:

1. **Given** a valid stock with no latest price data, **When** the investor opens the detail page, **Then** the page renders the stock identity and all in-scope sections with placeholder values where needed.
2. **Given** the investor lands on the no-price-data version of a valid stock detail page, **When** the page loads, **Then** an informational message appears once and does not reappear on refresh.

### Edge Cases

- A stock symbol is entered in lowercase and must still resolve to the matching uppercase stock.
- A stock exists but has no current close price, so minimum investment must show a placeholder and its calculation row must be hidden.
- Open price is unavailable, so the open metric must show a placeholder and the last-close-versus-open subtitle must be omitted.
- High and low are equal, so the intraday position marker must remain centred instead of breaking or disappearing.
- One or more intraday range values are unavailable, so the intraday bar and interpretation sentence must be hidden.
- 52-week data is unavailable, so the page must show a fallback explanation instead of an empty range bar.
- Volume is unavailable, which is expected for backfilled data, so the page must show a placeholder rather than zero.
- A company logo is unavailable, so the page must show an initials placeholder.
- A toast-triggering URL parameter is present after a redirect, so the message must display once and then be cleared to prevent repeat toasts on refresh.
- The entire above-the-fold layout must remain readable and complete at 375px width.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a stock detail page at `/stocks/[symbol]` for active stocks and normalize the requested symbol so lowercase requests resolve to the matching stock symbol.
- **FR-002**: The system MUST redirect requests for unknown stock symbols to `/lists/blue-chips?toast=stock-not-found` and surface a single informational toast message stating that the stock could not be found. The toast MUST be triggered by the URL parameter, not by server-rendered HTML, so it appears on the stock list page after the redirect completes.
- **FR-003**: The system MUST support one-time informational toast messages driven by URL parameters on two pages:
  - The stock list page MUST read a `?toast=stock-not-found` parameter and display the message "We couldn't find that stock." once.
  - The stock detail page MUST read a `?toast=no-price-data` parameter and display the message "Price data isn't available yet for this stock." once.
  In both cases the triggering URL parameter MUST be cleared from the URL after the message is displayed so a page refresh does not repeat it.
- **FR-004**: The system MUST provide an app-wide toast capability so the invalid-symbol and no-price-data messages can be shown from any page that needs them.
- **FR-005**: The stock detail page MUST include a top navigation bar with a back action to the blue-chip stock list and a search field that navigates directly to another stock detail page when a symbol is submitted.
- **FR-006**: The stock detail page MUST present the company logo or initials placeholder, company name, symbol, sector, and subsector in the header area.
- **FR-007**: The stock detail page MUST show the most recent available last close price prominently in the header, or a placeholder when no close price is available.
- **FR-008**: The stock detail page MUST show today's stored percent change in the header with positive, negative, neutral, and unavailable treatments that are visually distinct and easy to scan.
- **FR-009**: The stock detail page MUST disclose that market data is delayed by 15 minutes in the visible header area.
- **FR-010**: The stock detail page MUST show a minimum investment section that always displays the board lot and displays minimum investment as board lot multiplied by the latest close price when the close price is available.
- **FR-011**: The stock detail page MUST hide the minimum-investment calculation row when the latest close price is unavailable and show a placeholder for the minimum-investment amount instead of zero or a guessed value.
- **FR-012**: The stock detail page MUST include a today's trading section showing the trade date, open price, last close price (displayed as "Last Close"), low price, high price, volume, and value from the most recent available `daily_prices` row. It MUST also show the previous close price (displayed as "Prev Close") from the second most recent `daily_prices` row for the same stock. The stored `percent_change` value from the most recent row is used directly and is never recalculated at query time.
- **FR-013**: The today's trading section MUST describe whether the last close price is up from open, down from open, unchanged from open, or unavailable for comparison, and MUST omit the comparison subtitle when either value is missing.
- **FR-014**: The today's trading section MUST include an intraday range indicator when last close, low, and high values are available, place the last close marker proportionally between low and high, and centre the marker when low and high are equal.
- **FR-015**: The today's trading section MUST provide a one-sentence interpretation of the last close price relative to today's low and high when the required values are available, and MUST hide that interpretation when they are not.
- **FR-016**: The stock detail page MUST show volume and value as muted supporting metrics and MUST display a placeholder for volume when it is unavailable.
- **FR-017**: The stock detail page MUST include a 52-week range section showing the 52-week low, last close, and 52-week high values, a visual position indicator, and a one-sentence interpretation of whether the last close price is near the 52-week low, mid-range, or near the 52-week high when 52-week data is available.
- **FR-018**: The stock detail page MUST show a fallback explanation when 52-week range data is not yet available for the stock instead of rendering an empty 52-week chart or blank section.
- **FR-019**: The page MUST answer the questions "What did this stock last close at?", "How much do I need to invest?", and "Where does the last close sit in context?" without requiring the user to scroll on a 375px-wide viewport.
- **FR-020**: All in-scope stock detail data MUST come from the internal database only, and the feature MUST not depend on live runtime calls to external market-data providers.
- **FR-021**: Numeric provider values stored as text-like fields in the database MUST remain unaltered until display formatting, and the page MUST never infer or recalculate stored percent change or missing volume values.
- **FR-022**: This feature MUST remain scoped to the navigation bar, header, minimum investment, today's trading, and 52-week range sections only; the 30-day chart, dividends, company information, and jargon accordion remain out of scope for this specification.

### Key Entities *(include if feature involves data)*

- **Requested Stock Symbol**: The stock identifier entered in the URL or stock search field, normalized for lookup and used to determine whether the user sees a detail page or a redirect back to the list.
- **Stock Detail Snapshot**: The joined view of a stock's identity, company branding, board lot, latest available trading data, and latest available 52-week context used to render the visible page sections.
- **Trading Context Summary**: The derived user-facing interpretation of current-versus-open movement, intraday range position, and 52-week range position that explains price context in plain language.
- **Toast Notification State**: A one-time informational message trigger passed through the URL and cleared after it is shown so the experience remains recoverable and non-repetitive.
- **External Provider Contract**: No runtime external-provider dependency is permitted for this feature. All displayed data must come from previously validated and persisted internal stock, company, latest-price, and 52-week records.

### Assumptions

- The existing stock list page can be safely extended to read and clear a toast URL parameter without changing its existing filtering or pagination behavior.
- The stock detail page is intended for mobile-first viewing and is judged primarily on a 375px-wide layout.
- The latest available trading row is the single source of truth for current trading values shown on this page.
- The 52-week range record, when present, is the single source of truth for the annual context section.
- Stock symbol lookup normalises the requested symbol to uppercase before querying the database, so `/stocks/jfc` resolves identically to `/stocks/JFC`.
- The page uses `daily_prices.close_price` from the most recent trading row as the last close price throughout. Live intraday pricing via `intraday_snapshots` is a Phase B concern and is explicitly out of scope for this spec. All references to the current or latest price in this spec mean the most recent stored close price.
- The stored `daily_prices.percent_change` value is used as-is. It reflects the change from the previous trading day's close and is written by the backfill script. It is never recalculated on the detail page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual review at 375px width, users can see the stock identity, last close price, daily movement, minimum investment, and board lot without scrolling on 100% of tested stock detail pages with valid data.
- **SC-002**: In manual review, users can correctly identify whether the stock closed up, down, or unchanged today from the header and today's trading section on 100% of tested scenarios, including positive, negative, neutral, and missing-data cases.
- **SC-003**: In manual review, users can correctly determine whether the last close is near today's low, between today's range, or near today's high from the intraday section on 100% of tested scenarios where range data exists.
- **SC-004**: In manual review, users can correctly determine whether the last close is near its 52-week low, mid-range, or near its 52-week high from the 52-week section on 100% of tested scenarios where annual range data exists.
- **SC-005**: Invalid stock URLs return the user to the blue-chip stock list with a single informational message in one navigation step, and the message does not repeat on refresh in 100% of tested cases.
- **SC-006**: Valid stocks with missing price data still render a complete in-scope page shell with placeholders and a single informational message in 100% of tested cases.
