# Draft Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An in-app Outbox in `/discovery` where Clawd (and Casey) stage outreach drafts, Casey reviews/edits/previews + approves, and the app sends them as `casey@freightroll.com` via the existing Gmail path — immediately or on a Clawd-cron-triggered schedule — with true comms-awareness, sequences, A/B, and multi-user.

**Architecture:** One new `DraftQueueItem` table is the staging layer. A single internal `sendQueueItem()` wraps the proven send logic (guards → `sendViaGmail` → Sent folder + HubSpot + EmailLog) and is the only send path, reached by both the in-app "Send now" (session-authed server action) and Clawd's Railway cron (CRON_SECRET-authed `/api/queue/:id/send`, fed by `/api/queue/due`). Features layer on in independent sprints.

**Tech Stack:** Next.js App Router (server actions + route handlers), Prisma (Postgres/Railway), Gmail API, HubSpot CRM API, vitest, Tailwind, shadcn `Tabs`.

---

## Sprint map (each sprint is independently shippable)

| Sprint | Ships | Spec items |
|--------|-------|-----------|
| **0** | Schema + shared `sendQueueItem()` core (no UI) | core |
| **1** | Outbox tab + add/edit/remove + **Send now** (MVP) | core, basic dedup |
| **2** | **Schedule + stagger** via Clawd cron + quiet-hours | core, C |
| **3** | `cid:` inline image | A |
| **4** | True comms-awareness (Gmail + HubSpot) | D |
| **5** | Reply-aware auto-pause | B |
| **6** | Sequences (one-time + follow-ups) | F |
| **7** | A/B experiments, reported in HubSpot | G |
| **8** | Multi-user owner scoping + per-identity send (Jake) | H |

**Detail convention:** Sprints 0–2 (the MVP that makes the feature real) are written to full bite-sized TDD steps with code. Sprints 3–8 are written as atomic task lists with concrete signatures, test names, and acceptance criteria; **expand each to full TDD steps at sprint start** (the model, guards, and patterns they build on are all fixed by Sprint 2). This is a program roadmap, not eight specs crammed into one.

**Conventions for every sprint:** TDD (red→green), DRY, YAGNI, frequent commits. Delete `*.tsbuildinfo` before the final `tsc --noEmit` gate (stale incremental cache has bitten this repo). Run `npx vitest run <file>` for unit tests. Branch off `main` in this worktree; one PR per sprint.

---

## Data model (created once, in Sprint 0)

The full model is created up front (later-sprint columns nullable) so we migrate once.

```prisma
model DraftQueueItem {
  id                  Int       @id @default(autoincrement())
  // recipient + content
  to_email            String
  account_name        String
  persona_name        String?
  persona_id          Int?
  subject             String
  body                String                     // plain text; wrapped to HTML at send
  image_url           String?                    // absolute hosted URL for the proof shot
  // lifecycle
  status              String    @default("draft") // draft|approved|sending|sent|failed|skipped
  source              String    @default("casey") // casey|clawd
  owner               String    @default("casey@freightroll.com") // H: signed-in operator
  // scheduling (Sprint 2)
  batch_id            String?
  scheduled_for       DateTime?
  // sequences (Sprint 6)
  sequence_id         Int?
  step_index          Int?
  parent_item_id      Int?
  // experiments (Sprint 7)
  experiment_id       String?
  variant_key         String?
  // result
  idempotency_key     String    @unique
  email_log_id        Int?
  provider_message_id String?
  thread_id           String?
  skipped_reason      String?
  error_message       String?
  // audit
  created_by          String?
  approved_at         DateTime?
  sent_at             DateTime?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@index([status, scheduled_for])
  @@index([batch_id])
  @@index([owner, status])
  @@index([to_email])
  @@map("draft_queue_items")
}
```

---

## Sprint 0 — Foundation: schema + shared send core

**Goal:** the `DraftQueueItem` table exists and `sendQueueItem()` can send one queued item end-to-end (guards → Gmail → EmailLog → status), with the send mocked in tests. No UI.

**Files:**
- Modify: `prisma/schema.prisma` (add model above)
- Create: `src/lib/queue/types.ts`
- Create: `src/lib/queue/send.ts`
- Create: `tests/unit/queue-send.test.ts`

### Task 0.1: Add the model + migrate

- [ ] **Step 1:** Paste the `DraftQueueItem` model into `prisma/schema.prisma`.
- [ ] **Step 2:** Run `npx prisma migrate dev --name add_draft_queue_items` (uses the worktree `.env.local` DATABASE_URL). Expected: migration created + applied, client regenerated.
- [ ] **Step 3:** Run `npx prisma generate`. Expected: `DraftQueueItem` available on the client.
- [ ] **Step 4:** Commit.
```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(queue): add DraftQueueItem model"
```

### Task 0.2: Types

- [ ] **Step 1:** Create `src/lib/queue/types.ts`:
```ts
export type QueueStatus = 'draft' | 'approved' | 'sending' | 'sent' | 'failed' | 'skipped';
export type QueueSource = 'casey' | 'clawd';

export interface SendQueueItemResult {
  status: Extract<QueueStatus, 'sent' | 'failed' | 'skipped'>;
  emailLogId?: number;
  providerMessageId?: string | null;
  threadId?: string | null;
  skippedReason?: string;
  errorMessage?: string;
}
```
- [ ] **Step 2:** Commit.
```bash
git add src/lib/queue/types.ts
git commit -m "feat(queue): queue types"
```

### Task 0.3: `sendQueueItem()` — happy path (TDD)

`sendQueueItem` loads an item, claims it (`approved → sending` via a guarded `updateMany`), runs the existing send guards, wraps the body, calls `sendEmail`, writes `EmailLog`, and stamps the item. It accepts an injected `deps` object so the network is mockable in tests.

**Files:**
- Create: `src/lib/queue/send.ts`
- Test: `tests/unit/queue-send.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/unit/queue-send.test.ts`):
```ts
import { describe, it, expect, vi } from 'vitest';
import { sendQueueItem } from '@/lib/queue/send';

function fakeItem(over = {}) {
  return {
    id: 1, to_email: 'gm@acme.com', account_name: 'Acme', persona_name: 'Pat',
    subject: 'Hi', body: 'Body line.', image_url: 'https://x/y.jpg',
    status: 'approved', idempotency_key: 'k1', ...over,
  };
}

it('claims, sends, logs, and marks sent', async () => {
  const updates: any[] = [];
  const deps = {
    claim: vi.fn().mockResolvedValue(1),          // 1 row updated => we own it
    loadItem: vi.fn().mockResolvedValue(fakeItem()),
    guard: vi.fn().mockResolvedValue({ ok: true }),
    send: vi.fn().mockResolvedValue({ headers: { 'x-message-id': 'm1' }, threadId: 't1', hubspotEngagementId: 'h1' }),
    writeEmailLog: vi.fn().mockResolvedValue({ id: 99 }),
    finalize: vi.fn().mockImplementation((id, data) => { updates.push(data); return Promise.resolve(); }),
  };
  const res = await sendQueueItem(1, { deps });
  expect(res.status).toBe('sent');
  expect(deps.send).toHaveBeenCalledOnce();
  expect(updates.at(-1)).toMatchObject({ status: 'sent', email_log_id: 99, provider_message_id: 'm1' });
});

it('no-ops when the claim is lost (double-trigger)', async () => {
  const deps: any = { claim: vi.fn().mockResolvedValue(0), loadItem: vi.fn(), guard: vi.fn(), send: vi.fn(), writeEmailLog: vi.fn(), finalize: vi.fn() };
  const res = await sendQueueItem(1, { deps });
  expect(res.status).toBe('skipped');
  expect(res.skippedReason).toBe('already_claimed');
  expect(deps.send).not.toHaveBeenCalled();
});

it('marks skipped (not failed) when a guard blocks', async () => {
  const deps: any = {
    claim: vi.fn().mockResolvedValue(1), loadItem: vi.fn().mockResolvedValue(fakeItem()),
    guard: vi.fn().mockResolvedValue({ ok: false, reason: 'unsubscribed' }),
    send: vi.fn(), writeEmailLog: vi.fn(), finalize: vi.fn(),
  };
  const res = await sendQueueItem(1, { deps });
  expect(res.status).toBe('skipped');
  expect(res.skippedReason).toBe('unsubscribed');
  expect(deps.send).not.toHaveBeenCalled();
});

it('marks failed and records the error when send throws', async () => {
  const deps: any = {
    claim: vi.fn().mockResolvedValue(1), loadItem: vi.fn().mockResolvedValue(fakeItem()),
    guard: vi.fn().mockResolvedValue({ ok: true }),
    send: vi.fn().mockRejectedValue(new Error('Gmail 500')),
    writeEmailLog: vi.fn(), finalize: vi.fn(),
  };
  const res = await sendQueueItem(1, { deps });
  expect(res.status).toBe('failed');
  expect(res.errorMessage).toContain('Gmail 500');
});
```
- [ ] **Step 2: Run to verify it fails.** `npx vitest run tests/unit/queue-send.test.ts` → FAIL (`sendQueueItem` not defined).
- [ ] **Step 3: Implement** `src/lib/queue/send.ts`:
```ts
import type { SendQueueItemResult } from './types';

export interface SendDeps {
  claim: (id: number) => Promise<number>;             // approved->sending, returns rows affected
  loadItem: (id: number) => Promise<any>;
  guard: (item: any) => Promise<{ ok: boolean; reason?: string }>;
  send: (item: any) => Promise<{ headers: Record<string, string>; threadId: string | null; hubspotEngagementId: string | null }>;
  writeEmailLog: (item: any, sent: { messageId: string | null; threadId: string | null; hubspotEngagementId: string | null; html: string }) => Promise<{ id: number }>;
  finalize: (id: number, data: Record<string, unknown>) => Promise<void>;
}

export async function sendQueueItem(id: number, opts: { deps: SendDeps }): Promise<SendQueueItemResult> {
  const { deps } = opts;
  const claimed = await deps.claim(id);
  if (claimed === 0) return { status: 'skipped', skippedReason: 'already_claimed' };

  const item = await deps.loadItem(id);
  const g = await deps.guard(item);
  if (!g.ok) {
    await deps.finalize(id, { status: 'skipped', skipped_reason: g.reason ?? 'blocked' });
    return { status: 'skipped', skippedReason: g.reason ?? 'blocked' };
  }
  try {
    const sent = await deps.send(item);
    const messageId = sent.headers['x-message-id'] ?? null;
    const log = await deps.writeEmailLog(item, { messageId, threadId: sent.threadId, hubspotEngagementId: sent.hubspotEngagementId, html: item.body });
    await deps.finalize(id, {
      status: 'sent', email_log_id: log.id, provider_message_id: messageId,
      thread_id: sent.threadId, sent_at: new Date(),
    });
    return { status: 'sent', emailLogId: log.id, providerMessageId: messageId, threadId: sent.threadId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await deps.finalize(id, { status: 'failed', error_message: errorMessage });
    return { status: 'failed', errorMessage };
  }
}
```
- [ ] **Step 4: Run to verify it passes.** `npx vitest run tests/unit/queue-send.test.ts` → PASS (4 tests).
- [ ] **Step 5: Commit.**
```bash
git add src/lib/queue/send.ts tests/unit/queue-send.test.ts
git commit -m "feat(queue): sendQueueItem core with claim/guard/send/finalize (TDD)"
```

### Task 0.4: Production `SendDeps` wiring

- [ ] **Step 1:** Create `src/lib/queue/send-deps.ts` exporting `prodSendDeps()` that binds the abstract deps to real implementations:
  - `claim`: `prisma.draftQueueItem.updateMany({ where: { id, status: 'approved' }, data: { status: 'sending', updated_at: new Date() } })` → returns `.count`.
  - `loadItem`: `prisma.draftQueueItem.findUniqueOrThrow({ where: { id } })`.
  - `guard`: compose existing guards — `evaluateRecipientEligibility` (`@/lib/email/recipient-guard`), unsubscribe lookup (`prisma.unsubscribedEmail`), and `enforceOneAccountInvariant` (`@/lib/revops/one-account-invariant`). Return `{ ok:false, reason }` on first block.
  - `send`: wrap body with `wrapHtml(item.body, item.account_name, item.to_email, undefined, item.image_url)` (`@/lib/email/templates`), then `sendEmail({ to, subject, html })` (`@/lib/email/client`).
  - `writeEmailLog`: `prisma.emailLog.create({ ... })` mirroring `/api/email/send` (account_name, persona_name, to_email, subject, body_html, status:'sent', provider/thread/hubspot ids).
  - `finalize`: `prisma.draftQueueItem.update({ where: { id }, data })`.
- [ ] **Step 2:** Typecheck only (no new unit test — these are thin DB bindings; covered by the integration smoke in Sprint 1). `rm -f *.tsbuildinfo && npx tsc --noEmit` → clean.
- [ ] **Step 3: Commit.**
```bash
git add src/lib/queue/send-deps.ts
git commit -m "feat(queue): production SendDeps wiring (guards, Gmail, EmailLog)"
```

**Sprint 0 acceptance:** `DraftQueueItem` migrated; `sendQueueItem` unit-tested for claim/guard/send/fail/idempotency; prod deps compile.

---

## Sprint 1 — Outbox tab + add/edit/remove + Send now (MVP)

**Goal:** Casey can add a contact to the queue from the contact drawer, see it in an Outbox tab, edit subject/body, preview the image, and click **Send now** — which sends via `sendQueueItem`. Clawd can bulk-add via `POST /api/queue`. Basic dedup-on-add (EmailLog + unsubscribe + existing-queue).

**Files:**
- Create: `src/lib/queue/dedup.ts` (+ `tests/unit/queue-dedup.test.ts`)
- Create: `src/app/discovery/queue-actions.ts` (server actions)
- Create: `src/app/api/queue/route.ts` (Clawd bulk-add; CRON_SECRET)
- Create: `src/app/discovery/outbox-tab.tsx`
- Modify: `src/app/discovery/discovery-hub.tsx` (add `outbox` tab + badge)
- Modify: `src/app/discovery/prospect-contacts.tsx` (add "Queue" button)
- Create: `src/lib/validations.ts` additions (`QueueAddSchema`)

### Task 1.1: Dedup-on-add (basic) — TDD

`dedupCheck(email, { emailLogHit, unsubscribed, queuedHit })` is a pure decision fn; the DB lookups are passed in (real lookups wired in the action). Sprint 4 replaces the inputs with full comms-awareness.

- [ ] **Step 1: Failing test** (`tests/unit/queue-dedup.test.ts`):
```ts
import { describe, it, expect } from 'vitest';
import { dedupDecision } from '@/lib/queue/dedup';

it('blocks unsubscribed (hard)', () => {
  expect(dedupDecision({ unsubscribed: true, emailLogHit: false, queuedHit: false }))
    .toEqual({ allow: false, reason: 'unsubscribed' });
});
it('blocks already-emailed', () => {
  expect(dedupDecision({ unsubscribed: false, emailLogHit: true, queuedHit: false }))
    .toEqual({ allow: false, reason: 'already_emailed' });
});
it('blocks already-in-queue', () => {
  expect(dedupDecision({ unsubscribed: false, emailLogHit: false, queuedHit: true }))
    .toEqual({ allow: false, reason: 'already_queued' });
});
it('allows a clean contact', () => {
  expect(dedupDecision({ unsubscribed: false, emailLogHit: false, queuedHit: false }))
    .toEqual({ allow: true });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** `src/lib/queue/dedup.ts`:
```ts
export interface DedupInputs { unsubscribed: boolean; emailLogHit: boolean; queuedHit: boolean; }
export interface DedupResult { allow: boolean; reason?: 'unsubscribed' | 'already_emailed' | 'already_queued'; }

export function dedupDecision(i: DedupInputs): DedupResult {
  if (i.unsubscribed) return { allow: false, reason: 'unsubscribed' };
  if (i.emailLogHit) return { allow: false, reason: 'already_emailed' };
  if (i.queuedHit) return { allow: false, reason: 'already_queued' };
  return { allow: true };
}
```
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit (`feat(queue): dedup-on-add decision (TDD)`).

### Task 1.2: `QueueAddSchema` + server actions

- [ ] **Step 1:** Add to `src/lib/validations.ts`:
```ts
export const QueueAddSchema = z.object({
  toEmail: z.string().email(),
  accountName: z.string().min(1),
  personaName: z.string().optional(),
  personaId: z.number().int().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional(),
  source: z.enum(['casey', 'clawd']).default('casey'),
});
export const QueueAddBatchSchema = z.object({ items: z.array(QueueAddSchema).min(1).max(200) });
```
- [ ] **Step 2:** Create `src/app/discovery/queue-actions.ts` with `'use server'`:
  - `addToQueue(input)`: validate with `QueueAddSchema`; lowercase email; run lookups (`unsubscribedEmail.findUnique`, `emailLog.findFirst({ where: { to_email } })`, `draftQueueItem.findFirst({ where: { to_email, status: { notIn: ['sent','skipped'] } } })`) → `dedupDecision`; if blocked return `{ ok:false, reason }`; else create item with `idempotency_key = randomUUID()`, `owner = (await auth()).user.email`, `created_by` same. Return `{ ok:true, id }`.
  - `listQueue(filter?)`: return non-sent items (and a recent `sent` slice) ordered by `created_at desc`, scoped to the signed-in owner unless role==='admin'.
  - `updateDraft(id, { subject?, body?, imageUrl? })`: only when `status in ('draft','approved')`.
  - `removeDraft(id)`: delete when `status != 'sent'`.
  - `sendNow(id)`: set `status='approved'`, then `sendQueueItem(id, { deps: prodSendDeps() })`; return its result.
- [ ] **Step 3:** Typecheck: `rm -f *.tsbuildinfo && npx tsc --noEmit` → clean.
- [ ] **Step 4:** Commit (`feat(queue): add/list/edit/remove/sendNow server actions`).

### Task 1.3: `POST /api/queue` (Clawd bulk-add, CRON_SECRET)

- [ ] **Step 1:** Create `src/app/api/queue/route.ts`: reject unless `isAuthorizedCronRequest(req)` (`@/lib/cron-auth`); parse `QueueAddBatchSchema`; for each item run the same dedup as `addToQueue` (factor the lookups into `addOne()` in `queue-actions.ts` and import it); return `{ added: number, skipped: Array<{ toEmail, reason }> }`.
- [ ] **Step 2:** Manual verify: `curl -XPOST localhost:3000/api/queue -H "Authorization: Bearer $CRON_SECRET" -d '{"items":[...]}'` → `{added:1,skipped:[]}` then a second identical call → `{added:0,skipped:[{reason:"already_queued"}]}`.
- [ ] **Step 3:** Commit (`feat(queue): POST /api/queue bulk-add for Clawd (CRON_SECRET)`).

### Task 1.4: Outbox tab UI

- [ ] **Step 1:** Create `src/app/discovery/outbox-tab.tsx` (client): fetches `listQueue()` via a server action wrapper; renders rows (recipient + account + distance if present, subject inline-editable, body in an expandable `<textarea>`, image thumbnail from `image_url`, status chip). Row actions: **Edit** (save via `updateDraft`), **Remove** (`removeDraft`), **Send now** (`sendNow`, optimistic status → sent/failed toast). Empty state copy.
- [ ] **Step 2:** Modify `src/app/discovery/discovery-hub.tsx`: add `'outbox'` to `VALID_TABS`, a `<TabsTrigger value="outbox">Outbox{count>0 && ` (${count})`}</TabsTrigger>`, and `<TabsContent value="outbox"><OutboxTab/></TabsContent>`. Count comes from a lightweight `listQueue` call on mount.
- [ ] **Step 3:** Verify in dev: add via the button (next task), see it in Outbox, edit, Send now lands in Casey's Sent folder.
- [ ] **Step 4:** Commit (`feat(discovery): Outbox tab UI`).

### Task 1.5: "Queue" button in the contact drawer

- [ ] **Step 1:** Modify `src/app/discovery/prospect-contacts.tsx`: next to the existing "Email" button (line ~197), add a **"Queue"** button that calls `addToQueue` with `buildOutreach(prospect, contact.firstName)` (subject/body/imageUrl already produced by the shared `@/lib/discovery/outreach`) + recipient fields. Toast on success; toast the `reason` if dedup blocks.
- [ ] **Step 2:** Typecheck clean; manual click-through.
- [ ] **Step 3:** Commit (`feat(discovery): one-click Queue from contact drawer`).

**Sprint 1 acceptance:** add (UI + Clawd API) → Outbox review/edit → **Send now** sends via Gmail (Sent folder, HubSpot-logged, EmailLog written). Dedup blocks unsubscribed / already-emailed / already-queued. PR + green CI.

---

## Sprint 2 — Schedule + stagger via Clawd cron + quiet-hours (C)

**Goal:** approve a batch with a send time + stagger; items become `approved` with `scheduled_for`; Clawd's cron polls `/api/queue/due` and triggers `/api/queue/:id/send`; quiet-hours clamps times into business hours.

**Files:**
- Create: `src/lib/queue/schedule.ts` (+ `tests/unit/queue-schedule.test.ts`)
- Create: `src/app/api/queue/due/route.ts`
- Create: `src/app/api/queue/[id]/send/route.ts`
- Modify: `src/app/discovery/queue-actions.ts` (`approveBatch`)
- Modify: `src/app/discovery/outbox-tab.tsx` (batch bar)
- Create: `docs/integrations/clawd-queue-cron.md` (handoff contract)

### Task 2.1: Stagger + quiet-hours clamp — TDD

- [ ] **Step 1: Failing tests** (`tests/unit/queue-schedule.test.ts`) for:
  - `staggerTimes(base, count, minutesApart)` → array of Dates spaced N minutes.
  - `clampToWindow(date, { tz:'America/New_York', startHour:8, endHour:18, days:[1,2,3,4,5] })` → a Saturday 02:00 maps to Monday 08:00; a weekday 02:00 maps to same-day 08:00; a weekday 10:00 stays.
  - `selectDue(items, now)` → returns only `status==='approved' && scheduled_for <= now`, capped/ordered.
```ts
import { staggerTimes, clampToWindow, selectDue } from '@/lib/queue/schedule';
it('spaces sends N minutes apart', () => {
  const base = new Date('2026-06-09T13:00:00Z');
  const t = staggerTimes(base, 3, 2);
  expect(t.map(d => d.toISOString())).toEqual([
    '2026-06-09T13:00:00.000Z','2026-06-09T13:02:00.000Z','2026-06-09T13:04:00.000Z']);
});
it('pushes a 2am weekday into the 8am window', () => {
  const out = clampToWindow(new Date('2026-06-09T06:00:00Z') /* 02:00 ET */, { tz:'America/New_York', startHour:8, endHour:18, days:[1,2,3,4,5] });
  // 08:00 ET == 12:00Z on 2026-06-09
  expect(out.toISOString()).toBe('2026-06-09T12:00:00.000Z');
});
it('selectDue returns only ripe approved items', () => {
  const now = new Date('2026-06-09T13:01:00Z');
  const items = [
    { id:1, status:'approved', scheduled_for: new Date('2026-06-09T13:00:00Z') },
    { id:2, status:'approved', scheduled_for: new Date('2026-06-09T14:00:00Z') },
    { id:3, status:'draft', scheduled_for: new Date('2026-06-09T13:00:00Z') },
  ];
  expect(selectDue(items, now).map(i=>i.id)).toEqual([1]);
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** `src/lib/queue/schedule.ts` (use `Intl.DateTimeFormat` with `timeZone` for tz math; no extra deps). Include `WindowConfig` type and a `DEFAULT_WINDOW = { tz:'America/New_York', startHour:8, endHour:18, days:[1,2,3,4,5] }`.
- [ ] **Step 4:** Run → PASS. **Step 5:** Commit (`feat(queue): stagger + quiet-hours + due-selection (TDD)`).

### Task 2.2: `approveBatch` action

- [ ] **Step 1:** Add `approveBatch(ids, { scheduledFor?, staggerMinutes? })` to `queue-actions.ts`: if no `scheduledFor`, just set `status='approved'` (send-now-eligible items still require an explicit `sendNow`); else compute `staggerTimes` from `scheduledFor`, `clampToWindow` each, assign a shared `batch_id` (`randomUUID()`), and set `status='approved' + scheduled_for + approved_at`.
- [ ] **Step 2:** Typecheck clean; commit (`feat(queue): approveBatch with schedule + stagger`).

### Task 2.3: `GET /api/queue/due` + `POST /api/queue/[id]/send`

- [ ] **Step 1:** `due/route.ts`: `isAuthorizedCronRequest` gate; return `selectDue(await prisma.draftQueueItem.findMany({ where:{ status:'approved', scheduled_for:{ lte: new Date() } }, take:25, orderBy:{ scheduled_for:'asc' } }), new Date())` as `{ items: [{ id, to_email, scheduled_for }] }`.
- [ ] **Step 2:** `[id]/send/route.ts`: `isAuthorizedCronRequest` gate; `await sendQueueItem(Number(id), { deps: prodSendDeps() })`; return the result JSON. (Same `sendQueueItem` as `sendNow`.)
- [ ] **Step 3:** Manual: schedule 2 items 2 min apart in the past; `curl /api/queue/due` shows them; `curl -XPOST /api/queue/1/send` sends once, a second call returns `{status:'skipped',skippedReason:'already_claimed'}`.
- [ ] **Step 4:** Commit (`feat(queue): /due + /:id/send cron endpoints (CRON_SECRET)`).

### Task 2.4: Outbox batch bar + Clawd contract doc

- [ ] **Step 1:** Add to `outbox-tab.tsx`: select-all, **Approve & schedule** (date-time picker + stagger minutes), **Send all now**, status filter (draft/approved/failed), **Retry failed** (resets `failed → approved`).
- [ ] **Step 2:** Write `docs/integrations/clawd-queue-cron.md`: the two endpoints, the `CRON_SECRET` bearer header, recommended 2–3 min poll, payload shapes, at-least-once semantics (idempotency makes it once). This is the doc Casey hands Clawd.
- [ ] **Step 3:** Commit (`feat(queue): batch bar + Clawd cron contract doc`).

**Sprint 2 acceptance:** approve a batch Friday → it drips Monday in-window; Clawd cron triggers sends; double-trigger never double-sends; failed items retry. Hand Clawd `docs/integrations/clawd-queue-cron.md` + `CRON_SECRET`.

---

## Sprint 3 — `cid:` inline image (A)

**Goal:** the proof image embeds as a real `multipart/related` attachment, rendering even when remote images are blocked.

**Files:** Modify `src/lib/email/gmail-sender.ts` (+ `tests/unit/gmail-mime.test.ts`); modify `src/lib/email/templates.ts` (`wrapHtml` emits `cid:` ref when an attachment is present).

**Atomic tasks (expand to TDD steps at start):**
- [ ] `fetchImageAsAttachment(url)` → `{ contentId, mimeType, base64 }` (HEAD/size guard ≤ 1MB; returns null on failure → caller falls back to hosted URL). **Test:** mocked fetch returns bytes → correct base64 + a stable `contentId`.
- [ ] `buildMimeMessage` gains optional `inlineImage`; when present, switch top-level to `multipart/related` wrapping the existing `multipart/alternative` + an image part with `Content-ID: <id>`, `Content-Disposition: inline`. **Test:** raw MIME contains `multipart/related`, the `Content-ID`, and the alternative block intact; absent → unchanged output (regression test on current behavior).
- [ ] `wrapHtml(..., imageUrl, { cid })` emits `<img src="cid:...">` when `cid` provided, else the hosted `<img src=url>`. **Test:** both branches.
- [ ] `prodSendDeps.send` fetches the attachment from `item.image_url`, passes `inlineImage` + uses the `cid`. Falls back to hosted URL if fetch fails. **Test (deps-level):** fetch failure → hosted-URL path, no throw.

**Acceptance:** a queued send with an image renders inline in Gmail/Outlook with remote images off. Regression: image-less sends byte-identical to before.

---

## Sprint 4 — True comms-awareness (D)

**Goal:** replace EmailLog-only dedup with a real "are we already talking to them?" check across Gmail + HubSpot + EmailLog + unsubscribe, surfaced in the Outbox and enforced at add + pre-send.

**Files:** Create `src/lib/queue/comms-status.ts` (+ test); modify `gmail-inbox.ts` (add `threadExistsWith(email)`); use `searchContactByEmail` (`@/lib/hubspot/contacts`); modify `queue-actions.ts` (add uses status) + `prodSendDeps.guard` (pre-send) + `outbox-tab.tsx` (per-row chip).

**Atomic tasks:**
- [ ] `gmail-inbox.ts`: `threadExistsWith(email): Promise<{ exists: boolean; lastAt: Date | null }>` via Gmail search `q = (to:email OR from:email)` `maxResults=1`, read newest `internalDate`. **Test:** mock fetch → parses presence + date.
- [ ] `comms-status.ts`: `recipientCommsStatus(email, deps)` returns `{ state: 'new'|'emailed'|'in_thread'|'unsubscribed', lastAt, detail }`. Decision is a **pure** function `commsDecision({ unsubscribed, gmail, hubspotLastContacted, emailLogHit })`; the I/O is injected. Authority order per spec. **Tests:** unsubscribed→unsubscribed; gmail thread present→in_thread (even if EmailLog empty — the manual/agent-send case); hubspot recent only→emailed; emaillog only→emailed; nothing→new.
- [ ] Wire `recipientCommsStatus` into `addOne()` (block on `unsubscribed`/`in_thread`, warn-but-allow on `emailed` older than N days — return `{ ok:true, warning }`), with a short in-memory TTL cache keyed by email.
- [ ] `prodSendDeps.guard`: add a final `recipientCommsStatus` check (block `in_thread` newly-formed since queueing → `skipped:'in_thread'`). Overlaps with Sprint 5 but cheap and authoritative.
- [ ] Outbox row chip renders `state` + `lastAt` ("In thread — replied 2d ago").

**Acceptance:** queueing someone Casey already emailed manually (not in EmailLog) is caught via Gmail; HubSpot relationships flagged; Outbox shows comms state per row.

---

## Sprint 5 — Reply-aware auto-pause (B)

**Goal:** a scheduled item (or sequence step) does not fire if the recipient sent anything inbound after it was queued.

**Files:** modify `prodSendDeps.guard` / add `src/lib/queue/reply-guard.ts` (+ test); reuse `gmail-inbox.ts` `threadExistsWith` / `getRecentReplies`.

**Atomic tasks:**
- [ ] `replyPauseDecision({ inboundSince: Date | null, queuedAt: Date })` pure fn → block when `inboundSince && inboundSince > queuedAt`. **Tests:** inbound after queue→pause; inbound before→allow; none→allow.
- [ ] Pre-send (cron path only; not "Send now"): fetch newest inbound for `to_email` via `threadExistsWith`; if `replyPauseDecision` blocks → `finalize(skipped:'replied')` + a `Notification` row (reuse existing notifications pattern from `check-inbox`). **Test:** deps-level, blocks send + records skip.
- [ ] Sequence hook stub: expose `cancelDownstream(itemId)` (no-op until Sprint 6 wires sequences).

**Acceptance:** schedule a send; reply from the recipient before fire-time; the item is skipped (`replied`) and Casey gets a notification; "Send now" is unaffected.

---

## Sprint 6 — Sequences: one-time + follow-ups (F)

**Goal:** a queued item can be a one-time send or step 1 of a linear sequence whose next step auto-schedules on send and cancels if the recipient replies.

**Files:** add `Sequence` model (prisma) + migration; create `src/lib/queue/sequence.ts` (+ test); modify `sendQueueItem` finalize path to schedule the next step; modify Outbox to show sequence membership.

```prisma
model Sequence {
  id          Int      @id @default(autoincrement())
  name        String
  owner       String
  steps       Json     // [{ stepIndex, delayDays, subjectTemplate?, bodyTemplate? }]
  created_at  DateTime @default(now())
}
```

**Atomic tasks:**
- [ ] `nextStepSchedule(steps, currentIndex, sentAt)` pure fn → `{ stepIndex, scheduledFor } | null` (null when last). **Tests:** middle step→next at sentAt+delay; last→null.
- [ ] On `sent` finalize, if `sequence_id` present and a next step exists, create the next `DraftQueueItem` (`step_index+1`, `parent_item_id`, `status:'approved'`, `scheduled_for` clamped). **Test (deps-level):** creates exactly one downstream item with correct time.
- [ ] `cancelDownstream(itemId)` (called by Sprint 5 reply-pause): delete unsent items sharing the `sequence_id` thread for that recipient. **Test:** removes only unsent downstream.
- [ ] Outbox: group by sequence; one-time sends render flat. A "Create sequence" affordance (name + steps + delays) writing a `Sequence` row.

**Acceptance:** a 2-step sequence sends step 1, schedules step 2 at +N days; a reply before step 2 cancels it; a one-time send (length-1) behaves exactly as Sprint 1–2.

---

## Sprint 7 — A/B experiments, reported in HubSpot (G)

**Goal:** define subject/opener variants on a batch or sequence step, assign deterministically, and stamp the variant onto the send + HubSpot so reporting lives in HubSpot.

**Files:** reuse `Experiment`/`ExperimentVariant` tables + `allocateRecipientsDeterministic` (`@/lib/experiments/allocate`); modify `approveBatch` (optional experiment), `prodSendDeps.send` (apply variant + stamp), `@/lib/hubspot/emails.ts` (carry `variant_key`).

**Atomic tasks:**
- [ ] `applyVariant(item, variant)` pure fn → `{ subject, body }` with the variant's subject/opener applied (mirror `send-bulk-async.ts` `applyVariantBody`/`resolveVariantSubject`). **Tests:** control unchanged; variant subject/opener applied.
- [ ] `approveBatch` accepts `experiment?: { name, variants[] }`; on approve, create the `Experiment`, assign each item a `variant_id`/`variant_key` via `allocateRecipientsDeterministic` keyed by email. **Test:** deterministic + split-respecting assignment.
- [ ] `prodSendDeps.send` applies the variant before send; `variant_key` written to `EmailLog.metadata` and passed to `logSendToHubSpot` (extend it to set a `variant` on the HubSpot email object / subject tag). **Test (deps-level):** variant_key threads to EmailLog + HubSpot payload.
- [ ] Outbox shows variant assignment per row; a "Report in HubSpot" link to the portal.

**Ops (external, not code):** Casey provisions a HubSpot login for the Clawd team for reporting. Note in `docs/integrations/clawd-queue-cron.md`.

**Acceptance:** approve a batch with 2 variants; sends split deterministically; HubSpot shows variant on each logged email for open/reply reporting.

---

## Sprint 8 — Multi-user: owner scoping + per-identity send (H)

**Goal:** the Outbox is scoped per operator, and a non-Casey operator (Jake) sends as himself rather than as Casey.

**Files:** modify `src/lib/auth.ts` (per-user refresh-token storage), create `src/lib/email/gmail-token-store.ts` (+ test), modify `gmail-sender.ts`/`gmail-inbox.ts` (accept a resolved token/user), modify `queue-actions.ts` (owner scoping already added in Sprint 1; enforce here), modify `prodSendDeps` (resolve token by `item.owner`).

**Atomic tasks:**
- [ ] **Fix the token-overwrite bug:** in `auth.ts` `jwt` callback, store the refresh token keyed **per user email** instead of the single `__system__` record (e.g. `content_type: 'google_refresh_token', account_name: '__user__:<email>'`). **Test:** two users → two records, no clobber.
- [ ] `gmail-token-store.ts`: `getRefreshTokenFor(email)` → per-user token, falling back to `GOOGLE_REFRESH_TOKEN` (Casey) for back-compat. **Test:** returns user token when present; falls back otherwise.
- [ ] `sendViaGmail`/`getAccessToken` accept an explicit `refreshToken`/`userEmail` (default to env for back-compat). `prodSendDeps.send` resolves them from `item.owner`. **Test:** deps pass the owner's token through.
- [ ] Outbox `listQueue` scoping by `owner` (admins see all) — verify the Sprint 1 scoping holds; add a role check test.

**External dependency (deferred, not now):** Jake can sign in immediately only if the Google OAuth consent screen is Internal/Published. If it's in "Testing", Casey adds `jake@freightroll.com` as a GCP test user (1 min) when Jake onboards. Document in `docs/integrations/clawd-queue-cron.md` (or a new `docs/integrations/jake-onboarding.md`). No app change required — code ships ready.

**Acceptance:** Jake signs in (where OAuth mode permits), sees only his queue, and a send from his queue goes out as `jake@freightroll.com`; Casey's sends still go as Casey; admins see all queues.

---

## Cross-cutting acceptance (whole program)

- Every send — Send-now, scheduled, sequence step — funnels through the one `sendQueueItem` (one guard set, one logging path).
- No path can double-send (claim guard + unique `idempotency_key`).
- No path emails an unsubscribed / already-in-thread / already-emailed recipient (Sprint 4 authority).
- All new pure logic is TDD'd; the existing send/guard modules are reused, not duplicated.
- `rm -f *.tsbuildinfo && npx tsc --noEmit` clean; eslint clean; `npx vitest run` green before each PR merge.

## Self-review notes (author)

- **Spec coverage:** core (S0–S2), A(S3), D(S4), B(S5), C(S2), F(S6), G(S7), H(S8) — all mapped; E intentionally absent.
- **Type consistency:** `sendQueueItem`, `SendDeps`, `dedupDecision`, `recipientCommsStatus`, `staggerTimes/clampToWindow/selectDue`, `nextStepSchedule`, `applyVariant`, `getRefreshTokenFor` are referenced consistently across sprints.
- **Known sequencing risk:** Sprint 4 (comms-awareness) and Sprint 5 (reply-pause) both touch `prodSendDeps.guard`; Sprint 5 builds on Sprint 4's `threadExistsWith`. Keep that order.
- **Detail debt (intentional):** Sprints 3–8 are task-level; expand each to full bite-sized TDD steps at sprint start, following the Sprint 0–2 pattern.
