# MQL/SQL Qualification Engine — Design Spec

Date: 2026-06-11
Owner: Casey Larkin (founding AE, YardFlow by FreightRoll)
Status: Approved (hybrid architecture), pre-implementation

## Problem

HubSpot portal 3819073 has the raw signals to qualify leads — `yardflow_icp_score` on
companies (451 scored), `hs_seniority`/`hs_role` on contacts (2,764 with seniority), and a
live intent pipeline (`intent_score`, `last_intent_at`) — but **none of them drive lifecycle.**
Lifecycle stage is set by import, not by fit/role/intent. ~1,278 contacts sit at TAM-qualified
accounts in `Prospect`/`Warm`/`Interested` with no path to MQL/SQL. We need an engine that
qualifies the right people at accounts worth winning and promotes them to SQL on real intent.

The line itself is already defined and approved in `yardflow-hubspot/QUALIFICATION-MODEL.md`.
This spec covers HOW we build it.

## Architecture — Hybrid (code decides, HubSpot actuates)

Separate the **decision** from the **actuation**:

- **Brain (code, modex-gtm):** a tested model computes a verdict and writes ONE clean contact
  field, `yardflow_qual_verdict` ∈ {`none`, `mql`, `sql`}. The complex TAM × role × intent logic
  lives here — version-controlled, unit-tested, dry-runnable.
- **Nervous system (native HubSpot):** because the verdict is a single clean field, native
  surfaces become trivial and robust:
  - **2 Active Lists** filter on `yardflow_qual_verdict` (clean working/reporting views).
  - **2 Workflows** are single-condition triggers that actuate: set `lifecyclestage`, fire the
    Slack alert to #yardflow-intent, create a task for Casey. No fragile multi-clause filters —
    the hard logic already ran in code.

Why hybrid beats pure-code or pure-native:
- Robustness + testability of code, plus the native leverage RevOps can see and tune without a deploy.
- `yardflow_qual_verdict` = engine's opinion; `lifecyclestage` = CRM truth. They stay distinct, so
  human overrides aren't fought by the cron, and divergence is observable.
- Writing the verdict is **harmless** (advisory; zero side effects until workflows are ON), so the
  only destructive step is turning on the workflows — gated on Casey's review of the dry-run diff.

## The model (tunable constants in code)

Lifecycle internal IDs: `lead` (Prospect), `28942939` (Warm), `22575941` (Interested),
`28840312` (Holding), `marketingqualifiedlead` (Engaged/MQL), `salesqualifiedlead` (SQL),
`customer` (Closed Won), `25152093`/`25153610` (Closed Lost). Rank: Prospect < Warm < Interested
< Holding < MQL < SQL < Won.

### Account fit (TAM gate)
Associated company `yardflow_icp_score >= ICP_THRESHOLD` (default **70**).

### Role gate (influenceable person) — at least one of:
- `hs_seniority ∈ {executive, vp, director, owner, partner}` (senior leader, any function), OR
- `hs_role == operations` (structured ops function), OR
- `jobtitle` matches `OPS_TITLE_TOKENS` = {operations, supply chain, transportation, transport,
  logistics, warehouse, distribution, fleet, freight, dock, yard, "DC", procurement, planning}.
- **Exclude** when none of the above AND seniority ∈ {entry, employee} (junior, off-function).

### Verdict computation
- `sql` if (account fit AND role gate AND intent signal)
- else `mql` if (account fit AND role gate)
- else `none`

The verdict is the **minimum tier the contact should hold**. Workflows only promote UP (never
demote), so a contact already past the verdict tier is untouched.

### Intent signal (SQL gate) — any of:
- `intent_score >= 1`, OR `last_intent_at` present, OR `last_intent_source` present, OR
- `hs_sales_email_last_replied` present, OR `engagements_last_meeting_booked` present, OR
- `hs_email_open >= 2 AND hs_email_replied >= 1`.

## Components (modex-gtm)

```
src/lib/revops/qualification/
  model.ts        # pure: classifyContact(company, contact) -> Verdict; constants; OPS_TITLE_TOKENS
  model.test.ts   # vitest fixtures: ops-mgr included, junior-IT excluded, intent variants, threshold edges
  evaluate.ts     # fetch candidate contacts + associated companies, apply model, emit VerdictDiff[]
  apply.ts        # given diff, batch-write yardflow_qual_verdict (guarded by external-write-guard)
  types.ts        # Verdict, VerdictDiff, EvaluateResult
src/app/api/cron/qualification/route.ts   # CRON_SECRET-guarded; ?mode=dryrun (default) | apply
```

Reuse existing infra: `src/lib/hubspot/{client,contacts,companies,properties}.ts` for reads/writes,
`assertExternalWriteAllowed('hubspot', op)` in apply, the `writeback-preview` diff convention.

### Dry-run diff (the safety centerpiece + S4 gate)
`evaluate.ts` produces, per candidate: `{contactId, name, email, company, icpScore, seniority,
role, currentLifecycle, currentVerdict, newVerdict, reason}`. `?mode=dryrun` logs the full diff +
summary counts (none/mql/sql, and how many would change). Writes NOTHING. This is what Casey
reviews before activation.

## Native HubSpot surfaces (built via browser rig, left OFF until S4)
- **List: "MQL — Qualified, awaiting intent"** = `yardflow_qual_verdict = mql`.
- **List: "SQL — Qualified + intent"** = `yardflow_qual_verdict = sql`.
- **Workflow A (MQL):** trigger `yardflow_qual_verdict = mql` AND `lifecyclestage` rank < MQL →
  set `lifecyclestage = marketingqualifiedlead`.
- **Workflow B (SQL):** trigger `yardflow_qual_verdict = sql` AND `lifecyclestage` rank < SQL →
  set `lifecyclestage = salesqualifiedlead` + Slack #yardflow-intent + task for Casey.

New property to create: `yardflow_qual_verdict` (contact, enumeration: none/mql/sql) +
`yardflow_qual_evaluated_at` (datetime, audit).

## Testing
- `model.test.ts` covers the decision matrix (TDD, Sprint 1) — no network.
- `evaluate.ts` tested against fixture HubSpot payloads (no live calls; write-guard blocks in test).
- Dry-run against live CRM is the integration check (read-only).

## Rollout (sprints)
- **S0** Recon (enums ✓, finalize tokens/thresholds, baseline TAM funnel), create the 2 properties.
- **S1** `model.ts` + tests (TDD).
- **S2** `evaluate.ts` + cron `?mode=dryrun`; run it, capture counts + sample.
- **S3** `apply.ts` (write verdict, harmless) + 2 Active Lists + 2 Workflows (OFF).
- **S4** GATED: Casey reviews dry-run diff → apply verdicts → turn on workflows → verify funnel →
  schedule daily cron in `vercel.json`.

## Risks / mitigations
- **Mass mislabel:** dry-run diff reviewed before any write; verdict write is side-effect-free until
  workflows on; workflows only promote up (no demotions).
- **Stale association data:** evaluate reads current associated company; contacts with no company or
  unscored company → verdict `none`.
- **Sequence-enrolled contacts:** lifecycle change via workflow is allowed during enrollment (only
  MERGE is blocked); SQL Slack/task still fire.
- **Tier limits:** workflows confirmed available (prior SQL-visit workflow shipped); custom contact
  properties available on all tiers.

## Out of scope
- Company-level scoring changes (uses `yardflow_icp_score` as-is).
- Demotion logic (engine only promotes).
- Backfilling `hs_seniority`/`hs_role` where blank (separate enrichment concern).
