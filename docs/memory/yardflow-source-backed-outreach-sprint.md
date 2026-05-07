# Source-Backed Account Outreach Engine Sprint Plan (Reality-Based, Branch-Aware)

## Current Branch Reality (Discovered + Preserved)
1. Existing in-progress UX work already changed account intel refresh behavior (`refresh-diagnostics`, refresh cooldown/dedupe, intel strip state handling).
2. Existing in-progress account workflow work already changed candidate/outcome panels and related tests.
3. Existing send stack supports single-email `cc` but did not support normalized CC in bulk sync/async contracts.
4. Existing send endpoints validated generated-content existence but did not enforce generated-content approval at send/queue/dispatch.
5. Existing async worker did not recheck approval at dispatch time.
6. Existing account proof seed route existed and now remains the deterministic backbone for account-page proof scenarios.
7. Account page now includes staged candidate discovery + promote/defer/replace actions on the Contacts tab using existing candidate routes.
8. Source-backed attribution is now generated, validated (citation threshold), persisted, and rendered in existing account/sequence/agent-action surfaces.
9. Account outreach shell now supports optional qualified CC suggestions + normalized CC payloads for sync and async send paths.
10. Candidate traces are now threaded through send logs and outcome source payloads to preserve candidate->send->outcome lineage.
11. Legacy generated content approval backfill utility/script now exists for rollout-safe gate enablement.
12. Source-backed operational metrics and an outage/remediation runbook now exist for release readiness.
13. Account command center proof reliability depends on local auth URL overrides in proof harness (`NEXTAUTH_URL`/`AUTH_URL` set to local base URL) to prevent `MissingCSRF` cross-host redirects.
14. Account command center proof seed route transaction now requires elevated Prisma transaction bounds (`maxWait`/`timeout`) due deterministic fixture write volume.

This plan keeps all existing branch edits and composes on top of them.

## Locked Invariants (ADR)
Reference: `docs/roadmaps/source-backed-outreach-invariants-adr.md`

1. One-account invariant: payloads must resolve to one canonical account scope.
2. Generated-content sends are approval-gated (enqueue + dispatch defense in depth when gate is enabled).
3. Sidecar failures for source-backed workflows are explicit and actionable.
4. Evidence lifecycle is versioned/upserted and freshness-tagged (no silent deletion).
5. No new pages; existing account/compose/queue/proof surfaces only.

## Feature Flags (Kill Switches)
1. `SOURCE_EVIDENCE_INGEST_ENABLED`
2. `SOURCE_APPROVAL_GATE_ENABLED`
3. `SOURCE_CC_BULK_ENABLED`

## Sprint Breakdown (Atomic, Committable, Testable)

### Sprint 0: Governance + Shared Contracts
Goal: lock policy + shared contracts before route/UI changes.

- [x] `S0-T1` Add ADR for invariants.
  - Validation: doc present and referenced by implementation comments/tests.
- [x] `S0-T2` Add source-backed contracts (`SourceEvidence`, reason codes, sidecar health schema).
  - Validation: `tests/unit/source-backed-contracts.test.ts`.
- [x] `S0-T3` Add feature flags for evidence ingest, approval gate, bulk CC.
  - Validation: `tests/unit/feature-flags.test.ts`.

Demoable output: contracts compile + flags toggle behavior.

### Sprint 1: Evidence Model + Seeded Visibility
Goal: persist claim-level evidence primitives and show seeded summary in existing account surface.

- [x] `S1-T1` Add Prisma models `ResearchRun`, `EvidenceRecord`, and async recipient `cc_emails` field.
  - Validation: `prisma generate` + `npx tsc --noEmit`.
- [x] `S1-T2` Add evidence service (`createResearchRun`, `upsertEvidenceRecords`, freshness policy, summary loader).
  - Validation: `tests/unit/source-evidence.test.ts`.
- [x] `S1-T3` Extend account proof seed route to include succeeded + failed research runs and deterministic evidence rows.
  - Validation: seed route contract and account proof flow compatibility.
- [x] `S1-T4` Extend account command center loader to fetch canonical-scope evidence summary.
  - Validation: type-check + page render path.
- [x] `S1-T5` Render source evidence summary card in existing account command center panel.
  - Validation: page compile + local render sanity.
- [x] `S1-T6` Wire broker best-effort evidence ingest under flag during content-context refresh.
  - Validation: `tests/unit/agent-actions-broker.test.ts` compatibility + `npx tsc --noEmit`.

Demoable output: account page shows seeded evidence freshness/run summary with no new route.

### Sprint 2: Approval Gate Hardening (Generated Content)
Goal: enforce generated-content approval for send paths.

- [x] `S2-T1` Add approval decision service (`requiresApprovalForSend`) using `MessageEvolutionRegistry`.
  - Validation: `tests/unit/generated-content-approval.test.ts`.
- [x] `S2-T2` Add send-blocker reason `APPROVAL_REQUIRED` and structured details.
  - Validation: route tests assert blocked payload shape.
- [x] `S2-T3` Enforce approval check in `/api/email/send` when generated content is supplied and flag is on.
  - Validation: `tests/unit/email-send-routes.test.ts`.
- [x] `S2-T4` Enforce approval check in `/api/email/send-bulk` under same semantics.
  - Validation: `tests/unit/email-send-routes.test.ts`.
- [x] `S2-T5` Enforce enqueue-time check in `/api/email/send-bulk-async`.
  - Validation: `tests/unit/email-send-bulk-async-route.test.ts`.
- [x] `S2-T6` Enforce dispatch-time recheck in `/api/cron/process-send-jobs`.
  - Validation: `tests/unit/process-send-jobs-route.test.ts`.

Demoable output: generated content can be rejected at queue/send/dispatch when approval gate is enabled.

### Sprint 3: One-Account Invariant + CC Normalization
Goal: one-account scoping and qualified CC behavior across sync/async send flows.

- [x] `S3-T1` Add one-account invariant service (`enforceOneAccountInvariant`) with canonical-scope logic.
  - Validation: `tests/unit/one-account-invariant.test.ts`.
- [x] `S3-T2` Add reason-code blocker `MIXED_ACCOUNT_PAYLOAD`.
  - Validation: route tests (invalid scope).
- [x] `S3-T3` Normalize CC schema parsing (`string` or `array`) for single, bulk, async item contracts.
  - Validation: schema parse matrix via route tests.
- [x] `S3-T4` Apply one-account invariant in single send and bulk sync/async sends.
  - Validation: `tests/unit/email-send-routes.test.ts`, `tests/unit/email-send-bulk-async-route.test.ts`.
- [x] `S3-T5` Propagate CC to provider payloads and async worker dispatch (`cc_emails` persisted).
  - Validation: `tests/unit/process-send-jobs-route.test.ts`.
- [x] `S3-T6` Enforce unsubscribe/eligibility checks for CC addresses in sync send paths.
  - Validation: `tests/unit/email-send-routes.test.ts`.

Demoable output: bulk/async sends accept normalized CC and maintain one-account safety.

### Sprint 4: Source Attribution + UI Review Enrichment
Goal: expose wedge/angle/source attribution in compose/review surfaces.

- [x] `S4-T1` Add generation metadata contract `source_backed_contract_v1`.
- [x] `S4-T2` Add citation parser + minimum citation threshold rejection path.
- [x] `S4-T3` Persist source attribution on generated content metadata/link rows.
- [x] `S4-T4` Render attribution panels in account shell, sequence dialog, agent dialog.
- [x] `S4-T5` Add legacy compatibility fallback for non-attributed historical rows.

Demoable output: generated draft surfaces show explicit evidence references.

### Sprint 5: Candidate-to-Send Loop Hardening
Goal: complete discover->promote/defer/replace->send loop within existing surfaces.

- [x] `S5-T1` Account-side discover action wired to existing candidate discovery endpoint (Contacts tab panel).
- [x] `S5-T2` Account-side promote/defer/replace actions via existing mutation endpoint.
- [x] `S5-T3` Readiness-aware recipient suggestions with rationale badges (account command center + recipient sets) and qualified CC entry in outreach shell.
- [x] `S5-T4` Guard invalid candidate/recipient selection at send time with remediation hints (`skipped` reasons, malformed/unsubscribed/eligibility blocks).
- [x] `S5-T5` Persist explicit candidate->send->outcome linkage traces (candidate id/state) in workflow metadata and outcome source payloads.

Demoable output: single account workflow handles candidate mutation through send with provenance.

### Sprint 6: Release Readiness + Proof Expansion
Goal: full deterministic proof + operational controls.

- [x] `S6-T1` Backfill migration defaults for legacy generated-content approval compatibility.
- [x] `S6-T2` Add metrics for approval blocks, invariant blocks, citation rejects, sidecar outages, CC drops.
- [x] `S6-T3` Expand account command center proof e2e to include approval block + CC path + evidence diagnostics (baseline refresh->promote->draft->send->learn path already covered).
- [x] `S6-T4` Add runbook for sidecar outage, stuck approvals, CC rejection, kill-switch operations.

Demoable output: proof command verifies end-to-end guarded workflow.

## Validation Gate (Per Sprint)
1. `npm run lint` (or targeted eslint for changed files)
2. `npx tsc --noEmit`
3. Affected `vitest` suites
4. Deterministic proof artifact using existing seed routes

## Newly Discovered Validation Notes (Kept + Accounted For)
1. Proof harness now uses shared `loginAsCasey` helper instead of direct callback-only login to tolerate local auth readiness differences.
2. Proof Playwright config now uses local webpack dev webserver + local auth URL env overrides to keep auth/session deterministic in local and CI-like environments.
3. Proof seed route now sets explicit Prisma transaction options to reduce `P2028` timeout/closed-transaction flakes during large deterministic seed writes.

## Implementation State in This Branch (Completed This Pass)
1. Shared contracts, ADR, feature flags, approval service, one-account service.
2. Send route guards + bulk/async + worker recheck + CC propagation.
3. Evidence models/service, proof seeding, account evidence summary card, broker ingest hook.
4. Source attribution contract/parser, citation threshold enforcement, generated-content attribution persistence/linking, and attribution UI panels.
5. Account outreach shell now sends normalized optional CC lists in both `/api/email/send-bulk` and `/api/email/send-bulk-async`, with qualified-CC suggestion buttons and client validation.
6. Candidate->send->outcome chain now persists candidate trace metadata in send logs and outcome payloads.
7. Release readiness additions completed:
   - `scripts/backfill-generated-content-approval.ts` + backfill service/tests for legacy approval defaults.
   - Source-backed metric instrumentation for approval blocks, sidecar degradation, citation rejection, one-account violations, and CC sanitization drops.
   - Account proof e2e expanded with approval-block + CC send assertions and source-evidence diagnostics checks.
   - Source-backed outreach runbook added for operator/on-call remediation.
8. Targeted validation completed:
   - `npm run -s test:unit -- tests/unit/feature-flags.test.ts tests/unit/source-backed-contracts.test.ts tests/unit/source-evidence.test.ts tests/unit/generated-content-approval.test.ts tests/unit/one-account-invariant.test.ts tests/unit/email-send-routes.test.ts tests/unit/email-send-bulk-async-route.test.ts tests/unit/process-send-jobs-route.test.ts`
   - `npx prisma generate`
   - `npx tsc --noEmit`
   - targeted `eslint` on changed implementation files
