# HubSpot Sync Staged Enablement Runbook

## Purpose

Enable HubSpot sync safely with a rollback path:

`disabled -> canary cohort -> full`

## Preconditions

- `CRON_SECRET` is configured.
- `HUBSPOT_ACCESS_TOKEN` is valid.
- `/ops?tab=connector-health` shows HubSpot as configured.
- Dry-run succeeds:
  - `GET /api/cron/sync-hubspot?dry_run=1`

## Stage 0: Disabled Baseline

1. Set `HUBSPOT_SYNC_ENABLED=false`.
2. Run dry-run from `/admin/crons`.
3. Verify:
   - no external writes
   - sampled error classes acceptable
   - cron telemetry updates

## Stage 1: Canary Cohort

1. Set `HUBSPOT_SYNC_ENABLED=true`.
2. Restrict canary by cohort filter in operating playbook (small contact slice).
3. Monitor for 24h:
   - `sync-hubspot` error rate
   - `reenrich-contacts` no-match trend
   - conflict count in coverage tab

Rollback trigger:
- auth failures
- repeated 429 bursts
- schema drift or conflict spike

Rollback action:
- set `HUBSPOT_SYNC_ENABLED=false`
- run dry-run
- investigate before re-enable

## Stage 2: Full Enablement

1. Expand to full TAM/ICP cohort.
2. Verify Gate 0 metrics in `/ops?tab=coverage`.
3. Confirm runbook audit entries in `system_config`:
   - `runbook:sync-hubspot:last`
   - `runbook:reenrich-contacts:last`
