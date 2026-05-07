# ADR: Source-Backed Outreach Invariants

## Status
Accepted (2026-05-07)

## Context
Source-backed outreach now spans account command center compose, global compose, synchronous send routes, asynchronous queue routes, and send-job cron dispatch. Existing primitives (`MessageEvolutionRegistry`, `SendApprovalRequest`, queue models, canonical account links) already exist, but enforcement semantics were not consistently applied across all send surfaces.

## Decisions
1. One-account invariant: outbound payloads must resolve to exactly one canonical account scope.
2. Approval gate: generated-content sends are blockable and enforced at enqueue and dispatch (defense in depth).
3. Sidecar fail-closed for source-backed generation when required providers are unavailable.
4. Evidence lifecycle: source-backed evidence is upserted by deterministic key, versioned by run, freshness-tagged, and can age out of "fresh" without row deletion.
5. Surface constraint: deliver only inside existing account page, compose dialogs, queue/generated-content surfaces, and proof routes (no new page introduction).
6. Execution model: one account at a time (no segment orchestration in this phase).

## Operational Controls
1. `SOURCE_EVIDENCE_INGEST_ENABLED`: enable/disable persistence of source evidence.
2. `SOURCE_APPROVAL_GATE_ENABLED`: enable/disable hard send blocking for generated-content approval checks.
3. `SOURCE_CC_BULK_ENABLED`: enable/disable normalized CC handling in bulk contracts.

## Consequences
1. Bulk and async send validations may reject payloads previously accepted if they violate canonical account scope.
2. Generated content can be queued and later blocked at dispatch if approval becomes stale or revoked before send time.
3. Diagnostics and reason codes (`APPROVAL_REQUIRED`, `MIXED_ACCOUNT_PAYLOAD`, `SIDECAR_UNAVAILABLE`) are first-class API responses and telemetry labels.
