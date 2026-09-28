# GAP red team remediation: final integrated regression (latest)

STATUS: PASS

<!-- verified:2026-09-28 -->

Written by `scripts/gap/e2e-integrated.ts` against the scratch database. Reserved example.com recipients only; every Gmail call went to an in-process fake.

- Run tag: gapint-1790570276049
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 455be384
- Ran at: 2026-09-28T04:37:57.138Z

## Steps

- PASS 1 seed: accounts GAP Integrated Co 70276049 and GAP Integrated Keyword Co 70276049, people sam, dana, uma, bo, rita, cal, kai at example.com, family cmukrb7f700017kqc8d7ninvs (single-touch Hidden Capacity seed copy)
- PASS 2 verified fact: 6 hypotheses citing one verified, dated, quoted fact each: submitted, approved and activated
- PASS 3 keyword only: approve refused evidence_insufficient; the person routes research_required (evidence_thin), never an email
- PASS 4 route: sam's approved hypothesis routes enroll_gap_sequence (enroll) in shadow routing run gapint-1790570276049-run-1
- PASS 5 real send: one DIRECT_SENT ledger row (evidence tier VERIFIED_FACT), the fake Gmail transport the only recipient; routing now reads lastOutboundAt and routes nurture (sequence_complete), never a second email
- PASS 6 prior step 0: a new card for the same person refuses step 0: first_touch_already_sent
- PASS 7 outstanding draft: a Gmail draft is outstanding for dana; the direct send is refused draft_outstanding
- PASS 8 unsubscribe: one-click unsubscribe wrote the canonical row, do_not_contact is set, and the next send is refused persona_do_not_contact
- PASS 9 hard bounce: the 5.1.1 notice wrote hard_bounce + do_not_contact for bo (never a reply), and bo's next touch is stopped (do_not_contact)
- PASS 10 buyer reply: rita's reply became an InboundMessage and held the sequence (replied); the hypothesis stayed active and routing put rita in the reply_triage lane (reply_pending: a human reads and dispositions it) until a human recorded problem_confirmed, which resolved it (confirmed)
- PASS 11 no answer: rules after each no-answer: enroll -> enroll -> call_attempts_exhausted; the hypothesis stays active with no buyer truth (0 BIDs)
- PASS 12 learning: people sent to (this run) = 3 of 7 created; reply/send 1/3 and truth yield 1/3, both shown as early observations (n < 20); sam's card agrees because the send is on record
- PASS 13 zero outbound: 3 direct sends and 1 draft handed to the in-process fake, all to reserved example.com addresses; no credential present
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":45,"buyer_input_data":0,"conversation_dispositions":4,"notifications":2,"unsubscribed_emails":1,"inbound_messages":1,"email_threads":1,"email_logs":3,"send_approval_requests":0,"gap_compiles":4,"routing_decisions":6,"hypothesis_events":27,"hypothesis_signals":7,"prospecting_hypotheses":7,"prospecting_signals":7,"sequence_versions":1,"sequence_families":1,"personas":7,"accounts":5})

## Counts

- learningAll: 3
- fakeSends: 3
- fakeDrafts: 1
- cleanup.gap_audit_events: 45
- cleanup.buyer_input_data: 0
- cleanup.conversation_dispositions: 4
- cleanup.notifications: 2
- cleanup.unsubscribed_emails: 1
- cleanup.inbound_messages: 1
- cleanup.email_threads: 1
- cleanup.email_logs: 3
- cleanup.send_approval_requests: 0
- cleanup.gap_compiles: 4
- cleanup.routing_decisions: 6
- cleanup.hypothesis_events: 27
- cleanup.hypothesis_signals: 7
- cleanup.prospecting_hypotheses: 7
- cleanup.prospecting_signals: 7
- cleanup.sequence_versions: 1
- cleanup.sequence_families: 1
- cleanup.personas: 7
- cleanup.accounts: 5
