# palago.ph — Master Task List

> **Legend**
>
> - 🧑 `MANUAL` — You must do this yourself
> - 🤖 `CODEX` — Hand this to Codex with the prompt in `puhunan-setup-tasks.md`
> - ✅ Done — verified and working
> - ⬜ Not started

---

## Phase 0 — Accounts & Credentials

| #   | Type | Task                                   | Status |
| --- | ---- | -------------------------------------- | ------ |
| 0.1 | 🧑   | Create a GitHub Account                | ✅     |
| 0.2 | 🧑   | Create an AWS Account                  | ✅     |
| 0.3 | 🧑   | Create a Supabase Account and Project  | ✅     |
| 0.4 | 🧑   | Create an EODHD Account (Free Tier)    | ✅     |
| 0.5 | 🧑   | Install Required Tools on Your Machine | ✅     |

---

## Phase 1 — Repository & Monorepo Scaffold

| #   | Type | Task                                                       | Status |
| --- | ---- | ---------------------------------------------------------- | ------ |
| 1.1 | 🧑   | Create the GitHub Repository                               | ✅     |
| 1.2 | 🤖   | Scaffold the Turborepo Monorepo                            | ✅     |
| 1.3 | 🧑   | Push Scaffold to GitHub                                    | ✅     |
| 1.4 | 🤖   | Install and Configure shadcn/ui and Tailwind in `apps/web` | ✅     |

---

## Phase 2 — Database Schema & Migrations

| #   | Type | Task                                    | Status |
| --- | ---- | --------------------------------------- | ------ |
| 2.1 | 🤖   | Write the Drizzle Schema                | ✅     |
| 2.2 | 🤖   | Write the Shared TypeScript Types       | ✅     |
| 2.3 | 🤖   | Generate and Run the First Migration    | ✅     |
| 2.4 | 🧑   | Apply the Migration to Supabase         | ✅     |
| 2.5 | 🤖   | Write and Run the Materialized View SQL | ✅     |
| 2.6 | 🧑   | Apply the Materialized View to Supabase | ✅     |
| 2.7 | 🤖   | Write the Stock Seed Script             | ✅     |
| 2.8 | 🧑   | Download PSE Company List and Run Seed  | ✅     |

---

## Phase 3 — AWS Infrastructure with Terraform

| #   | Type | Task                                                             | Status |
| --- | ---- | ---------------------------------------------------------------- | ------ |
| 3.1 | 🧑   | Create an S3 Bucket for Terraform State                          | ✅     |
| 3.2 | 🧑   | Store Secrets in AWS SSM Parameter Store                         | ✅     |
| 3.3 | 🤖   | Write the Terraform Configuration                                | ✅     |
| 3.4 | 🧑   | Review and Apply Terraform (`terraform init && terraform apply`) | ⬜     |

---

## Phase 4 — Lambda Functions (Ingestion Jobs)

| #   | Type | Task                                                                                         | Status |
| --- | ---- | -------------------------------------------------------------------------------------------- | ------ |
| 4.1 | 🤖   | Write the Shared Ingestion Utilities (`db`, `logger`, `yahoo`, `eodhd`, `holidays`, `sleep`) | ⬜     |
| 4.2 | 🤖   | Write the Lambda Job: `eod-prices`                                                           | ⬜     |
| 4.3 | 🤖   | Write the Lambda Job: `intraday-snapshot`                                                    | ⬜     |
| 4.4 | 🤖   | Write the Lambda Job: `sync-indices`                                                         | ⬜     |
| 4.5 | 🤖   | Write the Lambda Job: `sync-dividends`                                                       | ⬜     |
| 4.6 | 🤖   | Write the Lambda Job: `sync-stock-list`                                                      | ⬜     |
| 4.7 | 🤖   | Write the One-Time Backfill Script (`backfill-all`)                                          | ⬜     |
| 4.8 | 🧑   | Run the Backfill Locally Against Supabase                                                    | ⬜     |

---

## Phase 5 — GitHub Actions: CI and Auto-Deploy

| #   | Type | Task                                                                           | Status |
| --- | ---- | ------------------------------------------------------------------------------ | ------ |
| 5.1 | 🧑   | Add AWS Credentials to GitHub Secrets                                          | ⬜     |
| 5.2 | 🤖   | Write the CI Workflow (`.github/workflows/ci.yml`)                             | ⬜     |
| 5.3 | 🤖   | Write the Lambda Auto-Deploy Workflow (`.github/workflows/deploy-lambdas.yml`) | ⬜     |
| 5.4 | 🧑   | Verify the CI/CD Pipeline end-to-end                                           | ⬜     |

---

## Phase 6 — Backend Verification

| #   | Type | Task                                                                | Status |
| --- | ---- | ------------------------------------------------------------------- | ------ |
| 6.1 | 🧑   | Verify the Database (stocks, daily_prices, 52-week view, dividends) | ⬜     |
| 6.2 | 🧑   | Verify Lambda Functions via AWS Console manual test                 | ⬜     |
| 6.3 | 🧑   | Verify EventBridge Schedules are enabled and firing                 | ⬜     |

---

## Phase 7 — Next.js API Routes

| #   | Type | Task                                                                                     | Status |
| --- | ---- | ---------------------------------------------------------------------------------------- | ------ |
| 7.1 | 🤖   | Write `GET /api/dashboard` — PSEi index, top gainers/losers, most active, sector summary | ⬜     |
| 7.2 | 🤖   | Write `GET /api/stocks/[symbol]` — price, OHLC, 52-week range, dividends, company info   | ⬜     |
| 7.3 | 🤖   | Write `GET /api/lists/[type]` — paginated, sortable list by sector/category              | ⬜     |

---

## Phase 8 — Frontend Pages

| #   | Type | Task                                                                                | Status |
| --- | ---- | ----------------------------------------------------------------------------------- | ------ |
| 8.1 | 🤖   | Dashboard page (`/`) — PSEi chart, sector cards, top performers table               | ⬜     |
| 8.2 | 🤖   | Stock Detail page (`/stocks/[symbol]`) — price chart, OHLC, dividends, company info | ⬜     |
| 8.3 | 🤖   | Stock List page (`/lists/[type]`) — sortable, filterable table                      | ⬜     |
| 8.4 | 🤖   | Shared mobile-first layout, navigation, and loading skeletons                       | ⬜     |

---

## Phase 9 — Deploy to Production

| #   | Type | Task                                                        | Status |
| --- | ---- | ----------------------------------------------------------- | ------ |
| 9.1 | 🧑   | Connect GitHub repo to Vercel and set environment variables | ⬜     |
| 9.2 | 🧑   | Point `palago.ph` domain to Vercel                          | ⬜     |
| 9.3 | 🧑   | Smoke test all three pages on production                    | ⬜     |

---

## Progress Summary

```
Phase 0  ████████████  5/5  ✅ Complete
Phase 1  ████████████  4/4  ✅ Complete
Phase 2  ████████████  8/8  ✅ Complete
Phase 3  █████████░░░  3/4  🔧 In progress — 3.4 remaining
Phase 4  ░░░░░░░░░░░░  0/8  ⬜ Not started
Phase 5  ░░░░░░░░░░░░  0/4  ⬜ Not started
Phase 6  ░░░░░░░░░░░░  0/3  ⬜ Not started
Phase 7  ░░░░░░░░░░░░  0/3  ⬜ Not started
Phase 8  ░░░░░░░░░░░░  0/4  ⬜ Not started
Phase 9  ░░░░░░░░░░░░  0/3  ⬜ Not started

Total: 20/41 tasks complete (49%)
```

---

> **Next up:** Task 3.4 — `terraform apply` to deploy all six Lambda functions to AWS.
> Then move to Phase 4 starting with shared ingestion utilities.
