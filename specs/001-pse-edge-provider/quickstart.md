# Quickstart: PSE Edge Data Provider

## Goal

Implement and verify the shared `@palago/pse-edge` package so both ingestion and
web consumers can use one validated provider contract for public PSE Edge data.

## Prerequisites

- Node.js 20 and npm 10+
- Existing monorepo dependencies installed
- Feature branch `001-pse-edge-provider` checked out

## Implementation Steps

1. Create `packages/pse-edge/` with a standard workspace package structure,
   including `package.json`, TypeScript config, `src/`, and `tests/`.
2. Add the `IPSEDataProvider` type contract in
   `packages/pse-edge/src/types.ts` if it is not already present, or align the
   provider implementation to the existing interface if it already exists.
3. Add endpoint-specific parser modules for company list, stock detail, company
   profile, and historical prices.
4. Add shared normalization helpers for numeric strings, date parsing, absolute
   logo URL creation, and polite request throttling.
5. Implement a request wrapper that enforces the 500ms minimum interval between
   upstream calls and handles form-encoded POST bodies for historical requests.
6. Validate every parsed response with Zod before returning it from the public
   provider methods.
7. Add Vitest unit tests for all four parser flows using fixtures from
   `packages/pse-data/`.
8. Export the provider through `packages/pse-edge/src/index.ts` and wire the new
   package into the workspace dependencies of the consumers that need it.

## Verification

1. Run the package tests and confirm all parser fixtures pass.
2. Run package type-check/build validation for the new workspace package.
3. Run workspace type-check/build validation to confirm both consumers can
   import the shared package cleanly.
4. Manually inspect one sample result per operation in tests to confirm:
   - Company list includes `edgeCmpyId` and `edgeSecId`
   - Stock detail uses the first published security
   - Company profile returns an absolute logo URL
   - Historical prices keep `volume` empty and normalize scientific-notation values

## Expected Deliverables

- New workspace package `@palago/pse-edge`
- One provider implementation matching `IPSEDataProvider`
- Four fixture-backed parser test files
- Consumer-ready exports for ingestion and web use
