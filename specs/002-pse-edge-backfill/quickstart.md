# Quickstart: PSE Edge Backfill Foundation

## Purpose

Run the pre-launch schema rewrite and initial PSE Edge backfill in the required
manual order.

## Prerequisites

- Valid database environment variables for `packages/db` and `apps/ingestion`
- AWS credentials available through the project's approved local workflow
- Existing `@palago/pse-edge` package from feature `001-pse-edge-provider`

## Order of Operations

1. Implement and verify the PSE Edge `getDividends()` extension with its
   fixture-backed Vitest test.
2. Add the Terraform S3 asset bucket, IAM permission, and Terraform output.
3. Matt runs Terraform manually:

```bash
aws-vault exec palago -- terraform apply
```

4. Matt drops the pre-launch tables manually in Supabase SQL editor.
5. Rewrite `packages/db/schema.ts` and generate the Drizzle migration:

```bash
cd /Users/matthewyasul/personal/code/palago/packages/db
npx drizzle-kit generate
```

6. Matt applies the migration manually:

```bash
cd /Users/matthewyasul/personal/code/palago/packages/db
npx drizzle-kit migrate
```

7. Matt reapplies the materialized view manually:

```bash
cd /Users/matthewyasul/personal/code/palago/packages/db
npx tsx scripts/apply-views.ts
```

8. Run the local scripts in this order:

```bash
cd /Users/matthewyasul/personal/code/palago/apps/ingestion
npx tsx scripts/seed-companies.ts
npx tsx scripts/enrich-stocks.ts
npx tsx scripts/backfill-dividends.ts
npx tsx scripts/backfill-prices.ts
npx tsx scripts/verify-backfill.ts
```

## Optional Price Backfill Overrides

```bash
cd /Users/matthewyasul/personal/code/palago/apps/ingestion
npx tsx scripts/backfill-prices.ts --symbol JFC --from 2024-03-15 --to 2026-03-14
```

## Verification Expectations

- The dividends parser test passes against `packages/pse-data/dividends.html`.
- `drizzle-kit generate` produces the expected schema SQL for the rewrite.
- `verify-backfill.ts` reports counts, sample `JFC` rows, no unlinked stocks,
  and no active stocks with provider identifiers but zero daily prices.
- Logo failures, if any, appear as warnings and fall back to PSE Edge URLs
  without aborting the seed.
