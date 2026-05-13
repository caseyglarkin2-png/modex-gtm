/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * DHL/Exel is named in the Kaleris/PINC customer roster via the Daimler
 * case study and HID/RFID.com references. Exel-era PINC YMS deployments
 * still exist in the DHL network; specific active-site list is not public.
 * The pitch is NOT displacement — Adrian's team knows the YMS landscape
 * cold and PINC functions as a system of record at the gate-and-yard layer
 * where deployed. YardFlow positions as the execution + multi-tenant
 * orchestration layer above the records layer.
 *
 * Pitch shape: PARTNERSHIP — not end-shipper procurement, not coexistence
 * wedge against an incumbent. DHL productizes third-party tech (Locus,
 * Boston Dynamics, Orange EV) into the DHL operating standard and resells
 * it as a managed-service component to thousands of shipper customers.
 * YardFlow fits that exact distribution model for the yard-execution layer.
 *
 * This intel powers the partnership cold-email framing (see
 * docs/research/adrian-kumar-dhl-supply-chain-dossier.md). It must not
 * appear in any prospect-facing surface — including proofBlocks which
 * feed memo-compat's fallback comparable section.
 */

/**
 * DHL Supply Chain — ABM Microsite Data
 * Quality Tier: A (probable Kaleris customer — DHL/Exel referenced via
 * Daimler case study + RFID.com; specific NA active-site list not public)
 * Pitch shape: PARTNERSHIP — YardFlow as the yard-execution + multi-tenant
 * orchestration layer that enters the DHL solutions-design operating
 * standard the same way Locus, Boston Dynamics, and Orange EV did
 * Angle: YARD MANAGEMENT — multi-tenant dock orchestration, instrumented
 * yard-truck workflows, shipper-specific appointment-window arbitration,
 * acquired-network SOP standardization. NOT driver experience.
 * Stakeholder vocabulary: engineering / solutions-design register
 * (Adrian's Industrial Engineering background, 50+ engineers, 500+
 * projects/year, 5-step innovation framework) — frameworks, costed
 * assumptions, named comparison vendors. Not transformation register.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const dhlSupplyChain: AccountMicrositeData = {
  slug: 'dhl-supply-chain',
  accountName: 'DHL Supply Chain',
  coverHeadline: 'The yard-execution layer in the DHL operating standard',
  titleEmphasis: 'in the DHL operating standard',
  coverFootprint: '1,000+ sites globally',
  parentBrand: 'DHL Group',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 79,

  pageTitle: 'YardFlow for DHL Supply Chain - The Yard-Execution Layer for the DHL Operating Standard',
  metaDescription:
    'How the multi-tenant yard-execution layer enters the DHL Supply Chain solutions-design operating standard — the same productization path Locus, Boston Dynamics, and Orange EV took — and distributes across 1,000+ customer-facing facilities.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the DHL Supply Chain operating model',
      composition: [
        { label: 'Network scale', value: '1,000+ facilities under management globally; 52,000 NA associates under CEO Mark Kunar (confirmed May 2026); NA HQ Westerville OH' },
        { label: 'Solutions Design Americas as the technology gatekeeper', value: 'Adrian Kumar runs a 50+ engineer Solutions Design Americas team carrying 500+ projects/year and ~$10B+ annual contract spend across all DHL Supply Chain Americas customer engagements. That seat is the engineering gatekeeper for what enters the DHL operating standard. The on-record framework: identify a customer-side need → pilot a partner technology → roll out to a customer site → embed in the operating standard → productize across the customer base' },
        { label: 'Customer-facing surface', value: 'Every facility is a customer-facing site by definition — yard performance is a customer-experience surface in a way it never is for a CPG end-shipper. Customers include Diageo NA (Plainfield IL), Daimler, and hundreds of Fortune-500 shippers across consumer, retail, auto-mobility, life sciences, e-commerce' },
        { label: 'Multi-tenant surface area', value: 'Multi-customer DCs (IDS Fulfillment acquisition: 1.3M sq ft across Atlanta, Indianapolis, Salt Lake City, Plainfield IN); the DHL ReTurn Network (11 multi-customer returns facilities, launched Oct 2025 — DHL\'s first publicly named multi-tenant network product); 10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics (announced March 2026) — multi-shipper trailer fleets behind shared gates under shipper-specific appointment-window arbitration' },
        { label: 'Productization template (the partnership thread)', value: 'The repeatable Solutions Design motion is documented across multiple partner technologies: pilot a partner technology at one customer site, validate KPIs against the operating-standard scorecard, scale across the multi-tenant network, embed into the DHL operating standard, distribute across customer engagements as a DHL-branded capability inside contract-logistics service-level reporting. Locus Robotics, Boston Dynamics Stretch, and Orange EV are the documented walks. The yard-execution and multi-tenant orchestration layer is the next obvious adjacency in that pipeline — the operating layer above whatever site-level yard tools any given customer engagement inherited' },
        { label: 'Partnership precedents (the numeric template)', value: 'Locus Robotics · 6+ year partnership · 5,000+ LocusBots across 35+ DHL-managed sites worldwide · 500M+ picks milestone mid-2024 · the canonical productization walk. Boston Dynamics Stretch · 1,000+ additional units under May 2025 MOU framed as "moving beyond a traditional vendor relationship" · case-handling pilot to operating-standard catalog entry. Orange EV · first customer Oct 2015 at Diageo Plainfield · ~100 NA yard trucks today · 50-truck milestone Jan 2024. The numeric and commercial shape any next operating-standard entry will be benchmarked against' },
        { label: '2025 acquisition window in active SOP integration', value: 'Inmar Supply Chain Solutions (14 returns centers, ~800 associates, Jan 2025 — made DHL the largest reverse-logistics provider in NA); CRYOPDP specialty pharma courier (Mar 2025, ~$200M, clinical trials and cell/gene therapy logistics); IDS Fulfillment (May 2025, 1.3M sq ft e-commerce DC space). 14+ acquired yards being re-SOP\'d into the DHL operating standard concurrently — the one window in a decade when a new layer can enter the standard at integration speed instead of after' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard-management deployments exist in parts of the NA network as system of record (vehicle/asset tracking, gate logs). The multi-tenant execution and orchestration layer above the records layer is unsolved — and the IDS / ReTurn / data-center logistics expansions are by-definition multi-tenant yards the legacy single-tenant tools were not designed for' },
      ],
      hypothesis:
        'The interesting thing about DHL Supply Chain is not whether yard tools belong in the operating model. There are records-layer yard deployments in parts of the NA network today, and operations continue. The interesting thing is that DHL Supply Chain is a 3PL operator, not an end-shipper, and that flips the unit of analysis. Every facility under management is a customer-facing yard. Diageo measures its decarbonization story at Plainfield by what happens on the DHL-operated yard there. The Inmar returns network\'s 14 sites are DHL-branded customer experiences for retail clients running reverse logistics in parallel. The IDS Fulfillment multi-customer DCs are by definition multi-shipper yards where different fleets compete for the same docks under shipper-specific appointment rules. The 10 new data-center logistics sites coming online in 2026 are multi-hyperscaler by design. The single-tenant yard tools that exist in the network today were specified for a different operating model — one customer per site, gate-and-locate records, dwell-and-detention reporting — and they sit at the system-of-record layer rather than the execution-and-multi-tenant-orchestration layer above it. That gap is the operating-system gap the Solutions Design Americas function exists to close, not by procuring a point tool but by productizing operating capability for the customer base.\n\nThe Solutions Design productization template is the right way to read the rest of this. The repeatable motion under Adrian\'s team is documented across multiple partner technologies: identify a customer-side operating gap, pilot a partner technology at one site, validate the lift, scale across the multi-tenant network, embed into the DHL operating standard, distribute across customer engagements as a DHL-branded capability inside contract-logistics service-level reporting. Locus is the canonical proof — pilot to 5,000+ LocusBots across 35+ DHL-managed sites worldwide and a 500M+ pick milestone. Boston Dynamics walked the same path — case-handling pilot to a 1,000-unit Stretch MOU framed explicitly as "moving beyond a traditional vendor relationship." Orange EV walked it too — first customer in October 2015 at Diageo Plainfield to ~100 NA yard trucks today. The yard-execution and multi-tenant orchestration layer is the obvious next entry in that catalog: it is multi-tenant from the data model up (which the 3PL operating model requires), it generates the operating-KPI shape the Solutions Design Americas scorecard already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and it travels across customer engagements the same way Locus and Stretch did.\n\nTwo things make the timing distinctive, and they are not always open at the same time. First, the 2025 acquisition cadence (Inmar Jan 2025 / CRYOPDP Mar 2025 / IDS May 2025) loaded 14+ acquired yards into active SOP integration concurrently — operating standards are being rewritten across multiple sites at the same moment, which is the one window in a decade when a new layer can enter the standard at integration speed rather than after. Second, the data-center logistics expansion (10 sites, 7M+ sq ft, announced March 2026) is a greenfield multi-tenant yard surface — and the cost of specifying network-tier yard orchestration into a Solutions-Design-engineered greenfield at the design phase is materially lower than retrofitting after the building goes live. The ReTurn Network (11 multi-customer returns facilities, launched Oct 2025) is DHL\'s first publicly named multi-tenant network product, which makes it the cleanest A/B against single-tenant legacy tools. The unit of analysis is not "does DHL Supply Chain need a YMS" — DHL has yard tech where it needs records. The unit of analysis is whether the yard-execution layer is the right next entry in the operating-standard catalog, and whether it productizes the same 1-to-many way Locus and Stretch did.',
      pullQuote: 'The yard problem is not internal — it is customer-facing. Every facility you operate is a customer\'s yard.',
      caveat:
        'This is built from DHL Group public press releases, DHL Supply Chain announcements, the public partnership track record (Locus, Boston Dynamics, Orange EV, Nikola), the 2025 acquisition disclosures, and Adrian Kumar\'s published interviews and conference talks. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which IDS / Inmar / ReTurn sites are running multi-tenant yard contention most acutely, where the operating-standard rewrite from the 2025 acquisitions is most receptive to a new layer, and how the joint-scoping opportunity at Diageo Plainfield could be sequenced.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the DHL operating standard',
      artifact: {
        imageSrc: '/artifacts/dhl-supply-chain-coverage-map.svg',
        imageAlt: 'DHL operating-standard coverage map. Six tiles representing the partner technologies that have entered the DHL Solutions Design Americas operating-standard catalog. Locus, Boston Dynamics Stretch, Orange EV, Symbotic, and ReTurn Network are covered. The Yard Network Ops tile is unfilled, marked with a DHL yellow hairline outline.',
        caption: 'DHL operating-standard coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public DHL Group + DHL Supply Chain + Solutions Design Americas + partnership disclosures (Locus, Boston Dynamics, Orange EV, Symbotic, ReTurn Network). Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The read-across for DHL Supply Chain is not direct — DHL is not a CPG end-shipper — but it is the read-across that matters at this account: many of DHL\'s most demanding shipper customers (Diageo, the consumer-vertical anchor accounts, the food-and-beverage anchor accounts) look operationally like Primo. They run multi-site networks with mature site-level yard tech already in place and they need the operating layer above it. Productizing the yard-execution layer into the DHL solutions-design standard means many DHL customer engagements gain access to that operating model as a DHL-branded capability — the same way Locus picking is now a DHL capability the customer doesn\'t source separately, the same way Stretch case-handling is becoming a DHL capability, the same way the Orange EV / Nikola decarbonized yard fleet is the DHL-branded story at Diageo Plainfield. If the operating model lands on the operationally hardest CPG freight in the country, the productization read-across to DHL\'s shipper customer base is the easier lift — and it is what turns a single end-shipper deal into a 1-to-many distribution play across DHL\'s customer network. The partnership-economics question, in one line: is the yard-execution layer a DHL-branded capability the Solutions Design Americas catalog distributes across customer engagements (per-site SaaS plus rebill, multi-tenant revenue share, white-label embed inside contract-logistics service-level reporting), the same commercial shape Locus and Stretch already travel under — or a per-customer line item that peer 3PLs all under-deliver on equally.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot configurations at DHL are different from end-shipper pilots: (1) Diageo Plainfield as a joint DHL-customer-YardFlow scoping site — DHL operates the yard, Diageo measures the customer-experience surface, YardFlow is in conversation with both; (2) one ReTurn Network multi-customer returns facility — by-definition multi-tenant, by-definition new operating standard, by-definition the cleanest A/B against single-tenant legacy tools; (3) one IDS Fulfillment multi-customer e-commerce DC where shipper-specific appointment-window arbitration is the visible pain.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'dhl-group-press',
          source: 'DHL Group + DHL Supply Chain press releases',
          confidence: 'public',
          detail: 'Anchors the 1,000+ global facilities figure, 52,000 NA associates, Mark Kunar NA CEO confirmation (May 2026), and the Strategy 2030 framing (50% revenue growth by 2030 vs. 2023 baseline).',
          url: 'https://group.dhl.com/',
        },
        {
          id: 'dhl-2025-ma',
          source: 'DHL 2025 acquisition disclosures',
          confidence: 'public',
          detail: 'Inmar Supply Chain Solutions (Jan 2025, 14 returns centers, ~800 associates — made DHL the largest reverse-logistics provider in NA); CRYOPDP specialty pharma courier (Mar 2025, ~$200M, 600K+ shipments/year, clinical trials and cell/gene therapy logistics); IDS Fulfillment (May 2025, 1.3M sq ft across Atlanta, Indianapolis, Salt Lake City, Plainfield IN). 14+ yards in active SOP integration.',
        },
        {
          id: 'dhl-return-network',
          source: 'DHL ReTurn Network launch (Oct 2025)',
          confidence: 'public',
          detail: '11 purpose-built multi-customer returns facilities — DHL\'s first publicly named multi-tenant network product. The multi-tenant yard problem becomes a productized public offering, not just an operating reality.',
        },
        {
          id: 'dhl-data-center-logistics',
          source: 'DHL data-center logistics expansion (announced March 2026)',
          confidence: 'public',
          detail: '10 new dedicated warehouse sites totaling 7M+ sq ft for hyperscale / colo data-center logistics customers. Multi-hyperscaler by design; new vertical, new yard profile (rack pre-configuration, specialized transport, white-glove handling).',
        },
        {
          id: 'dhl-automation-track-record',
          source: 'DHL partnership track record (Locus, Boston Dynamics, Orange EV, Nikola)',
          confidence: 'public',
          detail: 'Locus Robotics: 5,000+ LocusBots across 35+ DHL-managed sites worldwide; 500M+ picks milestone. Boston Dynamics: 1,000+ additional Stretch robots under MOU signed May 2025 (framed as "moving beyond a traditional vendor relationship"). Orange EV: ~100 NA yard trucks; first deployment at Diageo Plainfield IL, October 2015. Nikola hydrogen Class 8 at Diageo Plainfield (Oct 2024). The public template for how partner technology enters the DHL operating standard.',
        },
        {
          id: 'adrian-kumar-public',
          source: 'Adrian Kumar public profile and conference appearances',
          confidence: 'public',
          detail: 'Public framing of the Solutions Design productization motion — pilot a partner technology, validate at one customer site, embed in the operating standard, distribute across the customer base — and the swarming AMR model (orchestration over rigid task assignment). Public speaking footprint: Robotics Summit & Expo, LiveWorx \'18, OPEX Exchange, ICPR25 Chicago, SupplyChainBrain bylined author.',
        },
        {
          id: 'adrian-kumar-tenure',
          source: 'Adrian Kumar tenure record — DHL Supply Chain Solutions Design Americas (LinkedIn + DHL executive disclosures + University of Toronto / Ohio University alumni records)',
          confidence: 'public',
          detail: 'VP Solutions Design Americas. 50+ engineers across the team; 500+ projects/year; ~$10B+ contract spend designed annually across all DHL Supply Chain Americas customer engagements. Master\'s in Industrial Engineering (University of Toronto); adjunct instructor at Ohio University. Architect of the DHL Locus deployment (5,000+ bots across 35+ DHL-managed sites worldwide), the Boston Dynamics Stretch program through the May 2025 1,000-unit MOU, and the swarming AMR orchestration model. The tenure shape matters because it explains why Solutions-Design-internal productization moves at partnership cadence rather than vendor-procurement cadence — and why the entry sequence runs through the engineering seat rather than enterprise procurement.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges in multi-tenant 3PL operating contexts. These describe the conditions most contract-logistics networks operate under, not DHL specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — most directly applicable to DHL via the "DHL\'s shipper customers look operationally like Primo" read-across, not as DHL\'s own internal metrics.',
        },
      ],
      unknowns: [
        'Which acquired-network sites (Inmar / IDS / CRYOPDP) are most receptive to entering a new operating-standard layer right now, given the active SOP integration cadence',
        'Whether the Diageo Plainfield joint-scoping opportunity is actionable on the DHL side as a co-scoped pilot, given DHL\'s existing decarbonization narrative there (~100 NA Orange EV trucks, Nikola hydrogen Class 8 since Oct 2024)',
        'How shipper-specific appointment-window arbitration is handled today at the IDS Fulfillment multi-customer DCs and the ReTurn Network sites — system logic, operator judgment, or per-customer per-site policy',
        'How the data-center logistics expansion (10 sites, 7M+ sq ft, announced March 2026) is being designed at the yard layer — and whether network-tier orchestration is in the solutions-design conversation now or expected to retrofit later',
        'How the partnership economics would be structured for productization (per-site SaaS plus rebill, multi-tenant revenue share, white-label embedded in DHL contract-logistics service-level reporting) — Strategy 2030 customer-win velocity is the relevant metric, not internal cost-out',
        'What KPI thresholds the Solutions Design Americas operating-standard scorecard requires for a partner-technology pilot to graduate from one-site validation into customer-base productization — the Locus walk (one pilot → 5,000+ bots across 35+ sites → 500M+ picks) and the Stretch walk (case-handling pilot → 1,000-unit MOU) are public reference points, but the internal pass/fail thresholds and review cadence for net-new operating-standard entries are not',
        'How DHL\'s customer contracts treat embedded partner technology layered into contract-logistics service-level reporting — whether operating-standard productization for a yard-execution layer requires per-customer commercial amendment, per-engagement scoping, or rolls into existing master service agreements at Solutions Design discretion the way Locus and Stretch already do',
        'Whether the Innovation in Practice Americas format or a Westerville Innovation Center scoping session is the right entry point for a solutions-design-led conversation',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a partnership engagement, not a single-site procurement engagement. DHL Supply Chain is distinctive in this round because the question is not whether yard tech belongs in the 3PL operating model (it already does, at the system-of-record layer) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next addition to the DHL operating standard — the same productization path Locus, Boston Dynamics, and Orange EV have already taken inside DHL. Adrian, your team is the only Solutions Design Americas seat in NA that has run that pattern end-to-end at the cadence the operating-standard catalog now formalizes; the memo is shaped to that pattern, not to a vendor-procurement cadence. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of DHL\'s most demanding shipper customers (Diageo, the consumer-vertical anchors) look operationally like Primo. Productizing the yard-execution layer into the DHL solutions-design standard means many customer engagements gain it as a DHL-branded capability rather than as a separately sourced shipper tool.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Adrian — the part most worth pushing back on is whether the Solutions Design productization motion you ran end-to-end with Locus (pilot to 5,000+ bots across 35+ sites to 500M+ picks) and Stretch (case-handling pilot to the May 2025 1,000-unit MOU) is currently scoped to a single next-adjacency pipeline, or whether the operating-standard catalog is taking concurrent entries — and where the yard-execution layer lands in that sequence if so. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: a Solutions Design Americas scoping session against the operating-standard scorecard, an Innovation in Practice Americas slot, a Westerville Innovation Center conversation, or routing through Meredith Williams / Matthew Dippold / Ben Perlson if the engineering lift is delegated — not necessarily a vendor demo.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'dhl-supply-chain-001',
      name: 'Adrian Kumar',
      firstName: 'Adrian',
      lastName: 'Kumar',
      title: 'VP, Solutions Design Americas',
      company: 'DHL Supply Chain',
      email: 'adrian.kumar@dhl.com',
      linkedinUrl: 'https://www.linkedin.com/in/adrian-kumar-dhl/',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Operations',
      currentMandate:
        'Runs a 50+ engineer Solutions Design team carrying 500+ projects/year and ~$10B+ annual contract spend across all DHL Supply Chain Americas customer engagements. Public methodology: identify a customer-side need → pilot a partner technology → roll out to a customer site → productize across the customer base. Architect of DHL\'s Locus deployment (5,000+ bots), the Boston Dynamics Stretch program, and the swarming AMR model. Master\'s Industrial Engineering (U of Toronto); adjunct instructor at Ohio University; recurring conference speaker.',
      bestIntroPath:
        'Warm intro via Diageo (Marsha McIntosh-Hamilton) framed as joint-scoping at Plainfield IL — DHL operates the yard, Diageo measures the customer-experience surface, YardFlow is in conversation with both. Secondary: Innovation in Practice Americas slot or a Westerville Innovation Center scoping session. Alternates if Adrian delegates: Meredith Williams (Sr. Director, Solutions Design NA / Global Lead, Solutions Design Automation Practice); Matthew Dippold (Director, Accelerated Digitalization NA); Ben Perlson (Westerville Innovation Center, Robotics & Automation).',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'dhl-supply-chain-001',
        name: 'Adrian Kumar',
        firstName: 'Adrian',
        lastName: 'Kumar',
        title: 'VP, Solutions Design Americas',
        company: 'DHL Supply Chain',
        email: 'adrian.kumar@dhl.com',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Adrian Kumar - VP Solutions Design Americas',
      variantSlug: 'adrian-kumar',

      framingNarrative:
        'Adrian, you have run the Solutions Design productization motion end-to-end already — identify a customer-side need, pilot a partner technology at one customer site, validate the lift, scale across the multi-tenant network, embed into the DHL operating standard, distribute across customer engagements as a DHL-branded capability inside contract-logistics service-level reporting. Locus is the canonical proof: pilot to 5,000+ LocusBots across 35+ DHL-managed sites worldwide, 500M+ picks. Stretch walked the same pattern from case-handling pilot to the May 2025 1,000-unit MOU framed explicitly as "moving beyond a traditional vendor relationship." Orange EV walked it from first-customer in October 2015 at Diageo Plainfield to ~100 NA yard trucks. The yard-execution and multi-tenant orchestration layer is the natural next entry in that same operating-standard catalog — multi-tenant from the data model up (which the 3PL operating model requires), generating exactly the operating-KPI shape the Solutions Design Americas scorecard already measures (dwell, gate-to-dock, dock contention, shipper-specific appointment arbitration), and traveling across customer engagements the same 1-to-many way Locus and Stretch did.',
      openingHook:
        'The Locus pattern, one layer over. Pilot · 35+ sites · 5,000+ bots · 500M+ picks · the canonical Solutions Design walk. The yard-execution layer is the next operating-standard entry — multi-tenant from the data model up, partnership-economics-shaped (per-site SaaS plus rebill, white-label embed in contract-logistics service-level reporting), Solutions-Design-scorecard KPIs from day one. And the joint-scoping proof site is already in motion at Diageo Plainfield.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. First, the 2025 acquisition cadence (Inmar Jan / CRYOPDP Mar / IDS May) loaded 14+ acquired yards into active SOP integration concurrently — operating standards are being rewritten across multiple sites at the same moment, the cheapest window in a decade for a new layer to enter the standard at integration speed instead of after. Second, the data-center logistics expansion (10 sites, 7M+ sq ft, announced March 2026) is a greenfield multi-tenant yard surface where Solutions-Design spec at design phase is materially cheaper than retrofit. Third, the Diageo Plainfield joint-scoping opportunity is live cross-reference — DHL operates the yard, Diageo measures the customer-experience surface, YardFlow is in conversation with both. The productization rhythm your team is already running at can absorb the next adjacency without disrupting the Locus or Stretch pipelines.',

      heroOverride: {
        headline: 'After Locus and Stretch — the yard-execution layer is the next entry in the DHL operating standard.',
        subheadline:
          'Multi-tenant from the data model up. Partnership-economics-shaped (per-site SaaS plus rebill, white-label embed in contract-logistics service-level reporting). Productization, not procurement. Distributed across customer engagements, not bought for a single site. The 2025 acquisition window, the 2026 data-center logistics greenfield, and the Diageo Plainfield joint-scoping site are open now — the Locus pattern, one layer over.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Solutions-design / engineering register. Adrian designs for a living; pitches that read like engineering memos land, hype does not. Acknowledge the existing yard-tech estate respectfully — the records-layer tools function as designed, the question is the execution and multi-tenant orchestration layer above them. Reference the swarming AMR model and the "moving beyond a traditional vendor relationship" Boston Dynamics framing — those are his own design patterns and his own words. Frameworks, costed assumptions, named comparison vendors. Multi-tenancy first; do not lead with single-site dedicated-customer pilots. Make the productization path explicit (pilot → site → operating standard → customer-base distribution), not implicit.',
      kpiLanguage: [
        'multi-tenant dock orchestration',
        'shipper-specific appointment-window arbitration',
        'instrumented yard-truck workflows',
        'productization path',
        'operating-standard embed',
        'customer-experience surface',
        'Strategy 2030 customer-win velocity',
        'per-site SaaS plus rebill',
        'multi-tenant revenue share',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite as the operating-model proof — but the DHL-specific read-across is "DHL\'s shipper customers look operationally like Primo," not "DHL itself is Primo-shaped." Productization across DHL\'s customer base is what turns one operating-model proof into a 1-to-many distribution play.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '1,000+ facilities globally; 52,000 NA associates (NA HQ Westerville OH); 2025 acquisitions added 14 returns centers (Inmar) + 1.3M sq ft of multi-customer e-commerce DC (IDS Fulfillment) + CRYOPDP specialty pharma courier network; 10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics announced March 2026',
    facilityTypes: [
      'Dedicated Customer Sites',
      'Multi-Customer DCs',
      'Returns Processing Centers (ReTurn Network — 11 multi-customer)',
      'Specialty Pharma Courier Hubs',
      'Data-Center Logistics Warehouses',
      'Innovation Centers (Westerville OH, Memphis TN, Liverpool UK)',
    ],
    geographicSpread:
      'Global; NA HQ Westerville OH; Americas Innovation Center based in Westerville. NA M&A 2025: Inmar (14 returns centers); IDS (Atlanta, Indianapolis, Salt Lake City, Plainfield IN); CRYOPDP courier network',
    dailyTrailerMoves:
      'High-volume — modeled at network level across 1,000+ global facilities; multi-tenant yards behind shared gates at IDS Fulfillment, the ReTurn Network, and the incoming data-center logistics network. Different shipper trailer fleets compete for the same docks under shipper-specific appointment-window rules',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal', 'Specialty Pharma Cold-Chain (post-CRYOPDP)', 'White-Glove Data-Center Logistics'],
    avgLoadsPerDay:
      'High-volume — 500+ customer-facing engagements per year across consumer, retail, auto-mobility, life sciences, e-commerce, technology, engineering & manufacturing, energy & chemical. Returns flow at scale post-Inmar (largest reverse-logistics network in NA)',
  },

  signals: {
    recentNews: [
      '2025 acquisition cadence: Inmar Supply Chain Solutions (Jan, 14 returns centers + ~800 associates); CRYOPDP specialty pharma courier (Mar, ~$200M); IDS Fulfillment (May, 1.3M sq ft e-commerce DC space). 14+ acquired yards in active SOP integration into the DHL operating standard.',
      'DHL ReTurn Network launched October 2025 — 11 purpose-built multi-customer returns facilities; DHL\'s first publicly named multi-tenant network product.',
      '10 new dedicated warehouse sites totaling 7M+ sq ft for hyperscale / colo data-center logistics announced March 2026 — multi-hyperscaler by design, new vertical, new yard profile.',
      'Boston Dynamics MOU (May 2025): 1,000+ additional Stretch case-handling robots for global deployment, framed as "moving beyond a traditional vendor relationship."',
      'Mark Kunar confirmed as CEO DHL Supply Chain North America (May 2026) — finance/strategy operator; Strategy 2030 target is 50% revenue growth by 2030 vs. 2023 baseline.',
      'Orange EV deployment scale: ~100 NA yard trucks (50-truck milestone Jan 2024; first deployment at Diageo Plainfield IL October 2015 — DHL was Orange EV\'s first customer).',
      'Nikola hydrogen Class 8 at Diageo Plainfield (October 2024) with on-site HYLA refueling — most decarbonized yard in NA spirits and the press anchor for DHL sustainable-logistics narrative.',
      'Locus Robotics: 500M+ picks milestone reached mid-2024; ~5,000 LocusBots across 35+ DHL-managed sites worldwide — the productization template Adrian Kumar\'s team architected.',
    ],
    urgencyDriver:
      'Three windows are open simultaneously and they are not always open. First, the 2025 acquisitions (Inmar, IDS, CRYOPDP) are in active SOP integration — operating standards are being rewritten across 14+ yards right now, which is the cheapest moment for a new layer to enter. Second, the data-center logistics expansion (10 sites, 7M+ sq ft, announced March 2026) is a greenfield multi-tenant yard surface where solutions-design spec is materially cheaper than retrofit. Third, the Diageo Plainfield site is the live cross-reference: DHL operates the yard, Diageo measures the customer-experience surface, YardFlow is in conversation with both — that is the cleanest joint-scoping opportunity in the 3PL/CPG pipeline in 2026.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Productization template', body: 'Locus · 5,000+ bots, 35+ sites · Boston Dynamics · 1,000-unit MOU · Orange EV · ~100 NA yard trucks since 2015.' },
    { mark: '2025 acquisitions', body: 'Inmar · 14 returns centers · IDS · 1.3M sq ft · CRYOPDP · 14+ yards in active SOP integration.' },
    { mark: 'ReTurn Network', body: '11 multi-customer returns facilities · launched Oct 2025 · DHL\'s first publicly named multi-tenant network product.' },
    { mark: 'Data-center logistics', body: '10 new sites · 7M+ sq ft · announced March 2026 · multi-hyperscaler by design.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Adrian Kumar. The productization pattern your Solutions Design team has run for a decade — pilot a partner technology, roll it into a customer site, embed it into the DHL operating standard, distribute across the customer base — is the pattern that put Locus into 35+ sites, Stretch into the 1,000-unit MOU, and Orange EV from first-customer in 2015 to ~100 NA yard trucks. The five minutes that follow are about the yard-execution layer fitting that same template.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#FFCC00',
  },
};
