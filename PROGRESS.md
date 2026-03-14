# PROGRESS

Last Updated: 2026-03-15

## ✅ Completed

- Added ingestion shared utilities in `apps/ingestion/shared/`:
  `db.ts`, `logger.ts`, `sleep.ts`, `clients/yahoo.ts`,
  `clients/eodhd.ts`, `utils/holidays.ts`, and `utils/trading.ts`.
- Added unit tests for `apps/ingestion/shared/utils/holidays.ts`.
- Verified `cd apps/ingestion && npx vitest run` passes with 5/5 tests.
- Verified `npm run build --workspace @palago/ingestion` passes.
- Verified full workspace `npm run build` passes.
- Fixed the `packages/db` source-tree emit issue by splitting DB TypeScript config
  into a non-emitting `tsconfig.json` for tooling and a dedicated
  `tsconfig.build.json` for package builds.
- Verified `npm run build --workspace @palago/db` and
  `cd packages/db && npx drizzle-kit generate` no longer create `.js`, `.d.ts`,
  or source map files beside `packages/db/*.ts` and `packages/db/src/*.ts`.
- Added `apps/ingestion/jobs/backfill.ts` as a local `npx tsx` backfill script
  for Yahoo historical daily prices with CLI date/symbol filters, safe upserts,
  date-scoped `percent_change` recalculation, and 52-week materialized view refresh.
- Verified `cd apps/ingestion && npx vitest run` still passes with 5/5 tests after
  the backfill script changes.
- Verified `npm run build --workspace @palago/ingestion` passes after the backfill
  script changes.
- Verified full workspace `npm run build` passes after the backfill script changes.
- Fixed `npx tsx ./backfill.ts` resolution from `apps/ingestion/jobs/` by adding
  `apps/ingestion/jobs/tsconfig.json` so `tsx` resolves `./backfill.ts` relative
  to the jobs directory instead of `apps/ingestion/`.
- Simplified backfill execution by removing the extra jobs-level TypeScript config
  and introducing canonical npm scripts:
  `npm run backfill -- --symbol JFC --from 2026-01-01 --to 2026-01-31`.
- Fixed `DATABASE_URL is not set` during local backfill runs by replacing the DB
  package's hardcoded relative `.env` path logic with package-root discovery that
  works from both source files and compiled `dist/` files.
- Adopted the initial project constitution in
  `.specify/memory/constitution.md` with concrete governance for beginner-first
  mobile UX, source isolation, numeric precision, validated ingestion, and
  Philippine market-time handling.
- Updated `.specify/templates/plan-template.md`,
  `.specify/templates/spec-template.md`, and
  `.specify/templates/tasks-template.md` so planning artifacts enforce the new
  constitution gates and compliance tasks.
- Created the feature spec for PSE Edge provider work at
  `specs/001-pse-edge-provider/spec.md` and added a completed specification
  quality checklist at `specs/001-pse-edge-provider/checklists/requirements.md`.
- Generated the planning artifacts for the PSE Edge provider feature:
  `specs/001-pse-edge-provider/plan.md`, `research.md`, `data-model.md`,
  `contracts/pse-edge-provider.md`, and `quickstart.md`.
- Generated `specs/001-pse-edge-provider/tasks.md` with ordered implementation
  work for the shared package, parser fixtures, provider methods, workspace
  wiring, and final Vitest verification.
- Scaffolded `@palago/pse-edge` for Phase 1 setup with
  `packages/pse-edge/package.json`, `packages/pse-edge/tsconfig.json`, and
  `packages/pse-edge/src/index.ts`, and marked tasks `T001` through `T003`
  complete in `specs/001-pse-edge-provider/tasks.md`.
- Completed Phase 2 foundational work for `@palago/pse-edge` by adding
  `types.ts`, shared normalization helpers, Zod schemas, four endpoint parsers,
  and four fixture-backed Vitest parser test files.
- Verified `cd packages/pse-edge && npx vitest run` passes with 4/4 test files
  and 8/8 tests.
- Verified `npm run type-check --workspace @palago/pse-edge` passes.

## ❌ Known Issues

- No ingestion Lambda jobs have been migrated to use the new shared utilities yet.
- `apps/ingestion` still needs real job implementations beyond the placeholder job.
- `fetchPSEHistorical()` uses Yahoo's chart endpoint directly because the installed
  `yahoo-finance2` package version no longer exposes a typed `historical()` API.
- `apps/ingestion/jobs/backfill.ts` was not executed against a live database in this
  session, so the end-to-end DB write path and Yahoo API runtime behavior were not
  exercised here.
- Full `tsx` runtime execution could not be completed inside this sandbox because
  `tsx` failed to open its IPC socket under `/var/folders/...` with `EPERM`.
- `.specify/templates/commands/` does not exist in this repository, so there
  were no command templates to align with the constitution during this session.
- `.specify/scripts/bash/create-new-feature.sh` failed to create the feature
  branch automatically; the branch was created manually as a fallback and the
  expected spec directory was created by hand.

## 📋 Next Session

- Update the ingestion jobs to use `shared/db.ts`, `shared/logger.ts`, and the new client utilities.
- Add Zod-validated ingestion flows for quotes, historical prices, indices, dividends, and logs.
- Expand test coverage for the API clients and trading helpers.
- Add integration tests or dry-run scripts for the stock seed and SQL view scripts.
- Add a safe dry-run or smoke-test path for the local backfill script.
- Create `.specify/templates/commands/` guidance later only if the project
  starts using command-specific Specify templates.
- Investigate why `.specify/scripts/bash/create-new-feature.sh` could not create
  the feature branch in this environment and decide whether the script or local
  git setup needs adjustment.
- Implement `@palago/pse-edge` per the new plan and add fixture-backed parser
  tests for company list, stock data, company info, and historical prices.
- Continue `001-pse-edge-provider` with Phase 3 provider-method work starting
  at `T016` for paginated company-list fetching in `packages/pse-edge/src/provider.ts`.
