# TAM → Qualification → #yardflow-intent Wiring Plan

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development to implement. Steps use checkbox (`- [ ]`).

**Goal:** Light up the intent→qualify→alert funnel on the real 6,881-account TAM. Re-point the (already built+tested) MQL/SQL engine from the dead corridor score to `yardflow_tam='in'`, and make **#yardflow-intent** the live feed of every new SQL — not just anonymous web hits.

**Architecture:** Code decides (`src/lib/revops/qualification/*` on branch `feat/qualification-engine`) → writes `yardflow_qual_verdict` + fires Slack on new SQLs via the existing `sendSlackNotification()` (SLACK_WEBHOOK_URL → #yardflow-intent). Native HubSpot reporting lists/workflows actuate lifecycle. Dry-run/apply gated.

**Stack:** modex-gtm (Next.js, TS, Vitest), HubSpot API, existing `src/lib/microsites/intent-notifications.ts` Slack webhook.

---

## Sprint 1 — Re-point the qualification gate to TAM

### Task 1.1: TAM fields on QualCompany
**Files:** `src/lib/revops/qualification/types.ts`, `evaluate.ts`
- [ ] Add `tam: string` and `tier: string` to `QualCompany` (keep `icpScore` as a secondary priority signal).
- [ ] `fetchTamCompanies()` → fetch companies where `yardflow_tam = 'in'` (HubSpot search, paginate; properties `name, yardflow_tam, tam_tier, yardflow_icp_score`). Rename to `fetchTamCompanies(minTier?)` — drop the `minScore` param meaning; the gate is the tag now. Map `tam` and `tier`.
- [ ] Run `npx tsc --noEmit | grep qualification || echo OK`. Commit.

### Task 1.2: Gate on TAM tag, tested (TDD)
**Files:** `model.ts`, `tests/unit/qualification-model.test.ts`
- [ ] Update test fixtures: TAM company = `{tam:'in'}`, non-TAM = `{tam:'out'}`/`{tam:'review'}`.
- [ ] `classifyContact()` gate: replace `company.icpScore < ICP_THRESHOLD` with `company.tam !== 'in'` → return `'none'`. Role + intent logic unchanged.
- [ ] Add `tam_tier` passthrough into `VerdictDiff` (for prioritization/Slack).
- [ ] `npx vitest run tests/unit/qualification-model.test.ts` green. Commit.

### Task 1.3: Cron + dry-run shape
**Files:** `route.ts`, `evaluate.ts`
- [ ] `evaluateQualification()` drops `minScore`; iterates TAM (`yardflow_tam='in'`) companies → contacts → diff. Counts unchanged.
- [ ] Dry-run JSON sample includes `tam_tier` per row. `npx tsc --noEmit` clean. Commit.

---

## Sprint 2 — #yardflow-intent in the SQL moment

### Task 2.1: SQL Slack alert (reuse the existing webhook)
**Files:** new `src/lib/revops/qualification/notify.ts`, `apply.ts`
- [ ] `notify.ts`: `notifyNewSqls(rows: VerdictDiff[])` — for each row where `newVerdict==='sql'` AND `currentVerdict!=='sql'` (a genuine promotion), build a one-line Slack message: `🔥 New SQL: <name> — <title> @ <account> (Tier <tier>, <segment>) · <reason>` and post via `sendSlackNotification()` from `@/lib/microsites/intent-notifications`. Batch into one message if many (avoid spam): a header + up to ~15 lines, "+N more".
- [ ] Call `notifyNewSqls(changedSqlRows)` from `applyVerdicts` (or the cron route) ONLY in `mode=apply` (so dry-run is silent). Guard: skip if `SLACK_WEBHOOK_URL` unset (the helper already warns).
- [ ] Test `notify.ts`'s message builder (pure) in `tests/unit/qualification-notify.test.ts`; the send is mocked/skipped in test (no env). Commit.

### Task 2.2: Keep web/demo intent flowing
- [ ] Verify the existing intent engine (`src/lib/microsites/*` → `sendSlackNotification`) is untouched and still fires #yardflow-intent on high-intent web/demo sessions. No code change; confirm by reading the path. The two Slack sources (web-intent + new-SQL) now both land in #yardflow-intent = the unified hot-signal feed.

---

## Sprint 3 — Deploy + dry-run (read-only)

- [ ] Merge `feat/qualification-engine` → `main` (stage ONLY the 9 qualification files + notify + this plan; the repo carries unrelated WIP — NEVER `git add -A`). Push → Vercel prod build.
- [ ] Trigger dry-run: `curl "$VERCEL_URL/api/cron/qualification?secret=$CRON_SECRET&mode=dryrun"` (CRON_SECRET = the MC_API_TOKEN value per Casey). Report MQL/SQL counts + sample across the 6,881-account TAM. **No writes. No Slack.**

---

## Sprint 4 — Gated apply + backfill (DESTRUCTIVE — Casey's go)

- [ ] Casey reviews the dry-run counts. On approval: `?mode=apply` → writes `yardflow_qual_verdict` to changed contacts AND fires #yardflow-intent for new SQLs.
- [ ] Build the 2 reporting Active Lists (`yardflow_qual_verdict=mql` / `=sql`) + the native lifecycle workflows (verdict → lifecyclestage), left ON after review. Verify funnel deltas; watch #yardflow-intent.
- [ ] Add the daily cron to `vercel.json` (`/api/cron/qualification?mode=apply`, daily).

---

## Sprint 5 — Working surfaces on TAM

- [ ] Rebuild Hot Accounts list (#72) + daily-digest worklist keyed to `yardflow_tam='in'` + `tam_tier` + intent, so the morning view reflects the real TAM. (Browser rig for the list; `daily-digest/route.ts` for the digest query.)

---

## Sprint 6 — Contact-coverage worklist (read-only analysis)

- [ ] Query TAM accounts (`yardflow_tam='in'`, especially `tam_tier='A'`) with `num_associated_contacts < 3`. Output a sourcing worklist (CSV) — these are target accounts with no people to qualify. Feed to Apollo (when credits reset 2026-06-27) / clawd for contact sourcing. This is what keeps the TAM converting instead of sitting idle.

---

## Notes
- **#yardflow-intent is the spine:** existing web/demo intent + new-SQL promotions both feed it. That's the "stay in the loop" requirement satisfied in code.
- Hybrid preserved: code computes verdict + Slack; native lists/workflows do lifecycle. Slack-on-SQL lives in code (testable, reliable) not a fragile UI workflow.
- All destructive action (bulk apply, workflow turn-on, prod deploy) gated to Sprints 3–4 with Casey's review of the dry-run.
