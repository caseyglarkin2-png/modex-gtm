# modex-gtm — Project Guidelines

**Primary agent guidance lives in CLAUDE.md at repo root — read that first.** This file carries only structural facts still true at build time.

---

## Stack (Verified)

- Next.js 16 (App Router) + React 19 + TailwindCSS 4 + shadcn/ui
- Prisma 6.5 + PostgreSQL (Railway)
- Email: Gmail API from casey@freightroll.com
- AI: Gemini 2.5-flash-lite (primary) → OpenAI gpt-4o-mini (fallback)
- Auth: NextAuth v5 + Google OAuth

## Architecture (Structural)

- `src/lib/data.ts` — JSON sync accessors (client/static pages)
- `src/lib/db.ts` — Prisma async accessors (server components only)
- `src/lib/actions.ts` — Server actions for all mutations
- `src/lib/scoring.ts` — Priority scoring engine
- `src/lib/email/` — Gmail API send pipeline
- `src/lib/email/recipient-guard.ts` — Pre-send domain/persona blocklist
- `src/lib/microsites/` — Account microsite data model + rules engine
- `src/components/microsites/` — Section renderers (13 types)
- `src/lib/ai/` — content generation with provider failover
- `scripts/` — CLI batch senders + microsite generator

## Microsite Architecture

- Account microsites at `/for/[account]` (e.g., `/for/general-mills`)
- Person-specific variants at `/for/[account]/[person]`
- Data in `src/lib/microsites/accounts/*.ts`
- 13 section types: hero, problem, stakes, solution, proof, network-map, roi, testimonial, modules, timeline, comparison, case-study, cta

## Conventions (Structural)

- **Server components by default** — add `"use client"` only when interactivity needed
- **`export const dynamic = 'force-dynamic'`** — REQUIRED on every `page.tsx` that calls `dbGet*()` or `prisma.*`
- **Server Actions** for all mutations
- **Zod validation** on all API route inputs
- No em dashes (—) in copy
- No auto-BCC; Casey receives copies via Gmail Sent folder
- Account slugs are kebab-case

## Data Model

accounts → personas (1:N), outreach_waves (1:N), meeting_briefs (1:1), audit_routes (1:1), qr_assets (1:1), activities (1:N), meetings (1:N), mobile_captures (1:N), generated_content (1:N). Plus: email_logs, search_strings, action_intel.
