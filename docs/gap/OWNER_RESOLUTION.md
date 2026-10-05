# GAP owner resolution: make the right WHO actionable

STATUS: ACTIVE (seller dogfood correction, 2026-10-05). Canonical for owner resolution, contact currentness, ADD TO
GAP, the outstanding-draft remediation and the FedEx / Walmart / PepsiCo / H-E-B acceptance. Prior doctrine:
`docs/gap/V2_PERSON_PRIOR.md`. Rules that must not change: `docs/gap/STABLE_BASELINE.md`. Ledger line:
`docs/GAP_PROSPECTING_OS.md`.
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
North America and network scope rank above a local station. Air-side roles are direct operators of the air network
and sit behind the ground network owners on named ownership; the reasons say which. A reviewed constant
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
routing inputs (`skip`), persona assignment and the owner action. Stale employment changes the ranking upstream
(set aside before the list), not only the send gate.

Employer spellings: a provider or CRM variant of the same employer is HERE (`sameEmployer`): the canonical match,
or one side a four-letter prefix of the other ("Pepsi" / "PepsiCo", "Fed Ex Freight" / "FedEx", "J.B. Hunt Transport
Services, Inc." / "J.B. Hunt"), or a one-word name equal to the other side's first word ("NFI" / "NFI Industries",
never "UPS" / "Upstream Logistics", never "Estes Forwarding Worldwide" / "Estes Express Lines"), or the account's own
domain label and the person's own email domain label ("Genmills" through genmills.com). A generic word ("General",
"American") never matches alone. "ADUSA Distribution" beside an H-E-B record is still a conflict.

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
route."; `persona_left_account`, `persona_employment_conflict`, `persona_not_at_account`, `hypothesis_in_use` and
every import refusal have copy (`ui/refusal-copy.ts`). A departed person reads as a historical contact in NOW and in
the owner panel's set-aside list, never as WHO, never as the alternate, never as the motion person.

## Dogfood (production, read-only, 2026-10-05; nobody contacted, nothing written, no credit spent)

`scripts/gap/owner-resolution-dogfood.ts`. Every account below answered `choose` (two or more eligible): GAP does not
pick. Contact currentness set nobody aside after the employer-spelling fix (before it: 35 at NFI, 25 at J.B. Hunt, 11
at PepsiCo, 2 at General Mills, 1 at Tyson, 2 at FedEx, all false). Set aside across the run: 24 other region, 13
do-not-contact, 13 no name, 4 divested entity, 1 opted out.

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

## Production repair (authorized scope only; recorded after deploy)

Authorized: discard / reconcile the exact stale Pepsi / Michelle GAP draft; link the existing Isaac Scott HubSpot
contact into PepsiCo; assign a Casey-selected person to the FedEx hypothesis through the UI; targeted shadow routing;
deploy this fix. Not authorized and not done: sends, enrollments, Apollo spend, bulk imports, arbitrary HubSpot
writes, deleting Michelle, broad routing, auto-selecting a FedEx person, auto-creating web-researched personas.
Receipt: see the "Production repair receipt" section once it is appended below.

## Deliberate boundaries and named debt

- `GAP_HYPOTHESIS_FROZEN` (the database trigger) on `primary_persona_id` for an approved row is proven with fakes
  only; the first production assignment is the live proof, and `assignHypothesisPersona` refuses anything but
  draft / review_required / approved.
- Account rows for PepsiCo, Tyson Foods, Kroger, NFI Industries, J.B. Hunt and UPS carry vertical "Unknown", so they
  read under shipper rules in the product; the carrier doctrine applies when the row says carrier / 3PL (FedEx does).
  Set the vertical on the carrier rows (an account write, not authorized here).
- GAP contact "Jeffrey" at FedEx has no last name on record.
- H-E-B holds legacy duplicate personas for Dakota Socha (43) and Troy Shaw (45) beside the current rows (1306, 1318):
  shown as set aside, not merged.
- Child-company HubSpot records are not read; the identity rule reads one company per account.
- The sponsor slot follows the one prior (`isSponsor` by `rankWho`); at PepsiCo that is Brad Stroup, and Michelle
  Schlie stays an adjacent operator on the record.
- Employment verification is bounded to one grounded search per click and records only with a URL.
