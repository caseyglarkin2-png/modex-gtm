# GAP operator simplification (first-principles pass, 2026-09-25)
<!-- verified:2026-09-25 -->

STATUS: SHIPPED 2026-09-25 (PR in the GAP first-principles pass)

The foundation (hypotheses, evidence depth, routing, compiler, suppression,
execution ledger, multi-touch) stays. What changed is what Casey has to DO.
Classification: A human judgment, B safety control, C audit/truth state,
D implementation ceremony, E duplicate/legacy. Casey should see A and
meaningful B only. C is kept under the hood; D and E are removed from the
primary path.

## CURRENT CLICKS (account thesis with 5 people, signal to sent email)

| # | Click / transition | Why Casey does it | Class |
|---|---|---|---|
| 1 | /gap, tile "Hypotheses to review" -> /gap/hypotheses?status=draft | find work | D |
| 2 | Review account thesis | read the thesis | A |
| 3 | Find corroborating evidence, Attach | judge evidence | A |
| 4 | Approve selected siblings | agree with the thesis | A |
| 5 | Rows vanish from the `draft` filter; switch filter to `approved` | find what he just did | D |
| 6 | Open each row, "Use in routing" (x5) | draft/approved/active semantics | D |
| 7 | Back to /gap, Run routing | make GAP recommend | D (a system step Casey must remember) |
| 8 | Routing only routes the 2 most senior people per account, so most approved people get no card | none (a defect) | D |
| 9 | Find the card, Open action pack | navigate | D |
| 10 | Check copy (compile) | copy safety | B, but D when the compiler passes |
| 11 | If review: Approve this copy (inline, or /queue) | copy judgment | A (inline) / E (/queue) |
| 12 | Create Gmail draft | stage the email | D when he has already approved the copy |
| 13 | Open Gmail, send | send decision | A |
| 14 | Check if sent | execution truth | C (already passive in the inbox cron) |
| 15 | Record "emailed" on the card | human action | C (redundant with 13) |

About 15 steps, 5 page transitions, 5 extra per-row "use" clicks.

## PROPOSED CLICKS

| # | Click | Class |
|---|---|---|
| 1 | /gap REVIEW lane: account thesis card, Review thesis | A |
| 2 | (optional) Find more evidence, Attach | A |
| 3 | APPROVE + USE FOR 5 (submit, approve, activate per checked row, each audited) | A |
| 4 | ROUTE THESE 5 (same routing run, the thesis people are always routed) | A (one routing action) |
| 5 | READY lane: open a person | navigation (1) |
| 6 | SEND EMAIL, then CONFIRM + SEND (final copy, from casey@yardflow.ai) | A + B |

Thesis to sent: 1 thesis approval, 1 routing action, 2 clicks from an
actionable contact to a sent email. The human action `emailed` is recorded
by the confirmed send itself.

## WHAT WAS DELETED / HIDDEN

- Separate approve then activate (D): one APPROVE + USE click; APPROVE ONLY stays as a quieter option.
- Status-filter hunting after success (D): a success state names where the rows went and offers ROUTE THESE N.
- Top-2-by-seniority routing ignoring approved hypotheses (D, a defect): the primary person of every approved/active hypothesis at an account is routed in addition to the top 2.
- Copy the email, open Gmail, paste, send, come back, check if sent, record emailed (D): SEND EMAIL from the action pack with one confirmation; truth and human action recorded at the send.
- Visiting /queue to approve copy the compiler already passed (E): PASS goes straight to the send confirmation; REVIEW is approved inline on the action pack (existing resolver, audited); REJECT cannot send. /queue remains for non-GAP approvals.
- /gap led with tiles for internal counts (routing decisions, shadow status) (D): /gap is lanes of work: REVIEW, RESEARCH, READY, FOLLOW UP, REPLIES.
- The action pack led with rule ids, target, version, compile report (D): above the fold is account, person, why now, GAP recommends, email with Send and Save draft, call. The rest is under WHY GAP THINKS THIS and SYSTEM DETAILS.

## WHAT REMAINS UNDER THE HOOD (C, unchanged)

- The four hypothesis states and every transition event (each APPROVE + USE writes submit/approve/activate events with the batch reason and actor).
- Routing decisions, their runs and explain payloads.
- Compile rows and approval requests; the compiler still judges the exact copy.
- The wire gates in `sendViaGmail`: suppression (fail closed), daily cap (fail closed), canonical autonomy (see below).
- The execution ledger: a direct send writes a claim row before the Gmail call and a sent row with the Gmail message and thread ids after it; the multi-touch loop anchors on it.
- Draft mode (Save as Gmail draft) and its reconciliation.

## DIRECT SEND AND THE AUTONOMY HALT

clawd's `outreach` motion is halted (2026-08-19, reason: no automated sends,
Casey sends by hand). The wire gate refused every app send under it,
including a human one-to-one. A named send purpose `HUMAN_APPROVED_1TO1`
now passes the `outreach` motion halt only; a global halt and an unreadable
autonomy state still refuse it, and suppression and the daily cap apply
unchanged. Exactly one module may declare that purpose (the GAP seller send,
reachable only from an authenticated CONFIRM + SEND), pinned by a test that
scans the source tree. The halt itself is untouched.

## WHY

Casey's job is judgment (is this thesis true, is this the right person, is
this the email). Everything else is the system's job. Every hidden step is
still recorded, so auditability did not shrink; only navigation did.
