# YardFlow RevOps OS — Project Guidelines

## Mission
Year-round revenue operations platform for **YardFlow by FreightRoll**. Casey operates out of this platform all day — every campaign, every outreach motion, every pipeline review runs through here. MODEX 2026 follow-up is the first campaign, not the only one. Every feature serves one goal: **generate qualified meetings and pipeline proactively, not reactively**.

## Stack
- Next.js 16 (App Router) + React 19 + TailwindCSS 4 + shadcn/ui
- Prisma 6.5 + PostgreSQL (Railway) — deployed on Vercel
- Email: Gmail API (casey@freightroll.com), from: casey@freightroll.com
- AI: Gemini 2.5-flash-lite (primary) → OpenAI gpt-4o-mini (fallback)
- Auth: NextAuth v5 + Google OAuth
- Microsites: `/for/[account]` — personalized account pages with person variants
- HubSpot: `@hubspot/api-client` (planned) — system of record for contacts/companies. Emails Object API (`/crm/v3/objects/emails`) for send logging. NOT Timeline Events API. NOT deprecated Engagements API.

## HubSpot Integration (In Progress — see `docs/roadmaps/hubspot-integration-sprint-plan.md`)
- **Status**: Sprint plan approved 2026-04-11. No HubSpot code deployed yet.
- **Architecture**: `src/lib/hubspot/` — client, contacts, companies, emails modules. All calls wrapped in try/catch with graceful degradation (app works without HubSpot).
- **DB fields (planned)**: `hubspot_contact_id` on Persona, `hubspot_company_id` on Account.
- **Send tracking**: `sendEmail()` and `sendBulk()` in `src/lib/email/client.ts` will auto-log to HubSpot Emails Object API. This is transparent to all 12 send surfaces.
- **Shoot from anywhere**: 12 send surfaces (6 existing + 6 new). Never consolidate into a single wizard. EmailComposer is the standard compose dialog reused everywhere.
- **yardflow.ai**: Will host microsites (CNAME to Vercel). Domain is burned for email sending only.

## Architecture
- `src/lib/data.ts` — JSON sync accessors (client/static pages)
- `src/lib/db.ts` — Prisma async accessors (server components only)
- `src/lib/actions.ts` — Server actions for all mutations
- `src/lib/scoring.ts` — Priority scoring engine (ICP Fit 30%, MODEX Signal 20%, Primo Story 20%, Warm Intro 15%, Strategic Value 10%, Meeting Ease 5%)
- `src/lib/email/` — Gmail API send pipeline, webhook tracking
- `src/lib/email/recipient-guard.ts` — Pre-send domain/persona blocklist (system-blocked + DB-suppressed)
- `src/lib/microsites/` — Account microsite data model, rules engine, per-account TypeScript configs
- `src/components/microsites/` — Section renderers (13 types) + theme system
- `src/lib/ai/` — content generation with provider failover
- `scripts/` — CLI batch senders (touch3, touch4, follow-up, monday-bump) + microsite generator

See `docs/roadmaps/` for architecture decisions, sprint history, and roadmap.

## Email Infrastructure (CRITICAL)
- **ONLY send from `casey@freightroll.com`** via Gmail API. This is the sole authenticated sender.
- **`casey@yardflow.ai` is BURNED** — never authenticated, never warmed, domain reputation destroyed. NEVER reference this email anywhere in code, templates, or outreach. It is permanently blocked in `recipient-guard.ts`.
- **`jake@yardflow.ai` is also dead** — same domain, same problem. Remove on sight.
- **Resend API** is used by CLI batch scripts only (not the app). Scripts must use `casey@freightroll.com` as the from address.
- **Gmail API** is the app's email provider (`src/lib/email/gmail-sender.ts`). OAuth2 refresh token flow.
- **Drip sequence**: T1 (initial) -> T2 (follow-up, Re: thread) -> T3 (last-before-MODEX) -> T4 (personalized close + Primo hook) -> Monday bump (re-thread Saturday sends)

## Microsite Architecture
- 25 account microsites at `/for/[account]` (e.g., `/for/general-mills`)
- Person-specific variants at `/for/[account]/[person]`
- Data in `src/lib/microsites/accounts/*.ts` — 4 hand-crafted (general-mills, frito-lay, ab-inbev, coca-cola), 21 generated
- 13 section types: hero, problem, stakes, solution, proof, network-map, roi, testimonial, modules, timeline, comparison, case-study, cta
- Page views auto-logged to activities table

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
- **No auto-BCC** on email sends. Casey gets copies via Gmail Sent folder automatically.
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
- **yardflow.ai domain is burned** — 213 bounces from unauthenticated sends on 3/27. All batch scripts updated to use `casey@freightroll.com`. Domain permanently blocked in recipient-guard.
- **Resend batch scripts still reference Resend API** — these should migrate to Gmail API for consistency, but work with `casey@freightroll.com` as-is.

## Campaign Status (as of 2026-04-02)
 **409 total emails sent** (Resend CSV export)
 **213 bounced** (all from `casey@yardflow.ai` on 3/27)
 **181 delivered** to 52 unique prospect domains
 **3 opened** (tracking limited — Resend pixel, not Gmail)
 **Delivered domains include**: General Mills, PepsiCo/Frito-Lay, Diageo, Coca-Cola, Campbell's, AB InBev, Ford, Toyota, Caterpillar, Best Buy, Lowe's, Dollar Tree, Whirlpool, Ecolab, Constellation Brands, McCormick, and 36 others
 **Drip touches completed**: T1 + T2 (follow-up) + T3 (last-before-MODEX) + T4 (personalized close) for Wave 1
 **MODEX is 11 days away** (April 13-16) — final push window
