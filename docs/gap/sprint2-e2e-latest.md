# Sprint 2 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-23 -->

Written by `scripts/gap/e2e-sprint2.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e2-1790189982420
- Database: 127.0.0.1:5433/gap_dev (scratch only; the script refuses any other host)
- Git: e0e6ed80
- Ran at: 2026-09-23T18:59:42.918Z
- HUBSPOT_SYNC_ENABLED as resolved by feature-flags: true (the mirror is gated by GAP_HUBSPOT_MIRROR_ENABLED, default off, before it reads this)
- Credentials scrubbed from the process before the first write: HUBSPOT_ACCESS_TOKEN
- No HubSpot call is possible in this run: static suppression reader, stub snapshot provider, fixture enrollment readback, fixture reply search, review-feed poster stubbed.

## Steps

- PASS preflight: flags on, credentials scrubbed, no stale fixture rows, 0 foreign live triggers in the 12-day window
- PASS 1 seed: account, personas 10 (ready, director), 11 (ready, vp), 12 (suppressed), 2 triggers 10 days old, fixture accounts Dell + J.B. Hunt, sequence 2 with 2 draft queue rows (approved + draft) on run gap-e2e2-1790189982420-run
- PASS 2 hypothesize: signals.created=2 proposed=3 opsDraft=cmuegw70800097k80mf65vmrp (yard_state_integrity) execDraft=cmuegw70e000d7k80gc4wvq5q (hidden_capacity); fact cmuegw70o000h7k80p75dye5s linked (1 -> 2), relink already, unlink of cited cmuegw6zq00037k80or6d2ugn refused unlinked_citation; 3 drafts submitted and approved
- PASS 3 sync: families created 2 (311519882, 311861043), enrollments created 1 (2c53c46c-1a4f-5dae-922a-9328ade96c21, legacy, version frozen), rosters missing ["jbhunt-com"], reported {"other_sequence":0,"not_enrolled":6,"no_email":0,"no_contact_id":0}; second run created 0 / existing 2 / unchanged 1; 2 readback calls
- PASS 4 replies: first poll created 1 filtered {auto_reply_subject: 1}, inbound hs:gap-e2e2-1790189982420-e1 on hs-thread:gap-e2e2-1790189982420-c1, notifications reply + filtered_inbound; second poll created 0 existing 2; watermark advanced; 2 fixture searches
- PASS 5 routing: run A mode shadow: 2 decisions {"enroll":1,"no_hypothesis":1}, skips {"in_flight":1}; exec persona 11 -> enroll (target modex_queue, hypothesis cmuegw70e000d7k80gc4wvq5q); suppressed persona -> no_hypothesis; every row carries account + persona; queue ordered by priority; human action ok then already_acted, missing id not_found
- PASS 6 enroll rows: header + 1 row for GAP E2E Co gap-e2e2-1790189982420: sequence NOT BUILT, 0 contacts, 1 skip (E2E Exec gap-e2e2-1790189982420: modex_queue (no native sequence; secondary lane))
- PASS 7 suppression: suppressed -> 3 x do_not_contact/blocked (rule suppressed); unknown -> 3 x research_required/blocked (rule suppression_unknown); queue lane=blocked filter returns 3
- PASS 8 stop: cancelDownstream(replied) marked 2 rows skipped with sequence_stopped:replied, 2 rows remain, rerun marks 0; routing run B: {"enroll":1,"no_hypothesis":1,"reply_pending":1}, ready persona 10 -> reply_pending (rule id printed as observed)
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
- runAByRule: {"enroll":1,"no_hypothesis":1}
- enrollTableRows: 1
- enrollTableSkips: 1
- suppressedDecisions: 3
- unknownDecisions: 3
- stopMarked: 2
- stopRowsRemaining: 2
- runBByRule: {"enroll":1,"no_hypothesis":1,"reply_pending":1}
- mirrorRows: 0

Every row the run created was deleted in the finally block (routing_decisions, gap_audit_events, hypothesis_events, buyer_input_data, hypothesis_signals, prospecting_hypotheses, prospecting_signals, gap_hubspot_mirror, sequence_enrollments, sequence_versions, sequence_families, notifications, inbound_messages, email_threads, draft_queue_items, sequences, pounce_triggers, personas, accounts) and the system_config keys it wrote were restored or removed.
