# GAP OS RUNTIME final integrated e2e (latest)

STATUS: PASS

<!-- verified:2026-09-27 -->

Written by `scripts/gap/e2e-runtime.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-rt-1790474198017
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 1bf8ea34
- Ran at: 2026-09-27T01:56:38.896Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the critic is a stub, the suppression reader is the static one, no credential is present, and the HubSpot/Gmail adapters run against injected fake transports.
- Proves the full chain: messy company identity -> 6A canonical resolution -> signal -> hypothesis -> routing -> ExecutionIntent -> the full 6B gate chain -> a fake-transport adapter receipt -> 6D reconciliation -> inbound reply -> AI/unconfirmed suggestion -> human confirmation -> BID -> hypothesis resolution -> stop/DNC effect -> operational learning (6E/6F) -> routing-vs-human agreement (R-B) -> Sprint 7 shadow decision -> cap/gate evaluation -> the kill-switch drill -> zero real outbound action.

## Steps

- PASS 0 preflight: flags on, Sprint 7 flags off, credentials scrubbed, seed family present, no stale rows
- PASS 1a identity precedence: company id wins over a name that exactly matches a different real account (GAP RT Wrong Guess gap-rt-1790474198017); conflict reported: {"via":"normalized","accountName":"GAP RT Wrong Guess gap-rt-1790474198017"}
- PASS 1b identity ambiguity: two real accounts that normalize identically refuse ambiguous_identity rather than silently picking one
- PASS 1c messy identity: "GAP RT Co gap-rt-1790474198017, LLC" resolved to the canonical account GAP RT Co gap-rt-1790474198017 through the real hypothesize job (not thrown), and cached as an alias
- PASS 2 seed personas: account GAP RT Co gap-rt-1790474198017 (pipeline_stage=targeted), blocked account GAP RT Blocked Co gap-rt-1790474198017 (pipeline_stage=meeting), four personas (happy 31, blocked 32, internal 33, dnc 34)
- PASS 2b facts: H1 facts cmuj63x6/cmuj63x6, H2 facts cmuj63x6/cmuj63x6, H4 facts cmuj63x6/cmuj63x6
- PASS 2c/2d hypotheses: H1 cmuj63x6, H2 cmuj63x7 (blocked), H3 cmuj63x8 (internal), H4 cmuj63x8 (dnc target) all active
- PASS 4 compile: H1 4 steps pass (+1 stale generation for SF14), H2 4 steps pass, H4 4 steps pass; three independent hypothesis-bound compile stacks on one version
- PASS 4a active opportunity: ExecutionIntent for the mid-deal account refuses active_opportunity through legacyEnrollAdapter; no queue write, no fake transport call
- PASS 4a suppression: a do_not_contact persona refuses suppressed through the same ExecutionIntent/legacyEnrollAdapter path
- PASS 4b sf14 compile_stale: a ~40h-old compile refuses compile_stale:0 once maxCompileAgeMs is opted into, through legacyEnrollAdapter
- PASS 4b sf14 evidence_expired: a hypothesis linked to a real expired signal refuses evidence_expired once checkEvidenceFreshness is opted into
- PASS 4c enroll: ExecutionIntent for the happy path succeeds through the full 6B gate chain: receipt {"engine":"modex_queue","status":"queued","engineId":"25","createdAt":"2026-09-27T01:56:38.017Z"}, enrollment bf594cc8-662d-40d1-bedf-eb6e7f971e7f active
- PASS 5a hubspot adapter: flag off: zero network calls, provably; flag on with a fake transport: real adapter code runs end to end, engineId hs_enr_gap-rt-1790474198017, no real HTTP call possible
- PASS 5b gmail adapters: gmail_draft (draft_gap-rt-1790474198017) is distinct from gmail_direct (sent_gap-rt-1790474198017); the sent receipt's supersedesEngineId names the draft, never collapsed into one event; both against a fake transport, zero real Gmail/OAuth calls
- PASS 6 reconcile: MATCHED (messy raw name -> canonical account -> the real enrollment bf594cc8-662d-40d1-bedf-eb6e7f971e7f), then ALREADY_IMPORTED on the same evidence, then IDENTITY_UNRESOLVED for an unknown company (no Account created)
- PASS 7b ai suggestion: unconfirmed AI suggestion cmuj63xj carries no effects; only a human session can turn it into truth
- PASS 7c human confirm: human confirmation turns the AI suggestion into buyer truth (BuyerInputData, hypothesis resolved confirmed, enrollment stopped replied); an agent cannot overwrite the confirmed BID (correction_requires_human)
- PASS 7d dnc: do_not_contact disposition unsubscribes morgan+gap-rt-1790474198017@example.com, flags the persona, and stops its enrollment (stop_reason=dnc)
- PASS 8a agreement: routing-vs-human-action agreement over real RoutingDecision rows: 1 agreement, 1 disagreement, rate 0.5 (R-B)
- PASS 8b learning: internal/test traffic excluded (B9); byEngine and bySender breakdowns both present; every rate carries n (denominator 2)
- PASS 8c learning ra: campaign/program filtering and date filtering both work: program gap-e2e-runtime includes H1, a nonexistent program excludes it, a future date window excludes it
- PASS 9a canary: checkCanaryCaps allows the allowlisted account and fails closed for one not on it
- PASS 9b gates: evaluateGates over real numbers from this run correctly reports NOT earned (n is far below every threshold, as it honestly should be for one e2e run); G0 (owner halt reversal) reports unmet, matching the real, untouched autonomy halt
- PASS 9c shadow decision: recordShadowDecision writes one enroll.shadow audit row with acted_by_system_at explicitly null; GAP_AUTO_ENROLL_SHADOW restored to off after
- PASS 9d kill-switch drill: the real clawd autonomy halt is never touched; an injected fake reader proves the guard reads fresh on every call: not-halted does not refuse on the autonomy step, halted refuses autonomy_halted immediately
- PASS 10 zero outbound: every credential absent throughout; every network-adjacent call in this run went through a fake transport or a stub; no real send, enrollment, or write to HubSpot/Gmail/production ever happened
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":55,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":4,"draft_queue_items":3,"sequence_enrollments":2,"gap_compiles":16,"hypothesis_events":18,"hypothesis_signals":8,"prospecting_hypotheses":4,"prospecting_signals":9,"gap_account_aliases":1,"pounce_triggers":1,"inbound_messages":1,"email_threads":1,"sequence_versions":1,"sequence_families":1,"unsubscribed_emails":1,"personas":4,"accounts":5}); zero leftovers

## Counts

- gitSha: 1bf8ea34
- databaseHost: 127.0.0.1:55432/gap_finish_e2e
- runTag: gap-rt-1790474198017
- dncEnrollmentId: 9a734b24-6f71-4d17-98d2-ac10a6051bc4
- replyBacklogCount: 0
- staleHypothesesN: 2
- h1: cmuj63x6p000j7k04vcaozgnb
- h2: cmuj63x7r000w7k04iu3xv7ft
- h3: cmuj63x8k001o7k0469qubc1y
- h4: cmuj63x8500197k04ilt3s22r
- familyId: cmuj63x9400217k04rcp5b0k5
- versionId: cmuj63x9b00237k04iu3xqcap
- enrollmentId: bf594cc8-662d-40d1-bedf-eb6e7f971e7f

## Cleanup

- Removed: {"gap_audit_events":55,"gap_hubspot_mirror":0,"routing_decisions":2,"buyer_input_data":2,"conversation_dispositions":4,"draft_queue_items":3,"sequence_enrollments":2,"gap_compiles":16,"hypothesis_events":18,"hypothesis_signals":8,"prospecting_hypotheses":4,"prospecting_signals":9,"gap_account_aliases":1,"pounce_triggers":1,"inbound_messages":1,"email_threads":1,"sequence_versions":1,"sequence_families":1,"unsubscribed_emails":1,"personas":4,"accounts":5}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"gap_account_aliases":0,"pounce_triggers":0,"conversation_dispositions":0,"buyer_input_data":0,"draft_queue_items":0,"sequence_enrollments":0,"sequence_families":0,"routing_decisions":0,"gap_compiles":0,"inbound_messages":0,"email_threads":0,"unsubscribed_emails":0}

Every row the run created was deleted in the finally block and the leftover count per table was asserted zero.
