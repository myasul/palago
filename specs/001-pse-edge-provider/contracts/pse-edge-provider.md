# Contract: PSE Edge Provider

## Purpose

Define the internal shared-library contract for `@palago/pse-edge`, the
`IPSEDataProvider` implementation consumed by `apps/ingestion` and `apps/web`.

## Provider Surface

### `getCompanyList(): Promise<ListedCompanyEntry[]>`

Returns all listed companies discoverable from the paginated public company
directory.

**Guarantees**:

- Aggregates results across all directory pages in one call.
- Extracts `edgeCmpyId` and `edgeSecId` from the published company row action.
- Fails the whole operation if any page request or required page parse fails.

### `getStockData(edgeCmpyId: string): Promise<StockDetailSnapshot>`

Returns the stock detail snapshot for the provided company identifier.

**Guarantees**:

- Uses the first published security option as the default security.
- Captures that default `securityId` for downstream historical requests.
- Returns normalized numeric values or `null` for optional missing fields.
- Throws an explicit error if the page structure or required identifiers cannot
  be parsed.

### `getCompanyInfo(edgeCmpyId: string): Promise<CompanyProfile>`

Returns the company information profile for the provided company identifier.

**Guarantees**:

- Produces a full absolute logo URL when a symbol is available.
- Returns empty optional contact and profile fields rather than failing when the
  source leaves them blank.
- Throws an explicit error only when required identity or page structure is not
  recoverable.

### `getHistoricalPrices(edgeCmpyId: string, edgeSecId: string, startDate: string, endDate: string): Promise<HistoricalPricePoint[]>`

Returns historical trading-day records for a company-security pair and an
inclusive date range formatted for the provider.

**Guarantees**:

- Accepts provider date inputs in `MM-DD-YYYY` format.
- Returns one record per source trading day in the requested range.
- Leaves `volume` as `null` for every returned row.
- Normalizes scientific-notation traded values into numeric output when
  parseable.

## Error Contract

- Network failures surface as explicit operation errors that name the failed
  endpoint.
- Required-structure parse failures surface as explicit validation errors.
- Optional field parse failures do not fail the full operation and instead
  return `null` or `undefined` per the response type.
- Company-list pagination does not allow partial success: any page failure fails
  the full call.

## Throttling Contract

- Every upstream request made by the provider honors a minimum 500ms delay.
- Callers are not responsible for implementing their own polite scraping delay
  to satisfy the provider contract.

## Testing Contract

- All four parser paths are verified through fixture-backed Vitest unit tests.
- Tests do not call live PSE Edge endpoints.
