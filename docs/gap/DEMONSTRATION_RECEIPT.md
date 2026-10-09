# GAP OS next-version demonstration receipt (C59)

STATUS: DEMONSTRATION RECEIPT, generated 2026-10-09T11:53:45.732Z by scripts/gap/demonstration-receipt.ts on feat/gap-execution-engine at fd4091bc. Local and sink-backed throughout: no production database, no mail credential, no model call, no send, no signed action token. Production is fd4091bc (dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU, READY); nothing in this program is deployed. Regenerate rather than edit.
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
GAP today, Fri Oct 9: 17 to execute, 9 to decide [GAP#replay]
Good morning. Here is Fri Oct 9 from GAP, in order.
17 to execute: the plan's items, the same list START and NEXT walk, in this order. 9 to decide: intelligence, counted apart (11 waiting in all).

Intelligence worth a look (5 of 7). Any age, for your call; Pursue and GAP develops the angle.
- Bevera Holdings: Bevera and Autoroute expand autonomous middle-mile trucking to Texas. freightnews.example, published Oct 4, 2026. Unverified present-day status. Also reported by supplychainwire.example, newswire.example.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Kestrel Logistics: Kestrel opens an innovation lab for warehouse automation testing. freightnews.example, published Jun 24, 2026. Historical observation.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Prairie Foods: Prairie Foods opens a 600,000 square foot distribution center in Iowa. prairiefoods.example, published May 10, 2018. Historical observation.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Bevera Holdings: BEV 10-Q filed. EDGAR, published Oct 4, 2026. Unverified present-day status.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Tractor Depot: Tractor Depot opens an Idaho distribution center with automation. chainstoreage.example, published Oct 8, 2026. Unverified present-day status. Tractor Depot is not a GAP account yet. Themes: network capex.
   Decide it on Work: https://modex-gtm.vercel.app/gap/

Prospects to reengage (4). They wrote to us and went quiet.
- Kestrel Logistics: Chris Ortiz, Director, Distribution at Kestrel Logistics. Wrote to us Sep 3, 2026 (1 message), last about "Re: the Chattanooga yards"; their account is in an open deal (YardFlow - Kestrel, presentationscheduled): work it from the deal. Previously contacted, a response. No exchange either way in 33 days (last: Sep 6, we wrote).
   In a deal at Kestrel Logistics: YardFlow - Kestrel (presentationscheduled). Next step: Roadmap sync Oct 14, then the two-site pilot scope. Work it from the deal: https://modex-gtm.vercel.app/gap/accounts/kestrel-logistics/?view=brief
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Kestrel Logistics: Kim Lee at Kestrel Logistics. Wrote to us Aug 30, 2026 (1 message), last about "Re: dock scheduling"; their account is in an open deal (YardFlow - Kestrel, presentationscheduled): work it from the deal; not a GAP contact yet. Previously contacted, a response. An answer is owed since Aug 30, 2026: they wrote Aug 30; nothing sent since.
   In a deal at Kestrel Logistics: YardFlow - Kestrel (presentationscheduled). Next step: Roadmap sync Oct 14, then the two-site pilot scope. Work it from the deal: https://modex-gtm.vercel.app/gap/accounts/kestrel-logistics/?view=brief
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- unknownco.example: Pat (unknownco.example). Wrote to us Aug 25, 2026 (1 message), last about "hello"; open deal unknown: the person is not placed at an account; not a GAP contact yet. Previously contacted, a response. No exchange either way in 45 days (last: Aug 25, they wrote). Review before outreach: purpose unknown: review before any outreach.
   Decide it on Work: https://modex-gtm.vercel.app/gap/
- Glacier Spirits: Phil Sava, VP Operations at Glacier Spirits. Wrote to us Jun 21, 2026 (1 message), last about "Re: yards"; no open deal found (HubSpot read Oct 9, 7:10 AM New York). Previously contacted, a response. An answer is owed since Jun 21, 2026: they wrote Jun 21; nothing sent since.
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

Sent by GAP at 7:15 AM New York. This is an internal message to you; nothing in it went to a buyer.
```

HTML rendering: 7699 chars, the same sections (not reproduced).

## 2. Source manifest and dispositions (the replay, C56)

### Source manifest

- planItems: 17
- signals: 4
- triggers: 1
- people: 4
- packetClaims: 3
- timelineEvents: 4
- drafts: 1
- sent: 0

### Dispositions, C01 to C44 (no silent exception)

| Ticket | Disposition | Evidence |
|---|---|---|
| C01 | demonstrated | Chris at Kestrel: "Wrote to us Sep 3, 2026 (1 message), last about "Re: the Chattanooga yards"; their account is in an open deal (YardFlow - Kestrel, presentationscheduled): work " |
| C02 | demonstrated | Chris placed via persona; Kim (no persona) placed at Kestrel Logistics via domain |
| C03 | demonstrated | the alias "kestrel" on the in-deals read found the deal; opportunity open |
| C04 | demonstrated | no "no live opportunity" anywhere; the unplaced writer's line says "open deal unknown: the person is not placed at an account" (C57 F1: no identity, no negative) |
| C05 | demonstrated | the Pursue carries inboundMessageId m-chris-sep2, the date and a 203-char excerpt |
| C06 | demonstrated | the angle is deal work scoped to 62700000001 (1 succeeded, 0 failed) |
| C07 | demonstrated | loadThreadContext: 4 typed events; Chris's excerpt is his own text with the quoted history cut (quotedBelow true); gmail coverage complete |
| C08 | demonstrated | the draft is typed draft and the invitation calendar; neither counts as contact: last outbound stays 2026-09-06 (Sep 5) with a draft on record; both renderer paths produced (7699 chars of HTML, 6529 of text) |
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
| C21 | demonstrated | the angle carries context revision 0fbfcbc1e4eab9b0 |
| C22 | demonstrated | support entries: 6 |
| C23 | demonstrated | a second Pursue with the same context: angle_kept |
| C24 | demonstrated | lane reply, 1 Gmail draft in the sink, 0 sent |
| C25 | demonstrated | a second acceptance is refused with the competing draft (1 existing draft for this person and deal: reuse or revise before a new one is written.); reuse returns it, lane existing; still one draft |
| C26 | documented | docs/gap/HANDLER_INVENTORY.md (builder B, cb2a7fd0) |
| C27 | demonstrated | the reminder folds into the follow-up of the same origin: one obligation item at Southern Spirits and one at Swire Water, no Reminder item (17 items) |
| C28 | covered_by_test | pinned by stream-c-c27-c28-obligations.test.ts (9) (not re-run in the replay) |
| C29 | demonstrated | the date-only filing says "published Oct 4, 2026" |
| C30 | demonstrated | one item for three reports: "Also reported by supplychainwire" |
| C31 | demonstrated | the headline says its count basis: "17 to execute: the plan's items, the same list START and NEXT walk, in this order. 9 to decide: intelligence, counted apart (11 waiting in a" |
| C32 | demonstrated | the Kestrel intelligence item names the deal and its stage in the briefing |
| C33 | demonstrated | greeting for the New York hour of 2026-10-09T11:15:23.654Z: "Good morning. Here is Fri Oct 9 from GAP, in order." |
| C34 | demonstrated | selection: "people who wrote in the last 180 days (up to 2000 messages read); our Sent read for the 5 who would be listed; showing 4 of 4 from 1" |
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
| C55 | demonstrated | the wedge carries supersededBy rejected:hypothesis:h-rej and stays visible: "ostings). [rejected Sep 20, 2026: hypothesis:h-rej, disposition:d-rej]"; not externally usable; no buyer line touched |

Demonstrated 34, covered by a focused test 11, documented 2, exceptions 0.

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
| tests/unit/gap/lead-c57-pass2.test.ts | 2 |
| tests/unit/gap/lead-intel-c29-c34.test.ts | 3 |
| tests/unit/gap/stream-a-answers-owed.test.ts | 3 |
| tests/unit/gap/stream-a-c44-action-result.test.ts | 5 |
| tests/unit/gap/stream-a-c44-actions.test.tsx | 6 |
| tests/unit/gap/stream-a-c51-stage-authority.test.ts | 5 |
| tests/unit/gap/stream-a-execution-gate.test.tsx | 6 |
| tests/unit/gap/stream-a-ingest-idempotency.test.ts | 6 |
| tests/unit/gap/stream-a-overrides.test.ts | 2 |
| tests/unit/gap/stream-a-people-state.test.ts | 5 |
| tests/unit/gap/stream-a-purpose.test.ts | 7 |
| tests/unit/gap/stream-a-thread-context.test.ts | 7 |
| tests/unit/gap/stream-b-angle-promote.test.tsx | 4 |
| tests/unit/gap/stream-b-assemble.test.ts | 9 |
| tests/unit/gap/stream-b-competing-work.test.ts | 2 |
| tests/unit/gap/stream-b-index-lifecycle.test.ts | 4 |
| tests/unit/gap/stream-b-promote-angle.test.ts | 4 |
| tests/unit/gap/stream-b-promote-route.test.ts | 3 |
| tests/unit/gap/stream-b-retrieval.test.ts | 7 |
| tests/unit/gap/stream-c-activity-truth.test.ts | 10 |
| tests/unit/gap/stream-c-c27-c28-obligations.test.ts | 9 |
| tests/unit/gap/stream-c-c31-c33-briefing.test.ts | 10 |
| tests/unit/gap/stream-c-c39-approve-binding.test.ts | 13 |
| tests/unit/gap/stream-c-c40-c42-execution.test.ts | 5 |
| tests/unit/gap/stream-c-c43-c44-commands.test.ts | 7 |
| tests/unit/gap/stream-c-c49-activity-coverage.test.ts | 5 |
| tests/unit/gap/v1-kenco.test.ts | 6 |
| total | 189 |

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
| missing_source_said | 24 | 0 |

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
| missing_source_said | 36 | 0 |

## 6. Reviewer findings (C57)

# C57 independent review: findings and dispositions

STATUS: ACTIVE (a standing gate). Pass 1 reviewed the first three merges (lead branch at 9edf2edd) in the read-only worktree `wt-gap-review`; pass 2 reviews the final integrated tree (a97d7480 and after) in `wt-gap-review-2`. Reviewers never edit; every edit is made by the owning writer (the lead or the owning builder) and verified by that writer. Each finding carries one disposition: FIXED (commit), ROUTED (owner, in progress), ACCEPTED (left as is, with the reason) or DEFERRED (named debt, owner, reason).
<!-- verified:2026-10-09 -->

## Pass 1 (at 9edf2edd): 9 P1, 8 P2

| # | Sev | Ticket | Finding (file) | Disposition |
|---|---|---|---|---|
| 1 | P1 | C04 | `work/deal-coverage.ts` dealsAt answered `inDeal: false` for a person with no account name, so an unplaced writer under a complete read read "no open deal found". REPRODUCED. | FIXED (lead): no name is `inDeal: null, why: 'unplaced'`; the words say "open deal unknown: the person is not placed at an account"; the replay's C04 evidence now asserts it. |
| 2 | P1 | C09/C11 | `context/purpose.ts` orders the vendor branch before the buyer branch and VENDOR matches "open to a quick call", so a buyer's "open to a quick call next week to talk through the pilot at our two yards" is a vendor pitch and dropped silently. REPRODUCED. | FIXED by builder A, cbbfc523 then corrected at 34ce68f5 and f7e9ace3 (the first rule let the noun "yard" in a pitch addressed to us count as buyer vocabulary and turned the frozen reference vendor case into a buyer; the lead's suites caught it on the merged tree): a pitch that addresses us as a vendor or offers services is vendor_solicitation whatever operational nouns it holds; buyer vocabulary wins only when first-person operational (our yards, our pilot) or in a reply to a thread we started; the reference pitch is pinned verbatim as vendor (stream-a-purpose 7). |
| 3 | P1 | C10 vs C35 | `work/intel.ts` dropped every owed writer as "C35's list", but `loadAnswersOwed` reads human-confirmed dispositions only: an unanswered writer with no disposition vanished from both. | FIXED (lead): an owed writer stays listed with "An answer is owed since <date>: <basis>" and `state.answerOwedSince`; the wiring test pins it. |
| 4 | P1 | C15/C46 | `context/retrieval.ts` takes a date in a section heading ("## Live signals (clawd, 2026-10-08)") as the claims' observedAt and the vault watermark, so a rebuilt-but-old wedge reads fresh through the vault path. REPRODUCED. | ROUTED to builder B: a sync-section heading date is indexedAt only; the watermark comes from dated non-internal claims. |
| 5 | P1 | C13/C15 | `validateClaims` refused refresh-as-observation only with eventAt null; retrieval copies observedAt into eventAt, which bypassed it; observedAt with indexedAt null also passes. REPRODUCED. | ACCEPTED with the reason, after a tried fix was reverted: refusing equality when eventAt equals observedAt refused legitimate claims (a note or a Clawd wedge dated the day it was synced reads observedAt = indexedAt = eventAt and is true), and the two stream-b retrieval suites went red on the merged tree; the validator cannot tell a same-day observation from a copied refresh time, and a claim with indexedAt null cannot be judged by it at all. The real bypass is the heading-date source in retrieval, closed by B's F4 fix; the guard keeps refusing an undated claim stamped with its refresh time. |
| 6 | P1 | C02/C05 | `work/decide.ts` loaded the newest inbound row without including the thread relation, so the thread-alias placement on Pursue never ran in production (the fixture embeds the relation). | FIXED (lead): `include: { thread: { select: { account_name: true } } }`. |
| 7 | P1 | C03/C04 | `work/cockpit-read.ts` and `app/gap/page.tsx` dropped `alsoRecordedAs`, so the Work page could say "no open deal found" where the briefing says "in an open deal". | FIXED (lead): the aliases ride through the cockpit projection, the Work input type and the page. |
| 8 | P1 | C12 | `loadOverrides`/`applyOverrides` had no consumer: the correction ledger was write-only. | FIXED (lead): `loadIntelligence` loads the overrides for every typed message and thread id, applies the message or thread purpose before the verdict and the thread relationship into it; the machine purpose is kept beside. |
| 9 | P1 | C07/C21 | `loadThreadContext` had no production caller for the angle; the handler ran developAngle with no timeline, CRM or identity adapter, so the angle never saw our own sends, the drafts or the accepted meeting. | ROUTED to builder B: develop-angle defaults the timeline adapter to loadThreadContext with the GAP sender's Sent reader (read-only) and the identity service; injection kept for tests. |
| 10 | P2 | C17/C18 | The Pursue seed carried purpose null, which the assembler treats as the buyer's; a Pursue on a vendor sender put the pitch under "what the buyer said". | FIXED (lead side): the decide task input carries the message purpose from classifyPurpose; ROUTED to builder B: packetSeedFromInput reads it onto the seeded event. |
| 11 | P2 | C22 | `agents/angle-claims.ts` BUYER_SUBJECT hard-codes dave|craig: "Bryan confirmed the budget" with no support passes as fact. REPRODUCED. | ROUTED to builder B: the subject list is built from the packet's people. |
| 12 | P2 | C10 | The Sent read covers the first page plus five; a shown person beyond the buffer had no state and no sentence while the selection said Sent was read. | FIXED (lead): a shown person without a state says "Our Sent was not read for them, so a reply of ours may exist". |
| 13 | P2 | C04/C01 | `dealCoverageFrom` ignored `summary.unresolved`: an open deal at a HubSpot company GAP could not map was invisible, so a same-named account read "no open deal found". | FIXED (lead): unresolved company names fold into `unmappedNames`; `dealsAt` answers `inDeal: null, why: 'unmapped'` with the words "an open deal exists at a HubSpot company of this name that GAP has not mapped to an account". |
| 14 | P2 | C46 | A failed context probe answered HEALTHY "not read"; a reachable source with no dated knowledge could be "complete and fresh". | FIXED (lead; refined on the gate): a probe that threw is DEGRADED with its reason (the loader hands `{ failed }` instead of swallowing the throw); a probe that was not run stays "not read" and claims nothing (the first fix degraded every older fixture); no dated knowledge is partial. |
| 15 | P2 | C39 | approve-request and seller-draft skip the recipient check when the snapshot carries no recipient, and the assignment row records no senderIdentity. | FIXED by builder C, 82c1e489: an APPROVE whose snapshot carries no recipient is refused in words before any preflight or draft (assignment_no_recipient); seller-draft refuses a pinned snapshot with no recipient; the assignment row records senderIdentity and the sender check compares against it (c39 +3, assignment.test pins senderIdentity; mutation red then restored). |
| 16 | P2 | C47 | The poller joins hs_email_message_id to the stored RFC id with no normalization. Unconfirmed. | FIXED by builder A, 2ba738e2: normalizeRfcId, rfcVariants and rfcWhere in thread-context.ts; the poller, storeInbound and the check-inbox cron look the Message-ID up over the spellings, insensitive; the rfc provenance id is keyed on the normalized form (stream-a-ingest-idempotency 6). |
| 17 | P2 | ledger | Status lines lagged the code at 9edf2edd (C21-C23, C31-C33, C47). | FIXED: every merged ticket carries its receipt; the C58 reconciliation keeps code, tests, deployed and accepted apart. |

Verified as sound by the reviewer (unchanged): coverage status mapping; resolvePersonAccount; C06 scoping; C23 revision; C13 externallyUsable, byAuthority, fingerprint, emptyPacket; C17 deal existence from the CRM only; C16 Clawd versions; C14 bounds and classes; C08 mail types and provenance merge; C35 paging; C36-C38c projection; C49 paging and dedup; C39 revision-0 binding and the recheck before the adapter; C45 redaction; C50 race guard; no retrieved text reaches a tool; no credential printing.

## Builder interface requests (from the final reports)

| From | Request | Disposition |
|---|---|---|
| A | `audit.ts` GapAuditKind gains conversation.classified, execution.reply_resolved, inbound.provenance_linked | FIXED (lead). |
| A | check-inbox cron dedups by RFC but records no provenance link | FIXED by builder A, 2ba738e2 (linkProvenance on the second-copy path). |
| A | no Gmail drafts-by-recipient reader; loadThreadContext.listDrafts unwired | FIXED by builder A, 7dabebff: `listDraftsTo(sender, recipient)` in gmail-inbox.ts (read-only, newest 25, the To header checked, [] under the sink transport, throws on a read failure so a caller reports partial); the wiring is P2-1 (builder B the route, builder C the reply service). |
| A, B | `TimelineEvent.threadId` on the contract | FIXED (lead, optional field). |
| A | no route or UI calls recordOverride / resolveAnswerOwed | DEFERRED (owner: the next seller-evidence ticket): the override is now applied by the intelligence reader; the seller control to record one is a UI ticket Casey raises when a wrong classification costs a day. |
| B | memory `project_gap_execution_engine.md` said X19 open | FIXED at the memory file and its index line. |
| B | developAngle default timeline wiring | ROUTED to builder B (= finding 9). |
| C | unknown-send reconciler drops the body hash (C41 residual) | FIXED by builder C, 82c1e489: the reconciled DIRECT_SENT carries contentHash, senderIdentity, reviewedSubject and the thread from the newest preview row (c40-c42 5, unknown-send-reconcile 7; mutation red then restored). |
| C | decide, start and item pages execute on a bare GET | FIXED by builder A, 5b41a12b: /gap/decide and /gap/start render a one-click confirm form on a bare GET and execute only on the confirmed step executionAllowed names (the start page used to start the day and send the assignment on any GET, a prefetch included; the link now carries prefetch false); /gap/item routes tokens to those pages and never executes (stream-a-execution-gate 6). |
| C | assignment row records no senderIdentity | ROUTED to builder C (= finding 15). |
| C | commitmentPhase still says "Back today" on the account page for a passed snooze | DEFERRED (named debt, owner C's next slice): list.ts overrides it on Work; the account page keeps the old words. |
| C | DRAFT_SENT carries no sent-body hash; day-load says only "sent from Gmail by hand" | ACCEPTED: the activity line says the copy as sent was not checked (C40), which is the truth of a by-hand send. |
| C | nothing writes deal.stage_changed or meeting.booked yet | DEFERRED (named debt, owner engineering): deal.stage_changed needs two CRM reads of one deal (C51's only shape) and GAP has no scheduled re-read; meeting.booked needs the calendar proof row. |
| C | the live Clawd read (2026-10-09T03:47Z): the autopush and reply-scan jobs are enabled and running at prod sha 5ad1734, dry run off | ROUTED to builder A to add to `docs/gap/CRM_STAGE_AUTHORITY.md` as the enablement column's live read; OWNER ITEM for Casey (unchanged). |

## Pass 2 (at a97d7480, the final integrated tree before the pass-1 fixes): 5 P1, 3 P2

| # | Sev | Ticket | Finding (file) | Disposition |
|---|---|---|---|---|
| P2-1 | P1 | C25 | `agents/promote-angle.ts` reads competing work with no Drafts reader (the route passes no deps; `thread-context.ts` reads Drafts only through an injected `listDrafts`, and no production caller wires one; `seller-reply.ts` checks only GAP's own REPLY_DRAFTED row): Casey's hand-written Gmail drafts to a person are invisible and a promotion writes a third beside them; the replay demonstrated C25 only against GAP's own first draft. | FIXED across four writers: the reader (A, 7dabebff: `listDraftsTo`, read-only, newest 25, the To header checked, [] under the sink transport, throws on a read failure); the service half (B, f4bf2d66: hand drafts read through deps.thread.listDrafts refuse with competing_seller_edit; competingWork normalises provider-prefixed ids); the reply service (C, 276d954d: the outstanding-draft check reads the mailbox's own drafts before the claim; a hand draft in the thread refuses in words, a throw refuses as unknown) and the first-touch sender (C, 997cee66: the same read after the C39 snapshot recheck and before the claim); the route (lead, 4a90a0fa: `mailboxThreadDeps` wires Sent and Drafts from the configured GAP sender, none when no sender, and a drafts read that fails refuses the promotion as drafts_unreadable instead of reading as no draft). |
| P2-2 | P1 | C06 | `work/decide.ts` skipped the HubSpot contact lookup whenever the persona row carried an account, so every open deal at the account rode the task and both next steps reached the model; the quality harness masked it by pre-scoping from the fixture; `work/briefing.ts` prints deals[0] for the person. | FIXED (lead, af8b9f2b): the persona's contact id is matched against each deal's contact ids first (no network), then the contact lookup runs only when more than one deal remains and a reader was supplied; `lead-c57-pass2.test.ts` pins the Dallas-only task and the unsettled scope without a reader. FIXED by builder C for the briefing line, 413ed9ff: more than one deal and no settled scope renders "N open deals at <account>; the person's deal is not settled" with the deal-brief link and names no deal; one deal unchanged (stream-c-c31-c33-briefing 10). |
| P2-3 | P1 | C22 | `agents/angle-claims.ts`: a sentence the model labels `inference` skips the buyer-attribution, invented-system and invented-pain checks; "Alex told us they are replacing Open Dock with Kaleris next year" labelled inference with an empty record passes, and a starter so labelled becomes the Gmail reply body; the mocked generator labelled everything inference so no harness exercised the fact path. | FIXED by builder B, 052c901e: a buyer verb with a packet person or a pronoun as subject is refused unsupported_buyer_claim whatever the label unless a buyer line that person spoke backs it; a system the whole record does not name is refused invented_system whatever the label (a record line naming it becomes the sentence's support); only the pain check honours inference; a statement starter is checked as one (develop-angle 8; the mocked harness green at refused 0 of 36). |
| P2-4 | P1 | C04 | An unplaced writer told "no open deal found" (= pass-1 F1). | FIXED (lead, 27fbfa47) before this pass's tree; the replay's C04 evidence asserts the unknown words. |
| P2-5 | P1 | C07/C17/C18/C21 | The production angle handler composed no timeline, CRM or identity adapter (the packet was the seed), and the seed carried the Pursue message with purpose null, which the assembler treats as the buyer's external words: a calendar RSVP or an auto-reply could be rendered as "What the buyer said"; our Sent, drafts and calendar never reached the packet. | FIXED: the lead put the C09 purpose on the Pursue task input (27fbfa47) and builder B wired the handler's default timeline (loadThreadContext with the GAP mailbox's Sent, read-only; 093aefcd), the identity gap-fill adapter (093aefcd) and the seed purpose (23e6dafb); the Drafts side follows P2-1. |
| P2-6 | P1 | C52-C54, C56 | The evaluators could pass while the real path was wrong: (a) `missingSource.expectedWords` asserted nowhere; (b) the mock echoed `mustSay` and labelled everything inference, so known_answer and supported_claims were tautologies; (c) the retrieval sink hand-built the timeline, purposes and draft typing from the fixture's expected values; (d) replay rows C02, C07, C08 were not demonstrations of the code they named. | FIXED (lead): (b) the mock derives its angle from the record block alone and cites facts with labels; the scorer requires a cited fact where the record offers one; the reference set is v3 (angle words apart from line words); (a) the missing-source variant is judged by `missing_source_said` (a source kind that could not be read at all must be named in the gaps or the caveat; the same class over the retrieval coverage), with `expectedWords` kept as the line-surface statement of the same truth (ACCEPTED: it is documentation for the intel line, which the intel suites assert); (c) the retrieval evaluation builds the timeline through `buildTimeline` and classifies purpose through `classifyPurpose` (identity stays the fixture's: retrieval is measured given an identity; instruction_safety stays as the structural record that the assembler can call only the adapters it is handed); (d) C02 now demonstrates a no-persona writer placed by the verified domain, C07/C08 run `loadThreadContext` over the sink ledger with Sent, Drafts and a calendar invitation and check the draft and calendar never count as contact in `peopleState`. The reworked harness immediately surfaced P2-9. |
| P2-7 | P2 | C55 | `learning/outcome-loop.ts` guardFacts and outcomeLoop had no consumer; a wedge restating a rejected hypothesis still entered the record block. | ROUTED to builder B: the assembler takes a `rejected` adapter and runs guardFacts; the record block carries the rejection marker; the lead adds the replay assertion after. |
| P2-8 | P2 | C24 | `components/gap/angle-promote.tsx` disables email when the model offered nobody and always posts people[0], so a person item cannot reach the reply lane and another persona chosen falls into the thesis lane with "Nobody wrote in". | ROUTED to builder B: a `writer` prop (the lead passes it from the pursued item) keeps the email enabled with the writer as the default recipient and posts personaId null; another persona chosen on a person item is refused naming the writer. |
| P2-9 | P2 | C21 | Found by the reworked harness: `packetRecord` never carries the next accepted meeting (nor an unsent draft of ours), so with the CRM unread an angle cannot say a meeting is ahead and may propose a cold re-open. | ROUTED to builder B (one record line after the last exchange); pinned in `lead-c54-quality-eval.test.ts` until it lands. |

Pass-2 sound list (unchanged): seller-send binding at confirm; copies-reconcile by-hand route; the sequence adapter's lost-answer contract; commands-apply authenticity and idempotency; action-token and action-result; activity truth and paging; stage authority; the C47 link; C46 watermark rules; the briefing's count basis and clipping; routing's citation; competingWork determinism; the promote route's 409; the replay regenerates clean and the review worktree stayed untouched.

## 7. Residuals

- The C58 reconciliation in docs/GAP_PROSPECTING_OS.md lists every family and owner decision with code, tests, deployed and accepted apart, and the debt left as debt.
- Open for Casey: the merge and deploy of this branch; the production seller reply; the C54 live run; the PepsiCo thesis; the 5% wording; transcription spend; the Clawd autopush enablement.

## 8. Rollback plan

- RELEASED: this program is in production at fd4091bc (deployment dpl_91j7Tf4qZPjJqqbBo7AMWCX6eVNU, state READY, read from docs/gap/DEPLOYMENT_RECEIPT.md); the local HEAD fd4091bc is contained in it.
- To roll back: the previous production deployment is named in docs/gap/STABLE_BASELINE.md (the rollback pointer) and under "Other recent production deployments" in docs/gap/DEPLOYMENT_RECEIPT.md; promote it on Vercel; no schema change in this program, so no migration to reverse; the flags are unchanged by this program.

## 9. Commits since the deployed commit fd4091bc (none when production is this tree)

