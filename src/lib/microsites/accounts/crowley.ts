/**
 * Crowley Maritime — ABM Microsite Data
 * Quality Tier: A (Tier 1 Band A — Phase 8 family-owned operator-frame)
 *
 * Pitch shape: PARTNERSHIP / OPERATOR-FRAME — yard-execution layer at port
 * terminals + transload + intermodal yards across the integrated maritime
 * + land-logistics network Crowley operates end-to-end between the U.S.
 * mainland, Puerto Rico, the Caribbean, and Central America. Family-owned,
 * fourth-generation, long-cadence-capex window like SC Johnson / H-E-B /
 * Kenco — operating decisions run on multi-decade family-stewardship time,
 * not quarterly-EPS pressure. The maritime-shipping angle is the
 * differentiator from pure-3PL peers: the same yard surface arbitrates a
 * Jacksonville-to-San-Juan ConRo discharge, a Central America LNG-powered
 * Avance Class call, and a Caribbean drayage-to-DC handoff under shared
 * dock contention rules.
 *
 * Angle: YARD MANAGEMENT — port-terminal yard execution (Isla Grande San
 * Juan, Jacksonville Talleyrand and Pen, Pacific and Gulf calls),
 * transload + warehouse + customs-brokerage yard surface around the
 * Jacksonville HQ campus, drayage-to-DC handoff at the destination
 * terminal, ship-to-shore gantry discharge throughput, and multi-modal
 * land-transportation yard sequencing (Crowley Logistics' integrated
 * intermodal + truckload + drayage book). NOT driver experience.
 *
 * Stakeholder vocabulary: integrated-operator register (~125-year family
 * operating history, January 2026 Shipping & Logistics + Energy division
 * realignment with James Fowler as division president, the Commitment
 * Class $550M LNG-ConRo program, Megan Davidson as the new COO seat as
 * of Jan 1, 2026) — operating discipline, throughput-out-the-gantry,
 * port-to-DC cycle, cross-modality yard sequencing, family-cadence
 * long-horizon capex math.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const crowley: AccountMicrositeData = {
  slug: 'crowley',
  accountName: 'Crowley Maritime',
  coverHeadline: 'The yard layer for the integrated maritime + land operator',
  titleEmphasis: 'integrated maritime + land operator',
  coverFootprint: 'Jacksonville HQ · San Juan · ~7,000 employees',
  parentBrand: 'Crowley Maritime Corporation',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 82,

  pageTitle: 'YardFlow for Crowley Maritime - The Yard-Execution Layer for the Integrated Shipping + Logistics Operator',
  metaDescription:
    'How a network-tier yard-execution layer lands across the Crowley operating estate — Isla Grande San Juan, the Jacksonville HQ campus, the Caribbean and Central American port calls, and the integrated land-logistics book — sitting on top of the existing port-terminal records layer and entering the operating standard of the January 2026 Shipping & Logistics Division as a single yard discipline across the maritime-to-DC handoff.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Crowley operating model',
      composition: [
        {
          label: 'Integrated maritime + land operating footprint',
          value:
            '~7,000 employees across the global enterprise; Jacksonville FL corporate HQ; 184 locations worldwide reported across the operating estate. Container shipping anchored on the U.S. mainland–Puerto Rico lane (Jacksonville to Isla Grande San Juan as the dominant trade) plus Dominican Republic, Trinidad, the broader Caribbean (Jamaica, Cayman, Aruba, Curaçao, the eastern Caribbean island chain), and the Central American corridor (Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua). Diversified fleet of U.S.- and foreign-flag container vessels and tug/barge sets; ~45,000+ pieces of container equipment in service. Reported annual revenue ~$2.5B+ across the Shipping & Logistics and Energy divisions.',
        },
        {
          label: 'Commitment Class Puerto Rico investment + Isla Grande terminal',
          value:
            '$550M Commitment Class program — El Coquí and Taíno, ~720\'×105\'×59\' LNG-powered ConRo vessels purpose-built for the Jacksonville–San Juan trade. ~2,400 TEU capacity each plus enclosed Ro/Ro deck for ~400 vehicles. Three new ship-to-shore gantry cranes at Isla Grande San Juan — the first new specialized gantry cranes received in San Juan Harbor in more than five decades — paired with a new 900\'×114\' concrete pier. The terminal-modernization investment moves throughput-out-the-gantry materially higher than the pre-Commitment Class baseline; the yard surface behind the gantry has not been re-engineered at the same cadence.',
        },
        {
          label: 'Caribbean and Central America container service depth',
          value:
            'Avance Class LNG-powered containerships (Quetzal, Copán, Tiscapa) servicing El Salvador, Guatemala, Honduras, Nicaragua, the Dominican Republic, and the broader Central America / Caribbean trade out of Jacksonville. Long-tenured leadership of the Puerto Rico-Caribbean container lane — more than 60 years on the U.S.–Caribbean trade. Combined East Coast Florida departures + Caribbean/Central American port calls create a multi-port yard surface where the same operating standard either holds end-to-end or does not.',
        },
        {
          label: 'US Logistics Solutions — the land-side service catalog',
          value:
            'Crowley Logistics operates an integrated U.S. land-logistics book that extends the ocean shipment past the discharge gantry: warehousing and distribution (Jacksonville Distribution Center at 2061 Seaboard Coast Line Drive; Tradeport Drive facility near JAX airport with 12 dock-high doors; the I-95 / 20th Street Expressway cross-dock with 31,500 sq ft, 58 dock-high doors, 150+ container yard spots); customs brokerage at every major U.S. air/ocean/land entry point; transload + intermodal + drayage + managed transportation + final-mile delivery; full truckload and LTL. The integrated book turns the maritime call into a port-to-DC service rather than a port-to-port handoff — and the yard surface in the middle is where the integration is either a service-line differentiator or a per-shipment renegotiation.',
        },
        {
          label: 'Government Services — the long-cadence federal book',
          value:
            'More than a century of U.S. government partnership across critical maritime missions. Active Military Sealift Command vessel-management portfolio: the T-AGOS / T-AGM ocean-surveillance + missile-tracking fleet (USNS Victorious, Loyal, Effective, Impeccable, Able; USNS Invincible, Howard O. Lorenzen), the $343M maritime prepositioning force contract for six MPF vessels, plus follow-on ship-management awards. Crowley Solutions runs the government-services arm under VP Business Development Bleu Hilburn. The federal book runs on a longer underwriting cadence than the commercial book and reinforces the family-operator long-horizon capex posture.',
        },
        {
          label: 'Energy Division — fuel distribution + LNG + Alaska',
          value:
            'Effective January 2026, a separate Energy Division under Kollin Fencil — Crowley Fuels Alaska (largest wholesale fuel distributor in Alaska, serving 280+ communities; 31 company- and dealer-owned retail stations; 16 petroleum terminals totaling ~31M gallons storage; ~140+ delivery trucks; LNG / advanced energy solutions; tank-farm operations; ship-assist and offshore tugs and barges). The Energy book is a parallel operating estate with its own yard, terminal, and depot surface across Alaska — operationally adjacent to the Shipping & Logistics yard problem, structurally separate post-realignment.',
        },
        {
          label: 'January 2026 Shipping & Logistics + Energy realignment',
          value:
            'Announced January 6, 2026 — Crowley realigned the enterprise into two divisions. James C. Fowler is EVP and Division President, Shipping & Logistics — combining the ocean-based shipping business, Crowley Logistics (land transportation, supply chain), and global ship management under a single operating leader. Kollin Fencil is EVP and Division President, Energy. Both report to COO Megan Davidson (effective Jan 1, 2026, succeeding Ray Fitzgerald). Tom Crowley remains Chairman and CEO. The realignment is the structural reason a single yard-execution standard across maritime + land is suddenly an in-period decision rather than a multi-year cross-org alignment problem — Fowler now owns the seam end-to-end.',
        },
        {
          label: '~125-year family-owned operator discipline',
          value:
            'Founded 1892 in San Francisco. Privately held, controlled by the Crowley family across four generations. Tom Crowley, Jr. has served as Chairman and CEO since 1994 — succeeding his father and grandfather in such roles dating to the company\'s founding. The operator-frame is structural, not rhetorical: every decision about what enters the Crowley operating standard runs through a closely-held family-operator culture on multi-decade family-stewardship time, not a quarterly-earnings cycle. The yard-execution operating model compounds at the same family-cadence rhythm the Commitment Class ConRo program (announced 2013, in service 2018, ~125-year horizon) was underwritten against — not at vendor-procurement cadence.',
        },
      ],
      hypothesis:
        'The interesting thing about Crowley is not whether terminal-yard tools belong in the maritime operating model. There are records-layer port-terminal systems at Isla Grande and at the Jacksonville campus today, and the vessels keep sailing on the Friday-night Jacksonville-to-San-Juan schedule. The interesting thing is that Crowley is the only operator on the U.S.–Caribbean trade that is also a full-stack U.S. land-logistics provider on the back end — warehousing, customs brokerage, drayage, transload, intermodal, managed transportation — and the integration happens at a yard surface that sits in two operating worlds simultaneously. The ConRo discharges at the gantry. The container enters a yard whose appointment-window rules, dock-door sequencing, and chassis logic come from a U.S. domestic land-logistics playbook. The carrier picks up under one set of contract terms; the next leg into the customs-brokerage, transload, or distribution center runs under another. The yard between the gantry and the gate is where the maritime operator and the land-logistics operator either agree on what good looks like or they do not. For a decade that gap was structurally invisible — Shipping and Logistics ran as separate businesses under separate operating leaders. As of January 6, 2026 they do not. James Fowler now owns both ends of the handoff under one division president seat, with Megan Davidson as the new COO above him. The yard surface in the middle is the cleanest single decision available to the new structure.\n\nThe Commitment Class economics make the gap more expensive than the legacy baseline. $550M in vessel and pier capex moves throughput-out-the-gantry materially higher at Isla Grande, where the three new specialized gantry cranes are the first received in San Juan Harbor in more than five decades. Discharge cadence climbed; the yard behind the gantry was not re-engineered at the same cadence. The same shape applies on the other side of the trade: the LNG-powered Avance Class (Quetzal, Copán, Tiscapa) expanded Central American and Caribbean capacity out of Jacksonville without a matching yard-execution upgrade at the JAX terminal yard or at the destination ports. Modern ConRo and LNG-container throughput hits a yard whose operating logic was sized for the pre-modernization baseline. The variance shows up first as port-to-DC dwell, second as customer-experience surface (Crowley Logistics customers measure the port call against the U.S. mainland service-level standard they already pay for elsewhere), and third as carrier-experience friction at the gate where the drayage interface lives.\n\nThree windows are open simultaneously, and they are not always open together. First, the January 2026 division realignment is in active operating-standard build right now — Fowler is six months in seat as division president, Davidson is six months in seat as COO, and the operating standard the new Shipping & Logistics Division consolidates onto is the standard the family-owned company will run on for the next decade. The cheapest moment for a new yard-execution layer to enter the standard is during the consolidation window, not after it closes. Second, the family-ownership capex posture underwrites multi-decade investment math the public-co peers (Matson, Crowley\'s only structural peer on the Hawaii-Pacific equivalent of the Puerto Rico trade) cannot match — an 18-36 month operating-model investment that pays back over the decade is a different decision under family stewardship than under public-co earnings cadence. Third, the integrated maritime + land operating model is structurally rare on the U.S. trade lanes Crowley dominates. No pure-3PL peer can run this play across the Caribbean and Central American port calls because they do not own the vessels. No pure-ocean-carrier peer can run it on the U.S. land side because they do not own the warehousing, customs-brokerage, and intermodal book. The yard-execution layer between the two is where the integrated operating model either reads cleanly to customers or stays a two-step handoff that competitors can match piece by piece.',
      pullQuote: 'The yard between the gantry and the gate is where the maritime operator and the land-logistics operator either agree on what good looks like or they do not.',
      caveat:
        'This is built from Crowley Maritime public disclosures, the January 2026 division-realignment press cycle, the Commitment Class and Avance Class fleet announcements, the Crowley Logistics service-line catalog, the Military Sealift Command contract record, and reasonable network inference about how the integrated maritime + land operating model maps to yard execution. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how the Isla Grande terminal yard surface is performing against the Commitment Class throughput baseline today, which destination ports across the Caribbean and Central America are running highest yard-cycle variance, and how the January 2026 Shipping & Logistics Division consolidation is currently sequencing its operating-standard rebuild between maritime-side and land-side priorities.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Crowley operating standard',
      artifact: {
        imageSrc: '/artifacts/crowley-coverage-map.svg',
        imageAlt: 'Crowley operating-standard coverage map. Six tiles representing the integrated maritime + land service-line footprint. Container Shipping (PR/Caribbean), US Logistics Solutions, Government Services, Fuel Distribution, and ~125-Year Family-Owned are covered. The Yard/Port Execution tile is unfilled, marked with a Crowley navy hairline outline.',
        caption: 'Crowley operating-standard coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public Crowley Maritime + Crowley Logistics + Crowley Solutions + Crowley Fuels + January 2026 division realignment disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water maxes gross-vehicle weight before it maxes cube, it is low-margin (every minute of yard waste is a margin point you can\'t recover with price), and it ships across multi-temp lanes with refillable-return logistics. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be, because the category cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The read-across to Crowley is not "Crowley is shaped like Primo" — Crowley is an integrated maritime + land operator, not a CPG end-shipper. The read-across is: Primo\'s pilot landed inside a network where the yard surface had to arbitrate across plants, drop-trailer yards, and regional DCs on tight margin economics, and the operating discipline that produced Primo\'s numbers is exactly the operating standard Crowley could productize across the maritime-to-DC handoff that defines the integrated service line. Many of Crowley Logistics\' most demanding shipper customers — the consumer-goods and food-and-beverage anchor accounts that run the Puerto Rico, Caribbean, and Central American import flows — look operationally like Primo\'s peer group: multi-site, multi-modal, lean-inventory, and increasingly intolerant of port-to-DC variance. If a network operating model works on the per-case-hardest freight in CPG, putting that operating model inside the Crowley integrated service standard means many Crowley customer engagements gain access to it as a Crowley-branded capability — alongside the ocean leg, the customs-brokerage leg, and the inland leg — rather than as a separately sourced shipper tool. The directly-shaped reference (a Tier-1 CPG anchor running this operating model across 237 facilities on a multi-year contracted term) is available for peer call when the integrated-service conversation gets specific. The competitive question, in one line: is yard-execution discipline across the maritime-to-DC handoff a Crowley-branded capability the Shipping & Logistics Division productizes once and distributes across the customer base under the integrated operating standard the January 2026 realignment is now writing — or a per-call, per-terminal, per-engagement renegotiation no integrated operator currently differentiates on.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot configurations at Crowley are different in kind from end-shipper pilots: (1) Isla Grande San Juan as the pilot terminal — Commitment Class ConRo discharge cadence is the operating context, three new gantry cranes set the throughput baseline, and the yard surface behind the gantry is the cleanest single place to read a yard-execution operating model against post-modernization vessel economics; (2) one Jacksonville-side terminal-plus-warehouse pairing where the maritime call and the U.S. land-logistics service book meet under the same operating leader for the first time post-January-2026. From there, the rollout cadence is replicating across the Caribbean and Central American destination ports, and into the broader U.S. land-logistics footprint as the integrated operating standard rolls forward.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'crowley-public',
          source: 'Crowley Maritime public disclosures + corporate site',
          confidence: 'public',
          detail: 'Anchors the ~7,000 employee figure, ~$2.5B+ annual revenue, 184 worldwide locations, Jacksonville FL HQ (9487 Regency Square Blvd), 1892 founding, Tom Crowley Jr. as Chairman and CEO since 1994, and the integrated maritime + land + government + energy service-line footprint.',
          url: 'https://www.crowley.com/company-overview/',
        },
        {
          id: 'crowley-jan-2026-realignment',
          source: 'Crowley division realignment announcement (January 6, 2026)',
          confidence: 'public',
          detail: 'Realigned the enterprise into two divisions: Shipping & Logistics (James C. Fowler, EVP and Division President — unifies ocean-based shipping, Crowley Logistics land transportation and supply chain, and global ship management) and Energy (Kollin Fencil, EVP and Division President — includes Crowley Fuels Alaska, LNG and advanced energy solutions, tank-farm operations, engineering services, ship assistance, and offshore tugs and barges). Both report to COO Megan Davidson.',
          url: 'https://www.crowley.com/news-and-media/press-releases/crowley-business-structure-consolidation/',
        },
        {
          id: 'crowley-megan-davidson',
          source: 'Megan Davidson COO appointment (effective Jan 1, 2026)',
          confidence: 'public',
          detail: 'Succeeded Ray Fitzgerald as Chief Operating Officer effective Jan 1, 2026. The COO seat now sits above the Shipping & Logistics and Energy division presidents in the realigned structure.',
          url: 'https://www.crowley.com/news-and-media/press-releases/crowley-appoints-megan-davidson-as-chief-operating-officer-succeeding-ray-fitzgerald/',
        },
        {
          id: 'crowley-fowler-tenure',
          source: 'James C. Fowler tenure record — Crowley Shipping & Logistics Division (LinkedIn + Crowley executive disclosures + Marine Log / TheTrucker.com press)',
          confidence: 'public',
          detail: 'Joined Crowley in 2023 as Senior Vice President of the Crowley Shipping business unit; promoted to EVP and Division President of the unified Shipping & Logistics Division on the January 2026 realignment. Prior: managing director of marine and stevedoring operations for Cooper Marine, EVP for Blakeley BoatWorks (both Mobile, AL). MBA in finance from Tulane (A.B. Freeman School of Business). The tenure shape matters because the operating standard the new division consolidates onto is being written by a maritime-and-stevedoring operator now responsible for the integrated land book — the seam where yard execution lives.',
        },
        {
          id: 'crowley-commitment-class',
          source: 'Crowley Commitment Class ConRo program + Isla Grande Terminal modernization',
          confidence: 'public',
          detail: '$550M investment in Jacksonville–San Juan trade: El Coquí and Taíno ConRo vessels (~720\'×105\'×59\', LNG-powered, ~2,400 TEU capacity each plus enclosed Ro/Ro deck for ~400 vehicles, ~22 knot cruising speed). Three new ship-to-shore gantry cranes at Isla Grande San Juan — first new specialized gantry cranes received in San Juan Harbor in more than five decades — paired with a new 900\'×114\' concrete pier.',
          url: 'https://conro.crowley.com/home',
        },
        {
          id: 'crowley-avance-class',
          source: 'Crowley Avance Class LNG-powered containerships',
          confidence: 'public',
          detail: 'Quetzal, Copán, and Tiscapa servicing El Salvador, Guatemala, Honduras, Nicaragua, the Dominican Republic, and the broader Central America / Caribbean trade out of Jacksonville. Expanded Central American and Caribbean capacity on LNG-powered vessels.',
          url: 'https://www.crowley.com/news-and-media/press-releases/crowleys-copan-expands-shipping-capabilities-for-usa-central-america-and-caribbean/',
        },
        {
          id: 'crowley-logistics-service-catalog',
          source: 'Crowley Logistics published service-line catalog',
          confidence: 'public',
          detail: 'Warehousing and distribution (Jacksonville Distribution Center at 2061 Seaboard Coast Line Drive; Tradeport Drive facility near JAX airport, 12 dock-high doors; I-95 / 20th Street Expressway cross-dock, 31,500 sq ft, 58 dock-high doors, 150+ container yard spots); customs brokerage at U.S. air/ocean/land entry points; transload + intermodal + drayage + managed transportation + final-mile; full truckload and LTL. ~45,000+ pieces of container equipment in service.',
          url: 'https://www.crowley.com/logistics/',
        },
        {
          id: 'crowley-government-services',
          source: 'Crowley Solutions Military Sealift Command contracts',
          confidence: 'public',
          detail: 'T-AGOS / T-AGM ocean-surveillance + missile-tracking fleet management (USNS Victorious, Loyal, Effective, Impeccable, Able; USNS Invincible, Howard O. Lorenzen); $343M maritime prepositioning force (MPF) contract for six government-owned vessels; follow-on MSC ship-management awards. More than a century of U.S. government partnership across critical maritime missions.',
          url: 'https://www.crowley.com/solutions/maritime/',
        },
        {
          id: 'crowley-fuels-alaska',
          source: 'Crowley Fuels Alaska + Energy Division',
          confidence: 'public',
          detail: 'Largest wholesale fuel distributor in Alaska; serves 280+ communities; 31 company- and dealer-owned retail stations; 16 petroleum terminals totaling ~31M gallons storage capacity; 7 tugboats, 10 barges, an Articulated Tug Barge, 140+ delivery trucks, 60+ trailers (~3M+ miles/year). Effective January 2026, organized under the Energy Division alongside LNG / advanced energy, tank-farm operations, engineering services, ship assistance, and offshore tugs and barges.',
          url: 'https://www.crowley.com/alaska/',
        },
        {
          id: 'crowley-family-ownership',
          source: 'Crowley family ownership record + Tom Crowley Jr. tenure',
          confidence: 'public',
          detail: 'Founded 1892 in San Francisco. Privately held, controlled by the Crowley family across four generations. Tom Crowley Jr. has served as Chairman and CEO since 1994, succeeding his father and grandfather in such roles. The family-ownership posture underwrites multi-decade capex math — the Commitment Class ConRo program was announced 2013, in service 2018, and underwritten against a ~125-year operating horizon, not a quarterly cycle.',
          url: 'https://en.wikipedia.org/wiki/Crowley_Maritime',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in port-terminal + drayage + multi-modal contexts. These describe the conditions most integrated port-and-land logistics networks operate under, not Crowley specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to Crowley via the "Crowley\'s shipper customers look operationally like Primo\'s peer group" read-across, not as Crowley\'s own internal metrics.',
        },
      ],
      unknowns: [
        'How the Isla Grande terminal yard surface is currently performing against the Commitment Class throughput baseline — three new ship-to-shore gantry cranes raised the discharge cadence, and whether the yard behind the gantry has matched the new throughput is the discovery question that sizes the deployment',
        'Which Caribbean and Central American destination ports are running highest yard-cycle variance today — the Avance Class LNG-container deployment expanded capacity ahead of yard-execution standardization at the destination terminals, and the priority sequence across the destinations is not public',
        'How the January 2026 Shipping & Logistics Division consolidation is sequencing its operating-standard rebuild — whether the maritime-side rebuild (terminals, vessels, ship management) and the land-side rebuild (Crowley Logistics service catalog, the U.S. warehouse and intermodal footprint) are running on the same operating-standard cadence under Fowler, or in sequence',
        'Where the customer-experience surface lives most acutely in the integrated service book — which Crowley Logistics shipper customers measure port-to-DC dwell as a contract-tier service-level metric vs. as an operating-tolerance band',
        'How the partnership economics would be structured if yard-execution becomes a Crowley-branded capability inside the integrated service catalog (per-terminal SaaS plus rebill into customer service-level reporting, multi-modal revenue share, embedded as a service-line tier alongside the ocean leg, the customs-brokerage leg, and the inland leg)',
        'Whether the right entry sequence runs through Fowler as the division president seat that now owns the maritime-to-land seam, through Davidson as the new COO above him, or through Brett Bennett / Steve Collar as the Logistics-side operating leaders running the U.S. land-logistics book day-to-day',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a partnership engagement with an integrated maritime + land operator, not an end-shipper procurement engagement. Crowley is distinctive in this round because the question is not whether yard tools belong in the operating model (port terminals have always had them, in some form) but whether the yard-execution layer across the maritime-to-DC handoff — the seam where the ocean leg, the customs-brokerage leg, the warehousing leg, and the inland leg meet — is the right next layer for the January 2026 Shipping & Logistics Division to consolidate onto a single Crowley operating standard. James, the division you inherited in January 2026 is the first time in a decade the maritime and land businesses sit under one operating leader; the memo is shaped to that seam, not to a vendor-procurement cadence. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of Crowley Logistics\' most demanding shipper customers — the consumer-goods and food-and-beverage anchors that run the Puerto Rico, Caribbean, and Central American import flows — look operationally like Primo\'s peer group. Productizing the yard-execution layer into the Crowley integrated service standard means many customer engagements gain it as a Crowley-branded capability rather than as a separately sourced shipper tool — the kind of differentiation that compounds under the family-ownership long-horizon capex posture in a way no public-co peer can match.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'James — the part most worth pushing back on is whether the operating-standard rebuild your division is consolidating onto post-January-2026 is currently scoped end-to-end across the maritime-to-DC handoff, or whether the maritime-side rebuild (terminals, vessels, ship management) and the land-side rebuild (Crowley Logistics service catalog) are sequenced separately and meet later. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: an integrated-operating-standard scoping conversation framed against the family-ownership long-horizon capex posture the Commitment Class was underwritten against, an Isla Grande terminal-yard pilot configured against the post-modernization gantry throughput baseline, or a Jacksonville HQ-campus scoping session pairing one terminal and one warehouse under the new division-president seat — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'crowley-001',
      name: 'James C. Fowler',
      firstName: 'James',
      lastName: 'Fowler',
      title: 'EVP and Division President, Shipping & Logistics',
      company: 'Crowley Maritime',
      linkedinUrl: 'https://www.linkedin.com/in/jamescfowler/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Operations',
      reportsTo: 'COO Megan Davidson',
      currentMandate:
        'EVP and Division President, Shipping & Logistics — runs the unified division consolidating Crowley\'s ocean-based shipping business, Crowley Logistics (land transportation, supply chain), and global ship management as of January 2026. Joined Crowley in 2023 as SVP of the Crowley Shipping business unit; under his leadership the business lines improved financial and operational performance and grew through diversified vessel-fleet and business-portfolio expansion. Prior: managing director of marine and stevedoring operations for Cooper Marine, EVP for Blakeley BoatWorks (both Mobile AL). MBA in finance from the A.B. Freeman School of Business at Tulane. The operating standard the new division consolidates onto is being written by a maritime-and-stevedoring operator now responsible for the integrated land book.',
      bestIntroPath:
        'Direct outreach into the Division President seat framed against the maritime-to-DC handoff and the January 2026 operating-standard consolidation — not a yard-tools pitch. If delegated downward: Brett Bennett / Steve Collar as Crowley Logistics operating leaders for the U.S. land-side perspective. Above: Megan Davidson (COO since Jan 1, 2026) if the conversation moves to enterprise-tier operating-standard cadence. Tom Crowley Jr. is reachable for family-ownership long-horizon framing if the conversation reaches CEO/Chairman level on capex math.',
    },
    {
      personaId: 'crowley-002',
      name: 'Megan Davidson',
      firstName: 'Megan',
      lastName: 'Davidson',
      title: 'Chief Operating Officer',
      company: 'Crowley Maritime',
      roleInDeal: 'influencer',
      seniority: 'C-level',
      function: 'Operations',
      reportsTo: 'Chairman & CEO Tom Crowley Jr.',
      currentMandate:
        'COO effective Jan 1, 2026, succeeding Ray Fitzgerald. Sits above the two division presidents (Fowler for Shipping & Logistics; Fencil for Energy) in the realigned January 2026 structure. The COO seat is the enterprise-tier operating-standard owner for the consolidated estate.',
      bestIntroPath:
        'Approach via Fowler once the Shipping & Logistics Division-tier conversation has earned the operating-standard scoping. Direct enterprise-tier outreach if the conversation needs cross-division alignment with the Energy book.',
    },
    {
      personaId: 'crowley-003',
      name: 'Tom Crowley Jr.',
      firstName: 'Tom',
      lastName: 'Crowley',
      title: 'Chairman and Chief Executive Officer',
      company: 'Crowley Maritime',
      roleInDeal: 'influencer',
      seniority: 'C-level',
      function: 'Executive',
      currentMandate:
        'Chairman and CEO since 1994. Fourth-generation Crowley family operator; succeeded his father and grandfather in leadership of the privately-held, family-owned company. Under his tenure Crowley expanded from a ~125-year-old water-fundamentals operator into a diversified portfolio across maritime, logistics, government services, and energy. The family-ownership long-horizon capex posture — multi-decade family-stewardship time, not quarterly-EPS pressure — is his structural decision frame.',
      bestIntroPath:
        'Family-ownership long-horizon capex framing only — not an operating-tier conversation. Reserve for late-stage strategic conversations once the Division-tier scoping has cleared the operating-standard build.',
    },
    {
      personaId: 'crowley-004',
      name: 'Brett Bennett',
      firstName: 'Brett',
      lastName: 'Bennett',
      title: 'Senior Vice President & General Manager, Crowley Logistics',
      company: 'Crowley Maritime',
      roleInDeal: 'routing-contact',
      seniority: 'SVP/EVP',
      function: 'Operations',
      currentMandate:
        'SVP and General Manager of Crowley Logistics — runs the supply-chain business unit providing integrated ocean and land transportation and distribution services. The day-to-day operating leader for the U.S. land-side service catalog (warehousing, customs brokerage, transload, intermodal, drayage, managed transportation, truckload, LTL).',
      bestIntroPath:
        'Direct outreach into the Crowley Logistics operating seat when the conversation moves from the division-tier standard to the U.S. land-side operating reality.',
    },
    {
      personaId: 'crowley-005',
      name: 'Steve Collar',
      firstName: 'Steve',
      lastName: 'Collar',
      title: 'Senior Vice President & General Manager, Crowley Logistics',
      company: 'Crowley Maritime',
      roleInDeal: 'routing-contact',
      seniority: 'SVP/EVP',
      function: 'Operations',
      currentMandate:
        'SVP and General Manager of Crowley Logistics alongside Brett Bennett — operating leader within the Crowley Logistics organization with executives reporting up through this seat. The land-side operations counterpart at the GM tier.',
      bestIntroPath:
        'Direct outreach into the Crowley Logistics operating seat when the conversation moves from the division-tier standard to the U.S. land-side operating reality.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'crowley-001',
        name: 'James C. Fowler',
        firstName: 'James',
        lastName: 'Fowler',
        title: 'EVP and Division President, Shipping & Logistics',
        company: 'Crowley Maritime',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'James C. Fowler - EVP and Division President, Shipping & Logistics',
      variantSlug: 'james-fowler',

      framingNarrative:
        'James, the division you inherited on January 6, 2026 is the first time in a decade the maritime business and the land-logistics business sit under one operating leader. The seam between them — the yard surface where the Commitment Class ConRo discharge meets the Crowley Logistics service catalog, where the gantry crane hands off to drayage, where the customs broker hands off to the warehouse, where the inland intermodal hands off to the final-mile carrier — is the surface no operating standard has consolidated across before because no operating leader owned both sides until now. The maritime-and-stevedoring operator pedigree you carried in from Cooper Marine is exactly the read this seam needs: terminal operations are not a planning problem, they are an execution problem. The Commitment Class economics make the gap visible because the gantry now moves faster than the yard behind it; the family-ownership capex posture makes the operating-model investment underwritable on a horizon Matson and the public-co peers cannot match.',
      openingHook:
        'The Commitment Class moved throughput-out-the-gantry. The yard behind the gantry was not re-engineered at the same cadence. And as of January 6, 2026, the division that consolidates both sides of that handoff is yours.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. First, the January 2026 division realignment is in active operating-standard build right now — the standard the new Shipping & Logistics Division consolidates onto is the standard Crowley runs on for the next decade, and the cheapest moment to enter it is during consolidation, not after. Second, the family-ownership capex posture underwrites multi-decade investment math the public-co peers cannot match — an 18-36 month operating-model investment pays back over the decade under family stewardship. Third, the integrated maritime + land operating model is structurally rare on the U.S. trade lanes Crowley dominates; no pure-3PL peer can run this play across the Caribbean and Central American calls, no pure-ocean-carrier peer can run it on the land side, and the yard-execution layer between the two is where the integrated model either reads cleanly to customers or stays a two-step handoff competitors can match piece by piece.',

      heroOverride: {
        headline: 'The yard-execution layer for the integrated maritime + land operating standard.',
        subheadline:
          'Isla Grande post-Commitment-Class. Jacksonville HQ campus post-realignment. The Avance Class Central American calls. The Crowley Logistics warehouse, customs-brokerage, transload, and intermodal book. One operating standard across the maritime-to-DC handoff — written into the January 2026 Shipping & Logistics Division consolidation while the standard is still being authored, underwritten on family-ownership long-horizon capex math.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Integrated-operator / maritime-and-stevedoring register. Fowler came up through Mobile-AL stevedoring and marine ops at Cooper Marine and Blakeley BoatWorks — terminal yard reality is in his hands, not on a slide. Acknowledge the existing port-terminal records layer respectfully — terminal systems function as designed at the gate-and-record level, and the question is the execution and multi-modal orchestration layer above them. Frame the yard layer as the seam the January 2026 division realignment puts under one operating leader for the first time — not as a tool acquisition. Reference the Commitment Class throughput economics, the Avance Class capacity expansion, and the family-ownership long-horizon capex posture as the structural reasons the timing matters. Cycle-time minutes belong in the second deck for Brett Bennett and Steve Collar; the division-president deck stays in operating-standard economics across the maritime-to-DC handoff.',
      kpiLanguage: [
        'maritime-to-DC handoff',
        'integrated operating standard',
        'throughput-out-the-gantry',
        'port-to-DC dwell',
        'multi-modal yard sequencing',
        'family-ownership long-horizon capex',
        'division-tier operating-standard build',
        'per-terminal SaaS plus rebill',
        'integrated service-line catalog',
        'Commitment Class post-modernization baseline',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the Crowley-specific read-across is "Crowley\'s shipper customers look operationally like Primo\'s peer group," not "Crowley itself is Primo-shaped." Productization across the Crowley Logistics customer base — embedded in contract-logistics service-level reporting alongside the ocean leg, the customs-brokerage leg, and the inland leg — is what turns one operating-model proof into a 1-to-many distribution play across the integrated service catalog. The directly-shaped 237-facility CPG anchor reference is the credibility flex if the conversation moves to peer call.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '~7,000 employees across the global enterprise · 184 worldwide locations · Jacksonville FL HQ (9487 Regency Square Blvd) · Isla Grande Terminal San Juan PR (new 900\'×114\' concrete pier + three new ship-to-shore gantry cranes — first received in San Juan Harbor in 50+ years) · Jacksonville port terminals + warehouse and distribution footprint (2061 Seaboard Coast Line Drive DC; Tradeport Drive near JAX airport, 12 dock-high doors; I-95 / 20th Street cross-dock, 31,500 sq ft, 58 dock-high doors, 150+ container yard spots) · Dominican Republic, Trinidad, Caribbean, and Central American port calls (Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua) · ~45,000+ pieces of container equipment in service · Energy Division: 16 Alaska petroleum terminals (~31M gallons storage), 31 retail stations, 280+ communities served',
    facilityTypes: [
      'Port Terminals (Isla Grande San Juan, Jacksonville, Caribbean and Central American calls)',
      'Container Yards',
      'Warehouses + Distribution Centers',
      'Cross-Dock Facilities',
      'Customs Brokerage Entry Points',
      'Intermodal + Drayage Yards',
      'Petroleum Terminals (Alaska, 16 sites)',
      'Retail Fuel Stations (Alaska, 31)',
    ],
    geographicSpread:
      'Bi-coastal U.S. + Caribbean + Central America + Alaska + global ship-management presence. HQ Jacksonville FL. Container shipping anchored on the U.S. mainland–Puerto Rico lane (Jacksonville–San Juan as the dominant trade) plus Dominican Republic, Trinidad, broader Caribbean (Jamaica, Cayman, Aruba, Curaçao, eastern Caribbean), and Central American corridor. U.S. land-logistics footprint extends from the Jacksonville HQ campus across the broader U.S. service network',
    dailyTrailerMoves:
      'High-volume — modeled at the network level across the integrated maritime + land operating estate. Container discharge cadence at Isla Grande materially higher post-Commitment-Class (three new gantry cranes + new 900\' pier); Avance Class LNG capacity expanded into Central American and Caribbean calls; U.S. land-logistics footprint runs the integrated service catalog (warehousing, customs brokerage, transload, intermodal, drayage, managed transportation, truckload, LTL) on top of the maritime discharge',
    fleet:
      'Diversified fleet: ~720\'×105\'×59\' Commitment Class ConRo (El Coquí, Taíno — LNG-powered, ~2,400 TEU + ~400 vehicle Ro/Ro deck); Avance Class LNG containerships (Quetzal, Copán, Tiscapa); broader tug-and-barge sets; U.S.- and foreign-flag container vessels; MSC-managed vessels (T-AGOS / T-AGM ocean-surveillance + missile-tracking + MPF prepositioning). Land-side: ~140+ Alaska delivery trucks; ~45,000+ container equipment pieces; the broader U.S. land-logistics drayage and intermodal book',
  },

  freight: {
    primaryModes: ['Ocean Container Shipping (ConRo, LNG-containership)', 'Drayage', 'Truckload', 'LTL', 'Transload', 'Intermodal', 'Customs Brokerage', 'Warehousing + Distribution', 'Managed Transportation', 'Final-Mile Delivery'],
    avgLoadsPerDay:
      'High-volume — Jacksonville-to-San-Juan Commitment Class ConRo cadence anchored on a regular departure rhythm; Avance Class Central American + Caribbean calls; ~45,000+ pieces of container equipment cycling across the network; U.S. land-logistics drayage, transload, intermodal, and final-mile volume layered on top of the maritime discharge. Customer base spans consumer goods, food and perishables, refrigerated goods, household appliances, furniture, medical devices, retail importers, and the broader Caribbean + Central American import-flow shipper book',
    specialRequirements: [
      'Port-terminal yard execution at modernized gantry-crane throughput (Isla Grande post-Commitment-Class baseline)',
      'Multi-modal yard sequencing (ConRo + LNG-container + drayage + intermodal + truckload all meeting at the same terminal yard)',
      'Customs-brokerage handoff at the entry point (U.S. air/ocean/land)',
      'Reefer + perishable handling on the Caribbean and Central American import flows',
      'Government-grade ship management for MSC contract vessels (T-AGOS / T-AGM / MPF)',
      'Hazmat fuel-distribution yard discipline at the Alaska petroleum terminals (Energy Division)',
    ],
  },

  signals: {
    recentNews: [
      'Crowley realigned the enterprise into two divisions on January 6, 2026 — Shipping & Logistics (James C. Fowler, EVP and Division President; unifies ocean shipping, Crowley Logistics, and global ship management) and Energy (Kollin Fencil, EVP and Division President; Crowley Fuels Alaska, LNG, advanced energy solutions, tank farms, ship assistance, offshore tugs and barges).',
      'Megan Davidson became Chief Operating Officer effective Jan 1, 2026, succeeding Ray Fitzgerald — the COO seat now sits above the two division-president seats.',
      'Commitment Class ConRo program — $550M Jacksonville–San Juan investment, El Coquí and Taíno LNG-powered ConRos (~2,400 TEU + ~400 vehicle Ro/Ro), new 900\' concrete pier and three new ship-to-shore gantry cranes at Isla Grande (first new specialized gantry cranes received in San Juan Harbor in more than five decades).',
      'Avance Class LNG-powered containerships (Quetzal, Copán, Tiscapa) expanded Central American and Caribbean capacity out of Jacksonville (El Salvador, Guatemala, Honduras, Nicaragua, Dominican Republic).',
      'Government services book: T-AGOS / T-AGM ocean-surveillance + missile-tracking fleet management (USNS Victorious, Loyal, Effective, Impeccable, Able; USNS Invincible, Howard O. Lorenzen); $343M maritime prepositioning force contract for six MPF vessels.',
      'Crowley Fuels Alaska — largest wholesale fuel distributor in Alaska, 280+ communities served, 31 retail stations, 16 petroleum terminals (~31M gallons storage), 140+ delivery trucks.',
      'Tom Crowley Jr. — Chairman and CEO since 1994; fourth-generation Crowley family operator; ~125-year family-owned operating history dating to 1892 founding in San Francisco.',
    ],
    urgencyDriver:
      'The January 6, 2026 division realignment is the first time in a decade the maritime and land businesses sit under one operating leader — James C. Fowler as EVP and Division President, Shipping & Logistics. The cheapest moment for a yard-execution operating-standard layer to enter the consolidated standard is during the consolidation window, not after. The Commitment Class ConRo program moved throughput-out-the-gantry at Isla Grande to a baseline the yard behind the gantry was not re-engineered against; the Avance Class LNG-containership expansion did the same on the Central American and Caribbean calls. Underneath all three is the family-ownership long-horizon capex posture that underwrites multi-decade operating-model investment in a way no public-co peer can match.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'The January 2026 realignment', body: 'Shipping & Logistics + Energy under two division presidents · James C. Fowler unifies maritime, land, and ship management · Jan 6, 2026.' },
    { mark: 'Commitment Class', body: '$550M Jacksonville–San Juan · El Coquí + Taíno · LNG-powered ConRo · ~2,400 TEU + ~400 vehicles · three new ship-to-shore gantries at Isla Grande.' },
    { mark: 'Avance Class', body: 'Quetzal · Copán · Tiscapa · LNG-powered containerships · Central America + Caribbean expansion out of Jacksonville.' },
    { mark: 'Government services', body: 'MSC T-AGOS/T-AGM ocean-surveillance fleet · $343M MPF contract · 100+ years of U.S. government partnership.' },
    { mark: '~125-year family-owned discipline', body: 'Founded 1892 · Tom Crowley Jr. Chairman and CEO since 1994 · fourth generation · long-horizon capex on family-stewardship time.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for James C. Fowler. The division you inherited on January 6, 2026 is the first time in a decade the maritime and land-logistics businesses sit under one operating leader. The five minutes that follow are about the yard surface where they meet — Isla Grande post-Commitment-Class, the Jacksonville HQ campus post-realignment, and the integrated service catalog the family-ownership long-horizon capex posture underwrites across the next decade.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#13294B',
  },
};
