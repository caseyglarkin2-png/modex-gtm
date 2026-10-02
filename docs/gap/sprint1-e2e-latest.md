# Sprint 1 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-10-02 -->

Written by `scripts/gap/e2e-sprint1.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e-1790907839921
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 35ad3918
- Ran at: 2026-10-02T02:24:00.321Z
- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: true (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)
- Credentials scrubbed from the process before the first write: none

## Steps

- PASS preflight: flags on, credentials scrubbed, 0 foreign live triggers in the 1-day window
- PASS 1 seed: account, personas 56 (ready) and 57 (suppressed), 2 triggers
- PASS 2 hypothesize: signals.created=2 proposed=0 draft=cmuqcadhb00077k0gr5z7bqs7 family=hidden_capacity signals=1 suppressed_hits=0
- PASS 3 rerun: proposed=0 signals.existing=2
- PASS 4 lifecycle: submit/approve/activate ok, events propose,submit,approve,activate, resolve refused no_confirmed_disposition, DB freeze GAP_HYPOTHESIS_FROZEN, narrative unchanged
- PASS 5 negative: needsObservation=true, submit refused no_signals, duplicate_source_ref existingId=cmuqcadjz000k7k0gpbya9mgo
- PASS 6 mirror: skipped/gap_mirror_disabled with HUBSPOT_SYNC_ENABLED resolved true, 0 gap_hubspot_mirror rows
- PASS 7 pic: first apply created 4 hypotheses, 8 signals, 0 bids; second apply created 0, existing 4, signals.created 0

## Counts

- foreignLiveTriggersBefore: 0
- run1SignalsCreated: 2
- run1Proposed: 0
- run1AccountsScanned: 1
- draftSignals: 1
- run2SkippedOpen: 0
- run2Proposed: 0
- lifecycleEvents: 4
- mirrorRows: 0
- picRows: 4
- picApply1HypothesesCreated: 4
- picApply1SignalsCreated: 8
- picApply1Bids: 0
- picApply2HypothesesExisting: 4

Every row the run created was deleted in the finally block (hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, gap_audit_events, pounce_triggers, personas, accounts).
