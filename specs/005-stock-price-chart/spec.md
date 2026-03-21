# Feature Specification: Stock Price Chart

**Feature Branch**: `005-stock-price-chart`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "Heres the condensed version — same decisions, half the words: Generate a spec for 005-stock-price-chart using .specify/templates/spec-template.md. Read .specify/memory/constitution.md and PROGRESS.md first. A price history chart section is added below the 52-week range bar on /stocks/[symbol]. No other sections change. One new URL param, ?range=, supports 1w, 1m, 6m, and 1y with 1m as the default. The chart shows daily close-price history for the selected period, keeps missing close values as gaps instead of inventing prices, shows period low and period high when valid prices exist, and shows a simple empty state when no usable price history exists for the selected period. The range toggle updates only the chart section while the rest of the page remains still. Volume, candlesticks, intraday views, annotations, extra axis labels, and end-to-end tests are out of scope."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Recent Price History Quickly (Priority: P1)

A beginner investor opens a stock detail page and sees a simple recent price-history chart directly below the 52-week range section, helping them understand whether the stock has generally moved up, down, or sideways over the last month.

**Why this priority**: This is the primary value of the feature. Without a readable default chart, the new section does not improve the stock detail page.

**Independent Test**: Can be fully tested by opening a stock detail page for a stock with price history and confirming the chart section appears below the 52-week range section with the one-month view selected by default.

**Acceptance Scenarios**:

1. **Given** a stock with price history in the past 30 days, **When** the investor opens `/stocks/[symbol]`, **Then** the page shows a one-month price history chart below the 52-week range section without changing any other stock detail sections.
2. **Given** a stock with at least one valid close price in the selected period, **When** the investor views the chart section, **Then** the section shows the plotted price trend, period low, period high, and the number of trading days represented.
3. **Given** a stock with missing close prices on some trading days in the selected period, **When** the investor views the chart, **Then** the missing days appear as gaps rather than as zero values or invented prices.

---

### User Story 2 - Change the Time Range Without Disrupting the Page (Priority: P2)

An investor compares short-term and long-term price movement by switching between 1 week, 1 month, 6 months, and 1 year, while the rest of the stock detail page remains visually stable.

**Why this priority**: Range switching is the key interaction for the feature and must preserve the focused, low-friction detail-page experience defined by the constitution.

**Independent Test**: Can be fully tested by opening a stock detail page, switching between each available range, and confirming the chart updates to the selected period while the rest of the page remains unchanged.

**Acceptance Scenarios**:

1. **Given** the investor is viewing the default one-month chart, **When** they select `1W`, `6M`, or `1Y`, **Then** the chart updates to that period and the selected range remains visible in the URL.
2. **Given** the investor refreshes or shares a stock detail URL that includes a supported range value, **When** the page loads, **Then** the chart opens in that same selected range.
3. **Given** the investor changes the chart range, **When** the updated chart loads, **Then** unrelated stock detail sections do not visually reload or shift.

---

### User Story 3 - Understand When History Is Unavailable (Priority: P3)

An investor sees a clear fallback message when the selected time range has no price history or only missing close values, so the page remains trustworthy instead of showing an empty or misleading chart.

**Why this priority**: Financial pages lose credibility quickly when unavailable data is shown as zeroes or broken visuals. A clear fallback is safer than a misleading chart.

**Independent Test**: Can be fully tested by opening a stock detail page for a stock and period with no usable close-price history and confirming the chart area shows a clear empty-state message instead of a plotted line.

**Acceptance Scenarios**:

1. **Given** the selected range has no price rows, **When** the investor views the chart section, **Then** the section shows the message "No price history available for this period."
2. **Given** the selected range has rows but every close price is unavailable, **When** the investor views the chart section, **Then** the section shows the same empty-state message instead of a chart, period low, or period high.

### Edge Cases

- An unsupported `range` value is provided in the URL, so the chart must fall back to the default one-month view.
- The selected range contains price rows but only some valid close prices, so the chart must plot only valid values and preserve gaps for missing ones.
- The selected range contains exactly one valid close price, so the chart must still show the single available point and derive period low and high from that same valid price.
- The selected range contains no rows or only missing close prices, so the chart must show the empty-state message and omit the price summary row.
- The selected range includes non-trading days, so the chart must reflect only stored trading-day records and count only returned trading days in the footer.
- Changing the range must not alter the content, scroll position, or loading state of unrelated sections above or below the chart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add a stock price history section directly below the existing 52-week range section on `/stocks/[symbol]`.
- **FR-002**: The system MUST keep all existing stock detail sections unchanged outside the new price history section.
- **FR-003**: The system MUST support a `range` URL parameter for the stock detail page with the values `1w`, `1m`, `6m`, and `1y`.
- **FR-004**: The system MUST default to the `1m` range when the `range` parameter is missing, empty, or unsupported.
- **FR-005**: The system MUST provide visible range controls in this order: `1W`, `1M`, `6M`, `1Y`.
- **FR-006**: The system MUST update the selected range in the URL when the user changes the chart range so the selected view can be refreshed, bookmarked, and shared.
- **FR-007**: The system MUST show daily close-price history for the selected stock and selected range using stored trading-day records only.
- **FR-008**: The system MUST interpret supported ranges as the most recent 7, 30, 180, or 365 calendar days respectively.
- **FR-009**: The system MUST present price points in ascending trade-date order from oldest to newest within the selected period.
- **FR-010**: The system MUST preserve missing close prices as unavailable values rather than filtering them out, converting them to zero, or interpolating replacement prices.
- **FR-011**: The system MUST display visible gaps in the plotted history wherever close prices are unavailable.
- **FR-012**: The system MUST never show volume data in this chart section, including the chart itself, summary rows, or tooltip content.
- **FR-013**: The system MUST show a tooltip for valid plotted prices that includes the trading date and the close price formatted in Philippine pesos to two decimal places.
- **FR-014**: The system MUST show 4 to 5 readable date labels across the selected period to help investors understand the time span without clutter.
- **FR-015**: The system MUST hide the vertical price axis labels and use the chart primarily as a trend view rather than a dense analytical tool.
- **FR-016**: The system MUST show a period-low and period-high summary row when the selected period contains at least one valid close price.
- **FR-017**: The system MUST derive period low and period high from the minimum and maximum of valid close prices only and MUST ignore unavailable close values in those calculations.
- **FR-018**: The system MUST show a footer that states the number of trading days returned for the selected period and that the chart reflects close price only.
- **FR-019**: The system MUST show the empty-state message "No price history available for this period." when the selected period has no rows or no valid close prices.
- **FR-020**: The system MUST omit the plotted chart and price-summary row when the empty state is shown.
- **FR-021**: Changing the selected range MUST refresh only the chart section while leaving unrelated stock detail content stable on the page.
- **FR-022**: The feature MUST remain scoped to close-price history only; candlesticks, intraday views, annotations, volume displays, additional axis labels, and other chart types remain out of scope for this specification.

### Key Entities *(include if feature involves data)*

- **Chart Range Selection**: The user-selected time window for the stock price chart, limited to one week, one month, six months, or one year, and represented in the page URL.
- **Price History Point**: A single trading-day record for the selected stock that includes the trade date and the close price, which may be unavailable.
- **Period Summary**: The investor-facing summary of the selected range that includes the period low, period high, and trading-day count based on valid close-price history.

### Assumptions

- The stock detail page already provides the required delayed-data disclosure elsewhere on the page, so this feature does not add a second delay notice inside the chart section.
- The chart introduces no new investment jargon that requires an additional tap-to-expand explanation beyond the labels already present on the stock detail page.
- The selected range applies only to the new price history section and does not change the data shown in the header, today's trading section, 52-week range section, or any future stock detail sections.
- Trading-day count in the footer reflects the number of stored rows returned for the selected period, even when some close prices are unavailable.
- Period low and period high are shown only when at least one valid close price exists for the selected period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual review on a 375px-wide viewport, 100% of tested stock detail pages show the new price history section directly below the 52-week range section without changing the content order of other sections.
- **SC-002**: In manual review, 100% of tested stock detail pages open with the one-month range selected when no `range` parameter is supplied.
- **SC-003**: In manual review, users can switch between all four supported ranges and see the selected view reflected in the URL in 100% of tested cases.
- **SC-004**: In manual review, changing the chart range leaves unrelated stock detail sections visually stable in 100% of tested cases.
- **SC-005**: In manual review, 100% of tested ranges with partial missing close-price data show visible gaps instead of zero-filled or continuous replacement values.
- **SC-006**: In manual review, 100% of tested ranges with no usable close-price data show the empty-state message instead of a misleading chart.
