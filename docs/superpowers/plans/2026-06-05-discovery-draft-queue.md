# Draft Queue Implementation Plan (v2 — jury-hardened)

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An in-app Outbox in `/discovery` where Clawd (and Casey) stage outreach drafts, Casey reviews/edits/previews + approves, and the app sends them as `casey@freightroll.com` via the existing Gmail path — immediately or on a Clawd-cron-triggered schedule.

**Architecture:** One shared `performSend()` (extracted from `/api/email/send` so behaviour is identical, not reimplemented) is the single send + side-effect path. `sendQueueItem()` wraps it with a crash-safe claim/recover state machine and is reached by both the in-app "Send now" (session-authed) and Clawd's cron (`/api/cron/queue/:id/send`, bearer-authed, fed by `/api/cron/queue/due`). Features beyond the MVP live in a promote-when-earned backlog.

**Tech Stack:** Next.js App Router (server actions + route handlers), Prisma (Postgres/Railway), Gmail API, HubSpot CRM API, vitest, Tailwind, shadcn `Tabs`.

---

## What changed in v2 (jury red-team, grade B → revised)

A 7-lens review panel red-teamed v1. Incorporated:
- **Blocker — routes 401:** Clawd endpoints moved under **`/api/cron/queue/*`** (the only auth-exempt prefix; `/api/queue/*` is behind NextAuth middleware).
- **Blocker — `sending` trap state:** crash-safe recovery — persist provider ids the instant Gmail returns, distinguish "not sent" (retryable) from "sent, post-processing failed" (never re-send), and route stuck `sending` rows to manual review.
- **Blocker — injection/SSRF:** strip CRLF from **all** MIME headers + reject newlines in subject at the schema; `image_url` https-allowlist + SSRF guard (no redirects, reject private/link-local IPs, timeout, byte cap).
- **Major — false reuse:** new Sprint 0 task **extracts `performSend()`** from `route.ts`; both the route and the queue call it. Parity test. (Recorded: `recipient-guard` is a near-noop — real guards are unsubscribe + one-account-invariant.)
- **Major — idempotency:** `idempotency_key` is **deterministic** (`owner:to_email:run:step`), so `@unique` genuinely blocks double-staging; the claim `updateMany` remains the double-*send* guard.
- **Major — leaky/racy dedup:** EmailLog gets a `to_email` index + case-insensitive match; `draft_queue_items` gets a **partial unique index** so concurrent adds collide at the DB.
- **Major — over-scope:** **committed plan = Sprints 0–2 (the MVP).** A/D/B/F/G/H move to a **Backlog** with explicit promote-triggers; B+F merged; the false "all independent" claim dropped.
- **Should-fix folded in:** Gmail 429→retryable, owner-scoped mutations, dedicated `QUEUE_AGENT_SECRET`, manual "run due now" trigger, pull `threadExistsWith` forward into S1 dedup, real `prodSendDeps`/route tests, DST `clampToWindow` cases. Bounce-feedback explicitly deferred (Non-goals).

---

## Committed scope: the MVP (Sprints 0–2)

S0–2 deliver the whole loop end-to-end and ship working software. Everything else is in the **Backlog** appendix and is built only when its trigger fires.

**Conventions (every task):** TDD red→green, DRY, YAGNI, frequent commits. `npx vitest run <file>` for tests. Before any `tsc` gate: `rm -f *.tsbuildinfo && npx tsc --noEmit` (stale incremental cache has bitten this repo). One PR per sprint off `main` in this worktree.

**Status/source are free Strings** (matches `EmailLog`/`SendJobRecipient`), but always referenced via the `STATUS` const + `QueueStatus` union (Task 0.2), never inline literals — a typo silently breaks claim/selectDue.

---

## Data model (created once, in Sprint 0)

```prisma
model DraftQueueItem {
  id                  Int       @id @default(autoincrement())
  to_email            String                          // ALWAYS lowercased on write
  account_name        String
  persona_name        String?
  persona_id          Int?
  subject             String
  body                String
  image_url           String?
  status              String    @default("draft")      // draft|approved|sending|sent|failed|skipped
  source              String    @default("casey")      // casey|clawd
  owner               String    @default("casey@freightroll.com")
  batch_id            String?
  scheduled_for       DateTime?
  // backlog-sprint columns (nullable now to avoid later ALTERs)
  sequence_id         Int?
  sequence_run_id     String?
  step_index          Int?
  parent_item_id      Int?
  experiment_id       String?
  variant_key         String?
  // result + recovery
  idempotency_key     String    @unique               // deterministic: owner:to_email:run:step
  email_log_id        Int?
  provider_message_id String?                          // stamped the instant Gmail returns
  thread_id           String?
  sideeffects_done    Boolean   @default(false)        // false+provider_message_id set => sent-but-postproc-pending
  skipped_reason      String?
  error_message       String?
  created_by          String?
  approved_at         DateTime?
  claimed_at          DateTime?                        // for stuck-sending detection
  sent_at             DateTime?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@index([status, scheduled_for])
  @@index([batch_id])
  @@index([owner, status])
  @@index([to_email])
  @@index([sequence_run_id, status])
  @@map("draft_queue_items")
}
```

Plus, in the same migration:
- **`EmailLog`**: add `@@index([to_email])` (dedup does an indexed lookup, not a sequential scan).
- **Partial unique index** (raw SQL in the migration, Prisma can't express partial uniques):
  `CREATE UNIQUE INDEX draft_queue_active_recipient ON draft_queue_items (to_email) WHERE status NOT IN ('sent','skipped','failed');`
  → two concurrent adds for the same address collide at the DB; the loser is handled as `already_queued`.

---

## Sprint 0 — Foundation: schema + extracted shared send + crash-safe core

**Goal:** the table exists; the **real** send-with-side-effects logic is extracted from `/api/email/send` into `performSend()` (route refactored to use it, behaviour identical); `sendQueueItem()` wraps it crash-safely; MIME headers are injection-proof. No UI.

**Files:**
- Modify: `prisma/schema.prisma` (model + EmailLog index) + raw-SQL partial unique index
- Create: `src/lib/queue/types.ts`
- Create: `src/lib/email/perform-send.ts` (extracted) + `tests/unit/perform-send-parity.test.ts`
- Modify: `src/app/api/email/send/route.ts` (delegate to `performSend`)
- Modify: `src/lib/email/gmail-sender.ts` (CRLF-strip all headers) + `tests/unit/gmail-mime-headers.test.ts`
- Create: `src/lib/queue/send.ts` + `tests/unit/queue-send.test.ts`
- Create: `src/lib/queue/send-deps.ts` + `tests/unit/queue-send-deps.test.ts`

### Task 0.1: Schema + indexes + migrate

- [ ] **Step 1:** Add the `DraftQueueItem` model + `EmailLog` `@@index([to_email])` to `schema.prisma`.
- [ ] **Step 2:** `npx prisma migrate dev --name add_draft_queue_items` → then hand-edit the new migration SQL to append the partial unique index statement above. Re-run `npx prisma migrate dev` (it applies the edited SQL) or `npx prisma migrate deploy` against the dev DB.
- [ ] **Step 3:** `npx prisma generate`.
- [ ] **Step 4:** Commit (`feat(queue): DraftQueueItem + EmailLog to_email index + partial-unique recipient guard`).

### Task 0.2: Types + status constants

- [ ] **Step 1:** Create `src/lib/queue/types.ts`:
```ts
export const STATUS = {
  draft: 'draft', approved: 'approved', sending: 'sending',
  sent: 'sent', failed: 'failed', skipped: 'skipped',
} as const;
export type QueueStatus = typeof STATUS[keyof typeof STATUS];
export type QueueSource = 'casey' | 'clawd';

export type SendOutcome =
  | { status: 'sent'; emailLogId?: number; providerMessageId: string | null; threadId: string | null }
  | { status: 'skipped'; skippedReason: string }
  | { status: 'failed'; errorMessage: string; alreadySent: boolean };
```
- [ ] **Step 2:** Commit (`feat(queue): status constants + outcome types`).

### Task 0.3: Harden MIME headers (blocker) — TDD

- [ ] **Step 1: Failing test** (`tests/unit/gmail-mime-headers.test.ts`):
```ts
import { describe, it, expect } from 'vitest';
import { buildMimeMessage } from '@/lib/email/gmail-sender';

it('strips CRLF from Subject and To so headers cannot be injected', () => {
  const raw = buildMimeMessage({
    to: 'gm@acme.com\r\nBcc: attacker@evil.com',
    subject: 'recap\r\nReply-To: spoof@evil.com',
    html: '<p>hi</p>',
  } as any);
  expect(raw).not.toMatch(/Bcc: attacker@evil.com/);
  expect(raw).not.toMatch(/Reply-To: spoof@evil.com/);
  // header block ends at the first blank line; injected CRLF must be collapsed
  const headerBlock = raw.split('\r\n\r\n')[0];
  expect(headerBlock.split('\r\n').filter(l => /^Bcc:/i.test(l))).toHaveLength(0);
});
```
- [ ] **Step 2:** Run → FAIL (current code interpolates `To`/`Subject` verbatim).
- [ ] **Step 3:** In `buildMimeMessage`, route every header value (`To`, `Cc`, `Bcc`, `Reply-To`, `Subject`, `From`) through a `sanitizeHeader(v) = String(v).replace(/[\r\n]+/g, ' ').trim()` — not just the custom-headers map.
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit (`fix(email): strip CRLF from all MIME headers (injection)`).

### Task 0.4: Extract `performSend()` from the route (major) — parity TDD

`performSend(prisma, input)` contains everything `/api/email/send` does *after* recipient resolution: `sanitizeEmailHtml` + `isPlainText` wrap-vs-passthrough, unsubscribe with `allowBypass` + auto-delete, one-account-invariant, CC sanitization, `sendEmail`, `EmailLog.create` (with `to_email` **lowercased**), pipeline auto-advance, Activity + `markAgentActionCacheStale`, `external_send_count`, `ensureLocalMeetingDealLink`, candidate-trace metadata. Returns `{ emailLogId, providerMessageId, threadId, hubspotEngagementId }`.

- [ ] **Step 1: Characterization test first** (`tests/unit/perform-send-parity.test.ts`): mock the prisma + `sendEmail` boundary (pattern: copy `tests/unit/send-job-retry-failed-route.test.ts`'s mock setup). Assert that for an account recipient, `performSend` calls: `sendEmail` once, `emailLog.create` with `to_email` lowercased + the wrapped html, `account.updateMany` advancing the pipeline stage, and `activity.create`. These assertions encode the side-effects that must not be lost.
- [ ] **Step 2:** Run → FAIL (`performSend` not defined).
- [ ] **Step 3:** Create `src/lib/email/perform-send.ts` by moving the body of `route.ts` (lines ~224–323) into it, parameterized by `(prisma, { to, cc, subject, bodyHtml, imageUrl, accountName, personaName, generatedContentId, workflowMetadata })`. Keep logic identical.
- [ ] **Step 4: Refactor the route** to call `performSend` (route keeps validation, rate-limit, recipient resolution, approval/invariant gates, then delegates). Run the existing email-send route tests → still green.
- [ ] **Step 5:** Run the parity test → PASS. **Step 6:** Commit (`refactor(email): extract performSend shared by route + queue (no behaviour change)`).

> Note recorded in spec: pre-Backlog-D, the only substantive send-time guards are **unsubscribe + one-account-invariant**; `evaluateRecipientEligibility` only checks the address has a domain.

### Task 0.5: `sendQueueItem()` crash-safe state machine (blocker) — TDD

Order: **claim** (`approved→sending`, stamp `claimed_at`) → **guard** → **send** → *immediately persist `provider_message_id`/`thread_id`* → **performSend side-effects** → **finalize `sent`**. The catch distinguishes pre-send failure (retryable `failed`, `alreadySent:false`) from post-send failure (`failed` + `alreadySent:true`, never auto-retried).

- [ ] **Step 1: Failing tests** (`tests/unit/queue-send.test.ts`) — cover: claim lost → `skipped:already_claimed`, no send; guard block → `skipped:<reason>`, no send; clean → `sent` + provider id stamped before side-effects; **send throws → `failed` alreadySent:false**; **send resolves then side-effects throw → `failed` alreadySent:true AND provider_message_id persisted** (the trap-state regression test):
```ts
it('marks failed-but-already-sent and persists the provider id when post-send work throws', async () => {
  const writes: any[] = [];
  const deps: any = {
    claim: vi.fn().mockResolvedValue(1),
    loadItem: vi.fn().mockResolvedValue({ id: 1, status: 'approved' }),
    guard: vi.fn().mockResolvedValue({ ok: true }),
    send: vi.fn().mockResolvedValue({ providerMessageId: 'm1', threadId: 't1' }),
    persistProviderIds: vi.fn().mockImplementation((id, d) => { writes.push(['prov', d]); return Promise.resolve(); }),
    runSideEffects: vi.fn().mockRejectedValue(new Error('Prisma pool timeout')),
    finalize: vi.fn().mockImplementation((id, d) => { writes.push(['fin', d]); return Promise.resolve(); }),
  };
  const res = await sendQueueItem(1, { deps });
  expect(res).toMatchObject({ status: 'failed', alreadySent: true });
  expect(writes.find(w => w[0] === 'prov')[1]).toMatchObject({ provider_message_id: 'm1' });
  expect(writes.find(w => w[0] === 'fin')[1]).toMatchObject({ status: 'failed', sideeffects_done: false });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `src/lib/queue/send.ts` with `persistProviderIds` between `send` and `runSideEffects`; catch sets `alreadySent` based on whether `send` resolved. A `sent` finalize sets `sideeffects_done:true`.
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit (`feat(queue): crash-safe sendQueueItem (no double-send on post-send failure)`).

### Task 0.6: `prodSendDeps` delegating to `performSend` + real test

- [ ] **Step 1:** Create `src/lib/queue/send-deps.ts`: `claim` = `updateMany({where:{id,status:'approved'},data:{status:'sending',claimed_at:new Date()}})`→`.count`; `guard` = unsubscribe(+allowBypass) + one-account-invariant; `send` = `sendViaGmail` with an `X-Queue-Idempotency: <idempotency_key>` header (for Sent-folder reconciliation); `persistProviderIds`/`finalize` = `draftQueueItem.update`; `runSideEffects` = `performSend`'s side-effect tail (EmailLog already written by performSend → store its id). To avoid double-send, `prodSendDeps` calls `performSend` **with the Gmail send injected as already-done** (refactor `performSend` to accept an optional `sentResult` so the queue does the Gmail call once and passes the result in for logging+side-effects).
- [ ] **Step 2: Real deps test** (`tests/unit/queue-send-deps.test.ts`): mock only prisma + `sendViaGmail`; run `prodSendDeps` once; assert the claim where-clause is `{id,status:'approved'}`, the Gmail call carries the idempotency header, and EmailLog is written with lowercased `to_email`.
- [ ] **Step 3:** `rm -f *.tsbuildinfo && npx tsc --noEmit` clean. **Step 4:** Commit (`feat(queue): prodSendDeps delegating to performSend (TDD)`).

**Sprint 0 acceptance:** migrated; route refactored to `performSend` with parity test green; MIME injection closed; `sendQueueItem` proven crash-safe (no double-send); prod deps tested at the boundary.

---

## Sprint 1 — Outbox + add/edit/remove + Send now (MVP)

**Goal:** add a contact to the queue (UI one-click + Clawd bulk-API), review/edit/preview in an Outbox tab, **Send now** via `sendQueueItem`. Atomic + case-correct dedup that also catches Casey's manual Gmail sends.

**Files:**
- Create: `src/lib/queue/dedup.ts` (+ `tests/unit/queue-dedup.test.ts`)
- Modify: `src/lib/email/gmail-inbox.ts` (add `threadExistsWith`)
- Create: `src/app/discovery/queue-actions.ts` (owner-scoped server actions)
- Create: `src/app/api/cron/queue/route.ts` (Clawd bulk-add; `QUEUE_AGENT_SECRET`) + `tests/unit/queue-route-auth.test.ts`
- Create: `src/app/discovery/outbox-tab.tsx`; Modify: `discovery-hub.tsx`, `prospect-contacts.tsx`
- Modify: `src/lib/validations.ts` (`QueueAddSchema` with subject CRLF refine + optional `owner`)

### Task 1.1: Dedup decision (incl. Gmail thread) — TDD
- [ ] `dedupDecision({ unsubscribed, emailLogHit, queuedHit, gmailThread })` pure fn — authority: unsubscribed → emailLogHit/gmailThread (`already_emailed`) → queuedHit (`already_queued`) → allow. Tests incl. **gmail thread present but EmailLog empty → blocked** (the manual-send case) and a mixed-case EmailLog hit. (Implement; commit.)

### Task 1.2: `threadExistsWith` (pulled forward from Backlog-D)
- [ ] In `gmail-inbox.ts`: `threadExistsWith(email)` → Gmail search `q=(to:X from:me) OR (from:X to:me)` `-category:promotions`, `maxResults:1`; return `{ exists, lastInboundAt }` keyed on newest **inbound** (skip Casey's own From). Test against mocked fetch. (Commit.)

### Task 1.3: `QueueAddSchema` + atomic, owner-scoped actions
- [ ] `validations.ts`: `QueueAddSchema` = `{ toEmail: z.string().email(), accountName, personaName?, personaId?, subject: z.string().min(1).refine(s=>!/[\r\n]/.test(s)), body: z.string().min(1), imageUrl?: httpsAllowlist (Task B-A), source, owner? }`; `QueueAddBatchSchema` (max 200).
- [ ] `queue-actions.ts` (`'use server'`): `addOne(input, owner)` lowercases email, runs unsubscribe + EmailLog(`mode:'insensitive'`) + queue lookups + `threadExistsWith` (best-effort, 1 call) → `dedupDecision`; insert with **deterministic** `idempotency_key = ${owner}:${toEmail}:oneoff:0` and rely on the **partial unique index** to make concurrent adds collide (catch the unique violation → `already_queued`). `addToQueue` wraps `addOne` with the session owner. `listQueue` scoped to `owner` unless `role==='admin'`. **`updateDraft`/`removeDraft`/`sendNow` use `updateMany({where:{id, owner}})` (admin bypass) and assert affected-row count** (a rep cannot touch another owner's row). `sendNow` → approve → `sendQueueItem(id,{deps:prodSendDeps()})`.
- [ ] Tests: mixed-case dedup blocked; rep-A-cannot-sendNow-rep-B's-row; concurrent add → one inserts, one `already_queued`. (Commit per red→green.)

### Task 1.4: `POST /api/cron/queue` (Clawd, `QUEUE_AGENT_SECRET`, bearer-only) + auth test
- [ ] Route under **`/api/cron/queue`** (inherits middleware exemption). Gate on a **dedicated** `QUEUE_AGENT_SECRET` via `Authorization: Bearer` **only** (reject `?secret=`); rate-limit per secret. Body `QueueAddBatchSchema`; per item `addOne(item, item.owner ?? CASEY)`; return `{ added, skipped:[{toEmail,reason}] }`.
- [ ] `tests/unit/queue-route-auth.test.ts`: cookieless correct-bearer → handler runs (not 401); missing/empty/wrong bearer → 401, no insert; `?secret=` form → 401. (Commit.)

### Task 1.5: Outbox tab + Queue button
- [ ] `outbox-tab.tsx`: list (recipient/account/subject inline-edit/body textarea/image thumb/status chip + comms chip from `threadExistsWith`), row actions Edit/Remove/**Send now** (optimistic, toast). `discovery-hub.tsx`: add `outbox` tab + count badge. `prospect-contacts.tsx`: **Queue** button beside Email → `addToQueue(buildOutreach(prospect, c.firstName) + recipient)`, toast the dedup reason on block. (Commit per piece.)

**Sprint 1 acceptance:** add (UI + Clawd API under `/api/cron/queue`, bearer-gated) → Outbox review/edit → **Send now** routes through `performSend` (pipeline advances, Activity logged, Sent folder, HubSpot, EmailLog). Dedup blocks unsubscribed / already-emailed (case-insensitive, incl. **manual Gmail sends** via thread check) / already-queued (atomic). Cross-owner mutation denied. PR + green CI.

---

## Sprint 2 — Schedule + stagger + quiet-hours + Clawd cron (C)

**Goal:** approve a batch with a time + stagger (quiet-hours-clamped); Clawd's cron polls `/api/cron/queue/due` and triggers `/api/cron/queue/:id/send`; a manual "run due now" makes it self-verifiable; Gmail 429s are retryable, not terminal.

**Files:** `src/lib/queue/schedule.ts` (+ test); `src/app/api/cron/queue/due/route.ts`; `src/app/api/cron/queue/[id]/send/route.ts`; modify `queue-actions.ts` (`approveBatch`, `runDueNow` admin action); modify `send-deps.ts` (429 handling); `outbox-tab.tsx` (batch bar + Run due now); `docs/integrations/clawd-queue-cron.md`.

### Task 2.1: stagger + quiet-hours + due-selection — TDD
- [ ] `staggerTimes(base,count,minutesApart)`, `clampToWindow(date, WindowConfig)` (use `Intl.DateTimeFormat` tz math), `selectDue(items, now)`. Tests **including DST**: an EDT (summer) date, an EST (winter) date, a Nov fall-back boundary, and Saturday-02:00 → Monday-08:00 — asserted against tz-aware instants, not memorized `Z` strings. `DEFAULT_WINDOW = { tz:'America/New_York', startHour:8, endHour:18, days:[1..5] }`. (Commit.)

### Task 2.2: `approveBatch` + `runDueNow`
- [ ] `approveBatch(ids, {scheduledFor?, staggerMinutes?})`: no time → `approved` (still needs explicit `sendNow`); with time → `staggerTimes`→`clampToWindow` each, shared `batch_id`, set `approved`+`scheduled_for`+`approved_at`. `runDueNow()` (admin-only server action): `selectDue`→`sendQueueItem` loop, **operator-triggered** (does not violate the no-autonomous-cron non-goal). (Commit.)

### Task 2.3: cron endpoints (bearer-only, rate-limited) + 429 handling
- [ ] `GET /api/cron/queue/due`: `QUEUE_AGENT_SECRET` bearer; `selectDue(findMany({status:'approved',scheduled_for:{lte:now}},take:25,order:asc))`. `POST /api/cron/queue/[id]/send`: bearer; `sendQueueItem`; rate-limit per secret. In `prodSendDeps.send`, detect Gmail **429/403 rateLimitExceeded** → throw a typed `RateLimited` error that `sendQueueItem` maps to `approved` + `scheduled_for = now + backoff` (retryable), **not** `failed`. Route auth tests as in 1.4. (Commit.)

### Task 2.4: batch bar + stuck-sending sweeper + Clawd contract doc
- [ ] Outbox batch bar: select-all, **Approve & schedule** (datetime + stagger), **Send all now** (bounded concurrency, min inter-send delay), status filter, **Retry failed** — retry only items with `alreadySent:false`; items with `provider_message_id` set + `failed` are shown as **"sent — needs review"** and excluded from retry. A `selectStuckSending(olderThan:15m)` admin view lists `sending` rows for manual reconciliation against Gmail Sent (via the `X-Queue-Idempotency` header).
- [ ] `docs/integrations/clawd-queue-cron.md`: the three `/api/cron/queue/*` endpoints, the **`QUEUE_AGENT_SECRET`** bearer (distinct from `CRON_SECRET`), ~2–3 min poll, payload shapes, at-least-once semantics + the deterministic-key/claim guarantees, and the optional `owner` field for future multi-user. (Commit.)

**Sprint 2 acceptance:** approve Friday → drips Monday in-window; Clawd cron triggers; `runDueNow` lets Casey verify in-app on merge day; 429 reschedules instead of failing; double-trigger never double-sends; stuck rows surface for review. Hand Casey `docs/integrations/clawd-queue-cron.md` + `QUEUE_AGENT_SECRET`.

---

## Backlog — promote when earned (not committed)

Each item keeps its nullable columns (already migrated). Build only when its **trigger** fires; expand to full TDD steps at start, following the S0–2 pattern.

### A. `cid:` inline image — *trigger: a recipient reports the proof image not rendering, or before any high-stakes send*
- `image_url` validation: **https + host allowlist** (the `/artifacts` origin + proof CDN) at the schema; `fetchImageAsAttachment(url)` disables redirects (or re-validates the post-redirect host), resolves hostname and **rejects private/link-local/loopback ranges (SSRF)**, tight timeout, streams with a ≤1MB byte cap; **null → hosted-URL fallback**.
- `buildMimeMessage` gains optional `inlineImage` → `multipart/related` wrapping the existing `multipart/alternative`; image part carries `Content-Transfer-Encoding: base64` with **76-char line wrapping** and `Content-ID: <id>`; `wrapHtml` emits `<img src="cid:id">`. **Reconcile the real signature** `wrapHtml(bodyText, accountName, recipientEmail?, emailLogId?, imageUrl?, opts?)`.
- Tests: SSRF (metadata-IP, localhost) refused; CRLF-safe; round-trip through a MIME parser asserting CTE + bracket-stripped `Content-ID` match; image-less send byte-identical (regression).

### D-full. Comms-awareness beyond the S1 thread check — *trigger: false-dedup incident, or HubSpot becomes the reporting surface (G)*
- `recipientCommsStatus(email)` → `{ state:'new'|'emailed'|'in_thread'|'unsubscribed'|'unknown', lastAt, detail }`; pure `commsDecision` core. HubSpot: **add `notes_last_contacted`/`hs_last_sales_activity_timestamp` to the `searchContactByEmail` property fetch** (today it isn't fetched → lastAt always null); HubSpot strictly **below** Gmail; `HUBSPOT_SYNC_ENABLED` off → `unknown`, not `new`. Plus-addressing stripped to base; `@yardflow.ai` identity caveat documented.
- **Perf:** bulk add (≤200 distinct emails) bounds parallelism (`p-limit` ~5–8) and makes the Gmail/HubSpot enrichment **best-effort/async** (accept on local checks synchronously, fill the chip after) OR moves the authoritative check to **pre-send only**. State the wall-clock budget for a 100-item batch.

### B+F (merged). Reply-aware auto-pause + sequences — *trigger: Casey manually re-queues the same recipient >N times, i.e. follow-ups are a real need*
*(Merged because reply-pause's `cancelDownstream` is only exercised by sequences — building them apart ships dead code.)*
- `Sequence` model (`steps Json`); enrollment stamps a **`sequence_run_id`** UUID on every item.
- `replyPauseDecision({ inboundSince, queuedAt })` (inbound-only, ignores Casey's own outbound). Pre-send (cron path only, not Send-now): newest **inbound** via `threadExistsWith`; block → `skipped:'replied'` + a `Notification`.
- **`scheduleNextStep(item)` lives in the caller, not in `sendQueueItem.finalize`** (keeps the send seam pure; a send-ok/child-create-fail is recoverable by re-running the scheduler over sent-but-no-child items). `nextStepSchedule(steps,i,sentAt)` pure fn.
- `cancelDownstream`: delete `where sequence_run_id=X AND status NOT IN ('sent','sending')` — scoped to the enrollment, not the reusable `Sequence`. `Sequence` relation `onDelete: Restrict`.
- **Bounce gate:** `nextStepSchedule` returns null if the prior step's `EmailLog.bounce_type` is set (no follow-ups to dead addresses).

### G. A/B experiments reported in HubSpot — *trigger: Casey wants to test subject lines and the HubSpot login for the Clawd team exists*
- Reuse `Experiment`/`ExperimentVariant` + `allocateRecipientsDeterministic`. `applyVariant(item,variant)` pure (mirror `send-bulk-async`'s `applyVariantBody`/`resolveVariantSubject`). `approveBatch` optional `experiment`; assign `variant_key` per item; stamp it onto `EmailLog.metadata` **and** the HubSpot email object (extend `logSendToHubSpot`) — reporting lives in HubSpot. **Retry idempotency:** store `hubspot_engagement_id` on the row; skip HubSpot logging when already set (no double engagement on retry).
- Ops (external): Casey provisions the Clawd team a HubSpot login.

### H. Multi-user (Jake) — *trigger: Jake onboards; if the Google OAuth app is in "Testing", Casey adds him as a GCP test user (1 min)*
- Fix the **token-overwrite bug**: store the Google refresh token **per user**, **encrypted** (AES-GCM/KMS or a dedicated access-controlled table) — *not* plaintext in `generatedContent`. `getRefreshTokenFor(email)` with Casey-env fallback. `sendViaGmail`/`getAccessToken` accept explicit `refreshToken`/`userEmail`; `prodSendDeps` resolves by `item.owner`.
- Owner-scoped mutations already enforced (Task 1.3); add the rep-A-vs-rep-B red test at the route layer. Keep `listQueue` owner-filtering hidden until per-identity send lands (don't imply isolation the send path can't honor).

### Explicit Non-goals (deferred, conscious)
- **App-side autonomous cron** (Clawd's Railway cron is the trigger; `runDueNow` is operator-triggered).
- **Bounce/delivery feedback loop** beyond the B+F follow-up gate (the existing inbox poller could later detect mailer-daemon bounces).
- A/B branching sequences; multi-touch analytics dashboards (HubSpot is the surface).

---

## Cross-cutting acceptance (MVP)
- Every send — Send-now, scheduled, `runDueNow` — funnels through `performSend` (one behaviour set: sanitize, unsubscribe-bypass, pipeline advance, Activity, HubSpot, EmailLog).
- No path double-sends: claim `updateMany` + provider-id-persisted-before-side-effects + retry excludes `alreadySent` rows + stuck-`sending` rows go to manual review.
- No path emails unsubscribed / already-in-thread (incl. **manual** Gmail sends) / already-emailed (case-insensitive) / already-queued (DB-atomic).
- Clawd endpoints under `/api/cron/queue/*`, gated by a **dedicated** `QUEUE_AGENT_SECRET` (bearer-only), reachable past the middleware.
- New pure logic TDD'd; the route's send logic is **reused via `performSend`**, not duplicated.
- `rm -f *.tsbuildinfo && npx tsc --noEmit` clean; eslint clean; `npx vitest run` green before each merge.

## Self-review (author, post-jury)
- All 3 blockers + 4 majors mapped to tasks (routes→`/api/cron/queue`, trap-state→0.5, injection/SSRF→0.3+A, reuse→0.4, idempotency→deterministic key, dedup race→partial unique index + insensitive match, over-scope→MVP-vs-backlog).
- High-value should-fixes folded into MVP (429-retryable, owner-scoped mutations, dedicated secret, runDueNow, threadExistsWith forward, real deps/route/DST tests); the rest carried as backlog design notes (bounce gate, encrypted tokens, HubSpot property fetch, scheduleNextStep-in-caller, cancelDownstream scoping).
- Type consistency: `performSend`, `sendQueueItem`, `SendOutcome`/`alreadySent`, `STATUS`, `dedupDecision`, `threadExistsWith`, `staggerTimes/clampToWindow/selectDue`, `QUEUE_AGENT_SECRET` referenced consistently.
