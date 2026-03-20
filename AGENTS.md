This file has been superseded by Spec-Driven Development.

Refer to `.specify/memory/constitution.md` for all project principles,
conventions, and architectural decisions.

For project state, read `PROGRESS.md` and `TASKS.md`.

## Tech Stack (quick reference)

| Category | Tool |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 14 App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| ORM | Drizzle ORM |
| Database | PostgreSQL via Supabase |
| Validation | Zod |
| Testing | Vitest |
| Data provider | @palago/pse-edge (PSEEdgeProvider) |
| Lambda runtime | Node.js 20 |
| Infrastructure | AWS Lambda + EventBridge + S3 + SSM |
| IaC | Terraform (ap-southeast-1) |
| Hosting | Vercel |

Package names use `@palago/` prefix.
