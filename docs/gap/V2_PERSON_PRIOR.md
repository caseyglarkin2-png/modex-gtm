# GAP V2 person prior: who Casey sells to best

STATUS: ACTIVE (V2, 2026-10-02; OPERATOR-FIRST COLD WHO correction 2026-10-04, below)
<!-- verified:2026-10-05 -->

Casey's seller learning from live selling (JOC: Sub-Zero, World Market): the strongest person is the **US / North
America leader who operates transportation and the physical freight network** at an enterprise shipper. That leader
has to connect the TMS, warehouse execution, facility handoffs and the yard, gate and trailer state.

It is a PRIOR, not a gate and not a score. Code: `src/lib/gap/people/person-prior.ts`. It is the ONE WHO comparator:
the account brief's WHO, the buyer map and the cockpit's suggested primary all read it, so they cannot disagree.
Since 2026-10-04 the prior has two outputs: the ORDER (who ranks above whom, for the whole buyer map) and COLD WHO
ELIGIBILITY (`isColdWho`: who may be the default cold first touch). See "Operator-first cold WHO" below.

## The order (first difference wins; never a number)

1. Buyer truth: the person who answered, or a confirmed champion.
2. Relationship: an introduction, or someone Casey met.
3. Explicit initiative ownership in a live signal (for example, a named yard-modernization leader).
4. Not another region's stated remit.
5. Lane: primary operator > adjacent operator > facility / yard operator > executive sponsor > transformation /
   technology > security / risk > needs review > procurement / commercial > not an operating role.
6. Named ownership: transportation / fleet / freight by name > logistics or distribution (primary lane); explicit
   freight, fleet, logistics or yard scope > generic (transformation / tech lane).
7. Not based outside North America.
8. Scope: network > not stated > one site.
9. US market (2026-10-04): a US / North America remit or US-based > Canada or Mexico only > unknown. Unknown is never
   foreign; this never outranks the lane or named ownership.
10. Seniority, last.

## Lanes

| Lane | Archetype | Examples (title patterns) |
|---|---|---|
| PRIMARY OPERATOR | owns transportation, freight, fleet or network logistics execution | Director Global Transportation & Warehousing; NA Transportation Operations Director; Senior Director NA Transportation, Warehousing, Private Fleet; Director, Dedicated / OTR Transportation; Director Transportation & Distribution; Sr Director Global Logistics and Transportation; P&G "Sales Logistics" (customer-delivery logistics) |
| ADJACENT OPERATOR | supply chain, distribution, DC, warehouse, fulfillment or network operations without stated transportation ownership | VP Supply Chain; VP Operations; Director of Supply Chain; Director, DC Operations |
| FACILITY / YARD OPERATOR | runs one site | Plant Manager; DC Manager; Yard Manager |
| EXECUTIVE SPONSOR | the executive over supply chain or operations | Chief Supply Chain Officer; CSCO; COO |
| TRANSFORMATION / TECH | transportation or supply chain technology, automation, TMS / WMS, RTLS, yard modernization; the technology executive; PepsiCo "S&T" (strategy and transformation) | Director of Distribution and Transportation Systems; VP Strategy & Transformation, Global Transportation & Fleet; Sr Director, S&T North America Deployment - Transportation; Senior Manager, Automation Engineering; CIO (freight scope only counts for the tech slot: a CIO or "Supply Chain Transformation" is generic) |
| SECURITY / RISK | safety, security, risk, claims | Transportation Safety Manager |
| PROCUREMENT / COMMERCIAL | buys, prices, funds or governs transportation | Transportation Strategic Sourcing; Transportation Category Director; Finance Director, Transportation; Director Trade Compliance; Transportation Compliance Manager; Transportation Sustainability; Purchases Transportation and Warehousing (compliance, sustainability or safety BESIDE a transportation / logistics function is a second remit, not this lane: see mixed titles below) |
| NOT AN OPERATING ROLE | "Transportation" names a product, market or business unit; R&D, sales, regulatory; generic IT; outside the operating line | Transportation & Electronics Business Group; Transportation Markets; Transportation SBU; Transportation Sales Director; R&D Industrial & Transportation; Identity and Access Management; Board Director / Former EVP; Operations Manager, CEO Office |
| NEEDS REVIEW | the title does not say; store operations; support and planning roles | Director - Operation Manager (Directeur D'exploitation); VP Store Operations; Supply Chain Planning Manager |

At a carrier, 3PL, port or terminal, whoever runs the physical network (operations, terminal, yard) is the primary
operator; a shipper title taxonomy is not forced onto them.

## When the prior yields

- **Signals override it:** a live signal names the owner of the initiative (a yard-modernization or AutoGate role).
- **A relationship overrides it:** a credible introducer or someone Casey met beats a cold "perfect title". For a
  warm-intro-only account (Dannon), the introduction is the NEXT and WHO names the introducer.
- **Buyer truth overrides everything:** the person who answered, or a confirmed champion.

When no primary operator is on record, research asks for one: who owns transportation operations in the US / North
America, transportation and warehousing, the private fleet, distribution transportation or network logistics
execution. It looks in HubSpot contacts and candidates first, then public sources. Candidates surface for Casey, and
no contact is created automatically.

## Geography (amendment 2026-10-03)

North America is the United States, Canada and Mexico (generic Latin America is not). A person's LOCATION (their own record) and OPERATING REMIT (the region their title says they
run) are separate facts; the geography state is NA_REMIT / US_CONFIRMED / CANADA_CONFIRMED / MEXICO_CONFIRMED / OTHER_REGION / UNKNOWN.
The remit decides when stated, else the location, else unknown (never a company HQ). The three North America states
are one ranking tier after the lane, so a located-in-North-America adjacent operator never beats a transportation
owner whose location is unknown. Golden WHO re-run on the new comparator (production read-only, 2026-10-03): the same
best person and alternate on all eight GAP accounts below (their GAP records carry no location; geography reads
"location / remit unknown" and never decides). UNKNOWN is a valid state: the Apollo candidate list proposes, Casey
decides, GAP never spends.

## Dogfood: Casey's 78-contact HubSpot sample (read-only, nothing written back)

`npx tsx scripts/gap/person-prior-dogfood.ts <export.json> --rows`. The export's City / Country columns are the
COMPANY's, so person geography came from the title only.

| | All 78 | Without P&G (44) | P&G only (34) |
|---|---|---|---|
| Primary operator | 41 | 26 | 15 |
| Adjacent operator (incl. facility) | 3 | 2 | 1 |
| Transformation / tech | 10 | 1 | 9 |
| Procurement / commercial | 11 | 5 | 6 |
| Non-operating false positive | 12 | 10 | 2 |
| Needs review | 1 | 0 | 1 |
| US / NA confirmed | 7 | 0 | 7 |
| Other region | 13 | 6 | 7 |
| Location unknown | 58 | 38 | 20 |

- 26 companies; Procter & Gamble is 34 of 78 (44%).
- **P&G distortion:** P&G holds 9 of the 10 transformation / tech titles (its IT and digital organization uses
  "Transportation" in IT titles), all 7 US / NA-stated remits, and the region spread (Europe, Latin America). Without
  P&G the sample is 59% primary operators and the false positives come mostly from 3M (product business units) and
  Velcro (category, R&D, SBU).
- **Strongest primary-operator patterns:** "Director (of) (Global) Transportation", "Transportation (&|and)
  Warehousing / Distribution / Logistics", "Dedicated" or "OTR Transportation", "Private Fleet", "Transportation
  Operations", "Outbound Transportation". The three US / NA-stated primary operators are all P&G: NA Transportation
  Operations Director; Senior Director NA Transportation, Warehousing, Private Fleet; Fem Care North America
  Transportation & Warehousing and Inventory Director.
- **False-positive patterns:** sourcing / category / purchasing; finance and cost; trade compliance; sustainability;
  a product business unit or market named "Transportation" (3M Transportation & Electronics, Commercial Branding &
  Transportation, Velcro Transportation SBU); R&D; sales; IT and software engineering with "Transportation" in the
  title.
- 34 of 41 primary operators state no region: Casey should expect "US location unknown" to be the common case until
  person-level location is captured.

## Golden accounts (production, read-only, 2026-10-02; nobody contacted)

HISTORICAL for the rows the 2026-10-04 correction changed (PepsiCo, World Market, Sub-Zero, General Mills, Kroger):
see "Operator-first cold WHO" for the current answers.

`npx tsx scripts/gap/who-golden.ts <names...>` (GAP personas, contact candidates, work-source members); Sub-Zero and
World Market from HubSpot contacts (not GAP accounts).

| Account | Best first person | Why | US / NA | Operating owner? | What would change it | Alternate |
|---|---|---|---|---|---|---|
| Sub-Zero | none on record | HubSpot has an innovation director, the CIO and a process-engineering VP only; the JOC contact is not in HubSpot under Sub-Zero | n/a | no | adding the JOC transportation contact (Casey) | VP of IT / CIO (technology sponsor) |
| World Market | VP of Global Supply Chain | adjacent operator, network scope; no transportation title on record | US (contact record) | adjacent | titles for the two email-only contacts (likely the JOC conversations) | Director of Supply Chain |
| Walmart Inc. | none on record | 4 Inland26 members and 3 candidates, all without titles | unknown | unknown | the yard-modernization hiring signals naming an initiative owner; titles for the Inland26 contacts | none |
| PepsiCo | a VP Supply Chain | 12 adjacent operators (VP Supply Chain), one CSCO (NA Beverages, sponsor), a transportation safety manager (security / risk); no transportation owner on record | unknown (the CSCO's remit is NA) | adjacent | a Frito-Lay or PBNA transportation operations owner (division first, see operator review) | another VP Supply Chain |
| General Mills | VP, Supply Chain | adjacent; no transportation title on record | unknown | adjacent | a transportation or logistics operations director | D&T manager, supply chain |
| Tyson Foods | Director of Transportation | primary operator, network scope | unknown | yes | a NA remit or a relationship | VP Supply Chain |
| Kroger | none (in a deal) | planning manager, sourcing category manager, business development: no operating owner | unknown | no | the deal's champion (buyer truth wins) | none |
| Crowley | Director Fleet Operations | primary operator (carrier: the fleet is the operation) | unknown | yes | the deal's champion (in a deal) | VP of Operations |
| GXO (3PL) | Regional Transportation Operations Manager | primary operator at a 3PL | unknown | yes | a NA operations VP when Scout records GXO as a 3PL (operations then read as primary) | VP of Operations |
| Performance Food Group | Corporate Transportation and Training Methods Manager | primary operator | unknown | yes | a director-level transportation owner | Transportation Manager |

Defects the golden probe caught and fixed before release: "Vice president" read as an executive (also in the old
seniority helper); a transportation safety manager read as the freight owner; store operations read as an operator.

## Operator-first cold WHO (seller dogfood correction, 2026-10-04)

STATUS: SHIPPED 2026-10-05 (#394, merge 87128cc2; production deployment READY and verified live: the NOW sponsor / alternate line renders on /gap/accounts/john-deere/). Driver: Casey using GAP on PepsiCo, which recommended Michelle
Schlie (Vice President Supply Chain). Correction: **functional ownership beats generic supply-chain seniority.** The
cold first touch goes to whoever runs physical freight execution across facilities. Persona seeds (never hard-coded):
Mark Marshall, Transportation Operations Manager, Sub-Zero Group (Madison, WI); Jarrod Black, Director, Logistics,
World Market (Stockton, CA).

### Root cause (production, read-only repro)

The account brief already read all 542 PepsiCo HubSpot people (not truncated; cap 1000) and ranked a Sr Director of
Transportation first. Two other paths did not:

1. **The cockpit** (`motion/account-motion.ts`) ranks only READY cards, and cards exist only for GAP contacts that
   pass the legacy generic routing role gate (`routing/inputs.ts roleGateFor`). At PepsiCo those were four
   "vice president supply chain" personas and a specialist. The cockpit read no person location, so the four
   identical titles tied and Michelle Schlie won on NAME ORDER ("michelle" before "mohamed"); a first-touch Gmail
   draft to her was created on 2026-10-05 00:26 UTC and is still outstanding (it now holds the account; send or delete
   is Casey's call).
2. **The brief's fact-led motion WHO** chose among GAP contacts only, in any operating lane (`isDefaultWho`), so it
   also named the VP Supply Chain.

Not the cause: the cache, the PepsiCo company association, a HubSpot read failure or title parsing. Himanshu Gupta
(Director of Transportation) was in the 542 and ranked as a primary operator; his location is not on record, so
US-confirmed peers rank first.

### The contract

| Slot | Rule (`person-prior.ts`) | Cold first touch? |
|---|---|---|
| DIRECT OPERATOR | PRIMARY_OPERATOR: transportation, freight, fleet, OTR, dedicated, linehaul, middle mile, inbound / outbound, LD&T, logistics operations, network logistics, physical distribution, "transportation & warehousing / distribution / logistics"; "logistics" alone at director / VP / head. Manager to SVP; seniority never decides the lane. At a carrier / 3PL / terminal, whoever runs the physical network. | **Yes** (the default) |
| TRANSPORTATION TECH / TRANSFORMATION | TRANSFORMATION_TECH with explicit freight, fleet, logistics or yard scope (`ownership 2`). Generic innovation, IT, digital or "Supply Chain Transformation" is not. | Only with a named initiative (a live signal) |
| SPONSOR | `isSponsor` (one rule for the brief, the cockpit and research): EXECUTIVE_SPONSOR (CSCO, COO), a VP in an adjacent lane (VP Supply Chain, VP Operations), or a director whose title says supply chain or network; never a warehouse / DC director or a non-freight "operations" title | No: buyer map, alternate |
| FACILITY OPERATOR | plant, DC, warehouse, yard, site | Only for a site-scoped motion |
| NOT A TARGET | procurement, sourcing, category, finance, freight audit / payment, transportation contracts, rate management, spend, budget, compliance-only, safety-only, sustainability-only, HR, recruiting, attorneys, communications, legal, marketing, store operations, "operations" of another function (people, revenue, commercial, customer), generic IT, generic innovation, R&D | No |

`isColdWho(read, { initiative, siteScoped })` encodes the right column; it also refuses another region's stated remit
and anyone based outside North America (they stay in the buyer map; Apollo proposes the NA owner). The buyer map
(`isDefaultWhoLane`, the lanes) is unchanged. **Not yet wired:** no caller supplies `initiative` or `siteScoped` today
(the brief has no per-person initiative evidence and no site-scoped motion flag), so in production only a direct
operator is cold WHO; a transportation tech owner or a site operator leads only by Casey's explicit choice in the
cockpit (a Plant Manager GAP contact that used to be the fact-led WHO is now "research required" with them in the
buyer map). Wiring either branch is a deliberate next decision, not a default.

**With no direct operator on record** WHO says "Transportation owner not yet identified: research required" and names
the sponsor as the alternate. It never promotes the broadest senior title.

**Mixed titles.** Compliance, sustainability or safety JOINED to a transportation or logistics function by a
conjunction or list is a second remit, and the operating function decides ("VP Global Transportation and Compliance",
"Director Transportation Operations & Compliance", "VP Logistics and Transportation Compliance", "VP Transportation &
Safety", "VP Fleet Safety & Operations", "Senior Director, Transportation Compliance & Operations" are direct
operators; the 2026-10-02 rule that put "Director, Transportation & Trade Compliance" in procurement is superseded).
Sourcing, procurement, purchasing, category, finance, cost, pricing, audit, payment, contracts, rates, spend and budget
always win ("VP Transportation Procurement", "Director, Freight Audit & Payment" stay commercial). A governance remit
that only MODIFIES the function ("Transportation Compliance Manager", "Transportation Safety Manager", "Director, Fleet
Safety") or names it as a trailing DEPARTMENT ("Safety Manager - Fleet", "VP Safety, Transportation", "Compliance
Director, Logistics", "Director, Trade Compliance - Transportation") is not an operator (review B1).

**US-first** among comparable people, for Casey's current cold motion: function, then named ownership, then not
outside North America, then scope, then the US market (a US / NA remit or US-based > Canada or Mexico only > unknown),
then seniority. A Canada direct operator beats a US VP Supply Chain; a US Director of Transportation beats an equal
Canadian one; a title naming only Mexico or Canada is not the US market. Canada and Mexico stay North America and still
rank above unknown (the 2026-10-03 tier, now split for the tie-break only).

**Override hierarchy (unchanged).** Buyer truth > relationship > named initiative > the prior. A conversation, a
referral, someone Casey met or an intro-only route is its own motion and names its own person.

### Where it is enforced

- Cockpit (`motion/account-motion.ts`): new state `needs_owner`. No card whose person is a cold WHO: nobody is
  suggested, every email card is held (never READY, so no "Contact X" task), the sponsor (by `isSponsor`) is named,
  the headline points at the BRIEF buyer map (it may name a HubSpot operator to add), and only Casey's explicit choice
  ("Make X the primary") makes one primary, including after an unanswered touch unlocks the next person. A NEXT person
  who is not a direct operator says "then only by your choice". The cockpit ranks cards with each person's own HubSpot
  location (`loadCockpitMotions` batch-reads it where an account has more than one ready card; cached 15 minutes;
  fail-soft to unknown), so US-first is the same as in the brief.
- Brief (`account-intel/build.ts`): `people.primary` is a cold WHO or null; new `sponsor`, `tech`, `site`,
  `ownerMissing`; the fact-led motion WHO is a GAP-contact operator only; a nameless HubSpot record fills no slot; no
  slot is filled by someone based outside North America; when HubSpot returned only the first 1000 (capped) contacts,
  "research required" says the owner may be beyond them.
- NOW shows the sponsor / alternate when WHO is unknown; the research plan names the sponsor as "best on record now".
- Apollo (`people/apollo-candidates.ts`): FIND_OWNER names the sponsor as the nearest person on record; a HubSpot-only
  operator whose HubSpot record already has an email is "add them as a GAP contact (no credit needed)", never
  FIND_EMAIL. Automated spend stays zero (`apollo-policy.ts`, unchanged).
- Contact discovery (`src/lib/discovery/research.ts`): the prompt fills explicit slots in order (direct operator,
  transportation tech / transformation, one sponsor, optional site operator); every person needs a source URL; the
  slot is re-read by the person prior, never the model; the prior ranks within a slot (anyone based outside North
  America last); at most 2 per slot (3 site / regional operators near a facility, for /discovery's local leaders); an
  email survives only with the page that published it.
- Diagnostic: `npx tsx --env-file=<.env.local> scripts/gap/operator-contact-audit.ts "PepsiCo" ...`
  (`people/operator-audit.ts`): a view over the same buyer map and Apollo projection, never a second authority.
  `--research` runs the grounded discovery above for an account with no operator (no Apollo, no writes); `--stage`
  stages a sourced, not-already-known DIRECT operator as a NEW AccountContactCandidate (`state: staged`,
  `recommended: false`; an existing row in any state is reported, never overwritten) for Casey to verify and promote.
  Never a Persona, a HubSpot contact, a send or an enrollment.

### PepsiCo after the fix (production, read-only, 2026-10-04)

HubSpot people read 542 (not truncated), 19 GAP contacts, 0 staged. Direct-operator candidates 26 (20 in North America
or unknown, 6 outside it). Primary **Isaac Scott, Sr Director of Transportation - Frito-Lay** (US; HubSpot only: add
him as a GAP contact; his HubSpot record has an email, so no Apollo). Alternate Karen Darling, Senior Director - PBNA
Transportation. Tech / transformation Amy Lewis, Sr Director, S&T North America Deployment - Transportation (NA remit).
Sponsor Jeremy Johnson, VP Supply Chain (GAP). Site Andrew Sippy, Supply Chain Manufacturing Plant Director - Tulsa.
Michelle Schlie is
adjacent (VP Supply Chain, transportation ownership not stated): not cold WHO, buyer map / sponsor. Himanshu Gupta is
present, 15th of 26 operators (location unknown). Divisions evidenced among the operators: Frito-Lay and PBNA (from
their own titles). The cockpit for the same five cards, without the outstanding draft: `needs_owner`.

### Dogfood (production, read-only, 2026-10-04; nobody contacted, nothing written)

| Account | Direct operator | Title | Geography | Source | Tech / transform | Sponsor | Unresolved | Apollo ask |
|---|---|---|---|---|---|---|---|---|
| PepsiCo | Isaac Scott | Sr Director of Transportation - Frito-Lay | US | HubSpot | Amy Lewis (S&T NA Deployment - Transportation) | Jeremy Johnson, VP Supply Chain | none | none (email in HubSpot) |
| World Market (HubSpot only, not a GAP account) | Derek Hung / Jarrod Black | Global VP, Transportation & Compliance (public LinkedIn, not in HubSpot) / Director, Logistics | US / US | public / HubSpot | none | Mitch Asher, VP Global Supply Chain | Derek Hung not in HubSpot | n/a (not a GAP account) |
| Sub-Zero (no HubSpot company; contacts by company field) | Mark Marshall | Transportation Operations Manager | US | HubSpot | none (the CIO has no freight scope) | none | company record | n/a |
| General Mills | Phillip West | Senior Director, North America Logistics | NA remit | HubSpot | none | Nisar Ahsanullah, VP Supply Chain | tech / transform | none (email in HubSpot) |
| Tyson Foods | Rick Barrett | Director of Transportation | unknown | GAP | none | Brandon Campbell, VP Supply Chain | tech; no HubSpot company link | CONFIRM_TITLE (Ryan Heman, met at Inland26) |
| Kroger | Ranor Relatores | Senior Director of Transportation | US | HubSpot | John Winkels (Logistics Engineering & Network Strategy) | Ben Hamilton, VP Interim Supply Chain Leader | none | none |
| Walmart Inc. | Christina Mannella | Sr Director - West Transportation Command Center | US | HubSpot | Jason Horn (Operations & Automation, Global Logistics) | Adam Dunbar, VP Supply Chain Operations Support | none | none (email in HubSpot) |
| The Home Depot | Ryan Holden | Director, Transportation | US | HubSpot | Samuel Garduno Carrasquedo (IT Supply Chain, Transportation) | John Deaton, EVP Supply Chain | none | none (email in HubSpot) |
| Niagara Bottling | Ryan Kieczykowski | Sr. Director of Logistics | US | HubSpot | none | Bhaskar Tatke, VP Supply Chain Planning | tech | none (email in HubSpot) |
| Frito-Lay | Beth Mars | Transportation Director | US | HubSpot | none | Brian Watson, VP Supply Chain | tech | none (email in HubSpot) |
| UNFI | David Wolf | Sr. Director Transportation | US | HubSpot | none | Brien Craft, Regional VP Operations | tech | none (email in HubSpot) |
| Kraft Heinz | Nicholas Riolo | Transportation Manager | US | HubSpot | Adam Roth (Logistics Projects and Technology) | Rachel Pugliese, Director of Supply Chain Operations (a nameless HubSpot record is skipped) | none | none |
| Procter & Gamble | Emily Rampe | Senior Manager NA PHC Transportation & Warehousing Leader | NA remit | GAP | none | none | tech, sponsor; no HubSpot company link | none |
| Sysco | Jack Garland | Director Transportation | unknown | GAP | none | John Archibald, VP Supply Chain | tech; no HubSpot company link | none |
| John Deere | none | (35 HubSpot people: operations, warehouse and a "Logistics Manager", none a direct operator) | | | none | Zachary Wenzel, VP Supply Chain | direct operator | FIND_OWNER |
| Hormel Foods | none | (11 GAP contacts; the logistics director is do-not-contact) | | | none | none | direct operator; no HubSpot company link | FIND_OWNER |
| Conagra Brands | none | | | | none | Alexandre Eboli, EVP and CSCO | direct operator | FIND_OWNER |
| Coca-Cola | none | | | | none | none | everything; no HubSpot company link | FIND_OWNER |

Systematic patterns: (1) the best operator is usually already in HubSpot and only needs adding as a GAP contact (9 of
the 12 GAP accounts that have one; Target has no GAP account); (2) the transportation tech / transformation slot is the commonest gap; (3) accounts with no
HubSpot company link (Tyson, P&G, Sysco, Hormel, Coca-Cola, Conagra) see only GAP contacts. Source-backed research
(`--research`, read-only) on the four unresolved accounts returned no direct operator: John Deere 0 and Coca-Cola 0
people; Hormel one sponsor (its public leadership page lists Will Bonifant as Group VP, Chief Supply Chain Officer,
while GAP holds a stale "Director of Logistics" title on a do-not-contact record); Conagra one plant manager. Nothing
was staged. Research source dates are model-reported and unverified (Conagra's equalled the run date).

### Deliberate boundaries (recorded for the next seller decision)

- A bare "Logistics Manager" stays adjacent (often warehouse or plant logistics); "Logistics Operations Manager",
  "Network Logistics Manager" and "Director, Logistics" are direct operators. John Deere's "Logistics Manager" is why
  it reads unresolved.
- Canada- or Mexico-confirmed ranks above location-unknown (the 2026-10-03 North America tier); US-first only orders
  US above them.
- Staged AccountContactCandidates are not yet in the brief's buyer map (Apollo and the audit read them); a staged
  operator does not become WHO until Casey promotes it.
- The legacy routing role gate still creates cards for VP Supply Chain personas; the cockpit now holds them
  (`needs_owner`) instead of suggesting them.
- A bare "Manager, Transportation Planning" is NEEDS_REVIEW (a planning role) while a director of it is an operator,
  and director-and-above get network scope inferred: scope ranks before the US market, so between two operators a
  director outranks a manager before geography does. Seniority never moves a title INTO the operator lane except for
  bare "logistics" (above).
- The HubSpot people read is the one company record, capped at 1000 in association order; contacts on child-company
  records are not read. The brief now says when the cap was hit; it does not yet read child records.

### Adversarial review (fresh reviewer, 2026-10-04)

BLOCKER B1 (a trailing department made compliance / safety / sustainability-only titles operators): FIXED, conjunction
rule above, mutation-proven. SHOULD FIX, all FIXED: S1 the needs_owner choice after an unlock was a no-op; S2 the
headline called any card the sponsor; S3 the cockpit ranked without location while the brief applied US-first; S5
freight audit / payment / contracts / spend / budget, HR, recruiting and attorneys read as operators; S6 any
"operations" title at a carrier or 3PL was the operator, and "VP Commercial Operations" could be the sponsor; S7 the
/discovery slot filter dropped local plant / DC leaders and filed regional operations managers as the sponsor. S4 (the
initiative and site-scoped branches are unreachable) is DOCUMENTED above as not yet wired, deliberately. NICE TO HAVE
fixed: N1 the NEXT unlock promise, N2 out-of-market research ordering, N3 staging is never "recommended", N4 "S&T" and
visibility / orchestration scope, N6 labels, out-of-market slots, the staged-row message and the doc's EOF; the cap
warning (question 8). Recorded, not fixed: N5 above. REJECTED by the reviewer after checking (no defect): a VP Supply
Chain beating a Director of Transportation on any path except Casey's own choice; bare "operations" or "innovation" as
cold WHO; procurement masquerading; hard-coded names; US preference over function; any Apollo spend; any create /
send / enroll without Casey; regressions in the relationship, referral, follow-up, in-deal and intro-only motions.

Re-verification by the same reviewer (2026-10-05): **no blockers**; B1 confirmed fixed. Its SHOULD FIX items, all
FIXED: C1 two governance remits with a function word on the second ("Safety & Fleet Compliance Manager") still read as
operators; C2 "Confirm X as primary" also recorded the shown non-operator NEXT as Casey's choice (NEXT now carries
`byChoiceOnly`, and `confirmChoiceBody` records it only when they would unlock on their own; an older primary choice
never unlocks anyone after a later touch); real operators the first fixes demoted (logistics joined to customer
operations, budget or spend beside a freight operations remit, a carrier's dedicated contracts). Also fixed: the
cockpit's location read times out after 3 s; "people operations" is not an operating role; intermodal and rail
operations are freight. Recorded, not fixed (they fail closed, never as wrong outreach): parenthesised or slashed
mixed titles ("Director, Transportation (Safety & Compliance)", "Director Transportation/Compliance") read as
commercial; "Director, Fleet & Transportation Compliance" (function and function-scoped compliance) reads as an
operator, the same shape as "VP Logistics and Transportation Compliance", for Casey to rule on; the brief reads a
persona's location only through the company's associated contacts while the cockpit reads it by contact id.

## Owner resolution, the carrier doctrine and contact currentness (2026-10-05)

STATUS: see `docs/gap/OWNER_RESOLUTION.md` (canonical). Two amendments to this prior landed there:

- **Account-type-aware lanes.** For a carrier, 3PL or terminal operator the physical network is the product: network,
  hub, terminal, station, linehaul, surface, ground, air network, operations planning and engineering, network
  planning, sortation, facility operations and operations engineering are PRIMARY operators; operations technology
  with a freight scope is TRANSFORMATION TECH; a bare "Operations" title counts only with a stated scope (district or
  station is SITE); enterprise, North America and network scope rank above a local station; the air side sits behind
  the ground network owners on named ownership. Shipper rules are unchanged. A reviewed constant sets divested
  entities aside (FedEx Supply Chain) and flags separate operating companies with a caution.
- **Currentness is a WHO dimension.** WHO eligibility = responsibility fit AND current employment at the account; the
  departed and the conflicted are set aside before the ranking with the reason, and among the eligible, currentness
  breaks ties after scope and seniority. A HubSpot modified date and an email domain never prove currentness.

<!-- verified:2026-10-05 -->
