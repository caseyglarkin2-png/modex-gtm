# Modex RevOps OS — V2 Sprint Roadmap

> Generated: 2026-03-26
> Baseline Grade: **3.6 / 10** (weighted, meeting booking + email at 2x)
> Target Grade: **8.5 / 10**
> Goal: **Book meetings for Modex. Every feature serves that or gets cut.**

---

## Current State — Honest Assessment

| Dimension | Score | Gap |
|-----------|-------|-----|
| UI/UX Design | 6/10 | No design system, no animations, dense tables, no dark polish |
| Component Architecture | 5/10 | Copy-paste tables across 8 pages, no shared components |
| Information Architecture | 7/10 | Good waterfall but no cross-linking, no global search |
| Interactivity | 4/10 | Read-only everywhere except Mobile Capture (which doesn't save) |
| Data Persistence | 2/10 | Static JSON, zero API routes, zero writes |
| AI/Content Generation | 1/10 | Nothing. No Gemini, no drafting, no infographics |
| Email/Outreach | 2/10 | Can't send anything. Copy-paste only |
| Meeting Booking | 3/10 | Briefs exist but no booking flow, empty meetings page |
| Mobile Responsive | 6/10 | Sidebar breaks mobile, tables overflow |
| Production Readiness | 2/10 | No auth, no error handling, console.log in prod |

**Bottom line:** Beautiful whiteboard. Can't book a single meeting from it.

---

## Architecture Decisions (Locked)

- **Framework:** Next.js 16 + App Router (keep)
- **Styling:** Tailwind v4 + shadcn/ui components (add)
- **AI:** Gemini API for content generation (user's key: available)
- **Email:** SendGrid (user's key: available, from casey@freightroll.com)
- **Calendar:** Calendly link embed (user's link: available)
- **Database:** Neon PostgreSQL (free tier, publicly accessible — skip Railway Postgres headaches)
- **Auth:** NextAuth.js with Google OAuth
- **Deploy:** Vercel (primary) — single endpoint, kill Railway duplicate
- **Repo:** caseyglarkin2-png/modex-gtm (main branch)

### Available Credentials (from YardFlow project)
- `SENDGRID_API_KEY` — active, verified
- `SENDGRID_FROM_EMAIL` — casey@freightroll.com
- `GEMINI_API_KEY` — active
- `OPENAI_API_KEY` — active (backup)
- `CALENDLY_LINK` — https://calendly.com/jake-freightroll/mnfst

---

## Sprint Plan — 8 Sprints, Atomic Tasks

### SPRINT 1: Design System + Component Library
**Goal:** Replace copy-paste UI with A+ reusable components. Every page gets better overnight.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 1.1 | Install shadcn/ui CLI + init | `components.json`, `lib/utils.ts` | `npx shadcn@latest init` succeeds |
| 1.2 | Add Button component | `components/ui/button.tsx` | Import renders in browser |
| 1.3 | Add Card component | `components/ui/card.tsx` | Card renders with header/content/footer |
| 1.4 | Add Badge component | `components/ui/badge.tsx` | Replace 8 inline band-color maps |
| 1.5 | Add Table component | `components/ui/table.tsx` | Sortable headers, hover rows |
| 1.6 | Add Input + Textarea components | `components/ui/input.tsx`, `textarea.tsx` | Form inputs styled uniformly |
| 1.7 | Add Dialog/Modal component | `components/ui/dialog.tsx` | Opens/closes with overlay |
| 1.8 | Add Tabs component | `components/ui/tabs.tsx` | Tab switching works |
| 1.9 | Add Toast/Sonner notification | `components/ui/sonner.tsx` | Toast shows on action |
| 1.10 | Add Dropdown Menu component | `components/ui/dropdown-menu.tsx` | Menu opens on click |
| 1.11 | Add Skeleton loader component | `components/ui/skeleton.tsx` | Skeleton renders in place of content |
| 1.12 | Create `lib/constants.ts` | `lib/constants.ts` | BAND_COLORS, STATUS_COLORS, PRIORITY_COLORS exported |
| 1.13 | Create DataTable component (sortable, filterable) | `components/data-table.tsx` | Pass columns + data → renders sorted table |
| 1.14 | Create StatusBadge component | `components/status-badge.tsx` | Renders colored badge from status string |
| 1.15 | Create BandBadge component | `components/band-badge.tsx` | A=green, B=yellow, C=orange, D=gray |
| 1.16 | Create CopyButton component | `components/copy-button.tsx` | Click → copies text → shows ✓ feedback |
| 1.17 | Responsive sidebar — collapsible on mobile | `components/sidebar.tsx` | Hamburger menu on mobile, drawer nav |
| 1.18 | Update globals.css — elevation system, typography scale, transitions | `globals.css` | Shadow-sm/md/lg, font scale, transition classes |
| 1.19 | Dark mode toggle | `components/theme-toggle.tsx`, `app/layout.tsx` | Toggle switches theme, persists |
| 1.20 | Build passes, deploy to Vercel | — | `npm run build` exits 0, live site updated |

**Sprint 1 outcome:** Every page upgrades for free. Shared components eliminate 500+ lines of duplicate code.

---

### SPRINT 2: Rebuild All Pages with New Components
**Goal:** Every page uses DataTable, StatusBadge, BandBadge, CopyButton. Filters + sort on every table.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 2.1 | Rebuild Dashboard — stat cards with Card component, animated counters | `app/page.tsx` | Cards render with shadows, numbers animate |
| 2.2 | Rebuild Accounts table — DataTable with sort (score, band, status), filter (band, wave, owner) | `app/accounts/page.tsx` | Click column header → sorts. Filter chips work |
| 2.3 | Rebuild Account Detail — Tabs (Overview / Personas / Waves / Brief / Routes) | `app/accounts/[slug]/page.tsx` | Tab switching, less overwhelming layout |
| 2.4 | Rebuild Personas table — DataTable with filter (account, priority, lane) | `app/personas/page.tsx` | Filter by P1/P2, by account dropdown |
| 2.5 | Rebuild Waves page — timeline cards with progress indicators | `app/waves/page.tsx` | Wave progress bar shows % accounts contacted |
| 2.6 | Rebuild Briefs list — Card grid with search | `app/briefs/page.tsx` | Type account name → filters cards |
| 2.7 | Create Brief detail page (if missing) | `app/briefs/[slug]/page.tsx` | Full brief renders with all 10 sections |
| 2.8 | Rebuild Audit Routes — DataTable + CopyButton for URLs and messages | `app/audit-routes/page.tsx` | Copy URL, copy suggested message |
| 2.9 | Rebuild QR Assets — Card grid with copy + download | `app/qr/page.tsx` | Copy audit URL, visual QR placeholder |
| 2.10 | Rebuild Search Strings — keep filter, add DataTable sort | `app/search/page.tsx` | Sort by wave, priority. Existing copy works |
| 2.11 | Rebuild Intel — add status toggle (Open/Closed) | `app/intel/page.tsx` | Click toggle → visual state change (client only for now) |
| 2.12 | Rebuild Activities — timeline style with cards | `app/activities/page.tsx` | Activity cards with date, type, account, outcome |
| 2.13 | Rebuild Meetings — empty state with CTA | `app/meetings/page.tsx` | "No meetings yet. Start outreach →" links to waves |
| 2.14 | Rebuild Mobile Capture — better form with validation | `app/capture/page.tsx` | Required fields block submit, toast on success |
| 2.15 | Rebuild Queue — DataTable with action buttons | `app/queue/page.tsx` | Mark complete, update status (client only) |
| 2.16 | Add global search (Cmd+K) | `components/command-search.tsx` | Search accounts, personas, briefs by name |
| 2.17 | Build passes, deploy to Vercel | — | All pages render, no regressions |

**Sprint 2 outcome:** UI goes from 6/10 to 8/10. Every page has sort, filter, copy actions. Responsive mobile nav.

---

### SPRINT 3: Database + API Layer
**Goal:** Data persistence. Writes work. Mobile Capture saves. Activities log. Status updates persist.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 3.1 | Provision Neon PostgreSQL (free tier) | `.env.local` | `DATABASE_URL` set, connection verified |
| 3.2 | Update Prisma schema — add timestamps, indexes | `prisma/schema.prisma` | `npx prisma db push` succeeds |
| 3.3 | Run seed script to populate Neon DB | `scripts/seed.ts` | `npm run seed` inserts all records |
| 3.4 | Create `/api/captures` POST endpoint | `app/api/captures/route.ts` | POST with body → creates record → 201 |
| 3.5 | Create `/api/activities` POST endpoint | `app/api/activities/route.ts` | POST activity → saves → 201 |
| 3.6 | Create `/api/meetings` CRUD endpoints | `app/api/meetings/route.ts` | POST/GET/PUT/DELETE all work |
| 3.7 | Create `/api/accounts/[id]/status` PATCH endpoint | `app/api/accounts/[id]/status/route.ts` | PATCH status field → updates → 200 |
| 3.8 | Create `/api/personas/[id]/status` PATCH endpoint | `app/api/personas/[id]/status/route.ts` | PATCH persona_status → updates → 200 |
| 3.9 | Create `/api/intel/[id]/status` PATCH endpoint | `app/api/intel/[id]/status/route.ts` | Toggle open/closed → saves |
| 3.10 | Switch data.ts from JSON imports to Prisma queries | `lib/data.ts` | All pages load from DB instead of JSON |
| 3.11 | Wire Mobile Capture form to POST /api/captures | `app/capture/page.tsx` | Submit → saves to DB → toast success → appears in Queue |
| 3.12 | Wire Intel status toggle to PATCH endpoint | `app/intel/page.tsx` | Toggle → persists across refresh |
| 3.13 | Wire Account status updates to PATCH endpoint | `app/accounts/[slug]/page.tsx` | Change status dropdown → saves |
| 3.14 | Wire Persona status updates to PATCH endpoint | `app/personas/page.tsx` | Inline status edit → saves |
| 3.15 | Add loading states (Skeleton) to all data-fetching pages | All page files | Skeleton shows before data loads |
| 3.16 | Add error boundaries | `app/error.tsx`, `app/global-error.tsx` | Error renders friendly message, not crash |
| 3.17 | Set DATABASE_URL on Vercel env vars | Vercel dashboard | Build + deploy succeeds with DB |
| 3.18 | Build passes, deploy to Vercel | — | All pages load from Neon DB |

**Sprint 3 outcome:** Data persistence score goes from 2/10 to 8/10. Mobile Capture → Queue pipeline works end-to-end.

---

### SPRINT 4: Account Waterfall View
**Goal:** Single consolidated view per account. Waterfall from account → personas → wave → brief → outreach → meetings. One screen to prepare for any account.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 4.1 | Design Account Command Center layout | — | Wireframe: hero card + tabbed sections |
| 4.2 | Build Account hero card — name, band, score, tier, quick stats | `app/accounts/[slug]/page.tsx` | Hero card shows key metrics at glance |
| 4.3 | Build Personas tab — inline persona cards with contact actions | `components/account/personas-tab.tsx` | Shows persona cards with LinkedIn + email CTA |
| 4.4 | Build Outreach tab — wave status, channel mix, timeline | `components/account/outreach-tab.tsx` | Wave assignment, dates, suggested channels |
| 4.5 | Build Brief tab — full meeting brief inline | `components/account/brief-tab.tsx` | All 10 brief sections rendered |
| 4.6 | Build Routes tab — audit URL, QR, suggested messaging | `components/account/routes-tab.tsx` | Copy URL, copy message, view QR |
| 4.7 | Build Activity tab — timeline of all touches for this account | `components/account/activity-tab.tsx` | Shows activities + meetings chronologically |
| 4.8 | Build "Log Activity" dialog — quick-add from account page | `components/log-activity-dialog.tsx` | Select type, add notes → POST /api/activities |
| 4.9 | Build "Book Meeting" dialog — from account page | `components/book-meeting-dialog.tsx` | Select attendees, date, type → POST /api/meetings |
| 4.10 | Add "Send to Calendly" button — opens Calendly with pre-filled context | Account detail | Button opens Calendly link in new tab |
| 4.11 | Cross-link personas ↔ accounts ↔ waves ↔ briefs everywhere | All relevant pages | Click any entity → navigates to related |
| 4.12 | Build passes, deploy | — | Account Command Center fully functional |

**Sprint 4 outcome:** Account page becomes the war room. Everything about an account in one place. Reps never leave.

---

### SPRINT 5: Gemini AI Content Engine
**Goal:** Generate custom infographics, email drafts, DM copy, call scripts, and meeting prep per account. Like the Danone infographic — but for all 20 accounts.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 5.1 | Install @google/generative-ai SDK | `package.json` | Import works |
| 5.2 | Create `/api/ai/generate` POST endpoint | `app/api/ai/generate/route.ts` | POST prompt → returns Gemini response |
| 5.3 | Create AI prompt templates — email draft | `lib/ai/prompts.ts` | Template takes account + persona context → email |
| 5.4 | Create AI prompt templates — LinkedIn DM (short) | `lib/ai/prompts.ts` | 280-char DM with account context |
| 5.5 | Create AI prompt templates — LinkedIn DM (long) | `lib/ai/prompts.ts` | 1000-char DM with pain points |
| 5.6 | Create AI prompt templates — call script | `lib/ai/prompts.ts` | 60-second talk track with objection handling |
| 5.7 | Create AI prompt templates — meeting prep summary | `lib/ai/prompts.ts` | 1-page prep brief from account data |
| 5.8 | Create AI prompt templates — infographic content | `lib/ai/prompts.ts` | Structured content for visual infographic |
| 5.9 | Build "Generate Email" dialog on Account page | `components/ai/email-generator.tsx` | Select persona → pick tone → generate → edit → copy |
| 5.10 | Build "Generate DM" dialog on Persona row | `components/ai/dm-generator.tsx` | Click persona → generate DM → copy to clipboard |
| 5.11 | Build "Generate Call Script" on Account page | `components/ai/call-script-generator.tsx` | Generate → display as numbered steps |
| 5.12 | Build "Generate Meeting Prep" on Brief page | `components/ai/meeting-prep-generator.tsx` | Generate → display formatted prep doc |
| 5.13 | Build Account Infographic generator | `components/ai/infographic-generator.tsx` | Generate structured content → render as styled HTML card |
| 5.14 | Build Infographic preview + export | `components/ai/infographic-preview.tsx` | Render dark-themed infographic card (like Danone example) |
| 5.15 | Add "Regenerate" + "Edit" + "Copy" actions to all AI outputs | All ai/ components | User can tweak, regenerate, copy result |
| 5.16 | Add tone selector (formal / conversational / provocative) | AI dialogs | Tone changes output style |
| 5.17 | Add length selector (short / medium / long) | AI dialogs | Length controls output wordcount |
| 5.18 | Cache generated content in DB | `prisma/schema.prisma` (GeneratedContent model) | Regenerate or use cached version |
| 5.19 | Build passes, deploy | — | AI generation works on all 20 accounts |

**Sprint 5 outcome:** Content generation goes from 1/10 to 8/10. Every account gets custom infographic, email, DM, call script. Like the Danone one-pager — but generated for all 20 accounts in seconds.

---

### SPRINT 6: Email Sending + Outreach Engine
**Goal:** Send emails from the app. Bulk or 1:1. SendGrid integration. Templates. Tracking.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 6.1 | Install @sendgrid/mail SDK | `package.json` | Import works |
| 6.2 | Create `/api/email/send` POST endpoint | `app/api/email/send/route.ts` | POST with to/subject/body → sends → 200 |
| 6.3 | Create `/api/email/send-bulk` POST endpoint | `app/api/email/send-bulk/route.ts` | POST array of recipients → batch send |
| 6.4 | Create email template — warm intro request | `lib/email/templates.ts` | HTML template with account context |
| 6.5 | Create email template — cold outreach | `lib/email/templates.ts` | HTML template with pain point hook |
| 6.6 | Create email template — follow-up | `lib/email/templates.ts` | HTML template with previous context |
| 6.7 | Create email template — meeting confirm | `lib/email/templates.ts` | HTML template with meeting details |
| 6.8 | Build Email Composer dialog | `components/email/composer.tsx` | To/CC/Subject/Body + template picker + AI generate |
| 6.9 | Add "Email" action button on Persona rows | `app/personas/page.tsx` | Click → opens composer pre-filled with persona |
| 6.10 | Add "Email All P1" bulk action on Account page | `app/accounts/[slug]/page.tsx` | Select all P1 personas → compose bulk email |
| 6.11 | Wire AI email draft → Composer → Send | Composer + AI | Generate draft → edit in composer → send via SendGrid |
| 6.12 | Auto-log sent emails to Activities | `app/api/email/send/route.ts` | After send → create Activity record |
| 6.13 | Auto-update persona status to "Contacted" after send | `app/api/email/send/route.ts` | After send → PATCH persona status |
| 6.14 | Auto-update wave status to "In Progress" after first send | `app/api/email/send/route.ts` | After send → PATCH wave status |
| 6.15 | Build "Outreach History" on Account Activity tab | `components/account/activity-tab.tsx` | Shows email sends with date/recipient |
| 6.16 | Add SendGrid webhook for open/click tracking | `app/api/webhooks/sendgrid/route.ts` | Open event → update activity record |
| 6.17 | Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL on Vercel | Vercel env vars | Emails send from casey@freightroll.com |
| 6.18 | Build passes, deploy | — | Send email → recipient receives → activity logged |

**Sprint 6 outcome:** Email capability goes from 2/10 to 8/10. Reps compose AI-drafted emails, send via SendGrid, auto-log everything. Bulk outreach for waves.

---

### SPRINT 7: Meeting Booking + Calendar Flow
**Goal:** Book meetings from the app. Calendly embed. Meeting log. Pre/post-meeting workflow.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 7.1 | Build Meeting Booking dialog | `components/meeting/booking-dialog.tsx` | Select account, attendees, type, date → save |
| 7.2 | Add Calendly embed/link per account | `components/meeting/calendly-button.tsx` | "Book via Calendly" opens scheduling page |
| 7.3 | Build Meeting Log page — replace empty meetings table | `app/meetings/page.tsx` | DataTable with sort/filter, shows all meetings |
| 7.4 | Build Meeting Detail view | `app/meetings/[id]/page.tsx` | Shows attendees, brief, prep, outcome |
| 7.5 | Build Pre-Meeting Prep view | `components/meeting/prep-view.tsx` | AI-generated prep from brief + persona context |
| 7.6 | Build Post-Meeting Notes form | `components/meeting/notes-form.tsx` | Record outcome, next steps, attendee feedback |
| 7.7 | Auto-create follow-up activity after meeting | `app/api/meetings/route.ts` | Meeting saved → follow-up activity created |
| 7.8 | Dashboard — meeting pipeline chart | `app/page.tsx` | Funnel: Researched → Contacted → Replied → Meeting Booked → Meeting Held |
| 7.9 | Dashboard — meetings booked this week counter | `app/page.tsx` | Real-time count from DB |
| 7.10 | Dashboard — wave conversion rates | `app/page.tsx` | Wave 1: 6 accounts → X contacted → Y meetings |
| 7.11 | Add "Quick Book" button on Account Command Center | `app/accounts/[slug]/page.tsx` | 1-click → opens booking dialog pre-filled |
| 7.12 | Build passes, deploy | — | Full meeting lifecycle works |

**Sprint 7 outcome:** Meeting booking goes from 3/10 to 8/10. Book from account page, log outcome, track pipeline, see conversion.

---

### SPRINT 8: Auth + Production Hardening + Polish
**Goal:** Lock it down. Auth. Error handling. Performance. SEO. Monitoring.

| # | Task | Files | Validates |
|---|------|-------|-----------|
| 8.1 | Install next-auth | `package.json` | Import works |
| 8.2 | Configure Google OAuth provider | `app/api/auth/[...nextauth]/route.ts` | Google login flow works |
| 8.3 | Add session provider to layout | `app/layout.tsx` | Session available in all pages |
| 8.4 | Add middleware for route protection | `middleware.ts` | Unauthenticated → redirect to login |
| 8.5 | Build login page | `app/login/page.tsx` | Google sign-in button, branded |
| 8.6 | Add role-based access (admin vs rep) | `lib/auth.ts` | Casey=admin, Jake=rep |
| 8.7 | Protect all API routes with auth check | All `/api` routes | Unauthenticated → 401 |
| 8.8 | Add error.tsx to every route group | `app/*/error.tsx` | Errors show friendly UI |
| 8.9 | Add loading.tsx to every route group | `app/*/loading.tsx` | Loading skeleton per page |
| 8.10 | Add 404 not-found page | `app/not-found.tsx` | Custom 404 with navigation |
| 8.11 | Remove all console.log from production code | All files | No console output in prod |
| 8.12 | Add Zod validation to all API routes | `lib/validations.ts` | Bad input → 400 with message |
| 8.13 | Add rate limiting to email endpoints | `app/api/email/*/route.ts` | >10 sends/min → 429 |
| 8.14 | Add OpenGraph meta tags | `app/layout.tsx` | Social share preview works |
| 8.15 | Add robots.txt + sitemap | `public/robots.txt` | Bots blocked (private app) |
| 8.16 | Performance audit — bundle size, LCP, CLS | — | Lighthouse > 90 |
| 8.17 | Kill Railway deployment — single Vercel endpoint | Railway dashboard | Only modex-gtm.vercel.app active |
| 8.18 | Final build + deploy | — | Production-ready at modex-gtm.vercel.app |

**Sprint 8 outcome:** Production readiness goes from 2/10 to 8/10. Auth, validation, error handling, single endpoint.

---

## Projected Score After All Sprints

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| UI/UX Design | 6 | 9 | +3 |
| Component Architecture | 5 | 9 | +4 |
| Information Architecture | 7 | 9 | +2 |
| Interactivity | 4 | 8 | +4 |
| Data Persistence | 2 | 9 | +7 |
| AI/Content Generation | 1 | 8 | +7 |
| Email/Outreach (2x) | 2 | 9 | +7 |
| Meeting Booking (2x) | 3 | 8 | +5 |
| Mobile Responsive | 6 | 8 | +2 |
| Production Readiness | 2 | 8 | +6 |
| **Weighted Total** | **3.6** | **8.6** | **+5.0** |

---

## Execution Order — What to Build First

**Priority stack (highest meetings-per-dev-hour first):**

1. **Sprint 1** — Design system. Everything after this builds faster.
2. **Sprint 2** — Rebuild pages. Users can actually use the tool.
3. **Sprint 3** — Database. Data persists. Real pipeline tracking.
4. **Sprint 5** — AI content engine. Generate infographics + emails for all 20 accounts.
5. **Sprint 6** — Email sending. Actually reach out at scale.
6. **Sprint 4** — Account waterfall. Command center for each account.
7. **Sprint 7** — Meeting booking. Close the loop.
8. **Sprint 8** — Auth + hardening. Lock it down for production.

**Note:** Sprints 5 + 6 (AI + Email) are swapped ahead of Sprint 4 because they directly enable sending — the #1 gap. Account waterfall is nice but you can book meetings without it. You can't book meetings without email.

---

## Dependencies

```
Sprint 1 (components) → Sprint 2 (rebuild pages) → Sprint 3 (database)
                                                         ↓
                                               Sprint 4 (waterfall)
                                               Sprint 5 (AI) → Sprint 6 (email)
                                                                      ↓
                                                              Sprint 7 (meetings)
                                                                      ↓
                                                              Sprint 8 (auth + prod)
```

---

## Environment Variables Needed

```env
# Database (Neon free tier)
DATABASE_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/modex_gtm?sslmode=require

# AI
GEMINI_API_KEY=AIzaSyDiGM2RHSJlN_9a5OQn5IvvkrtSE1ehjCQ

# Email
SENDGRID_API_KEY=SG.oNV5UizTQJK1AwcwsIkHLQ...
SENDGRID_FROM_EMAIL=casey@freightroll.com

# Calendar
CALENDLY_LINK=https://calendly.com/jake-freightroll/mnfst

# Auth (Sprint 8)
NEXTAUTH_SECRET=<generate>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=https://modex-gtm.vercel.app
```

---

## Success Metric

**Before:** 0 meetings booked from this tool.
**After Sprint 6:** Send AI-drafted, persona-specific emails to all 20 accounts in under 30 minutes.
**After Sprint 7:** Track meetings booked, conversion by wave, pipeline velocity.
**Target:** 5-10 meetings booked per week using this tool.

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Neon free tier limits (0.5 GB) | Sufficient for 20 accounts + activities. Upgrade if needed ($19/mo) |
| SendGrid free tier (100 emails/day) | Sufficient for 20 accounts × 3-5 personas. Upgrade at scale |
| Gemini rate limits | Cache generated content in DB. Regenerate only on user request |
| Two endpoints confuse users | Sprint 8 kills Railway. Single Vercel URL |
| Auth blocks quick access | Sprint 8 is last. Ship features first, lock down after |
