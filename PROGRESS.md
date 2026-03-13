# PROGRESS

Last Updated: 2026-03-14

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

## ❌ Known Issues

- No ingestion Lambda jobs have been migrated to use the new shared utilities yet.
- `apps/ingestion` still needs real job implementations beyond the placeholder job.
- `fetchPSEHistorical()` uses Yahoo's chart endpoint directly because the installed
  `yahoo-finance2` package version no longer exposes a typed `historical()` API.

## 📋 Next Session

- Update the ingestion jobs to use `shared/db.ts`, `shared/logger.ts`, and the new client utilities.
- Add Zod-validated ingestion flows for quotes, historical prices, indices, dividends, and logs.
- Expand test coverage for the API clients and trading helpers.
- Add integration tests or dry-run scripts for the stock seed and SQL view scripts.
