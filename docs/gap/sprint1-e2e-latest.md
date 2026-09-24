# Sprint 1 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/e2e-sprint1.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e-1790283243847
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 73dc65a4
- Ran at: 2026-09-24T20:54:04.127Z
- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: true (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)
- Credentials scrubbed from the process before the first write: HUBSPOT_ACCESS_TOKEN

## Steps

- PASS preflight: flags on, credentials scrubbed, 0 foreign live triggers in the 1-day window
- PASS 1 seed: account, personas 1 (ready) and 2 (suppressed), 2 triggers
- PASS 2 hypothesize: signals.created=2 proposed=2 draft=cmug0f3y600057k7wdufu891e family=hidden_capacity signals=1 suppressed_hits=0
- PASS 3 rerun: skippedOpen=2 proposed=0 signals.existing=2
- PASS 4 lifecycle: submit/approve/activate ok, events propose,submit,approve,activate, resolve refused no_confirmed_disposition, DB freeze GAP_HYPOTHESIS_FROZEN, narrative unchanged
- PASS 5 negative: needsObservation=true, submit refused no_signals, duplicate_source_ref existingId=cmug0f40m000m7k7whcqshdb5
- PASS 6 mirror: skipped/gap_mirror_disabled with HUBSPOT_SYNC_ENABLED resolved true, 0 gap_hubspot_mirror rows
- PASS 7 pic: first apply created 4 hypotheses, 8 signals, 0 bids; second apply created 0, existing 4, signals.created 0

## Counts

- foreignLiveTriggersBefore: 0
- run1SignalsCreated: 2
- run1Proposed: 2
- run1AccountsScanned: 1
- draftSignals: 1
- run2SkippedOpen: 2
- run2Proposed: 0
- lifecycleEvents: 4
- mirrorRows: 0
- picRows: 4
- picApply1HypothesesCreated: 4
- picApply1SignalsCreated: 8
- picApply1Bids: 0
- picApply2HypothesesExisting: 4

Every row the run created was deleted in the finally block (hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, gap_audit_events, pounce_triggers, personas, accounts).
