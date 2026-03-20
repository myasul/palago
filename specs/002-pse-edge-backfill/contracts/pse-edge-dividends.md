# Contract: PSE Edge Dividends Extension

## Purpose

Define the public class-level contract added to `PSEEdgeProvider` for dividend
scraping in this feature.

## Entry Point

- Class: `PSEEdgeProvider`
- Method: `getDividends(edgeCmpyId: string): Promise<DividendEntry[]>`
- Endpoint: `GET /companyPage/dividends_and_rights_form.do?cmpy_id={id}`

## Input Contract

- `edgeCmpyId`: required string PSE Edge company identifier

## Output Contract

The method returns zero or more `DividendEntry` records. Empty arrays are valid.

### DividendEntry

- `securityType`: string
- `dividendType`: string
- `dividendRate`: number | null
- `exDate`: Date | null
- `recordDate`: Date | null
- `paymentDate`: Date | null

## Parsing Rules

- Parse every dividend information row returned by the source table.
- Preserve all security types exactly as represented by the source, including
  `COMMON`, `JFCPB`, and `GLOPA`.
- Extract the first numeric token from the dividend-rate text.
  Examples:
  - `Php2.11` -> `2.11`
  - `1.33` -> `1.33`
  - `Php10.60125 per share for...` -> `10.60125`
- Optional missing or malformed fields degrade to `null`.
- Required row shape failures raise explicit parsing errors after schema
  validation.

## Validation Rules

- Output rows are validated with Zod before returning.
- The method is an extension on `PSEEdgeProvider` only and does not modify the
  shared `IPSEDataProvider` interface.

## Test Contract

- Fixture-backed Vitest coverage uses `packages/pse-data/dividends.html`.
- Tests do not perform live network calls.
