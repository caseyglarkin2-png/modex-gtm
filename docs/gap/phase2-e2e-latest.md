# GAP OS Phase 2: Seller OS integrated acceptance (latest)

STATUS: PASS

<!-- verified:2026-09-28 -->

Written by `scripts/gap/e2e-phase2.ts` against the scratch database. Research providers are in-process stubs; reserved example.com people only; nothing can leave the machine.

- Run tag: gapp2-1790563753491
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 6df1938f
- Ran at: 2026-09-28T02:49:13.913Z

## Steps

- PASS seed: GAP P2 Pep 63753491: 3 people, 3 draft hypotheses resting on one keyword hit (research work), 1 fresh Pounce trigger (upper-case name, like production)
- PASS G1 no state change: background research ran for 1 account(s); 11 protected counts identical (hypotheses, events, links, routing decisions, enrollments, email logs, draft queue, execution ledger, BIDs, dispositions); all 3 hypotheses still draft on the keyword hit
- PASS G1 inbox: RESEARCH shows GAP P2 Pep 63753491: 1 verified fact ready ("GAP P2 Pep 63753491 will expand its autonomous freight progr..."), why: States an expansion; the quote was found word for word at the source on 2026-09-28. USE would update the one thesis (3 people); nothing was approved
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":2,"hypothesis_events":3,"hypothesis_signals":3,"prospecting_hypotheses":3,"prospecting_signals":2,"evidence_records":1,"research_runs":1,"pounce_triggers":1,"personas":3,"accounts":1})

## Counts

- backgroundResearched: 1
- backgroundSkipped: 0
- cleanup.gap_audit_events: 2
- cleanup.hypothesis_events: 3
- cleanup.hypothesis_signals: 3
- cleanup.prospecting_hypotheses: 3
- cleanup.prospecting_signals: 2
- cleanup.evidence_records: 1
- cleanup.research_runs: 1
- cleanup.pounce_triggers: 1
- cleanup.personas: 3
- cleanup.accounts: 1
