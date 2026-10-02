# GAP V2 resource and information-architecture audit

STATUS: ACTIVE (V2, 2026-10-02)
<!-- verified:2026-10-02 -->

Golden accounts: PepsiCo, Walmart, Dannon, Kroger, Crowley, one MMYQB candidate (Performance Food Group). Production
read-only probe at `39f8a619` plus the GAP account page as rendered today.

## What exists per account (production probe)

| | PepsiCo | Walmart | Dannon | Kroger | Crowley | Performance Food Group |
|---|---|---|---|---|---|---|
| Personas (reachable) | 19 (16) | 0 | 5 (0) | 3 (3) | 6 (6) | 10 (9) |
| Persona intro routes | none | none | 5 (Mark -> Heiko / CSCO office; LinkedIn) | none | none | none |
| Account intro path | none | none | Mark Shaughnessy -> Danone CSCO intro (warm-intro-only) | none | none | none |
| Work-source members | 0 | 4 (Inland26) | 0 | 1 | 0 | 0 |
| Microsite sessions (human, all time) | 8 | 0 | 94 (13 high-intent, 6 CTA, 1 ROI read, last Jun 12) | 2 | 2 | 0 |
| Activities / emails / meetings | 2 / 3 / 0 | 0 / 0 / 0 | 184 / 18 / 0 | 4 / 3 / 0 | 2 / 0 / 0 | 1 / 2 / 0 |
| Generated content | none | none | 9 one-pagers, 1 sequence | none | none | 1 one-pager |
| Meeting brief (legacy JSON) | no | no | yes (March) | no | no | no |
| GAP hypotheses / confirmed BIDs | 14 / 0 | 0 / 0 | 0 / 0 | 3 / 0 | 0 / 0 | 0 / 0 |
| Open HubSpot deal | no | no | no | yes | yes | no |

**Useful resources GAP ignores today:** Dannon's warm intro (account + per-person routes), Dannon's 13 high-intent
sessions and CTA clicks, Dannon's 184-activity / 18-email history and 10 generated assets, Walmart's Inland26 contacts
(already read via work sources), every account's timeline and assets.

**What GAP tells Casey about Dannon today:** "Do not contact yet: nobody reachable here. Research first." The truth
is: a named warm intro to the CSCO office exists and is the only allowed path, the account read its microsite deeply
in April-June, and there is a long history. That is the V2 problem in one account.

## Current GAP account page (PepsiCo) vs target

Today (top to bottom): next action box; 15-row glance; 11 status chips; separate-motion box; deal brief; sources
section; research plan; account thesis (6 rows + why-not list); up to 3 hypothesis cards (each with Wrong if);
discovery plan (up to 7 questions x 3 lines); site and wedge (3 expandable sites); 11 collapsed "everything GAP
knows" sections. About 70-100 lines before the collapsed sections. The best fact repeats up to 6 times; the top
hypothesis 3 times; "Wrong if" appears under every inference statement, including identity.

## Classification of every rendered / available item

| Item | Placement | Note |
|---|---|---|
| Next action | NOW (NEXT) | from GAP Motion only |
| Motion line, fit, family, ICP state | NOW (ACCOUNT line: type, fit, motion state) | one line |
| Why now (best fact restated) | NOW (WHY NOW, max 3: recent signals + facts + private engagement if material) | never the same string twice |
| Network / freight glance | BRIEF (Network, Freight) | |
| Best fact | NOW (KNOW, max 5) | one location |
| Top hypothesis | NOW (THINK, max 2) | Wrong if lives in BRIEF/hypothesis only |
| Current tech | BRIEF (Tech) | |
| Likely owner / WHO | NOW (WHO + why) | from the unified people projection |
| Relationship | NOW (one line), RELATIONSHIP (all) | intro paths, work sources, threads, meetings |
| Commercial state | NOW (ACCOUNT line), BRIEF (Commercial history) | |
| Biggest unknown / next question | NOW (LEARN max 3, ASK one) | |
| Status chips (11) | SOURCES | machinery |
| Separate-motion box | NOW only when it holds the motion (as NEXT) | otherwise BRIEF |
| Deal brief | BRIEF (when in a deal) | |
| Sources / signals section | SOURCES | counts link from BRIEF |
| Research plan | SOURCES | |
| Account thesis rows | BRIEF (synthesized lines) | not repeated in NOW |
| Hypothesis cards | BRIEF (THINK details) | Wrong if here |
| Discovery plan | BRIEF (ASK list); NOW shows one question | |
| Site and wedge | NOW (one wedge line), BRIEF (Yard) | |
| 11 sections | BRIEF (3-5 lines each, details expandable) | full statements + sources in SOURCES |
| Private microsite engagement | NOW only if recent (<= 30 days) and material; BRIEF (Private engagement) | never outbound |
| Timeline | BRIEF (last 3-5), HISTORY (deep, legacy account page) | |
| Generated content / microsites / meeting brief | NOW one asset only if it clearly helps the next move; BRIEF (Existing assets) | |
| Legacy scores, readiness, NBA, Agent Intel next actions | SYSTEM ONLY / LEGACY | |
| Agent Intel research summary | SOURCES (advisory) | |

## Dogfood baseline (before V2)

| Metric | PepsiCo | Dannon | Walmart |
|---|---|---|---|
| Pages to visit to learn next action + person + relationship + engagement | 1 GAP page (no relationship / engagement shown) | 3 (GAP account, legacy /accounts/dannon, engagement) | 1 (thin) |
| Words above the fold (390px, GAP page) | about 260 | about 120 (mostly "nobody reachable") | about 150 |
| Duplicated ideas on the GAP page | best fact 6x, hypothesis 3x, Wrong if 2x | hold 3x | |
| Conflicting authorities | GAP NEXT vs cockpit WHO | GAP "research first" vs legacy "Prep Mark Shaughnessy intro path" vs Work Queue follow-ups | |
| Useful resources hidden from GAP | engagement, history, assets | intro path, routes, engagement, history, assets, meeting brief | Inland26 people shown; jobs not yet searched |

## V2 design (after five read-only reviews, 2026-10-02)

Reviewers: enterprise seller, Fortune 500 supply chain operator, information architect, RevOps / systems, GAP Selling
practitioner. Each read this audit, the convergence audit and the code; none edited anything. The lead synthesized;
one writer implements. Where reviewers disagreed, the decision and the reason are stated.

### 1. One restriction authority (RevOps M1-M3, S1; seller, IA)

- The warm-intro-only rule already lives in `src/lib/studio/guardrails.ts` (the first audit draft was wrong). It moves
  to ONE GAP-owned policy module, `src/lib/gap/policy/restriction.ts`; guardrails delegates to it. Matching is on whole
  words of the account name plus the account's GAP aliases (fail closed: an alias can no longer slip past; a name that
  merely contains the letters no longer trips it).
- The authority is a reviewed code constant (account, introducer, route), not a database row: no owner surface exists to
  set a restriction, a production row would be a write with no owner, and git review is the audit trail.
  `Account.best_intro_path`, `outreach_status`, `warm_intro`, `Persona.intro_route` and the microsite data are DISPLAY
  input only, never policy.
- Gates, all stricter only, replies exempt: the GAP action-time check (`makeActiveOpportunityCheck`, which already
  covers enroll, email draft, send, call and LinkedIn), the legacy send guards (`evaluateSendGuards`), the Outbox
  writers (`addOne` and the Clawd ingest), and the campaign drip writer (no "Send first touch" task is minted).
- Motion: a restricted account gets its own answer, `INTRO_ONLY`, placed after the deal / fit / deal-unknown / family
  / stop / contradicted gates and a live conversation, and BEFORE the touch hold and the reachability gate (Dannon has
  nobody reachable, so a rule after that gate never fires). It beats FACT_LED. NEXT is the intro ask ("Ask Mark
  Shaughnessy for the introduction to the Danone CSCO office"), framed as access to learn their current state, never a
  forwarded pitch. GAP drafts nothing.

### 2. What counts as a fact (GAP Selling M1-M2, operator M2)

- NOW speaks three seller tags: **Buyer said** (buyer truth, rank 0), **Checked** (verified at the source: the
  company's own publication, a dated direct observation, or our own system record), **Our read** (inference, model,
  hypothesis). Unknown and Contradicted stay as words. Every NOW line shows its basis inline, and KNOW lines carry the
  outreach axis ("OK to cite to the buyer" or "Checked, not for outreach").
- A third party's claim about the account stays an attributed claim ("Vendor X says..."), never a Checked fact.
- A system record (CRM, persona, account row) backs facts about OUR relationship and commercial state only, never the
  buyer's operations.
- When no buyer-confirmed current state exists, NOW says "Current state: not confirmed by the buyer".
- Satellite counts are a fact about one site on one imagery date. They are never summed across sites with different
  dates as "the imagery date" (a range is stated), never read as yard size, utilization or a problem, and imagery older
  than two years is flagged on the line. Gate, staging and fast-lane readings are interpretations ("Our read").
- The outreach evidence gate is unchanged.

### 3. Operator corrections (operator M1, M3, M4, S5-S8)

- Door turns: one unit and stated assumptions. Doors times turns is theoretical door capacity, not trailer moves, and
  stays out of NOW. BRIEF shows doors as a dated count.
- A 3PL-operated site is a shared decision (through the 3PL contract), shown in the picture and left out only of the
  self-operated pilot pick.
- Division: when the account is a parent with named operating units (corporate family), the ACCOUNT line says so and
  "which operating unit owns this yard decision" is the first unknown. Full per-division modeling is recorded debt.
- The ASK for a network VP asks about variance ("does every site check trailers in the same way?"); the site-level
  question goes to a site or yard owner. "What would good look like a year from now" and "what would a change have to
  clear" leave early discovery.

### 4. NOW (IA M1-M5, seller, GAP Selling M3-M4)

Reconciling the spec's NOW slot list with the reviewers' fold budget: the slots stay, caps tighten, empty slots hide,
and each idea appears once (deduplicated by statement id in the order NEXT > WHO > WHY NOW > KNOW > THINK, pinned by a
test).

Above the fold at 390px:
1. Account name · one plain state line (what they are · YardFlow fit · deal or motion state · owner) · Listen icon.
2. NEXT with its control. Priority: an open reply or upcoming meeting, then the deal's next step, then the restriction
   (intro ask), then GAP Motion.
3. WHO and why (one person, one sentence; optional alternate; the relationship route when there is one).
4. WHY NOW: one dated line (max 3 overall). Never private engagement.

Below the fold:
5. GAP: current state / problem / impact / root cause, each Buyer said, Our read or Unknown (unscored).
6. KNOW (max 3, each tagged with its basis and outreach axis).
7. THINK (1, with a short "wrong if" tied to the ASK that tests it).
8. IMPACT: "Unknown: the buyer has not named a cost" when true. No modeled dollars in NOW.
9. ASK (1), in discovery-plan order: current process, verify problem, root cause, impact. Never current stack or
   desired future while current state is unknown. A site the buyer has not named never appears.
10. RELATIONSHIP (one line).
11. PRIVATE, labelled "Private: interest signal, never mention to the buyer", shown when material (high-intent or CTA)
    within 180 days, as a dated range ("deep engagement Apr-Jun, quiet since Jun 12"). Never a reason, never a
    hypothesis, never economics (an ROI-calculator read is them reading OUR model).
12. WEDGE only when the buyer confirmed a problem or impact; otherwise BRIEF says "fit: unknown until the current state
    is confirmed".
13. One existing asset, only when it serves NEXT.

Machine labels (motion enums, ICP state, status chips, "Eligible as outreach evidence") live in SOURCES. A sticky
NOW / BRIEF / SOURCES switch sits at the top. NOW never calls a live model.

### 5. BRIEF and SOURCES (IA S1-S2, operator S5)

BRIEF sections, 3-5 lines each with VIEW DETAILS one click deeper: Network (operating unit, site types: plant, DC, DSD
branch, co-packer, 3PL-operated), Freight (inbound vs outbound unknowns), Yard (per-site dated counts), Tech (YMS, TMS,
WMS, dock scheduling as separate slots, "unknown" distinct from "none"), Economics (model with "how calculated",
detention and yard labor as named unknowns), Buyer map (lanes), Change and signals, Relationship, Commercial history,
Private engagement, Existing assets (legacy meeting brief as a dated legacy note), Unknowns. BRIEF is the meeting
brief. SOURCES is today's full analyst layer, opened by a counts sentence. Cross-links: legacy account page (history),
Content Studio (assets), HubSpot record.

### 6. People and the person prior (RevOps S3, seller, Casey amendment 2026-10-02)

- One people projection joined only by explicit links (work-source member to persona or candidate, candidate to
  promoted persona, persona to HubSpot contact). Never by name, email or domain; ambiguity is shown, never merged.
  Intro text names the introducer and is relationship context, never a person row.
- Reachability is per channel: email for email, phone for a call, LinkedIn for LinkedIn.
- ONE WHO comparator (`src/lib/gap/people/person-prior.ts`) replaces both the brief's owner pick and the cockpit's
  ranking, so the two can never disagree. It is ordered and explained, never a number:
  buyer truth (a confirmed champion or the person who answered) > relationship (an introduction or someone Casey met)
  > explicit initiative ownership in a live signal > LANE > US / North America remit > network scope > seniority.
- Lanes: PRIMARY OPERATOR (owns transportation / freight / distribution / fleet / network execution), ADJACENT OPERATOR
  (supply chain, DC, warehouse, fulfillment, plant logistics operations), TRANSFORMATION / TECH, EXECUTIVE SPONSOR,
  PROCUREMENT / COMMERCIAL (sourcing, purchasing, category, finance, sustainability, R&D, sales, compliance, generic
  IT), NEEDS REVIEW. Ownership words win over the bare word "transportation". At a carrier, 3PL, port or terminal the
  operator of the physical network is the primary operator whatever the shipper title taxonomy says.
- Region comes from the person's own title or remit (NA, US, North America, Domestic); a company's headquarters or
  HubSpot company country never makes a person US-based. No remit stated is "US location unknown", not foreign.
- NOW shows one person, one sentence why, and an optional alternate. BRIEF shows the buyer map by lane. When the
  primary operator is missing, RESEARCH NEXT asks who owns transportation operations in the US / North America.
  Contacts are never created automatically.

### 7. History, engagement, assets (RevOps S4, GAP Selling M4)

- History reuses the timeline inputs and merge, not its rendered titles: every item carries a kind and a visibility
  (private for microsite sessions and email opens), drip "Send touch N" markers are not history, and the limit is
  per-kind.
- Engagement is a private summary of counts and dates, never a score or a heat label.
- The private-intent regression test covers compiled copy, call openers, HubSpot notes, ASK and discovery questions.

### 8. Task authority (RevOps S2, C1; seller warning)

- GAP NEXT is the one task authority. The legacy account page shows GAP's NEXT where its Next Best Action was and the
  old `next_action` as a dated legacy note.
- The Work Queue does not hide anything (seller): for a GAP-decided account its outbound-shaped follow-ups collapse
  into one row, "N legacy follow-ups; GAP decides the next step", linking to the account. Ops items are untouched.
  Microsite-intent rows drop their heat severity and recommended action.
- The drip writer stops minting tasks for restricted accounts.

### 9. Walmart (seller S, GAP Selling S)

Yard-modernization hiring (Walmart Careers R-2545651, R-2547672, R-2426277) is captured through the existing signal
path as hiring signals, dated, publisher named, "could not verify at the source" where the posting is gone. They appear
in WHY NOW as signals and can name an initiative owner for WHO; they never become a fact about a yard problem.
