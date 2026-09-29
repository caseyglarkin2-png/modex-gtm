# GAP Universal Work Intake + Cohort Intelligence (status ledger)

STATUS: SHIPPED 2026-09-28 (PRs #298-#303; production-verified)

<!-- verified:2026-09-28 -->

Give GAP something worth working; GAP does the mechanical work of turning it
into a justified human sales decision. Many reasons to look at a person or an
account, ONE downstream system:

SOURCE -> RESOLVE -> QUALIFY -> RESEARCH -> ACCOUNT THESIS -> PERSON ANGLE ->
PROPOSED MOTION -> HUMAN DECISION -> ACTION -> BUYER TRUTH -> LEARNING

Source provenance is CONTEXT. It is not evidence, not buyer truth, not consent.

Baseline: `origin/main` 5ef95058 (Evidence Continuity shipped).

## Release 0: reconnaissance (read from code, file:line in the session record)

What exists and is reused:

| Concern | Existing owner |
| --- | --- |
| Company to Account | `gap/identity/resolve.ts resolveIdentity` (hubspot id 100, domain 95, alias 90, normalized name 70; no fuzzy), `identity/service.ts loadIdentityContext / resolveAccountName` |
| Person to Persona | email only today (`capture/store.ts`, `bid/service.ts`, `person-history.ts`); `Persona @@unique([account_name, email])` |
| New person, not yet safe | `AccountContactCandidate` staged (`account-contact-candidates.ts`; states staged / promoted / replaced / deferred; promotion is a human action) |
| Watched universe (ICP-in) | `signals/watch.ts loadWatchProfiles` (band A-C or Tier 1-2, a thesis, the Pounce watchlist, 5+ personas; fixtures out) |
| Open opportunity | `opportunity/active-opportunity.ts resolveAccountOpportunity` (CLEAR / ACTIVE / UNKNOWN; never throws) |
| Suppression | `Persona.do_not_contact`, hard-invalid email statuses; the send gate re-reads the suppression service at send |
| Conversation | `motion/load.ts loadAccountConversations` (human-confirmed dispositions, 90 days) |
| Evidence | `research/inbox.ts loadEvidenceInbox` (best fact, context, theses, next) |
| Research worker | `research/background.ts runBackgroundResearch` (targets ranked by reason; 3-day cooldown; capped) |
| Draft thesis | `research/propose.ts proposeFromResearch` (draft only) |
| Person angle | `motion/persona-angle.ts setAngle / suggestAngle` |
| Brief | `execution/six-line-brief.ts` (KNOW / THINK / LEARN / WHY YOU / HISTORY / WRONG IF) |
| Send attribution | `execution/send-attribution.ts captureSendAttribution` (immutable, in the send ledger payload) |
| Signals | Signal Intelligence (`/gap/signals/new`, `GapSignal`) |
| Conversations | Buyer Truth Capture (`/gap/capture`, audit-ledger captures, BIDs) |

What does not exist: a way to say "these people / accounts arrived from THIS
source, for THIS reason"; person membership in any cohort; relationship
context anywhere GAP reads; an account-level research request other than a
shared signal; HubSpot list reads (no code, and `crm.lists.read` is not a
documented scope).

## Release 0: the model decision

**Campaign is NOT reused.** `Campaign` is the outbound-generation container
(GeneratedContent, SendJobRecipient, EmailLog, GenerationJob, generation
contracts, playbook blocks, drip). Its only membership is `OutreachWave`,
which is account-level (no person), and GAP never reads it. Putting "MMYQB
subscribers" or "Inland26 attendees" into it would put them one join away from
generation and send machinery and imply everyone should receive outreach,
which is the opposite of provenance-as-context.

**One new abstraction, two tables:**

- `GapWorkSource`: a named source of work: name, source type, source
  reference, intent, default relationship context, notes, status, owner.
  Source types are configuration, not architecture: newsletter, conference,
  crm_list, referral, relationship, target_list, content, inbound, other.
- `GapWorkSourceMember`: one row per (source, person-or-account): exactly
  what was supplied (raw + the mapped fields), the resolved identity
  (account, persona, staged candidate), resolution state and basis,
  relationship context, the qualification the planner derived, and status.
  One person in three sources = three member rows pointing at the same
  Persona. Provenance edges are many; the person is one.

Nothing else is new: no per-intake table (no NewsletterSubscriber,
ConferenceAttendee, Referral or TargetListMember), no second person store (a
new person is a staged `AccountContactCandidate`, never an auto-created
Persona), no second research engine (the planner feeds the existing
background worker), no second evidence, hypothesis, routing, execution or
buyer-truth system.

Identity is conservative: resolved, new_candidate (known account, new person,
staged), ambiguous (never merged), unresolved. GAP still never creates an
Account.

## MMYQB data source

LinkedIn offers newsletter authors analytics (title, company size,
seniority) but no subscriber export or API. The author CAN see the
subscriber list (newsletter page, "N subscribers"). On 2026-09-28, at Casey's
direction, the list was read once from Casey's own signed-in session, human
paced, into a local scratch file (never committed): 390 subscribers (LinkedIn
shows 391). GAP itself never touches LinkedIn: the product path is paste
(select the subscriber dialog, copy, paste into ADD TO GAP), which the parser
reads as name + headline pairs. 136 of 390 headlines name a company ("Title at
Company"); the rest are slogans or credentials and start as NEEDS IDENTITY
rather than a guessed company.

## Release A: the model and the front door (SHIPPED 2026-09-28, PR #298, merge 379a52bb)

- `GapWorkSource` + `GapWorkSourceMember` (hand SQL `2026-09-28-gap-work-intake.sql`: 7 CHECKs, `GAP_WORK_MEMBER_FROZEN`); applied to production as purely additive DDL before merge.
- One parser (CSV, pasted tables, line lists, the copied LinkedIn subscriber dialog anchored on connection-degree lines); conservative identity (resolved / new_candidate staged / ambiguous / unresolved; never a Persona or an Account); idempotent import; conference mode (the current source).
- `/gap/add` (ADD TO GAP), `/gap/sources`, `/gap/sources/:id`. A link delegates to Share to GAP, a conversation to Buyer Truth Capture.
- A read-only review found 5 P1s (positional LinkedIn parsing, invented employers, credentials as companies, collapsed people, shared candidate source ids) and 8 P2s; all fixed and pinned before merge.

## Release B: cohort intelligence (research per account, proposals, context, attribution)

- `intake/plan.ts` qualifies ACCOUNTS once (watched universe, HubSpot deal truth only for watched accounts, live evidence, theses, last research) and gives every person the account's state; person stops win (do not contact, ambiguous, no identity). Transparent states with reasons, no score. Runs in the background cron (bounded) and on "Qualify accounts now".
- The ONE research worker (`research/background.ts`) gains two reasons: `work_source` (accounts the planner marked research; after fresh triggers) and `requested_research` (Casey's RESEARCH MORE; ranks with a shared story, served then cleared). A WATCH source never spends research.
- `intake/opportunities.ts`: people worth attention, never emails. Fact-led (verified fact, normal gates), relationship-led / referral-led (no fact: GAP never drafts a first touch; the evidence gate is unchanged), follow-up (a conversation exists).
- `intake/context.ts`: relationship context reaches the six-line brief as CONTEXT ("yours, not evidence") and every first touch's immutable send attribution carries `workSources` (association, not causation).

## Follow-ups shipped from the production dogfood

- #300: NEEDS IDENTITY is actionable. Resolution reads the company NAME inside a headline, and the source page lists "Companies GAP does not know yet" with SAME COMPANY AS <existing account> (the curated alias mechanism, source manual; never creates an account).
- #301: conference mode in one step (start a conference source and make it current from the phone).
- #302: an account where Casey met people (a conference, referral or relationship source) is in scope, with the reason stated; a newsletter or a list still needs the watched universe.
- #303 (final review):
  - One source-type traits map (engaged, relational, approach, opener) instead of four scattered sets; `commitRows` is the structured entry point for adapters (a HubSpot list, a badge-scan export).
  - A promoted staged person is followed to the Persona, and unimprovable rows never starve re-resolution.
  - A company with duplicate account rows (RXO / RXO, Inc.) is searched across its siblings and never stages into a shell.
  - Fact-led cards for people Casey met say "follow-up" and name GAP's blind spot (it only sees its own sends).
  - Sensitive facts (layoffs, bankruptcy, deaths, recalls, strikes) are flagged: reference the network change, never the people.
  - A newsletter opener is "you write it", never "they subscribe", and a no-fact card shows no thesis.
  - Back to People I met, and long sources are usable on a phone (collapsed unknown companies, 150 members with show all).

## Production dogfood (2026-09-28)

| Source | Imported | Resolved people | New at known accounts (staged) | Need identity | Accounts | Watched / in scope | In deal | Do not contact | Researched | Evidence ready | Opportunities |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MMYQB LinkedIn subscribers | 390 | 2 | 13 | 375 (256 no company, 119 company not in GAP, 117 distinct) | 12 | 3 (Caterpillar, NFI, The Home Depot) | 0 | 2 | 3 (researched today, no verified fact) | 0 | 4 relationship-led |
| Inland26 · Chicago (6 people Casey emailed on Sep 24, added on a phone) | 6 | 0 | 6 | 0 | 2 (Tyson Foods, Walmart Inc.) | 2 (in scope: met there) | 0 | 0 | 2 (RESEARCH MORE: Tyson 2 facts, Walmart 2) | 2 | 6 fact-led follow-ups |
| Shippers among MMYQB subscribers (8 accounts) | 8 | 3 accounts | - | 5 (AkzoNobel, Costa Farms, Harbor Foods Group, PetSmart, Nike) | 3 | General Mills; Walmart not watched | Kroger | - | - | General Mills | - (accounts, no people) |

Manual review of 23 real people (accounts and titles; judged I WOULD CONTACT / MAYBE / NO):
- 1 would contact: Walmart (the $300M Turtlecreek fulfillment center), as a follow-up to the Sep 24 note.
- 10 maybe: two more Walmart; one Tyson, where the fact is a closure with layoffs; Caterpillar SVP Strategic Procurement; NFI RVP; a Home Depot delivery manager; three real shippers GAP does not have as accounts (Harbor Foods Group, Costa Farms, AkzoNobel).
- 12 no: carriers, brokers and 3PL non-buyers GAP correctly excluded; two do-not-contact Personas; asset protection; the other two Tyson contacts until one thread is running.

GAP's exclusions were right in every checked case. The value left on the table is identity: real shippers outside the account universe.

MMYQB data source: Casey's own subscriber list, read once at his direction from his signed-in session (LinkedIn offers authors no export or API), then imported through the product's paste path. The raw copy lives only in a local scratch file.

## Final review (four read-only reviewers, 2026-09-28)

All four found one system, not bolted on: no per-type tables, no second person store, no second research, evidence or hypothesis engine, and Campaign rightly not reused. The P1s were verified and fixed in #303 (above). The CRM check on production found:
- no Account, Persona or alias created by intake;
- all 19 staged candidates promotable;
- do-not-contact exact both ways;
- no carrier matched to a shipper;
- nothing ambiguous merged.

## Named debt (not fixed here)

- GAP's person history sees only GAP's own sends: a manual HubSpot or Gmail note outside casey@yardflow.ai is invisible to it. The cards now say so; the draft-time Sent-folder check covers casey@yardflow.ai only.
- Ambiguous people have no "this is Persona X" action, so `email_company_conflict` rows wait in human review.
- 3 of 5 intents (find_people, prepare_outreach, follow_up) are recorded but not yet read; watch is honored.
- Opportunity cards and the planner read conversations, not full account motion (in motion, paused). The send gate still enforces motion at the click.
- No learning view reads `workSources` from send attribution yet; the data is captured.
- The identity normalizer drops accented letters ("Nestlé" becomes "nestl"). Fixing it re-keys the alias index.
- RXO and RXO, Inc. are duplicate accounts in the CRM. Candidates 37 and 40 were staged before the sibling fix and duplicate existing RXO, Inc. Personas: defer them and merge the accounts (Casey's call).
- HubSpot list import has no code and no documented `crm.lists.read` scope. `commitRows` is ready for an adapter once the scope exists; CSV export from a HubSpot list is the path today.
- Source relationship context is copied onto members at insert, so a later edit does not carry through.
