# Draft Queue — design

**Date:** 2026-06-05
**Surface:** `/discovery` (modex-gtm)
**Status:** approved (design); ready for implementation plan

## Problem

Casey works the `/discovery` worklist to find near-reference prospects, then today
hands a generated data pack to a separate Gmail agent ("Clawd") to write + schedule
the outreach. He wants to **review and send outreach from the platform itself** —
keeping Clawd as the drafting/research brain and the cloud scheduler, but making
the modex-gtm app the place where he reviews, edits, and sends, with the proof
image visible.

This is feasible today and mostly reuses existing infrastructure (see below). The
gap is a **staging layer**: a place where drafts accumulate, get reviewed/edited,
and then go out the proven send path — immediately or on a schedule.

## Goals

- A **Draft Queue** Casey reviews in-app: recipient, account, subject, body, and an
  inline **image preview**; inline edit; remove; approve.
- **Clawd populates** the queue (research + write), and Casey can also one-click
  "Queue" any worklist contact.
- **Send now** and **scheduled/staggered send** (queue Friday, drip Monday 9am).
- Every send goes out the **existing Gmail path** as `casey@freightroll.com` —
  lands in his Sent folder with a real thread, auto-logged to HubSpot + EmailLog.
- **Lean on Clawd's cloud cron** as the scheduler heartbeat; the app does not run
  its own scheduler in v1.
- **Fewest clicks:** one click to queue a contact; two clicks to commit a batch.

## Non-goals (v1, YAGNI)

- A/B experiments (the `Experiment`/`SendJob` system already exists separately).
- Multi-step sequences / automated follow-ups.
- Multi-user / per-rep queues (single operator: Casey).
- An app-side cron scheduler (Clawd's cron is the trigger; a Vercel-cron backup is
  a trivial later add, explicitly deferred).

## What already exists (reused, not rebuilt)

- **`src/lib/email/gmail-sender.ts` → `sendViaGmail()`** — sends from
  `casey@freightroll.com` via Gmail API `messages.send` using the stored OAuth
  refresh token. Files in Sent, returns a real `threadId`. This is the only send
  path.
- **`src/lib/email/client.ts` → `sendEmail()`** — wraps `sendViaGmail` + auto-logs
  to HubSpot (`logSendToHubSpot`).
- **`/api/email/send`** — full guarded single-send: unsubscribe check, recipient
  eligibility guard, one-account-invariant, `wrapHtml(body, account, to, _, imageUrl)`
  (embeds the proof image as a hosted `<img>`), EmailLog write, pipeline-stage
  auto-advance, activity log. **The new queue send reuses this logic.**
- **`src/lib/cron-auth.ts` → `isAuthorizedCronRequest()`** — `Authorization: Bearer
  ${CRON_SECRET}` (or `?secret=`). Clawd authenticates to the queue endpoints with
  this exact pattern, identical to how Vercel cron authenticates.
- **`DiscoveryHub` tabs** (`Worklist / Corridors / Scan`) — the Outbox tab slots in
  here with a count badge.
- **`ProspectContactsPanel`** (contact drawer) — gains a one-click "Queue" button
  beside the existing "Email" button.

## Architecture

```
Clawd (research + write)  ──POST /api/queue (CRON_SECRET)──┐
in-app "Queue" button     ──server action────────────────┤
                                                          ▼
                                              DraftQueueItem (DB)
                                       status: draft → approved → sent/failed
                                                          │
                          Casey: Outbox tab — review / edit / preview / approve
                                                          │
              ┌───────────────────────────────────────────┴───────────────┐
       "Send now" (Casey clicks)                          "Schedule" (scheduled_for set)
              │                                                            │
              ▼                                          Clawd Railway cron polls
   POST /api/queue/:id/send                              GET /api/queue/due  (CRON_SECRET)
   (server action, immediate)                            → POST /api/queue/:id/send per item
              │                                                            │
              └──────────────────────► sendQueueItem() ◄───────────────────┘
                                            │
                                   existing send logic
                          (sendViaGmail → Sent + threadId,
                           HubSpot log, EmailLog, guards,
                           pipeline advance)
```

**Single internal send function.** `sendQueueItem(itemId)` holds all send logic and
is the one place that calls the Gmail path. Both the in-app "Send now" and the
cron-triggered scheduled send funnel through it, so there is exactly one send/log
path and one set of guards. It is idempotent (see Error handling).

## Data model

New table `DraftQueueItem` (`draft_queue_items`):

| field                 | type        | notes |
|-----------------------|-------------|-------|
| id                    | Int PK      | |
| to_email              | String      | lowercased |
| account_name          | String      | for one-account-invariant + dedup |
| persona_name          | String?     | |
| persona_id            | Int?        | FK-ish to Persona (nullable; not all are in records) |
| subject               | String      | |
| body                  | String      | plain text (wrapped to HTML at send) |
| image_url             | String?     | absolute hosted URL (e.g. /artifacts/...jpg) |
| status                | String      | `draft \| approved \| sending \| sent \| failed \| skipped` (default `draft`) |
| source                | String      | `clawd \| casey` |
| batch_id              | String?     | groups a batch for staggered scheduling |
| scheduled_for         | DateTime?   | null = send-now eligible only via explicit click |
| idempotency_key       | String @unique | guards against double-send |
| email_log_id          | Int?        | set on success |
| provider_message_id   | String?     | Gmail message id |
| thread_id             | String?     | Gmail thread id |
| error_message         | String?     | set on failure |
| created_by            | String?     | |
| created_at            | DateTime    | default now |
| updated_at            | DateTime    | @updatedAt |
| approved_at           | DateTime?   | |
| sent_at               | DateTime?   | |

Indexes: `@@index([status, scheduled_for])` (due-selection), `@@index([batch_id])`,
`@@index([to_email])`.

**Status lifecycle:**
`draft` → (approve) → `approved` → (send trigger) → `sending` → `sent` | `failed`.
`failed` → (retry) → `approved`. Any non-sent → (remove) hard-delete.
`skipped` = blocked by a guard at send time (e.g. unsubscribed) — terminal, shown
with reason.

## Endpoints & actions

- **`POST /api/queue`** (CRON_SECRET) — Clawd bulk-adds drafts. Body: array of
  `{ toEmail, accountName, personaName?, subject, body, imageUrl?, scheduledFor?,
  batchId?, source: 'clawd' }`. Runs **dedup-on-add** (below); returns
  `{ added, skipped: [{toEmail, reason}] }`.
- **Server action `addToQueue(...)`** — the in-app "Queue" button; same validation
  and dedup, `source: 'casey'`.
- **Server actions for the Outbox UI:** `listQueue()`, `updateDraft(id, {subject,
  body, imageUrl})`, `removeDraft(id)`, `approveBatch(ids, {scheduledFor?, staggerMinutes?})`,
  `sendNow(id | ids)`.
- **`GET /api/queue/due`** (CRON_SECRET) — returns approved items with
  `scheduled_for <= now` and `status = approved`, capped (e.g. 25/poll) and ordered
  by `scheduled_for`. Clawd's cron polls this.
- **`POST /api/queue/:id/send`** (CRON_SECRET) — invokes `sendQueueItem(id)`; the
  HTTP entry point Clawd's cron calls for scheduled sends. The in-app **"Send now"**
  does not go through this endpoint — its `sendNow` server action (session-authed)
  calls `sendQueueItem(id)` directly. Both reach the same internal function.

**Staggering:** `approveBatch` with `staggerMinutes` assigns
`scheduled_for = base + index * staggerMinutes` across the batch, mirroring the
"9:00–10:10, 2 min apart" pattern Casey already uses.

## Dedup & guards

- **On add:** reject (as a returned `skipped` reason, not persisted) if `to_email`
  is in EmailLog (already emailed), in the unsubscribe list, or already a non-sent
  queue item. This prevents the queue from ever staging a double-send. (The local
  `exclude/already-contacted.txt` used by the offline scripts is not read here; the
  app's source of truth for "already emailed" is EmailLog. Clawd should still pass
  its own prior-campaign exclusions before calling `POST /api/queue`.)
- **At send:** `sendQueueItem` runs through the existing send guards (unsubscribe,
  recipient eligibility, one-account-invariant). A guard block marks the item
  `skipped` with the reason rather than throwing.

## Error handling & idempotency

- `idempotency_key` is unique per item; `sendQueueItem` transitions
  `approved → sending` with a guarded update (`updateMany where status=approved`)
  so a concurrent double-trigger (e.g. two cron polls) can only send once — the
  second sees 0 rows updated and no-ops.
- On Gmail failure: status `failed`, `error_message` recorded; surfaced in Outbox
  with a **Retry** action (resets to `approved`).
- HubSpot logging failure never blocks the send (already true in `sendEmail`).
- Clawd cron is at-least-once; the `sending`-guard + idempotency make the send
  effectively once.

## UI — Outbox tab

- New `TabsTrigger value="outbox"` in `DiscoveryHub` with a count badge of
  non-sent items.
- List grouped by `batch_id` (or flat if none), each row: recipient + account +
  distance, subject (inline-editable), body (expand to edit), **image thumbnail/
  preview**, status chip. Row actions: Edit, Remove, Send now.
- Batch bar: select-all, **Approve & schedule** (date-time + stagger), **Send all
  now**, filter by status (draft / approved / failed), Retry-failed.
- Sent items collapse into a "Sent" section (recent) with thread/HubSpot links.
- Adding: `ProspectContactsPanel` gets a **"Queue"** button beside "Email" that
  calls `addToQueue` with the built outreach (`buildOutreach`) — one click, toast
  confirms, no popup.

## Testing (TDD)

New pure/logic units get red→green tests first:
- **dedup-on-add**: EmailLog hit, unsubscribe hit, existing-queue hit, exclude-list
  hit → skipped with reason; clean → added.
- **due-selection**: only `status=approved && scheduled_for<=now`; respects cap and
  order; null `scheduled_for` excluded.
- **stagger assignment**: `approveBatch` spaces `scheduled_for` by `staggerMinutes`.
- **status transitions / idempotency**: `approved→sending` guarded update is
  single-winner; `failed→approved` retry; remove deletes only non-sent.
The Gmail send path itself is already covered by existing tests; `sendQueueItem`
gets a test that it calls the shared send logic and records result fields.

## Rollout

1. Prisma model + migration (`DraftQueueItem`).
2. `sendQueueItem()` extraction so `/api/email/send` and the queue share send logic.
3. Endpoints + server actions with dedup/guards (TDD).
4. Outbox tab UI + "Queue" button.
5. Hand Clawd the two cron contracts (`GET /api/queue/due`, `POST /api/queue/:id/send`,
   `CRON_SECRET`) so its Railway cron drives scheduled sends.
6. (Deferred) optional Vercel-cron backup poller over the same `due` selection.

## Open questions

- None blocking. Image fidelity: v1 uses hosted-URL `<img>` (works today); a `cid:`
  inline-attachment enhancement to `buildMimeMessage` is a later, optional upgrade
  for recipients who block remote images.
