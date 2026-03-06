# AGENT.md — palago.ph

## Project Overview

**palago.ph** is a mobile-first Philippine Stock Exchange (PSE) information website for beginner Filipino investors. "Palago" means "to make something grow" in Filipino — an action word encouraging Filipinos to make their money work for them.

The goal is to democratise PSE stock data: plain-language explanations, Tagalog-friendly UI, and accessible financial information for people who have never invested before.

---

## Monorepo Structure

```
palago/
  apps/
    web/           → Next.js 14 App Router (frontend + API routes)
    ingestion/     → Node.js 20 AWS Lambda jobs (data pipeline)
  packages/
    db/            → Drizzle ORM schema, client, migrations, seed scripts
    types/         → Shared TypeScript interfaces across all apps
    config/        → Shared ESLint and TypeScript config
  infrastructure/
    terraform/     → All AWS infrastructure as code
  .github/
    workflows/     → CI and Lambda auto-deploy workflows
```

**Package names:** `@palago/db`, `@palago/types`, `@palago/config`

---

## Tech Stack

| Category | Tool |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (mobile-first) |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| ORM | Drizzle ORM |
| Database | PostgreSQL via Supabase (MVP) |
| DB Driver | `postgres` (pg) |
| State | useState + Zustand (watchlist only, when needed) |
| Validation | Zod (all external API responses before DB writes) |
| Date handling | date-fns + date-fns-tz (always use Asia/Manila timezone) |
| Data source (free) | yahoo-finance2 (PSE format: `SYMBOL.PS`) |
| Data source (paid) | EODHD API ($19.99/mo, for dividends + ticker list) |
| Infrastructure | AWS Lambda + EventBridge + SSM Parameter Store |
| IaC | Terraform (ap-southeast-1 region — Singapore) |
| Hosting | Vercel (web app) |
| Testing | Vitest (unit) + Testing Library (components) + Playwright (E2E) |
| CI/CD | GitHub Actions |

---

## Database Schema

All tables live in Supabase (PostgreSQL). Never use `float` for prices — always `numeric`.

### `stocks`
Static company reference table. ~300 rows. Changes rarely.
- `id`, `symbol` (unique), `name`, `sector`, `subsector`
- `description`, `total_shares`, `listing_date`
- `is_blue_chip` (boolean — PSEi top 30), `is_active` (false = delisted)
- `website_url`, `logo_url`, `created_at`, `updated_at`

### `daily_prices`
Historical EOD prices. One row per stock per trading day. Permanent record — never delete.
- `id`, `stock_id` (FK → stocks), `trade_date`
- `open_price`, `high_price`, `low_price`, `close_price`
- `volume`, `value`, `percent_change`, `net_foreign`
- Unique constraint on `(stock_id, trade_date)`
- Indexes on `(stock_id, trade_date DESC)` and `(trade_date DESC)`

### `intraday_snapshots`
Live price snapshots during market hours. Rolling 7-day window — delete anything older nightly.
- `id`, `stock_id` (FK → stocks), `snapshot_time`
- `current_price`, `volume`, `percent_change`, `bid_price`, `ask_price`
- Unique constraint on `(stock_id, snapshot_time)`

### `dividends`
Dividend declarations. Source: EODHD API. Event-driven — not every stock has one.
- `id`, `stock_id` (FK → stocks), `dividend_type` ('cash' or 'stock')
- `amount_per_share`, `declaration_date`, `ex_date`, `record_date`, `payment_date`
- `fiscal_year`

### `market_indices`
PSEi and 6 sector index daily values. Source: Yahoo Finance.
- `id`, `index_name`, `trade_date`
- `open_value`, `close_value`, `high_value`, `low_value`, `percent_change`, `volume`
- Unique constraint on `(index_name, trade_date)`
- Index names: `PSEi`, `Financials`, `Industrials`, `Holding Firms`, `Property`, `Services`, `Mining & Oil`

### `ingestion_logs`
Every Lambda job writes one row per run. Non-negotiable for all jobs.
- `id`, `job_name`, `status` ('running' | 'success' | 'partial' | 'failed')
- `records_fetched`, `records_written`, `error_message`
- `triggered_by` ('scheduler' | 'manual' | 'backfill')
- `started_at`, `completed_at`, `duration_ms`

### `stock_52_week` (materialized view)
Pre-computed 52-week high/low per stock. Derived from `daily_prices`. Refreshed nightly.
- `stock_id`, `high_52w`, `low_52w`, `as_of_date`
- Refresh after every `eod-prices` job: `REFRESH MATERIALIZED VIEW CONCURRENTLY stock_52_week`

---

## Data Sources

| Table | Source | Job | Frequency |
|---|---|---|---|
| `stocks` | PSE Edge CSV (seed) + EODHD (ongoing) | `seed-stocks` / `sync-stock-list` | Once + Weekly |
| `daily_prices` | Yahoo Finance | `eod-prices` + `backfill-all` | Daily + Once |
| `intraday_snapshots` | Yahoo Finance | `intraday-snapshot` | Every 15 min |
| `dividends` | EODHD | `sync-dividends` | Weekly (batched) |
| `market_indices` | Yahoo Finance | `sync-indices` | Daily |
| `ingestion_logs` | Internal | All jobs | Every run |

**One source per table. Never mix sources within the same table.**

---

## Lambda Jobs

All jobs in `apps/ingestion/jobs/`. All jobs must:
1. Call `startLog(jobName)` at the start
2. Use `isTrading(date)` from `shared/holidays.ts` to skip non-trading days
3. Validate all external API responses with Zod before any DB write
4. Handle per-record failures gracefully — one bad stock must not abort the whole job
5. Call `completeLog(id, status, fetched, written, error?)` at the end
6. Export handler as `export const handler = async (event: any) => {}`

| Job | Handler | Schedule (UTC) | Timeout |
|---|---|---|---|
| `intraday-snapshot` | Every 15 min during market hours | `*/15 1-7 ? * MON-FRI *` | 120s |
| `eod-prices` | Final prices after market close | `0 8 ? * MON-FRI *` | 300s |
| `sync-indices` | PSEi + sector index values | `15 8 ? * MON-FRI *` | 120s |
| `sync-dividends` | Rotating batch of 15 stocks/day | `0 0 ? * SUN *` | 300s |
| `sync-stock-list` | New IPOs and delistings | `0 1 ? * SUN *` | 120s |
| `backfill-all` | One-time historical seed | Manual / local only | N/A |

**PSE market hours:** 9:30 AM – 3:30 PM Philippine time (UTC+8) = 1:30 AM – 7:30 AM UTC

**Yahoo Finance PSE ticker format:** append `.PS` — e.g. `BDO.PS`, `ALI.PS`, `JFC.PS`

**EODHD free tier:** 20 API calls/day. `sync-dividends` processes 15 stocks/day to stay within limits.

---

## Shared Ingestion Utilities

All in `apps/ingestion/shared/`:

- **`logger.ts`** — `startLog()` and `completeLog()` functions
- **`yahoo.ts`** — `fetchPSEQuote()`, `fetchAllPSEQuotes()`, `fetchPSEHistorical()` with Zod validation
- **`eodhd.ts`** — `fetchEodhdTickers()`, `fetchEodhdDividends()`
- **`holidays.ts`** — `PSE_HOLIDAYS_2025` array, `isTrading(date): boolean`
- **`sleep.ts`** — `sleep(ms): Promise<void>`

---

## API Routes

All in `apps/web/app/api/`. Each route reads from the DB only — never directly from Yahoo or EODHD.

### `GET /api/dashboard`
Runs all queries in parallel via `Promise.all`. Returns one JSON payload:
```
pseIndex, sectorPerformance, topGainers, topLosers, mostActive, blueChips, lastUpdated, marketStatus
```

### `GET /api/stocks/[symbol]`
Returns: company info, latest price, OHLC, volume, market cap (computed), 52-week high/low, dividend history, 1 year of daily prices for chart. Returns 404 if symbol not found.

### `GET /api/lists/[type]`
Types: `top-gainers`, `top-losers`, `most-active`, `blue-chips`
Returns paginated list (50 per page). Accepts `?page=` and `?sector=` query params.

---

## Frontend Pages

Mobile-first. Test at 375px width (iPhone SE — most common budget phone size in PH).

### Page 1: Dashboard `/`
PSEi index card → Sector grid (6 sectors) → Top Gainers → Top Losers → Most Active → Blue Chips
Each list section shows 10 items with a "See All" link to Page 3.

### Page 2: Stock Detail `/stocks/[symbol]`
Price hero → OHLC row → Stats grid → Price chart (1W/1M/3M/6M/1Y/5Y toggle) → 52-week range bar → Dividend section → Company description
**Add tooltips for every financial term** — explain in plain English or Tagalog (e.g. ex-date: "Bilhin bago ang petsang ito para makatanggap ng dibidendo").

### Page 3: Expanded List `/lists/[type]`
Full sortable table. Columns: Rank, Symbol, Name, Sector, Price, Change %, Volume.
Pagination (50/page). Sector filter dropdown.

---

## Key Conventions

**Never hardcode credentials.** Database URL and API keys are always read from `process.env`. In AWS, they are stored in SSM Parameter Store (`/palago/prod/DATABASE_URL`, `/palago/prod/EODHD_API_KEY`).

**Upserts over inserts.** All ingestion jobs use `onConflictDoUpdate` — safe to re-run without creating duplicates.

**Compute, don't store where possible.** `percent_change` is computed from price data. `market_cap` is `close_price × total_shares` computed at query time. `52_week_view` is a materialized view, not a column.

**Server Components first.** Use Next.js Server Components for all data fetching. Client Components only when you need interactivity (chart toggles, tooltips). This ensures pages are pre-rendered server-side before reaching the user's mobile device.

**Philippine timezone everywhere.** Always use `Asia/Manila` (UTC+8) for any time-based logic. Never use the server's local time.

**`partial` is a valid job status.** If 298 of 300 stocks succeed, write the 298 and log `partial` with the 2 failures. Never abort an entire job because one record failed.

---

## AWS Infrastructure

Region: `ap-southeast-1` (Singapore). Managed with Terraform. State stored in S3 bucket `palago-terraform-state`.

**Local development:** use `aws-vault exec palago --` prefix for all AWS CLI and Terraform commands to avoid mixing personal and work AWS credentials.

```bash
# Example
aws-vault exec palago -- terraform apply
aws-vault exec palago -- aws lambda list-functions
```

---

## GitHub Actions

**`ci.yml`** — runs on every PR and push to `main`: type-check → lint → build

**`deploy-lambdas.yml`** — runs on push to `main` when `apps/ingestion/**` changes:
- Detects which specific job files changed using `git diff`
- Only deploys the Lambdas whose source files changed — not all six
- Uses `aws lambda update-function-code` + `aws lambda wait function-updated`

---

## Environment Variables

```bash
# packages/db and apps/ingestion
DATABASE_URL=          # Supabase pooled connection (port 6543) — app and Lambda
DATABASE_DIRECT_URL=   # Supabase direct connection (port 5432) — migrations only

# apps/ingestion
EODHD_API_KEY=         # EODHD API token

# apps/web
NEXT_PUBLIC_APP_URL=   # e.g. https://palago.ph
```

Never commit real values. `.env.example` at repo root lists all variables with placeholder values.

---
## Git Commit Behaviour

After completing any task, Codex must:

1. **Show a summary** of all files created or modified
2. **Propose a commit message** following the Conventional Commits format (see below)
3. **Wait for explicit approval** — do not run `git add` or `git commit` until the user 
   responds with "yes", "approved", "lgtm", or any clear affirmative
4. **Only then** stage the relevant files and commit

If the user requests changes to the commit message or the file selection, 
revise and ask for approval again before proceeding.

### Commit Message Format

Use Conventional Commits: `type(scope): description`

Types:
- `feat`     → new feature or new file
- `fix`      → bug fix
- `chore`    → setup, config, tooling (no production code change)
- `refactor` → code restructure with no behaviour change
- `test`     → adding or updating tests
- `docs`     → documentation only

Scopes match the monorepo structure:
- `web`        → changes in apps/web
- `ingestion`  → changes in apps/ingestion
- `db`         → changes in packages/db
- `types`      → changes in packages/types
- `infra`      → changes in infrastructure/terraform
- `ci`         → changes in .github/workflows

Examples:
  chore(db): add drizzle schema for stocks and daily_prices
  feat(ingestion): add eod-prices lambda job
  chore(infra): add terraform config for lambda and eventbridge
  feat(web): add dashboard api route with promise.all queries

Each commit should correspond to exactly one task from the setup guide.
Never batch multiple unrelated tasks into a single commit.
