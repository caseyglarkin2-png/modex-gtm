# GAP owner resolution: make the right WHO actionable

STATUS: ACTIVE (seller dogfood correction, 2026-10-05; second correction, WHO truth maintenance, the same day: the
last section). Canonical for owner resolution, contact currentness, role currentness, purpose-specific ranking,
corporate-family coverage, aliases, account kind, legacy suppression review, ADD TO GAP, the outstanding-draft
remediation and the FedEx / Walmart / PepsiCo / H-E-B acceptance. Prior doctrine: `docs/gap/V2_PERSON_PRIOR.md`. Rules
that must not change: `docs/gap/STABLE_BASELINE.md`. Ledger line: `docs/GAP_PROSPECTING_OS.md`.
<!-- verified:2026-10-05 -->

Driver: Casey using GAP on PepsiCo and FedEx, then Walmart and H-E-B. GAP could name the better operator and could
not turn that into a person, a hypothesis owner or a routing motion. Not a redesign, not a new CRM, not a scoring
engine: one read service, a few governed actions, and the controls where the instructions used to stand.

## Root causes (production, read-only repro, 2026-10-05)

1. **PepsiCo.** NOW named Isaac Scott (HubSpot 219885493392, Sr Director of Transportation - Frito-Lay) as the better
   operator with an instruction ("add them before any touch") and no control. The first-touch Gmail draft to Michelle
   Schlie (decision `cmurhhob4001wjq04nv3iysa8`, draft `r7108052208134565800`, created 2026-10-05 00:26 UTC) held
   the account's cold motion with no way to discard it in the product. Isaac already existed as persona 13 at the
   Frito-Lay GAP account (legacy do-not-contact and a bounced status from the March blast; later sends delivered).
2. **FedEx and Walmart (systemic).** A hypothesis proposed from Research Next is an account-level row
   (`primary_persona_id` null). Activation requires a person. Nothing bridged the gap, so Approve + use answered with
   the raw machine word `no_persona`. Any APPROVED hypothesis without a person has the same shape.
3. **H-E-B.** Dakota Socha (persona 1306, HubSpot 218964806213, last modified 2026-08-18) ranked as the operator
   while their own profile and a directory place them at ADUSA Distribution (South Carolina). WHO had one
   dimension (responsibility fit); current employment at the account was not a dimension, and a HubSpot modified
   date read as if it proved currentness.
4. **Found while dogfooding the fix.** A provider or CRM spelling of the same employer ("NFI", "J.B. Hunt Transport
   Services, Inc.", "Pepsi", "Genmills", "Tyson", "Fed Ex Freight") read as another employer: every GAP contact at
   NFI Industries (35 of 35) and J.B. Hunt (25 of 25), PepsiCo's sponsor and two General Mills supply-chain
   officers were set aside as employment conflicts. Fixed before ship (below). Also found: the FedEx owner panel
   preselected a HubSpot-only Managing Director over 34 other eligible people, and likely-current transportation
   managers outranked an unverified Senior Vice President of Transportation Services. Both fixed before ship.
5. **Found by the fresh adversarial review (below).** The decision-time gate read less evidence than the panel (no
   live Apollo status), a person's own email domain counted as a spelling of the account, a HubSpot-only person
   Apollo marked moved out stayed eligible, a four-letter prefix could hide a departure ("Mars" / "Marsh McLennan"),
   an entity boundary fired on its own account, a carrier's hub and station managers read as "needs review", and a
   stale panel could still show a machine token. All fixed before ship.

## The contract

### One read: `resolveOwner` / `loadOwnerResolution`

`src/lib/gap/people/owner-resolution.ts` (pure) and `owner-resolution-load.ts` (reads). Purposes:
`COLD_FIRST_TOUCH` (NOW's HubSpot-only WHO), `HYPOTHESIS_ACTIVATION` (an approved hypothesis with no person),
`SITE_PILOT`, `TRANSFORMATION_INITIATIVE`. The result carries, in seller words: the account kind, the hypothesis
and what its fact is, the eligible owners ranked with one-sentence reasons (role, geography and scope, thesis fit,
employment, source, reachability), who was preselected (if anyone), the next step, everyone set aside WITH the exact
reason, the sponsor / tech / site slots, the other lanes, whether research is needed, and `apollo.allowed: false`
always. No hidden number: the order is the person prior's first-difference order.

### Where it is read

| Caller | Surface |
|---|---|
| NOW (`context/now.ts`) | A HubSpot-only WHO or a better fit carries ADD TO GAP (`components/gap/add-to-gap-button.tsx`). |
| The hypothesis drawer | An approved row with no person opens the owner panel (`components/gap/owner-resolution-panel.tsx`): ranked choice, USE / ADD + USE / attach only / FIND OPERATOR. Approve + use that the machine refuses for `no_persona` keeps the approval, says it in a sentence, and opens the panel. |
| `GET /api/gap/hypotheses/[id]/owner` | The read. `POST` runs the one governed action (`people/owner-action.ts applyOwnerToHypothesis`): import if needed, re-check eligibility, assign, activate, targeted shadow routing (`accountNames` + `personaIds`). |
| `POST /api/gap/people/find-operator` | Existing grounded research, filtered to direct operators; results become staged `AccountContactCandidate` rows (never a Persona, never an email guess, never Apollo). |

### The account-type-aware prior (`people/person-prior.ts`)

Shipper rules unchanged. For a carrier, 3PL or terminal operator the physical network IS the product, so these are
PRIMARY operators: network, hub, terminal, station, linehaul, surface, ground, air network, operations planning and
engineering, network planning, sortation, facility operations, operations engineering; operations technology with a
freight scope is TRANSFORMATION TECH. A bare "Operations" title counts only with a stated scope: district or station
is SITE scope; "scope not stated: may be one station or district" otherwise, with no seniority inference. Enterprise,
North America and network scope rank above a local station. A hub, station, ramp, sort, gateway, depot or service
center manager, director or supervisor is a primary operator of one site of the network (site scope; a director and
above of hub or station operations runs the network of them). Air-side roles ("Air Operations", flight, aircraft) are
the air side, behind the ground network owners; brokerage runs no hubs or yards. The reasons say which. A reviewed constant
(`people/entity-boundary.ts`) sets FedEx Supply Chain (the former GENCO, sold to CMA CGM 2026-10-01) aside as
divested and flags FedEx Logistics and FedEx Freight as separate operating companies: selectable with a caution, never
preselected.

### Thesis-aware selection (`people/thesis-relevance.ts`)

The fact's families (network program, site opening, automation / technology, fleet, air network, yard, generic) meet
the title's responsibilities: `direct`, `related` or `none`, each with a sentence ("runs the air network: the fact is
an air network change"). A technology or transformation person is eligible for a hypothesis only when the fact is an
automation / technology fact and the fit is direct. Relevance narrows roles; it never adds a number.

### Candidate order and sources

GAP contacts at the account (with their employment read) → every HubSpot contact associated with the account's
company (the linked company, or the one the account identity resolves by domain for unlinked accounts such as FedEx
and H-E-B; the read says which, and whether the cap was hit) → staged contact candidates → relationships → public
research on an explicit click (FIND OPERATOR) → an Apollo lookup is only ever proposed. A HubSpot email is used as it
is. Automated Apollo spend: 0.

### Who is set aside (shown with the reason, never silently dropped)

`no_name`, `left_company` ("Historical H-E-B contact. Current-employer evidence now points to ADUSA Distribution. Not
eligible for H-E-B outreach."), `employment_conflict`, `divested_entity`, `do_not_contact`, `unsubscribed`,
`opted_out`, `other_region` (the remit decides, not the desk).

### The human choice boundary

Nobody eligible → OWNER NOT RESOLVED and FIND OPERATOR. Exactly one eligible person with no caution → preselected
(USE for a GAP contact, ADD + USE for a HubSpot-only person); Casey still presses the button. Two or more eligible →
a ranked choice with reasons; nobody preselected; GAP does not pick. Rank order: buyer truth, relationship, a named
initiative, lane, named ownership, thesis relevance, region, scope, market, seniority, then currentness as the
tie-break, then reachability. The departed and the conflicted never reach the ranking.

### ADD TO GAP (`people/account-import.ts`, `POST /api/gap/people/import`)

One explicit click links ONE existing HubSpot contact into ONE named GAP account. Asserts: the account exists (never
created), the contact is associated with the account's HubSpot company (or the identity-resolved company), the email
domain is not blocked, the contact has not opted out of email in HubSpot (refused: the unsubscribe helper is the only
writer of do-not-contact). Dedupe by HubSpot id, then email at the account, then email anywhere: `created`,
`linked`, `already`, or `rehomed` within the corporate family only when the person has no history at the other
account (hypotheses, dispositions, BIDs, enrollments, ledger rows; a shadow routing decision is not history).
Refusals: `account_not_found`, `account_not_linked`, `contact_not_found`, `contact_not_associated`,
`blocked_domain`, `contact_opted_out`, `persona_at_other_account`, `hubspot_unreadable`, each with seller copy.
Legacy flags on a linked record (do-not-contact, a bounced status) are reported, never cleared here. Never writes
HubSpot. Never calls Apollo. Idempotent. Audited (`person.imported_from_hubspot`).

### Audited persona assignment on an APPROVED hypothesis (`hypothesis/assign-persona.ts`)

Records the hypothesis id, prior and new `primary_persona_id`, actor, timestamp, reason `owner_resolution` and the
evidence (`HypothesisEvent` action `assign_persona`, audit `hypothesis.persona_assigned`). Refuses
`persona_not_at_account` (the same canonical account only), `hypothesis_in_use` (frozen once active),
`persona_do_not_contact`, `recipient_unsubscribed`, `persona_left_account`, `persona_employment_conflict`,
`stale_status`, `same_person`. Approve + use with no person: the approval stands, owner resolution runs.

### Contact currentness (`people/employment.ts`, `employment-store.ts`, `employment-gate.ts`)

WHO eligibility = responsibility fit AND current employment at the account. States: `CURRENT_CONFIRMED`,
`CURRENT_LIKELY`, `CURRENT_UNVERIFIED`, `EMPLOYMENT_CONFLICT`, `LEFT_COMPANY_CONFIRMED`. Evidence hierarchy: strong
(the person's own profile, an employer page, an announcement, a speaker bio, a buyer interaction, Casey); supporting
(an industry bio, a contact provider, the CRM); weak (a directory, an aggregator, an email domain, a modified date,
an old post: ignored). A human answer decides. Strong evidence: the newest placement wins; a disagreement within 30
days or undated is a conflict. Supporting evidence elsewhere is a conflict; two consistent supporting rows are
likely; the CRM alone is unverified. A HubSpot `lastmodifieddate` never proves anything. Provenance reuses
`ContactEnrichment` / `ContactEnrichmentField` (`employment_status`, `employment_company`, `employment_title`,
`employment_source_url`, `employment_note`; source manual for Casey, derived for a verification, apollo / hubspot
for the intakes). Verified at decision time, fail closed on LEFT / CONFLICT: the seller draft, cold outbound, enroll,
routing inputs (`skip`), persona assignment and the owner action. The gate reads the SAME evidence the owner panel
reads: the record, the account's own names and domains (`accountEmploymentContext`: aliases, the parent brand, the
child accounts, canonical domain links and an email domain two or more of the account's contacts share; one person's
address never counts), and the person's linked HubSpot row where Apollo's sweep writes `apollo_employment_status`
(one cached batch read, 3 s timeout; unreadable means decided on the record, and the refusal says so). A HubSpot-only
person is read the same way, so Apollo's moved_out sets them aside in the panel and in the brief. Stale employment
changes the ranking upstream (set aside before the list), not only the send gate.

Employer spellings: a provider or CRM variant of the same employer is HERE (`sameEmployer`): the canonical match;
the shorter spelling (three letters, or any length with a digit) exactly the LEADING WORDS of the other ("NFI" /
"NFI Industries", "fed ex" / "FedEx", "j b hunt" / "J.B. Hunt Transport Services", "heb" / "HEB Grocery Company",
"3M" / "3M Health Care"); one word made of the other plus a legal tail ("pepsi" + "co", and "PepsiCo" against
"Pepsi - Gatorade Division"); the same distinctive first word (a division, subsidiary or banner: "NFI Logistics",
"Estes Forwarding" under Estes Express); or the account's own domain label ("Genmills" through genmills.com). A partial
word never matches ("Mars" is not "Marsh McLennan" or "Marshalls", "Ford" is not "Fordham", "Amazon" is not
"Amazonia"), a generic or common brand word never matches alone ("General", "American", "Delta", "Pioneer"), and
hyphenated families or banners with their own name ("Knight-Swift", "Central Market" at H-E-B) match through aliases.
Known limit, stated in the tests: an unrelated company sharing the whole first word ("Target Hospitality" at Target)
reads as the same employer; a departure to one is caught by strong evidence or by Casey. "ADUSA Distribution" beside
an H-E-B record is still a conflict, whatever address the record carries.

Human feedback is first-class: THIS PERSON LEFT and CURRENT ROLE IS WRONG (`components/gap/employment-control.tsx`,
`POST /api/gap/personas/[id]/employment`) record an audited correction (actor, timestamp, old account and title, new
company and title, source URL, note; audit `person.employment_corrected`), remove the person from outbound
eligibility immediately, never rewrite HubSpot, never delete, never touch do-not-contact or the email status. A human
correction stands over any later automated verification. VERIFY CURRENT ROLE (`employment-verify.ts`, grounded
search) records a derived verification only with a source URL; without one it is audit only. Apollo CONFIRM TITLE is
proposed, never run. The person may become a candidate at the new employer; a new account is never created for it
(ADUSA Distribution is reported as an opportunity, not made canonical).

### Draft remediation (`execution/draft-discard.ts`, `components/gap/outstanding-draft-panel.tsx`)

The outstanding GAP-created first-touch draft that holds an account shows who it is to, Open in Gmail, and a
confirmed Discard with a reason (`stale_pre_operator_who_draft`, `wrong_person`, `copy_outdated`,
`seller_discard`). Discard touches ONLY the exact draft the ledger proves (decision, draft id and recipient must
agree), records `execution.gmail_discarded`, and never unsubscribes anyone. Gmail not found → `reconciled`
(`execution.gmail_vanished`), never inferred as discarded.

### Seller UX

No machine tokens reach Casey: `no_persona` reads "Approved. GAP needs a person to test this with before it can
route."; every refusal the owner action, the import, the discard and the employment controls can answer has a
sentence (`ui/refusal-copy.ts`, pinned by `refusal-copy-coverage.test.ts`); a suffixed code reads through its prefix
and the exclusion's own sentence stands in as the why, so a USE click after the person was corrected in another tab
reads "Nothing was attached or routed. Historical H-E-B contact ..." and never a token. A departed person reads as a historical contact in NOW and in
the owner panel's set-aside list, never as WHO, never as the alternate, never as the motion person.

## Dogfood (production, read-only, 2026-10-05; nobody contacted, nothing written, no credit spent)

`scripts/gap/owner-resolution-dogfood.ts`. Every account below answered `choose` (two or more eligible): GAP does not
pick. Final run after the review fixes: 8 currentness set-asides across the ten accounts, all substantive: 4 where
Apollo's sweep says the person moved (a PepsiCo Latam CSCO, a Tyson SVP, two Walmart people) and 4 where the CRM
company names a banner or subsidiary with its own name and no alias yet (SDR Distribution at NFI, Central Market at
H-E-B, King Soopers / City Market at Kroger), which fail closed as "verify the current role". Before the fixes the
same read set 35 of 35 NFI contacts, 25 of 25 J.B. Hunt contacts, 11 PepsiCo and 2 General Mills people aside, all
false. Also set aside: 17 other region, 10 do-not-contact, 11 no name, 2 divested entity, 1 opted out.

| Account | Row kind | Operator (top of the ranked choice) | Source | GAP contact? | Tech / transformation | Sponsor | Eligible / notes |
|---|---|---|---|---|---|---|---|
| PepsiCo | Unknown (shipper rules) | Isaac Scott, Sr Director of Transportation - Frito-Lay (Orlando) | HubSpot, 542 read | No: ADD + USE (persona 13 exists at the Frito-Lay family account) | Amy Lewis, Sr Director S&T NA Deployment - Transportation | Brad Stroup, VP Supply Chain, Warehouse CoE, PBNA | 20; Karen Darling (PBNA Transportation), Matt Laneve next. Michelle Schlie is an adjacent operator, not conflicted, not deleted. |
| FedEx, hypothesis `cmuuii2n8…` (approved, no person) | 3PL / Logistics (carrier doctrine) | Glen Chaffee, Managing Director - Transportation & Logistics (Mars, PA); then Jeffrey, VP Operations Planning and Engineering - North America (GAP); Lisa Lisson, President Air Network Operations | HubSpot 114 via the fedex.com identity + 13 GAP | Jeffrey and Tracci Schultz (EVP Supply Chain Operations) are GAP contacts | Vinay D'Souza, SVP Global Assets, Infrastructure and Ops Technology | Justin Brownlee, SVP Flight Operations & Network Planning | 35; nobody preselected. Set aside: FedEx Supply Chain president and VP (divested), 3 do-not-contact, 1 Middle East remit. |
| FedEx, cold first touch | same | Jeffrey (VP Ops Planning & Engineering NA), then Glen Chaffee, Lisa Lisson | same | yes | same | same | 35 |
| Walmart Inc., hypothesis `cmuuij14l…` (approved, no person; a $300M fulfillment center) | Retail | Christina Mannella, Sr Director - West Transportation Command Center; Doug Estrada, Senior Director - Regional Transportation; Ericka Ramon | HubSpot, 660 read (linked company) | No GAP contacts at all: ADD + USE | Jason Horn, Director Operations & Automation Global Logistics | Adam Dunbar, VP Supply Chain Operations Support, Fulfillment and Reverse | 45; site slot Billy Link (VP Regional GM). Set aside: 4 other regions, Tim Cooper (opted out), 2 no name. |
| General Mills | Manufacturer | Phillip West, Senior Director, North America Logistics; Al Mize; Deb Schultz | HubSpot, 55 read (linked) | Ryan Underwood (GAP) is eligible | none | Becky Crane, VP International Supply Chain Officer | 5; Jonathan Ness (CSCO) and Nisar Ahsanullah no longer false conflicts. |
| Tyson Foods | Unknown (shipper rules) | Justin Kissinger, Senior Director Transportation (Springdale); Rick Barrett (GAP); Damian Elsken | HubSpot 90 via tyson.com identity | yes (Rick Barrett) | none | Barry Vincent, SVP Live Operations | 11; 3 staged candidates shown, not selectable. |
| Kroger | Unknown (shipper rules) | Ranor Relatores, Senior Director of Transportation (Cincinnati); Mark Walter; Brian Adams | HubSpot, 113 read (linked) | No (3 GAP contacts, none an operator) | John Winkels, Senior Director Logistics Engineering & Network Strategy | Ben Hamilton, VP Interim Supply Chain Leader | 13 |
| H-E-B | Retail | Jess Bess, Director Transportation Strategy & Planning; Jose Huerta, Director of Transportation (Schertz); Dakota Socha third | HubSpot 51 via heb.com identity + 9 GAP | Dakota Socha (1306) is a GAP contact | none | Carson Landsgard, EVP Supply Chain and Logistics | 7 before the correction. Dakota's LinkedIn / ZoomInfo evidence is not yet on the record; THIS PERSON LEFT under Casey's session records it and the panel then shows the historical line. Legacy duplicates 43 / 45 (do-not-contact, bounced) are set aside with the reason. |
| NFI Industries (read under `--entity-type 3pl`; row says Unknown) | carrier doctrine | James Oleary, VP Fleet Services; Jeff Kanterman, Regional VP Transportation Management; Mark Stratman (GAP, Regional VP Transportation Operations) | HubSpot 166 via nfiindustries.com + 35 GAP | yes | Wesley Duncan, Senior Director Transportation Analytics | Jenny Wilson, VP Distribution Support | 136 (every network role is a primary operator at a 3PL); under shipper rules 58. |
| J.B. Hunt (same override) | carrier doctrine | Brandon Taylor, SVP Transportation; Cecilia Gann, VP Transportation; Jayce Bannister | HubSpot 192 via jbhunt.com + 25 GAP | yes | none | Nick Hobbs, COO & President, Highway and Final Mile | 175; under shipper rules 41. |
| UPS (same override) | carrier doctrine | Amir Hafizovic, Director of Florida Transportation; David Centers; Dustin Teverbaugh, Director of Air Transportation | HubSpot, 221 read (linked) | 1 GAP contact, not an operator | Luke Wake, VP Fleet Maintenance & Engineering | Eric Dowd, VP CFO UPS Supply Chain Solutions | 70; 19 other regions set aside. |

### The FedEx fact, stated truthfully

The stored observation is the 10-K (filed July 20) Tricolor sentence: "redesigning our international air network by
deploying our aircraft strategically". It is an AIR network fact. Network 2.0 (the ground network consolidation) is
in the same filing and is NOT the stored signal. The approved problem hypothesis ties that air change to "the gates,
yards and docks you run", so GAP shows the air network president (Lisa Lisson), the North America operations
planning and engineering VP (Jeffrey, a GAP contact) and the transportation Managing Director (Glen Chaffee) as
plausible owners with the reasons that say which part each one runs. The choice is Casey's; no FedEx person is
auto-selected. A better ground-network owner needs a Network 2.0 fact, not this one.

## Adversarial review (fresh reviewer, separate worktree, 2026-10-05)

BLOCKERS, both FIXED and mutation-proven: B1 the decision-time gate read the record only while the panel also read
the linked HubSpot row (Apollo's sweep), so a person the panel set aside could still be drafted, sent, enrolled,
routed or assigned (the gate now reads that row with the account context, cached, 3 s timeout, decided on the record
and said so when unreadable); B2 a person's own email domain counted as a spelling of the account, so a record
refreshed to the new employer's address read the departure as "here" (the account side is now
`accountEmploymentContext`, and one address never counts). SHOULD FIX, all FIXED: S3 a HubSpot-only person Apollo
marked moved out stayed eligible and preselected; S4 the four-letter prefix rule ("Mars" / "Marsh McLennan") and the
hyphenated families (aliases now reach the gate); S5 an entity boundary fired on its own account ("FedEx Freight");
S6 a carrier's hub and station managers read "needs review"; S7 a stale panel could show "candidate not
eligible:employment conflict" (every code has copy; the exclusion's sentence is the why). NICE TO HAVE, FIXED: yards
plural in two sentences; "Air Operations" is the air side and brokerage is not an operator; the headline says when
HubSpot was not read; the import prefers a live row over a legacy do-not-contact duplicate, stays `already` after a
later opt-out, and says when a different HubSpot id is already linked; research dedupes against every name on record.
Recorded, not fixed: the call brief shows no employment state (display only; the call action itself is gated).
REJECTED by the reviewer after checking: the frozen-hypothesis trigger does not cover `primary_persona_id`; the
sole-eligible preselect and first-difference ranking; batch routing and targeted routing both run through the gate;
enroll and copy share the gates; the import never creates an account, writes HubSpot or calls Apollo; the discard
touches one proven draft and a vanish is reconciled, never inferred; a human correction stands over verification;
weak evidence is filtered; the client bundle reaches no server module; the routes are session-only, validated and
secret-free; FIND OPERATOR stages candidates only; no em dash or "throughput" in new strings. The reviewer's
failing-input file stays in the review worktree as evidence (18 red before the fixes).

## Production repair (authorized scope only; recorded after deploy)

Authorized: discard / reconcile the exact stale Pepsi / Michelle GAP draft; link the existing Isaac Scott HubSpot
contact into PepsiCo; assign a Casey-selected person to the FedEx hypothesis through the UI; targeted shadow routing;
deploy this fix. Not authorized and not done: sends, enrollments, Apollo spend, bulk imports, arbitrary HubSpot
writes, deleting Michelle, broad routing, auto-selecting a FedEx person, auto-creating web-researched personas.
Receipt: the "Production repair receipt" section at the end of this document.

## Deliberate boundaries and named debt

- `GAP_HYPOTHESIS_FROZEN` (the database trigger) on `primary_persona_id` for an approved row is proven with fakes
  only; the first production assignment is the live proof, and `assignHypothesisPersona` refuses anything but
  draft / review_required / approved.
- Account rows for PepsiCo, Tyson Foods, Kroger, NFI Industries, J.B. Hunt and UPS carry vertical "Unknown", so they
  read under shipper rules in the product; the carrier doctrine applies when the row says carrier / 3PL (FedEx does).
  Closed for NFI Industries, J.B. Hunt and UPS in the WHO truth maintenance section below.
- GAP contact "Jeffrey" at FedEx has no last name on record.
- H-E-B holds legacy duplicate personas for Dakota Socha (43) and Troy Shaw (45) beside the current rows (1306, 1318):
  shown as set aside, not merged.
- Child-company HubSpot records are not read; the identity rule reads one company per account. Closed in the WHO
  truth maintenance section below (the verified family's linked companies are read).
- The sponsor slot follows the one prior (`isSponsor` by `rankWho`); at PepsiCo that is Brad Stroup, and Michelle
  Schlie stays an adjacent operator on the record.
- Employment verification is bounded to one grounded search per click and records only with a URL.
- Banners and subsidiaries with their own name read as a conflict ("verify") until an alias exists: Central Market
  (H-E-B), King Soopers and City Market (Kroger), SDR Distribution (NFI). Closed below: seeded after verification,
  and future banners go through the governed alias workflow.
- The call brief (`/api/gap/call/[personaId]`) does not display the employment state; the call action is gated.

## Production repair receipt (2026-10-05, under Casey's session, after PR #396 merged as 71188379 and Vercel READY)

Deploy verified by markers unique to this diff on the live app: the Add to GAP button and the outstanding-draft panel
on /gap/accounts/pepsico/, the owner panel in the FedEx and Walmart drawers ("35 plausible owners ... GAP does not
pick", "45 plausible owners ..."), nobody preselected. Everything below was clicked or posted through the product's
own governed routes in the rig, and read back from the database.

- **PEPSI AFTER.** The stale first-touch draft to michelle.schlie@pepsico.com (decision `cmurhhob4001wjq04nv3iysa8`,
  Gmail draft `r7108052208134565800`) was discarded through the panel with reason `stale_pre_operator_who_draft`:
  ledger `execution.gmail_draft_discarded` at 17:50:08Z by casey@freightroll.com, status `discarded`, nobody
  unsubscribed. Isaac Scott (HubSpot 219885493392, isaac.scott@pepsico.com, Sr Director of Transportation -
  Frito-Lay, verified live) was added through ADD TO GAP: `rehomed`, persona 13 moved from the Frito-Lay family
  account (no history there) to PepsiCo, linked by HubSpot id; audit `person.imported_from_hubspot` with
  `apolloSpent: 0, accountCreated: false, hubspotWritten: false`. The record still carries the legacy do-not-contact
  and bounced status from the March blast, reported and not cleared (not in the authorization), so NOW names Karen
  Darling (Senior Director - PBNA Transportation, HubSpot-only) as WHO with ADD TO GAP, and Isaac as a GAP contact on
  the record. Clearing that flag is Casey's decision through `scripts/gap/correct-historical-suppression.ts`.
  Michelle Schlie remains a GAP contact (adjacent operator), never deleted. The account motion is released.
- **FEDEX AFTER.** The approved hypothesis `cmuuii2n80002l504refjy0od` still has no person. Its drawer shows the
  owner panel: 35 eligible, ranked with reasons (Glen Chaffee, then Jeffrey, then Lisa Lisson), the set-aside list
  (FedEx Supply Chain divested, do-not-contact, other region), nobody preselected. No FedEx person was assigned: that
  is Casey's click.
- **WALMART.** The approved hypothesis `cmuuij14l0006l504js050uwz` still has no person; its panel shows 45 eligible,
  ranked, nobody preselected. Same rule, same answer: no_persona is systemic and is now a choice, not a refusal.
- **H-E-B / DAKOTA.** Before the correction the record read CURRENT_LIKELY (an Apollo intake of 2026-05-04 and the
  CRM agreed; no evidence of the departure was on the record). THIS PERSON LEFT was recorded through
  `POST /api/gap/personas/1306/employment` under Casey's session: strong human evidence, ADUSA Distribution, Director
  of Distribution Operations, source http://www.linkedin.com/in/dakota-socha-9635ba61, audit
  `person.employment_corrected`. The gate now answers `persona_left_account` ("Casey marked them as no longer at
  H-E-B (now ADUSA Distribution, Director of Distribution Operations) on 2026-10-05"). NOW on /gap/accounts/h-e-b/
  reads: "Dakota Socha, transportation & reverse logistics. Historical H-E-B contact. Current-employer evidence now
  points to ADUSA Distribution (Director of Distribution Operations). Not eligible for H-E-B outreach." WHO is Jess
  Bess (Director, Transportation Strategy & Planning, HubSpot-only, ADD TO GAP), alternate Jose Huerta. Nothing in
  HubSpot was changed; nothing was deleted; no do-not-contact was written. ADUSA Distribution was not created.
- **SAFETY (database, since 14:00Z today).** Emails sent 0. Enrollments 0. Apollo credits 0. HubSpot contacts
  created 0. Accounts created 0 (1,708 before and after). Audit rows from this work: one discard, one import, one
  employment correction.
- **VERDICT.** Shipped and verified live. Open for Casey: choose the FedEx and Walmart owners from the panels;
  decide the legacy flag on Isaac's record; add banner aliases (Central Market, King Soopers / City Market, SDR
  Distribution) and the carrier verticals (NFI Industries, J.B. Hunt, UPS) when convenient.
<!-- verified:2026-10-05 -->

## WHO truth maintenance and enterprise coverage (second seller-dogfood correction, 2026-10-05)

STATUS: SHIPPED 2026-10-05 (PR #397, merge 59c20e1a, Vercel READY on 59c20e1a3faeb1e04a29f3acf1968156207250d2; follow-up PR #398, merge c86c24d7, Vercel READY on c86c24d72f0e273ef5319c20ab5f3b6480a67989: a title tail that spells the employer or one of its units is a company name, not a role change, and the panel says the role line once; read-only production smoke in the receipt below). Builds on everything above; nothing above is redesigned. Driver: four classes of
friction the #396 dogfood left: a person still at the company whose stored title is no longer true (Walmart), a
hypothesis whose owner should depend on what the fact is (FedEx), enterprise families read through one company record
(PepsiCo / Frito-Lay, Kroger banners, carrier subsidiaries), and legacy local suppression flags with no governed review
(Isaac Scott). Not V3: one truth-maintenance layer over the read above, governed seller controls where scripts stood.

### Role currentness is its own dimension (`people/role-currentness.ts`)

Employment currentness (the five states above) says WHERE a person is; role currentness says whether the TITLE GAP
ranks on is still true there. Five states, never a score: `ROLE_CURRENT_CONFIRMED` (strong evidence names the same
role recently), `ROLE_CURRENT_LIKELY` (strong but old, or consistent support), `ROLE_UNVERIFIED` (the CRM title and
nothing independent; the common case), `ROLE_CHANGED_CONFIRMED` (current evidence says the role moved: a promotion,
another person now leading the function), `ROLE_CONFLICT` (current sources name different roles). A human row (Casey)
decides; strong evidence (their own profile, the employer's page, an announcement, a speaker bio, a verification whose
URL earned strong) decides next; supporting evidence (an Apollo title refresh, the CRM) corroborates or conflicts; weak
evidence (a modified date, an email domain, an aggregator) never counts. Apollo's bare `current` confirms the employer,
never the role (it carries a title only when Apollo refreshed the title itself), so the CRM title is never counted
twice.

The seller-facing EFFECTIVE TITLE is the verified current title, else Casey's stated title, else the CRM title when not
contradicted, else the stored title when not contradicted, else UNKNOWN. A contradicted stored title is never the
ranking title: a changed role with no established new title, or a role conflict, is set aside from role-dependent WHO
(`role_changed` / `role_conflict`) with the sentence "Still at Walmart Inc., but the stored transportation role (Sr
Director - West Transportation Command Center) changed: ... Verify current remit before using." It is never
do-not-contact, never "left", never deleted; buyer truth or a relationship keeps the person eligible with the caution,
because a relationship is not role-dependent. A verified new title is read instead of the stored one, with the prior
title named. `Persona.title` is never rewritten by automation: the projection is the truth, with provenance (company,
title, prior title, source URL, source date, retrieved date, evidence class, tier, actor, provider, confidence) in the
existing enrichment fields for a GAP contact and in one `person.role_verified` audit row for a HubSpot-only person
(subject_type `hubspot_contact`), which the loaders read back (`loadHubSpotContactRoleEvidence`).

VERIFY CURRENT ROLE (`employment-verify.ts`, `POST /api/gap/personas/[id]/employment/verify`, and the new
`POST /api/gap/people/verify-role` for a persona or a HubSpot-only person) answers five cases: same role, different
role (new title may be unknown), left, conflict, unresolved; an answer without a source URL asserts nothing; a human
correction is never overwritten. It runs only on a click, never on render: the owner panel offers it on the top three
unverified candidates and on a role set-aside. The brief and NOW read the same role truth (`account-intel/load.ts`,
`build.ts`, `context/now.ts`): a person set aside for their role fills no slot and NOW names the next operator.

### Purpose-specific ranking and RECOMMENDED FOR THIS HYPOTHESIS (`people/owner-resolution.ts`)

The cold first touch keeps the operator-first order above. A hypothesis ranks buyer truth, relationship, a named
initiative, then the CURRENT role (a role confirmed by strong evidence or a verified new title above every other; a
merely likely role ranks with the unverified, so one provider row can never vault a person over a direct fit), then
thesis relevance, then lane, named ownership, scope, region, market, seniority, currentness, reachability. A site pilot
puts site fit (a site or regional operator) before the lane; a transformation initiative puts explicit freight or yard
technology ownership before the lane (generic technology and innovation never qualify). When the top two eligible
people differ first on a strong dimension (buyer truth, relationship, initiative, the current role, thesis relevance,
lane, named ownership, site fit, technology ownership) the panel shows RECOMMENDED FOR THIS HYPOTHESIS on that person
with the first difference in words ("on thesis relevance: runs operations planning and engineering: the fact is a
network program. Glen Chaffee is next. You choose."). It is a reason, not a selection: nobody is preselected unless
they are the only eligible person, and Casey still clicks. A difference only in scope, geography, seniority,
currentness or reachability is a plain choice.

Thesis relevance reads the FACT: the hypothesis text stands in only when the fact names no family (every hidden-capacity
guess says "gates, yards and docks", which made every transportation title "direct" on every hypothesis); a bare
"facilities" is not a site opening ("consolidate sortation facilities" is a network program); the air side of a ground
network program is related, not direct. No person is named in the code: the FedEx test uses the Network 2.0 sentence
and a Tricolor sentence and expects the planning and engineering owner for the first and the air network president for
the second, with the recommendation naming the first difference each time.

### Corporate-family contact coverage (`people/family-people.ts`)

Owner resolution reads the account's own HubSpot company (the linked one, else the account identity) PLUS its verified
corporate family's linked companies: members come only from `loadCorporateFamily` (a `parent_brand` that names a
different GAP account, HubSpot's parent / child / sibling hierarchy when readable, a duplicate record of the same
company); a member is read only through its own `hubspot_company_id` (never by a domain or a name guess); a member
whose name is a divested unit for the account (`entity-boundary.ts`) never enters; a separate operating company is read
and its people carry the caution. People are deduplicated by HubSpot id, then by a non-reversible email key (the address
itself is never carried); the primary company's row wins. Caps: 400 per family company, 1000 in total, 8 family
companies, deterministic (parent, subsidiary, sibling, duplicate, then name). Every person carries where they were read
("Source: HubSpot (Frito-Lay, a PepsiCo subsidiary)"); the checked line says the family companies searched, who was not
read and why ("Gatorade: no linked HubSpot company (never read by a domain or name guess)"), and when the cap was hit,
and the choose headline then says the owner may be beyond the cut. Live: PepsiCo reads Frito-Lay (5 more people);
Frito-Lay reads PepsiCo as its parent (541); FedEx's child rows (FedEx Ground, Services, Logistics, Corporation) carry
no linked company and are named as not read; FedEx Supply Chain is divested and never read.

### Aliases are a governed data workflow (`people/alias-review.ts`, `POST /api/gap/accounts/alias-review`)

An employment conflict whose CRM or provider spelling is not the account's becomes a POSSIBLE ACCOUNT ALIAS proposal
beside the resolution ("Central Market -> H-E-B? Evidence: 2 HubSpot contacts' CRM company field"), never an alias by
itself: Casey confirms (`registerAlias` source `manual`, one `account.alias_confirmed` audit row, idempotent, refused
when the spelling already maps to another account or is itself another GAP account's name) or rejects (one
`account.alias_rejected` row; the spelling is not proposed again). Name similarity alone never proposes or creates
anything ("Delta" / "Delta Dental" needs conflict evidence and a click). A confirmed alias changes the employment read
at once (the people stop reading as conflicts) with no code change. Seeded after verification (`scripts/gap/
seed-verified-aliases.ts`, dry run by default): Central Market -> H-E-B (an H-E-B-owned banner), King Soopers and City
Market -> Kroger (Kroger's Colorado division since the 1999 Dillon merger), SDR Distribution / SDR Distribution Services
/ NFI SDR Distribution Services -> NFI Industries (acquired 2023). The dogfood also proposed what Casey should reject
(a Walmart contact whose CRM company reads "Paypal"; "The Duracell Company" at P&G, divested to Berkshire in 2016;
vendors' people associated with PepsiCo's company): the proposal is the point, the click is Casey's.

### Account kind through the existing vertical (`people/account-kind-review.ts`, `scripts/gap/account-kind-review.ts`)

The read-only diagnostic lists accounts whose vertical is Unknown with the evidence GAP already holds (the Scout web
read of the right company, the audited site mix, the share of carrier-network titles among GAP contacts) and proposes
a value only from the live vocabulary and only on strong evidence (a Scout carrier / 3PL read, or a carrier-network
title majority among five or more); thin evidence leaves Unknown alone, keywords never flip a shipper, a set vertical
never changes. The vocabulary has no separate carrier value: carriers and 3PLs both take "3PL / Logistics" (FedEx and
Kenco carry it; `typeFromVertical` reads it as 3pl, the carrier doctrine). `--apply "Name=Vertical"` corrects only the
named rows still Unknown, one guarded update each, one `account.vertical_corrected` audit row with the internal and
the external evidence. Applied 2026-10-05 after verification (audits `cmuvnjtno…`, `cmuvnju03…`, `cmuvnju9f…`): NFI Industries (the classifier
proposed it from the Scout 3pl read), J.B. Hunt and UPS (the classifier found GAP's own evidence thin: 3 of 25 and 0
titles; Casey's value stands on the external evidence recorded in the audit: the J.B. Hunt 10-K and the UPS company
profile) all read "3PL / Logistics" now, so the carrier doctrine applies from the canonical field, not a dogfood
override. The diagnostic also proposed Kroger = Retail (a Scout retailer read; not applied, outside the named rows).

### Legacy suppression review (`suppression/legacy-review.ts`, `GET/POST /api/gap/personas/[id]/suppression-review`)

One read collects every plane for a person: the local flag and email status, the unsubscribe table, HubSpot (opt-out,
bad address, hard bounce reason, quarantine), the clawd contract (live, 12 s, fail closed), the email log (bounces,
and deliveries to the exact same address after the last bounce), the GAP ledger, prior override decisions, and Gmail
DSN (reported as not read: the March sends went through Resend). It renders WHY THIS PERSON IS BLOCKED and WHAT WOULD
HAVE TO BE TRUE TO CLEAR IT and classifies: CONFIRMED_SUPPRESSION (any hard hit: an unsubscribe, a HubSpot opt-out or
bad address, a clawd key other than the modex echo, a hard bounce no later delivery contradicts), UNRESOLVED (an
authority unreadable, or the local flag with no later delivery evidence), LEGACY_CONFLICT (the local flag only, every
hard plane clean, at least one delivery to the same address after the last bounce), CLEAR. Only LEGACY_CONFLICT shows
CLEAR LEGACY LOCAL FLAG; the click is explicit and confirmed, re-runs the review live, and clears only the local
do-not-contact flag and the historical bounced status (the statement lives beside the consent writer in
`src/lib/email/suppression-correction.ts`, never touches `updated_at`, so the HubSpot sync never sees it); one
`suppression.corrected` audit row carries the whole receipt; every refusal is audited (`suppression.correction_refused`).
A real unsubscribe, a hard bounce, a clawd hard suppression or a HubSpot opt-out can never be cleared here. The
structural invariant (`tests/unit/gap/record-unsubscribe.test.ts`) still holds: no file under `src/lib/gap` writes
`do_not_contact`; the two writers under `src/lib/email` (the consent helper sets it, the governed clear only ever
sets it false) are both positive controls.

Isaac Scott (persona 13, PepsiCo), reconstructed read-only on 2026-10-05: do_not_contact true and email_status
bounced from the March 2026 Resend-era wave (two bounces on 2026-03-27, bounce type never recorded); no unsubscribe
row; HubSpot opt-out, bad address, hard bounce reason and quarantine all unset; the clawd contract blocked for exactly
one key, `modex_do_not_contact` (the local flag echoed back), all five legs read; three messages delivered to the same
address after the last bounce (2026-03-27, 03-28, 03-30, two of them replies in a thread); Gmail holds no thread (Resend
era); no prior override. Classification: LEGACY_CONFLICT. Cleared automatically: NO. The read wrote no audit row (one
row before and after). Casey's action available: CLEAR LEGACY LOCAL FLAG from the owner panel's set-aside list
("Review the legacy flag") with the receipt; nothing else on any plane would change.

### Seller controls (no script needed for recurring truth maintenance)

Verify current role (persona or HubSpot-only, from the owner panel's top candidates, a role set-aside, or NOW); this
person left; current role is wrong; confirm or reject an account alias (the owner panel); choose the owner (the panel,
with the recommendation as a reason); review and clear a legacy suppression flag (the panel's set-aside list). Scripts
remain for diagnostics and one-off evidence: `who-truth-dogfood.ts` (the 20-account receipt), `account-kind-review.ts`,
`seed-verified-aliases.ts`, `record-role-evidence.ts` (one human-read verification, dry run by default),
`stage-sourced-candidate.ts` (one source-backed candidate for review, never a persona, never HubSpot).

### Tests

New and extended suites under `tests/unit/gap/`: `role-currentness` (33), `employment-verify-role` (17),
`verify-role-route` (8), `employment-control` (12), `owner-ranking-purpose` (11), `owner-role-truth` (11),
`owner-resolution-load-family` (6), `who-truth-integration` (10), `family-people` (7), `alias-review` (7),
`alias-proposal-control` (3), `account-kind-review` (9), `legacy-suppression-review` (30),
`legacy-suppression-route` (5), `legacy-suppression-review-ui` (6), `review-who-truth` (the reviewer's 14
failing-input cases, kept green), plus the extended `employment`, `employment-store`, `hubspot-people`,
`owner-resolution-ui`, `record-unsubscribe` (the invariant pins both writers and the single importer) suites. Every
numbered case in the brief (role currentness 1 to 6, purpose ranking 7 to 10, family 11 to 15, aliases 16 to 19,
account kind 20 to 22, suppression 23 to 30) has a named test. Mutation proofs recorded in the commits: the
hypothesis order reverted to cold (RED), the role exclusion skipped (RED), the effective title ignored (RED), the
divested exclusion disabled (RED), the alias-is-account refusal disabled (RED), the five-title floor lowered (RED),
usableForRanking forced true (RED), the human-correction guard disabled (RED), the HubSpot body unstrictened (RED), an
unsubscribe row read as soft (RED), the confirmed flag ignored (RED), LEGACY_CONFLICT without a later delivery (RED),
the clear button shown regardless (RED), the route without a session (RED). Full suite at the tip: 643 files, 7,249
tests, 0 failures, 1 skipped; `tsc --noEmit` clean; eslint clean on every changed file; production build green.

### Dogfood (production, read-only, 2026-10-05; nobody contacted, nothing written, no credit spent)

`scripts/gap/who-truth-dogfood.ts --hypotheses`, run after the production writes above (each account's newest approved
person-less hypothesis, else the cold first touch). Every account with people is a ranked choice; the only
recommendation is FedEx (Lisa Lisson on thesis relevance: the stored fact is the Tricolor air-network sentence, and
her role is confirmed by the fedex.com leadership page); nobody is preselected or chosen. After the aliases: no
Central Market, King Soopers, City Market or SDR Distribution conflict remains (before: 4 false conflicts). After the
verticals: NFI Industries, J.B. Hunt and UPS read under the carrier doctrine from the canonical field (133, 175 and
65 eligible network owners; 57, 41 and 19 under shipper rules). Walmart: Christina Mannella is set aside
`role_changed` (43 eligible, Doug Estrada at the top of the choice); Christian Burton is staged candidate 49. PepsiCo
reads Frito-Lay (5 more people) and names Gatorade as not read; Frito-Lay reads PepsiCo as its parent (541). The only
alias still proposed is "The Duracell Company" at P&G (two contacts' CRM field; divested to Berkshire in 2016: Casey
rejects it, which is the workflow). Isaac Scott shows under do-not-contact at PepsiCo with the legacy review
available; the "suppression issue" column counts every do-not-contact GAP contact the review can now explain.
Sub-Zero and World Market have no GAP account under those names and nothing was created.

| account | kind | owner / recommendation | current role state | family coverage | alias issue | suppression issue | next action |
|---|---|---|---|---|---|---|---|
| PepsiCo | unknown | top of the choice: Karen Darling (Senior Director - PBNA Transportation) | ROLE_UNVERIFIED | 5 from family; not read: Gatorade: no linked HubSpot company (never read by a domain or name guess) | none | 1 do-not-contact GAP contact with a legacy review available (Dr. Isaac Scott) | Casey chooses among 21 |
| FedEx | carrier_3pl (3pl) | RECOMMENDED Lisa Lisson (President, Air Network Operations) | ROLE_CURRENT_CONFIRMED | 0 from family; not read: FedEx Corporation: no linked HubSpot company (never read by a domain or name guess); FedEx Logistics: no linked HubSpot company (never read by a domain or name guess); FedEx Services: no linked HubSpot company (never read by a domain or name guess) | none | 3 do-not-contact GAP contacts with a legacy review available (Douglas Spamer, Jose A. Touzon, Jake Pyke) | Casey chooses among 35 (one recommended) |
| Walmart Inc. | shipper (retailer) | top of the choice: Doug Estrada (Senior Director - Regional Transportation - Logistics) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 43 |
| General Mills | shipper (manufacturer) | top of the choice: Phillip West (Senior Director, North America Logistics) | ROLE_UNVERIFIED | 0 from family | none | 3 do-not-contact GAP contacts with a legacy review available (Zoe Bracey, Lars Stolpestad, Paul Gallagher) | Casey chooses among 5 |
| Tyson Foods | unknown | top of the choice: Justin Kissinger (Senior Director Transportation) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 11 |
| Kroger | unknown | top of the choice: Ranor Relatores (Senior Director of Transportation) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 13 |
| H-E-B | shipper (retailer) | top of the choice: Jess Bess (Director, Transportation Strategy & Planning) | ROLE_UNVERIFIED | 0 from family | none | 4 do-not-contact GAP contacts with a legacy review available (Troy Shaw, Dakota Socha, Craig Stucker, ...) | Casey chooses among 6 |
| NFI Industries | carrier_3pl (3pl) | top of the choice: James Oleary (Vice President of Fleet Services) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 133 |
| J.B. Hunt | carrier_3pl (3pl) | top of the choice: Cecilia Gann (Vice President of Transportation) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 175 |
| UPS | carrier_3pl (3pl) | top of the choice: Amir Hafizovic (Director of Florida Transportation) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 65 |
| Sub-Zero | no account |  |  |  |  |  | create the account deliberately, or spell it as GAP does |
| World Market | no account |  |  |  |  |  | create the account deliberately, or spell it as GAP does |
| The Home Depot | shipper (retailer) | top of the choice: Ryan Holden (Director, Transportation) | ROLE_UNVERIFIED | 0 from family | none | 4 do-not-contact GAP contacts with a legacy review available (John Drake, Amit Kalra, Erin Donnelly, ...) | Casey chooses among 11 |
| Niagara Bottling | shipper (manufacturer) | top of the choice: Ryan Kieczykowski (Sr. Director of Logistics) | ROLE_UNVERIFIED | 0 from family | none | 10 do-not-contact GAP contacts with a legacy review available (Andrew Peykoff, Brian Hess, David Zucker, ...) | Casey chooses among 3 |
| Frito-Lay | shipper (manufacturer) | top of the choice: Isaac Scott (Sr Director of Transportation - Frito-Lay) | ROLE_UNVERIFIED | 541 from family; not read: Gatorade: no linked HubSpot company (never read by a domain or name guess) | none | 2 do-not-contact GAP contacts with a legacy review available (David Chambers, Bob Fanslow) | Casey chooses among 23 |
| Unfi | unknown | top of the choice: David Wolf (Sr. Director Transportation) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 5 |
| Kraft Heinz | shipper (manufacturer) | top of the choice: Nicholas Riolo (Transportation Manager) | ROLE_UNVERIFIED | 0 from family; not read: Kraftheinz: no linked HubSpot company (never read by a domain or name guess) | none | none | Casey chooses among 5 |
| Procter & Gamble | unknown | top of the choice: Louay Mishu (Senior Director- NA Transportation, Warehousing, Private Fleet) | ROLE_UNVERIFIED | 0 from family | The Duracell Company -> Procter & Gamble? | none | Casey chooses among 32 |
| Sysco | unknown | top of the choice: Joe Bennett (Vice President of Transportation - Global Operations) | ROLE_UNVERIFIED | 0 from family | none | none | Casey chooses among 58 |
| John Deere | shipper (manufacturer) | none (find the operator) | ROLE_UNVERIFIED (nothing read) | 0 from family | none | 4 do-not-contact GAP contacts with a legacy review available (Gia Duke, Catherine Pham, David Panjwani, ...) | Find the operator (research) |

### Adversarial review (fresh reviewer, separate worktree, 2026-10-05)

Fifteen attack questions, a failing-input file of 15 cases (14 red at the reviewed tip), every finding resolved:
BLOCKER B1 (the Pepsi Isaac legacy review was unreachable: a do-not-contact person with a role read was set aside as
`role_conflict` first, and the panel keys the review on `do_not_contact`): FIXED, contactability is read before the
role. SHOULD FIX, all FIXED: S2 one Apollo title refresh vaulted a person over a direct fit on "current role" (a
likely role now ranks with the unverified; only a role confirmed by strong evidence outranks); S3 a supporting-tier
source confirmed a role change over a strong profile, and aggregators graded supporting (a change with no title
needs a strong source; a people directory is weak); S4 `sameFirstWord` collapsed Dollar Tree into Dollar General,
Schneider Electric into Schneider National, Old Dominion University into Old Dominion Freight Line, Performance Team
into Performance Food Group, and strong evidence could not catch the departure (the remaining words must describe a
unit of the group); S5 an unusable role scored 3 on "current role" (now 0, and never a recommendation); S6 five real
GAP contacts were set aside for a GAP-title versus HubSpot-title wording difference (a differing CRM title is read as
the current CRM title, unverified, never a block); S7 a family-provenance person was offered ADD + USE and the import
refused the click (the import accepts the verified family company the panel read them from, re-verified, audited);
S8 shipper private-fleet titles proposed carrier doctrine (only titles a carrier has count); S9 one contact's CRM
field proposed an alias ("Paypal", a vendor, a departure) and the copy did not say an alias governs intake (two or
more people or the account's stem; the control says so); S10 the invariant could not see an import-and-call (it pins
the single importer). NICE TO HAVE, FIXED: N11 a reverted clear read as clear-again (now unresolved until a newer
reason); N12 "yard" singular in a remit word; N13 column names reached the seller; N14 Casey's own row could drop
behind five automation rows; N16 slots read the stale title of a role-changed person. Recorded, not fixed: N15 the
divestiture constant is FedEx-only (a stale `parent_brand` reads as family); the Pilot Company / Pilot Freight
Services namesake (a one-word spelling that leads a longer one is the #396 rule that makes "NFI" read as NFI
Industries). REJECTED by the reviewer after checking: Q2 (Apollo current carries no title; weak tiers filtered), Q8
(no prospect name in src; the air fact recommends the air president, Network 2.0 the planning VP), Q10 and Q11 (an
unsubscribe is hard and refused; the clear needs confirmed, the email, a live LEGACY_CONFLICT re-read; 1 audit row
before and after Isaac's read), Q12 to Q14 (no Apollo client, no send or enroll, no HubSpot contact creation in the
diff), Q15 (no account-specific branch beyond the entity-boundary constant).

### Production receipt (2026-10-05)

Authorized GAP-internal writes, each audited, no HubSpot write, no send, no enrollment, no Apollo credit, no
Persona created, no Account created:
- Aliases (`account.alias_confirmed`): Central Market -> H-E-B; King Soopers -> Kroger; City Market -> Kroger; SDR
  Distribution, SDR Distribution Services, NFI SDR Distribution Services -> NFI Industries (6 created, 0 refused).
- Verticals (`account.vertical_corrected`): NFI Industries, J.B. Hunt, UPS: Unknown -> "3PL / Logistics".
- Role evidence (`person.role_verified`): Christina Mannella (HubSpot 220050715039, Walmart): `different_role`, new
  title not established, source Christian Burton's own profile (strong), retrieved 2026-10-05, provider web_search,
  actor `who-truth:lead-web-verification`; Lisa Lisson (220052467520, FedEx): `same_role`, the fedex.com leadership
  page (strong); Glen Chaffee (219887402128, FedEx): `same_role`, own profile (strong); Jeffrey Tallman (persona 2187,
  FedEx): `same_role`, the Northwestern BAC bio (supporting). The live Walmart hypothesis now reads 43 eligible with
  Christina set aside: "Still at Walmart Inc., but the stored role ("Sr Director - West Transportation Command Center")
  changed per verified at linkedin.com, 2026-10-05; the new title is not established. Verify current remit before
  using." Doug Estrada tops the choice; nobody is preselected.
- Staged candidate (`AccountContactCandidate` 49, Walmart Inc.): Christian Burton, Senior Director, West
  Transportation Command Center, source his own profile, `recommended: false`, for Casey's review. Not in HubSpot (0
  results); no Persona.
Production smoke after deploy (read-only, through Casey's session in the rig, GET routes only): the Walmart hypothesis
answers 43 eligible, Doug Estrada at the top, Christina Mannella set aside `role_changed` with the verify sentence,
`role currentness (1 set aside)` in the checked line, nobody preselected; the FedEx hypothesis answers 35 eligible
with Lisa Lisson RECOMMENDED on thesis relevance (the air fact), the three do-not-contact GAP contacts listed with the
legacy review available, the family line naming the three unlinked FedEx child rows as not read; Isaac Scott's review
answers LEGACY_CONFLICT with the clear allowed and every plane listed in sentences. The hypotheses page and the FedEx
drawer's owner panel (the RECOMMENDED badge and its sentence, the choice line) render in light and dark at desktop and
390px with no horizontal overflow (screenshots kept in the session's scratch folder).
After #398 the same smoke reads Glen Chaffee ROLE_CURRENT_CONFIRMED under his verified title (the FedEx Ground tail no
longer reads as a change) and one role line per candidate.
Not done, by the boundary: no FedEx or Walmart owner selected; Isaac's flag not cleared (LEGACY_CONFLICT, Casey's
click from the panel); no HubSpot rewrite; nobody deleted; no speculative account (Sub-Zero and World Market have no
GAP account and were not created).

### Remaining genuine debt

- The divestiture constant (`entity-boundary.ts`) is FedEx-only; a stale `parent_brand` on another account would
  read as family. Add units as they are verified; a table was not warranted for one family.
- A one-word account spelling that leads a longer namesake ("Pilot" / "Pilot Freight Services") is the same employer
  by the #396 rule; Casey, an alias or identity catches it.
- A supporting-tier source with a title and no stored title leaves the effective title null in the pure read; the
  loaders pass the HubSpot title as the stored title, so the owner panel reads it (Jeffrey Tallman reads
  CURRENT_LIKELY / ROLE_UNVERIFIED on the persona alone, likely in the panel).
- Gmail DSN evidence is reported as not read in the suppression review (the March sends went through Resend).
- The HubSpot-only verify path has no "current role is wrong" correction (a human correction needs a GAP contact).
- Sub-Zero and World Market have no GAP account under those names; the dogfood says so and creates nothing.
- The vocabulary has no separate carrier value; carriers and 3PLs both read "3PL / Logistics" (one doctrine).
- `scripts/gap/correct-historical-suppression.ts` remains for the manifest-driven one-off; the seller path is the
  panel's review.
<!-- verified:2026-10-05 -->
