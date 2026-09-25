# Sprint 5 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-25 -->

Written by `scripts/gap/e2e-sprint5.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e5-1790296167847
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 7b507dfe
- Ran at: 2026-09-25T00:29:28.327Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: no HubSpot token is present, so the disposition mirror answers skipped:gap_mirror_disabled (GAP_HUBSPOT_MIRROR_ENABLED off) before any call.
- This proves the loop end to end: signal -> hypothesis -> interaction (disposition) -> confirmed BID -> resolved hypothesis -> learning query receives the correct metric with n, over the SAME tables Sprints 1 and 4 already ship (Sprint 5 adds no schema).

## Steps

- PASS preflight: GAP_OS_ENABLED on, GAP_HUBSPOT_MIRROR_ENABLED off, credentials scrubbed, no stale rows
- PASS 1 seed: account GAP Sprint Five Co mugieecv, two personas, two registered signals (cmug8446400017kl81jmanqbe, cmug8446c00037kl8dzmkp5cy)
- PASS 2 hypotheses: H1 cmug8446 (hidden_capacity, site_ops) and H2 cmug8449 (cost_to_ship, finance_procurement) both active
- PASS 3 disposition: H1 resolved confirmed (resolution {"notes":"disposition:cmug844b2000v7kl8tilcsslw","quote":true,"bidIds":["cmug844b5000x7kl82zkltwor","cmug844b9000z7kl8cid1axme","cmug844bb00117kl8c2q0obiq"],"impact":"quantified","problem":"confirmed","reasons":["impact:quantified:cmug844bb00117kl8c2q0obiq","base:70:call","quote:+15:cmug844b5000x7kl82zkltwor","root_cause:+10:cmug844b9000z7kl8cid1axme"],"scoredBy":"cmug844b2000v7kl8tilcsslw","rootCause":"confirmed","confidence":95,"quantified":{"unit":"minutes/shift","value":40,"bidIds":["cmug844bb00117kl8c2q0obiq"]},"dispositionIds":["cmug844b2000v7kl8tilcsslw"]}); H2 resolved rejected
- PASS 4 learning byProblemFamily: hidden_capacity resolutionRate 1 precision 1 (confirmed); cost_to_ship resolutionRate 1 precision 0 (rejected): no cross-family leakage
- PASS 4 learning byPersona: site_ops precision 1 (confirmed); finance_procurement precision 0 (rejected)
- PASS 4 learning bySignalType: manual_research signal type present with n=2
- PASS 4 learning dispositionDistribution: problem_confirmed and problem_rejected both present: [{"responseClass":"problem_confirmed","count":1},{"responseClass":"problem_rejected","count":1}]
- PASS 4 learning counts: every rate carries n: report.counts {"hypotheses":2,"conversations":2}
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":12,"gap_hubspot_mirror":0,"buyer_input_data":3,"conversation_dispositions":2,"hypothesis_events":10,"hypothesis_signals":2,"prospecting_hypotheses":2,"prospecting_signals":2,"personas":2,"accounts":1}); zero leftovers

## Counts

- gitSha: 7b507dfe
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-e2e5-1790296167847
- hypothesisConfirmed: cmug8446l00057kl8zpk0s399
- hypothesisRejected: cmug84493000i7kl8ig45ylp1
- learningFunnel: {"resolutionRate":{"value":1,"n":2,"numerator":2,"denominator":2},"precision":{"value":0.5,"n":2,"numerator":1,"denominator":2},"problemResonanceRate":{"value":0.5,"n":2,"numerator":1,"denominator":2},"rootCauseConfirmationRate":{"value":1,"n":1,"numerator":1,"denominator":1},"impactAcknowledgmentRate":{"value":1,"n":1,"numerator":1,"denominator":1},"impactQuantificationRate":{"value":1,"n":1,"numerator":1,"denominator":1}}

## Cleanup

- Removed: {"gap_audit_events":12,"gap_hubspot_mirror":0,"buyer_input_data":3,"conversation_dispositions":2,"hypothesis_events":10,"hypothesis_signals":2,"prospecting_hypotheses":2,"prospecting_signals":2,"personas":2,"accounts":1}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"gap_hubspot_mirror":0}

Every row the run created was deleted in the finally block (gap_audit_events, gap_hubspot_mirror, buyer_input_data, conversation_dispositions, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, personas, accounts) and the leftover count per table was asserted zero.
