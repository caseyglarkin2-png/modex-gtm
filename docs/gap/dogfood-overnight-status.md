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

- **Phase 0 (D0, D1)**: DONE, committed (`6e19df91`, `1e2e7263`), pushed to
  `origin/feat/gap-os-dogfood`. registerAlias CONFLICT reporting +
  GAP-scoped reply backlog. 2433 GAP tests pass.
- **Phase 1 (identity coverage audit, read-only)**: DONE. Script
  `scripts/gap/dogfood-identity-audit.ts`, report
  `docs/gap/dogfood-identity-before.md`. Production result: 0/1707 accounts
  have `hubspot_company_id`, 0 verified domains, 0 aliases. Pounce cohort
  (43 distinct non-dismissed account_names, last 500 triggers): 16 resolve
  by normalized name, 27 UNRESOLVED, 0 AMBIGUOUS. 11 of the 27 are bare
  ticker symbols (LOW, GXO, PG, MATX, SNDR, CHRW, CL, ARCB, KNX, JBHT, CAG).

## Production writes made

None yet as of this checkpoint.

## Production writes NOT made (and why)

- No `Account.hubspot_company_id` backfill yet -- Phase 2, in progress.
- No `GapAccountAlias` rows yet -- same.
- No Inland26 GAP-local reconciliation records yet -- Phase 3, not started.
- No `ProspectingHypothesis` rows yet -- Phase 4, not started.

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

- None blocking yet. Ticker-symbol aliasing (11 names) and the Walmart /
  Pinc / Cloumbian names need human judgment before any alias write --
  queued as CASEY_REVIEW_REQUIRED items, not a stop condition.

## Exact next task

Phase 2: for the 16 already-resolved Pounce accounts and the 11 ticker
symbols, look up each company in HubSpot (MCP `search_crm_objects` /
`get_crm_objects`) to get its real `hubspot_company_id` and domain. Where
exactly one HubSpot company deterministically matches exactly one existing
`Account` row, write `Account.hubspot_company_id`. For the 11 tickers,
write a `GapAccountAlias` (ticker -> canonical account name) only when the
mapping is unambiguous (one Account row, not a near-duplicate pair like the
already-documented Tyson Foods/Tyson case). Ambiguous cases go to
`docs/gap/casey-morning-decision-queue.md` as CASEY_REVIEW_REQUIRED, not
guessed. Then re-run `scripts/gap/dogfood-identity-audit.ts` and write
`docs/gap/dogfood-identity-after.md`.

## Test results

- `npx vitest run tests/unit/gap` (full GAP suite): 2433/2433 pass, as of
  commit `1e2e7263`.
- `npx tsc --noEmit`: clean on all touched files.

## Casey decisions needed later

See `docs/gap/casey-morning-decision-queue.md` once Phase 2+ populates it
(not created yet as of this checkpoint).
