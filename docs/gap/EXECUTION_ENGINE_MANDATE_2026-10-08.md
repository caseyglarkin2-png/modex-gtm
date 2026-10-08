STATUS: ACTIVE (the deliberate next-version decision, 2026-10-08). The plan, baseline and backlog it produced live in `docs/GAP_PROSPECTING_OS.md`, section "GAP OS SALES EXECUTION ENGINE". This file is the mandate as received, verbatim.
<!-- verified:2026-10-08 -->

# GAP OS — FINAL PRODUCT MANDATE AND BUILD INSTRUCTIONS
**Project:** MODEX GTM / GAP OS  
**Date:** October 8, 2026  
**Owner:** Casey  
**Engineering lead:** Claude Code / ADLC orchestrator

## 0. The mission has changed. Read this carefully.

You are continuing the existing GAP OS build. You are not starting over.

We have invested substantial effort building account intelligence, research capabilities, opportunity hypotheses, buyer identification, outreach preparation, deal workflows, and supporting infrastructure.

The next objective is to convert that foundation into a working, proactive **AI-powered sales execution engine for YardFlow**.

I want GAP OS to help me generate demand, book meetings, advance opportunities, and close business.

It should identify what deserves my attention, prepare useful work, help me execute it, record what actually happened, and intelligently decide what needs to happen next.

I should not have to spend my day navigating dashboards, interpreting research, assembling outreach from multiple sources, managing AI agents, or keeping track of what I promised to do.

The product should take on as much of that cognitive and operational work as practical.

**The defining product experience:**

Every morning, GAP OS knows which accounts and contacts deserve attention, why, and what the appropriate next action is.

It sends me a useful briefing.

I can start working through the recommended activities from email or the application.

The platform presents specific, actionable opportunities, complete with account intelligence, relevant evidence, recommended messaging, call preparation, and the ability to execute.

I can approve, reject, modify, defer, or request additional research.

When I provide feedback, agents do the necessary work and return an improved recommendation.

When I execute an action, GAP OS records what actually happened, updates the appropriate CRM and account state, and manages the subsequent follow-up.

It remembers unfinished work and holds me accountable without becoming annoying.

**The objective is not more software. It is substantially more quality selling activity with substantially less administrative effort.**

---

# 1. Management and operating rules

I own all time management.

Do not generate timelines, due dates, development estimates, sprint durations, resource calendars, or project management theater.

You own:

- Technical investigation
- Product implementation
- Architecture
- Engineering task decomposition
- Agent coordination
- Integration
- Appropriate testing
- Validation
- Code review
- Documentation
- Shipping demonstrable capabilities

Keep the work atomic.

Every ticket should represent one independently committable, verifiable piece of work.

Every sprint or capability increment must produce functioning software that builds on previous work.

Do not optimize for the number of tickets closed.

Do not run huge test suites unnecessarily. We have already experienced serious local resource pressure, including the computer overheating and shutting down.

Favor focused tests, limited concurrency, and real seller workflow validation.

Do not get distracted by fixing GitHub Actions billing or runner provisioning unless I explicitly request it.

Do not use time management to determine engineering priorities.

Prioritize by customer value, dependencies, risk, and ability to demonstrate working software.

---

# 2. Inspect the actual baseline before building

Inspect the current repository and reconcile:

- Local checkout and remote `main`
- Current HEAD and active branch
- Open and recently merged pull requests
- Working trees and uncommitted changes
- Current production deployment
- Feature flags
- Existing integrations
- Database schema and migrations
- Existing workflows and services
- Relevant tests and known defects

Read:

- `CLAUDE.md`
- `docs/GAP_PROSPECTING_OS.md`
- `docs/gap/STABLE_BASELINE.md`, if present
- The latest HANDOFF
- Existing product requirements
- Previous account-first UX requirements
- Relevant architecture and integration documentation

Review the previous GAP OS audit and implementation plan if available.

The prior audit reported that PR #412 had merged into `main` at `2759f2ab`, fixing a PepsiCo proposal-approval issue. Verify the current state rather than trusting that historical snapshot.

Preserve the R00–R65 engineering recovery record.

Preserve functioning capabilities.

Do not rebuild functionality that already works.

Classify relevant capabilities as:

- VERIFIED
- PARTIAL
- BROKEN
- MISSING
- DISABLED
- UNKNOWN

Distinguish actual production behavior from code completeness.

Deliver a concise baseline summary, then move into execution.

---

# 3. Product architecture: an account-first sales operating system

GAP OS must support the complete commercial lifecycle:

SIGNAL
→ ACCOUNT INTELLIGENCE
→ OPPORTUNITY HYPOTHESIS
→ BUYER IDENTIFICATION
→ SALES STRATEGY
→ OUTREACH
→ ENGAGEMENT
→ DISCOVERY
→ DEAL PROGRESSION
→ OUTCOME
→ LEARNING

This is a capability model, not necessarily one linear state machine.

One account may have multiple contacts, relationships, facilities, initiatives, and opportunities.

An active deal should not make an account unusable.

A contact opt-out should not prevent legitimate work on unrelated contacts or existing opportunities.

Reuse the existing deal infrastructure rather than creating a redundant CRM.

HubSpot remains the authority for appropriate CRM facts. GAP OS owns its own workflow and intelligence state.

Do not create conflicting sources of truth.

---

# 4. The daily sales command center

This is the highest-priority user experience.

Build or extend the existing Work surface to provide a prioritized daily action plan.

The system should evaluate:

1. New responses requiring attention.
2. Outstanding promises and commitments.
3. Follow-ups due.
4. Open opportunities requiring action.
5. Relevant new account intelligence.
6. High-value unworked accounts.
7. Contact readiness and outreach eligibility.
8. Meetings and preparation requirements.
9. Previously deferred or rejected work.
10. Active tasks waiting on agents or approval.

For each recommended activity, show:

- Account
- Contact, if relevant
- Recommended action
- Why it matters now
- Supporting evidence
- Expected commercial outcome
- Preparation status
- Execution state
- Next step

Recommendations should be based on actual account context.

Avoid generic AI priority scores.

Avoid flooding the work queue with low-confidence activities.

Make the interface useful for a single seller managing a large enterprise account universe.

---

# 5. Morning email briefing

Build the ability to send a morning sales briefing to my configured email address.

Do not assume an email address or sending time. Use configurable settings.

The briefing should summarize:

- Top recommended actions
- Replies that need attention
- Follow-ups outstanding
- Active deal obligations
- New account opportunities
- Research or preparation completed by agents
- Work carried over
- Anything blocked that needs my decision

Keep it concise enough to be useful in an inbox.

Allow me to respond or click:

START

REVIEW

DEFER

Or open the full GAP OS workspace.

The briefing should be generated from a durable work queue. It must not generate a separate set of inconsistent tasks every time it runs.

Prevent duplicate morning emails and duplicate actions.

Support delivery failures and retries.

---

# 6. Email-driven work execution

I want the ability to operate GAP OS substantially through email.

When I start working, the system should send an individual actionable assignment or a small, intelligently selected batch.

Do not immediately flood my inbox with dozens of messages.

Each action email should include:

- Account and contact
- Why the action deserves attention
- Relevant intelligence
- Recommended commercial objective
- Suggested message or phone-call opening
- Relevant evidence and links
- Clear next actions

Support responses such as:

APPROVE

REVISE: [my feedback]

SKIP

DEFER

DONE

NEXT

HELP

Natural-language responses must also work.

For example:

"This sounds too generic. Find a more specific operational reason for this person to care."

The system should interpret that as feedback on the current work item, perform additional research as necessary, produce a revised recommendation, and send it back to me.

The system must preserve:

- Original recommendation
- My feedback
- Research performed
- Revised recommendation
- Approval state
- Execution state
- Audit history

Make sure replies are reliably associated with the correct work item using durable identifiers and authenticated sender information.

Do not execute ambiguous or unauthenticated commands.

Prevent replayed, duplicate, or stale approvals from triggering unintended actions.

---

# 7. Agents should do the preparation work

Build a durable asynchronous agent workflow using existing infrastructure where possible.

Agents should be able to:

- Research an account
- Refresh stale evidence
- Investigate an operational gap
- Identify the best buyer
- Improve a sales hypothesis
- Produce contact-specific messaging
- Prepare phone-call talking points
- Prepare follow-up emails
- Research objections
- Summarize activity
- Prepare discovery meetings
- Support active deal progression

When I request a revision, create a durable task.

An agent should perform the work, record the result, and resurface it to me.

Do not require me to manually prompt individual agents.

Do not leave long-running work dependent on a browser tab remaining open.

Use existing job, research, and workflow infrastructure rather than introducing a duplicate orchestration framework without justification.

Make failures and retries visible.

Preserve human edits.

A revised draft must not silently overwrite approved messaging.

---

# 8. Real email execution is explicitly in scope

This supersedes earlier language restricting all external draft creation and sequence enrollment.

**I want GAP OS to actually help execute outreach.**

The finished system must support appropriate real-world execution, not merely copy-to-clipboard functionality.

Inspect existing Gmail, HubSpot, SendGrid, and messaging infrastructure.

Determine the smallest reliable implementation that supports:

- Real Gmail draft creation
- Updating drafts when authorized
- Sending approved messages
- Recording confirmed sends
- Detecting replies and bounces
- Managing follow-ups
- Creating and updating sequences
- Enrolling eligible contacts
- Recording CRM engagements
- Stopping inappropriate follow-ups
- Reconciling delivery and execution outcomes

Be deliberate about which provider owns each function.

Avoid introducing duplicate outbound systems.

Preserve canonical send truth and suppression controls.

### Authorization policy

Building the execution capabilities is authorized.

Internal GAP OS notification emails and approved test-mailbox workflows should be supported.

Real prospect sends, live sequence enrollment, bulk activation, and consequential CRM writes require an explicit rollout policy approved by me before activation.

Build that policy into the product.

Do not make all outreach permanently manual or permanently disabled.

Provide configurable operating modes:

**Prepare:** research, generate, and create proposed work.

**Review:** prepare real drafts and allow explicit approval.

**Execute:** perform approved outbound actions under configured permissions and eligibility requirements.

Execution must always respect opt-outs, restrictions, eligibility, and account/deal state.

A real draft is not a send.

A send attempt is not necessarily a confirmed send.

A delivery is not a reply.

Avoid treating all these events as equivalent.

---

# 9. Phone calls are first-class sales activity

GAP OS should make phone prospecting easier.

For recommended calls, provide:

- Who to call
- Why this person matters
- Why now
- Verified contact information, if available
- Relevant account intelligence
- Concise opening
- Discovery questions
- Likely objections
- Relevant previous activity
- Recommended follow-up

Make call outcomes easy to record.

Examples:

- Connected
- Voicemail
- No answer
- Wrong contact
- Interested
- Objection
- Meeting booked
- Follow-up needed

Create relevant follow-up tasks automatically from recorded outcomes.

If a telephony integration already exists, evaluate using it.

Do not build an elaborate dialer before the simpler useful call workflow works.

Never count a generated script as a completed call.

---

# 10. Accurate execution and accountability

This is non-negotiable.

The system must distinguish:

- Research generated
- Proposal prepared
- Draft created
- Message approved
- Content copied
- Message sent
- Message delivered
- Reply received
- Call attempted
- Conversation completed
- Meeting booked
- Deal advanced
- Task deferred
- Work blocked

A copied email is not a sent email.

A call script is not a phone call.

Opening a CRM record is not completing a follow-up.

Use verified provider events when available.

Where an action is self-reported, label it accordingly.

Unfinished work should remain in the system until it is completed, dismissed, superseded, or appropriately rescheduled.

Do not allow aging windows to silently remove important obligations.

Develop a simple, useful accountability experience.

I should be able to see what I intended to do, what was completed, what needs attention, and what the agents are handling.

Avoid excessive nagging and meaningless metrics.

Measure actual selling activity and commercial outcomes.

---

# 11. Active deal execution

Deals are explicitly in scope.

Reuse the existing R50–R55 work and relevant current deal infrastructure.

An open deal should block inappropriate cold outreach when required, but should not block work on the account.

Support:

- Discovery
- Stakeholder mapping
- Opportunity hypotheses
- Meetings
- Follow-ups
- Buyer commitments
- Deal blockers
- Business case and ROI work
- Executive engagement
- Commercial next steps
- Closed-won and closed-lost learning
- Expansion opportunities

Support accounts with multiple opportunities.

Keep account intelligence and deal execution connected.

Do not recreate HubSpot inside GAP OS.

---

# 12. Seller experience and design

Optimize for the actual seller experience.

The system should be:

- Fast
- Clear
- Account-first
- Action-oriented
- Evidence-based
- Easy to navigate
- Easy to correct
- Easy to execute from email
- Honest about what is known
- Honest about what has actually happened

Avoid excessive dashboard clutter.

Avoid duplicate status messages.

Avoid exposing obscure implementation details to the seller.

A user should not need to understand internal states, queues, flags, or service boundaries to accomplish sales work.

Fix UX problems that block the real journey.

Do not embark on a wholesale visual redesign unless the experience clearly requires it.

---

# 13. Atomic implementation plan

Decompose the work into small, independently committable engineering tasks.

The following capability groups are the initial framework.

### Increment A: Baseline and truthful activity

A1. Verify production and repository state.

A2. Identify and correct copied-versus-executed activity errors.

A3. Preserve overdue unresolved work.

A4. Establish or reconcile a durable activity and work-item model.

A5. Validate account and deal state transitions.

### Increment B: Daily command center

B1. Aggregate actionable work from existing sources.

B2. Deduplicate recommendations.

B3. Rank work using evidence, urgency, commitments, and commercial context.

B4. Persist the daily plan.

B5. Implement Start, Defer, Skip, and Complete transitions.

B6. Build a focused daily Work experience.

### Increment C: Morning email

C1. Add configurable delivery preferences.

C2. Generate concise email digests from the canonical work queue.

C3. Implement internal email delivery.

C4. Prevent duplicate digest sends.

C5. Add secure action links or supported email commands.

C6. Confirm delivery and handle failures.

### Increment D: Reply-driven workflow

D1. Receive authorized inbound replies.

D2. Authenticate and map replies to work items.

D3. Parse supported commands.

D4. Support natural-language revision requests.

D5. Persist revision requests and original context.

D6. Trigger background research and rewrite jobs.

D7. Return revised work to the seller.

D8. Prevent duplicate and stale approval execution.

### Increment E: Real outreach

E1. Inventory and reconcile existing provider adapters.

E2. Implement or finish real Gmail draft creation.

E3. Associate external drafts with contacts and internal work items.

E4. Reconcile edited, deleted, and sent draft states.

E5. Implement approved sending.

E6. Capture canonical send outcomes.

E7. Connect approved sequences and enrollment.

E8. Enforce eligibility, suppression, and deal restrictions.

E9. Stop or adjust follow-ups after replies and other relevant events.

### Increment F: Calls and follow-ups

F1. Generate useful call preparation.

F2. Present contact-specific call information.

F3. Record call outcomes.

F4. Generate appropriate follow-up actions.

F5. Associate activity with account, contact, and deal.

### Increment G: Deals and accountability

G1. Surface deal-specific obligations in the daily queue.

G2. Link discovery and meeting actions to opportunities.

G3. Preserve buyer commitments and follow-up history.

G4. Show completed, pending, blocked, and agent-owned work.

G5. Use actual outcomes to influence subsequent prioritization.

G6. Ensure recurring daily planning does not lose unresolved work.

This is a starting decomposition, not permission to create duplicate capabilities. Inspect existing code and refine the tasks.

Every ticket must specify:

- Seller outcome
- Implementation boundary
- Relevant files/modules
- Dependencies
- Acceptance criteria
- Appropriate focused test
- Demo evidence
- Commit or PR reference

Do not bundle unrelated work into one ticket.

Every increment must produce working software.

---

# 14. Testing: proportional, useful, resource-aware

Test to prevent breakage, not to manufacture activity.

Use the smallest set of tests that reliably verifies the changed behavior and its critical integrations.

For ordinary changes:

- Focused unit tests
- Relevant integration checks
- Targeted type checking and lint
- Manual or automated workflow validation

For provider and data-state changes:

- Idempotency
- Permission checks
- Failure/retry behavior
- State reconciliation
- Relevant integration tests

For user-facing workflows:

- Demonstrate the complete action from the actual user surface.

Do not routinely run thousands of tests on my local machine.

Bound concurrency and resource consumption.

Do not run the entire old recovery harness merely because it exists.

Do not introduce a large mutation-testing program unless a specific risk justifies it.

Do not create tests solely to make a coverage number look impressive.

Preserve important safety and regression coverage.

---

# 15. Independent reviewer

Assign an independent subagent to critique the plan.

The review should answer:

1. Does this genuinely increase Casey's selling capacity?
2. Are we creating another dashboard instead of an execution engine?
3. Are the email interactions intuitive?
4. Are we reusing existing infrastructure?
5. Are real outreach capabilities included?
6. Are approval boundaries practical?
7. Are the implementation tasks atomic?
8. Does every increment deliver usable functionality?
9. Are we overengineering anything?
10. Are critical failure modes overlooked?

Incorporate justified improvements.

Document meaningful disagreements.

Do not turn the review into an endless planning cycle.

---

# 16. Documentation and implementation

Update the repository's canonical `docs/GAP_PROSPECTING_OS.md` to reflect this product mandate.

Preserve the historical recovery ledger.

Do not overwrite the original R00–R65 record.

Add or revise:

- Final product definition
- Seller operating loop
- Email interaction architecture
- Daily priority engine
- Revision and agent workflow
- Authorized outbound execution model
- Activity/event semantics
- Call workflow
- Deal continuation
- Atomic delivery backlog
- Demo acceptance criteria
- Remaining technical risks

Update `CLAUDE.md` so future sessions inherit the correct product objective and engineering rules.

If multiple roadmap documents already exist, reconcile them instead of creating another conflicting authority.

After independent review and documentation updates, begin implementing the first dependency-correct capability increment.

Do not stop after drafting another plan.

Commit completed work in small, coherent changes.

Keep the application runnable.

---

# 17. What I expect you to demonstrate

The initial integrated product demonstration should prove the following:

1. GAP OS generates a useful daily sales plan from existing intelligence.
2. An email briefing can be sent to an approved internal mailbox.
3. I can start the day's work.
4. GAP OS presents a specific, evidence-backed sales action.
5. I can request a better recommendation by replying.
6. An agent performs the appropriate research or revision.
7. The revised recommendation is delivered back to me.
8. I can approve the work.
9. GAP OS creates a real editable email draft using an approved test mailbox.
10. A permitted test send can be executed and confirmed.
11. The system records the actual state correctly.
12. The next appropriate work item is surfaced.

Do not represent simulated provider events as confirmed real events.

Use safe test identities until live outreach policies are approved.

Subsequent demonstrations should cover call completion, follow-up execution, sequence enrollment, and real active deal workflows.

---

# 18. Immediate instructions

Start now.

1. Inspect the current code and documents.
2. Verify the actual deployed baseline.
3. Reconstruct what already works.
4. Identify only the missing seller-execution capabilities.
5. Produce a concise architecture and dependency plan.
6. Have an independent subagent review it.
7. Incorporate the justified findings.
8. Update the canonical Markdown and agent instructions.
9. Break the first capability into atomic tickets.
10. Begin implementation.
11. Demonstrate a working seller workflow.
12. Report commits, tests, and remaining risks.

Do not ask Casey to manage ordinary engineering decisions.

Do not invent timelines.

Do not waste cycles on irrelevant infrastructure work.

Do not run oversized test suites unnecessarily.

Do not treat completing a ticket as proof of product quality.

**North star: GAP OS should make it materially easier and faster for Casey to turn enterprise account intelligence into actual conversations, opportunities, and revenue.**

Build that product.

## END PROMPT
