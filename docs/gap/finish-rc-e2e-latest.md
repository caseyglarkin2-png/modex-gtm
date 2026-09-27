# GAP OS FINISH release-candidate hardening e2e (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-finish-rc.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2erc-1790474205598
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 1bf8ea34
- Ran at: 2026-09-27T01:56:46.181Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, and no credential is present.
- Proves the shortest useful chain over the hardened GAP core: fact/signal -> hypothesis -> approval/activation -> routing decision -> execution/enrollment attribution -> human-confirmed disposition -> BID -> hypothesis resolution -> learning, plus the six properties this finish pass specifically changed (suppression wins, active opportunity blocks cold enrollment, the kill switch cannot create a raw/uncompiled continuation, routing-vs-human-action agreement is recorded, test/internal traffic is excluded from learning, and the campaign/date filter returns only the desired cohort).

## Steps

- PASS preflight: flags on (compiler on, mirror off), credentials scrubbed, seed network_standardization fixture present, no stale rows
- PASS 1 seed: two accounts (GAP RC Co gap-e2erc-1790474205598 pipeline_stage=targeted, GAP RC Blocked Co gap-e2erc-1790474205598 pipeline_stage=meeting), three personas (happy 36, blocked 37, internal 38)
- PASS 1b facts: H1 facts cmuj642z100017k9cnti8b55x/cmuj642z500037k9cxnayhhom, H2 facts cmuj642z600057k9c3gnvaxau/cmuj642z700077k9c69w8rtwh
- PASS 2 hypotheses: H1 cmuj642z (GAP RC Co gap-e2erc-1790474205598) and H2 cmuj6431 (GAP RC Blocked Co gap-e2erc-1790474205598) both active, both citing two real facts
- PASS 2c internal: H3 cmuj6431 active, internal persona 38 (probe+gap-e2erc-1790474205598@freightroll.com)
- PASS 3 family: family cmuj6432c001e7k9cseoovtmg, version cmuj6432k001g7k9c0xnlac3v v1 (program gap-finish-rc)
- PASS 4 compile: H1 4 steps pass (cmuj6433,cmuj6433,cmuj6433,cmuj6433); H2 4 steps pass (cmuj6433,cmuj6433,cmuj6433,cmuj6433); same version, two independent hypothesis-bound compile stacks
- PASS 5 active opportunity: enrollFromDecision on GAP RC Blocked Co gap-e2erc-1790474205598 (pipeline_stage meeting) refuses active_opportunity (B6) even with a passing compile stack identical to the happy path's; no queue item created
- PASS 6 suppression: a do_not_contact persona refuses suppressed on leg modex_do_not_contact (R3-2); local suppression checked BEFORE any queue write, on a fresh read, same as B6 above
- PASS 7 enroll: enrollment 62434560-50cf-45c3-a01e-b610a7910e45 active, item 28 stamped (sequence_version_id cmuj6432k001g7k9c0xnlac3v) and gate-visible (SF11) from the instant it was created, is_test false
- PASS 8 kill switch: GAP_OS_ENABLED off: scheduleNextStep on this run's own GAP-stamped item (sequence_version_id set) schedules nothing (B5), audits schedule.skipped, and creates no second item; flag restored
- PASS 9 agreement: real RoutingDecision rows stamped by the real recordHumanAction, read back through loadAgreementReport: 1 agreement, 1 disagreement, rate 0.5 (R-B)
- PASS 10 disposition: H1 confirmed with a root-cause BID (resolution confirmed); H3's internal-recipient (probe+gap-e2erc-1790474205598@freightroll.com) disposition recorded too, for the B9 exclusion check next
- PASS 11 learning b9: the internal-recipient (@freightroll.com) disposition on H3 never reaches buildLearningReport's real metrics (B9); H1's external disposition does
- PASS 11 learning ra: program filter 'gap-finish-rc' includes H1's family, a nonexistent program excludes it, a date window after this run excludes it, a window bracketing this run includes it (R-A)
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}); zero leftovers

## Counts

- gitSha: 1bf8ea34
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-e2erc-1790474205598
- h1: cmuj642za00097k9cxg6khidq
- h2: cmuj6431b000m7k9cv4q6k4nq
- h3: cmuj6431y00117k9cvfekahqs
- familyId: cmuj6432c001e7k9cseoovtmg
- versionId: cmuj6432k001g7k9c0xnlac3v

## Cleanup

- Removed: {"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"draft_queue_items":0,"sequence_enrollments":0,"sequence_families":0,"routing_decisions":0,"gap_compiles":0}

Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.
