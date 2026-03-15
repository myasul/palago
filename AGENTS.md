This file has been superseded by Spec-Driven Development.

Refer to `.specify/memory/constitution.md` for all project principles,
conventions, and architectural decisions.

For project state, read `PROGRESS.md` and `TASKS.md`.

## Active Technologies
- TypeScript (strict) on Node.js 20 + Cheerio, Zod, Vitest, native `fetch`, shared sleep utility pattern (001-pse-edge-provider)
- N/A for this feature; provider is read-only and returns typed data to callers (001-pse-edge-provider)
- TypeScript (strict) on Node.js 20 + Drizzle ORM, PostgreSQL, `@palago/pse-edge`, (002-pse-edge-backfill)
- Supabase PostgreSQL, S3 bucket `palago-assets` for company logos (002-pse-edge-backfill)

## Recent Changes
- 001-pse-edge-provider: Added TypeScript (strict) on Node.js 20 + Cheerio, Zod, Vitest, native `fetch`, shared sleep utility pattern
