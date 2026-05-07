# Source-Backed Outreach Runbook

## Scope
Operational runbook for source-backed account outreach flows using existing account, compose, queue, and proof surfaces.

## Primary Signals
- Approval-block rate (`APPROVAL_REQUIRED`) on send endpoints and async dispatch.
- One-account invariant violations (`MIXED_ACCOUNT_PAYLOAD`).
- Citation rejection rate (`SOURCE_ATTRIBUTION_REQUIRED`) during generation.
- Sidecar degradation/unavailability while `useLiveIntel=true`.
- CC sanitization drops (CC includes primary recipient and is dropped).

## Fast Triage
1. Confirm feature-flag posture:
   - `SOURCE_EVIDENCE_INGEST_ENABLED`
   - `SOURCE_APPROVAL_GATE_ENABLED`
   - `SOURCE_CC_BULK_ENABLED`
2. Reproduce from account page proof path:
   - `POST /api/proof/account-command-center-seed`
   - Open `/accounts/e2e-boston-beer-company`
3. Inspect latest account activities with `activity_type='Agent Workflow'` and `outcome LIKE 'source_backed_metric:%'`.
4. Check send blockers in API responses (`code`, `details`) and queue recipient `error_message`.

## Incident Playbooks

### Sidecar Outage / Degraded Live Intel
1. Expect `sidecar_unavailable` metric events and partial intel summaries.
2. Keep operator flow alive by generating with cached/local context where possible.
3. If outage persists, toggle `SOURCE_EVIDENCE_INGEST_ENABLED=false` to disable ingest pressure.
4. Communicate that source-backed citation thresholds may reject outputs until providers recover.

Validation:
- Generate request returns explicit partial context status and/or rejection with actionable details.

### Approval Stuck / Approval Missing
1. Verify `SOURCE_APPROVAL_GATE_ENABLED` state.
2. Check `message_evolution_registry` rows for `generated_content_id`.
3. For legacy data lacking review rows, run:
   - `npx tsx scripts/backfill-generated-content-approval.ts --dry-run --limit 500`
   - `npx tsx scripts/backfill-generated-content-approval.ts --limit 500`
4. Re-attempt send (sync + async) and confirm block clears.

Validation:
- `requiresApprovalForSend` resolves `approved=true` (`approved` or `deployed`).

### CC Rejection / CC Sanitization
1. Inspect request CC list and normalized CC result.
2. Confirm one-account invariant scope for `To + CC`.
3. Check unsubscribe/eligibility outcomes for CC addresses.
4. If `cc_sanitization_drops` spikes, audit compose UX and recipient selection defaults.

Validation:
- Provider dispatch excludes primary recipient from CC.
- Eligible CC addresses persist in `EmailLog.metadata.workflow` recipient traces.

### One-Account Invariant Violations
1. Review blocker details (`outOfScopeAccounts` / `outOfScopeCc`).
2. Resolve account alias/canonical mapping issues.
3. Re-test with canonical account scope only.

Validation:
- Send endpoints accept payload and resolve one canonical account scope.

## Kill-Switch Guidance
- Use targeted flags first; avoid broad disable unless incident impact is severe.
- Record each toggle as activity + incident note with timestamp and owner.
- Re-enable incrementally after proof path is green.

## Post-Incident Checklist
1. Proof path green:
   - refresh intel -> promote -> draft -> approval gate behavior -> send with CC -> outcome log
2. Metrics back to baseline for:
   - approval blocks
   - one-account violations
   - citation rejections
   - sidecar unavailable
   - cc sanitization drops
3. Document root cause, remediation, and residual risk in sprint closeout.
