# Implementation Plan: PSE Edge Backfill Foundation

**Branch**: `002-pse-edge-backfill` | **Date**: 2026-03-15 | **Spec**:
[spec.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/spec.md)
**Input**: Feature specification from
`/specs/002-pse-edge-backfill/spec.md`

## Summary

Extend the existing PSE Edge provider with dividend scraping, add the S3 asset
bucket needed for logo storage, rewrite the launch schema around separate
`companies` and `stocks` tables, and add local-only ingestion backfill scripts
that seed company identity, enrich stock metadata, backfill dividends, and
backfill historical prices using idempotent upserts and structured logging.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 20  
**Primary Dependencies**: Drizzle ORM, PostgreSQL, `@palago/pse-edge`,
AWS SDK for S3 uploads, Zod, Vitest, native `fetch`, Terraform AWS provider  
**Storage**: Supabase PostgreSQL, S3 bucket `palago-assets` for company logos  
**Testing**: Vitest for the new dividends parser/provider extension; manual
verification via `drizzle-kit generate`, manual migration/apply-views, and the
read-only `verify-backfill.ts` script  
**Target Platform**: Local operator scripts, shared package code, and AWS
infrastructure in `ap-southeast-1`  
**Project Type**: Monorepo with shared library, database package, ingestion
scripts, and Terraform infrastructure  
**Performance Goals**: Complete a full initial seed/backfill safely for the
full PSE roster with polite provider throttling and rerunnable writes  
**Constraints**: Minimum 500ms between PSE Edge requests in provider code; 1s
between per-stock and per-company backfill iterations; no float storage for
financial data; no Lambda implementation; no live script execution in this plan;
Drizzle-generated migrations only; all writes use `onConflictDoUpdate`  
**Scale/Scope**: One pre-launch schema rewrite, one provider extension, one S3
bucket addition, and five local operational scripts covering roughly the full
listed PSE universe

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first mobile experience remains unaffected by this feature directly.
  The plan preserves future UX obligations by storing canonical company data,
  stock metadata, common-share dividend context, and S3-hosted logos needed by
  mobile investor screens.
- Data sourcing remains isolated to PSE Edge for `companies`, `stocks`,
  `dividends`, and initial `daily_prices` backfill rows created by this feature.
  The provider boundary remains `PSEEdgeProvider`; `getDividends()` is added as
  a class extension without broadening `IPSEDataProvider`.
- Financial data remains `numeric`-safe in PostgreSQL. The schema rewrite uses
  Drizzle definitions only, and migration generation is delegated to
  `drizzle-kit generate` without manual edits in `packages/db/migrations/`.
- External responses remain Zod-validated before writes. Ingestion/backfill
  scripts use structured logging via `apps/ingestion/shared/logger.ts` and
  idempotent upserts to support safe reruns.
- UTC storage and Philippine-market date interpretation remain explicit. Source
  dates are normalized before persistence, and price backfills keep provider
  daily rows aligned to trading dates without using server-local time.
- Secrets remain outside source control. S3 uploads and database access rely on
  environment-backed credentials, while Terraform apply and DB migration steps
  are manual operator actions outside this plan.

## Project Structure

### Documentation (this feature)

```text
specs/002-pse-edge-backfill/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── backfill-workflows.md
│   └── pse-edge-dividends.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── ingestion/
│   ├── package.json
│   ├── scripts/
│   │   ├── seed-companies.ts
│   │   ├── enrich-stocks.ts
│   │   ├── backfill-prices.ts
│   │   ├── backfill-dividends.ts
│   │   └── verify-backfill.ts
│   └── shared/
│       ├── db.ts
│       ├── logger.ts
│       ├── sleep.ts
│       └── utils/
packages/
├── db/
│   ├── schema.ts
│   ├── migrations/
│   └── scripts/
│       ├── apply-views.ts
│       └── sql/create_52_week_view.sql
├── pse-data/
│   └── dividends.html
└── pse-edge/
    ├── src/
    │   ├── index.ts
    │   ├── provider.ts
    │   ├── schemas.ts
    │   ├── parsers/
    │   └── types.ts
    └── tests/
infrastructure/
└── terraform/
    ├── iam.tf
    ├── outputs.tf
    └── s3.tf
```

**Structure Decision**: Keep the feature split across the existing monorepo
boundaries: provider extension in `packages/pse-edge`, schema ownership in
`packages/db`, operator backfill flows in `apps/ingestion/scripts`, and asset
bucket changes in `infrastructure/terraform`.

## Phase 0 Research

[research.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/research.md)
records the implementation decisions for the provider extension, schema rewrite,
logo asset handling, CLI defaults, and rerunnable backfill behavior. No
unresolved clarifications remain.

## Phase 1 Design

[data-model.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/data-model.md)
defines the rewritten launch schema, provider-to-database field mappings,
validation rules, and script state transitions.

Contracts:

- [pse-edge-dividends.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/contracts/pse-edge-dividends.md)
- [backfill-workflows.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/contracts/backfill-workflows.md)

[quickstart.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/quickstart.md)
captures the manual operator flow for migration generation, Terraform apply,
local script execution order, and verification.

## Post-Design Constitution Check

- Provider boundary remains explicit: PSE Edge continues to be the only source
  for the seeded `companies`, `stocks`, `dividends`, and initial `daily_prices`
  rows in this feature.
- Schema design keeps financial columns numeric-only and uses separate company
  and stock tables with provider identifiers in nullable dedicated fields.
- The design keeps preferred-share dividends stored but not user-visible by
  preserving raw `security_type` while explicitly documenting common-share
  filtering for later user-facing work.
- Backfill scripts remain observable and idempotent, with structured logs,
  warning-level degradation for recoverable failures, and explicit skip rules
  for rows missing provider identifiers.
- Time handling is explicit: CLI inputs use calendar dates, provider requests
  transform to PSE Edge formats, stored timestamps remain UTC, and trading-date
  records are persisted as dates rather than server-local datetimes.
- No constitutional gate violations were introduced by the design.

## Complexity Tracking

No constitution exceptions or justified complexity violations are required for
this plan.
