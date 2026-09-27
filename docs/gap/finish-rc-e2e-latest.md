# GAP OS FINISH release-candidate hardening e2e (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-finish-rc.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2erc-1790472908386
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 409dbc2c
- Ran at: 2026-09-27T01:35:09.064Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, and no credential is present.
- Proves the shortest useful chain over the hardened GAP core: fact/signal -> hypothesis -> approval/activation -> routing decision -> execution/enrollment attribution -> human-confirmed disposition -> BID -> hypothesis resolution -> learning, plus the six properties this finish pass specifically changed (suppression wins, active opportunity blocks cold enrollment, the kill switch cannot create a raw/uncompiled continuation, routing-vs-human-action agreement is recorded, test/internal traffic is excluded from learning, and the campaign/date filter returns only the desired cohort).

## Steps

- PASS preflight: flags on (compiler on, mirror off), credentials scrubbed, seed network_standardization fixture present, no stale rows
- PASS 1 seed: two accounts (GAP RC Co gap-e2erc-1790472908386 pipeline_stage=targeted, GAP RC Blocked Co gap-e2erc-1790472908386 pipeline_stage=meeting), three personas (happy 13, blocked 14, internal 15)
- PASS 1b facts: H1 facts cmuj5ca0r00017k24pmtywbb2/cmuj5ca0u00037k241oxm88sm, H2 facts cmuj5ca0w00057k247r8gc6y3/cmuj5ca0x00077k24stvgxgex
- PASS 2 hypotheses: H1 cmuj5ca0 (GAP RC Co gap-e2erc-1790472908386) and H2 cmuj5ca2 (GAP RC Blocked Co gap-e2erc-1790472908386) both active, both citing two real facts
- PASS 2c internal: H3 cmuj5ca3 active, internal persona 15 (probe+gap-e2erc-1790472908386@freightroll.com)
- PASS 3 family: family cmuj5ca3t001e7k24pbjzdr0l, version cmuj5ca42001g7k24h7ka9ntt v1 (program gap-finish-rc)
- PASS 4 compile: H1 4 steps pass (cmuj5ca4,cmuj5ca4,cmuj5ca4,cmuj5ca4); H2 4 steps pass (cmuj5ca4,cmuj5ca4,cmuj5ca5,cmuj5ca5); same version, two independent hypothesis-bound compile stacks
- PASS 5 active opportunity: enrollFromDecision on GAP RC Blocked Co gap-e2erc-1790472908386 (pipeline_stage meeting) refuses active_opportunity (B6) even with a passing compile stack identical to the happy path's; no queue item created
- PASS 6 suppression: a do_not_contact persona refuses suppressed on leg modex_do_not_contact (R3-2); local suppression checked BEFORE any queue write, on a fresh read, same as B6 above
- PASS 7 enroll: enrollment 8366abd9-9478-4799-92e1-bbe0b7223e8a active, item 6 stamped (sequence_version_id cmuj5ca42001g7k24h7ka9ntt) and gate-visible (SF11) from the instant it was created, is_test false
- PASS 8 kill switch: GAP_OS_ENABLED off: scheduleNextStep on this run's own GAP-stamped item (sequence_version_id set) schedules nothing (B5), audits schedule.skipped, and creates no second item; flag restored
- PASS 9 agreement: real RoutingDecision rows stamped by the real recordHumanAction, read back through loadAgreementReport: 1 agreement, 1 disagreement, rate 0.5 (R-B)
- PASS 10 disposition: H1 confirmed with a root-cause BID (resolution confirmed); H3's internal-recipient (probe+gap-e2erc-1790472908386@freightroll.com) disposition recorded too, for the B9 exclusion check next
- PASS 11 learning b9: the internal-recipient (@freightroll.com) disposition on H3 never reaches buildLearningReport's real metrics (B9); H1's external disposition does
- PASS 11 learning ra: program filter 'gap-finish-rc' includes H1's family, a nonexistent program excludes it, a date window after this run excludes it, a window bracketing this run includes it (R-A)
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}); zero leftovers

## Counts

- gitSha: 409dbc2c
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-e2erc-1790472908386
- h1: cmuj5ca0z00097k247qb350ts
- h2: cmuj5ca2u000m7k24s0bii8jw
- h3: cmuj5ca3f00117k24mip9g1m9
- familyId: cmuj5ca3t001e7k24pbjzdr0l
- versionId: cmuj5ca42001g7k24h7ka9ntt

## Cleanup

- Removed: {"gap_audit_events":31,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":2,"draft_queue_items":1,"sequence_enrollments":1,"gap_compiles":8,"hypothesis_events":14,"hypothesis_signals":5,"prospecting_hypotheses":3,"prospecting_signals":5,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":2}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"draft_queue_items":0,"sequence_enrollments":0,"sequence_families":0,"routing_decisions":0,"gap_compiles":0}

Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.
