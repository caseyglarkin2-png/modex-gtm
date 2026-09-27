# Sprint 3 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-sprint3.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e3-1790552294628
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 471f486e
- Ran at: 2026-09-27T23:38:17.000Z
- Credentials scrubbed from the process before the first write: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd or Gmail call is possible in this run: stub critic, stub autonomy reader, static CLEAR suppression reader (the default clawd reader answers unknown without config and refuses), Gmail credentials absent for the queue dedup thread check, review-feed poster without a token.
- R3-4: step 0 is the observation slot; the compiler judges the marked copy, the queue holds the stripped copy; later steps are created draft and earn approved from their own per-item compile (step 1 with the fixture refs handed in; step 2 with the hypothesis signals only stays draft, rejected on C01).
- Not exercised: `approveBatch` (NextAuth `auth()` needs a request scope); step 9 asserts the guard data contract instead and the unit suite covers the guard.

## Steps

- PASS preflight: flags on (auto-enroll off), credentials scrubbed, 4 seed families present, no stale rows
- PASS 1 seed: account, persona 15 (priya+gap-e2e3-1790552294628@example.com), verified facts cmukglsyn00017k10k207au6q (10-K acquisition) + cmukglsyt00037k10p4mirsvb (new Ohio DC), hypothesis cmukglsyx00057k105t404ikp active (hidden_capacity / distribution), observation quotes fact cmukglsy verbatim and cites it; cmukglsy is linked support
- PASS 2 version: family cmukglt1s000i7k10839o5jd0, version cmukglt21000k7k10uubp8fv2 v1 draft (hash b9114d93996e), identical steps refused identical_to_version:1
- PASS 3 compile: 4 steps pass through 64 checks with the stub critic (step 0 = slot render quoting fact cmukglsy), 4 GapCompile rows persisted (cmukglt2, cmukglt2, cmukglt2, cmukglt2)
- PASS 4 meeting ask: reject, C09 CTA family meeting_request is disallowed before a meeting (step 0, sequence_step_1): "Open to a quick call on it?"
- PASS 5 approval: review_required compile cmukglt3700117k10w84ap0ck, one pending gap_compile request cmukglt3d00147k10c0wmqmvw (risk 30), second call existing
- PASS 6 materialize: no_compile_ids, step_not_compiled:3, compile_wrong_hypothesis for another hypothesis, then Sequence 4 "GAP E2E3 Hidden Capacity gap-e2e3-1790552294628 v1" with 4 steps, second call existing, drifted steps under the same name refused sequence_name_collision
- PASS 7 shadow: modex_shadow for priya+gap-e2e3-1790552294628@example.com: subject "Doors versus spots", body rendered (Hi Priya, observation in the slot, no marker), zero writes ({"items":0,"enrollments":0,"compiles":6,"sequences":1}), 1 enroll.shadow audit row
- PASS 8 live: enrollment c623cac1-1fdc-4ced-891b-ed358f8abe6e active on v1, version FROZEN by the trigger (frozen_by_enrollment_id matches), draft item 6 stamped (run, step 0, version, sequence_id 4 from the idempotent materialize), item-level GapCompile cmukgltcj00187k10aoilw18z pass judged the MARKED copy (evidence_ids_used = both facts) while the queued body carries no marker, 1 enroll.live audit row
- PASS 9 approve guard: item 6 passes the guard contract (newest item-level compile is pass); orphan item 7 refused with a rejecting row and refused again after that row is deleted (no template-level row for its step)
- PASS 10 schedule: step 1 item 8 from the pinned version, placeholders rendered, no marker queued, key casey@yardflow.ai:priya+gap-e2e3-1790552294628@example.com:c623cac1-1fdc-4ced-891b-ed358f8abe6e:1, scheduled 2026-10-01T14:00Z (Friday + 4 business days), created draft then APPROVED by its own item-level compile cmukgltf3001f7k10y12icyfj (pass, by sequence-runtime), rerun returns the same id with no recompile; step 2 item 10 created draft and LEFT draft: compile cmukgltga001i7k10urrc8bdg reject on C01 (fixture marker hc_ev_3 unresolved against the hypothesis signals), schedule.compile_not_passed audited, guard refuses it
- PASS 11 frozen: service refuses version_frozen; the database trigger refuses a raw update with GAP_VERSION_FROZEN
- PASS 12 stop: stop(replied) skipped 2 rows (the failed step 1 and the draft step 2, both sequence_stopped:replied), the sent step 0 untouched, enrollment stopped by e2e3, second stop terminal
- PASS 13 journal: dry run over tests\fixtures\gap\top100-journal: {"rows":11,"families_new":3,"families_existing":0,"families_manifest_only":1,"versions_new":5,"versions_existing":0,"copy_events_journal":6,"copy_events_new":6,"copy_events_existing":0,"enrollments_pending":0,"enrollments_attributed":0,"enrollments_unattributed":0,"ignored_ops":2}, 4 warnings, nothing written
- PASS 14 top100 gate: fixture lane 8 steps (1 pass, 7 reject) persisted with the top100Compile key under created_by compile-top100:e2e3; gate: Riley compile_not_passed:0 (meeting ask), Jordan compile_not_passed:1 (stale ref at step 2), synthetic clean contact ok with 4 ids, a pass written by e2e3 ignored (compile_missing); enroll table: 1 contact under Enroll, Riley skipped as "compile_not_passed:0"
- PASS 15 credentials: no credential reappeared; no HubSpot, clawd or Gmail call was possible

## Counts

- seedFamiliesOnScratch: 4
- hypothesisSignals: 2
- versionStepsCompiled: 4
- versionChecksRun: 64
- sequenceId: 4
- enrollmentId: c623cac1-1fdc-4ced-891b-ed358f8abe6e
- draftItemId: 6
- step1ItemId: 8
- step2ItemId: 10
- journalRows: 11
- journalFamiliesNew: 3
- journalVersionsNew: 5
- journalCopyEventsNew: 6
- laneStepsCompiled: 8
- laneStepsPass: 1
- laneStepsReject: 7

Every row the run created was deleted in the finally block (gap_audit_events, send_approval_requests, gap_compiles, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, draft_queue_items, sequences, sequence_enrollments, sequence_versions, sequence_families, personas, accounts). The four seed families were read, never frozen or changed.
