# Track B — Operational visibility (#9)

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Goal:** The Outbox shows what's actually happening, so Casey moves fast without flying blind. No guards, no extra clicks to send.

**Scope:** render fields already on `DraftQueueItem` (no schema change); accurate badge past the 200 cap; live batch-send progress + cancel.

(Deferred: a *stored* already-contacted signal needs a schema field — it's an extension of comms-awareness, tracked separately. Track B surfaces what exists today.)

## Task B1: Accurate actionable count (badge past 200)
**Files:** Modify `src/app/discovery/queue-actions.ts`; Test `tests/unit/queue-count.test.ts`.
- Add owner-scoped `countActionableQueue(): Promise<number>` = `prisma.draftQueueItem.count({ where: { ...ownerScope, status: { in: ['draft','approved','failed'] } } })` (admins: all owners). Returns 0 when unauthenticated.
- TDD (mirror `queue-actions.test.ts` mocking `@/lib/auth` + `@/lib/prisma`): unauthenticated → 0; authed rep → count called with owner + the three statuses; admin → no owner predicate.

## Task B2: Row metadata + reasons (outbox-tab OutboxRow)
**Files:** Modify `src/app/discovery/outbox-tab.tsx`. (UI; keep tsc+lint clean.)
- On each row, when present, show small muted metadata:
  - `approved` + `scheduled_for` → `Scheduled <localized date/time>` (use `toLocaleString`).
  - `sent` + `sent_at` → `Sent <localized>`.
  - `variant_key` → a small `A`/`B` badge (purple-ish, like the seq badge) titled "A/B variant".
- On `failed` rows render `item.error_message` inline (red, small) and on `skipped` rows render `item.skipped_reason` (amber, small) — so the reason persists after the toast.
- No em/en dashes in new copy.

## Task B3: Badge wiring + cap indicator
**Files:** Modify `src/app/discovery/outbox-tab.tsx`, `src/app/discovery/discovery-hub.tsx`.
- discovery-hub: on mount, set the tab badge from `countActionableQueue()` instead of `listQueue().length`.
- outbox-tab `refresh()`: call `onCountChange?.(actionableCount)` where actionableCount = items filtered to draft/approved/failed (the loaded set) — or call `countActionableQueue()` for accuracy. Header keeps "N drafts queued" but when the loaded list length === 200 (the take cap), append " (showing latest 200)".

## Task B4: Batch-send progress + cancel (outbox-tab)
**Files:** Modify `src/app/discovery/outbox-tab.tsx`.
- `handleSendAll`: add `sendProgress` state `{ done, total }` and a `cancelRef` (useRef<boolean>). Before each iteration check `cancelRef.current` and break. While sending, the "Send all now" button shows `Sending {done}/{total}` and a **Cancel** button appears that sets `cancelRef.current=true`. Reset on completion. Toast the final tally (existing behavior) plus "(cancelled)" if stopped early.
- One click still starts it; cancel only halts the remaining queue. No confirmation dialog.

## Ship
One PR → green CI → merge → deploy → verify.
