# GAP OS, Prospecting-First Optimization (Casey's mandate, 2026-10-08)

STATUS: ACTIVE. Casey's second product mandate of the day, verbatim below; it follows the first production briefing (18 items, delivered 2026-10-08 20:59Z). The findings, the backlog and the receipts live in the "GAP OS PROSPECTING FIRST" subsection of the SALES EXECUTION ENGINE section of `docs/GAP_PROSPECTING_OS.md`. The earlier mandate is `EXECUTION_ENGINE_MANDATE_2026-10-08.md`.

<!-- verified:2026-10-08 -->

---

# GAP OS — Prospecting-First Optimization
## Correct the daily briefing before broader seller testing

We have our first real product feedback from Casey.

The October 8 production briefing was delivered successfully, containing 18 items. However, it is too heavily weighted toward existing deals.

**This is a product-prioritization problem, not a request to remove deal functionality.**

Casey is already closely managing active deals. GAP OS should primarily accelerate his ability to generate NEW commercial conversations for YardFlow.

That includes:

- Never-contacted target accounts
- Previously contacted accounts with no active opportunity
- Dormant prospects worth reengaging
- Contacts at previously engaged accounts who represent a better entry point
- Warm introductions that have not converted into conversations
- Relevant follow-ups with prospects
- Accounts showing credible new operational or buying signals

Existing deals remain important but should generally be summarized rather than dominating the daily action queue.

## 1. Start with the actual production briefing

Inspect the 18 items generated for October 8.

Determine:

- How many are associated with active deals?
- How many represent true new-conversation opportunities?
- How many are prospect follow-ups?
- How many are administrative activities?
- How many lack a specific eligible contact?
- How many include a prepared, actionable outreach angle?
- How many are carried-over obligations?

Trace those results through:

- `src/lib/gap/work/list.ts`
- `src/lib/gap/work/plan.ts`
- `src/lib/gap/work/briefing.ts`
- Relevant priority, routing, contact-selection, and eligibility services

Do not assume the problem is confined to sorting.

Investigate whether prospecting candidates are missing upstream, incorrectly classified, blocked, insufficiently researched, or simply losing to deal tasks.

Use actual production evidence and report the findings concisely.

## 2. Correct the product objective

The primary daily objective is:

**Help Casey initiate and advance qualified conversations with relevant enterprise buyers who do not already have an active opportunity being worked.**

Aim for roughly:

- 75% new-conversation generation
- 15% active prospect engagement and early follow-up
- 10% active-deal awareness and meaningful interventions

These are default attention targets, not quotas.

Honor truly urgent buyer commitments and significant deal events.

Do not artificially fill the queue with weak prospecting suggestions simply to achieve the percentages.

If eligible, well-prepared prospecting candidates are insufficient, make that shortage visible and trigger appropriate research or preparation.

Do not silently substitute deal housekeeping for missing prospecting opportunities.

## 3. Improve prospect discovery and reengagement

GAP OS should search the existing account universe and engagement history for valuable, executable opportunities.

Differentiate:

1. Never contacted.
2. Previously contacted, no response.
3. Previously contacted, response received, no opportunity.
4. Dormant conversation worth reopening.
5. New buyer at an existing account.
6. Warm introduction available.
7. Prospect follow-up due.
8. Active deal requiring intervention.

Use engagement history, relevant signals, role fit, account context, existing relationships, previous messaging, and eligibility to determine the next appropriate action.

Do not assume that previously contacted accounts are exhausted.

Do not recommend repeating the same failed message without a new rationale.

Do not invent urgency or evidence.

An open deal should not automatically suppress all prospecting at the entire corporate account if a genuinely separate buying initiative or appropriate division exists. Preserve the necessary contact, opportunity, and account restrictions.

## 4. Make the briefing actionable

A prospecting recommendation should ideally contain:

- Account
- Specific person and role
- Why that buyer
- Why the account deserves attention now
- What we know
- What GAP OS recommends saying or asking
- Prior engagement context
- Proposed email or call action
- Clear execution option

Do not fill the briefing with generic "research this account" work if agents can perform that research.

Let agents prepare behind the scenes.

Casey should receive high-quality selling opportunities, not an assignment to do the research himself.

When intelligence is insufficient, create the preparation task rather than presenting speculative outreach as ready.

## 5. Preserve deal awareness without letting it dominate

Keep active deals visible in a compact section.

Surface deal items prominently only when they involve:

- An unanswered buyer communication requiring action
- A real commitment coming due
- A consequential blocker
- A newly changed commercial situation
- A material opportunity to advance the deal

Routine deal monitoring belongs in the deal workspace or a secondary briefing section.

Do not remove existing deal capabilities.

Do not accidentally break deal restrictions or active opportunity workflows.

## 6. Verify email interactions before asking Casey to rely on them

The logs show the first production briefing was delivered.

They do not yet prove that a real incoming START reply was processed successfully.

Complete one controlled end-to-end verification:

1. Reply START from an authorized Casey email address or use an approved safe equivalent.
2. Verify Gmail inbound detection.
3. Verify sender authentication.
4. Verify correct daily-plan correlation.
5. Verify the first assignment is delivered.
6. Verify that duplicate START commands cannot create duplicate assignments.
7. Verify errors are visible and recoverable.

Do not send external prospecting messages as part of this test.

After verifying START, test a representative REVISE and APPROVE flow using an internal test recipient.

Do not mistake simulated provider behavior for proven production integration.

## 7. Implementation instructions

Make the smallest coherent changes that solve the actual problem.

Break implementation into atomic tasks covering only the deficiencies discovered:

- Candidate availability
- Classification
- Eligibility
- Prioritization
- Briefing composition
- Assignment sequencing
- Any necessary preparation workflow
- Actual inbound-command defects, if found

Each task must have a focused regression test or equivalent behavioral validation.

Avoid full-suite testing, oversized matrices, prolonged audits, or resource-heavy local execution.

Demonstrate the resulting seller experience.

Use one independent review subagent to challenge whether the revised plan actually delivers more qualified prospecting work and whether it introduces new failures.

Incorporate justified suggestions.

Update the SALES EXECUTION ENGINE section of `docs/GAP_PROSPECTING_OS.md`, preserve the historical ledger, and update `CLAUDE.md` if the product priority is not already explicit.

Commit and ship the tested improvements through the existing release workflow.

## 8. Final acceptance criteria

Show Casey a real or safely reproduced daily plan that:

- Prioritizes prospecting and new conversations.
- Clearly distinguishes prospecting from active-deal management.
- Includes actionable contact-specific recommendations.
- Uses prior engagement history intelligently.
- Keeps important existing-deal obligations visible.
- Does not manufacture filler to meet quotas.
- Allows the user to begin working through the recommendations.
- Correctly processes email commands.
- Preserves actual activity and authorization state.

Provide a before/after breakdown of the October 8 candidate mix and explain what changed.

Do not simply reorder the 18 existing items without determining whether the right prospecting candidates were available.

Do not resend the original briefing or retire the legacy pipeline digest without an appropriate decision.

**Proceed with the focused optimization. Do not stop at a plan.**

The success criterion is not a prettier email.

It is that Casey opens his inbox and sees genuinely worthwhile opportunities to generate new conversations for YardFlow, with the preparation already done and an easy path to execution.
