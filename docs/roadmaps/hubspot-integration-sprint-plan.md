# HubSpot Integration Sprint Plan — YardFlow RevOps OS

> **Created:** 2026-04-11T10:00:00Z
> **Revised:** 2026-04-11T11:00:00Z (incorporated A+ review: 7/10 → 9/10)
> **Re-reviewed:** 2026-04-11 (second review: 7.7/10 B+ → incorporated all critical + high-priority fixes)
> **Reframed:** 2026-04-11 (MODEX-centric → year-round RevOps OS. Casey full-time at YardFlow.)
> **Context:** YardFlow RevOps OS — Casey's daily operating platform for year-round pipeline generation. MODEX 2026 follow-up is the first campaign, not the only one. Platform live at modex-gtm.vercel.app. casey@freightroll.com sole authenticated sender via Gmail API. HubSpot has 102K+ contacts in silo. yardflow.ai burned for sending but owned for hosting.
> **Timeline:** Sprint 0 starts immediately (MODEX week bridge tools ship first). Each sprint targets 1 week. Sprints 0-6 are Phase 1 (core RevOps pipeline). Sprint 7 is Phase 2 (deal tracking + year-round ops). Sprint 8 is Phase 3 (campaign engine).
> **Goal:** This is the platform Casey operates out of all day. HubSpot = system of record + alert engine. yardflow.ai = microsite hosting. Contact enrichment in-app. Every email, reply, and engagement flows through one unified pipeline. Every campaign — MODEX follow-up, Q3 outreach, trade shows, cold campaigns — runs through the same system.

---

## Architecture Decision: Why HubSpot

| Concern | Current State | With HubSpot |
|---------|---------------|--------------|
| Contact data | 222 personas in Prisma DB + 102K in CSV silo | HubSpot is source of truth. Prisma syncs from HubSpot |
| Reply detection | Manual Gmail checking | HubSpot timeline + webhook alerts to app |
| Send tracking | Email logs in DB, no open/click data | HubSpot engagement events (open, click, reply, bounce) |
| Deal pipeline | Meetings table with basic status | HubSpot deal stages with amount, close date, pipeline view |
| Contact enrichment | Offline CSV with scripts | In-app search + filter over HubSpot API with sync to DB |
| Alerts | None | HubSpot workflow triggers + webhook → app dashboard notification |
| Campaign management | Hardcoded waves tied to MODEX | Reusable campaigns with templates, scheduling, and multi-motion support |
| Daily operations | Ad-hoc scripts + spreadsheets | Unified dashboard Casey lives in all day |

**HubSpot Free CRM** covers contacts, companies, deals, email tracking, and basic workflows. Paid tiers add sequences and advanced automation but are not required for Sprints 0-6.

---

## Design Principle: Shoot from Anywhere

The app already has **6 distinct send surfaces** and rich inline editing. This plan **enhances every one of them** — it never consolidates sending into a single wizard or removes editability. The Sprint 6 OutreachWizard is one MORE way to send, not THE only way.

### Existing Send Surfaces (PRESERVE + ENHANCE)

| # | Surface | File | Send | Edit | AI Gen | What Changes |
|---|---------|------|------|------|--------|--------------|
| 1 | **Campaign Actions** | `waves/campaign/campaign-actions.tsx` | ✅ | ✅ inline subject/body | ✅ sequence gen | + HubSpot logging (via 3.2), + recipient-guard badge, + microsite URL injection |
| 2 | **Bulk Send Panel** | `waves/campaign/bulk-send-panel.tsx` | ✅ bulk | ✅ subject/body | ✅ AI draft | + HubSpot logging, + microsite URL button, + send status per recipient |
| 3 | **Studio** | `studio/studio-client.tsx` | ✅ | ✅ | ✅ | + HubSpot logging, + thread view after send |
| 4 | **Email Composer** | `components/email/composer.tsx` | ✅ | ✅ full editor | ✅ AI Draft button | + HubSpot logging, + microsite URL insert, + recipient-guard inline check |
| 5 | **One-Pager Preview** | `components/ai/one-pager-preview.tsx` | ✅ (via copy-to-composer flow) | ❌ (copy/download) | ✅ | + Clarification: "Send" action copies content into EmailComposer for editing + sending via Gmail. HubSpot logging applies when sent through Composer. Direct copy/download has no HubSpot tracking. |
| 6 | **Outreach Sequence** | `components/ai/outreach-sequence.tsx` | ✅ | ✅ inline per step | ✅ | + HubSpot logging, + microsite URL injection |

### New Send Surfaces (ADD)

| # | Surface | Sprint | Capability |
|---|---------|--------|------------|
| 7 | **Account Detail — per-persona send** | 3.8 | Quick-send button per persona row on `/accounts/[slug]` → opens EmailComposer pre-filled |
| 8 | **/contacts — send from row** | 5.2 | "Send Email" action on contact row → EmailComposer pre-filled with persona data |
| 9 | **Notification reply** | 2.5 | "Reply" button on reply notification → EmailComposer pre-filled with thread context |
| 10 | **/analytics/emails — resend/follow-up** | 3.3 | "Follow Up" action on email row → EmailComposer pre-filled as Re: thread |
| 11 | **OutreachWizard** | 6.1a-c | Multi-persona batch send with microsite generation (NEW, additive) |
| 12 | **Global Compose (Cmd+E)** | 3.9 | Floating compose button + keyboard shortcut → EmailComposer from any page |

### How It Works

All send surfaces route through **two API endpoints**: `/api/email/send` and `/api/email/send-bulk`. Sprint 3.2 upgrades the underlying `sendEmail()` function to automatically log to HubSpot Timeline. This means **every existing surface gets HubSpot logging for free** without touching their code. New surfaces reuse the same EmailComposer component with pre-filled data.

**Editability rule:** No send surface may remove inline editing. Every surface that shows email content must allow editing before send. The EmailComposer always has edit mode as default (not preview mode).

---

## Sprint 0: Pre-Flight (Ship This Week)

**Goal:** Establish infrastructure prerequisites. No feature work — just guardrails, monitoring, test scaffolding, and MODEX week bridge tools.
**Demo:** Sentry catches a test error. HubSpot API responds to auth check. Test email shows unsubscribe footer with valid HMAC. Feature flag disables HubSpot logging in dev. Test seed populates demo data. Reply-check script runs during MODEX.

### Tasks

#### 0.1 — Create HubSpot developer account + private app
- Register at developers.hubspot.com using casey@freightroll.com
- Create private app with scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.companies.read`, `crm.objects.companies.write`, `sales-email-read`, `crm.objects.deals.read`, `crm.objects.deals.write`
- **Note:** We use the **Emails Object API** (`/crm/v3/objects/emails`) for logging sends/replies — NOT the Timeline Events API (which requires custom event template registration). NOT the deprecated v1 Engagements API.
- Note access token
- **Validation:** `curl -H "Authorization: Bearer $TOKEN" https://api.hubapi.com/crm/v3/objects/contacts?limit=1` returns 200.

#### 0.2 — Add error logging with Sentry
- `npm install @sentry/nextjs`
- Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Add `SENTRY_DSN` to `.env.local` and Vercel env vars
- Wrap `instrumentation.ts` for server-side error capture
- **Test:** Throw test error → appears in Sentry dashboard within 60s.
- **Validation:** `npm run build` passes. Sentry project shows test event.

#### 0.3 — Create HubSpot API mock fixtures for tests
- Create `tests/mocks/hubspot.ts`
  - Mock responses: contacts list, contact get, contact create, company list, company get, company create, email object create (`/crm/v3/objects/emails`)
  - Include error responses: 429 rate limit, 401 auth failure, 400 bad request, 404 not found
- Create `tests/helpers/hubspot-mock.ts` — vitest mock factory for `@hubspot/api-client`
- **Test:** Import mock → `vitest.mock('@hubspot/api-client')` succeeds. Each fixture validates against HubSpot API schema.
- **Validation:** `npm run test:unit -- tests/mocks/hubspot.test.ts` passes.

#### 0.4 — Create test seed script for demo data
- Create `scripts/seed-test-data.ts`
  - `--contacts N` flag (default 50)
  - Seeds: accounts, personas (with hubspot IDs), email logs, activities, notifications
  - Idempotent: re-run without duplicates
- **Test:** Run twice → same row count.
- **Validation:** `npx tsx scripts/seed-test-data.ts --contacts 50` exits 0.

#### 0.5 — Data retention policy document
- Create `docs/data-retention-policy.md`
  - Contact data deleted after 12 months OR on opt-out
  - Unsubscribe mechanism documented (existing `/unsubscribe` page)
  - HubSpot data sync retention mirrors local policy
- **Validation:** Document exists and linked from README.

#### 0.6 — Email unsubscribe link ⚠️ COMPLIANCE — MOVED FROM SPRINT 6
- **BLOCKING — must ship before ANY further emails are sent.** Every outgoing email without an unsubscribe link is a CAN-SPAM violation.
- **Sub-tasks** (this is 4 units of work):
  - **(a) HMAC util + env var:** Create `src/lib/email/unsubscribe-token.ts` with `generateToken(email)` and `validateToken(email, token)`. Add `UNSUBSCRIBE_SECRET` to `.env.local` + Vercel env vars.
  - **(b) Footer injection in `sendEmail`/`sendBulk`:** Add footer with unsubscribe link to all outgoing emails. Use `NEXT_PUBLIC_MICROSITE_BASE_URL` with fallback to `modex-gtm.vercel.app`. Also update `buildEmailPreviewHtml()` in `src/components/email/composer.tsx`.
  - **(c) Unsubscribe page HMAC validation + CSRF:** Update `/api/unsubscribe` to validate HMAC token. Add CSRF protection (validate `Origin`/`Referer` header). **Backward-compat:** existing links without HMAC token must still work during transition period (log warning, process anyway for 60 days, then require HMAC).
  - **(d) Batch script template updates:** Update all `scripts/*.ts` email templates to include unsubscribe footer.
- **Test:** Unit: template has link with valid HMAC. Invalid token → rejected. Already-unsubscribed email → idempotent. Old-style link (no token) → accepted with deprecation warning during transition. Dannon/Danone domain → still blocked by recipient-guard. CSRF: request without valid Origin → rejected.
- **DONE WHEN:** (1) Every email sent via `sendEmail()`/`sendBulk()` includes unsubscribe footer, (2) `/unsubscribe` page processes valid HMAC tokens, (3) Old links work during transition, (4) HubSpot sync of `hs_email_optout` deferred to Sprint 3 (task 3.10).

#### 0.7 — Feature flags module
- Create `src/lib/feature-flags.ts`
  - `HUBSPOT_LOGGING_ENABLED` — gates HubSpot logging in `sendEmail()`/`sendBulk()`. Default: `true`. Flip to `false` to disable without revert.
  - `HUBSPOT_SYNC_ENABLED` — gates cron sync routes. Default: `true`.
  - `INBOX_POLLING_ENABLED` — gates inbox polling cron. Default: `true`.
  - Read from env vars. Type-safe. Logged on startup.
- **Test:** Unit: flag true → feature active. Flag false → skipped gracefully. Missing env var → default applied.
- **DONE WHEN:** (1) Module exports 3 flags, (2) `sendEmail()` checks flag before HubSpot call, (3) Cron routes check flag before polling/syncing.

#### 0.8 — Lightweight reply-check script (bridge until Sprint 2)
- Create `scripts/check-replies.ts` — simple Gmail API poll, outputs to console
- NOT a full feature — just a bridge until Sprint 2 reply detection is live
- Runnable manually: `npx tsx scripts/check-replies.ts`
- Lists: from, subject, snippet, received_at for unread replies in past 24h
- Uses existing Gmail OAuth token (`casey@freightroll.com`)
- **Immediate use:** Run during MODEX week (April 13-16) and daily after. Replaced by cron in Sprint 2.
- **Test:** Run → outputs any unread replies or "No new replies."
- **DONE WHEN:** (1) Script runs without error, (2) Casey can run it daily to check for replies.

#### 0.9 — Secret rotation procedure + CI update
- Create `docs/secret-rotation.md`: procedure for rotating `HUBSPOT_ACCESS_TOKEN`, `CRON_SECRET`, `HUBSPOT_WEBHOOK_SECRET`, `UNSUBSCRIBE_SECRET`
- Update `.github/workflows/e2e.yml` to include `npm run test:unit` step for HubSpot module tests
- **Test:** Document exists. CI workflow includes unit test step.
- **DONE WHEN:** (1) Rotation doc linked from README, (2) `npm run test:unit` runs in CI.

---

## Sprint 1: HubSpot API Foundation + Contact Sync

**Goal:** Connect to HubSpot, sync contacts bidirectionally, establish HubSpot as the contact system of record.
**Demo:** Open `/contacts` page → see HubSpot contacts with filter/search. Create a contact in the app → appears in HubSpot within 60s.

### Tasks

#### 1.1 — Install HubSpot SDK and configure auth
- **Dependency:** Requires Sprint 0.1 (HubSpot app + token)
- `npm install @hubspot/api-client`
- Create `src/lib/hubspot/client.ts` — singleton client using `HUBSPOT_ACCESS_TOKEN`
- **Note:** Private app tokens do NOT expire (unlike OAuth tokens). No refresh logic needed. Simplifies auth.
- Implement rate-limit-aware wrapper: if HubSpot returns 429, exponential backoff (60s + jitter, retry up to 3x). Log retries to Sentry.
- Add `HUBSPOT_ACCESS_TOKEN` and `HUBSPOT_PORTAL_ID` to `.env.local`, Vercel env vars
- **Test:** Unit: `getClient()` returns authenticated client (mock). Error: mock 429 → verify backoff + retry 3x then throw.
- **DONE WHEN:** (1) `npm run build` passes, (2) `getHubSpotClient()` importable from server component, (3) Rate-limit wrapper retries 3x then throws.

#### 1.2 — Create HubSpot contact sync module
- **Dependency:** Requires 1.1 (HubSpot client)
- Create `src/lib/hubspot/contacts.ts`
  - `hsGetContacts(filters?)` — Paginated search via CRM search API
  - `hsGetContactById(id)` — Single contact fetch
  - `hsCreateContact(data)` — Create with mapped fields
  - `hsUpdateContact(id, data)` — Update contact properties
- Map HubSpot → Prisma: `email`, `firstname`→`name`, `jobtitle`→`title`, `company`→`account_name`, `hs_lead_status`→`email_status`

**Field Mapping Reference (Contact ↔ Persona):**

| HubSpot Property | Prisma Field | Direction | Notes |
|-----------------|-------------|-----------|-------|
| `email` | `email` | ↔ | Primary dedup key |
| `firstname` + `lastname` | `name` | ↔ | Concat on pull, split on push |
| `jobtitle` | `title` | ↔ | |
| `company` | via Account.name | → | Lookup/create Account |
| `hs_lead_status` | `email_status` | ← | Map: "OPEN"→"pending", "IN_PROGRESS"→"sent" |
| `phone` | `phone` | ↔ | |
| `lifecyclestage` | `priority_band` | ← | Informational only |
| `hs_email_optout` | `do_not_contact` | ↔ | Sync both ways |

**HubSpot API Endpoints Used:**

| Task | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| 1.2 | `/crm/v3/objects/contacts/search` | POST | Paginated contact search |
| 1.2 | `/crm/v3/objects/contacts/{id}` | GET/PATCH | Single contact CRUD |
| 1.2 | `/crm/v3/objects/contacts` | POST | Create contact |
| 1.3 | `/crm/v3/objects/companies/search` | POST | Company search |
| 1.3 | `/crm/v3/objects/companies/{id}` | GET/PATCH | Single company CRUD |
| 2.7, 3.2 | `/crm/v3/objects/emails` | POST | Log email send/reply via Emails Object API (v3, NOT deprecated v1 Engagements, NOT Timeline Events API) |
| 3.6 | Webhook receiver | POST | HubSpot → app engagement events |
| 5.6 | `/crm/v3/properties/contacts` | POST | Create custom properties |
| 7.1 | `/crm/v3/objects/deals` | CRUD | Deal pipeline management |

- Check recipient-guard blocklist before any create/update
- **Test:** Unit test per function with mocked responses. Error tests: 429 → retry, 401 → auth error, malformed → graceful error.
- **Validation:** `npm run test:unit -- src/lib/hubspot/contacts.test.ts` passes.

#### 1.3 — Create HubSpot company sync module
- **Dependency:** Requires 1.1 (HubSpot client)
- Create `src/lib/hubspot/companies.ts`
  - `hsGetCompanies(filters?)` — Paginated company search
  - `hsGetCompanyById(id)` — Single with associated contacts
  - `hsCreateCompany(data)` — Create with mapped fields
  - `hsUpdateCompany(id, data)` — Update properties
- Map HubSpot → Prisma: `name`, `domain`, `industry`→`vertical`
- **Test:** Unit test per function with mocked responses. Error tests: 429, 401, 404, malformed.
- **Validation:** `npm run test:unit -- src/lib/hubspot/companies.test.ts` passes.

#### 1.4 — Add HubSpot IDs + indices to Prisma schema
- **Dependency:** None (schema-only, no code dependency)
- Add `hubspot_contact_id String? @unique` to `Persona` model
- Add `hubspot_company_id String? @unique` to `Account` model
- `@unique` creates index automatically (fast lookup + dedup enforcement)
- `npx prisma migrate dev --name add-hubspot-ids` (local), `npx prisma migrate deploy` (Railway production)
- **Test:** Migration succeeds. Query `WHERE hubspot_contact_id IS NULL` returns all existing rows.
- **DONE WHEN:** (1) `npx prisma studio` shows new columns, (2) Unique index exists on both fields, (3) Migration file committed.

#### 1.5a — Build HubSpot → DB sync script (core: fetch + upsert + DRY_RUN)
- **Dependency:** Requires 1.2, 1.3, 1.4 (all merged and deployed)
- Create `scripts/sync-hubspot-contacts.ts`
  - Fetch HubSpot contacts with ICP-relevant titles (VP, Director, C-suite, Head of, Manager)
  - Wrap in `prisma.$transaction()` per batch (100 contacts) for atomicity
  - Dedup: check both `email` AND `hubspot_contact_id` before create. If email exists but no HubSpot ID → link, don't duplicate.
  - Respect recipient-guard blocklist (skip @dannon.com, @danone.com, @bluetriton.com, etc.)
  - Log: created, updated, skipped, linked counts
- DRY_RUN mode by default
- **Test:** DRY_RUN=true → logged counts correct. Error: mock 100 contacts, 50th fails → transaction rolls back, 0 imported in that batch. **Dannon test: contact with @danone.com email → skipped, logged as "blocked by recipient-guard".**
- **DONE WHEN:** (1) DRY_RUN outputs correct counts, (2) DRY_RUN=false persists to DB, (3) `SELECT count(*) FROM "Persona" WHERE hubspot_contact_id IS NOT NULL` matches, (4) Dannon/Danone domains blocked.

#### 1.5b — Orphan detection ~~+ fuzzy matching~~
- **Dependency:** Requires 1.5a
- Extend sync script with:
  - Handle deletions: if Persona has `hubspot_contact_id` but contact not in HubSpot → set `do_not_contact = true`, log warning
  - ~~Name+company fuzzy match~~ → **DEFERRED to backlog.** Fuzzy matching (algorithm selection, confidence threshold tuning, false-positive testing) is an open-ended research task. Ship orphan detection first.
  - Exact-match linking only: if DB persona email matches HubSpot email but no `hubspot_contact_id` → auto-link.
  - Log: orphaned, linked counts
- **Test:** Mock: persona with hubspot_contact_id but contact deleted from HubSpot → flagged. Mock: DB persona with same email as HubSpot contact but no ID → auto-linked.
- **DONE WHEN:** (1) Orphans flagged with do_not_contact, (2) Exact-match links created, (3) No data loss.

#### 1.6 — Build DB → HubSpot push script
- **Dependency:** Requires 1.2, 1.3, 1.4
- Create `scripts/push-to-hubspot.ts`
  - For each Persona without `hubspot_contact_id`: search HubSpot by email first (dedup check). If exists → link. If not → create, store returned ID.
  - Same for Account ↔ Company
  - Associate contacts to companies in HubSpot
  - Check recipient-guard blocklist before push
- DRY_RUN mode by default
- **Test:** DRY_RUN output matches expected. Error: mock create failure → graceful skip, error logged.
- **Validation:** After push, HubSpot portal shows new contacts with correct company associations.

#### 1.7 — Create `/contacts` page (HubSpot-backed)
- **Dependency:** Requires 1.4 (schema), preferably 1.5 (data synced)
- Create `src/app/contacts/page.tsx` with `export const dynamic = 'force-dynamic'`
- DataTable: name, email, title, company, quality band, last activity, HubSpot link
- Filters: vertical, priority band, contact readiness, has email
- Search: full-text on name, email, company
- Row click → `/accounts/[slug]`
- Data source: Prisma personas table (synced from HubSpot)
- **Test:** Playwright: navigate to /contacts (seed data first), table renders, click filter → rows reduce.
- **Validation:** Loads < 2s with 200+ contacts. `force-dynamic` present.

#### 1.8 — Add HubSpot link to account detail page
- **Dependency:** Requires 1.4 (hubspot_company_id in schema)
- On `/accounts/[slug]`, add "View in HubSpot" button: `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/company/${hubspot_company_id}`
- Show sync status badge (last synced timestamp)
- **Test:** Playwright: account with hubspot_company_id → HubSpot link renders, href correct.
- **Validation:** Click → opens correct HubSpot company page.

---

## Sprint 2: Reply Detection + Inbox Alerts

**Goal:** Detect prospect replies to casey@freightroll.com. Surface in dashboard immediately.
**Demo:** Send test email → reply → refresh dashboard → "Reply from [Name]" alert card with preview.

### Tasks

#### 2.1 — Add Gmail readonly scope to OAuth flow ⚠️ BLOCKING
- **Dependency:** None. Must deploy BEFORE tasks 2.2-2.7.
- Update `src/app/api/auth/[...nextauth]/route.ts` — add `https://www.googleapis.com/auth/gmail.readonly`
- Update Google Cloud Console scopes (Clawbot project)
- Re-auth Casey → capture updated refresh token
- Test token rotation: simulate expiry → verify auto-refresh. Stale token → Sentry error.
- **Test:** After re-auth, `gmail.users.messages.list` returns 200. Scope present in introspection.
- **Validation:** Updated `GOOGLE_REFRESH_TOKEN` in Vercel production env. Old token revoked gracefully.

#### 2.2 — Gmail API inbox polling module
- **Dependency:** Requires 2.1 (gmail.readonly scope deployed)
- Create `src/lib/email/gmail-inbox.ts`
  - `getRecentReplies(sinceTimestamp)` — Gmail API `users.messages.list` with `in:inbox is:unread after:{timestamp}`
  - `getMessageDetail(messageId)` — Full message fetch
  - `extractReplyMetadata(message)` — Parse: from, subject, snippet, thread_id, received_at
  - `markAsProcessed(messageId)` — Add label "RevOps-Processed"
- Uses `casey@freightroll.com` Gmail OAuth token only
- **Test:** Unit with mocked Gmail responses. Error: mock 503 → graceful failure logged to Sentry.
- **Validation:** `npx tsx scripts/test-inbox-poll.ts` logs recent unread replies.

#### 2.3 — Create `Notification` + `SystemConfig` tables in Prisma schema
- **Dependency:** None (schema-only)
- Model: `Notification` — `id`, `type` (reply | open | click | bounce | meeting_booked | hot_engagement), `account_name`, `persona_email`, `subject`, `preview`, `source_id`, `read` (boolean), `created_at`
- Model: `SystemConfig` — `key String @id`, `value String`, `updated_at DateTime @updatedAt`. Used for cron cursors (`last_inbox_poll`, `last_hubspot_sync`), counters, and system state. Replaces abusing GeneratedContent with `__system__` account_name.
- `npx prisma migrate dev --name add-notification-and-system-config`
- **Test:** Create + query a Notification record. Create + update a SystemConfig record via Prisma.
- **Validation:** `npx prisma studio` shows both tables.

#### 2.4 — Build inbox polling cron route
- **Dependency:** Requires 2.2 (polling module), 2.3 (Notification model)
- Create `src/app/api/cron/check-inbox/route.ts`
  - GET with `CRON_SECRET` auth (Zod validation)
  - Call `getRecentReplies()` with last poll timestamp (stored in `SystemConfig` key `last_inbox_poll`)
  - For each reply: create Notification, create Activity (type: "reply_received"), update Persona `email_status` → "replied"
  - Update poll timestamp in SystemConfig
  - Graceful degradation: Gmail fails → log to Sentry, skip cycle. Alert after 3 consecutive failures.
  - Check feature flag `INBOX_POLLING_ENABLED` (0.7) before polling.
- Add to `vercel.json`: `{ "path": "/api/cron/check-inbox", "schedule": "*/5 * * * *" }`
- **Test:** Unit: mock Gmail → Notification created, Activity logged, timestamp updated. Error: mock 503 → skip, error count incremented. **Edge case: `last_inbox_poll` key missing (first run) → poll from 24h ago. Corrupt value → fallback to 24h ago + Sentry warning.**
- **Validation:** Manual trigger via curl → 200 with results.

#### 2.5 — Notification bell + dropdown with reply action
- Create `src/components/notification-bell.tsx` (client component)
  - Fetch unread count via API
  - Bell icon with red badge
  - Click → dropdown with notification cards
  - Click card → mark read, navigate to account
  - **"Reply" button on reply-type notifications** → opens EmailComposer pre-filled with: to = reply sender, subject = "Re: {original subject}", body empty (cursor ready). Thread context preserved.
- Create `src/app/api/notifications/route.ts` — GET (list) + PATCH (mark read). Zod on PATCH.
- **Test:** Playwright: bell shows count. Click → dropdown. Click notification → navigates. Click "Reply" → EmailComposer opens pre-filled.
- **Validation:** After reply detected, bell shows "1" within 5 min. Reply button opens composer with correct pre-fill.

#### 2.6 — "Recent Replies" card on dashboard
- On `/`, add card with 5 most recent reply notifications
- Empty state: "No replies yet. Keep sending."
- **Test:** Playwright: dashboard loads, replies card renders (or empty state).
- **Validation:** Reply detected → card shows on refresh.

#### 2.7 — HubSpot email object for replies
- **Dependency:** Requires 1.1 (HubSpot client), 1.2 (contacts module)
- On reply detection, create Email Object via `POST /crm/v3/objects/emails` with `hs_email_direction: INCOMING_EMAIL`. Associate to contact via `/crm/v4/objects/emails/{id}/associations/contacts/{contactId}`.
- **NOT Timeline Events API** (requires custom event template registration). **NOT deprecated v1 Engagements API.**
- **Test:** Unit: mock Email Object create + association. Verify payload structure matches HubSpot v3 schema.
- **Validation:** Reply detected → HubSpot contact timeline shows incoming email event.

---

## Sprint 3: Send Tracking Dashboard + HubSpot Email Logging

**Goal:** Unified email activity view. Every send logged to DB and HubSpot. Opens, clicks, bounces tracked.
**Demo:** `/analytics/emails` shows all sends with status. Click row → thread history. Dashboard cards show rates.

### Tasks

#### 3.1 — Enhance EmailLog model
- **Dependency:** None (schema-only)
- Add: `hubspot_engagement_id String?`, `thread_id String?`, `reply_count Int @default(0)`, `template_version Json?`
- `npx prisma db push`
- **Test:** Existing queries work. New fields default correctly.
- **Validation:** `npx prisma studio` shows updated columns.

#### 3.2 — Log sends to HubSpot automatically (ALL SURFACES)
- **Dependency:** Requires 3.1, Sprint 1.1, 1.2, 1.4
- In `sendEmail()` and `sendBulk()` (src/lib/email/client.ts): after Gmail send, create Email Object via `POST /crm/v3/objects/emails` with `hs_email_direction: FORWARDED_EMAIL`, subject, body text. Associate to contact via `/crm/v4/objects/emails/{id}/associations/contacts/{contactId}`.
- Check feature flag `HUBSPOT_LOGGING_ENABLED` (0.7) before HubSpot call.
- **This single change gives all 6 existing send surfaces HubSpot logging for free** — Campaign Actions, Bulk Send Panel, Studio, EmailComposer, One-Pager Preview, Outreach Sequence all route through these two functions.
- Match to HubSpot contact by email (lookup `hubspot_contact_id` on Persona). Not found → log warning (don't block send)
- Store email object ID in `EmailLog.hubspot_engagement_id`
- `casey@freightroll.com` sender only. Recipient-guard checked.
- **No changes to existing UI code.** The upgrade is transparent.
- **Test:** Unit: mock Gmail + HubSpot calls. Both succeed. Error: HubSpot fails → email still sent, warning logged. Feature flag off → HubSpot skipped. Integration: send from EmailComposer → verify HubSpot email object created.
- **Validation:** Send from Studio → HubSpot timeline shows event. Send from Campaign → same. Send from Composer → same.

#### 3.3 — Rebuild `/analytics/emails` with full tracking + row actions
- **Dependency:** Requires 3.1
- `export const dynamic = 'force-dynamic'`
- DataTable: date, to (persona + account), subject, status, opened_at, replied, HubSpot link
- Filters: status, account, date range. Sort by date.
- Row click → email detail modal with thread view (3.4)
- **Row actions dropdown:** "Follow Up" → opens EmailComposer pre-filled as Re: thread (preserves subject, adds "Re:" prefix, includes thread_id for Gmail threading). "Resend" → opens EmailComposer with original subject/body for editing. "Copy" → clipboard.
- All row actions open EmailComposer with full edit capability — never auto-send.
- **Test:** Playwright: page loads (seed data), table has rows, filter reduces rows. Click "Follow Up" → composer opens with Re: subject.
- **Validation:** Count matches `SELECT count(*) FROM "EmailLog"`. force-dynamic present. Follow-up sends thread correctly.

#### 3.4 — Email thread view component
- **Dependency:** Requires 3.1 (thread_id)
- Create `src/components/email-thread.tsx`
- Given thread_id: fetch EmailLog + reply notifications. Conversation view. Timestamps + status badges.
- **Test:** Unit: mock thread data (1 msg, 3 msgs, 0 msgs) → correct output.
- **Validation:** Renders in email detail modal.

#### 3.5 — Backfill existing EmailLog records to HubSpot
- **Dependency:** Requires 3.2, Sprint 1.5
- Create `scripts/backfill-hubspot-email-logs.ts`
- For each EmailLog without `hubspot_engagement_id`: create HubSpot event, store ID. Skip if contact not found.
- DRY_RUN default
- **Test:** DRY_RUN shows expected match/skip.
- **Validation:** After run, populated `hubspot_engagement_id` count matches.

#### 3.6 — HubSpot webhook receiver for engagement events
- **Dependency:** Requires 0.1 (HubSpot dev account for webhook config)
- Create `src/app/api/webhooks/hubspot/route.ts`
  - Validate `X-HubSpot-Signature-v3` against `HUBSPOT_WEBHOOK_SECRET`. Reject unsigned → 403. **Note:** v3 signature requires raw request body (not parsed JSON) + request URI for HMAC computation. Use `export const dynamic = 'force-dynamic'` + `await request.text()` before `JSON.parse()`.
  - **Dedup:** Check `WebhookEvent` table by event ID before processing. HubSpot sends duplicate webhooks. Skip if already processed.
  - Zod validation on body
  - Handle: `email.open`, `email.click`, `email.bounce`, `email.reply`
  - Hard bounce (550/551) → Persona `email_status = 'hard_bounce'`, `do_not_contact = true`
  - Update EmailLog fields. Create Notifications for opens/replies.
  - Rate limit: 100 events/min
  - Dead letter: fails → store raw event in GeneratedContent (type: `webhook_dead_letter`) for replay. **Note:** Dead letter payloads may contain PII (email, name). Access restricted to admin. Consider encrypting at rest if volume grows.
- Register webhook in HubSpot portal (manual — document with screenshots)
- Add `HUBSPOT_WEBHOOK_SECRET` to env vars
- **Test:** Unit: mock payloads per event type → correct DB updates. Invalid signature → 403. Malformed → 400. **Duplicate event ID → skipped (200).** Dead letter stored on processing failure.
- **Validation:** Send → open → webhook fires → `opened_at` populated. Webhook registered before sprint done.

#### 3.7 — Email analytics cards on dashboard
- On `/`: "Emails Sent" (total/week/today), "Open Rate", "Reply Rate", "Bounce Rate"
- `dbGetEmailStats()` helper in db.ts
- **Test:** Playwright: dashboard shows stat cards.
- **Validation:** Numbers match DB queries.

#### 3.8 — Per-persona send button on account detail page
- **Dependency:** Requires 3.2 (HubSpot logging active)
- On `/accounts/[slug]` Personas tab: add "Send Email" icon button per persona row
- Click → opens existing EmailComposer component pre-filled: to = persona.email, subject auto-generated from account context, body empty
- Preserve all existing editing in EmailComposer (full subject/body edit, AI Draft button, preview toggle)
- Show recipient-guard status badge inline (green = clear, red = blocked, yellow = unsubscribed)
- **Test:** Playwright: click send icon on persona row → EmailComposer opens with pre-filled to/subject. Edit body → send → logged.
- **Validation:** Email appears in /analytics/emails + HubSpot. Existing account page editing (status, notes) unchanged.

#### 3.9 — Global compose button + keyboard shortcut (Ctrl+Shift+E)
- Create `src/components/global-compose-button.tsx` (client component)
  - Floating action button (bottom-right) visible on all internal app pages
  - Click or **Ctrl+Shift+E** (Mac: Cmd+Shift+E) → opens EmailComposer dialog. (Note: Ctrl+E is consumed by Chrome address bar on Linux — cannot use.)
  - If on an account page: pre-fill account context. Otherwise: blank compose.
  - **Empty email guard:** If persona has no email address, show warning and disable Send button. Recipient-guard check runs on composer open.
  - Full edit mode by default (not preview). AI Draft button available.
- Add to `src/app/layout.tsx` (inside auth check — only for logged-in users)
- **Test:** Playwright: navigate to dashboard → Ctrl+Shift+E → composer opens. Navigate to /accounts/general-mills → Ctrl+Shift+E → composer pre-fills account. Open composer with persona missing email → Send disabled.
- **Validation:** Compose from any page → email sends and logs correctly.

#### 3.10 — Sync `hs_email_optout` on unsubscribe (bridges 0.6 → HubSpot)
- **Dependency:** Requires Sprint 1.2 (HubSpot contacts module), task 0.6 (unsubscribe page)
- When `/api/unsubscribe` processes a valid unsubscribe: call `hsUpdateContact(hubspot_contact_id, { hs_email_optout: true })`.
- Not found in HubSpot → skip gracefully (don't block unsubscribe).
- **Test:** Unit: unsubscribe with HubSpot contact → updated. Without HubSpot contact → skipped. HubSpot API failure → unsubscribe still processed locally.
- **Validation:** Unsubscribe → HubSpot contact shows opted out.

#### 3.11 — Migrate CLI batch scripts to use `sendEmail()` for HubSpot logging
- **Dependency:** Requires 3.2 (HubSpot logging in sendEmail)
- Scripts `scripts/touch3.ts`, `scripts/touch4.ts`, `scripts/follow-up.ts`, `scripts/monday-bump.ts` currently use Resend API directly.
- Migrate to import and call `sendEmail()` from `src/lib/email/client.ts` (which uses Gmail API + logs to HubSpot).
- If full migration is too disruptive: add a separate `logToHubSpot(emailData)` call after each Resend send as a bridge.
- **Test:** DRY_RUN: script outputs expected recipients. Send 1 test → appears in HubSpot.
- **Validation:** All CLI-sent emails show up in `/analytics/emails` and HubSpot.

#### 3.12 — Daily pipeline digest email (pulled from Sprint 7)
- **Dependency:** Requires 3.1 (EmailLog enhancements), 2.3 (Notification model)
- Create `src/app/api/cron/daily-digest/route.ts` — GET with CRON_SECRET
- `vercel.json`: `"schedule": "0 12 * * *"` (7am ET = 12:00 UTC)
- Content: yesterday's sends count, opens, replies, bounces, hot engagements. Top 3 engaged accounts. Pending follow-ups.
- Self-send to `casey@freightroll.com` via `sendEmail()` (logs to HubSpot as internal note).
- **Humanization:** No em dashes. Short sentences. Plain text with minimal HTML.
- **Test:** Unit: mock stats → email body contains correct numbers. No em dashes in output.
- **Validation:** Cron fires → Casey receives morning summary email.

---

## Sprint 4: yardflow.ai Microsite Hosting

**Goal:** Microsites on yardflow.ai. Internal app stays on modex-gtm.vercel.app.
**Demo:** yardflow.ai/for/general-mills loads microsite. modex-gtm.vercel.app/accounts still works.

**Can run in parallel with Sprints 2-3.**

### Tasks

#### 4.1 — Add yardflow.ai as Vercel custom domain
- **Dependency:** None (parallel with anything)
- `vercel domains add yardflow.ai`
- Cloudflare DNS: A → `76.76.21.21`, CNAME www → `cname.vercel-dns.com`
- Coordinate with Chris Marinic (Cloudflare admin)
- TTL to 300s before change. Verify: `dig yardflow.ai` → Vercel IP before proceeding.
- **Rollback:** Revert Cloudflare records (< 5 min)
- **Test:** `dig yardflow.ai` resolves. `curl -I https://yardflow.ai` → 200.
- **Validation:** Vercel dashboard shows verified domain. Demo fallback: preview URL if DNS slow.

#### 4.2 — Domain-based routing in middleware
- **Dependency:** Requires 4.1 (domain verified)
- **⚠️ ARCHITECTURE NOTE:** Current `middleware.ts` exports `auth as middleware` from NextAuth. This IS the auth layer. Domain-based routing requires composing a custom middleware that:
  1. Reads `request.headers.get('host')`
  2. For `yardflow.ai`: skip auth entirely, enforce path allowlist (`/for/*`, `/unsubscribe`, `/api/webhooks/*`, `/_next/static/*`). All else → 404.
  3. For `modex-gtm.vercel.app` (and localhost): delegate to NextAuth `auth()` middleware as before.
- Implementation pattern: `export default function middleware(request) { if (isPublicDomain(host)) return handlePublicRoutes(request); return auth(request); }`
- **Rollback:** Revert to `export { auth as middleware }` (single line change).
- **Test:** Unit: mock headers for both domains. `yardflow.ai` + `/for/general-mills` → 200 (no auth). `yardflow.ai` + `/accounts` → 404. `modex-gtm.vercel.app` + `/accounts` → auth check. Internal host + `/for/*` → auth check (authenticated preview).
- **Validation:** `curl yardflow.ai/for/general-mills` → 200. `curl yardflow.ai/accounts` → 404.

#### 4.3 — Update microsite URLs in templates + inject into editing surfaces
- **Dependency:** Requires 4.1
- Use `NEXT_PUBLIC_MICROSITE_BASE_URL=https://yardflow.ai` env var
- Replace hardcoded `modex-gtm.vercel.app/for/` everywhere. **Run `grep -r 'modex-gtm.vercel.app/for/' src/ scripts/` to enumerate all files.** Known locations:
  - `src/lib/microsites/` — microsite URL generation
  - `src/components/email/composer.tsx` — email templates
  - `src/components/ai/outreach-sequence.tsx` — sequence step templates
  - `scripts/touch*.ts`, `scripts/follow-up.ts` — batch script templates
  - Any AI prompt that includes a URL template
- **Enhance existing editing surfaces with microsite URL insert button:**
  - `EmailComposer` (components/email/composer.tsx): add "Insert Microsite Link" button next to AI Draft button. If account context available, auto-generates `yardflow.ai/for/[slug]`. Otherwise, shows account picker.
  - `Campaign Actions` (waves/campaign/campaign-actions.tsx): inline edit per step gets "Insert Link" icon that pastes microsite URL at cursor.
  - `Bulk Send Panel` (waves/campaign/bulk-send-panel.tsx): body editor gets same "Insert Link" button.
  - `Outreach Sequence` (components/ai/outreach-sequence.tsx): per-step editor gets microsite URL insertion.
  - `Studio` (studio/studio-client.tsx): step editor gets microsite URL insertion.
- All existing inline editing preserved — buttons are additive, never replace text editing.
- **Test:** Unit: template renders yardflow.ai. Grep → zero old URLs. Playwright: open EmailComposer → click Insert Microsite → URL appears in body at cursor position.
- **Validation:** AI-generated email has `yardflow.ai/for/[account]` link. No em dashes. Insert button works on all 5 editing surfaces.

#### 4.4 — yardflow.ai landing page
- `/for` from yardflow.ai: branded landing, no account list (security)
- `/for` from internal app: full account list (existing)
- **Test:** Playwright: yardflow.ai host → landing, no slugs. Internal → account list.
- **Validation:** `curl yardflow.ai/for/` body has no account slugs.

#### 4.5 — Track source domain on engagement
- Add `source_domain String?` to `MicrositeEngagement`. `npx prisma db push`.
- Capture request host in logging.
- **Test:** yardflow.ai visit → `source_domain = 'yardflow.ai'`.
- **Validation:** Both domains show correct values in DB.

#### 4.6 — Security headers
- **Dependency:** Requires 4.1
- `next.config.ts` headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000`, CSP
- **Test:** `curl -I yardflow.ai/for/general-mills` → headers present.
- **Validation:** SSL Labs → A rating.

#### 4.7 — Redirect unauthenticated microsite access
- Middleware: unauthenticated `modex-gtm.vercel.app/for/*` → 301 to `yardflow.ai/for/*`
- Authenticated → no redirect (preview access)
- **Test:** Unit: unauthenticated /for/general-mills → 301. Authenticated → pass.
- **Validation:** Incognito → redirects.

---

## Sprint 5: Contact Enrichment In-App

**Goal:** Surface HubSpot contacts in-app. Filter by ICP. Pick targets without spreadsheets.
**Demo:** /contacts → filter CPG + VP → 50 results → "Add to Wave 2" → persona + wave created. Click "Send Email" on contact row → EmailComposer opens → send → logged.

**Dependency:** Requires Sprint 1 complete.

### Tasks

#### 5.1 — HubSpot contact search with ICP filters
- Extend `src/lib/hubspot/contacts.ts`:
  - `hsSearchContacts(query)` — Full-text by name/email/company
  - `hsFilterContacts(filters)` — CRM filter groups (title, industry, lifecycle)
- Paginated (100/page). Rate-limit aware.
- **Test:** Unit with mocked search responses.

#### 5.2 — Enhance /contacts with search + import + send
- `export const dynamic = 'force-dynamic'`
- Search bar → HubSpot via server action. Faceted filters. "In DB" badge. "Import" button → Persona created.
- **"Send Email" action per row** → opens EmailComposer pre-filled with contact email + account context. If contact not yet in DB, auto-imports first then opens composer.
- Recipient-guard check before import AND before send (badge per row: green/red/yellow).
- **Test:** Playwright: search → result. Import → appears in /personas. Click "Send Email" → composer opens with correct pre-fill.
- **Validation:** Import 5 → all in DB with hubspot_contact_id. Send from row → logged. force-dynamic present.

#### 5.3 — Bulk import API with scoring + dedup
- Create `src/app/api/contacts/import/route.ts`
  - POST with Zod validation. Accept HubSpot contact IDs.
  - Fetch, score, create Persona + Account link
  - Dedup: check email + hubspot_contact_id. Existing → link. Name+company fuzzy match → prompt merge.
  - Recipient-guard blocklist
  - Return: imported, skipped, blocked, merged, errors
- **Test:** Unit: 5 mocks (2 new, 1 existing, 1 blocked, 1 error) → correct counts.

#### 5.4 — "Add to Wave" action
- DataTable dropdown → Server Action creates OutreachWave. If no Account → create from HubSpot first.
- Toast + `revalidatePath('/waves')`
- **Test:** Playwright: click Add to Wave 2 → toast → /waves shows account.

#### 5.5 — Contact quality scoring
- Create `src/lib/contact-scoring.ts`
  - Title seniority (25%), email confidence (25%), company ICP (25%), completeness (25%)
  - Output: quality_score (0-100), quality_band (A/B/C/D)
- **Test:** VP + verified email + CPG → A. Manager + guessed + non-ICP → C/D.

#### 5.6 — Custom HubSpot properties for ICP
- Create: `yardflow_icp_score` (number), `yardflow_contact_readiness` (enum A-D), `yardflow_sent_outreach` (boolean)
- Push from Prisma during sync
- **Test:** Script creates properties. Update contact → visible in HubSpot.

#### 5.7 — Scheduled bidirectional sync (cron)
- Create `src/app/api/cron/sync-hubspot/route.ts` — GET with CRON_SECRET (Zod)
- Pull: updated contacts → upsert. Push: local updates → HubSpot.
- Graceful degradation: fail → Sentry log, retry next cycle. Alert after 3 failures.
- `vercel.json`: `"schedule": "0 */6 * * *"` (every 6h)
- **Test:** Unit: mock HubSpot → verify upsert for new/updated/deleted.

#### 5.8 — MobileCapture → HubSpot sync script
- **Dependency:** Requires 1.2 (HubSpot contacts module)
- Create `scripts/sync-mobile-captures.ts`
  - For each MobileCapture record: search HubSpot by email (if present) or name+company. Not found → create contact. Found → update with capture data.
  - Create associated Persona record if not exists. Link `hubspot_contact_id`.
  - Mark MobileCapture as synced (`synced_at` timestamp).
- DRY_RUN mode by default
- **Post-MODEX priority:** Mobile captures from booth visits are the hottest leads. Run this immediately after MODEX. This pattern repeats for every trade show or event — the script is campaign-agnostic.
- **Test:** DRY_RUN shows expected match/create/skip. Mock: capture with email → linked. Capture without email → created by name+company.
- **DONE WHEN:** All MobileCapture records have corresponding Persona + HubSpot contact.

---

## Sprint 6: Microsite-to-Email Automation Loop

**Goal:** One-click: microsite → email → send → track → alert. Foundation for repeatable campaign execution.
**Demo:** Account page → "Launch Outreach" → wizard → emails in HubSpot → microsite visit triggers notification. Works for MODEX follow-up today, any campaign tomorrow.

**Dependency:** Requires Sprints 1, 3, 4.

### Tasks

#### 6.1a — OutreachWizard UI shell (Steps 1-2) — ADDITIVE
- `/accounts/[slug]` "Launch Outreach" button → dialog. **This is additive** — the existing per-persona send buttons (3.8), EmailComposer (any page), Campaign Actions, Bulk Send Panel, and Studio all continue to work independently.
- Step 1: Select personas (checkboxes, recipient-guard status per persona)
- Step 2: Verify/generate microsite (show URL preview)
- **Test:** Playwright: click → wizard opens, select personas, proceed. Existing send buttons still work alongside.

#### 6.1b — Email preview + inline edit (Step 3)
- **Dependency:** Requires 6.1a
- AI-generated email per persona. Microsite link injected naturally.
- Inline edit subject + body. "Regenerate" button.
- Humanization rules: no em dashes, short sentences, contractions.
- MODEX urgency: reference dates when within 30 days of event.
- **Campaign-context-aware:** AI content adapts to the active campaign context (MODEX follow-up, Q3 prospecting, etc.) — not hardcoded to MODEX. Pull campaign name, key dates, and messaging angle from the Campaign record (Sprint 8) or fallback to manual context.
- Store final version in `EmailLog.template_version` (audit trail)
- **Test:** Playwright: preview renders, edit persists, regenerate works. No em dashes.

#### 6.1c — Batch send logic (Step 4)
- **Dependency:** Requires 6.1b, Sprint 3.2 (HubSpot logging)
- Send via Gmail API (`sendBulk`, casey@freightroll.com only)
- Log to EmailLog + HubSpot timeline
- Create Activity per send (Server Action)
- Update Persona status + OutreachWave status
- Progress bar. Rate limit 10/min.
- Recipient-guard check per send.
- **Test:** Unit: mock 3 sends → all logged. Error: 1 fails → 2 still sent.

#### 6.2 — Microsite generation check/trigger
- Create `src/lib/microsites/ensure-microsite.ts`
  - Check if config exists → return URL. Missing → auto-generate (server action). Fail → error (block send or skip with warning).
- **Test:** Unit: existing → URL. Missing → generates. Fail → error returned.

#### 6.3 — Engagement → follow-up trigger
- Microsite engagement > 3 sections or > 60s:
  - Create Notification (hot_engagement)
  - Auto-draft follow-up (NOT auto-sent, stored for review)
  - Push HubSpot timeline event
- **Test:** Unit: 5 sections → notification + draft. Under threshold → nothing.

#### 6.4 — Sync `hs_email_optout` to HubSpot on unsubscribe
- **Dependency:** Requires Sprint 1.2 (HubSpot contacts module)
- **Note:** The unsubscribe link + HMAC + footer injection are handled in task 0.6. This task ONLY adds the HubSpot sync.
- On local unsubscribe (via `/api/unsubscribe`), push `hs_email_optout = true` to HubSpot contact via `hsUpdateContact()`.
- On HubSpot unsubscribe (via webhook 3.6), set Persona `do_not_contact = true` in DB.
- Bidirectional sync: both systems respect opt-out regardless of origin.
- **Test:** Unit: local unsubscribe → HubSpot updated. Webhook unsubscribe → DB updated. Contact not in HubSpot → skip gracefully.
- **Validation:** Unsubscribe via link → both DB and HubSpot show opted out.

---

## Sprint 7: Pipeline Intelligence + Deal Tracking

> **Year-round pipeline visibility.** This is where the platform stops being a send tool and becomes a revenue operating system. Casey lives in this view daily.

**Demo:** `/pipeline` Kanban: Contacted → Engaged → Meeting → Proposal → Closed. Drag between stages. Morning digest email arrives at 7am.

### Tasks

#### 7.1 — HubSpot deals module
- **Dependency:** Requires Sprint 1 + 3.2
- `src/lib/hubspot/deals.ts`: CRUD + timeline. Stage mapping.
- **Test:** Unit per function.

#### 7.2 — Auto-create deal on first outreach
- `hubspot_deal_id String?` on Meeting model. First email → "Contacted" deal. Dedup.
- **Test:** First send → deal. Second → no dup.

#### 7.3 — /pipeline Kanban page
- `export const dynamic = 'force-dynamic'`
- Columns, cards, drag-drop → Server Action → HubSpot stage update.
- **Test:** Playwright: loads, columns render.

#### 7.4 — Pipeline analytics cards
- Funnel chart, conversion rates, avg time, weekly movement on /analytics.

#### 7.5 — Meeting outcome + deal progression
- Complete meeting → outcome prompt → HubSpot deal update (Server Action).

#### 7.6 — ~~Daily pipeline digest email~~ → PULLED TO 3.12
- Moved to Sprint 3 as task 3.12. See above.

#### 7.7 — Cron monitoring dashboard
- `/admin/crons` page. `export const dynamic = 'force-dynamic'`
- Last run, status, duration, errors per cron.

#### 7.8 — Daily cockpit dashboard redesign
- Redesign `/` (dashboard) as Casey's daily operating view. This is the first screen every morning.
- **Sections:**
  - **Today's Actions:** Follow-ups due, replies needing response, hot engagements, unread notifications
  - **Pipeline Snapshot:** Deals by stage, total pipeline value, meetings this week
  - **Campaign Performance:** Active campaigns with send/open/reply rates, last 7 days trend
  - **Quick Actions:** Global compose, search contacts, view pipeline, recent accounts
- All data from existing DB queries + HubSpot sync. No new API calls needed.
- `export const dynamic = 'force-dynamic'`
- **Test:** Playwright: dashboard loads, all sections render (seed data). Quick actions navigate correctly.
- **Validation:** Casey can start the day here and know exactly what to do.

---

## Sprint 8: Campaign Engine (Phase 3)

> **Year-round campaign management.** MODEX follow-up was campaign #1. This sprint makes every future campaign \u2014 trade shows, cold outreach, seasonal pushes, new use cases \u2014 first-class and repeatable.

**Goal:** Campaigns are a top-level concept. Each campaign has its own target accounts, personas, messaging, microsites, drip sequences, and analytics. Casey creates a new campaign in minutes, not days.
**Demo:** Create "Q3 Cold Outbound" campaign \u2192 select 15 accounts \u2192 import contacts \u2192 generate microsites \u2192 launch drip sequence \u2192 track performance \u2014 all from one flow.

### Tasks

#### 8.1 \u2014 Campaign data model
- Add `Campaign` model to Prisma schema:
  - `id`, `name` (e.g., "MODEX 2026 Follow-Up", "Q3 CPG Outbound"), `slug`, `status` (draft | active | paused | completed), `campaign_type` (trade_show | cold_outbound | follow_up | warm_intro | seasonal), `start_date`, `end_date`, `target_account_count`, `messaging_angle` (text \u2014 AI uses this for content generation), `key_dates` (JSON \u2014 event dates, deadlines), `owner`, `created_at`, `updated_at`
- Add `campaign_id Int?` FK to `OutreachWave`, `EmailLog`, `Activity`, `GeneratedContent`
- Migrate existing OutreachWave records to a "MODEX 2026" campaign (backfill script)
- `npx prisma migrate dev --name add-campaign-model`
- **Test:** Create campaign + associate waves. Query waves by campaign. Backfill assigns existing waves.
- **Validation:** `npx prisma studio` shows Campaign table. Existing waves linked to "MODEX 2026".

#### 8.2 \u2014 Campaign CRUD UI
- Create `/campaigns` page (`force-dynamic`): list all campaigns with status, dates, account count, send/reply stats
- Create `/campaigns/new` page: multi-step form (name, type, date range, messaging angle, target accounts)
- Create `/campaigns/[slug]` page: campaign detail with tabs (Accounts, Sequences, Analytics, Settings)
- **Test:** Playwright: create campaign \u2192 appears in list. Edit \u2192 changes saved. Delete requires confirmation.

#### 8.3 \u2014 Campaign-scoped analytics
- `/campaigns/[slug]/analytics`: send volume, open rate, reply rate, meetings booked, pipeline generated \u2014 all scoped to this campaign's EmailLog records
- Compare campaigns side-by-side on `/analytics`
- **Test:** Campaign filter on analytics page \u2192 numbers match `WHERE campaign_id = ?`.

#### 8.4 \u2014 Campaign templates
- Create `src/lib/campaigns/templates.ts` with presets:
  - `trade_show_follow_up` \u2014 4-touch drip, microsite, "great meeting you at {event}"
  - `cold_outbound` \u2014 5-touch sequence, problem-led, microsite
  - `warm_intro` \u2014 2-touch soft ask, referral-based
  - `seasonal_push` \u2014 3-touch urgency sequence, quarterly close
- Template includes: default touch count, suggested intervals, AI prompt angle, required fields
- "New Campaign" flow offers template or blank
- **Test:** Unit: each template produces valid campaign config. Template \u2192 campaign \u2192 sequences generated.

#### 8.5 \u2014 Campaign-aware AI content generation
- Update `src/lib/ai/` prompts to accept campaign context: `campaign.messaging_angle`, `campaign.key_dates`, `campaign.campaign_type`
- AI-generated emails reference the active campaign's angle instead of hardcoded MODEX messaging
- Microsite generation adapts to campaign type (trade show \u2192 event-specific hero, cold outbound \u2192 problem-led hero)
- **Test:** Generate email for MODEX campaign \u2192 references MODEX. Generate for Q3 cold \u2192 no MODEX mention. No em dashes.

#### 8.6 \u2014 Campaign scheduling + drip automation
- Extend `src/app/api/cron/drip-sequence/route.ts` (from 6.5) to be campaign-aware
- Each campaign's drip runs independently with its own intervals and touch count
- Pause/resume per campaign (without affecting others)
- **Test:** Two active campaigns \u2192 both drips fire independently. Pause one \u2192 other continues.

#### 8.7 \u2014 Quarterly review page
- Create `/analytics/quarterly` (`force-dynamic`)
- Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
- Metrics per quarter: total sends, replies, meetings, deals closed, revenue, campaigns run
- Year-over-year comparison (when data exists)
- Goal setting: quarterly pipeline target, meeting target
- **Test:** Playwright: page loads, quarters render with data. Goal input saves.

---

## Cross-Sprint Dependency Matrix

| Sprint | Blocks | Blocked By |
|--------|--------|------------|
| **0 (Pre-Flight)** | 1, 2, 3, 5, 6 | — |
| **1 (HubSpot Foundation)** | 2.7, 3.2, 3.5, 3.10, 5, 6, 7 | 0 |
| **2 (Reply Detection)** | — | 0, 1.1 (for 2.7) |
| **3 (Send Tracking)** | 6.1c, 7 | 0, 1.1, 1.2, 1.4 |
| **4 (yardflow.ai)** | 6.1a, 6.4 | 0 only (parallel with 1-3) |
| **5 (Enrichment)** | — | 1 complete |
| **6 (Automation)** | 8 | 1, 3, 4 |
| **7 (Pipeline + Daily Ops)** | 8 | 1, 3 |
| **8 (Campaign Engine)** | — | 6, 7 |

**Parallelizable:** Sprint 4 alongside 2-3. Sprints 2 and 3 overlap if schema migrations (2.3, 3.1) deploy in order. Sprint 8 can start schema work (8.1) during Sprint 7.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| HubSpot rate limits (100/10s) | Sync lag | Backoff in client wrapper (1.1). Batch ops. Cache reads. |
| Gmail scope re-auth breaks token | Polling blocked | Test in dev first. Keep old token as rollback. |
| yardflow.ai DNS propagation | Microsite 404s | TTL 300s before change. `dig` verify. Demo fallback. Revert in < 5 min. |
| Webhook signature bypass | Security vuln | V3 validation from day 1 (3.6). Reject unsigned. Dead letter queue. |
| 102K import overwhelms DB | Railway limits | ICP-filtered subset only (500-2000). Unique index on hubspot_contact_id. |
| HubSpot contact deleted remotely | Orphaned sends | Sync marks orphans `do_not_contact = true` (1.5). |
| Race condition: dual create | Duplicates | Dedup by email + hubspot_contact_id (1.5, 1.6). |
| Gmail API outage | No reply detection | Skip cycle, retry next. Alert after 3 failures (2.4). |
| Hard bounces not suppressed | Reputation damage | Webhook sets `hard_bounce` + `do_not_contact` (3.6). |
| No unsubscribe | CAN-SPAM violation | Unsubscribe in every footer (0.6). Sync to HubSpot (6.4). |
| Old unsubscribe links (no HMAC) | Abuse vector | Backward-compat: accept old links for 60 days with logging (0.6c). |
| Prisma migration breaks prod | Schema rollback needed | Create down-migration SQL file for each `migrate dev`. Railway has no built-in rollback. Test migration on staging branch first. |
| Gmail re-auth invalidates old token | Polling + sending break | Test scope addition in dev project first. Google may revoke old refresh token on re-auth. Keep backup token copy. |
| CLI scripts miss HubSpot logging | Incomplete tracking data | Migrate scripts to use sendEmail() (3.11). Bridge: add logToHubSpot() call. |
| Microsite gen fails silently | Broken email links | Block send or explicit skip (6.2). |
| Cron silent failure | Data staleness | Sentry (0.2). Cron dashboard (7.7). 3-failure alert. |
| Rollback from HubSpot | Data loss if integration breaks | Keep Prisma DB as source of truth. Railway backups. Revert PR + re-sync. |

---

## Success Metrics

| Metric | Current | After Sprint 6 | After Sprint 8 (Year-Round) |
|--------|---------|----------------|-----------------------------|
| Reply detection latency | ∞ (manual Gmail) | < 5 minutes | < 5 minutes |
| Contacts in app | 222 DB only | 2,000+ HubSpot synced | 5,000+ across campaigns |
| Send tracking | DB + Resend dashboard | Unified /analytics/emails | Per-campaign analytics |
| **Send surfaces with HubSpot logging** | **0** | **12** (6 existing + 6 new) | **12+** |
| **Pages you can send from** | **3** (campaign, studio, account) | **All** (global compose + per-page) | **All** |
| Microsite domain | modex-gtm.vercel.app | yardflow.ai | yardflow.ai |
| Engagement tracking | Basic page view | Section + duration + CTA + triggers | Per-campaign attribution |
| Outreach steps | 5+ manual clicks | 1 wizard OR 1 click from any surface | Template → launch in minutes |
| System of record | DB + CSV + Gmail | HubSpot + DB (operational) | HubSpot + DB + Campaign model |
| Compliance | No unsubscribe | CAN-SPAM compliant | CAN-SPAM compliant |
| Error visibility | None | Sentry + cron dashboard | Sentry + cron dashboard |
| **Campaigns supported** | **1 (MODEX, hardcoded)** | **1 (MODEX follow-up)** | **Unlimited (templated)** |
| **Casey's daily view** | **Ad-hoc scripts** | **Dashboard + notifications** | **Full cockpit: pipeline, actions, campaigns** |
| **Quarterly visibility** | **None** | **Basic** | **Full quarterly review + goals** |

## Technical Standards (All Sprints)

- **Shoot from anywhere**: Every page where a contact is visible should have a path to send an email. Never consolidate sending into a single workflow. The OutreachWizard, Campaign Actions, Bulk Send, Studio, EmailComposer, and Global Compose are all first-class send surfaces.
- **Never remove editability**: Every surface that displays email content must allow inline editing before send. Preview mode is secondary to edit mode. The EmailComposer always defaults to edit mode.
- **Every `page.tsx` with DB calls**: `export const dynamic = 'force-dynamic'`. Enforced by `scripts/check-force-dynamic.js`.
- **Every API route**: Zod validation on inputs (see `src/lib/validations.ts`). `CRON_SECRET` auth on crons.
- **Every HubSpot call**: try/catch with graceful degradation. Rate-limit backoff. App works without HubSpot.
- **Every email send**: Logged to EmailLog + HubSpot (via sendEmail/sendBulk — transparent to all surfaces). Recipient-guard checked. Rate limited (10/min). casey@freightroll.com only.
- **Every outgoing email**: Must include unsubscribe link (CAN-SPAM/GDPR).
- **Every mutation**: Via Server Action. `revalidatePath()` after write.
- **No em dashes (—)** in any generated content.
- **Tests**: Unit (vitest) for logic + error paths. Playwright for flows. `npm run build` must pass.
- **Coverage**: `src/lib/hubspot/*`, `src/lib/email/*`, `src/app/api/cron/*` → >= 80%.
- **Integration tests**: 1+ end-to-end test per sprint.
- **Database**: Syncs in `prisma.$transaction()`. Indices on HubSpot ID fields.
- **Errors**: Logged to Sentry. Cron failures alert Casey after 3 consecutive.
- **HubSpot API**: Emails Object API (`/crm/v3/objects/emails`) for logging sends/replies. NOT Timeline Events API (requires custom event templates). NOT deprecated v1 Engagements API.
- **Campaign-aware**: All new features should work with the current implicit campaign (MODEX follow-up) and be ready for explicit Campaign model (Sprint 8). Never hardcode campaign-specific messaging — use context from the active campaign or account.
- **Daily ops first**: Every feature should make Casey's daily workflow faster. If a feature doesn't improve the morning → evening operating loop, deprioritize it.
