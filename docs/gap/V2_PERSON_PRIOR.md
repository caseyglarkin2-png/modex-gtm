# GAP V2 person prior: who Casey sells to best

STATUS: ACTIVE (V2, 2026-10-02)
<!-- verified:2026-10-02 -->

Casey's seller learning from live selling (JOC: Sub-Zero, World Market): the strongest person is the **US / North
America leader who operates transportation and the physical freight network** at an enterprise shipper. That leader
has to connect the TMS, warehouse execution, facility handoffs and the yard, gate and trailer state.

It is a PRIOR, not a gate and not a score. Code: `src/lib/gap/people/person-prior.ts`. It is the ONE WHO comparator:
the account brief's WHO, the buyer map and the cockpit's suggested primary all read it, so they cannot disagree.

## The order (first difference wins; never a number)

1. Buyer truth: the person who answered, or a confirmed champion.
2. Relationship: an introduction, or someone Casey met.
3. Explicit initiative ownership in a live signal (for example, a named yard-modernization leader).
4. Lane: primary operator > adjacent operator > facility / yard operator > executive sponsor > transformation /
   technology > security / risk > needs review > procurement / commercial > not an operating role.
5. Region: US / North America stated > not stated ("US location unknown", never treated as foreign) > another region.
6. Scope: network > not stated > one site.
7. Seniority, last.

## Lanes

| Lane | Archetype | Examples (title patterns) |
|---|---|---|
| PRIMARY OPERATOR | owns transportation, freight, fleet or network logistics execution | Director Global Transportation & Warehousing; NA Transportation Operations Director; Senior Director NA Transportation, Warehousing, Private Fleet; Director, Dedicated / OTR Transportation; Director Transportation & Distribution; Sr Director Global Logistics and Transportation; P&G "Sales Logistics" (customer-delivery logistics) |
| ADJACENT OPERATOR | supply chain, distribution, DC, warehouse, fulfillment or network operations without stated transportation ownership | VP Supply Chain; VP Operations; Director of Supply Chain; Director, DC Operations |
| FACILITY / YARD OPERATOR | runs one site | Plant Manager; DC Manager; Yard Manager |
| EXECUTIVE SPONSOR | the executive over supply chain or operations | Chief Supply Chain Officer; CSCO; COO |
| TRANSFORMATION / TECH | transportation or supply chain technology, automation, TMS / WMS, RTLS, yard modernization; the technology executive | Director of Distribution and Transportation Systems; Senior Manager, Automation Engineering; CIO |
| SECURITY / RISK | safety, security, risk, claims | Transportation Safety Manager |
| PROCUREMENT / COMMERCIAL | buys, prices, funds or governs transportation | Transportation Strategic Sourcing; Transportation Category Director; Finance Director, Transportation; Trade Compliance; Transportation Sustainability; Purchases Transportation and Warehousing |
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
