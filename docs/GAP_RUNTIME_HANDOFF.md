# GAP OS Runtime: execution handoff (6A-6F + Sprint 7)

STATUS: ACTIVE
<!-- verified:2026-09-24 -->

You are a fresh Sonnet session. This file is your complete brief. Execute it end to end.
Do not re-plan, re-review or re-run Sprints 1-5; they are merged, live and verified.

---

## 0. Where you are

| Item | Value |
|---|---|
| Repo | modex-gtm (Next.js, Prisma, Postgres on Railway, Vercel project `prj_rSVCgdXqOqsXEmlrS1v8v2eoPV9V`, team `team_TkAjtDWif68PlLtgaIYZ5PLr`) |
| Worktree | `C:\Users\casey\wt-gap-os-runtime` (you are the ONLY writer here) |
| Branch | `feat/gap-os-runtime`, cut from `origin/main` at `d9a94dc2` |
| Merge of GAP core | PR #250, merge commit `d9a94dc28e8d152df04b5b03c3c2167339894d7b` (normal merge, history preserved) |
| Production SHA | `d9a94dc2`, deployment `dpl_DuRtGTpjdAWsHoHMxVzwLhK2c8kw` READY |
| Living spec | `docs/GAP_PROSPECTING_OS.md`. The ONLY plan. Append your ledger there; do not create a second plan |
| Prior review (read-only) | `C:\Users\casey\.claude\plans\pasted-content-id-c4bb-final-gap-tranquil-dusk.md` (B1-B9, R-A, R-B, SF1-SF17; all closed except SF14 + SF16 remainder) |

### Production state at handoff (2026-09-24)

Flags (Vercel Production env, call-time reads in `src/lib/gap/flags.ts`):

- ON: `GAP_OS_ENABLED`, `GAP_HYPOTHESIS_ENABLED`, `GAP_ROUTING_ENABLED`, `GAP_MESSAGE_COMPILER_ENABLED`, `GAP_REPLY_CLASSIFICATION_ENABLED`
- OFF (explicitly `false`): `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED`, `GAP_AUTO_ENROLL_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`
- `OUTREACH_PAUSED` untouched. The clawd autonomy halt (2026-08-19, outreach=false, actuator=false) is INTACT.
- The three GAP crons (`gap-hypothesize`, `gap-hubspot-replies`, `gap-enrollment-sync`) are NOT registered in `vercel.json`; manual only.

Production smoke result:

- `verify-triggers.ts` against prod: 30/30 PASS (single rolled-back transaction).
- `prisma migrate diff` prod vs `schema.prisma`: empty migration (no drift).
- Every GAP read path (`listHypotheses`, `listQueue`, `loadAgreementReport`, `listLearningPrograms`, `buildLearningReport` with and without program/date filters, `listReplies`) executed against prod inside a `SET TRANSACTION READ ONLY` transaction: all OK, all empty (prod GAP tables hold zero rows).
- Deployed runtime sees the flags: `GET /api/cron/gap-hypothesize/?dryRun=1&maxAccounts=1` (CRON_SECRET header) returned a real dry-run report, not a skip payload. It wrote nothing.
- Unauthenticated `/gap/` redirects to login, `/api/gap/*` 401s, `/login/` 200, yardflow.ai/demo/ 200.
- NOT done by the release session: an authenticated in-browser click-through of `/gap/*` (no signed-in browser was reachable), and the Phase 10 shadow dogfood (prod has no internal/test Account or Persona; fabricating one in the CRM-facing `accounts`/`personas` tables was refused as a prod-only workaround).

---

## 1. Rules of engagement (non-negotiable)

1. No Agent Team. No broad reconnaissance. Read only the files a ticket touches.
2. Atomic tickets, one commit each: code + focused test + spec ledger line in the same commit.
3. For every consequential invariant: RED -> implement -> GREEN -> deliberately break the invariant -> prove the owning test goes RED with the SPECIFIC reason -> restore. Assert specific refusal reasons, never bare booleans.
4. Every new behavior sits behind a call-time GAP flag that defaults OFF. With the new flag unset, behavior must be byte-identical to today.
5. Scratch DB only for e2e: the existing e2e scripts allowlist `127.0.0.1:5433/gap_dev` and `127.0.0.1:55432/gap_finish_e2e`. If the persistent credentials are missing, start a disposable Docker Postgres 16 on 127.0.0.1:55432, `prisma db push`, apply `prisma/sql/2026-09-23-gap-os.sql`, run `scripts/gap/verify-triggers.ts` (30/30+), and destroy the container after. Never point an e2e at Railway.
6. NEVER, in this phase: enroll a real contact, send a prospect email, write to HubSpot (except in unit tests with fakes), flip a production flag, run `prisma db push` against production, execute the hand SQL against production, reverse the clawd autonomy halt, or change `OUTREACH_PAUSED`.
7. Schema changes are allowed on the branch (additive only: new tables, nullable columns, new indexes, new triggers in a NEW dated hand-SQL file plus a matching rollback file). Each one must be listed in the spec's section 12 as a pending production delta. Production application is a Casey action (section 7 below).
8. One writer per worktree. If you use a mutation or review subagent, give it its own disposable worktree; never let it edit this one.
9. Voice in any copy/templates: no em dashes, no "throughput", "yards" plural.
10. Push the branch as you go. Open ONE PR at the end. Do not merge.

---

## 2. Known facts you must build on

- **Identity gap (drives 6A):** 19 of the 22 non-dismissed Pounce triggers in the last 30 days name an account that does NOT exactly match an `accounts.name` row (example: trigger `Niagara Bottling, Llc` vs Account `Niagara Bottling`). `registerSignal` throws on the FK, `runHypothesize` isolates it per account and reports `refused.PrismaClientKnownRequestError`. Result: the hypothesize cron is ~86% ineffective on real data. This is 6A's primary acceptance case.
- **Agent auth gap (drives 6B/Sprint 7):** `middleware.ts` wraps `/api/gap/*` in the NextAuth session check, so the header-token agent paths inside GAP routes (`x-gap-token`, Bearer CRON_SECRET, Bearer QUEUE_AGENT_SECRET) are unreachable in production; only session callers get through. `/api/cron/gap-*` bypasses middleware and uses its own CRON_SECRET check. Any automation path must go through a cron route or an explicitly carved-out, token-gated route (mirror the `/api/suppression` carve-out comment and `tests/unit/middleware-matcher.test.ts`).
- **Attribution field is mutable post-confirmation:** `GAP_DISPOSITION_FROZEN` freezes classes, buyer language and metadata on a confirmed disposition but not `enrollment_id`. 6D must decide: freeze it once set, or make reconciliation write it only through an audited path.
- **Deferred from the finish pass:** SF14 (compile verdicts have no age limit at enroll time, and signal freshness is not rechecked) and SF16 remainder (no `tests/unit/gap/gap-noninterference.test.ts` snapshot suite; DB triggers only exercised by the manual verifier). Both are folded into tickets below.
- Engine-created HubSpot deals are INTEGRATION-source stubs; the only valid heat discriminator is `num_associated_contacts > 0`.
- Clawd's `hubspot_autopush` STAGE_MAP effect is unverified; do not ship any live HubSpot write path that assumes it is inert.

---

## 3. The work, in order

Each sub-phase ends with its own scratch e2e script `scripts/gap/e2e-<phase>.ts` writing `docs/gap/<phase>-e2e-latest.md`, following the existing e2e shape (scratch-URL allowlist, scrubbed credentials, zero-leftover cleanup asserted per table).

### 6A. Canonical company/domain identity
Goal: one account resolves the same way from every source (Pounce trigger name, HubSpot company, persona email domain, manifest, clawd).
- A pure resolver `src/lib/gap/identity/` that normalizes legal-entity suffixes (Inc, LLC, Llc, Co, Corp, Ltd, "The", punctuation, case), maps domains to accounts, and returns `{ accountName, via: 'exact'|'alias'|'domain'|'normalized', confidence }` or a typed `unresolved` with the reason.
- An additive alias table (e.g. `account_aliases(alias, account_name, source, created_by, created_at)`) with a unique on normalized alias. Ambiguous normalization (two accounts collide) must refuse `ambiguous_identity`, never guess.
- Wire the resolver into `fromPounceTrigger`/`registerSignal` and `runHypothesize`, the reply address matcher, and routing inputs.
- Acceptance: the `Niagara Bottling, Llc` case resolves; an ambiguous collision refuses; a genuinely unknown company still refuses with `unresolved_company` and never creates an Account.

### 6B. Multi-engine execution contract
Goal: every outbound step, whatever sends it, is described by one contract and one ledger.
- A typed `ExecutionIntent` (engine: `modex_queue` | `hubspot_sequence` | `gmail_direct` | `manual`, persona, hypothesis, version/step, compile id, sender identity, idempotency key) and `ExecutionReceipt` (engine ids, status, timestamps).
- Every engine must pass the same pre-execution gate chain, in this order: kill switch/flags -> suppression (local + cross-plane, fail closed) -> active opportunity (B6) -> compile verification INCLUDING SF14 (compile age limit and cited-signal freshness recheck, refusal reasons `compile_stale` / `evidence_expired`) -> sender vetting (SF10).
- Refactor the existing modex queue enroll path onto the contract without behavior change; add `gap-noninterference.test.ts` (SF16 remainder) BEFORE the refactor to pin the non-GAP `approveBatch`/`addOne` call shapes.

### 6C. HubSpot + Gmail adapters
Goal: adapters implement 6B's contract; both ship DARK.
- HubSpot sequence adapter: enroll/unenroll via the Sequences API, behind `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED` (stays OFF). Record the HubSpot enrollment id on the receipt (B7 attribution).
- Gmail adapter: wraps the existing Gmail sender; must honor `OUTREACH_PAUSED` and the suppression chain.
- Unit tests with fake clients only. A scratch e2e proves each adapter refuses when its flag is off and produces a correct receipt with a fake transport when on.

### 6D. Generic campaign reconciliation
Goal: whatever actually happened in an engine is reconciled back to `SequenceEnrollment` / dispositions, idempotently.
- One reconciler interface per engine (read-only toward the engine), generalizing `gap-enrollment-sync`.
- Resolve the `enrollment_id` mutability question above (freeze-once-set trigger in the new hand SQL, verified by an extended `verify-triggers.ts`).
- Campaign/program attribution must flow from reconciliation, so R-A's program filter no longer depends on test-only stamping.

### 6E. Reply/call truth loop
Goal: every inbound reply and logged call becomes a human-confirmed disposition or an explicit "not relevant", with nothing silently dropped.
- Reply ingestion from Gmail and HubSpot into one queue (dedupe by source id and thread).
- AI suggestion stays an unconfirmed suggestion (the existing boundary: `created_by 'ai'`, `human_confirmed false`, no effects). Only a human session confirms. BIDs remain verbatim-quote-checked.
- Stop/DNC effects apply on confirmation, across every engine via 6B (a DNC on a HubSpot-enrolled contact must unenroll through the adapter, dark behind the flag, recorded otherwise as `stop_pending`).
- An "unprocessed replies older than N hours" count in the learning/ops view.

### 6F. Operational learning
Goal: learning answers "what should we do more/less of", not just rates.
- Extend `buildLearningReport` with per-engine and per-sender funnels, time-to-disposition, stale-hypothesis counts, reply backlog, and routing-agreement by rule over time.
- Keep B9 (internal/test exclusion) and R-A (program/date filters) intact; each new metric carries `{ value, n, numerator, denominator }`.

### Sprint 7. Shadow automation control plane
Goal: the system can say what it WOULD do, with caps and a drill, and never does it.
- Canary config, per-rule and global caps, the G1-G6 earned-gate evaluator (spec section 10), a kill-switch drill script, and an audit log of every would-be action.
- `GAP_AUTO_ENROLL_SHADOW` path only: produces shadow rows (`acted_by_system_at` stays NULL, no engine call). `GAP_AUTO_ENROLL_ENABLED` live path may be written and unit-tested with fakes but must refuse at runtime unless the autonomy halt state reads `outreach=true` (it does not, and you must not change it).
- Agent auth for any new automation route follows the middleware carve-out rule in section 2.

### Final integrated e2e
`scripts/gap/e2e-runtime.ts` on scratch: unresolved-name trigger -> 6A resolution -> signal -> hypothesis -> routing -> execution intent through the 6B gate chain -> fake-transport adapter receipt -> reconciliation -> reply ingestion -> AI suggestion -> human confirmation -> DNC/stop effects across engines -> learning (with B9 and R-A) -> Sprint 7 shadow decision with caps and a kill-switch drill. Zero leftovers.

---

## 4. Definition of Done

1. Every ticket for 6A-6F and Sprint 7 committed atomically on `feat/gap-os-runtime`, each with its focused test and a ledger line in `docs/GAP_PROSPECTING_OS.md`.
2. Per-phase scratch e2e reports plus `docs/gap/runtime-e2e-latest.md`, all PASS, zero leftovers.
3. All five Sprint 1-5 e2es and `e2e-finish-rc.ts` still PASS on the final HEAD (run once at the end, not per ticket).
4. `verify-triggers.ts` PASS on scratch with any new guards added to it.
5. `tests/unit/gap` all green, `npx tsc --noEmit` clean, full `npx vitest run` green except known pre-existing skips.
6. `gap-noninterference.test.ts` exists and passes (SF16 remainder closed); SF14 closed with `compile_stale` / `evidence_expired`.
7. Every new flag defaults OFF; with all new flags unset, the existing suites are unchanged.
8. Vercel preview build green on the final HEAD.
9. ONE PR opened against `main`, NOT merged, with a body listing: tickets, e2e receipts, every pending production schema delta (exact files), every new flag, and the section 5 Casey actions.
10. Section 11 of the spec gets a "GAP RUNTIME RELEASE CANDIDATE" block mirroring the core RC block's shape.

GitHub Actions CI is currently not running (account locked for billing); the Vercel build status and your local runs are the gates. Say so in the PR body.

---

## 5. Production actions that require future Casey approval (never do these yourself)

1. Merging the runtime PR.
2. Applying any new production schema delta: read-only `prisma migrate diff` preflight, then `db push` + the new hand SQL + `verify-triggers.ts` against prod.
3. Turning on any of: `GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED`, `GAP_HUBSPOT_MIRROR_ENABLED`, `GAP_AUTO_ENROLL_SHADOW`, `GAP_AUTO_ENROLL_ENABLED`, or any new flag this phase adds.
4. Registering any GAP cron in `vercel.json` schedules.
5. Reversing the clawd autonomy halt (one POST, Casey only) or changing `OUTREACH_PAUSED`.
6. Any real-prospect enrollment or send, and any live HubSpot write.
7. Creating internal/test Account or Persona rows in production for a dogfood run.

## 6. Named debt outside this phase (do not fix here)
- GitHub Actions billing lock (CI red on every commit, jobs never start).
- The browser rig Chrome is wedged (Playwright attach times out) and holds no modex-gtm session; relaunch with `launch-rig.ps1` when a UI check is needed.
