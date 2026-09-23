# Sprint 3 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-23 -->

Written by `scripts/gap/e2e-sprint3.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e3-1790201881019
- Database: 127.0.0.1:5433/gap_dev (scratch only; the script refuses any other host)
- Git: ed9c22f5
- Ran at: 2026-09-23T22:18:02.337Z
- Credentials scrubbed from the process before the first write: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET
- No HubSpot, clawd or Gmail call is possible in this run: stub critic, stub autonomy reader, Gmail credentials absent for the queue dedup thread check, review-feed poster without a token.
- Not exercised: `approveBatch` (NextAuth `auth()` needs a request scope); step 9 asserts the guard data contract instead and the unit suite covers the guard.

## Steps

- PASS preflight: flags on (auto-enroll off), credentials scrubbed, 4 seed families present, no stale rows
- PASS 1 seed: account, persona 25 (priya+gap-e2e3-1790201881019@example.com), facts cmuenz7zb00017k64eg60zgau (operator) + cmuenz7zf00037k64zldqvo4l (public url), hypothesis cmuenz7zj00057k64ktn271az active (network_standardization / executive_ops)
- PASS 2 version: family cmuenz80v000i7k645asm25k1, version cmuenz812000k7k64kek001h9 v1 draft (hash cc8c42b32438), identical steps refused identical_to_version:1
- PASS 3 compile: 4 steps pass through 64 checks with the stub critic, 4 GapCompile rows persisted (cmuenz81, cmuenz81, cmuenz81, cmuenz82)
- PASS 4 meeting ask: reject, C09 CTA family meeting_request is disallowed before a meeting (step 0, sequence_step_1): "Open to a quick call on it?"
- PASS 5 approval: review_required compile cmuenz82900117k64ge83936z, one pending gap_compile request cmuenz82f00147k64fagdaepm (risk 30), second call existing
- PASS 6 materialize: no_compile_ids, then step_not_compiled:2, then Sequence 10 "GAP E2E3 Network Standardization gap-e2e3-1790201881019 v1" with 4 steps, second call existing
- PASS 7 shadow: modex_shadow for priya+gap-e2e3-1790201881019@example.com: subject "Three regions, one number", body rendered (Hi Priya,), zero writes ({"items":0,"enrollments":0,"compiles":6,"sequences":1}), 1 enroll.shadow audit row
- PASS 8 live: enrollment d33c271d-f81a-4578-b6f5-7a411f9ca2fc active on v1, version FROZEN by the trigger (frozen_by_enrollment_id matches), draft item 26 stamped (run, step 0, version, sequence_id 10 from the idempotent materialize), item-level GapCompile cmuenz84h00187k648qr32niy pass, 1 enroll.live audit row
- PASS 9 approve guard: item 26 passes the guard contract (newest item-level compile is pass); orphan item 27 refused with a rejecting row and refused again after that row is deleted (no template-level row for its step)
- PASS 10 schedule: step 1 item 28 from the pinned version, placeholders rendered, key casey@freightroll.com:priya+gap-e2e3-1790201881019@example.com:d33c271d-f81a-4578-b6f5-7a411f9ca2fc:1, scheduled 2026-10-01T14:00Z (Friday + 4 business days), rerun returns the same id
- PASS 11 frozen: service refuses version_frozen; the database trigger refuses a raw update with GAP_VERSION_FROZEN
- PASS 12 stop: stop(replied) skipped 1 row (the failed step 1, now sequence_stopped:replied), the sent step 0 untouched, enrollment stopped by e2e3, second stop terminal
- PASS 13 journal: dry run over tests\fixtures\gap\top100-journal: {"rows":11,"families_new":3,"families_existing":0,"families_manifest_only":1,"versions_new":5,"versions_existing":0,"copy_events_journal":6,"copy_events_new":6,"copy_events_existing":0,"enrollments_pending":0,"enrollments_attributed":0,"enrollments_unattributed":0,"ignored_ops":2}, 4 warnings, nothing written
- PASS 14 top100 gate: fixture lane 8 steps (1 pass, 7 reject) persisted with the top100Compile key; gate: Riley compile_not_passed:0 (meeting ask), Jordan compile_not_passed:1 (stale ref at step 2), synthetic clean contact ok with 4 ids; enroll table: 1 contact under Enroll, Riley skipped as "compile_not_passed:0"
- PASS 15 credentials: no credential reappeared; no HubSpot, clawd or Gmail call was possible

## Counts

- seedFamiliesOnScratch: 4
- hypothesisSignals: 2
- versionStepsCompiled: 4
- versionChecksRun: 64
- sequenceId: 10
- enrollmentId: d33c271d-f81a-4578-b6f5-7a411f9ca2fc
- draftItemId: 26
- step1ItemId: 28
- journalRows: 11
- journalFamiliesNew: 3
- journalVersionsNew: 5
- journalCopyEventsNew: 6
- laneStepsCompiled: 8
- laneStepsPass: 1
- laneStepsReject: 7

Every row the run created was deleted in the finally block (gap_audit_events, send_approval_requests, gap_compiles, hypothesis_events, hypothesis_signals, prospecting_hypotheses, prospecting_signals, draft_queue_items, sequences, sequence_enrollments, sequence_versions, sequence_families, personas, accounts). The four seed families were read, never frozen or changed.
