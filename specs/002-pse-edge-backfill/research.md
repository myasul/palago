# Research: PSE Edge Backfill Foundation

## Decision 1: Extend `PSEEdgeProvider` with a class-only `getDividends()` method

**Decision**: Add `getDividends(edgeCmpyId: string): Promise<DividendEntry[]>`
to `PSEEdgeProvider` without changing `IPSEDataProvider`.

**Rationale**: The existing shared interface already models the four core
cross-consumer methods. Dividend scraping is needed only for this backfill
feature, and the user explicitly decided not to broaden the interface yet.

**Alternatives considered**:

- Add `getDividends()` to `IPSEDataProvider`: rejected because that would force
  a broader abstraction change without a current consumer need outside PSE Edge.
- Build a separate dividends-only client: rejected because it would split one
  provider's scraping behavior across multiple classes.

## Decision 2: Preserve PSE Edge as the single source for seeded launch rows

**Decision**: Seed `companies`, `stocks`, `dividends`, and the initial
historical `daily_prices` backfill from PSE Edge only in this feature.

**Rationale**: The constitution forbids mixing providers in the same row. This
feature is explicitly about seeding the launch database from the already-built
PSE Edge provider.

**Alternatives considered**:

- Mix Yahoo or EODHD during the initial backfill: rejected because that would
  violate the source-isolation rule for the rows touched by this feature.

## Decision 3: Store logos in S3 and keep a source URL fallback

**Decision**: Backfill company logos into `palago-assets/logos/{SYMBOL}.jpg`,
store the S3 URL when upload succeeds, and fall back to the original PSE Edge
logo URL when download or upload fails.

**Rationale**: The constitution requires project-hosted logos at runtime, but
the seed must remain resilient when individual logo assets fail.

**Alternatives considered**:

- Fail the entire company seed on one logo error: rejected because logo upload
  is recoverable and should not block canonical company creation.
- Hotlink PSE Edge logos permanently: rejected because runtime hotlinking is
  explicitly disallowed by the constitution.

## Decision 4: Perform a full schema rewrite for the pre-launch reset

**Decision**: Replace the current `stocks` shape with the new launch schema,
introduce a new `companies` table, add `dividends.security_type`, and keep the
other operational tables unchanged.

**Rationale**: The user explicitly decided that the environment is pre-launch
and can be reset cleanly, making a full rewrite clearer and lower risk than a
partial transition layer.

**Alternatives considered**:

- Preserve the old `stocks.total_shares` layout and patch around it: rejected
  because it conflicts with the new company/stock separation and `issued_shares`
  requirement.
- Hand-edit SQL migrations: rejected because Drizzle owns `migrations/`.

## Decision 5: Keep backfill execution local and operator-driven

**Decision**: Implement the backfills as `npx tsx` scripts in
`apps/ingestion/scripts/`, not as Lambda handlers.

**Rationale**: The user scoped Lambda work out of this feature and wants Matt to
run the migration, Terraform apply, and scripts manually in strict order.

**Alternatives considered**:

- Add scheduled or manual Lambda jobs now: rejected as out of scope.
- Hide verification inside ad hoc shell commands: rejected because a dedicated
  `verify-backfill.ts` script is easier to rerun and document.

## Decision 6: Use per-record warning degradation plus idempotent upserts

**Decision**: Scripts skip rows that lack the required provider identifiers,
warn on recoverable logo issues, and use `onConflictDoUpdate` for every write.

**Rationale**: The constitution requires idempotent ingestion and partial
success semantics where one bad record must not abort the whole run.

**Alternatives considered**:

- Abort the run on the first bad stock or logo: rejected because it reduces
  recoverability and slows launch data preparation.
- Use inserts only: rejected because reruns would create duplicates or require
  manual cleanup after interruptions.

## Decision 7: Verify schema by generation and data by read-only inspection

**Decision**: Treat `drizzle-kit generate` plus migration SQL review as the
schema verification step, require a fixture-backed Vitest test for the new
dividends parser, and rely on a read-only `verify-backfill.ts` script for
manual backfill validation.

**Rationale**: The user explicitly scoped automated tests to the dividends
parser and chose operator-run verification for the backfill scripts.

**Alternatives considered**:

- Add end-to-end automated tests for the backfill scripts: rejected because they
  would require database and cloud setup that the feature deliberately leaves to
  manual operator execution.

## Decision 8: Default historical backfill window to two years through yesterday

**Decision**: `backfill-prices.ts` defaults to a date range from two years
before the current date through yesterday, with optional `--symbol`, `--from`,
and `--to` overrides.

**Rationale**: This matches the user’s explicit requirement and gives the web
app a meaningful launch chart window without forcing a full-history run.

**Alternatives considered**:

- Backfill the entire available price history by default: rejected because it
  would make the first run slower and less predictable for initial seeding.
