# Tasks: PSE Edge Backfill Foundation

**Input**: Design documents from `/specs/002-pse-edge-backfill/`
**Prerequisites**: [plan.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/plan.md),
[spec.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/spec.md),
[research.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/research.md),
[data-model.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/data-model.md),
[contracts/pse-edge-dividends.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/contracts/pse-edge-dividends.md),
[contracts/backfill-workflows.md](/Users/matthewyasul/personal/code/palago/specs/002-pse-edge-backfill/contracts/backfill-workflows.md)

**Tests**: Required only for Phase 0a via Vitest. Schema work is verified by
`drizzle-kit generate` output review. Script phases are verified manually by
Matt with `verify-backfill.ts`.

**Organization**: Tasks follow the user-mandated strict phase order while still
mapping story work with `[US1]`, `[US2]`, and `[US3]` labels where applicable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label for story-phase tasks only
- Every implementation task includes exact file paths, commit message, and
  manual run command where requested

## Phase 0a: PSE Edge Dividends Extension

**Purpose**: Extend `@palago/pse-edge` with `getDividends()` and a fixture-backed
hard-gate test without changing `IPSEDataProvider`.

- [x] T001 Add `DividendEntry` to `packages/pse-edge/src/types.ts`
- [x] T002 Add the `DividendEntry` Zod schema to `packages/pse-edge/src/schemas.ts`
- [x] T003 [P] Create the dividends parser in `packages/pse-edge/src/parsers/dividends.ts` using `packages/pse-data/dividends.html` as the fixture reference
- [x] T004 [P] Add the fixture-backed dividends parser test in `packages/pse-edge/tests/dividends.test.ts` using `packages/pse-data/dividends.html`
- [x] T005 Add `getDividends(edgeCmpyId)` to `packages/pse-edge/src/provider.ts` without modifying `packages/pse-edge/src/types.ts` `IPSEDataProvider`
- [x] T006 Export `DividendEntry` from `packages/pse-edge/src/index.ts`
- [x] T007 Run the hard gate `cd packages/pse-edge && npx vitest run` — all tests must pass, not just the dividends test, to confirm the getDividends addition did not break existing parser coverage

## Phase 0b: Terraform S3 Bucket

**Purpose**: Add the public logo bucket and upload permission required by the
company seed workflow.

- [x] T008 [P] Create `infrastructure/terraform/s3.tf` with the `palago-assets` bucket, public-access block, and `logos/*` read policy
- [x] T009 [P] Update `infrastructure/terraform/iam.tf` to add `s3:PutObject` on `arn:aws:s3:::palago-assets/logos/*`
- [x] T010 [P] Update `infrastructure/terraform/outputs.tf` to add the `assets_bucket_name` output

> [MANUAL] After Phase 0b, Matt runs: `aws-vault exec palago -- terraform apply`

## Phase 1: Schema Rewrite

**Purpose**: Replace the launch schema with the `companies` + rewritten `stocks`
model and generate the Drizzle migration for review.

- [x] T011 Rewrite `packages/db/schema.ts` as a full file replacement using the exact launch column names from `specs/002-pse-edge-backfill/data-model.md`
- [x] T012 Run `cd packages/db && npx drizzle-kit generate` to create the new migration SQL in `packages/db/migrations/`; show the full generated SQL output before proceeding — do not manually edit any file in `packages/db/migrations/`

> [MANUAL] After Phase 1, Matt stops for: drop tables in Supabase SQL editor,
> then `cd packages/db && npx drizzle-kit migrate`, then
> `cd packages/db && npx tsx scripts/apply-views.ts`

## Phase 2: User Story 1 - Seed the Canonical Market Directory (Priority: P1) 🎯 MVP

**Goal**: Create the company and stock seed script with S3 logo upload fallback
and idempotent upserts.

**Independent Test**: Matt can manually run the seed against an empty migrated
database and confirm companies and stocks are created without duplicates and
with fallback-safe logo URLs.

- [x] T013 [US1] Create `apps/ingestion/scripts/seed-companies.ts` with provider-driven company seeding, S3 logo upload fallback, structured logging, `onConflictDoUpdate`, commit message `feat(ingestion): add seed-companies backfill script`, and manual run `cd apps/ingestion && npx tsx scripts/seed-companies.ts`
  Note: Also updated `apps/ingestion/package.json` to declare `@aws-sdk/client-s3` required by the script.

> [MANUAL] After Phase 2, Matt runs:
> `cd apps/ingestion && npx tsx scripts/seed-companies.ts`

## Phase 3: User Story 2 - Enrich Stocks (Priority: P2)

**Goal**: Fill stock trading and capital-structure fields for active stocks with
provider identifiers.

**Independent Test**: Matt can manually run stock enrichment after seeding and
confirm active stocks with `edge_cmpy_id` receive updated stock-detail fields
without duplicate rows or failures on skipped records.

- [x] T014 [US2] Create `apps/ingestion/scripts/enrich-stocks.ts` with active-stock queries, 1-second throttling, structured logging, stock-detail upserts, commit message `feat(ingestion): add enrich-stocks backfill script`, and manual run `cd apps/ingestion && npx tsx scripts/enrich-stocks.ts`

> [MANUAL] After Phase 3, Matt runs:
> `cd apps/ingestion && npx tsx scripts/enrich-stocks.ts`

## Phase 4: User Story 3 - Backfill Launch-Ready Price History (Priority: P3)

**Goal**: Add the historical price backfill script with CLI range overrides,
date-range percent-change recomputation, and 52-week view refresh.

**Independent Test**: Matt can manually run the price backfill for a symbol or
date range and verify that daily prices are written once per trade date, volume
remains null, and derived updates run after inserts.

- [x] T015 [US3] Create `apps/ingestion/scripts/backfill-prices.ts` with `--symbol`, `--from`, and `--to` parsing via `process.argv`, default two-year-to-yesterday range, historical-price upserts, scoped `percent_change` recomputation, `REFRESH MATERIALIZED VIEW CONCURRENTLY stock_52_week`, commit message `feat(ingestion): add backfill-prices script`, and manual run `cd apps/ingestion && npx tsx scripts/backfill-prices.ts`

> [MANUAL] After Phase 4, Matt runs:
> `cd apps/ingestion && npx tsx scripts/backfill-prices.ts`

## Phase 5: User Story 2 - Backfill Dividends Continuation (Priority: P2)

**Goal**: Persist all PSE Edge dividend rows, including preferred-share rows,
for existing active stocks.

**Independent Test**: Matt can manually run dividend backfill after the seed and
confirm all dividend rows are stored with `security_type`, while stocks missing
`edge_cmpy_id` are skipped safely.

- [ ] T016 [US2] Create `apps/ingestion/scripts/backfill-dividends.ts` with all-row dividend ingestion, `security_type` preservation, `onConflictDoUpdate` on `(stock_id, ex_date)`, structured logging, commit message `feat(ingestion): add backfill-dividends script`, and manual run `cd apps/ingestion && npx tsx scripts/backfill-dividends.ts`

> [MANUAL] After Phase 5, Matt runs:
> `cd apps/ingestion && npx tsx scripts/backfill-dividends.ts`

## Phase 6: Verify Backfill

**Purpose**: Add the read-only verification script used to validate all prior
manual backfill runs.

- [ ] T017 Create `apps/ingestion/scripts/verify-backfill.ts` as a read-only verifier that prints counts, sample `JFC` rows, missing-price gaps, and null `company_id` gaps, exits `1` on failures and `0` when clean, commit message `feat(ingestion): add verify-backfill script`, and manual run `cd apps/ingestion && npx tsx scripts/verify-backfill.ts`

> [MANUAL] After Phase 6, Matt runs:
> `cd apps/ingestion && npx tsx scripts/verify-backfill.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

**Codex implementation order** (writing and committing scripts):
- **Phase 0a and Phase 0b**: May begin in parallel
- **Phase 1**: Starts only after both Phase 0a and Phase 0b are complete
- **Phase 2**: Starts only after Phase 1 schema task (T011, T012) is complete
- **Phases 3–6**: Codex implements scripts sequentially without waiting for
  Matt to run any script — all five scripts can be written and committed
  in one session

**Matt's execution order** (running scripts after Codex commits them):
- Run `seed-companies.ts` only after manual migration steps are complete
- Run `enrich-stocks.ts` only after `seed-companies.ts` has completed
- Run `backfill-prices.ts` only after `enrich-stocks.ts` has completed
- Run `backfill-dividends.ts` only after `backfill-prices.ts` has completed
- Run `verify-backfill.ts` only after `backfill-dividends.ts` has completed

### User Story Dependencies

- **US1** depends on all prerequisite phases and the migrated schema
- **US2** depends on US1 seeding first; its dividend continuation in Phase 5
  also depends on stock creation from US1
- **US3** depends on US1 seeding and enriched provider identifiers from US2

### Within Phase 0a

- `T001` before `T002`
- `T002` before `T003` and `T004`
- `T003` and `T004` can run in parallel
- `T005` depends on `T001` through `T004`
- `T006` depends on `T001`
- `T007` depends on `T003`, `T004`, `T005`, and `T006`

## Parallel Opportunities

- `T001` through `T007` can progress in parallel with `T008` through `T010`
- `T003` and `T004` can be developed in parallel after `T001` and `T002`
- `T008`, `T009`, and `T010` can be handled in parallel because they modify
  separate Terraform files

## Parallel Example

```bash
# Start the provider and Terraform prerequisite workstreams together:
Task: "Add DividendEntry to packages/pse-edge/src/types.ts"
Task: "Create infrastructure/terraform/s3.tf"

# After types and schema exist, split the dividends parser work:
Task: "Create packages/pse-edge/src/parsers/dividends.ts"
Task: "Add packages/pse-edge/tests/dividends.test.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 0a and Phase 0b
2. Complete Phase 1 and stop for Matt's manual migration steps
3. Complete Phase 2
4. **STOP and VALIDATE**: Matt runs `seed-companies.ts`

### Incremental Delivery

1. Prerequisites complete: provider dividends support + S3 bucket + schema
2. Deliver US1 with `seed-companies.ts`
3. Deliver US2 stock enrichment with `enrich-stocks.ts`
4. Deliver US3 historical price backfill with `backfill-prices.ts`
5. Finish US2 dividend storage with `backfill-dividends.ts`
6. Finish cross-cutting verification with `verify-backfill.ts`

## Notes

- Script tasks must be implemented and committed by Codex, but not run by
  Codex; Matt performs the manual commands between phases.
- After every completed task, immediately update
  `specs/002-pse-edge-backfill/tasks.md` from `[ ]` to `[x]`, add a one-line
  deviation note if implementation changed, and commit `tasks.md` with the same
  implementation commit.
- Phase 1 requires showing the generated Drizzle SQL for review before Matt runs
  the manual migration sequence.
