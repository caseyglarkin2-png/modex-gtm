# GAP OS dogfood overnight status (durable handoff)

<!-- verified:2026-09-24 -->

Read this file plus `docs/GAP_PROSPECTING_OS.md` and directly relevant files on
resume. Do not reread old transcripts.

## Current HEAD

Branch `feat/gap-os-dogfood`, worktree `C:\Users\casey\wt-gap-os-dogfood`.
Latest commit at time of writing: `1e2e7263` (D1, reply backlog scope).
Phase 1 audit is uncommitted at the moment this file was first written; see
"next task" below -- if you are resuming and the identity-audit script/docs
are already committed, trust `git log`, not this paragraph.

## Completed phases

- **Phase 0 (D0, D1)**: DONE, committed (`6e19df91`, `1e2e7263`), pushed.
  registerAlias CONFLICT reporting + GAP-scoped reply backlog. 2433 GAP
  tests pass.
- **Phase 1 (identity coverage audit, read-only)**: DONE, committed
  (`a0274ea5`), pushed. `docs/gap/dogfood-identity-before.md`. 0/1707
  accounts had `hubspot_company_id`; Pounce cohort 16/43 resolved.
- **Phase 2 (identity bootstrap writes)**: DONE. `docs/gap/dogfood-identity-after.md`.
  12 accounts backfilled with `hubspot_company_id`, 7 ticker-symbol
  `GapAccountAlias` rows created (all CREATED, zero CONFLICT). Coverage
  16/43 -> 23/43 (53%). 3 tickers/names skipped for lack of a deterministic
  match on one side or the other (logged, not guessed).
- **Phase 3 (Inland26 reconciliation, read-only)**: DONE, committed
  (`1e67ddfa`), pushed. `docs/gap/inland26-dogfood-reconciliation.md`.
  Corrected the earlier by-hand AMBIGUOUS call on Tyson Foods (resolves
  cleanly against live data; real outcome is HYPOTHESIS_MISSING). Walmart
  stays IDENTITY_UNRESOLVED.
- **Phase 4 (real hypothesis cohort)**: DONE. `docs/gap/dogfood-hypothesis-cohort.md`.
  20 real draft hypotheses across 8 accounts (UNFI, PepsiCo x9, FedEx, Home
  Depot x2, Coca-Cola, General Mills x4, Kroger x2), built from live 10-Q/
  10-K and news signals via the real (non-dry-run) `runHypothesize`. All
  `status: draft`. Zero sends, zero enrollments, zero fabricated evidence.

## Production writes made

- `Account.hubspot_company_id` set on 12 rows (Phase 2): Unfi, Niagara
  Bottling, Amazon, PepsiCo, John Deere, The Home Depot, Odfl, UPS, Kraft
  Heinz, XPO, General Mills, Kroger.
- `GapAccountAlias` created for 7 tickers (Phase 2): LOW, GXO, PG, MATX,
  ARCB, JBHT, CAG -> their real canonical Account names.
- `ProspectingSignal` rows: 17 new + 6 already-existing reused (Phase 4),
  frozen facts, not outreach.
- `ProspectingHypothesis` rows: 20 new, all `status: draft` (Phase 4).

## Production writes NOT made (and why)

- No `Account` created, merged, or deleted anywhere (not authorized).
- No `GapAccountAlias` written for Walmart, CL, KNX, SNDR, Loblaw, Target
  -- each lacks a deterministic 1:1 match on the HubSpot side, the Account
  side, or both. See `docs/gap/dogfood-identity-after.md` and the decision
  queue.
- No Inland26 `ConversationDisposition` rows written -- all six evidence
  rows classified IDENTITY_UNRESOLVED or HYPOTHESIS_MISSING, neither of
  which is ever recorded as a disposition.
- No HubSpot write, no Gmail write, no send, no enrollment, anywhere.

## Current flags (unchanged from session start; NOT touched)

```
GAP_OS_ENABLED=true
GAP_HYPOTHESIS_ENABLED=true
GAP_ROUTING_ENABLED=true
GAP_MESSAGE_COMPILER_ENABLED=true
GAP_REPLY_CLASSIFICATION_ENABLED=true
GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED=false
GAP_HUBSPOT_MIRROR_ENABLED=false
GAP_AUTO_ENROLL_ENABLED=false
GAP_AUTO_ENROLL_SHADOW=false
```

`GAP_AUTO_ENROLL_SHADOW` has NOT been flipped. Do not flip it without
re-reading Phase 6 gates in the overnight directive and confirming this
file's "unresolved blockers" section is empty for that phase.

## Environment note (this worktree only, not committed)

`.env.local` in this worktree was populated with `DATABASE_URL`,
`HUBSPOT_ACCESS_TOKEN`, `POUNCE_INGEST_TOKEN` copied from
`C:\Users\casey\modex-gtm\.env.local` (the durable main checkout) so
read-only production Prisma queries could run from a script. It is
git-ignored (`.env.local` is in `.gitignore`) and was never printed or
committed. A prior session (`docs/gap/inland26-runtime-reconcile-dry-run.md`)
explicitly declined to do this and did the Inland26 classification by hand
instead -- that constraint is now superseded by Casey's explicit overnight
authorization to run production reads.

## Unresolved blockers

- None stop-the-run blocking. Walmart's canonical account, CL/KNX/SNDR/
  Loblaw/Target's missing HubSpot-or-Account match, and the pre-existing
  FedEx/Coca-Cola/RXO near-duplicate Account rows all need human judgment
  -- queued in `docs/gap/casey-morning-decision-queue.md`, not guessed.

## Exact next task

DONE for tonight. All independently executable phases (0-4, 6, 8-11)
complete; see `docs/gap/DOGFOOD_MORNING_BRIEF.md` for the final summary and
`docs/gap/casey-morning-decision-queue.md` for what's waiting on Casey.
Next session should start there, not re-run Phases 0-4 (idempotent, but
unnecessary -- nothing changed since this checkpoint unless Casey has
already acted).

## Test results (final, Phase 10)

- `npx vitest run tests/unit/gap` (full GAP suite): **2433/2433 pass**,
  final run at commit `73e1677c`.
- `npx tsc --noEmit` (full repo): clean.

## Casey decisions needed later

See `docs/gap/casey-morning-decision-queue.md` (6 items as of this
checkpoint: Walmart canonical account, Tyson hypothesis tracking, SNDR/
Loblaw ambiguity, CL/KNX/Target missing Account rows, FedEx/Coca-Cola/RXO
dedup, and reviewing the 20-hypothesis Phase 4 cohort).
