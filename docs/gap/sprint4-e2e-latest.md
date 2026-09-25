# Sprint 4 end-to-end run (latest)

STATUS: PASS

<!-- verified:2026-09-25 -->

Written by `scripts/gap/e2e-sprint4.ts`. Rerun it against the scratch database to refresh this file.

- Run tag: gap-e2e4-1790296156411
- Database: 127.0.0.1:55432/gap_finish_e2e (scratch only; the script refuses any other host)
- Git: 7b507dfe
- Ran at: 2026-09-25T00:29:18.338Z
- Credentials scrubbed from the process before the first import: HUBSPOT_ACCESS_TOKEN,MC_API_TOKEN,GOOGLE_REFRESH_TOKEN,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,CLAWD_CONTROL_PLANE_URL,CLAWD_CONTROL_PLANE_TOKEN
- No HubSpot, clawd, Gmail or model call is possible in this run: the AI client is a stub, the critic is a stub, the autonomy reader is a stub, the cross-plane suppression reader is a static CLEAR, the disposition mirror answers skipped:gap_mirror_disabled before any call (GAP_HUBSPOT_MIRROR_ENABLED off), recordUnsubscribe finds no HubSpot token, the review-feed poster has no token.
- The human actor of every disposition is the session email the route would derive; the agent row is written with actorKind agent as a header-token caller would be.
- Not exercised: the route handlers themselves (auth needs a Next request scope; tests/unit/gap/*-route.test.ts cover them) and the check-inbox / HubSpot poller wiring (tests/unit/gap/reply-ingest.test.ts pins the call-shape); this run calls ingestReply as those crons do after the InboundMessage persist.

## Steps

- PASS preflight: flags on (classification on, auto-enroll off, mirror off), credentials scrubbed, 4 seed families present, no stale rows
- PASS 1 seed: account, personas 41/42/43 at example.com, facts cmug83vd (operator) + cmug83ve (public url), hypotheses cmug83ve/cmug83vg/cmug83vh active citing both facts, family cmug83vj v1 compiled pass (4 steps x 3 hypotheses, stub critic), three live modex enrollments each with a step-0 draft item
- PASS 2 ingest: enrollment 8168489a paused with the reply_pending marker (inbound gap-e2e4-1790296156411-msg-1), step-0 item skipped sequence_stopped:replied, 1 reply.ingested audit row; second ingest already_paused with no second row; the other two runs still active
- PASS 3 list: reply gap-e2e4-1790296156411-msg-1 listed: source inbound_message/gap-e2e4-1790296156411-msg-1, persona 41, hypothesis cmug83ve (network_standardization), enrollment paused, no suggestion, snippet is the plain text with no tag
- PASS 4 suggest: unconfirmed ai row cmug83vy (created_by ai, problem_confirmed, quote verbatim) with the hypothesis still active, the enrollment still paused, no unsubscribe row, no resolution, no BID, and routing inputs still show the reply undispositioned with no lastDisposition; second call idempotent (1 model call); a quote not in the text -> null, quote_not_found:0, reply.suggest_rejected audited, no row
- PASS 5 disposition: ai row cmug83vy became the human's row (confirmed_by casey@freightroll.com, metadata.aiSuggestion matched=true), 2 BIDs confirmed, enrollment stopped (replied), hypothesis cmug83ve confirmed at 85 (60 email + 15 quote + 10 root cause) citing both BID ids, mirror skipped:gap_mirror_disabled with no mirror row; audit kinds disposition=[reply.suggested, disposition.recorded, disposition.effects], hypothesis has one hypothesis.resolved, enrollment has one enrollment.pause + one enrollment.stop + one enroll.live; resubmit on the resolved hypothesis -> hypothesis_terminal, same source on an active hypothesis -> duplicate_source (existingId); the reply left the undispositioned list, state=all carries dispositionId, and routing inputs now read the reply as dispositioned with lastDisposition problem_confirmed
- PASS 6 db truth: GAP_DISPOSITION_FROZEN refuses response_class, metadata and a confirmation revert on the confirmed row; GAP_BID_IMMUTABLE refuses a BID delete and a raw-language edit; correctBid inserted cmug83wb superseding cmug83w3 (original untouched), selectConfirmedBids drops the old row and keeps the new plus the root cause; a second correction is already_superseded
- PASS 7 voicemail: voicemail on marcus+gap-e2e4-1790296156411@example.com recorded confirmed (row cmug83wc) with no stop, no resolution, no unsubscribe: enrollment 6bd64aa0 still active, its draft item still draft, hypothesis still active; the table says keepsSequence; voicemail on channel email is refused call_only_class
- PASS 8 timing: timing on marcus+gap-e2e4-1790296156411@example.com confirmed with metadata.resumeAt 2026-11-02T14:00:00.000Z; hypothesis cmug83vg still active with no resolution; the run stopped (replied); assembleRoutingInputs for persona 42 reads comms.lastDisposition = timing with that resumeAt
- PASS 9 dnc: do_not_contact on dana+gap-e2e4-1790296156411@example.com: UnsubscribedEmail row (reason "do_not_contact disposition"), Persona.do_not_contact true (the other two false), run b1cac67c stopped (dnc) with its item skipped sequence_stopped:dnc, mirror skipped:gap_mirror_disabled, hypothesis untouched; a shadow enrollFromDecision is refused suppressed on leg unsubscribed (the first leg that hits; the persona flag alone is the modex_do_not_contact leg) and audited enroll.refused
- PASS 10 brief: brief for persona 41: FACT block observation cites both facts and the signals list carries both (one with the public url), the confirmed disposition with the buyer's words is the only disposition, zero open BIDs (all confirmed or superseded), the falsification question is the suggested question; the dnc persona's brief says doNotContact
- PASS 11 agent row: agent (cron) problem_rejected on marcus+gap-e2e4-1790296156411@example.com stored unconfirmed with effects none and only disposition.recorded audited; hypothesis cmug83vg still active with no resolution; a human adopting it through aiSuggestionId SUCCEEDS (B1+B2: created_by stays cron, confirmed_by becomes casey@freightroll.com, hypothesis resolves rejected); an agent passing aiSuggestionId is refused agent_cannot_confirm; resubmitting on the now-resolved hypothesis is refused hypothesis_terminal
- PASS 12 credentials: no credential reappeared; no HubSpot, clawd, Gmail or model call was possible
- PASS cleanup: every row the run created was deleted ({"gap_audit_events":49,"buyer_input_data":3,"conversation_dispositions":5,"gap_hubspot_mirror":0,"unsubscribed_emails":1,"inbound_messages":2,"email_threads":2,"send_approval_requests":0,"gap_compiles":15,"hypothesis_events":14,"hypothesis_signals":6,"draft_queue_items":3,"sequence_enrollments":3,"prospecting_hypotheses":3,"prospecting_signals":2,"sequences":1,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":1}); zero leftovers across 15 tables

## Counts

- seedFamiliesOnScratch: 4
- hypotheses: 3
- compilesPersisted: 15
- enrollments: 3
- aiSuggestionRowId: cmug83vyi002r7kngk6joeeqg
- dispositionId: cmug83vyi002r7kngk6joeeqg
- confirmedBidIds: cmug83w36002v7kngppl018s7,cmug83w3c002x7kngjyreaa4n
- resolutionConfidence: 85
- correctedBidId: cmug83wbe00357kngeno1xyfh
- timingDispositionId: cmug83wcz003b7kngm402x9rw
- dncDispositionId: cmug83wfi003g7kngv11h8e28
- agentDispositionId: cmug83wja003n7kngizwcxopg

## Cleanup

- Removed: {"gap_audit_events":49,"buyer_input_data":3,"conversation_dispositions":5,"gap_hubspot_mirror":0,"unsubscribed_emails":1,"inbound_messages":2,"email_threads":2,"send_approval_requests":0,"gap_compiles":15,"hypothesis_events":14,"hypothesis_signals":6,"draft_queue_items":3,"sequence_enrollments":3,"prospecting_hypotheses":3,"prospecting_signals":2,"sequences":1,"sequence_versions":1,"sequence_families":1,"personas":3,"accounts":1}
- Leftovers after cleanup: {"accounts":0,"personas":0,"prospecting_signals":0,"prospecting_hypotheses":0,"conversation_dispositions":0,"buyer_input_data":0,"unsubscribed_emails":0,"inbound_messages":0,"email_threads":0,"sequence_enrollments":0,"draft_queue_items":0,"sequences":0,"sequence_versions":0,"sequence_families":0,"gap_compiles":0}

Every row the run created was deleted in the finally block (gap_audit_events, buyer_input_data, conversation_dispositions, gap_hubspot_mirror, unsubscribed_emails, inbound_messages, email_threads, send_approval_requests, gap_compiles, hypothesis_events, hypothesis_signals, draft_queue_items, sequence_enrollments, prospecting_hypotheses, prospecting_signals, sequences, sequence_versions, sequence_families, personas, accounts) and the leftover count per table was asserted zero. The four seed families were read, never frozen or changed.
