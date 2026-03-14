# Implementation Plan: PSE Edge Data Provider

**Branch**: `001-pse-edge-provider` | **Date**: 2026-03-15 | **Spec**: [spec.md](/Users/matthewyasul/personal/code/palago/specs/001-pse-edge-provider/spec.md)
**Input**: Feature specification from `/specs/001-pse-edge-provider/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Introduce a shared `@palago/pse-edge` package that implements the existing
`IPSEDataProvider` contract for four public PSE Edge operations: listed-company
directory, stock detail snapshot, company profile, and historical prices. The
design uses stateless HTTP requests with polite throttling, Cheerio-based HTML
parsing, Zod-validated response shaping, and fixture-driven parser tests so the
same provider can be reused by ingestion jobs and the web app without live HTTP
calls during test runs.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 20  
**Primary Dependencies**: Cheerio, Zod, Vitest, native `fetch`, shared sleep utility pattern  
**Storage**: N/A for this feature; provider is read-only and returns typed data to callers  
**Testing**: Vitest unit tests with HTML fixtures from `packages/pse-data/` and no live HTTP calls  
**Target Platform**: Shared workspace package consumed by Node.js ingestion jobs and Next.js server runtime  
**Project Type**: Shared TypeScript library package in a Turborepo monorepo  
**Performance Goals**: Correctness-first parsing with at least 500ms between upstream requests; company-list pagination completes deterministically page by page; single-company detail calls remain bounded to the minimum required upstream requests  
**Constraints**: Public unauthenticated endpoints only; no headless browser; `Content-Type: application/x-www-form-urlencoded` for historical POSTs; `cmpy_id` and `security_id` remain strings; historical `VALUE` may arrive in scientific notation; invalid required fields throw explicit errors while optional invalid fields degrade to `null` or `undefined`  
**Scale/Scope**: One new shared package, four provider operations, parser utilities and schemas, and unit coverage for all four fixture-backed parsers; excludes dividends, market indices, S3 logo upload, Lambda job integration, and database writes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first mobile experience is preserved, including 375px behavior,
  Filipino-first labels where appropriate, minimum investment display, and the
  15-minute delayed-data disclaimer when relevant.
  Status: Pass. This feature is an internal provider library with no direct UI,
  but it explicitly supplies board lot, price, and company metadata needed for
  downstream beginner-first screens.
- Data sourcing is isolated to one provider per persisted table row, with any
  new external integration routed through an explicit provider boundary.
  Status: Pass. The plan introduces `@palago/pse-edge` as a dedicated provider
  package implementing `IPSEDataProvider` and keeps PSE Edge identifiers in
  provider-specific fields.
- Financial data uses `numeric`-safe storage and computation, and any schema
  changes are handled through Drizzle-generated migrations without manual edits
  to `migrations/`.
  Status: Pass. No schema changes are in scope; the provider returns numbers or
  nullable values and leaves DB-layer numeric persistence to callers.
- External responses are Zod-validated before writes, structured logging is
  included where ingestion or background processing is affected, and writes are
  designed to be idempotent.
  Status: Pass. Every provider response shape is Zod-validated before return.
  The package is read-only, so no write or ingestion-log behavior is added in
  this feature.
- UTC storage and `Asia/Manila` business-time handling are explicit for any
  date, trading-session, or schedule-sensitive behavior.
  Status: Pass. Provider outputs normalize source dates for caller use, and the
  design documents how historical and listing dates are parsed without relying
  on server-local time.
- Secrets and operational credentials are sourced from approved environment or
  AWS SSM paths only; no hardcoded secrets or committed state files are needed.
  Status: Pass. All endpoints are public and unauthenticated, so no secrets are
  introduced.

Post-design re-check:

- Pass. The design keeps the provider isolated under `packages/pse-edge`,
  preserves source-specific IDs as strings, avoids schema changes, validates
  every parsed response, and uses fixture-backed tests to verify date and
  numeric normalization rules before integration work begins.

## Project Structure

### Documentation (this feature)

```text
specs/001-pse-edge-provider/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pse-edge-provider.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── ingestion/
│   └── shared/
│       └── sleep.ts
└── web/
    └── package.json

packages/
├── pse-data/
│   ├── company_information.html
│   ├── search.html
│   └── stockData.html
├── pse-edge/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── provider.ts
│   │   ├── schemas.ts
│   │   ├── parsers/
│   │   │   ├── company-list.ts
│   │   │   ├── company-info.ts
│   │   │   ├── historical-prices.ts
│   │   │   └── stock-data.ts
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── numbers.ts
│   │       └── sleep.ts
│   └── tests/
│       ├── company-list.test.ts
│       ├── company-info.test.ts
│       ├── historical-prices.test.ts
│       └── stock-data.test.ts
└── types/
    └── src/
```

**Structure Decision**: Add a new shared package under `packages/pse-edge` so
both `apps/ingestion` and `apps/web` can consume one provider implementation.
Keep parsing logic split by endpoint, centralize normalization helpers, and use
fixture-driven tests colocated with the package.

## Complexity Tracking

No constitution violations or justified complexity exceptions were identified in
this planning phase.
