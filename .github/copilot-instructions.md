# Modex RevOps OS — Project Guidelines

## Mission
Generate qualified meetings and pipeline for **YardFlow by FreightRoll** targeting MODEX 2026 (April 13-16, Atlanta). Every feature, every line of code, every outreach action serves one goal: **book meetings with decision-makers at the 20 target accounts**.

## Stack
- Next.js 16 (App Router) + React 19 + TailwindCSS 4 + shadcn/ui
- Prisma 6.5 + PostgreSQL (Railway) — deployed on Vercel
- Email: Resend (primary) → SendGrid (fallback), from: casey@yardflow.ai
- AI: Gemini 2.5-flash-lite (primary) → OpenAI gpt-4o-mini (fallback)
- Auth: NextAuth v5 + Google OAuth

## Architecture
- `src/lib/data.ts` — JSON sync accessors (client/static pages)
- `src/lib/db.ts` — Prisma async accessors (server components only)
- `src/lib/actions.ts` — Server actions for all mutations
- `src/lib/scoring.ts` — Priority scoring engine (ICP Fit 30%, MODEX Signal 20%, Primo Story 20%, Warm Intro 15%, Strategic Value 10%, Meeting Ease 5%)
- `src/lib/email/` — send pipeline with auto-BCC, webhook tracking
- `src/lib/ai/` — content generation with provider failover

See `docs/roadmaps/` for architecture decisions, sprint history, and roadmap.

## Build & Test
```bash
npm run dev          # Local dev server
npm run build        # Production build (must pass before deploy)
npx prisma db push   # Push schema to Railway
npx tsx scripts/seed.ts  # Seed database
npx tsx scripts/backfill-email-accounts.ts  # Sync email campaign contacts to DB
```

## Railway / Database Rules (NEVER SKIP)
- **`export const dynamic = 'force-dynamic'`** — REQUIRED on every `page.tsx` that calls `dbGet*()` or `prisma.*` directly. Without it, Next.js prerendering hits `postgres.railway.internal` at build time and the Railway build fails. No exceptions.
- **Public URL in `.env`** (`trolley.proxy.rlwy.net:12531`) — used for local scripts and codespace. Internal URL (`postgres.railway.internal`) is auto-injected by Railway at runtime — never put it in `.env`.
- **New account added outside the app?** Run `npx tsx scripts/backfill-email-accounts.ts` or add directly via `npx tsx scripts/seed.ts` — never let the DB fall behind the email sends.
- **Email campaign sent to a new company?** That company needs an Account + Persona record within 24 hours of the send. Use `scripts/backfill-email-accounts.ts` as the template.
- **DB count standard**: accounts table should always equal or exceed unique prospect domains contacted. Personas table should have at least one record per email address sent to.

## Conventions
- **Server components by default.** Only add `"use client"` when hooks/interactivity required.
- **`force-dynamic` check**: Before creating or editing any `page.tsx` that uses `dbGet*` or `prisma.*`, confirm `export const dynamic = 'force-dynamic'` is present at the top. This is a Railway build requirement, not optional.
- **Server Actions** for all mutations — never raw API routes for form submissions.
- **Zod validation** on all API route inputs (`src/lib/validations.ts`).
- **No auto-BCC** on Resend sends. Each BCC burns a credit. Casey gets copies via Resend dashboard.
- **Rate limiting** on email endpoints (10/min per IP).
- **No em dashes (—)** in any email copy or AI-generated content. Use periods, commas, hyphens, or line breaks. Em dashes are the #1 AI-detection giveaway.
- **Offline-first** for `/capture` — localStorage queue with auto-sync.
- Account slugs are kebab-case of account name (e.g., `general-mills`).

## Critical Business Rules
- **Dannon**: WARM INTRO ONLY via Mark Shaughnessy — **NEVER** cold email or cold outreach.
- **Wave 1 targets** (8 accounts): General Mills, Frito-Lay, Diageo, Hormel, JM Smucker, Home Depot, Georgia Pacific, H-E-B.
- **The yard is the constraint** — all messaging anchors on the invisible 48-hour dock bottleneck.
- **Casey = $0 salary** (equity + commissions). Platform must prove ROI vs hiring 2 sales reps ($180K/yr).
- Priority bands: A (≥90), B (80-89), C (70-79), D (<70).

## Data Model (12 tables)
accounts → personas (1:N), outreach_waves (1:N), meeting_briefs (1:1), audit_routes (1:1), qr_assets (1:1), activities (1:N), meetings (1:N), mobile_captures (1:N), generated_content (1:N). Plus: email_logs, search_strings, action_intel.

## Known Issues
- Danone vs Dannon FK mismatch: 19/20 audit routes seed (cosmetic).
- Resend webhook URL must be configured in Resend dashboard pointing to `/api/webhooks/email`.
