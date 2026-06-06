# Track C — Sequences made usable (#4)

**Goal:** The sequence machinery (already wired in the runtime) becomes usable in the UI: set per-step copy, see which step an enrolled draft is on, unenroll, and delete a sequence. No guards.

The runtime (`sequence-runtime.ts`) already uses each step's `subjectTemplate`/`bodyTemplate` (falling back to the base draft) and tracks `step_index`/`sequence_run_id`. Track C exposes that.

## Task C1: unenroll + delete actions (queue-actions)
**Files:** Modify `src/app/discovery/queue-actions.ts`; Test `tests/unit/sequence-actions.test.ts`.
- `unenrollFromSequence(draftIds: number[]): Promise<{ ok:true; unenrolled:number } | { ok:false; reason:string }>` — owner-scoped; for each id, `updateMany({ where: ownerWhere(id, session, [STATUS.draft, STATUS.approved]), data: { sequence_id: null, sequence_run_id: null, step_index: null } })`; sum counts. Unauthenticated → `{ ok:false, reason:'unauthenticated' }`.
- `deleteSequence(id: number): Promise<{ ok:true } | { ok:false; reason:string }>` — owner-scoped delete of a `Sequence` row (admins bypass owner). `deleteMany({ where: { id, ...(role!=='admin' ? { owner: email } : {}) } })`; count 0 → `{ ok:false, reason:'not_found_or_forbidden' }`.
- TDD (mirror queue-actions.test mocking of `@/lib/auth` + `@/lib/prisma`): unenroll unauthenticated → reason; unenroll authed → updateMany called per id with the null-ing data + owner scope; deleteSequence not-found → reason; deleteSequence ok.

## Task C2: sequence UI (outbox-tab)
**Files:** Modify `src/app/discovery/outbox-tab.tsx`.
- **Per-step copy** in the create-sequence panel: for each follow-up step, beside the days input add optional `subjectTemplate` + `bodyTemplate` inputs (small, placeholder "optional subject override" / "optional body override"). Thread them into the `steps` passed to `createSequence` (the action's `SequenceStepInput` already has `subjectTemplate?`/`bodyTemplate?`). Keep step 0 (initial) with no template inputs (it uses the draft's own copy).
- **Step badge on rows:** in `OutboxRow`, when `item.sequence_id != null`, change the `seq` badge text to `seq · step ${(item.step_index ?? 0) + 1}` (1-based).
- **Unenroll:** on enrolled rows (`item.sequence_id != null`, status draft/approved), add a small "Unenroll" ghost button that calls `unenrollFromSequence([item.id])`, toasts the result, and refreshes.
- **Delete sequence:** in the sequences list, add a small trash button per sequence calling `deleteSequence(s.id)` then `refreshSequences()`; toast result.
- No em/en dashes in new copy. Keep tsc + eslint clean; run queue tests after.

## Ship
One PR → green CI → merge → deploy → verify.
