# GAP OS next-version demonstration receipt (C59)

STATUS: DEMONSTRATION RECEIPT, generated 2026-10-09T04:23:44.300Z by scripts/gap/demonstration-receipt.ts on feat/gap-execution-engine at aa5e343a. Local and sink-backed throughout: no production database, no mail credential, no model call, no send, no signed action token. Production is a195467f (dpl_G9KX6ZmwES9f719vk8jsrCcay6r1, READY); nothing in this program is deployed. Regenerate rather than edit.
<!-- verified:2026-10-09 -->

## 1. Before and after: the rendered briefing

### Before: the October 8 briefing as measured in production (the ledger's record)

The October 8 briefing, measured (production, read-only)

The 18 items by kind (the plan row `work.day_planned` 2026-10-08): 9 "In a deal" cards whose only move was a stalled
close date, 1 follow-up at a deal account (held), 4 prospect follow-ups that were 2 (a reminder and a follow-up for the
same return at Southern Glazer's and at Swire, both from a May out-of-office), 1 ready first touch (PepsiCo, Tom
Kamantauskas, the only item with a prepared angle), 1 opted-out admin line, 2 "Someone replied" (Gusto, a vendor; The
Boston Beer Company, June). New-conversation work: 1 of 18. Carried over: none (the first plan).

Why, traced through `work/list.ts`, `work/plan.ts`, `work/briefing.ts` and upstream:

- Ranking: `TIER_RANK` put deal (3) above follow_up (4) and ready (5), so stalled-deal hygiene led by design; the
  briefing listed the plan's items in that order with no sections.
- Supply: the ready lane is routing's `enroll` decisions over ACTIVE theses with a fresh verified outreach fact. The
  whole system holds 31 theses at 8 accounts (16 unresolved, 8 active, 6 approved, 1 waiting review); PepsiCo's are
  "not ready: evidence expired". Routing last ran 2026-10-05 (the daily cron first fires 2026-10-09 10:30Z).
- Upstream of that: research ran 187 times in 7 days (170 insufficient_evidence, 17 evidence_found) and verified
  evidence that was already STALE against the freshness window (23 signal, 15 EDGAR, 3 web records, all stale);
  `research.proposal_prepared` rows: zero, ever (auto-prepare skips a fact that is not fresh). 67 of the 75 watched
  accounts have no thesis. Discovery captured 2,916 signals (2,748 under 45 days old; 253 rated outreach
  candidates, 2,323 account context, 226 research leads, 64 risk, 50 leadership) and queued 30 for research; the rest
  were never put in front of Casey (feedback: null on every one). 91 Pounce triggers are live, 67 at companies that
  are not GAP accounts (Tractor Supply, Costco, Daimler, Outpost). 229 people have written to the mailbox since May
  (596 threads; 21 are known personas at known accounts). The universe: 1,708 accounts, 1,939 people (1,455 with an
  address, 375 do-not-contact); GAP has emailed 1 of them.

So the briefing was starved, not mis-sorted: the funnel demanded a fresh verified fact before anything reached Casey,
and the intelligence GAP already held never got a decision from him. The course correction says exactly that.

### After: the same day replayed on the corrected code (text rendering)

```
GAP today, Fri Oct 9: 17 to execute, 8 to decide [GAP#replay]
Hello. Here is Fri Oct 9 from GAP, in order.
17 to execute: the plan's items, the same list START and NEXT walk, in this order. 8 to decide: intelligence, counted apart (10 waiting in all).

Intelligence worth a look (5 of 7). Any age, for your call; Pursue and GAP develops the angle.
- Bevera Holdings: Bevera and Autoroute expand autonomous middle-mile trucking to Texas. freightnews.example, published Oct 3, 2026. Unverified present-day status. Also reported by supplychainwire.example, newswire.example.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Kestrel Logistics: Kestrel opens an innovation lab for warehouse automation testing. freightnews.example, published Jun 24, 2026. Historical observation.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Prairie Foods: Prairie Foods opens a 600,000 square foot distribution center in Iowa. prairiefoods.example, published May 10, 2018. Historical observation.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Bevera Holdings: BEV 10-Q filed. EDGAR, published Oct 4, 2026. Unverified present-day status.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Tractor Depot: Tractor Depot opens an Idaho distribution center with automation. chainstoreage.example, published Oct 7, 2026. Unverified present-day status. Tractor Depot is not a GAP account yet. Themes: network capex.
   Decide it on Work: https://modex-gtm.vercel.app/gap/

Prospects to reengage (3). They wrote to us and went quiet.
- Kestrel Logistics: Chris Ortiz, Director, Distribution at Kestrel Logistics. Wrote to us Sep 2, 2026 (1 message), last about "Re: the Chattanooga yards"; their account is in an open deal (YardFlow - Kestrel, presentationscheduled): work it from the deal. Previously contacted, a response. No exchange either way in 33 days (last: Sep 6, we wrote).
   In a deal at Kestrel Logistics: YardFlow - Kestrel (presentationscheduled). Next step: Roadmap sync Oct 14, then the two-site pilot scope. Work it from the deal: https://modex-gtm.vercel.app/gap/accounts/kestrel-logistics/?view=brief
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- unknownco.example: Pat (unknownco.example). Wrote to us Aug 24, 2026 (1 message), last about "hello"; open deal unknown: the person is not placed at an account; not a GAP contact yet. Previously contacted, a response. No exchange either way in 45 days (last: Aug 24, they wrote). Review before outreach: purpose unknown: review before any outreach.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Glacier Spirits: Phil Sava, VP Operations at Glacier Spirits. Wrote to us Jun 20, 2026 (1 message), last about "Re: yards"; no open deal found (HubSpot read Oct 9, 12:18 AM New York). Previously contacted, a response. An answer is owed since Jun 20, 2026: they wrote Jun 20; nothing sent since.
   Decide it on Work: https://modex-gtm.vercel.app/gap/

Begin with item 1, Harbor Co: In a deal. https://modex-gtm.vercel.app/gap/start

Ready to send (1)
14. Bevera Holdings: Ready for a first touch. Tom K (VP Supply Chain). A prepared angle on a verified fact.
   Ready for a first touch.
   Next: Draft.
   Source: the pursuit record.
   https://modex-gtm.vercel.app/gap/item

Owed and in conversation (2)
16. Gusto Example: Someone replied. Rise Agency. A vendor wrote.
   Someone replied.
   Last: Rise Agency wrote Oct 9, "Grow your pipeline": We offer outbound services for yard management vendors.
   Source: their email in the GAP mailbox, Oct 9.
   https://modex-gtm.vercel.app/gap/item
17. Glacier Spirits: Someone replied. Phil Sava (VP Operations). Phil wrote in June.
   Someone replied.
   Last: Phil Sava wrote Jun 20, "Re: yards": Not this quarter; our yards are mid-move.
   Source: their email in the GAP mailbox, Jun 20.
   https://modex-gtm.vercel.app/gap/item

Follow-ups (4)
10. Southern Spirits: Follow up with A Buyer at Southern Spirits. A Buyer. Returned on May 26; overdue since then.
   Last: their out-of-office.
   Source: the recorded buyer words, Oct 9.
   https://modex-gtm.vercel.app/gap/item
11. Southern Spirits: Follow up due. A Buyer (Director). They asked us to come back.
   Follow up due.
   Source: the Work lanes.
   https://modex-gtm.vercel.app/gap/item
12. Swire Water: Follow up with A Buyer at Swire Water. A Buyer. Returned on May 26; overdue since then.
   Last: their out-of-office.
   Source: the recorded buyer words, Oct 9.
   https://modex-gtm.vercel.app/gap/item
13. Swire Water: Follow up due. A Buyer (Director). They asked us to come back.
   Follow up due.
   Source: the Work lanes.
   https://modex-gtm.vercel.app/gap/item

Everything else (1)
15. Glacier Spirits: Opted out. They asked to be removed.
   Opted out.
   Last: Someone wrote Oct 9, "Remove me": Please remove me from your list.
   Source: their email in the GAP mailbox, Oct 9.
   https://modex-gtm.vercel.app/gap/item

Deals, in one line (9): Harbor Co (Close date passed with no activity); Meridian Foods (Close date passed with no activity); Northfield Mills (Close date passed with no activity); Summit DC (Close date passed with no activity); Swale Beverages (Close date passed with no activity); Prairie Foods (Close date passed with no activity); Bevera Holdings (Close date passed with no activity); Lantern Freight (Close date passed with no activity); Delta Yards (Close date passed with no activity). The deal workspace holds the detail.

Waiting on them: 0. Parked (research, holds, set aside): 1. Snoozed: 0.
Everything, with what is waiting and parked: https://modex-gtm.vercel.app/gap/

To work from your inbox, reply with START and the first item arrives as its own email. Each item takes APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT or HELP on the first line of your reply.

Sent by GAP at 12:23 AM New York. This is an internal message to you; nothing in it went to a buyer.
```

HTML rendering: 7004 chars, the same sections (not reproduced).

## 2. Source manifest and dispositions (the replay, C56)

### Source manifest

- planItems: 17
- signals: 4
- triggers: 1
- people: 3
- packetClaims: 3
- timelineEvents: 4
- drafts: 1
- sent: 0

### Dispositions, C01 to C44 (no silent exception)

| Ticket | Disposition | Evidence |
|---|---|---|
| C01 | demonstrated | Chris at Kestrel: "Wrote to us Sep 2, 2026 (1 message), last about "Re: the Chattanooga yards"; their account is in an open deal (YardFlow - Kestrel, presentationscheduled): work " |
| C02 | demonstrated | placed via persona |
| C03 | demonstrated | the alias "kestrel" on the in-deals read found the deal; opportunity open |
| C04 | demonstrated | no "no live opportunity" anywhere; the unplaced writer's line says "open deal unknown: the person is not placed at an account" (C57 F1: no identity, no negative) |
| C05 | demonstrated | the Pursue carries inboundMessageId m-chris-sep2, the date and a 92-char excerpt |
| C06 | demonstrated | the angle is deal work scoped to 62700000001 (1 succeeded, 0 failed) |
| C07 | demonstrated | the packet timeline carries 4 typed events with the author's own text |
| C08 | demonstrated | both renderer paths produced (text and HTML); drafts never count as contact: Chris is quiet although a draft to him could exist (the Sent read holds sends only) |
| C09 | demonstrated | the vendor pitch and the support ask are not prospects to re-engage |
| C10 | demonstrated | Dan (we wrote Oct 1) is not quiet and not listed; Chris is quiet on both sides: "No exchange either way in 33 days (last: Sep 6, we wrote)" |
| C11 | demonstrated | the suspicious notice is out; Pat (purpose unknown) carries "purpose unknown: review before any outreach" |
| C12 | demonstrated | one conversation.classified row for m-vendor; Dan's thread untouched |
| C13 | demonstrated | every packet claim validates; none refused |
| C14 | demonstrated | vault claims: vault:02_Accounts/Kestrel Logistics.md#Inbox notes |
| C15 | demonstrated | every vault and Clawd claim is dated by its own day, not the October 8 rebuild |
| C16 | demonstrated | Clawd claim versions: 2026-08-20 |
| C17 | demonstrated | the CRM answers deal existence (open) while the vault no-deal line stays a seller note |
| C18 | demonstrated | external use holds buyer words and checked facts only |
| C19 | documented | docs/gap/CLAUDE_KNOWLEDGE_INVENTORY.md (builder B, cb2a7fd0) |
| C20 | demonstrated | coverage rows: crm:complete, gmail:complete, vault:complete, clawd:complete, public:complete |
| C21 | demonstrated | the angle carries context revision 39c1a8c28b332480 |
| C22 | demonstrated | support entries: 3 |
| C23 | demonstrated | a second Pursue with the same context: angle_kept |
| C24 | demonstrated | lane reply, 1 Gmail draft in the sink, 0 sent |
| C25 | demonstrated | a second acceptance is refused with the competing draft (1 existing draft for this person and deal: reuse or revise before a new one is written.); reuse returns it, lane existing; still one draft |
| C26 | documented | docs/gap/HANDLER_INVENTORY.md (builder B, cb2a7fd0) |
| C27 | demonstrated | the reminder folds into the follow-up of the same origin: one obligation item at Southern Spirits and one at Swire Water, no Reminder item (17 items) |
| C28 | covered_by_test | pinned by stream-c-c27-c28-obligations.test.ts (9) (not re-run in the replay) |
| C29 | demonstrated | the date-only filing says "published Oct 4, 2026" |
| C30 | demonstrated | one item for three reports: "Also reported by supplychainwire" |
| C31 | demonstrated | the headline says its count basis: "17 to execute: the plan's items, the same list START and NEXT walk, in this order. 8 to decide: intelligence, counted apart (10 waiting in a" |
| C32 | demonstrated | the Kestrel intelligence item names the deal and its stage in the briefing |
| C33 | demonstrated | greeting for the New York hour of 2026-10-09T04:23:26.315Z: "Hello. Here is Fri Oct 9 from GAP, in order." |
| C34 | demonstrated | selection: "people who wrote in the last 180 days (up to 2000 messages read); our Sent read for the 4 who would be listed; showing 3 of 3 from 1" |
| C35 | covered_by_test | pinned by stream-a-answers-owed.test.ts (3) (not re-run in the replay) |
| C36 | demonstrated | draft_created 1 (provider), it prepares and completes nothing; sends 0 |
| C37 | covered_by_test | pinned by stream-c-activity-truth.test.ts (10) (not re-run in the replay) |
| C38a | covered_by_test | pinned by stream-c-activity-truth.test.ts (10) (not re-run in the replay) |
| C38b | covered_by_test | pinned by stream-c-activity-truth.test.ts (10) (not re-run in the replay) |
| C38c | demonstrated | no deal_advanced without a CRM stage row |
| C39 | covered_by_test | pinned by stream-c-c39-approve-binding.test.ts (10) and approve-request.test.ts (4) (not re-run in the replay) |
| C40 | covered_by_test | pinned by stream-c-c40-c42-execution.test.ts (5) (not re-run in the replay) |
| C41 | covered_by_test | pinned by stream-c-c40-c42-execution.test.ts (5) (not re-run in the replay) |
| C42 | covered_by_test | pinned by stream-c-c40-c42-execution.test.ts (5) (not re-run in the replay) |
| C43 | covered_by_test | pinned by stream-c-c43-c44-commands.test.ts (17) (not re-run in the replay) |
| C44 | covered_by_test | pinned by stream-a-c44-actions.test.tsx and stream-c-c43-c44-commands.test.ts (not re-run in the replay) |

Demonstrated 33, covered by a focused test 11, documented 2, exceptions 0.

## 3. Targeted tests (focused suites, one file at a time, `--maxWorkers=1`)

| Suite | Cases |
|---|---|
| tests/unit/gap/commercial-context.test.ts | 4 |
| tests/unit/gap/lead-c09-c10-wiring.test.ts | 3 |
| tests/unit/gap/lead-c45-deployment-receipt.test.ts | 3 |
| tests/unit/gap/lead-c46-context-health.test.ts | 5 |
| tests/unit/gap/lead-c50-spend-concurrency.test.ts | 4 |
| tests/unit/gap/lead-c52-reference-set.test.ts | 4 |
| tests/unit/gap/lead-c53-retrieval-eval.test.ts | 4 |
| tests/unit/gap/lead-c54-quality-eval.test.ts | 3 |
| tests/unit/gap/lead-c55-outcome-loop.test.ts | 3 |
| tests/unit/gap/lead-c56-replay.test.ts | 1 |
| tests/unit/gap/lead-intel-c29-c34.test.ts | 3 |
| tests/unit/gap/stream-a-answers-owed.test.ts | 3 |
| tests/unit/gap/stream-a-c44-action-result.test.ts | 5 |
| tests/unit/gap/stream-a-c44-actions.test.tsx | 6 |
| tests/unit/gap/stream-a-c51-stage-authority.test.ts | 5 |
| tests/unit/gap/stream-a-ingest-idempotency.test.ts | 5 |
| tests/unit/gap/stream-a-overrides.test.ts | 2 |
| tests/unit/gap/stream-a-people-state.test.ts | 5 |
| tests/unit/gap/stream-a-purpose.test.ts | 6 |
| tests/unit/gap/stream-a-thread-context.test.ts | 7 |
| tests/unit/gap/stream-b-angle-promote.test.tsx | 3 |
| tests/unit/gap/stream-b-assemble.test.ts | 8 |
| tests/unit/gap/stream-b-competing-work.test.ts | 2 |
| tests/unit/gap/stream-b-promote-angle.test.ts | 3 |
| tests/unit/gap/stream-b-promote-route.test.ts | 2 |
| tests/unit/gap/stream-b-retrieval.test.ts | 7 |
| tests/unit/gap/stream-c-activity-truth.test.ts | 10 |
| tests/unit/gap/stream-c-c27-c28-obligations.test.ts | 9 |
| tests/unit/gap/stream-c-c31-c33-briefing.test.ts | 8 |
| tests/unit/gap/stream-c-c39-approve-binding.test.ts | 10 |
| tests/unit/gap/stream-c-c40-c42-execution.test.ts | 5 |
| tests/unit/gap/stream-c-c43-c44-commands.test.ts | 7 |
| tests/unit/gap/stream-c-c49-activity-coverage.test.ts | 5 |
| tests/unit/gap/v1-kenco.test.ts | 6 |
| total | 166 |

Every ticket's Status line in docs/GAP_PROSPECTING_OS.md names its suite and commit; the pre-existing GAP suites the changes touched (briefing, briefing-send, intel, decide, develop-angle, approve-request, commands-apply, health, routing-rules, ai-spend) were run green on the merged tree at each merge.

## 4. Mocked and live boundaries

- MOCKED here: the model (a scripted generator in the quality harness and the replay), Gmail (a draft sink; nothing sent), HubSpot (the in-deals read and the contact read as fixtures), the vault and Clawd (sink adapters built from the reference cases), the ledger (in memory).
- LIVE and read-only: the deployment receipt (Vercel project reads, no secret values), the health capture saved on 2026-10-08.
- NOT RUN: the live model evaluation (`scripts/gap/quality-eval.ts --live`, metered, needs the gateway key and Casey's go); the production seller round trip (C60, Casey); any send.

## 5. Retrieval and quality measurements

### Retrieval, per class (failures over runs checked; never one aggregate score)

| Class | Checked | Failures |
|---|---|---|
| source_recall | 24 | 0 |
| claim_provenance | 24 | 0 |
| thread_coverage | 24 | 0 |
| conflict_handling | 24 | 0 |
| unauthorized_exclusion | 24 | 0 |
| instruction_safety | 24 | 0 |
| opportunity_status | 24 | 0 |

### Generated usefulness (MOCKED harness check, no quality claim), per check (failures over outputs checked; never one aggregate score)

| Check | Checked | Failures |
|---|---|---|
| produced | 36 | 0 |
| motion_and_person | 36 | 0 |
| known_answer | 36 | 0 |
| no_prohibited_claim | 36 | 0 |
| no_authority_leak | 36 | 0 |
| supported_claims | 36 | 0 |
| specific_next_step | 36 | 0 |
| disconfirming | 36 | 0 |
| house_voice | 36 | 0 |

## 6. Reviewer findings (C57)

# C57 independent review: findings and dispositions

STATUS: ACTIVE (a standing gate). Pass 1 reviewed the first three merges (lead branch at 9edf2edd) in the read-only worktree `wt-gap-review`; pass 2 reviews the final integrated tree (a97d7480 and after) in `wt-gap-review-2`. Reviewers never edit; every edit is made by the owning writer (the lead or the owning builder) and verified by that writer. Each finding carries one disposition: FIXED (commit), ROUTED (owner, in progress), ACCEPTED (left as is, with the reason) or DEFERRED (named debt, owner, reason).
<!-- verified:2026-10-09 -->

## Pass 1 (at 9edf2edd): 9 P1, 8 P2

| # | Sev | Ticket | Finding (file) | Disposition |
|---|---|---|---|---|
| 1 | P1 | C04 | `work/deal-coverage.ts` dealsAt answered `inDeal: false` for a person with no account name, so an unplaced writer under a complete read read "no open deal found". REPRODUCED. | FIXED (lead): no name is `inDeal: null, why: 'unplaced'`; the words say "open deal unknown: the person is not placed at an account"; the replay's C04 evidence now asserts it. |
| 2 | P1 | C09/C11 | `context/purpose.ts` orders the vendor branch before the buyer branch and VENDOR matches "open to a quick call", so a buyer's "open to a quick call next week to talk through the pilot at our two yards" is a vendor pitch and dropped silently. REPRODUCED. | ROUTED to builder A: buyer vocabulary in a human reply wins over the vendor cues (or unknown with review); never a silent drop. |
| 3 | P1 | C10 vs C35 | `work/intel.ts` dropped every owed writer as "C35's list", but `loadAnswersOwed` reads human-confirmed dispositions only: an unanswered writer with no disposition vanished from both. | FIXED (lead): an owed writer stays listed with "An answer is owed since <date>: <basis>" and `state.answerOwedSince`; the wiring test pins it. |
| 4 | P1 | C15/C46 | `context/retrieval.ts` takes a date in a section heading ("## Live signals (clawd, 2026-10-08)") as the claims' observedAt and the vault watermark, so a rebuilt-but-old wedge reads fresh through the vault path. REPRODUCED. | ROUTED to builder B: a sync-section heading date is indexedAt only; the watermark comes from dated non-internal claims. |
| 5 | P1 | C13/C15 | `validateClaims` refused refresh-as-observation only with eventAt null; retrieval copies observedAt into eventAt, which bypassed it; observedAt with indexedAt null also passes. REPRODUCED. | FIXED (lead) for the copy bypass: equality is refused when eventAt is null or equals observedAt. ACCEPTED residual: a claim with observedAt set and indexedAt null cannot be judged by the validator alone (nothing says what the refresh time was); retrieval is the only builder of such claims and sets indexedAt from the file; B's fix to F4 closes the heading-date source. |
| 6 | P1 | C02/C05 | `work/decide.ts` loaded the newest inbound row without including the thread relation, so the thread-alias placement on Pursue never ran in production (the fixture embeds the relation). | FIXED (lead): `include: { thread: { select: { account_name: true } } }`. |
| 7 | P1 | C03/C04 | `work/cockpit-read.ts` and `app/gap/page.tsx` dropped `alsoRecordedAs`, so the Work page could say "no open deal found" where the briefing says "in an open deal". | FIXED (lead): the aliases ride through the cockpit projection, the Work input type and the page. |
| 8 | P1 | C12 | `loadOverrides`/`applyOverrides` had no consumer: the correction ledger was write-only. | FIXED (lead): `loadIntelligence` loads the overrides for every typed message and thread id, applies the message or thread purpose before the verdict and the thread relationship into it; the machine purpose is kept beside. |
| 9 | P1 | C07/C21 | `loadThreadContext` had no production caller for the angle; the handler ran developAngle with no timeline, CRM or identity adapter, so the angle never saw our own sends, the drafts or the accepted meeting. | ROUTED to builder B: develop-angle defaults the timeline adapter to loadThreadContext with the GAP sender's Sent reader (read-only) and the identity service; injection kept for tests. |
| 10 | P2 | C17/C18 | The Pursue seed carried purpose null, which the assembler treats as the buyer's; a Pursue on a vendor sender put the pitch under "what the buyer said". | FIXED (lead side): the decide task input carries the message purpose from classifyPurpose; ROUTED to builder B: packetSeedFromInput reads it onto the seeded event. |
| 11 | P2 | C22 | `agents/angle-claims.ts` BUYER_SUBJECT hard-codes dave|craig: "Bryan confirmed the budget" with no support passes as fact. REPRODUCED. | ROUTED to builder B: the subject list is built from the packet's people. |
| 12 | P2 | C10 | The Sent read covers the first page plus five; a shown person beyond the buffer had no state and no sentence while the selection said Sent was read. | FIXED (lead): a shown person without a state says "Our Sent was not read for them, so a reply of ours may exist". |
| 13 | P2 | C04/C01 | `dealCoverageFrom` ignored `summary.unresolved`: an open deal at a HubSpot company GAP could not map was invisible, so a same-named account read "no open deal found". | FIXED (lead): unresolved company names fold into `unmappedNames`; `dealsAt` answers `inDeal: null, why: 'unmapped'` with the words "an open deal exists at a HubSpot company of this name that GAP has not mapped to an account". |
| 14 | P2 | C46 | A failed context probe answered HEALTHY "not read"; a reachable source with no dated knowledge could be "complete and fresh". | FIXED (lead): a failed probe is DEGRADED and says so; no dated knowledge is partial. |
| 15 | P2 | C39 | approve-request and seller-draft skip the recipient check when the snapshot carries no recipient, and the assignment row records no senderIdentity. | ROUTED to builder C: refuse an APPROVE whose snapshot has no recipient; record and compare senderIdentity. |
| 16 | P2 | C47 | The poller joins hs_email_message_id to the stored RFC id with no normalization. Unconfirmed. | ROUTED to builder A: normalize (trim, strip <>, lowercase) on store and lookup, with a test. |
| 17 | P2 | ledger | Status lines lagged the code at 9edf2edd (C21-C23, C31-C33, C47). | FIXED: every merged ticket carries its receipt; the C58 reconciliation keeps code, tests, deployed and accepted apart. |

Verified as sound by the reviewer (unchanged): coverage status mapping; resolvePersonAccount; C06 scoping; C23 revision; C13 externallyUsable, byAuthority, fingerprint, emptyPacket; C17 deal existence from the CRM only; C16 Clawd versions; C14 bounds and classes; C08 mail types and provenance merge; C35 paging; C36-C38c projection; C49 paging and dedup; C39 revision-0 binding and the recheck before the adapter; C45 redaction; C50 race guard; no retrieved text reaches a tool; no credential printing.

## Builder interface requests (from the final reports)

| From | Request | Disposition |
|---|---|---|
| A | `audit.ts` GapAuditKind gains conversation.classified, execution.reply_resolved, inbound.provenance_linked | FIXED (lead). |
| A | check-inbox cron dedups by RFC but records no provenance link | ROUTED to builder A (reuse storeInbound). |
| A | no Gmail drafts-by-recipient reader; loadThreadContext.listDrafts unwired | DEFERRED (named debt, owner engineering): a draft is never a contact today because the Sent read holds sends only; the drafts reader is a later wiring. |
| A, B | `TimelineEvent.threadId` on the contract | FIXED (lead, optional field). |
| A | no route or UI calls recordOverride / resolveAnswerOwed | DEFERRED (owner: the next seller-evidence ticket): the override is now applied by the intelligence reader; the seller control to record one is a UI ticket Casey raises when a wrong classification costs a day. |
| B | memory `project_gap_execution_engine.md` said X19 open | FIXED at the memory file and its index line. |
| B | developAngle default timeline wiring | ROUTED to builder B (= finding 9). |
| C | unknown-send reconciler drops the body hash (C41 residual) | ROUTED to builder C (execution/* is theirs). |
| C | decide, start and item pages execute on a bare GET | ROUTED to builder A: executionAllowed on GET renders a confirm form; apply on POST. |
| C | assignment row records no senderIdentity | ROUTED to builder C (= finding 15). |
| C | commitmentPhase still says "Back today" on the account page for a passed snooze | DEFERRED (named debt, owner C's next slice): list.ts overrides it on Work; the account page keeps the old words. |
| C | DRAFT_SENT carries no sent-body hash; day-load says only "sent from Gmail by hand" | ACCEPTED: the activity line says the copy as sent was not checked (C40), which is the truth of a by-hand send. |
| C | nothing writes deal.stage_changed or meeting.booked yet | DEFERRED (named debt, owner engineering): deal.stage_changed needs two CRM reads of one deal (C51's only shape) and GAP has no scheduled re-read; meeting.booked needs the calendar proof row. |
| C | the live Clawd read (2026-10-09T03:47Z): the autopush and reply-scan jobs are enabled and running at prod sha 5ad1734, dry run off | ROUTED to builder A to add to `docs/gap/CRM_STAGE_AUTHORITY.md` as the enablement column's live read; OWNER ITEM for Casey (unchanged). |

## Pass 2 (at a97d7480): pending the reviewer's report.

## 7. Residuals

- The C58 reconciliation in docs/GAP_PROSPECTING_OS.md lists every family and owner decision with code, tests, deployed and accepted apart, and the debt left as debt.
- Open for Casey: the merge and deploy of this branch; the production seller reply; the C54 live run; the PepsiCo thesis; the 5% wording; transcription spend; the Clawd autopush enablement.

## 8. Rollback plan

- Nothing to roll back today: production stays at its current commit; this program lives on feat/gap-execution-engine and reaches production only by a merge Casey authorizes.
- After such a merge: the previous production deployment is named in docs/gap/STABLE_BASELINE.md (the rollback pointer) and in docs/gap/DEPLOYMENT_RECEIPT.md; promote it on Vercel; no schema change in this program, so no migration to reverse; flags unchanged.

## 9. Commits on the branch since production

- aa5e343a docs(gap): the audit ledger: the integrated gate at 8b21fd6b (34 program suites, 176 tests, tsc and eslint clean, receipts regenerated)
- 8b21fd6b chore(gap): C54 task builder drops the contact flag without an unused binding (eslint clean on the evaluation module)
- 7b2a5d1a docs(gap): the audit ledger: C59 shipped (a97d7480) with the reviewer section pending, C57 in progress (pass 1 awaited, pass 2 running over the final tree), C60 Casey's and never simulated
- a97d7480 docs(gap): C59 the next-version demonstration receipt, generated locally (scripts/gap/demonstration-receipt.ts, docs/gap/DEMONSTRATION_RECEIPT.md): the before and after rendered briefing and 
- 40bc11f8 docs(gap): C58 every prior family and named owner decision reconciled with code, tests, deployed and accepted kept apart (R00-R65 with the R43 and R61 debt dispositioned, UX-01-17, X01-X22, I
- 5267d94d feat(gap): C24 the promotion control mounted beside the prepared angle (intel-panel.tsx renders builder B's AnglePromote under a ready angle with the task id, the offered people, the proposed
- 39069188 docs(gap): the audit ledger: the C56 receipt (86a0869c), the C53-1 and C54-1 findings fixed by builder B, the C24/C25 update with the route and the control; the sixth merge line
- 86a0869c feat(gap): C56 the October 8 replay (evaluation/replay-october8.ts, scripts/gap/replay-october8.ts, docs/gap/REPLAY_OCTOBER8.md): the real orchestration over a sink-backed world shaped like t
- e5af3827 fix(gap): C54-1 a date-only publication names its own day in the angle's source line (agents/develop-angle.ts sourceLineFor and dayText through the shared work/intel.ts isDateOnly: a value at
- dd768387 feat(gap): C24 with C25 folded in: promoteAngle reads the competing drafts server side before any draft or proposal (the typed timeline with its Gmail drafts when the mailbox is wired, GAP's 
- 4850307b fix(gap): C53-1 a message that is not the buyer's is never buyer evidence (context/assemble.ts buyerClaimsFromTimeline): only buyer_conversation, customer_support and an unclassified purpose 
- 90ce2867 docs(gap): the audit ledger: receipts for C55 (lead), C43 (C) and C44 (A and C); the fifth merge line
- c1e9f33d feat(gap): C55 the loop from real outcomes to recommendations (learning/outcome-loop.ts, routing/explain.ts): a human-confirmed disposition's quote is buyer_said cited by its row (an unconfir
- 0bc89af0 feat(gap): C43 + C44 command authenticity, replay idempotency and recoverable action states (replies/commands-apply.ts, work/action-token.ts): one provider message is one command (a second pa
- e25b7ddd feat(gap): C44 every visible action ends in a recoverable state (ui/action-result.ts, components/gap/action-status.tsx): one reading of an action request into accepted, refused, queued, prepa
- e9e42f2f docs(gap): the audit ledger: receipts for C54 (lead), C51 (A), C24 (B), C40-C42 (C); the fourth merge line; the Clawd autopush owner item
- 9986dfb2 test(gap): C54 test angle literals typed as PreparedAngle
- 65013f74 feat(gap): C54 the generated-usefulness harness (evaluation/quality-eval.ts, scripts/gap/quality-eval.ts, docs/gap/QUALITY_EVAL.md): the real develop-angle handler runs over the frozen refere
- 021ff718 feat(gap): C25 competingWork reads the thread id builder A's ThreadEvent carries (a bare contract event is still judged by addressees and purpose); C26 the handler inventory names the C24 pro
- 4272635b feat(gap): C24 an accepted angle is promoted into the existing draft workflow (agents/promote-angle.ts promoteAngle): the seller accepts a prepared angle for one offered person and one action
- ef48447d feat(gap): C51 cross-system authority for CRM stages (opportunity/stage-authority.ts, docs/gap/CRM_STAGE_AUTHORITY.md): a deal stage is HubSpot's to answer under a complete read (dealStage: k
- 108098f3 feat(gap): C40 + C41 + C42 the app gate, the by-hand route and the lost answer (execution/seller-send.ts, copies-reconcile.ts, hubspot-sequence-adapter.ts, agents/approve-request.ts, work/act
- 03c71eda docs(gap): the audit ledger: receipts for C25, C26 and C19 (builder B, merged at 76219a85 and cb2a7fd0)
- 98017a3c docs(gap): the audit ledger: the C53 receipt (21449b2a) with findings C53-1 (open, builder B) and C53-2 (fixed, reference set v2)
- 21449b2a feat(gap): C53 retrieval evaluated before prose (evaluation/retrieval-eval.ts, scripts/gap/retrieval-eval.ts, docs/gap/RETRIEVAL_EVAL.md): every reference case becomes sink adapters for the r
- cb2a7fd0 docs(gap): C26 the handler inventory (docs/gap/HANDLER_INVENTORY.md: every declared task kind, email command, signed link op and intelligence decision against the code that answers it; resear
- 76219a85 feat(gap): C25 competing work before another draft (context/assemble.ts competingWork): the existing drafts and in-flight work for the same identity, deal, thread and purpose are found and of
- f5e5161c docs(gap): the audit ledger: receipts for C47 (A), C21-C23 (B), C31-C33 (C); the third merge line, the reassignment of C51 and C44 to A, the C57 review in flight
- 0ba3e029 docs(gap): the audit ledger: the C46 receipt (eb373440)
- eb373440 feat(gap): C46 health covers contextual completeness (health/health.ts, health/load.ts): a ninth component, Commercial context, reads the identity tables (canonicalCompany, gapAccountAlias co
- 37ad37c5 feat(gap): C31 + C32 + C33 the briefing's counts, cards and greeting (work/briefing.ts, briefing-send.ts, plan.ts, list.ts): the headline names its count basis ("N to execute" is the plan's i
- 20ff7a5b feat(gap): C23 the kept angle is bound to its context revision (work/decide.ts queueAngle): the revision of what the Pursue carries (angle-claims.ts seedRevision: the placement, the CRM read,
- 46b092ff feat(gap): C21 C22 the angle reads the commercial-context packet and every claim is traceable (agents/angle-claims.ts, develop-angle.ts): the handler assembles the packet (seeded from what th
- caa53020 docs(gap): the audit ledger: Status receipts for the merged builder slices (A: C07, C08, C09, C10, C11, C12, C35; B: C14, C15, C16, C17, C18, C20; C: C27, C28, C36, C37, C38a, C38b, C38c, C39
- 15b2bbae test(gap): C52 the reference evaluation set (tests/unit/gap/fixtures/reference-set.ts, frozen by reference-set.lock): twelve de-identified cases grounded in the audit's shapes (the Kenco posi
- 3008563b feat(gap): C27 + C28 obligations by durable origin and honest return dates (work/list.ts, work/plan.ts): an obligation is one per origin (account, deal, person by address, persona or name, ki
- c06d5c1a feat(gap): C09/C10/C11 wired into the people ranker (work/intel.ts, briefing-send.ts): every inbound message's purpose from its subject and snippet (classifyPurpose, calendar mail typed apart
- 7853233b feat(gap): C47 ingestion idempotency across Gmail and HubSpot (replies/hubspot-poller.ts, replies/gap-mailbox.ts): the poller asks HubSpot for hs_email_message_id and, when the same RFC Messa
- 87151412 feat(gap): C49 honest activity-read coverage (work/activity.ts loadActivity, activity-view.tsx): the read pages the window by a (created_at, id) cursor (1,000 a page, 20 pages) and answers co
- d2889e6b feat(gap): C17 C18 C20 the commercial-context assembler (context/assemble.ts): the packet built from injected adapters (identity, the CRM read, builder A's timeline, the vault and Clawd throu
- bba88c3c test(gap): C50 test typed against GenerateTextResult (retryable on the provider error, usage cast)
- 0a3dc3f0 docs(gap): the commercial-context audit ledger: Status receipts for V1 (C01-C06, b21b8230), C13 (45a335bb), C29/C30/C34 (69909205), C50 (f9b149f9) and C45 (92a7b984) with their tests; X22 (th
- fca6151e feat(gap): C35 owed answers stay owed until resolved (work/recorded-replies.ts): loadAnswersOwed queries confirmed dispositions by status, a page at a time until the ledger is exhausted, with
- b0370d1d feat(gap): C36-C38c activity truth (work/activity.ts, activity-view.tsx): a draft or an approval PREPARES an outreach item (prepares, status prepared, "awaiting your send") and never complete
- 92a7b984 feat(gap): C45 one read-only deployment and configuration receipt (health/deployment-receipt.ts, scripts/gap/deployment-receipt.ts): local code, the deployed environment (the deployment the p
- e85e4bc3 feat(gap): C10 answer owed and quietness from both sides (work/people-state.ts, pure): per person lastInboundAt (a calendar RSVP and an automatic reply are not them writing), lastOutboundAt (
- a7a7d340 feat(gap): C14 C15 C16 account knowledge retrieval (context/retrieval.ts): the vault account note read section by section with its wiki-links followed one level into meeting notes, raw transc
- 793c9666 feat(gap): C12 durable, explainable classification overrides (context/classification-overrides.ts): a seller correction is one append-only conversation.classified row in the GAP audit ledger 
- d112df10 feat(gap): C09 C11 message purpose and commercial relationship judged apart (context/purpose.ts): classifyPurpose reads one message with the mailbox's reply vocabulary and says buyer_conversa
- f9b149f9 feat(gap): C50 every model path is metered without losing task truth (ai/spend.ts): a post-reservation re-read orders every open reservation (created_at, then callId) and the later of two rac
- 69909205 feat(gap): C29, C30, C34 the intelligence reader (work/intel.ts): a publication value stored at midnight UTC is a date, shown as that calendar day and never the prior New York day (isDateOnly
- d6871281 feat(gap): C39 the initial APPROVE is bound to the assigned revision (agents/approve-request.ts, execution/seller-draft.ts): every APPROVE loads the assignment row of THAT revision and takes 
- 38377c26 feat(gap): C07 C08 the bounded thread context (context/thread-context.ts): stored inbound rows plus an injected Sent and Drafts reader become typed TimelineEvents; the excerpt is the author's
- 45a335bb feat(gap): C13 the commercial-context packet contract (context/commercial-context.ts): identity, opportunity with coverage, a typed timeline (drafts and calendar apart), attributed claims wit
- b21b8230 feat(gap): V1 one Kenco relationship across email, CRM and Work (C01-C06): deal coverage (work/deal-coverage.ts: the day's in-deals read with its status and time, folded by every recorded nam
- 57ac9b32 docs(gap): the commercial context and execution audit addendum (October 8 New York, main a195467f): 62 correction and validation tickets C01-C60 in ten vertical slices V1-V10, the reconciliat
