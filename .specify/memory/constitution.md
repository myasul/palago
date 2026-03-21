<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Beginner-First Mobile Experience
  - Template Principle 2 -> II. Source Isolation Through Provider Boundaries
  - Template Principle 3 -> III. Financial Data Precision & Schema Discipline
  - Template Principle 4 -> IV. Validated, Observable Ingestion
  - Template Principle 5 -> V. Philippine Market Time & User Transparency
- Added sections:
  - Operational Constraints
  - Delivery Workflow & Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated /Users/matthewyasul/personal/code/palago/.specify/templates/plan-template.md
  - ✅ updated /Users/matthewyasul/personal/code/palago/.specify/templates/spec-template.md
  - ✅ updated /Users/matthewyasul/personal/code/palago/.specify/templates/tasks-template.md
  - ⚠ pending /Users/matthewyasul/personal/code/palago/.specify/templates/commands (directory not present; no files to update)
- Follow-up TODOs:
  - None
-->
# palago.ph Constitution

## Core Principles

### I. Beginner-First Mobile Experience
All labels, navigation, and data fields MUST be in English. Jargon MUST include
tap-to-expand plain Filipino explanations for terms a beginner would not know.
Rationale: palago.ph exists to make PSE data understandable for first-time investors,
not to mirror broker-grade interfaces.

### II. Source Isolation Through Provider Boundaries
Each persisted table row MUST come from exactly one approved source, and data
from different providers MUST NOT be merged into the same row. External market
providers MUST be accessed through explicit provider abstractions such as
`IPSEDataProvider`, with provider-specific identifiers stored only in dedicated,
nullable fields like `edge_cmpy_id` and `edge_sec_id`. PSE Edge scraping MUST
use polite delays of at least 500ms between requests. Rationale: isolated
provider boundaries keep ingestion auditable, reversible, and resilient when a
source changes behavior.

### III. Financial Data Precision & Schema Discipline
Financial values MUST use PostgreSQL `numeric` semantics end-to-end; `float` or
equivalent binary floating point types are forbidden for prices, amounts, and
other monetary market data. Table names MUST remain plural, schema changes MUST
ship through new Drizzle migrations, and the Drizzle-owned `migrations/` folder
MUST NOT be edited manually. Materialized views and custom SQL MUST live under
`packages/db/scripts/sql/` and related scripts. Rationale: financial systems
lose trust quickly when rounding, naming, or migration discipline is loose.

### IV. Validated, Observable Ingestion
All external API or scraped responses MUST be validated with Zod before any
database write. Ingestion code MUST use functional shared utilities, place
networked clients in `shared/clients/`, place pure utilities in `shared/utils/`,
and emit structured logs through `shared/logger.ts` rather than `console.log`.
All ingestion writes MUST prefer idempotent upserts with `onConflictDoUpdate`,
and per-record failures MUST degrade to partial success instead of aborting the
entire job. Rationale: ingestion is the project's operational backbone, so it
must fail transparently and recover safely.

### V. Philippine Market Time & User Transparency
Stored timestamps MUST remain in UTC, while all Philippine market logic and
display conversions MUST use `Asia/Manila` via `date-fns-tz`; server-local time
MUST NOT drive business behavior. Market schedules, trading-day logic, and user
messaging MUST reflect Philippine exchange context explicitly. Secrets MUST
never be hardcoded or committed and MUST be loaded from `process.env` or AWS SSM
as appropriate. Rationale: time-zone mistakes and hidden operational state cause
incorrect market data, misleading UI, and deployment risk.

## Operational Constraints

The approved stack is the monorepo already established for palago.ph: Turborepo
with npm workspaces, Next.js 15 App Router, React 19, strict TypeScript,
Tailwind CSS v4, shadcn/ui, Recharts, PostgreSQL via Supabase, Drizzle ORM,
Node.js 20 Lambda jobs, Terraform in `ap-southeast-1`, and Vitest for
automated tests.

Server Components MUST remain the default data-fetching model in the web app.
Client Components MAY be used only for interactivity such as chart controls,
tooltips, or similar browser-only behavior. Database credentials, API keys,
`.env` files, and Terraform state MUST NOT be committed. Infrastructure and AWS
operations MUST use the project's `aws-vault exec palago --` workflow in local
development.

The database schema uses two top-level entity tables: `companies` (one row per
PSE-listed company, holding corporate profile data) and `stocks` (one row per
listed security, holding trading data and referencing its parent company via
`company_id`). Company logos MUST be downloaded during backfill, uploaded to
the project S3 assets bucket, and stored as full absolute S3 URLs in
`companies.logo_url`. Logos MUST NOT be hotlinked from PSE Edge at runtime.

Dividend data MUST be filtered to `security_type = 'COMMON'` in all user-facing
contexts. Preferred share dividends MUST be stored in the `dividends` table but
MUST NOT be displayed to users in MVP.

### UI Conventions
Price changes MUST use green for positive and red for negative — these match
broker conventions and MUST NOT be changed. Color palette uses pastel shades
derived from the Philippine flag: blue (#B8CEFF) as primary interactive color,
red (#FFB3BB) for negative price changes, gold (#FFF0A0) as accent. Positive
price changes use green (#B2F2BB) to match universal broker conventions.

Every stock card MUST display minimum investment as board_lot × close_price.
Data delay MUST be disclosed as "Data delayed 15 minutes" on every page showing
live or recent prices. All UI components follow the smart/dumb split: Server
Components for data fetching, Client Components only for interactivity. URL
parameters MUST be used for all filterable/sortable list views so filters are
shareable and survive page refresh.

## Delivery Workflow & Quality Gates

Every feature spec, plan, and task list MUST demonstrate compliance with the
Core Principles before implementation starts. Plans MUST identify the concrete
provider boundary, timezone handling, numeric data model impact, mobile-first
UX obligations, and observability implications for the work being proposed.
Specs for user-facing features MUST state how minimum investment, data delay
disclosure, and jargon explanations are handled when relevant. Tasks MUST
include explicit work for validation, structured logging, schema or migration
updates when needed, and verification at mobile viewport size.

Testing depth MUST match risk: schema changes, ingestion flows, parsing logic,
and market-time calculations MUST include automated coverage; UI changes that
affect beginner comprehension or mobile rendering MUST include validation for
the impacted experience. A task is not complete until principle compliance is
verified in the implementation artifacts it changes.

Project state is tracked across three files: `PROGRESS.md` (what's built,
what's broken, what's next — updated by Codex at the end of every session),
`TASKS.md` (master phase checklist), and `.specify/memory/constitution.md`
(this file). Every Codex session MUST begin by reading all three before
proceeding.

During implementation, tasks.md MUST be updated immediately after
each task completes — change [ ] to [x], add a brief deviation note
if the implementation differed from the plan, and commit tasks.md
in the same commit as the implementation files it describes.

## Governance

This constitution supersedes conflicting local habits for palago.ph. Amendments
MUST be made in `.specify/memory/constitution.md`, MUST include an updated Sync
Impact Report at the top of the file, and MUST propagate any changed rules into
dependent templates and runtime guidance in the same change.

Versioning policy follows semantic versioning for governance documents:
MAJOR for incompatible principle removals or redefinitions, MINOR for new
principles or materially expanded governance, and PATCH for clarifications that
do not change expected behavior.

Compliance review is mandatory for every plan, spec, and implementation review.
Reviewers MUST confirm source isolation, numeric precision, timezone handling,
mobile-first beginner UX obligations, observability requirements, and secret
management where applicable. Exceptions MUST be documented in the relevant plan
under a justified complexity or compliance note before implementation proceeds.

## Git Commit Behaviour

After completing any task, Codex must:

1. Show a summary of all files created or modified
2. Prepare a commit message following Conventional Commits format
3. Stage the relevant files and commit immediately — no approval
   required

**Version**: 1.1.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-21
