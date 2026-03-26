# Modex RevOps OS — V2 Sprint Roadmap (10/10 Edition)

> Generated: 2026-03-26 | Revised: 2026-03-26 (10/10 pass)
> Baseline Grade: **3.6 / 10** (weighted, meeting booking + email at 2x)
> Target Grade: **10 / 10** across every dimension
> Goal: **Book meetings for MODEX 2026. Every feature serves that or gets cut.**

---

## Current State — Honest Assessment

| Dimension | Score | Gap | What 10/10 Looks Like |
|-----------|-------|-----|-----------------------|
| UI/UX Design | 6/10 | No design system, no animations, dense tables, no dark polish | Polished shadcn/ui, micro-animations, dark theme, elevation system, consistent typography, empty states with CTAs |
| Component Architecture | 5/10 | Copy-paste tables across 8 pages, no shared components | DataTable, StatusBadge, BandBadge, CopyButton, CommandSearch — all reusable. BAND_COLORS in constants.ts, zero duplication |
| Information Architecture | 7/10 | Good waterfall but no cross-linking, no global search | Cmd+K search, every entity cross-linked (account→personas→wave→brief→route), breadcrumbs, ← Back nav |
| Interactivity | 4/10 | Read-only everywhere except Mobile Capture (which doesn't save) | Inline status edits, drag-sort queues, keyboard shortcuts (j/k nav, e=email, m=meeting), optimistic updates, real-time toast feedback |
| Data Persistence | 2/10 | Static JSON, zero API routes, zero writes | Neon Postgres + Prisma, 12 CRUD endpoints, Server Actions for mutations, connection pooling, offline localStorage queue for captures |
| AI/Content Generation | 1/10 | Nothing. No Gemini, no drafting, no infographics | Gemini-powered email drafts, LinkedIn DMs, call scripts, meeting prep, account infographics. Tone/length selectors. Cached in DB. Regenerate on demand |
| Email/Outreach (2x weight) | 2/10 | Can't send anything. Copy-paste only | SendGrid integration, AI-draft→edit→send flow, bulk wave sends, auto-log to activities, auto-update persona/wave status, open/click webhook tracking |
| Meeting Booking (2x weight) | 3/10 | Briefs exist but no booking flow, empty meetings page | Book-from-account dialog, Calendly embed, pre-meeting AI prep, post-meeting notes, auto-follow-up activity, pipeline funnel dashboard |
| Mobile Responsive | 6/10 | Sidebar breaks mobile, tables overflow | PWA manifest, collapsible drawer nav, touch-optimized capture form, responsive DataTable (card view on mobile), localStorage offline queue |
| Production Readiness | 2/10 | No auth, no error handling, console.log in prod | NextAuth Google OAuth, Zod validation on all API routes, error.tsx + loading.tsx per route, rate limiting, robots.txt, Lighthouse >90, zero console.log |

**Bottom line:** Beautiful whiteboard. Can't book a single meeting from it. This roadmap fixes that.

---

## Architecture Decisions (Locked)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 + App Router | Server components + API routes + Server Actions in one deploy |
| Styling | Tailwind v4 + shadcn/ui | Copy-paste components, no vendor lock-in, dark mode free |
| AI | Gemini API (primary), OpenAI (fallback) | User has both keys. Gemini free tier is generous |
| Email | SendGrid | User has verified key, casey@freightroll.com domain |
| Calendar | Calendly embed | User has link. No calendar API complexity |
| Database | Neon PostgreSQL (free tier) + Prisma ORM | Serverless Postgres, no cold-start via connection pooling, free 0.5GB |
| Auth | NextAuth.js + Google OAuth | Casey + Jake only. No signup flow needed |
| Deploy | Vercel only | Kill Railway. Single endpoint. Auto-preview on push |
| Offline | localStorage capture queue + ServiceWorker | MODEX floor WiFi is unreliable. Captures must not be lost |

### Available Credentials
- `SENDGRID_API_KEY` — active, verified sender
- `SENDGRID_FROM_EMAIL` — casey@freightroll.com
- `GEMINI_API_KEY` — active
- `OPENAI_API_KEY` — active (backup)
- `CALENDLY_LINK` — https://calendly.com/jake-freightroll/mnfst

---

## Sprint Plan — 8 Sprints, 10/10 Standard

Each sprint ends with: build passes, deploy to Vercel, dimension score updated.

---

### SPRINT 1: Design System + Component Library
**Goal:** Replace copy-paste UI with A+ reusable components. Every page improves for free.
**Dimensions advanced:** UI/UX 6→8, Component Architecture 5→9, Mobile 6→8

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 1.1 | Init shadcn/ui with Tailwind v4 + CSS variables | `components.json`, `lib/utils.ts` | `npx shadcn@latest init` succeeds, components.json created |
| 1.2 | Add core shadcn components: Button, Card, Badge, Table, Input, Textarea, Dialog, Tabs, Skeleton, DropdownMenu, Select, Tooltip, Separator, ScrollArea, Sheet | `components/ui/*.tsx` (15 files) | All render in isolation |
| 1.3 | Add Sonner toast notifications | `components/ui/sonner.tsx`, `app/layout.tsx` | Toast shows on trigger |
| 1.4 | Create `lib/constants.ts` — BAND_COLORS, STATUS_COLORS, PRIORITY_COLORS, WAVE_COLORS, STATUS_OPTIONS | `src/lib/constants.ts` | Import works, replaces 3 inline color maps |
| 1.5 | Create DataTable component — sortable columns, filter chips, search box, pagination | `components/data-table.tsx` | Pass columns[] + data[] → renders sorted/filtered table with page controls |
| 1.6 | Create StatusBadge component — colored badge from status enum | `components/status-badge.tsx` | "Contacted" = blue, "Meeting Booked" = green, etc. |
| 1.7 | Create BandBadge component — A=emerald, B=yellow, C=orange, D=gray | `components/band-badge.tsx` | Renders correct color per band |
| 1.8 | Create CopyButton component — click → clipboard → ✓ toast | `components/copy-button.tsx` | Click copies, shows toast feedback |
| 1.9 | Create EmptyState component — icon + message + CTA button | `components/empty-state.tsx` | "No meetings yet. Book one →" pattern |
| 1.10 | Rebuild sidebar — collapsible Sheet on mobile, hamburger toggle, active state, section groupings | `components/sidebar.tsx` | Desktop: fixed sidebar. Mobile: hamburger → Sheet drawer overlay |
| 1.11 | Update globals.css — elevation system (.shadow-card, .shadow-elevated), smooth transitions, focus-visible rings | `src/app/globals.css` | Shadow, transition, and focus utilities available globally |
| 1.12 | Dark mode toggle — theme provider (next-themes) + toggle button | `components/theme-provider.tsx`, `components/theme-toggle.tsx`, `app/layout.tsx` | Toggle switches light↔dark, persists in localStorage |
| 1.13 | PWA manifest + meta tags — installable on mobile home screen | `public/manifest.json`, `app/layout.tsx` | Chrome "Install App" prompt appears on mobile |
| 1.14 | Build passes, deploy to Vercel | — | `npm run build` exits 0, Vercel deploy succeeds |

**Sprint 1 outcome:** Component library complete. Every subsequent page build uses shared primitives.

---

### SPRINT 2: Rebuild All 16 Pages with New Components
**Goal:** Every page uses DataTable, StatusBadge, BandBadge. Filters + sort on every table. Cross-links everywhere.
**Dimensions advanced:** UI/UX 8→9, Info Architecture 7→9, Interactivity 4→6

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 2.1 | Rebuild Dashboard — Card stat grid (accounts, personas, meetings, captures), wave pipeline progress bars, upcoming due dates list, recent activities feed | `app/page.tsx` | 6 stat cards + wave progress + due dates + activity feed |
| 2.2 | Rebuild Accounts — DataTable with sort (rank, score, band), filter (band, tier, owner, status), row click → detail | `app/accounts/page.tsx` | Click column header → sorts. Filter chips persist via URL params |
| 2.3 | Rebuild Account Detail — Tabs (Overview / Personas / Waves / Brief / Routes / Activity), hero card with band+score+tier, back nav | `app/accounts/[slug]/page.tsx` | Tab switching, hero card, cross-linked sub-entities |
| 2.4 | Rebuild Personas — DataTable with filter (account, priority P1/P2/P3, lane, status), LinkedIn link + CopyButton | `app/personas/page.tsx` | Multi-filter, click persona → linked account |
| 2.5 | Rebuild Waves — timeline cards per wave (0-3), progress bar (% of accounts in wave that are contacted), channel mix badges | `app/waves/page.tsx` | Progress bar per wave, account cards within wave sections |
| 2.6 | Rebuild Briefs — Card grid with search filter, vertical badges, click → detail | `app/briefs/page.tsx` | Type account name → instant filter |
| 2.7 | Rebuild Brief Detail — structured sections with Separator, source link buttons, "← Back to Briefs" | `app/briefs/[account]/page.tsx` | All 10 sections render, source URL buttons work |
| 2.8 | Rebuild Audit Routes — DataTable + CopyButton for each URL and suggested message | `app/audit-routes/page.tsx` | Copy URL one-click, copy message one-click |
| 2.9 | Rebuild QR Assets — Card grid with CopyButton for audit URLs, placeholder QR visual | `app/qr/page.tsx` | Copy URL, link to audit route |
| 2.10 | Rebuild Search Strings — DataTable with filter (account, wave, function, priority), CopyButton per query type | `app/search/page.tsx` | Filter + copy Sales Nav / LinkedIn / Google queries separately |
| 2.11 | Rebuild Intel — Card list with status toggle button (Open → Closed), grouped by account | `app/intel/page.tsx` | Toggle changes visual state (client state only — DB in Sprint 3) |
| 2.12 | Rebuild Activities — timeline cards with date, type icon, account link, outcome, next step | `app/activities/page.tsx` | Vertical timeline, each card links to account |
| 2.13 | Rebuild Meetings — EmptyState "No meetings yet. Start outreach →" with link to /waves | `app/meetings/page.tsx` | Empty state shows, link works |
| 2.14 | Rebuild Capture — better form layout. Card sections for contact info, interaction details, heat scoring with visual sliders, validation toast | `app/capture/page.tsx` | Required fields validated, heat score computed live, form resets after "submit" |
| 2.15 | Rebuild Queue — DataTable with action column (Mark Done, Snooze, View Account) | `app/queue/page.tsx` | Action buttons render (wired in Sprint 3) |
| 2.16 | Add Cmd+K global search — search accounts, personas, briefs by name. Dialog with results | `components/command-search.tsx`, `app/layout.tsx` | Cmd+K opens, type → instant results, click → navigates |
| 2.17 | Add keyboard navigation — j/k for up/down in DataTable, Enter to select row | `components/data-table.tsx` | j/k moves row focus, Enter navigates |
| 2.18 | Build passes, deploy to Vercel | — | All 16 pages render, no regressions, Vercel live |

**Sprint 2 outcome:** UI 9/10. Every page polished, filterable, sortable. Cross-links everywhere. Cmd+K search.

---

### SPRINT 3: Database + API Layer + Offline Capture
**Goal:** Data persistence. Writes work. Mobile Capture saves. Offline queue for MODEX floor.
**Dimensions advanced:** Data Persistence 2→9, Interactivity 6→8, Mobile 8→9

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 3.1 | Provision Neon PostgreSQL — create project, get pooled connection string | `.env.local` | `DATABASE_URL` set, `npx prisma db push` succeeds |
| 3.2 | Update Prisma schema — add `@@index` on foreign keys, add `GeneratedContent` model for AI cache (Sprint 5), add `EmailLog` model for SendGrid tracking (Sprint 6) | `prisma/schema.prisma` | `npx prisma db push` succeeds, all 14 models created |
| 3.3 | Update seed script — use Prisma `createMany` with `skipDuplicates`, recompute `#VALUE!` scores | `scripts/seed.ts` | `npm run seed` inserts all records, scores computed |
| 3.4 | Create Server Actions for mutations (no REST when possible) — `createCapture`, `createActivity`, `createMeeting`, `updateAccountStatus`, `updatePersonaStatus`, `updateIntelStatus` | `lib/actions.ts` | Each action takes form data → upserts → revalidates path |
| 3.5 | Create `/api/captures` POST + GET — for offline sync and Queue reads | `app/api/captures/route.ts` | POST creates, GET returns sorted by due_date |
| 3.6 | Create `/api/meetings` CRUD — full lifecycle | `app/api/meetings/route.ts` | POST/GET/PATCH/DELETE all validated |
| 3.7 | Add Zod schemas for all API inputs | `lib/validations.ts` | Invalid payload → 400 + clear error message |
| 3.8 | Switch `lib/data.ts` from JSON imports to Prisma queries | `lib/data.ts` | All getters now async, query Neon DB |
| 3.9 | Convert all 16 pages from sync to async data fetching | All `page.tsx` files | Pages `await getData()`, render from DB |
| 3.10 | Wire Mobile Capture form → Server Action `createCapture` | `app/capture/page.tsx` | Submit → saves → toast "Captured!" → appears in /queue |
| 3.11 | Wire Intel toggle → Server Action `updateIntelStatus` | `app/intel/page.tsx` | Toggle → DB update → persists on refresh |
| 3.12 | Wire Account status dropdowns → Server Action `updateAccountStatus` | `app/accounts/[slug]/page.tsx` | Change research/outreach/meeting status → saves |
| 3.13 | Wire Persona status → Server Action `updatePersonaStatus` | `app/personas/page.tsx` | Inline edit → saves |
| 3.14 | Offline capture queue — localStorage buffer + sync-on-reconnect | `lib/offline-queue.ts`, `app/capture/page.tsx` | Airplane mode → capture saves locally → reconnect → auto-syncs → toast "3 captures synced" |
| 3.15 | Add `loading.tsx` skeleton to every route group | `app/*/loading.tsx` (13 files) | Skeleton shows before data loads |
| 3.16 | Add `error.tsx` + `global-error.tsx` error boundaries | `app/error.tsx`, `app/global-error.tsx` | DB timeout → friendly "Try again" UI, not crash |
| 3.17 | Set `DATABASE_URL` on Vercel environment variables | Vercel CLI | `vercel env add DATABASE_URL` succeeds |
| 3.18 | Build passes, deploy to Vercel | — | All pages load from Neon DB, captures persist, Vercel live |

**Sprint 3 outcome:** Full persistence. Capture → Queue → Follow-up pipeline works end-to-end. Offline mode for MODEX floor.

---

### SPRINT 4: Account Command Center + Cross-Linking
**Goal:** Single war-room view per account. Everything about Dannon on one screen. Never leave the account page.
**Dimensions advanced:** Info Architecture 9→10, Interactivity 8→9

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 4.1 | Build Account hero card — name, band badge, priority score bar, tier, owner, quick-stat chips (personas count, open activities, wave status) | `app/accounts/[slug]/page.tsx` | Hero card renders at top with all key metrics |
| 4.2 | Build Personas tab — persona cards with name, title, lane, LinkedIn button, "Email" CTA, "Generate DM" CTA (wired in Sprint 5-6) | `components/account/personas-tab.tsx` | Cards render, LinkedIn opens, email/DM buttons present (disabled until Sprint 5-6) |
| 4.3 | Build Outreach tab — wave assignment card, channel mix, start/follow-up dates, suggested messaging CopyButton | `components/account/outreach-tab.tsx` | Wave card renders with dates and channel badges |
| 4.4 | Build Brief tab — full meeting brief rendered inline with all 10 sections + source URL buttons | `components/account/brief-tab.tsx` | All sections render, source URLs open in new tab |
| 4.5 | Build Routes tab — audit URL with CopyButton, suggested message CopyButton, QR placeholder, fast ask | `components/account/routes-tab.tsx` | Copy URL, copy message, view fast ask |
| 4.6 | Build Activity tab — chronological timeline of all activities + meetings for this account | `components/account/activity-tab.tsx` | Activities rendered as timeline cards |
| 4.7 | Build "Log Activity" dialog — select type, add notes, set follow-up date → Server Action | `components/log-activity-dialog.tsx` | Dialog opens, submit saves, toast confirms, activity appears in timeline |
| 4.8 | Build "Book Meeting" dialog — select attendees (from account personas), date, time, type, location → Server Action | `components/book-meeting-dialog.tsx` | Dialog saves meeting, appears on Meetings page and Account Activity tab |
| 4.9 | Add "Open in Calendly" button — pre-fills Calendly link | Account detail Routes tab | Opens Calendly in new tab |
| 4.10 | Cross-link all entities — every account name links to /accounts/[slug], every persona links to account, wave links to account, brief links to account | All pages | Click any account name anywhere → /accounts/[slug] |
| 4.11 | Add breadcrumbs to all detail pages — "Accounts > Dannon > Personas" | Detail pages | Breadcrumb renders, each segment clickable |
| 4.12 | Build passes, deploy | — | Account Command Center fully functional |

**Sprint 4 outcome:** Account page is the war room. Prep for any account in 30 seconds. Never switch tabs.

---

### SPRINT 5: Gemini AI Content Engine
**Goal:** Generate custom emails, DMs, call scripts, meeting prep, and infographics for all 20 accounts.
**Dimensions advanced:** AI/Content 1→9

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 5.1 | Install `@google/generative-ai` SDK | `package.json` | Import resolves |
| 5.2 | Create AI client wrapper with error handling + retry | `lib/ai/client.ts` | Handles rate limits, timeouts, returns typed response |
| 5.3 | Create prompt templates: email (warm intro, cold outreach, follow-up), LinkedIn DM (short 280-char, long 1000-char), call script (60-sec talk track with objection handling), meeting prep (1-page brief), infographic content (structured data for visual card) | `lib/ai/prompts.ts` | Each template is a function taking account+persona context → returns Gemini prompt string |
| 5.4 | Create `/api/ai/generate` POST endpoint — accepts template type + context → returns AI output | `app/api/ai/generate/route.ts` | POST `{type: "email", accountId: 1, personaId: 5, tone: "conversational"}` → returns draft |
| 5.5 | Build "Generate Email" dialog — select persona, pick tone (formal/conversational/provocative), pick length (short/medium/long), generate → edit → copy | `components/ai/email-generator.tsx` | Dialog opens from account page, generates draft, editable textarea, copy button |
| 5.6 | Build "Generate DM" popover — click persona row → picks DM length → generates → copy to clipboard | `components/ai/dm-generator.tsx` | Generates DM with persona+account context, copy works |
| 5.7 | Build "Generate Call Script" dialog — numbered talk track with objection handling section | `components/ai/call-script-generator.tsx` | Renders structured script, copy full or per-section |
| 5.8 | Build "Generate Meeting Prep" on Brief page — AI-enhanced 1-pager combining brief + persona + recent activity data | `components/ai/meeting-prep-generator.tsx` | Generates prep doc, renders formatted, copy/print |
| 5.9 | Build Account Infographic generator — styled HTML card with account data (like Danone one-pager) | `components/ai/infographic-generator.tsx` | Dark-themed card with why-now, pain points, scoring, personas, primo relevance |
| 5.10 | Add tone selector (formal / conversational / provocative) + length selector (short / medium / long) to all AI dialogs | All `components/ai/*.tsx` | Dropdowns change output style and length |
| 5.11 | Add "Regenerate" + "Edit" + "Copy" + "Use as Email Draft" actions to all AI outputs | All AI components | Regenerate gets new version, Edit opens textarea, Copy to clipboard, Use as Draft pre-fills email composer |
| 5.12 | Cache generated content in `GeneratedContent` model — type, accountId, personaId, tone, content, createdAt | `prisma/schema.prisma` already has model | Regenerate creates new record. Previous versions viewable |
| 5.13 | Set `GEMINI_API_KEY` on Vercel env vars | Vercel CLI | Build succeeds, AI generation works in prod |
| 5.14 | Build passes, deploy | — | AI works on all 20 accounts × all content types |

**Sprint 5 outcome:** AI/Content 9/10. Every account gets custom infographic, email, DM, call script in seconds.

---

### SPRINT 6: Email Sending + Outreach Engine
**Goal:** Send AI-drafted emails from the app. 1:1 or bulk. Auto-log everything.
**Dimensions advanced:** Email/Outreach 2→9

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 6.1 | Install `@sendgrid/mail` SDK | `package.json` | Import resolves |
| 6.2 | Create SendGrid client wrapper — send single + batch, error handling | `lib/email/client.ts` | Sends test email successfully |
| 6.3 | Create HTML email templates — warm intro, cold outreach, follow-up, meeting confirm | `lib/email/templates.ts` | Each returns branded HTML with FreightRoll styling |
| 6.4 | Create `/api/email/send` POST endpoint — to, cc, subject, htmlBody, personaId, accountId → sends + logs | `app/api/email/send/route.ts` | POST → email arrives → 200 + Activity record created |
| 6.5 | Create `/api/email/send-bulk` POST endpoint — array of recipients → batch send | `app/api/email/send-bulk/route.ts` | Batch send → all arrive → all logged |
| 6.6 | Build Email Composer dialog — To, CC, Subject, Body (rich text), template picker dropdown, "AI Draft" button (opens email-generator), Send button | `components/email/composer.tsx` | Full compose flow: pick template → AI generate → edit → send |
| 6.7 | Add "Email" action button on Persona rows — opens composer pre-filled with persona email/name | `app/personas/page.tsx` + Account Personas tab | Click → composer opens with To pre-filled |
| 6.8 | Add "Email All P1" bulk action on Account page — selects all P1 personas → compose bulk | Account detail Personas tab | Select all P1 → composer opens with recipients list |
| 6.9 | Wire AI draft → Composer → Send pipeline — generate → preview → edit → send → log | Composer + AI email generator | Full pipeline works end-to-end |
| 6.10 | Auto-log sent emails to Activities — type="Email Sent", outcome=subject+recipient | `/api/email/send` | Activity record created after each send |
| 6.11 | Auto-update persona status to "Contacted" after email send | `/api/email/send` | Persona status updates |
| 6.12 | Auto-update wave status to "In Progress" after first send to any account in wave | `/api/email/send` | Wave status updates |
| 6.13 | Create `/api/webhooks/sendgrid` — receive open/click events → update EmailLog | `app/api/webhooks/sendgrid/route.ts` | SendGrid event → EmailLog updated with open/click timestamps |
| 6.14 | Build Outreach History section on Account Activity tab — shows sent emails with open/click indicators | Account Activity tab | Email sends shown with "Opened ✓" / "Clicked ✓" badges |
| 6.15 | Set `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` on Vercel env vars | Vercel CLI | Emails send from casey@freightroll.com in prod |
| 6.16 | Build passes, deploy | — | Full email → track → log pipeline works |

**Sprint 6 outcome:** Email/Outreach 9/10. AI-draft → edit → send → auto-log → track opens/clicks. Bulk waves work.

---

### SPRINT 7: Meeting Booking + Pipeline Dashboard
**Goal:** Book meetings, track pipeline, see conversion funnel. The money sprint.
**Dimensions advanced:** Meeting Booking 3→9, Interactivity 9→10

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 7.1 | Rebuild Meeting Booking dialog — select account (dropdown), select attendees (multi-select from personas), date picker, time, type (in-person/virtual/phone), location/link, notes → Server Action | `components/meeting/booking-dialog.tsx` | Dialog saves meeting to DB, toast confirms |
| 7.2 | Add "Book via Calendly" button — opens Calendly link pre-parameterized with account name | `components/meeting/calendly-button.tsx` | Opens Calendly in new tab with context |
| 7.3 | Rebuild Meetings page — DataTable with sort/filter (status, date, account), row click → detail | `app/meetings/page.tsx` | All meetings rendered, sortable, filterable |
| 7.4 | Build Meeting Detail page — attendees, linked brief, linked account, pre-meeting prep (AI from Sprint 5), post-meeting notes | `app/meetings/[id]/page.tsx` | Full meeting view with all context |
| 7.5 | Build Pre-Meeting Prep view — AI-generated 1-pager with brief data + persona data + recent activity | `components/meeting/prep-view.tsx` | One-click generates prep doc |
| 7.6 | Build Post-Meeting Notes form — outcome (dropdown: positive/neutral/negative), next steps, follow-up date, attendee notes → Server Action | `components/meeting/notes-form.tsx` | Submit saves, auto-creates follow-up Activity |
| 7.7 | Auto-create follow-up Activity after meeting is logged | Server Action in meetings | Meeting saved → Activity "Follow-up: [account]" created with due date |
| 7.8 | Dashboard overhaul — pipeline funnel chart: Target (20) → Researched → Contacted → Replied → Meeting Booked → Meeting Held | `app/page.tsx` | Horizontal funnel with counts per stage |
| 7.9 | Dashboard — "Meetings This Week" counter, "Emails Sent This Week" counter, "Captures This Week" counter | `app/page.tsx` | Real-time counts from DB |
| 7.10 | Dashboard — wave conversion table: Wave 1 (6 accounts) → X contacted → Y replied → Z meetings | `app/page.tsx` | Table shows conversion per wave |
| 7.11 | Dashboard — upcoming meetings list (next 7 days) with quick-prep link | `app/page.tsx` | List shows, click → meeting detail |
| 7.12 | Add "Quick Book" button on Account Command Center — pre-fills account, suggests attendees | Account detail hero | One-click → booking dialog pre-filled |
| 7.13 | Add CSV export for meetings + pipeline data — download as .csv | `app/api/export/route.ts` | Click "Export" → browser downloads CSV |
| 7.14 | Build passes, deploy | — | Full meeting lifecycle + pipeline dashboard |

**Sprint 7 outcome:** Meeting Booking 9/10. Book → prep → hold → log → follow-up. Pipeline visible at a glance.

---

### SPRINT 8: Auth + Production Hardening + 10/10 Polish
**Goal:** Lock it down. Performance. Every remaining gap to 10/10.
**Dimensions advanced:** Production Readiness 2→10, all others →10

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 8.1 | Install `next-auth` + configure Google OAuth provider | `package.json`, `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` | Google login flow works |
| 8.2 | Add AuthProvider to layout + useSession hook | `app/layout.tsx`, `components/auth-provider.tsx` | Session available everywhere |
| 8.3 | Build login page — branded, Google sign-in button, "Modex RevOps OS" header | `app/login/page.tsx` | Login renders, Google button works |
| 8.4 | Add middleware for route protection — redirect unauthenticated to /login | `middleware.ts` | Unauthenticated → /login. API routes → 401 |
| 8.5 | Role-based access — Casey=admin (full CRUD), Jake=rep (read all, write captures/activities/meetings) | `lib/auth.ts` | Jake can't delete accounts. Casey can |
| 8.6 | Add Zod validation to ALL API routes and Server Actions | `lib/validations.ts` | Bad input → 400 with field-specific error messages |
| 8.7 | Add rate limiting to email send endpoints — max 10/minute | `lib/rate-limit.ts`, email routes | 11th send → 429 "Too many emails. Try again in 60s" |
| 8.8 | Add `loading.tsx` to any route groups missing it | Remaining `app/*/loading.tsx` | Every page shows skeleton during load |
| 8.9 | Add `error.tsx` to any route groups missing it | Remaining `app/*/error.tsx` | Every page shows friendly error + retry |
| 8.10 | Build custom 404 page | `app/not-found.tsx` | Missing routes show branded 404 with nav |
| 8.11 | Remove ALL console.log from production code | All files | `grep -r "console.log" src/` returns 0 |
| 8.12 | Add `robots.txt` — disallow all (private app) | `public/robots.txt` | Bots blocked |
| 8.13 | Add OpenGraph meta tags for link previews | `app/layout.tsx` | Share URL → preview shows title + description |
| 8.14 | Performance audit — optimize bundle, lazy load heavy components, image optimization | Various | Lighthouse Performance > 90 |
| 8.15 | Micro-animations — page transitions, card hover lift, button press feedback, toast slide-in | `globals.css`, components | Subtle polish on all interactions |
| 8.16 | Keyboard shortcuts help dialog — "?" opens shortcut reference | `components/keyboard-shortcuts.tsx` | Press "?" → modal shows all shortcuts |
| 8.17 | Activity audit trail — log who changed what when (user ID + timestamp on all mutations) | Server Actions | Every write records user + timestamp |
| 8.18 | Kill Railway deployment — verify single Vercel endpoint | Terminal | Only modex-gtm.vercel.app active |
| 8.19 | Final build + deploy + smoke test all 16 pages + all write flows | — | Everything works. Ship it |

**Sprint 8 outcome:** Production Readiness 10/10. Auth, validation, rate limiting, error handling, polish, monitoring.

---

## Projected Score After All Sprints — 10/10 Target

| Dimension | Before | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | Final |
|-----------|--------|----|----|----|----|----|----|----|----|-------|
| UI/UX Design | 6 | 8 | 9 | 9 | 9 | 9 | 9 | 9 | 10 | **10** |
| Component Architecture | 5 | 9 | 9 | 9 | 10 | 10 | 10 | 10 | 10 | **10** |
| Information Architecture | 7 | 7 | 9 | 9 | 10 | 10 | 10 | 10 | 10 | **10** |
| Interactivity | 4 | 5 | 6 | 8 | 9 | 9 | 9 | 10 | 10 | **10** |
| Data Persistence | 2 | 2 | 2 | 9 | 9 | 9 | 9 | 9 | 10 | **10** |
| AI/Content Generation | 1 | 1 | 1 | 1 | 1 | 9 | 9 | 9 | 10 | **10** |
| Email/Outreach (2x) | 2 | 2 | 2 | 2 | 3 | 5 | 9 | 9 | 10 | **10** |
| Meeting Booking (2x) | 3 | 3 | 3 | 3 | 5 | 5 | 5 | 9 | 10 | **10** |
| Mobile Responsive | 6 | 8 | 8 | 9 | 9 | 9 | 9 | 9 | 10 | **10** |
| Production Readiness | 2 | 3 | 3 | 5 | 5 | 5 | 6 | 7 | 10 | **10** |
| **Weighted Total** | **3.6** | — | — | — | — | — | — | — | — | **10.0** |

---

## Execution Order

**Priority stack (highest meetings-per-dev-hour):**

1. **Sprint 1** — Design system. Foundation for everything.
2. **Sprint 2** — Rebuild pages. App becomes usable.
3. **Sprint 3** — Database + offline. Data persists. Pipeline tracking starts.
4. **Sprint 4** — Account Command Center. Prep for any account in 30 seconds.
5. **Sprint 5** — AI engine. Generate content for all 20 accounts instantly.
6. **Sprint 6** — Email sending. Actually reach out.
7. **Sprint 7** — Meeting booking + pipeline dashboard. Close the loop.
8. **Sprint 8** — Auth + hardening + 10/10 polish.

Sprints 4-6 can run in parallel if multiple agents are available. Sprint 7 depends on 5+6. Sprint 8 is always last.

---

## Dependencies

```
Sprint 1 (components) → Sprint 2 (pages) → Sprint 3 (database + offline)
                                                    ↓
                                          Sprint 4 (account center)
                                          Sprint 5 (AI) ──→ Sprint 6 (email)
                                                                   ↓
                                                           Sprint 7 (meetings + dashboard)
                                                                   ↓
                                                           Sprint 8 (auth + polish + 10/10)
```

---

## Environment Variables

```env
# Database (Neon free tier — pooled connection)
DATABASE_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/modex_gtm?sslmode=require

# AI
GEMINI_API_KEY=<active>

# Email
SENDGRID_API_KEY=<active>
SENDGRID_FROM_EMAIL=casey@freightroll.com

# Calendar
NEXT_PUBLIC_CALENDLY_LINK=https://calendly.com/jake-freightroll/mnfst

# Auth (Sprint 8)
NEXTAUTH_SECRET=<generate with openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=https://modex-gtm.vercel.app
```

---

## Success Metrics

| Metric | Before | After Sprint 3 | After Sprint 6 | After Sprint 8 |
|--------|--------|-----------------|-----------------|-----------------|
| Meetings booked from tool | 0 | 0 (no booking yet) | 0 (email sent, replies pending) | 5-10/week target |
| Emails sent from tool | 0 | 0 | 20+ accounts × 3 personas = 60+ | Tracked with opens/clicks |
| Pipeline visibility | None | Accounts + statuses | + email tracking | Full funnel dashboard |
| Mobile capture at MODEX | Broken | Works (DB) + offline buffer | Works | Works + PWA installed |
| Time to prep for account | 10+ min (switch tabs) | 2 min (all in one page) | 1 min (AI generates) | 30 sec (cached + keyboard) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| MODEX floor WiFi unreliable | Can't capture interactions | Sprint 3: localStorage offline queue + auto-sync |
| Neon free tier limits (0.5 GB) | DB full | 20 accounts + activities = ~50MB. Upgrade at $19/mo if needed |
| SendGrid free tier (100 emails/day) | Can't send all waves | 20 accounts × 3 personas = 60 emails. Under limit. Upgrade at scale |
| Gemini rate limits (60 RPM free) | AI generation throttled | Cache all generated content in DB. Regenerate only on request |
| Two deployments confuse users | Wrong URL, stale data | Sprint 8 kills Railway. Single Vercel URL only |
| Auth blocks quick field access | Jake can't capture fast | Auth is Sprint 8 (last). Ship features first |
| Persona emails missing | Can't send to some personas | Graceful fallback: "No email found. Copy DM instead →" |
