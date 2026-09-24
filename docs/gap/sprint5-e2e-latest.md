# Sprint 5 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-24 -->

Written by `scripts/gap/e2e-sprint5.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e5-1790292844819
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: fdfcb87b
- Ran at: 2026-09-24T23:34:05.177Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: no HubSpot token is present, so the disposition mirror answers skipped:gap_mirror_disabled (GAP_HUBSPOT_MIRROR_ENABLED off) before any call.
- This proves the loop end to end: signal -> hypothesis -> interaction (disposition) -> confirmed BID -> resolved hypothesis -> learning query receives the correct metric with n, over the SAME tables Sprints 1 and 4 already ship (Sprint 5 adds no schema).

## Steps

- PASS preflight: GAP_OS_ENABLED on, GAP_HUBSPOT_MIRROR_ENABLED off, credentials scrubbed, no stale rows
- PASS 1 seed: account GAP Sprint Five Co muggewaj, two personas, two registered signals (cmug64w2z00017kvca0gvwpzf, cmug64w3400037kvcahcqk91a)
- PASS 2 hypotheses: H1 cmug64w3 (hidden_capacity, site_ops) and H2 cmug64w5 (cost_to_ship, finance_procurement) both active
- PASS 3 disposition: H1 resolved confirmed (resolution {"notes":"disposition:cmug64w6i000v7kvcjd4u9u4y","quote":true,"bidIds":["cmug64w6l000x7kvc7hol6s0y","cmug64w6o000z7kvcpqzv5x4b","cmug64w6p00117kvc8r4dn4ju"],"impact":"quantified","problem":"confirmed","reasons":["impact:quantified:cmug64w6p00117kvc8r4dn4ju","base:70:call","quote:+15:cmug64w6l000x7kvc7hol6s0y","root_cause:+10:cmug64w6o000z7kvcpqzv5x4b"],"scoredBy":"cmug64w6i000v7kvcjd4u9u4y","rootCause":"confirmed","confidence":95,"quantified":{"unit":"minutes/shift","value":40,"bidIds":["cmug64w6p00117kvc8r4dn4ju"]},"dispositionIds":["cmug64w6i000v7kvcjd4u9u4y"]}); H2 resolved rejected
- PASS 4 learning byProblemFamily: hidden_capacity resolutionRate 1 precision 1 (confirmed); cost_to_ship resolutionRate 1 precision 0 (rejected): no cross-family leakage
- PASS 4 learning byPersona: site_ops precision 1 (confirmed); finance_procurement precision 0 (rejected)
- PASS 4 learning bySignalType: manual_research signal type present with n=2
- PASS 4 learning dispositionDistribution: problem_confirmed and problem_rejected both present: [{"responseClass":"problem_confirmed","count":1},{"responseClass":"problem_rejected","count":1}]
- PASS 4 learning counts: every rate carries n: report.counts {"hypotheses":2,"conversations":2}
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":12,"gap_hubspot_mirror":0,"buyer_input_data":3,"conversation_dispositions":2,"hypothesis_events":10,"hypothesis_signals":2,"prospecting_hypotheses":2,"prospecting_signals":2,"personas":2,"accounts":1}); zero leftovers

## Counts

- gitSha: fdfcb87b
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-e2e5-1790292844819
- hypothesisConfirmed: cmug64w3b00057kvco9xsepta
- hypothesisRejected: cmug64w52000i7kvcfnjq3k6k
- learningFunnel: {"resolutionRate":{"value":1,"n":2,"numerator":2,"denominator":2},"precision":{"value":0.5,"n":2,"numerator":1,"denominator":2},"problemResonanceRate":{"value":0.5,"n":2,"numerator":1,"denominator":2},"rootCauseConfirmationRate":{"value":1,"n":1,"numerator":1,"denominator":1},"impactAcknowledgmentRate":{"value":1,"n":1,"numerator":1,"denominator":1},"impactQuantificationRate":{"value":1,"n":1,"numerator":1,"denominator":1}}

## Cleanup

- Removed: {"gap_audit_events":12,"gap_hubspot_mirror":0,"buyer_input_data":3,"conversation_dispositions":2,"hypothesis_events":10,"hypothesis_signals":2,"prospecting_hypotheses":2,"prospecting_signals":2,"personas":2,"accounts":1}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"gap_hubspot_mirror":0}

Every row the run created was deleted in the finally block (gap_audit_events, gap_hubspot_mirror, buyer_input_data, conversation_dispositions, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, personas, accounts) and the leftover count per table was asserted zero.
