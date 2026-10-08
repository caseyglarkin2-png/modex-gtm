# GAP OS: Final AI Recovery, Cost Control and Seller Acceptance (Casey, 2026-10-08)

STATUS: ACTIVE. The fourth and fifth mandates of 2026-10-08, after the execution engine
(`EXECUTION_ENGINE_MANDATE_2026-10-08.md`) and the prospecting-first pair
(`PROSPECTING_FIRST_MANDATE_2026-10-08.md`). The ledger for the work is the "GAP OS AI RECOVERY, COST CONTROL
AND SELLER ACCEPTANCE" section of `docs/GAP_PROSPECTING_OS.md`. <!-- verified:2026-10-08 -->

## 1. The recovery mandate (recorded from the session; the constraints are Casey's words verbatim)

Objective: make the loop intelligence, Pursue, agent preparation, seller decision, outreach operational,
affordable and testable.

Section 1, locate existing funded AI access, and report only: for modex-gtm production on Vercel, the other
authorized Vercel projects for YardFlow or FreightRoll, the Railway services, the AI Gateway configuration and any
OpenAI, Gemini or Anthropic integration: where a credential exists, the provider, the project, the variable name,
whether access is available, whether billing is enabled, whether the intended model is supported, whether it is
authorized for GAP OS, and whether it can be safely scoped. "Do not display, log, paste, commit, or include secret
values in documentation." "Do not assume a credential is funded merely because it exists." "Do not retrieve or
expose unrelated production secrets." "If cross-project access or key reuse requires Casey's authorization,
explain exactly what permission is needed." "Prefer a dedicated restricted GAP OS credential or a properly
configured shared secret over blindly copying a website's production credential."

Section 2, one working inexpensive model route: a cheap model for routine tasks, a stronger one only when needed,
generated intelligence reused. Before deploying, one minimal authenticated model request with the intended
production configuration, without exposing the key: the model exists, auth works, the request is accepted, the
response satisfies the contract, the cost is observable, and it is callable from the GAP production runtime. Handle
401, 403, 404, 429 and 5xx correctly; do not retry retired models; "Do not treat exhausted billing quota as a
transient timeout"; remove unsupported fallbacks.

Section 3, cost guardrails: a $10 acceptance-testing allowance, a $25 maximum monthly GAP model spend until approved
higher, a $0.10 target maximum per agent task; a dedicated usage and cost ledger with model and task attribution,
token accounting, conservative estimates, maximum output tokens, bounded context, a hard per-task budget, a monthly
ceiling with in-flight handling, no uncontrolled retries or parallel calls, no regeneration of unchanged work, clear
alerts; check the actual provider and Gateway billing configuration. "Do not increase paid budgets, enable
auto-recharge or purchase credits without Casey's permission."

Section 4, agent failure behavior: distinguish configuration errors, invalid keys, unsupported model ids, billing
exhaustion, rate limits, outages and generation failures; permanent errors fail fast; bounded retries with backoff
for temporary ones; preserve the intelligence item and the Pursue decision; a visible recovery action; no indefinite
retries.

Section 5, recover the three Pursue examples (the Hormel 2018 expansion, the Tractor Supply trigger, Dave Kiesling
at Kenco) without duplicate records and produce useful angles (the evidence, what it establishes, why it is
interesting, the roles and people, a conversation starter, the next action); no freshness restrictions; never
present old news as current; no automatic contact.

Section 6, preserve the prospecting-first behavior. Section 7, complete the email acceptance test (briefing, START,
the first assignment, REVISE with the working model, the revised recommendation, APPROVE, a real Gmail draft, a safe
internal test send if authorized, provider activity recorded, the next action), verifying idempotency, suppression
and authorization; "Do not send to real prospects"; do not claim the loop proven unless the provider interactions
succeeded. Section 8, atomic units (credentials, the model, classification, cost controls, retry and resume, the
recovered tasks, the seller test, the docs); one review subagent on credential safety, spending controls and
end-to-end behavior; update the ledger with the verified configuration, outcomes, costs and limitations, no secret
values. Section 9, the report in the order MODEL, FUNDING, COST, GUARDRAILS, AGENTS, EMAIL, RELEASE, BLOCKERS.
Section 10, proceed immediately; do not ask Casey to pick providers before investigating; no timelines; no
purchases; "Do not make changes to the production YardFlow website merely to power GAP OS."

## 2. The clarification: Preserve I06 and Complete the Original Execution Roadmap (verbatim)

One important clarification to the AI recovery instructions I just gave you:

The funded-model recovery is an immediate operational blocker, not a replacement for the remaining GAP OS
implementation plan.

Do not interpret the instruction to avoid another major rebuild as permission to abandon previously agreed product
requirements, atomic tickets, or unfinished work.

### 1. Preserve the canonical backlog

Before closing the current work, inspect the latest docs/GAP_PROSPECTING_OS.md, HANDOFF, and outstanding I-series
and X-series requirements.

For every incomplete item, classify it as:

* DONE: implemented and verified
* PARTIAL: implemented but missing acceptance criteria
* BLOCKED: a specific external dependency prevents progress
* TODO: not yet implemented
* SUPERSEDED: replaced by a verified equivalent capability

Do not mark anything SUPERSEDED merely because priorities changed.

Preserve outstanding work in the canonical ledger with dependencies, implementation scope, acceptance criteria, and
verification requirements.

Do not silently drop or renumber tickets.

### 2. I06 remains required

The terminal identified I06 as the next implementation step.

I06 removes signal age as an automatic disqualification throughout the prospecting-to-execution path.

Complete I06 after or alongside the funded-model recovery, in dependency-correct order.

Audit the three downstream authorities identified in the previous handoff:

1. Actionability and hypothesis preparation
2. Routing / R12 eligibility
3. Enrollment eligibility

An older fact or historical observation must be able to support a hypothesis and an approved outreach strategy
without being disqualified solely because of age.

Preserve the original observation date, provenance, and factual qualifiers.

Never misrepresent an old event as a current event.

If evidence contradicts or supersedes a claim, expose that evidence.

Do not confuse factual validity with chronological recency.

Only remove age-based restrictions. Preserve opt-outs, actual contact restrictions, authorization requirements,
current deal context, and other legitimate execution safeguards.

Verify an older observation can progress through the full preparation path rather than merely appear in the
intelligence list.

I06 is not complete just because the UI displays historical signals.

### 3. Finish the AI provider recovery

Continue the existing instructions to:

* Find authorized funded AI access.
* Configure an available economical model.
* Enforce cost controls.
* Fix permanent versus transient error handling.
* Recover the three failed Pursue tasks.
* Demonstrate actual angle generation.
* Verify START, REVISE, and APPROVE through the intended email interaction path.

Do not expose secrets or purchase credits without authorization.

Ensure environment-variable changes are active in the production deployment, not just configured in a dashboard.

### 4. Preserve the complete seller execution plan

Reconcile all unfinished capabilities related to:

* Intelligence discovery and visibility
* Prospecting and reengagement
* Seller selection and pursuit
* Angle development
* Contact identification
* Gmail drafts
* Approved sending
* HubSpot sequences and enrollment
* Calls and call outcomes
* Activity recording
* Feedback-driven agent revisions
* Daily briefing and work queue
* Active-deal awareness
* Durable follow-ups and commitments
* Cost observability
* Recovery and reliability

Some are already built. Do not rebuild them.

Others may be implemented but disabled, unverified, or blocked by configuration. Distinguish those conditions.

Specifically confirm that the email interface is interactive in production, not merely capable of sending a
briefing.

Confirm HubSpot sequence capabilities against actual account permissions and integration state. Do not mistake
code-complete sequence support for operationally enabled enrollment.

### 5. Establish an integrated completion matrix

Add a concise matrix to the canonical Markdown with:

* Product capability
* Current status
* Relevant ticket or existing implementation
* Specific remaining gap
* Acceptance evidence
* Next action

Use this to prevent the funded-model task or I06 from swallowing the larger roadmap.

Keep historical records intact.

### 6. Execute rather than reopen planning

Use this execution order unless a verified dependency requires another sequence:

1. Restore the funded model route and bounded costs.
2. Recover and demonstrate the failed Pursue actions.
3. Complete I06 across downstream eligibility.
4. Verify the complete email-driven seller workflow.
5. Close any remaining execution-state, outreach, call, and follow-up gaps.
6. Perform a focused end-to-end seller acceptance review.

Every remaining ticket must be atomic, independently committable, and demonstrable.

Use focused tests and actual workflow validation.

Do not run oversized test suites.

Have one independent reviewer check that no unfinished requirements were silently abandoned, incorporate justified
findings, and update the latest canonical Markdown.

### 7. Definition of ready for Casey

GAP OS is ready for real seller testing when Casey can:

1. Review intelligence without arbitrary age restrictions.
2. Select something worth pursuing.
3. Receive a useful AI-developed angle.
4. Request and receive revisions.
5. Prepare an email or phone call.
6. Approve a real draft or other permitted action.
7. Execute an authorized outreach action.
8. See the actual outcome recorded.
9. Continue to the next recommended prospecting action.
10. Find unfinished tasks later without losing context.

Deals remain supported, but prospecting is the primary purpose of the daily workflow.

Provide a concise report separating:

* Ready for Casey
* Still under construction
* Blocked by configuration or authorization
* Deferred by Casey

Finish the product already planned. Do not start over, and do not abandon I06. Proceed.
