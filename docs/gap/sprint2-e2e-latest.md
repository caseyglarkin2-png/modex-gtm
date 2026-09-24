# Sprint 2 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/e2e-sprint2.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e2-1790283330945
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 73dc65a4
- Ran at: 2026-09-24T20:55:31.488Z
- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: true (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)
- Credentials scrubbed from the process before the first write: HUBSPOT_ACCESS_TOKEN
- No HubSpot call is possible in this run: static suppression reader, stub snapshot provider, fixture enrollment readback, fixture reply search, review-feed poster stubbed.

## Steps

- PASS preflight: flags on, credentials scrubbed, no stale fixture rows, 0 foreign live triggers in the 12-day window
- PASS 1 seed: account, personas 6 (ready, director), 7 (ready, vp), 8 (suppressed), 2 triggers 10 days old, fixture accounts Dell + J.B. Hunt, sequence 2 with 2 draft queue rows (approved + draft) on run gap-e2e2-1790283330945-run
- PASS 2 hypothesize: signals.created=2 proposed=3 opsDraft=cmug0gz5q00097kng41nizg3r (yard_state_integrity) execDraft=cmug0gz5w000d7kngf9swko5k (hidden_capacity); fact cmug0gz68000h7kng8333c6vz linked (1 -> 2), relink already, unlink of cited cmug0gz5800037kngni9ox63y refused signal_cited; 3 drafts submitted and approved
- PASS 3 sync: families created 2 (311420117, 311420229), enrollments created 1 (d7602d6d-8fd6-5825-a209-25ebf5c23513, legacy, version still draft per R2-5), rosters missing ["jbhunt-com"], reported {"other_sequence":0,"not_enrolled":6,"no_email":0,"no_contact_id":0}; second run created 0 / existing 2 / unchanged 1; 2 readback calls
- PASS 4 replies: first poll created 1 filtered {auto_reply_subject: 1}, inbound hs:gap-e2e2-1790283330945-e1 on hs-thread:gap-e2e2-1790283330945-c1, notifications reply + filtered_inbound; second poll created 0 existing 2; watermark advanced; 2 fixture searches
- PASS 5 routing: run A mode shadow: 2 decisions {"enroll":1,"suppressed":1}, skips {"in_flight":1}; exec persona 7 -> enroll (target modex_queue, hypothesis cmug0gz5w000d7kngf9swko5k); do_not_contact persona -> suppressed / do_not_contact / blocked (R2-1); every row carries account + persona; queue ordered by priority; human action ok then already_acted, missing id not_found
- PASS 6 enroll rows: header + 1 row for GAP E2E Co gap-e2e2-1790283330945: sequence NOT BUILT, 0 contacts, 1 skip (E2E Exec gap-e2e2-1790283330945: modex_queue (no native sequence; secondary lane))
- PASS 7 suppression: suppressed -> 3 x do_not_contact/blocked (rule suppressed); unknown -> 3 rows: dnc persona suppressed (local column outranks unknown, R2-1), others research_required/blocked (rule suppression_unknown); queue lane=blocked filter returns 3
- PASS 8 stop: cancelDownstream(replied) marked 2 rows skipped with sequence_stopped:replied, 2 rows remain, rerun marks 0; routing run B: {"enroll":1,"suppressed":1,"reply_pending":1}, ready persona 6 -> reply_pending (rule id printed as observed)
- PASS 9 mirror: skipped/gap_mirror_disabled with HUBSPOT_SYNC_ENABLED resolved true, 0 gap_hubspot_mirror rows, credentials still absent

## Counts

- foreignLiveTriggersBefore: 0
- hypothesizeSignalsCreated: 2
- hypothesizeProposed: 3
- hypothesesApproved: 3
- opsDraftSignals: 2
- sync1FamiliesCreated: 2
- sync1EnrollmentsCreated: 1
- sync1ContactsRead: 7
- sync2FamiliesExisting: 2
- sync2EnrollmentsUnchanged: 1
- readbackCalls: 2
- poll1Created: 1
- poll1Filtered: 1
- poll2Existing: 2
- runADecisions: 2
- runASkips: {"in_flight":1}
- runAByRule: {"enroll":1,"suppressed":1}
- enrollTableRows: 1
- enrollTableSkips: 1
- suppressedDecisions: 3
- unknownDecisions: 3
- stopMarked: 2
- stopRowsRemaining: 2
- runBByRule: {"enroll":1,"suppressed":1,"reply_pending":1}
- mirrorRows: 0

Every row the run created was deleted in the finally block (routing_decisions, gap_audit_events, hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, sequence_enrollments, sequence_versions, sequence_families, notifications, inbound_messages, email_threads, draft_queue_items, sequences, pounce_triggers, personas, accounts) and the system_config keys it wrote were restored or removed.
