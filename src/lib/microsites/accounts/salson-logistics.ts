/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * SalSon Logistics is a confirmed PINC (now Kaleris) yard-management
 * customer at the Newark NJ flagship 55-acre, three-yard campus. Per
 * SalSon's own website: all containers at Newark are tracked using PINC.
 * SalSon also appears on Kaleris customer-list aggregations. Specifics:
 *   - PINC at Newark covers the 55-acre, three-yard campus (~2,000
 *     containers/week, ~150 SalSon drivers in port daily, ~100,000
 *     containers/year)
 *   - TMS: TMW (Trimble) — confirmed, public
 *   - Customer portal: "My SalSon" proprietary, aggregating TMW + PINC +
 *     other tier-one systems under a single shipper-facing UI
 *   - PINC deployment scope beyond Newark is unverified (likely Newark-only
 *     today; Compton, Florence, smaller secondary yards not publicly
 *     confirmed)
 *
 * Persona context: Jason Fisk is a Sun Capital Partners operator (13 years
 * Principal at Sun Capital → CEO at Aug 2024 roll-up). PE rational,
 * speed-biased, M&A-flywheel-on. Stated $20–50M tuck-in target on
 * mid-single-digit EBITDA multiples. Revenue "more than doubled since
 * 2021" off ~$100M baseline → implied $250M+ run-rate. Anthony Berritto
 * (Senior Business Advisor) is the long-time founder-family operator now
 * stepped back; Michael Berritto (EVP Sales) still operationally active.
 *
 * Pitch shape: PARTNERSHIP — yard-execution layer that SalSon buys once
 * and resells as a branded service to shipper customers alongside drayage,
 * transload, and dedicated fleet. NOT displacement of PINC at Newark —
 * PINC is operationally embedded and SalSon has put its name to that
 * vendor publicly. Position on top of PINC (records layer) as the
 * execution + multi-tenant orchestration + shipper-facing surface that
 * plugs into the My SalSon portal.
 *
 * This intel powers the partnership cold-email framing (see
 * docs/research/jason-fisk-salson-logistics-dossier.md). The PINC at
 * Newark fact IS public (SalSon's own site says so) — so this is a rare
 * case where the memo can reference "the existing PINC deployment you
 * already operate at the Newark campus" since SalSon publicly named it.
 * However, since the editorial-style invariant says NEVER write Kaleris
 * or PINC in renderable content, we use the same neutral phrasing as
 * everywhere else: "the site-level yard tracking you already operate at
 * Newark" / "the existing yard records layer." Internal JSDoc is the only
 * place the name appears.
 */

/**
 * SalSon Logistics — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris/PINC at Newark per SalSon's own
 *                  website; Sun Capital-backed post-Aug 2024 seven-company
 *                  roll-up; $250M+ implied run-rate; active M&A flywheel)
 * Pitch shape: PARTNERSHIP — yard-execution layer that productizes into
 *              the SalSon shipper-facing service catalog alongside drayage,
 *              transload, and dedicated fleet
 * Angle: YARD MANAGEMENT (multi-tenant container yard orchestration at
 *        port-and-drayage facilities; appointment-window arbitration; the
 *        post-roll-up integration of seven companies\' yard operating
 *        models; greenfield embed at Compton CA) — NOT driver experience
 * Stakeholder vocabulary: PE-CEO register
 *        (Fisk\'s 13 years at Sun Capital + active M&A roll-up posture) —
 *        EBITDA, multiple expansion, hold-period cadence, tuck-in
 *        integration math, customer-stickiness as switching cost
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const salsonLogistics: AccountMicrositeData = {
  slug: 'salson-logistics',
  accountName: 'SalSon Logistics',
  coverHeadline: 'The next product-catalog entry in My SalSon',
  titleEmphasis: 'My SalSon',
  coverFootprint: 'Newark flagship + 11 sites',
  parentBrand: 'SalSon Logistics (Sun Capital Partners portfolio)',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 72,

  pageTitle: 'YardFlow for SalSon Logistics - The Shipper-Facing Yard-Execution Layer for the Sun Capital Roll-Up',
  metaDescription:
    'How a multi-tenant yard-execution layer productizes into the SalSon shipper-facing service catalog alongside drayage, transload, and dedicated fleet — sitting on top of the existing site-level yard tracking records layer at Newark, plugging into the My SalSon portal, and entering the operating standard for every future Sun Capital tuck-in.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the SalSon Logistics operating model',
      composition: [
        { label: 'Post-roll-up footprint', value: 'August 2024 seven-company merger under Sun Capital Partners (SalSon, Sierra Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer, TriPack Logistics). Newark NJ flagship 55-acre campus with 3 yards, ~1M sq ft warehouse, 24/7 operations, ~2,000 containers/week, ~150 SalSon drivers in port daily, ~100,000 containers/year. Long Beach CA + Compton CA (260,000 sq ft, 66 dock doors, 20-acre secured yard under construction) + Florence NJ transload hub + Atlanta, Bakersfield, Charleston SC, Houston, Inland Empire CA, Norfolk VA, Oakland CA, Savannah GA, Tacoma WA' },
        { label: 'Aggregate scale post-merger', value: '~3M sq ft dry warehouse, ~2M sq ft yard space, ~1,000+ tractors, ~1,200 trailers, ~2,500 chassis; ~1,000+ employees with stated hiring plan adding 100+. Customer base: "major importers and retailers"; vertical mix consumer goods, food & beverage, apparel/retail; published value-prop "port-to-shelf in 48 hours"' },
        { label: 'Seven-company roll-up integration shape', value: 'Each of the seven merged entities arrived with its own dispatch posture, its own yard operating model, and its own customer mix — Sierra Trucking and Heavy Load Transfer drayage-leaning, TriPack Logistics transload-leaning, the East Group / West Group warehousing-and-distribution shaped. Operating-tool integration across all seven is an active workstream today, not a closed one — and the SalSon operating standard the seven are being consolidated onto is the standard every future tuck-in inherits. The cleanest moment for a new yard-execution and orchestration layer to enter that standard is during the integration window, not after it closes' },
        { label: 'My SalSon as the productization muscle', value: 'My SalSon is the proprietary shipper-facing portal that aggregates TMW (Trimble) TMS + the existing site-level yard tracking at Newark + other tier-one inputs under a single shipper-facing UI. The productization muscle — take a third-party capability, wrap it inside a SalSon-branded surface, distribute it across shipper customers as part of the contract-logistics service line — is already exercised against TMW and the yard records layer. The next product-catalog entry inside that same portal is the multi-tenant yard-execution and appointment-arbitration layer above the records, billable through to shipper customers alongside drayage, transload, and dedicated fleet' },
        { label: 'Existing yard-tech layer', value: 'SalSon publicly states the Newark campus yard runs on its existing site-level yard tracking system; TMS is TMW (Trimble), public. Customer portal "My SalSon" aggregates TMW + the yard system + other tier-one inputs under a single shipper-facing UI — the productization muscle is already there. The yard-tech footprint beyond Newark is unverified; likely Newark-only today, with Compton, Florence, and the smaller secondary yards on different (or no) systems post-merger' },
        { label: 'PE ownership posture', value: 'Sun Capital Partners (Boca Raton FL) since August 2024. CEO Jason Fisk installed at the roll-up; 13-year Sun Capital tenure (Associate → Principal); replaced Anthony Berritto (Senior Business Advisor since Oct 2024 after 30+ years as President/CEO). Stated strategy: $20–50M tuck-ins at mid-single-digit EBITDA multiples; Mexico expansion flagged; William Blair engaged for M&A advisory (no retainer)' },
        { label: 'Revenue trajectory', value: 'Public Fisk-on-record framing: revenue "more than doubled since 2021" off ~$100M baseline → implied 2025/2026 run-rate $250M+. The M&A flywheel is on, not off. Every future tuck-in arrives with a different yard operating model, and standardizing across newly acquired yards is a known PE roll-up pain point' },
      ],
      hypothesis:
        'The interesting thing about the SalSon yard math is what the company already does well, not what is broken. The Newark 55-acre campus runs on a working records-layer yard tracking system that SalSon has publicly named on its own website — and putting your name to a vendor is a different kind of commitment than buying it quietly. TMS is on TMW. The My SalSon portal already wraps third-party systems under a single shipper-facing UI. The productization muscle to take a third-party capability and resell it as a branded service to drayage and transload customers is already exercised. That makes SalSon a different kind of conversation than an end-shipper procurement: the right unit of analysis is not "do you need yard tools" but "what is the next product-catalog entry for the shipper-facing service line that drayage and transload customers already pay for, alongside the existing drayage, transload, warehousing, and dedicated-fleet lines."\n\nThe TES-style productization motion — different label, same mechanics — has already happened once inside SalSon with the My SalSon portal. A 3PL operator that has wrapped TMW + the yard records layer into a branded shipper-facing surface and successfully billed shipper customers through it has demonstrated the commercial scaffolding for a second product-catalog entry. The yard-execution and multi-tenant orchestration layer above the records is the natural next entry: it sits inside the same portal architecture, it is shipper-facing by data model (appointment-window arbitration, gate-to-dock cycle, dwell, detention attribution), and it is the differentiated service line drayage competitors do not have. The August 2024 roll-up adds a second commercial reason: the operating-tool standard the seven-company integration is being consolidated onto is the standard every future $20–50M tuck-in inherits at the close — a standard that already includes a productized yard-execution layer de-risks the integration math at every future deal.\n\nThree windows are open simultaneously, and they are not always open together. First, integration across the seven-company merger is active today, not finished — that is the cheapest moment for a new operating-standard layer to enter, before each acquired entity calcifies onto its pre-acquisition tooling. Second, Compton CA is under construction (260,000 sq ft, 66 dock doors, 20-acre secured yard) — a greenfield where the yard-execution layer can ship as part of go-live rather than retrofit, and where the cost of specifying network-tier orchestration at the design phase is materially lower than retrofitting it after the building goes live. Third, port drayage yard variance is more expensive per event than almost any other logistics operation — missed windows, container detention, gate backup all compound faster than at a standard DC, and a productized yard-execution layer rebilled through to shipper customers turns variance from a cost line into a margin-accretive service line inside the contract-logistics P&L.',
      pullQuote: 'The right unit of analysis is not "do you need yard tools" but "what is the next product-catalog entry for the shipper-facing service line that drayage and transload customers already pay for."',
      caveat:
        'This is built from SalSon Logistics public disclosures, the Sun Capital Partners roll-up press cycle, Fisk\'s ION Analytics / Transport Topics on-record commentary, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which acquired yards from the August 2024 merger have been integrated onto the SalSon standard and which have not, whether Compton\'s yard-execution design is in the engineering conversation today, and how the productization economics would flow through the SalSon shipper service-line P&L.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the shipper-facing service catalog',
      artifact: {
        imageSrc: '/artifacts/salson-logistics-coverage-map.svg',
        imageAlt: 'Shipper-facing service-catalog coverage map. Six tiles representing the SalSon Logistics service-line footprint inside the My SalSon portal. Newark Flagship, Compton CA, Florence NJ Transload, Long Beach, and Atlanta are covered. The Yard-Execution-as-Service-Line tile is unfilled, marked with a SalSon blue hairline outline.',
        caption: 'Shipper-facing service-catalog coverage map · 1 line unfilled.',
        source: 'Composition modeled from public SalSon Logistics + Sun Capital Partners + Fisk on-record disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The read-across for SalSon is not direct — SalSon is a 3PL, not a CPG end-shipper — but it is the read-across that matters at this account: many of SalSon\'s most demanding shipper customers (consumer goods, food & beverage, retail importers) run multi-site networks shaped like Primo, and they need the operating layer above their site-level yard tech. Productizing the yard-execution layer into the SalSon shipper-facing service catalog means SalSon customer engagements gain access to that operating model as a SalSon-branded capability — alongside drayage, transload, and dedicated fleet — billable through to the shipper as part of the contract-logistics service line. If the operating model lands on the operationally hardest CPG freight in the country, the productization read-across to SalSon\'s drayage-and-warehousing customer base is the easier lift. The 3PL service-line economics make the case sharper than at an end-shipper account: each productized service line is a margin-accretive revenue stream rebilled across the customer base at contract-logistics gross margin, not a cost line absorbed against an internal P&L — which is what turns the yard-execution layer from a tooling decision into a service-catalog decision, and from a single deal into a 1-to-many distribution play across every shipper engagement SalSon already operates.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot at SalSon is Newark — the 55-acre flagship campus with three yards, ~2,000 containers/week, and the existing site-level yard tracking system that the productized layer above sits on. The follow-on is Compton CA at go-live — greenfield embed where the yard-execution layer ships as part of the operating standard rather than retrofit. From there, the rollout cadence is replicating across the seven post-merger entities and every future tuck-in arriving on Fisk\'s $20–50M cadence.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'salson-public-network',
          source: 'SalSon Logistics public site disclosures + Sun Capital portfolio listing',
          confidence: 'public',
          detail: 'Anchors the Newark NJ 55-acre flagship campus (3 yards, ~1M sq ft warehouse, 24/7 operations, ~2,000 containers/week, ~150 SalSon drivers in port daily, ~100,000 containers/year), the Florence NJ + Long Beach CA + Compton CA + secondary-market footprint, and the public statement that the Newark yard tracking system is in production.',
          url: 'https://www.salson.com/',
        },
        {
          id: 'salson-roll-up',
          source: 'SalSon Logistics August 2024 seven-company merger (Sun Capital Partners)',
          confidence: 'public',
          detail: 'Sun Capital combined seven companies under SalSon Logistics in August 2024: SalSon (Berritto family), Sierra Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer, TriPack Logistics. Aggregate post-merger: ~3M sq ft dry warehouse, ~2M sq ft yard space, ~1,000+ tractors, ~1,200 trailers, ~2,500 chassis, ~1,000+ employees.',
        },
        {
          id: 'salson-fisk-on-record',
          source: 'Fisk on-record interviews (ION Analytics / Transport Topics / Yahoo Finance press)',
          confidence: 'public',
          detail: 'Revenue "more than doubled since 2021" off ~$100M baseline → implied 2025/2026 run-rate $250M+. Stated $20–50M tuck-in target at mid-single-digit EBITDA multiples; Mexico expansion flagged as next strategic geography; William Blair engaged for M&A advisory (no retainer). Fox Business Network appearance during 2024 East Coast port strikes — comfortable as a public-facing CEO.',
        },
        {
          id: 'salson-tech-stack',
          source: 'SalSon Logistics published technology stack',
          confidence: 'public',
          detail: 'TMS: TMW (Trimble) — publicly confirmed for shipment planning, dispatch, fleet management, route optimization, process automation. Customer portal "My SalSon" aggregates TMW + yard tracking + other tier-one systems under a single shipper-facing UI. SmartWay Transport Partner; 150+ zero-emission vehicles (CNG, electric, hydrogen mix). Compton CA positioned as a green-fleet hub.',
        },
        {
          id: 'salson-leadership',
          source: 'SalSon executive transitions (2024)',
          confidence: 'public',
          detail: 'Jason Fisk installed as CEO at the August 2024 roll-up after 13 years at Sun Capital Partners (Associate → Principal). Anthony Berritto stepped into Senior Business Advisor role October 2024 after 30+ years as President/CEO. Michael Berritto remains as EVP Sales; Ralph S. is VP Operations (last name unverified); Mike Stevens is VP Truckload Operations (appointed Jan 2021).',
        },
        {
          id: 'fisk-tenure-record',
          source: 'Jason Fisk tenure record — Sun Capital Partners → SalSon Logistics (LinkedIn + Sun Capital portfolio disclosures + Sky Grove Capital co-founder filings)',
          confidence: 'public',
          detail: '~13-year tenure inside Sun Capital Partners (Associate → Principal), with stated underwriting and deal-architecture role on the August 2024 seven-company SalSon roll-up before stepping into the CEO seat at the close. Co-founder of Sky Grove Capital (Florida-focused investment vehicle). Public-facing CEO posture (Fox Business Network appearance during the 2024 East Coast port strikes); ION Analytics / Transport Topics / Yahoo Finance press cycle on the roll-up and the stated $20–50M tuck-in cadence at mid-single-digit EBITDA multiples. The tenure shape matters because it explains why the SalSon operating standard is being built to PE hold-period cadence — every operating decision is benchmarked against tuck-in integration math and exit-multiple expansion, not against single-customer procurement cycles.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on container drayage gate-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most port-focused 3PL networks operate under, not SalSon specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to SalSon via the "SalSon\'s shipper customers look operationally like Primo" read-across.',
        },
      ],
      unknowns: [
        'Which of the seven post-merger entities have been integrated onto the SalSon operating standard, and which still run on their pre-acquisition yard models',
        'How the existing Newark yard tracking system\'s data is currently surfacing into the My SalSon portal — and where the gap to a true execution + orchestration layer sits today',
        'Whether the Compton CA yard-execution design is in the engineering conversation today, or expected to ship at construction completion with whatever the SalSon-standard tool is at that moment',
        'How the productization economics would flow through the SalSon shipper service-line P&L (per-site SaaS + customer rebill, multi-tenant revenue share, embedded in drayage contract pricing) — Sun Capital EBITDA / multiple math is the relevant frame',
        'Whether the existing yard tracking incumbent has the rights to extend its product to a multi-tenant shipper-facing execution layer, or whether that is a clean greenfield opportunity for a partnership',
        'Which Sun Capital portfolio-services contacts are positioned to make warm introductions if direct outreach to Fisk does not land',
        'What the integration scorecard looks like for the seven-company merger today — which yard, dispatch, and customer-portal decisions across SalSon, Sierra Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer, and TriPack Logistics have been locked onto the SalSon standard, which are still in flight, and where the standard-setting authority sits between Fisk, Ralph S. (VP Operations), and Mike Stevens (VP Truckload Operations)',
        'How the productized yard-execution service line would be priced into the drayage and contract-logistics customer agreements — bundled into existing per-container rates, broken out as a separate per-site SaaS rebill line, or scoped as a value-added service tier with its own attach-rate target — and how that pricing model affects the EBITDA contribution math Sun Capital underwrites against the hold-period exit multiple',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a 3PL partnership engagement, not a single-site procurement engagement. SalSon is distinctive in this round because the question is not whether yard tools belong in the drayage operating model (the Newark campus runs on a working records-layer system SalSon has publicly named) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next product-catalog entry alongside drayage, transload, and dedicated fleet — distributed across shipper customers as a SalSon-branded service inside the My SalSon portal you already operate. Jason, the deal-architecture you assembled at Sun Capital — seven companies into one platform in August 2024, $20–50M tuck-in cadence on mid-single-digit EBITDA multiples, William Blair engaged for the next leg — is the architecture that turns this from a yard-tools conversation into a service-line conversation. The memo is shaped to that architecture, not to a vendor-procurement cadence. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and many of SalSon\'s most demanding shipper customers (consumer goods, food & beverage, retail importers) look operationally like Primo. Productizing the yard-execution layer into the SalSon service catalog means many customer engagements gain it as a SalSon-branded capability rather than as a separately sourced shipper tool — a margin-accretive service line, not a tooling cost on the corporate tech budget.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Jason — the part most worth pushing back on is whether the productization motion you have already run once inside SalSon (My SalSon wrapping TMW + the Newark yard records layer into a shipper-facing branded surface, billable through to drayage and transload customers) is set up to absorb a second product-catalog entry — and whether yard-execution is the right next entry against your $20–50M tuck-in cadence and the operating standard the seven-company integration is consolidating onto. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: a partnership-scoping conversation framed against the EBITDA contribution math Sun Capital underwrites against the hold-period exit multiple, a 90-day pilot at Newark with revenue-attached success metrics rebilled through the My SalSon portal, or a Compton greenfield design review with Ralph S. and Mike Stevens — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'salson-logistics-001',
      name: 'Jason Fisk',
      firstName: 'Jason',
      lastName: 'Fisk',
      title: 'Chief Executive Officer',
      company: 'SalSon Logistics',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations',
      currentMandate:
        'CEO of SalSon Logistics since the August 2024 Sun Capital seven-company roll-up. ~13 years at Sun Capital Partners (Associate → Principal); underwrote and led the SalSon merger before stepping into the operating seat. Co-founder of Sky Grove Capital (Florida-focused). Stated $20–50M tuck-in target at mid-single-digit EBITDA multiples; Mexico expansion flagged; William Blair engaged for M&A advisory. Public-facing CEO (Fox Business during 2024 East Coast port strikes). Decision style: capital-allocation framed, speed-biased, delegates day-to-day operations to lieutenants (Ralph S. VP Operations; Mike Stevens VP Truckload Operations).',
      bestIntroPath:
        'PE peer-coded direct outreach with M&A-roll-up angle (not operations-efficiency angle). If Fisk delegates downward: Ralph S. (VP Operations) for operating-layer evaluation, Mike Stevens (VP Truckload Operations) for fleet-side perspective, Michael Berritto (EVP Sales) if the question is shipper-sellable. Sun Capital portfolio-services warm intro is the backup if direct outreach does not land — Fisk spent 13 years at Sun Capital, a Sun Capital connection gets him to take a meeting.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'salson-logistics-001',
        name: 'Jason Fisk',
        firstName: 'Jason',
        lastName: 'Fisk',
        title: 'Chief Executive Officer',
        company: 'SalSon Logistics',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Jason Fisk - Chief Executive Officer',
      variantSlug: 'jason-fisk',

      framingNarrative:
        'Jason, you have run this motion once already inside SalSon. The My SalSon portal wraps TMW + the existing site-level yard tracking at Newark into a single shipper-facing branded surface, billable through to drayage and transload customers as part of the contract-logistics service line. That is the productization muscle Sun Capital underwrote against when the seven-company roll-up closed in August 2024. The next product-catalog entry that fits inside that same portal — and that drayage competitors do not have — is the multi-tenant yard-execution and orchestration layer above the records, distributed across shipper customers as a SalSon-branded margin-accretive service line, designed for the seven-company operating standard, ready to embed at Compton greenfield, and the standard the next $20–50M tuck-in inherits at the close.',
      openingHook:
        'My SalSon already wraps TMW and the Newark yard records layer into a single shipper-facing branded surface. The productization motion is run, the commercial scaffolding is in. The next product-catalog entry is the multi-tenant yard-execution layer above the records — sold to shippers as a SalSon-branded service line, designed for the seven-company roll-up, ready to embed at Compton greenfield, and the standard every $20–50M tuck-in arrives onto at the close. A margin-accretive service line your sales team can attach across the customer base, not a tooling cost on the corporate tech budget.',
      stakeStatement:
        'Three windows are open simultaneously and they are not always open together. First, the seven-company integration is active today, not finished — the cheapest moment for a new operating-standard layer to enter is before each acquired entity calcifies onto its pre-acquisition tooling. Second, Compton CA is under construction (260,000 sq ft, 66 dock doors, 20-acre secured yard) — a greenfield where the yard-execution layer ships at go-live rather than retrofit, materially cheaper than retrofitting after the building is live. Third, every future $20–50M tuck-in on your stated cadence arrives with a different yard operating model — a SalSon operating standard that already includes a productized yard-execution layer is a known PE roll-up de-risking lever at every future close, and a customer-stickiness switching-cost flex inside the hold-period exit-multiple math Sun Capital underwrites.',

      heroOverride: {
        headline: 'The next product-catalog entry alongside drayage, transload, and dedicated fleet.',
        subheadline:
          'Newark records layer is doing what it was bought to do. The next move is the multi-tenant yard-execution layer above it — sold to shippers as a SalSon-branded service inside the My SalSon portal, designed for the seven-company roll-up, ready to embed at Compton greenfield, and the standard the next $20–50M tuck-in arrives onto.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'PE peer-coded, partnership-coded, deal-architecture register. Fisk reads pitches like a banker reads a CIM — 13 years at Sun Capital from Associate to Principal before the operating seat means marketing language is discounted in real time and EBITDA contribution math, multiple expansion, hold-period cadence, and tuck-in integration de-risking are rewarded. Acknowledge the existing site-level yard tracking at Newark explicitly — SalSon publicly named that deployment on its own website, pretending otherwise burns the conversation. Frame the yard-execution layer as the next product-catalog entry inside My SalSon, not as a tool acquisition. Reference the seven-company roll-up integration window and the $20–50M tuck-in cadence as the structural reasons the timing matters, not as flattery. Cycle-time minutes belong in the second deck for Ralph S. (VP Operations) and Mike Stevens (VP Truckload Operations); the CEO deck stays in service-line economics. Be honest about pilot scope: 90 days, single yard, revenue-attached success metrics rebilled through the portal. Short.',
      kpiLanguage: [
        'product-catalog entry (alongside drayage, transload, dedicated fleet)',
        'margin-accretive service line',
        'EBITDA contribution + multiple expansion',
        'tuck-in integration de-risking at the close',
        'customer-stickiness as switching cost',
        'multi-tenant yard-execution layer',
        'shipper-facing branded surface (My SalSon)',
        'Compton greenfield embed at go-live',
        '90-day pilot with revenue-attached success metrics',
        'hold-period exit-multiple math',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the SalSon-specific read-across is "SalSon\'s shipper customers look operationally like Primo," not "SalSon itself is Primo-shaped." Productization across SalSon\'s customer base — billable through to shippers, embedded in contract-logistics service-level reporting inside the My SalSon portal — is what turns one operating-model proof into a 1-to-many distribution play and a margin-accretive service line that compounds across every future tuck-in. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if the conversation moves to peer reference.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Newark NJ flagship 55-acre campus (3 yards, ~1M sq ft warehouse, 24/7, ~2,000 containers/week, ~100,000 containers/year) + Florence NJ transload hub + Long Beach CA + Compton CA (260,000 sq ft / 66 dock doors / 20-acre secured yard under construction) + Atlanta + Bakersfield + Charleston SC + Houston + Inland Empire CA + Norfolk VA + Oakland CA + Savannah GA + Tacoma WA',
    facilityTypes: ['Port Logistics Centers', 'Container Yards', 'Warehouses', 'Distribution Facilities', 'Transload Hubs'],
    geographicSpread: 'Bicoastal US (HQ: Newark NJ + Long Beach CA; operating in 10+ markets across NJ, NY, CA, GA, SC, TX, VA, WA, FL)',
    dailyTrailerMoves: '~2,000 containers/week through Newark flagship alone (~150 SalSon drivers in port daily); aggregate: ~1,000+ tractors, ~1,200 trailers, ~2,500 chassis across the merged network',
    fleet: 'Private fleet signal confirmed (yes) — SmartWay Transport Partner; 150+ zero-emission vehicles (CNG, electric, hydrogen mix); Compton CA positioned as a green-fleet hub',
  },

  freight: {
    primaryModes: ['Drayage', 'Truckload', 'LTL', 'Transload', 'Warehousing', 'Dedicated Fleet'],
    avgLoadsPerDay: '~2,000 containers/week through Newark flagship alone (~100,000 containers/year); aggregate ~1,000+ tractors, ~1,200 trailers, ~2,500 chassis across the seven-company post-merger network. Customer base "major importers and retailers" across consumer goods, food & beverage, apparel/retail',
    specialRequirements: [
      'Port logistics + container drayage (Newark on the East Coast, Long Beach on the West Coast)',
      'Chassis management (~2,500 chassis aggregate)',
      'Food-grade DC capability',
      'Multi-customer container yard orchestration (multi-tenant by design)',
      '"Port-to-shelf in 48 hours" published value-prop',
    ],
  },

  signals: {
    recentNews: [
      'Sun Capital Partners completed seven-company roll-up in August 2024 — SalSon, Sierra Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer, TriPack Logistics.',
      'Jason Fisk installed as CEO at the roll-up (October 2024); Anthony Berritto stepped into Senior Business Advisor role after 30+ years as President/CEO; Michael Berritto remains as EVP Sales.',
      'Revenue "more than doubled since 2021" off ~$100M baseline (Fisk on record); implied 2025/2026 run-rate $250M+.',
      'Compton CA 260,000 sq ft / 66 dock doors / 20-acre secured yard under construction — greenfield embed window.',
      'Fisk stated strategy: $20–50M tuck-in target at mid-single-digit EBITDA multiples; Mexico expansion flagged as next strategic geography; William Blair engaged for M&A advisory (no retainer).',
      'Fox Business Network appearance during 2024 East Coast port strikes — public-facing CEO posture.',
    ],
    urgencyDriver:
      'The August 2024 seven-company roll-up created an active integration window where each merged entity arrived with its own dispatch, yard, and customer mix. Operating-tool integration across the seven is an active workstream, and the cleanest moment for a new yard-execution and multi-tenant-orchestration layer to enter the SalSon operating standard is now, while integration is still active. Compton CA is under construction as a greenfield embed window. Every future $20–50M tuck-in on Fisk\'s stated cadence arrives with a yard operating model that has to be reconciled against the SalSon standard — and a standard that already includes a productized yard-execution layer is a known PE roll-up de-risking lever at every future close.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'The roll-up', body: 'Seven companies into one platform · August 2024 · Sun Capital underwrite.' },
    { mark: 'Newark scoreboard', body: '55-acre flagship · 3 yards · ~2,000 containers/week · ~100,000/year.' },
    { mark: 'Greenfield', body: 'Compton CA · 260K sq ft · 66 dock doors · 20-acre secured yard · under construction.' },
    { mark: 'Fisk on the record', body: 'Revenue more than doubled since 2021 · $20–50M tuck-in cadence at mid-single-digit EBITDA multiples.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Jason Fisk. The deal-architecture you assembled at Sun Capital — seven companies into one platform in August 2024, $20–50M tuck-in cadence on mid-single-digit EBITDA multiples — is the architecture that turns the next five minutes from a tooling conversation into a service-line conversation.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#2D6A9F',
  },
};
