# GAP OS sales execution engine: the first integrated demonstration (X12)

STATUS: DONE 2026-10-08 on the scratch harness. Branch `feat/gap-execution-engine` at 2cb74376 (the demo fixes) over the X01 to X11 tickets. Provider boundary: SIMULATED. The transport sink (R05) stood in for Gmail on every send and draft, the stub on 4545 for HubSpot, clawd and the critic, and the seller's replies were built by `scripts/gap/execution-engine-demo.ts` exactly as the mailbox cron reads them and handed to the same code path (`replies/commands-apply.ts`). No prospect was mailed; no real mailbox was touched; the model call (Gemini, the revise step) was real.
<!-- verified:2026-10-08 -->

## The twelve steps (the mandate's section 17) and their receipts

| # | Step | What happened | Receipt |
|---|---|---|---|
| 1 | A useful daily plan from existing intelligence | `/api/cron/gap-routing` routed 6 accounts into 8 cards (1 ready); the briefing cron snapshotted the day: 4 items in Work's order (a Kroger obligation overdue, an Nfi reply, the Fedex first touch, a Walmart opt-out to record), 2 waiting, 6 parked | `work.day_planned` row by `cron:gap-briefing`; items keyed `commitment:…`, `reply:…`, `first_touch:cmuzt1w9u000n7kn420obfdy1`, `reply:…` |
| 2 | The briefing to an internal mailbox | One email to casey@example.com from the GAP identity, Reply-To the GAP mailbox, subject `GAP today, Thu Oct 8: 4 need you [GAP#…]`, the four items with signed links, the counts, the commands footer | sink `send` OPERATOR_ALERT; `briefing.sent` once; a second tick answered `already_sent` |
| 3 | START | The seller replied START to the briefing thread: `work.day_started`, then item 1 arrived as its own email | `work.command_applied` effect `assignment_sent` |
| 4 | A specific, evidence-backed action | Item 3 (NEXT twice): "Fedex Scratch Co r63: Glen Scratch (Managing Director, Surface Transportation)", why now, what we know with its basis, the move, the prepared email quoted line by line, the source line with its date and URL | sink `GAP 3 of 4 … [GAP#f0cf1bdc…0]`, X-GAP-Item header |
| 5 | A better recommendation by replying | `REVISE: This sounds too generic. Find a more specific operational reason for Glen to care, and keep it shorter.` → "Working on it" in the thread, one agent task queued | `work.command_applied` `revision_queued`; `agent.task_queued` |
| 6 | The agent does the work | The drain ran `revise_message`: the critique, the current copy and the thesis's one verified fact to the model; the candidate compiled against the same contract as a template (16 checks and the critic stub) | first pass: `review_required` (C15 Title Case subject, see findings); second pass: `pass`, 62 words |
| 7 | The revision returns | The assignment re-sent in the same thread at revision 1, then 2, with the proposed copy quoted and "Revised on your words: …"; revision 1 said the checker wants a look, revision 2 said reply APPROVE | sink `[GAP#f0cf1bdc…1]` and `…2]`; `execution.copy_revision_proposed` ×2 |
| 8 | APPROVE | On revision 1: refused in words (`revision_not_cleared`). On revision 2: the revision bound by its hash was approved and the draft created | `execution.copy_revision_approved` hash d5c3d504…; `work.command_applied` `gmail_drafted` |
| 9 | A real editable draft in a test mailbox | The draft to glen@…example.com, subject "Ohio terminal consolidation", through `createSellerGmailDraft` and every click-time gate, with the unsubscribe footer; the acknowledgment carried the Gmail drafts link and the CONFIRM + SEND link | sink `draft` PROSPECT_OUTREACH (simulated Gmail) |
| 10 | A permitted test send, confirmed | CONFIRM + SEND while the draft stood: refused `draft_outstanding` (never a double send). With the draft gone (harness: the bracket removed, as if deleted in Gmail and reconciled): preview bound hash d5c3d504… and the recipient; confirm sent ONE message as HUMAN_APPROVED_1TO1; a replayed confirm answered `alreadySent: true` and wrote nothing | sink `send` HUMAN_APPROVED_1TO1; `execution.gmail_direct_claimed` then `gmail_direct_sent` with the sink message id; one `email_logs` row |
| 11 | The state recorded correctly | Work's Today panel: "Done today (1): Fedex Scratch Co r63: Sent touch 1 to Glen Scratch." The revision chain, the approval, the refusals, the preview, the claim and the send are each their own ledger row | `loadCompletedToday` read; the ledger listing in the walk log |
| 12 | The next item surfaces | NEXT → item 4 (Walmart Scratch Co r63: Opted out, record it) as its own email | `work.command_applied` `assignment_sent` for `reply:corpus-msg-walmart-scratch-co-r63` |

The scratch database's 33 hand-SQL guards were proven live after the walk (`verify-triggers.ts`, rolled back).

## What the walk found and fixed (each its own commit, RED then GREEN)

1. **Approving a story left the stale Work summary in place** (626b4a17). The briefing and the assignment for a story approved minutes earlier still said "Put the story in use" with no email. The approve route now forgets the remembered pursuit summary after a successful transition (advance, activate, reject), as the outcome, send and answer routes do. `hypothesis-approve-forgets-summary.test.ts`.
2. **A ready card whose action is the account page named no routing decision** (bde214a3). The plan item fell back to the day key, so the assignment carried no email and REVISE and APPROVE had no card. The plan now reads the ready lane's decision id off the NEXT UP candidates; the briefing cron and /gap/start hand it along. `day-plan.test.ts` case.
3. **A refused approval consumed the command** (2cb74376). The uncleared revision's APPROVE was recorded as applied and blocked the APPROVE on the cleared one. An effect's refusal is now recorded refused and never consumes the command. `commands-apply.test.ts` case.
4. **The model wrote a Title Case subject** (d3de26ff), the one check the first revision tripped (C15, review). The revise prompt states the house subject form; pinned in `revise-message.test.ts`.
5. Earlier in the walk: a fresh message whose provider answers no thread id records its own message id as the thread (7992ae81), so a reply binds under the sink as under Gmail.

Harness-only resets during the walk (never product behavior): today's plan, briefing and assignment rows were removed on the SCRATCH database three times with the append-only trigger disabled and re-enabled (to re-plan after fixes 1 and 2 and after fix 3), and the Fedex draft bracket once (step 10). Each is labelled above. The 33 guards were proven live afterwards.

## The real-Gmail variant (Casey's go, 2026-10-08, after the merge)

The same walk with the REAL Gmail wire: the scratch database and the stub as before, no sink, the sender casey@freightroll.com (the local refresh token), every recipient one of Casey's own addresses. The persona on the Fedex card was re-addressed on the scratch database to `caseyglarkin2+glen@gmail.com` (the same inbox, an address GAP had never mailed: the first-touch gate `emailed_outside_gap` correctly refused the plain address because GAP had just mailed the briefing and the assignments to it).

| Step | Receipt (real Gmail ids) |
|---|---|
| The briefing to caseyglarkin2@gmail.com | Gmail message 1a11cc742641537e |
| START, NEXT, NEXT: three assignment emails in their own threads | 1a11cc5b4944c9fb, 1a11cc5c2e70bcc0, then the Fedex item carrying the prepared email |
| REVISE by reply, the agent (Gemini, the compiler, the critic stub), the revision back in the thread | compile `pass`, subject "Ohio consolidation" |
| APPROVE by reply: a REAL editable draft in the casey@freightroll.com mailbox | draft r5338182872211554541 to caseyglarkin2+glen@gmail.com, subject "Ohio consolidation" |
| CONFIRM + SEND while the draft stands | refused `draft_outstanding` |
| The draft bracket removed on the scratch database (the real draft stays in the mailbox; Casey can delete it) and CONFIRM + SEND | ONE real message, HUMAN_APPROVED_1TO1, from casey@freightroll.com to caseyglarkin2+glen@gmail.com, Gmail message 1a11cc94d7fc0926 |
| NEXT | item 4 as its own email |

Still not exercised for real: the mailbox cron's inbox listing (the replies were handed to the same `applyCommand` path by the driver with Gmail's Authentication-Results as it would arrive). Everything that reached Gmail did so through the production code path and every gate.

## What this does not prove

- Gmail itself: the sink is not Gmail. The real-Gmail variant (the GAP identity drafting and sending to Casey's own address) needs Casey's go, since it writes a draft to his real mailbox.
- The mailbox cron's inbox listing: the seller's replies were handed to the same `applyCommand` path by the driver, not read from an inbox.
- DMARC on real mail: the driver supplied Gmail's Authentication-Results as it would arrive; both of Casey's domains publish SPF including Google and a DMARC record (checked 2026-10-08).
- The step 10 path from a Gmail draft: a draft sent from Gmail is recorded by the existing draft reconcile (R43), not exercised here.
- Production: the new crons' flags stay OFF until Casey sets the seller settings and GAP_ACTION_SECRET in Vercel.

## How to run it again

`scratchpad/mandate/demo-lib.sh` (source it): `start_stub`, `start_server` (a production build of the branch), `cron /api/cron/gap-routing/`, `cron /api/cron/gap-briefing/`, `demo start|next|revise "<words>"|drain|approve|skip|done "<note>"|status`, `sink N [--full]`, `api POST /api/gap/decisions/<id>/send/ '{}'` then the confirm body, `stop_server`. Settings on the scratch database: `scripts/gap/set-seller-settings.ts --briefing-to casey@example.com --command-senders casey@example.com --mode review --hour 0 --apply`.
