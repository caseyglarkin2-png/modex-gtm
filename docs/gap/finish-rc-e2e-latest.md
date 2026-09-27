# GAP OS FINISH release-candidate hardening e2e (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-finish-rc.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2erc-1790483007680
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: fe935200
- Ran at: 2026-09-27T04:23:28.257Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, and no credential is present.
- Proves the shortest useful chain over the hardened GAP core: fact/signal -> hypothesis -> approval/activation -> routing decision -> execution/enrollment attribution -> human-confirmed disposition -> BID -> hypothesis resolution -> learning, plus the six properties this finish pass specifically changed (suppression wins, active opportunity blocks cold enrollment, the kill switch cannot create a raw/uncompiled continuation, routing-vs-human-action agreement is recorded, test/internal traffic is excluded from learning, and the campaign/date filter returns only the desired cohort).

## Steps

- PASS preflight: flags on (compiler on, mirror off), credentials scrubbed, seed hidden_capacity fixture present, no stale rows
- PASS 1 seed: two accounts (GAP RC Co gap-e2erc-1790483007680 pipeline_stage=targeted, GAP RC Blocked Co gap-e2erc-1790483007680 pipeline_stage=meeting), three personas (happy 107, blocked 108, internal 109)
- PASS 1b facts: H1 facts cmujbcqpa00017keo0bcbtc7x/cmujbcqpe00037keofvuyvwo9, H2 facts cmujbcqpg00057keov5sl4jwz/cmujbcqpi00077keo4pvac8rc
- PASS 2 hypotheses: H1 cmujbcqp (GAP RC Co gap-e2erc-1790483007680) and H2 cmujbcqr (GAP RC Blocked Co gap-e2erc-1790483007680) both active, each quoting one verified fact with a second linked
- PASS 2c internal: H3 cmujbcqs active, internal persona 109 (probe+gap-e2erc-1790483007680@freightroll.com)
- PASS 3 family: family cmujbcqsf001e7keoms3fp22b, version cmujbcqsn001g7keoe0joka9r v1 (program gap-finish-rc)
- PASS 4 compile: H1 4 steps pass (cmujbcqt,cmujbcqt,cmujbcqt,cmujbcqt); H2 4 steps pass (cmujbcqt,cmujbcqt,cmujbcqt,cmujbcqt); same version, two independent hypothesis-bound compile stacks
- PASS 5 active opportunity: enrollFromDecision on GAP RC Blocked Co gap-e2erc-1790483007680 (pipeline_stage meeting) refuses active_opportunity (B6) even with a passing compile stack identical to the happy path's; no queue item created
- PASS 6 suppression: a do_not_contact persona refuses suppressed on leg modex_do_not_contact (R3-2); local suppression checked BEFORE any queue write, on a fresh read, same as B6 above
- PASS 7 enroll: enrollment ae644069-7653-4561-b4f5-34b99fc5f444 active, item 67 stamped (sequence_version_id cmujbcqsn001g7keoe0joka9r) and gate-visible (SF11) from the instant it was created, is_test false
- PASS 8 kill switch: GAP_OS_ENABLED off: scheduleNextStep on this run's own GAP-stamped item (sequence_version_id set) schedules nothing (B5), audits schedule.skipped, and creates no second item; flag restored
- PASS 9 agreement: real RoutingDecision rows stamped by the real recordHumanAction, read back through loadAgreementReport: 1 agreement, 1 disagreement, rate 0.5 (R-B)
- PASS 10 disposition: H1 confirmed with a root-cause BID (resolution confirmed); H3's internal-recipient (probe+gap-e2erc-1790483007680@freightroll.com) disposition recorded too, for the B9 exclusion check next
- PASS 11 learning b9: the internal-recipient (@freightroll.com) disposition on H3 never reaches buildLearningReport's real metrics (B9); H1's external disposition does
- PASS 11 learning ra: program filter 'gap-finish-rc' includes H1's family, a nonexistent program excludes it, a date window after this run excludes it, a window bracketing this run includes it (R-A)
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}); zero leftovers

## Counts

- gitSha: fe935200
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-e2erc-1790483007680
- h1: cmujbcqpk00097keo58uy8o4k
- h2: cmujbcqri000m7keozkq1em63
- h3: cmujbcqs300117keowl5hyu8j
- familyId: cmujbcqsf001e7keoms3fp22b
- versionId: cmujbcqsn001g7keoe0joka9r

## Cleanup

- Removed: {"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"draft_queue_items":0,"sequence_enrollments":0,"sequence_families":0,"routing_decisions":0,"gap_compiles":0}

Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.
