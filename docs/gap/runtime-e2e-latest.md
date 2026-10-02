# GAP OS RUNTIME final integrated e2e (latest)

STATUS: PASS

<!-- verified:2026-10-02 -->

Written by `scripts/gap/e2e-runtime.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-rt-1790907882608
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 35ad3918
- Ran at: 2026-10-02T02:24:43.449Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, no credential is present, and the HubSpot/Gmail adapters run against injected fake transports.
- Proves the full chain: messy company identity -> 6A canonical resolution -> signal -> hypothesis -> routing -> ExecutionIntent -> the full 6B gate chain -> a fake-transport adapter receipt -> 6D reconciliation -> inbound reply -> AI/unconfirmed suggestion -> human confirmation -> BID -> hypothesis resolution -> stop/DNC effect -> operational learning (6E/6F) -> routing-vs-human agreement (R-B) -> Sprint 7 shadow decision -> cap/gate evaluation -> the kill-switch drill -> zero real outbound action.

## Steps

- PASS 0 preflight: flags on, Sprint 7 flags off, credentials scrubbed, seed family present, no stale rows
- PASS 1a identity precedence: company id wins over a name that exactly matches a different real account (GAP RT Wrong Guess gap-rt-1790907882608); conflict reported: {"via":"normalized","accountName":"GAP RT Wrong Guess gap-rt-1790907882608"}
- PASS 1b identity ambiguity: two real accounts that normalize identically refuse ambiguous_identity rather than silently picking one
- PASS 1c messy identity: "GAP RT Co gap-rt-1790907882608, LLC" resolved to the canonical account GAP RT Co gap-rt-1790907882608 through the real hypothesize job (not thrown), and cached as an alias
- PASS 2 seed personas: account GAP RT Co gap-rt-1790907882608 (pipeline_stage=targeted), blocked account GAP RT Blocked Co gap-rt-1790907882608 (pipeline_stage=meeting), four personas (happy 86, blocked 87, internal 88, dnc 89)
- PASS 2b facts: H1 facts cmuqcbac/cmuqcbac, H2 facts cmuqcbac/cmuqcbac, H4 facts cmuqcbac/cmuqcbac
- PASS 2c/2d hypotheses: H1 cmuqcbac, H2 cmuqcbad (blocked), H3 cmuqcbae (internal), H4 cmuqcbae (dnc target) all active
- PASS 4 compile: H1 4 steps pass (+1 stale generation for SF14), H2 4 steps pass, H4 4 steps pass; three independent hypothesis-bound compile stacks on one version
- PASS 4a active opportunity: ExecutionIntent for the mid-deal account refuses active_opportunity through legacyEnrollAdapter; no queue write, no fake transport call
- PASS 4a suppression: a do_not_contact persona refuses suppressed through the same ExecutionIntent/legacyEnrollAdapter path
- PASS 4b sf14 compile_stale: a ~40h-old compile refuses compile_stale:0 once maxCompileAgeMs is opted into, through legacyEnrollAdapter
- PASS 4b sf14 evidence_expired: a hypothesis linked to a real expired signal refuses evidence_expired once checkEvidenceFreshness is opted into
- PASS 4c enroll: ExecutionIntent for the happy path succeeds through the full 6B gate chain: receipt {"engine":"modex_queue","status":"queued","engineId":"29","createdAt":"2026-10-02T02:24:42.608Z"}, enrollment 4a6bc507-9318-4dfc-b930-b30bc053d2c0 active
- PASS 5a hubspot adapter: flag off: zero network calls, provably; flag on with a fake transport: real adapter code runs end to end, engineId hs_enr_gap-rt-1790907882608, no real HTTP call possible
- PASS 5b gmail adapters: gmail_draft (draft_gap-rt-1790907882608) is distinct from gmail_direct (sent_gap-rt-1790907882608); the sent receipt's supersedesEngineId names the draft, never collapsed into one event; both against a fake transport, zero real Gmail/OAuth calls
- PASS 6 reconcile: MATCHED (messy raw name -> canonical account -> the real enrollment 4a6bc507-9318-4dfc-b930-b30bc053d2c0), then ALREADY_IMPORTED on the same evidence, then IDENTITY_UNRESOLVED for an unknown company (no Account created)
- PASS 7b ai suggestion: unconfirmed AI suggestion cmuqcban carries no effects; only a human session can turn it into truth
- PASS 7c human confirm: human confirmation turns the AI suggestion into buyer truth (BuyerInputData, hypothesis resolved confirmed, enrollment stopped replied); an agent cannot overwrite the confirmed BID (correction_requires_human)
- PASS 7d dnc: do_not_contact disposition unsubscribes morgan+gap-rt-1790907882608@example.com, flags the persona, and stops its enrollment (stop_reason=dnc)
- PASS 8a agreement: agreement judged against execution (T10): an enrolled_by_hand click with no enrollment or send after its card is unverified, 0 agreements of n=2, suppressed as an early observation
- PASS 8b learning: internal/test traffic excluded (B9); byEngine and bySender breakdowns both present; every rate carries n (denominator 2)
- PASS 8c learning ra: campaign/program filtering and date filtering both work: program gap-e2e-runtime includes H1, a nonexistent program excludes it, a future date window excludes it
- PASS 9a canary: checkCanaryCaps allows the allowlisted account and fails closed for one not on it
- PASS 9b gates: evaluateGates over real numbers from this run correctly reports NOT earned (n is far below every threshold, as it honestly should be for one e2e run); G0 (owner halt reversal) reports unmet, matching the real, untouched autonomy halt
- PASS 9c shadow decision: recordShadowDecision writes one enroll.shadow audit row with acted_by_system_at explicitly null; GAP_AUTO_ENROLL_SHADOW restored to off after
- PASS 9d kill-switch drill: the real clawd autonomy halt is never touched; an injected fake reader proves the guard reads fresh on every call: not-halted does not refuse on the autonomy step, halted refuses autonomy_halted immediately
- PASS 10 zero outbound: every credential absent throughout; every network-adjacent call in this run went through a fake transport or a stub; no real send, enrollment, or write to HubSpot/Gmail/production ever happened
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":54,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":4,"draft_queue_items":2,"sequence_enrollments":2,"gap_compiles":16,"hypothesis_events":18,"hypothesis_signals":8,"prospecting_hypotheses":4,"prospecting_signals":9,"gap_account_aliases":1,"pounce_triggers":1,"inbound_messages":1,"email_threads":1,"sequence_versions":1,"sequence_families":1,"unsubscribed_emails":1,"personas":4,"accounts":5}); zero leftovers

## Counts

- gitSha: 35ad3918
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-rt-1790907882608
- dncEnrollmentId: f70835c9-2639-4dad-8b6d-5db83fa6fc77
- replyBacklogCount: 0
- staleHypothesesN: 2
- h1: cmuqcbace000j7k8ch7alxx1e
- h2: cmuqcbadv000w7k8c2x4deuzt
- h3: cmuqcbaet001o7k8csv96zf6s
- h4: cmuqcbaea00197k8clh2gapoq
- familyId: cmuqcbaf700217k8c7bcdq5jj
- versionId: cmuqcbaff00237k8cmgypdslh
- enrollmentId: 4a6bc507-9318-4dfc-b930-b30bc053d2c0

## Cleanup

- Removed: {"gap_audit_events":54,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":4,"draft_queue_items":2,"sequence_enrollments":2,"gap_compiles":16,"hypothesis_events":18,"hypothesis_signals":8,"prospecting_hypotheses":4,"prospecting_signals":9,"gap_account_aliases":1,"pounce_triggers":1,"inbound_messages":1,"email_threads":1,"sequence_versions":1,"sequence_families":1,"unsubscribed_emails":1,"personas":4,"accounts":5}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"gap_account_aliases":0,"pounce_triggers":0,"conversation_dispositions":0,"buyer_input_data":0,"draft_queue_items":0,"sequence_enrollments":0,"sequence_families":0,"routing_decisions":0,"gap_compiles":0,"inbound_messages":0,"email_threads":0,"unsubscribed_emails":0}

Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.
