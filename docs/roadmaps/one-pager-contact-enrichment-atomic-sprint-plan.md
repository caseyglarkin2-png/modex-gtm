# One-Pager Contact Enrichment A+ Atomic Sprint Plan

**Status:** Draft for approval  
**Program outcome:** deterministic, high-confidence contact enrichment from HubSpot + Apollo that improves recipient quality, personalization quality, and send conversion without risking CRM integrity.

## Linked Roadmap Docs

- `docs/roadmaps/one-pager-send-sprint-plan.md`
- `docs/roadmaps/one-pager-send-atomic-sprint-plan.md`
- `docs/roadmaps/one-pager-send-sprint-todos.md`
- `docs/roadmaps/one-pager-operator-acceptance-checklist.md`

## Recommended Integration Strategy (HubSpot + Apollo)

1. **HubSpot is system-of-record** for contacts, lifecycle stage, owner, and engagement history.
2. **Apollo is enrichment provider** for missing or stale firmographic/persona fields.
3. **Never blind-overwrite HubSpot fields.** Write Apollo values only when:
   - destination field is empty, or
   - Apollo confidence is higher and field is configured as overwrite-allowed.
4. **Track provenance per field** (`source`, `source_timestamp`, `confidence`, `last_writer`) for auditability.
5. **Use deterministic merge rules** so reruns are idempotent and testable.

## Global Gates (every sprint)

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit` for affected suites
- Sprint-specific integration/e2e suite
- Demo checklist updated with exact command output
- Every acceptance item must include `route + seed + assertion` when UI/API is involved.
- Proof suites must report `expected=X, passed=Y, skipped=0`.

## Sprint 0: Enrichment Quality Gate + Fixture Safety

**Demoable output:** deterministic local test harness for HubSpot/Apollo enrichment work with zero real external writes.

1. Ticket: add deterministic enrichment fixture builders.
   - Validation: builders create consistent HubSpot contacts, Apollo payloads, and merge conflicts.
   - Tests: fixture contract tests for stable IDs and deterministic values.
2. Ticket: enforce no real external writes in tests.
   - Validation: test env blocks real HubSpot/Apollo mutation calls.
   - Tests: unit tests asserting mutation clients throw under test mode.
3. Ticket: add connector mock contract suites.
   - Validation: mocked connectors validate response shape and error taxonomy.
   - Tests: contract tests for success, 429, 5xx, and malformed payloads.

## Sprint 1: Enrichment Data Contract + Schema

**Demoable output:** app can persist enrichment fields and per-field provenance for an existing contact.

1. Ticket: define canonical enrichment field catalog.
   - Validation: each field has explicit type, nullability, source-of-truth, and overwrite policy.
   - Tests: schema snapshot test for contract drift.
2. Ticket: add enrichment schema and migration.
   - Files: Prisma schema + migration.
   - Validation: migration applies cleanly up/down locally.
   - Tests: schema-level unit tests for nullable/non-null constraints.
3. Ticket: add field-level provenance model.
   - Validation: can store value + source metadata atomically.
   - Tests: unit test create/read for provenance records.
4. Ticket: add enrichment confidence enum + thresholds config.
   - Validation: config loaded from typed env/config module.
   - Tests: unit test threshold parsing + defaults.
5. Ticket: add deterministic merge policy module.
   - Validation: policy outputs `accept/reject/keep_existing`.
   - Tests: table-driven unit tests for overwrite rules.
6. Ticket: add merge precedence matrix artifact.
   - Validation: decision matrix covers tie-breakers, stale-vs-confident conflicts, and time windows.
   - Tests: golden tests for matrix scenarios.

## Sprint 2: HubSpot Connector Hardening

**Demoable output:** pull contacts from HubSpot into local enrichment queue with robust retries and observability.

1. Ticket: typed HubSpot contact client wrapper (read paths only).
   - Validation: sandbox smoke fetch by account/company.
   - Tests: mocked HTTP unit tests for success/error/retry.
2. Ticket: pagination + cursor checkpointing.
   - Validation: resume from checkpoint after restart.
   - Tests: unit tests for multi-page cursor progression.
3. Ticket: rate-limit/backoff middleware.
   - Validation: 429/5xx handled without job failure explosion.
   - Tests: unit tests for retry schedule and max-attempt behavior.
4. Ticket: ingestion job + audit log rows.
   - Validation: job status visible in admin queue.
   - Tests: integration test with mocked HubSpot client.
5. Ticket: connector degradation fallback mode.
   - Validation: connector outage shifts to local-only mode without writeback attempts.
   - Tests: integration tests for outage handling and graceful UI status.

## Sprint 3: Apollo Connector + Match Engine

**Demoable output:** enrich local contacts via Apollo with deterministic match quality scoring.

1. Ticket: typed Apollo person/company client wrapper.
   - Validation: sandbox smoke request returns normalized shape.
   - Tests: mocked client unit tests.
2. Ticket: contact matching strategy (`email > domain+name > company+title`).
   - Validation: each candidate receives deterministic match score.
   - Tests: table-driven unit tests with edge cases (aliases, missing email).
3. Ticket: stale-data detection (`last_enriched_at`, TTL by field group).
   - Validation: stale records are queued; fresh records skipped.
   - Tests: unit tests for TTL windows and boundary timestamps.
4. Ticket: add idempotent enrichment job model + locking.
   - Validation: duplicate runs cannot create duplicate writes for same contact/provider/window.
   - Tests: concurrent processor test + rerun idempotency test.
5. Ticket: Apollo enrichment job queue.
   - Validation: queued records process end-to-end to normalized payload.
   - Tests: integration test with queue fixture + mocked Apollo responses.
6. Ticket: connector degradation fallback mode (Apollo).
   - Validation: outage logs recoverable state and avoids downstream hard-fail.
   - Tests: integration test for backoff + degraded completion state.

## Sprint 4: Normalize + Merge + Writeback Safety

**Demoable output:** merged profile writes to local store and optional HubSpot writeback in dry-run mode.

1. Ticket: canonical enrichment mapper (`apollo -> canonical_contact_enrichment`).
   - Validation: all required target fields mapped or explicitly null.
   - Tests: mapper unit tests with fixture payloads.
2. Ticket: merge pipeline (`hubspot + apollo + policy`).
   - Validation: deterministic merged output for same inputs.
   - Tests: snapshot tests for merge output + rationale.
3. Ticket: writeback preview endpoint (phase 1, no external mutation).
   - Validation: returns diff preview grouped by field.
   - Tests: endpoint integration test for auth, validation, diff shape.
4. Ticket: writeback approval token + checksum (phase 2).
   - Validation: apply phase requires checksum match with preview result.
   - Tests: checksum mismatch rejection tests.
5. Ticket: guarded writeback executor (phase 3, feature-flagged).
   - Validation: only approved diffs apply in allowed env; writes audited.
   - Tests: integration test with mocked HubSpot update calls + audit asserts.

## Sprint 5: Recipient Quality Scoring + Send Eligibility

**Demoable output:** generated-content page shows enriched recipient quality and blocks weak recipients by policy.

1. Ticket: recipient score calculator (role fit, authority, freshness, confidence).
   - Validation: score + explanation available for each contact.
   - Tests: unit tests for weighted score behavior.
2. Ticket: threshold calibration fixture set + report.
   - Validation: threshold choices are tied to precision/recall targets from labeled fixtures.
   - Tests: calibration test suite output artifact.
3. Ticket: enrichment-aware send-guard extension.
   - Validation: low-confidence recipients flagged/non-selectable by policy.
   - Tests: unit tests for guard decision matrix.
4. Ticket: generated-content list columns for confidence + freshness.
   - Validation: sortable/filterable UI columns render correctly.
   - Tests: component tests for filter and badge rendering.
5. Ticket: bulk preview warning panel includes enrichment blockers.
   - Validation: acknowledgement flow works with new warning category.
   - Tests: component tests for unlock conditions.
6. Ticket: UI congruence guardrail (ongoing from Sprint 5).
   - Validation: new enrichment controls use canonical badges/warnings/buttons.
   - Tests: visual regression checks against shared UI baseline.

## Sprint 6: One-Pager Personalization Upgrade (Enrichment-Powered)

**Demoable output:** generated one-pagers use enriched context while preventing speculative claims.

1. Ticket: prompt context builder consumes canonical enrichment fields.
   - Validation: generated payload references real signals only.
   - Tests: unit tests for prompt context serialization.
2. Ticket: speculative-claim guardrail filter (events, attendance, rumor language).
   - Validation: blocked phrases removed or section omitted.
   - Tests: unit tests for filtering rules (including MODEX case).
3. Ticket: account-specific proof/context fallback order update.
   - Validation: fallback prefers verified sources over generic placeholders.
   - Tests: unit tests for fallback chain.
4. Ticket: UI indicator for “context confidence” in preview.
   - Validation: users see whether context is verified vs inferred.
   - Tests: component tests for badges/labels.

## Sprint 7: End-to-End Deterministic Proof Suite

**Demoable output:** no-skip executed proof suite for enrichment + send readiness.

1. Ticket: deterministic seed route for enrichment fixtures.
   - Validation: creates matched, unmatched, stale, low-confidence contacts.
   - Tests: integration test for seed route output contract.
2. Ticket: proof e2e for enrichment-to-send workflow.
   - Validation: execute all tests, `skipped=0`, assert real state transitions.
   - Tests: Playwright proof spec group.
3. Ticket: proof run summary parser gate.
   - Validation: fails CI if executed tests count is zero.
   - Tests: unit test parser on pass/fail/skip-only outputs.
4. Ticket: operator checklist update with enrichment checks.
   - Validation: checklist includes recipient confidence and guard behavior.
   - Tests: doc validation artifact (attached screenshots + command output).

## Sprint 8: Rollout Controls + Revenue Instrumentation

**Demoable output:** enrichment can be rolled out safely by cohort; impact visible in analytics.

1. Ticket: feature flags by campaign/account tier.
   - Validation: targeted enable/disable without deploy.
   - Tests: unit tests for flag resolver precedence.
2. Ticket: analytics events for enrichment influence.
   - Validation: track `recipient_selected`, `recipient_blocked`, `send_completed` with confidence metadata.
   - Tests: unit tests for analytics payload schema.
3. Ticket: dashboard panels for enrichment ROI.
   - Validation: show send rate uplift and blocked-risk avoidance.
   - Tests: component tests + query unit tests.
4. Ticket: rollback runbook + failure drills.
   - Validation: simulated connector outage handled with graceful degradation.
   - Tests: chaos-style integration test with connector failure mocks.

## Sprint 9: Full UI Congruence Review (Single RevOps OS)

**Demoable output:** one coherent operator experience across login, dashboard, generated-content, queue, analytics, and enrichment controls.
**Note:** this sprint is verification/remediation only. Major UI congruence discovery starts in Sprint 5 guardrails.

1. Ticket: global branding/title sweep.
   - Validation: `YardFlow by FreightRoll` + `RevOps OS` appears consistently in app shell and login.
   - Tests: UI snapshot assertions for login and shell header.
2. Ticket: duplicate panel/control elimination in enrichment + send surfaces.
   - Validation: one canonical decision surface for recipient quality + send readiness.
   - Tests: component tests for canonical surface behavior.
3. Ticket: interaction consistency checks (buttons, badges, warnings, filters).
   - Validation: identical semantics for warning severities and action priorities.
   - Tests: Playwright visual regression checks across core routes.
4. Ticket: operator journey congruence e2e.
   - Validation: scripted path from login to enriched-send to metrics has no dead ends/conflicts.
   - Tests: proof e2e workflow with zero skips.

## Subagent Review Prompt (use verbatim)

```text
You are reviewing an atomic sprint plan for a one-pager outbound system with HubSpot + Apollo enrichment.

Grade the plan from A to F against:
1) Atomicity (each task committable and independently testable),
2) Technical completeness (data model, connectors, merge policy, UI, observability, rollout),
3) Demoability per sprint,
4) Test strategy quality and failure-mode coverage,
5) Delivery risk and sequencing.

Output required:
- Numeric score /100 and letter grade.
- Top 10 gaps or ambiguities, ordered by severity.
- Concrete improvements to make it A+.
- Any missing tests or non-deterministic acceptance criteria.

Do not rewrite the whole plan; provide actionable patch-style recommendations.
```

## Explicit Approval Gate

Do not begin implementation for this plan until this document is approved.

## Observability and Data Handling Policy

- Redact sensitive PII in logs and events (full email body, tokens, auth headers, raw third-party payloads).
- Persist only allowed fields in audit logs: contact ID, field name, source, confidence, and change summary.
- Add retention policy for enrichment audit rows and processing logs.
- Test coverage required: logger redaction unit tests and audit payload shape tests.

## Reviewer Improvements Applied

- Added Sprint 0 fixture safety and no-real-write enforcement.
- Added explicit canonical schema contract + snapshot drift test.
- Added idempotency/locking requirements for enrichment jobs.
- Upgraded writeback to `Preview -> Approve -> Apply` with checksum guard.
- Pulled connector outage/degradation handling into earlier sprints.
- Added PII redaction/data-handling policy and tests.
- Added threshold calibration before recipient blocking.
- Tightened deterministic acceptance criteria and proof reporting format.
- Shifted UI congruence to ongoing guardrails + final verification sprint.
