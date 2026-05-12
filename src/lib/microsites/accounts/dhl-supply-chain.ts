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

export const dhlSupplyChain: AccountMicrositeData = {
  slug: 'dhl-supply-chain',
  accountName: 'DHL Supply Chain',
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
        { label: 'Network scale', value: '1,000+ facilities under management globally; 52,000 NA associates under CEO Mark Kunar (appointed June 2025); NA HQ Westerville OH' },
        { label: 'Customer-facing surface', value: 'Every facility is a customer-facing site by definition — yard performance is a customer-experience surface in a way it never is for a CPG end-shipper. Customers include Diageo NA (Plainfield IL), Daimler, and hundreds of Fortune-500 shippers across consumer, retail, auto-mobility, life sciences, e-commerce' },
        { label: 'Multi-tenant surface area', value: 'Multi-customer DCs (IDS Fulfillment acquisition: 1.3M sq ft across Atlanta, Indianapolis, Salt Lake City, Plainfield IN); the DHL ReTurn Network (11 multi-customer returns facilities, launched Oct 2025); 10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics (announced March 2026) — multi-shipper trailer fleets behind shared gates' },
        { label: 'Acquired networks in active SOP integration', value: 'Inmar Supply Chain Solutions (14 returns centers, ~800 associates, Jan 2025 — made DHL the largest reverse-logistics provider in NA); CRYOPDP specialty pharma courier (Mar 2025); IDS Fulfillment (May 2025). 14+ yards being re-SOP\'d into the DHL operating standard right now' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard-management deployments exist in parts of the NA network as system of record (vehicle/asset tracking, gate logs). The multi-tenant execution and orchestration layer above the records layer is unsolved — and the IDS / ReTurn / data-center logistics expansions are by-definition multi-tenant yards the legacy single-tenant tools were not designed for' },
        { label: 'Productization pattern', value: 'DHL takes third-party technology (Locus Robotics — 5,000+ bots, 500M+ picks; Boston Dynamics — 1,000-unit Stretch MOU signed May 2025; Orange EV — first customer since 2015, ~100 NA yard trucks; Nikola hydrogen Class 8 at Diageo Plainfield) into the DHL operating standard and resells it as a managed-service component to shipper customers. Solutions Design Americas is the engineering gatekeeper for what enters the standard' },
      ],
      hypothesis:
        'The interesting thing about DHL Supply Chain is that the yard problem is not internal — it is customer-facing. Every facility you operate is a customer\'s yard. Diageo measures its decarbonization story at Plainfield by what happens on the DHL-operated yard there. The Inmar returns network\'s ~14 sites are now DHL-branded customer experiences for many retail clients running reverse logistics in parallel. The IDS Fulfillment multi-customer DCs are by definition multi-shipper yards where different fleets compete for the same docks. The 10 new data-center logistics sites coming online in 2026 are multi-hyperscaler. The single-tenant yard tools that exist in the network today were specified for a different operating model — one customer per site, gate-and-locate records, dwell-and-detention reporting. They are not multi-tenant by design, and they sit at the system-of-record layer rather than the execution-and-orchestration layer. That gap matters more right now than it did three years ago for two reasons. First, the 2025 acquisitions (Inmar, IDS, CRYOPDP) loaded 14+ acquired yards into active SOP integration — operating standards are being rewritten across multiple sites simultaneously, which is the one window in a decade when a new layer can enter the standard at integration speed instead of after. Second, DHL\'s automation track record (Locus from pilot to 5,000 bots, Boston Dynamics from case-handling pilot to a 1,000-unit MOU framed explicitly as "moving beyond a traditional vendor relationship," Orange EV from first-customer-in-2015 to ~100 NA yard trucks) is now the public template for how partner technology enters the DHL operating standard. The yard-execution layer fits that template exactly: a software stack designed for multi-tenant 3PL deployment, embedded into the DHL solutions-design standard, distributed across customer engagements as a DHL-branded capability, billed through to shipper customers inside contract-logistics service-level reporting. The unit of analysis is not "does DHL Supply Chain need a YMS" — DHL has yard tech where it needs records. The unit of analysis is "is the yard-execution layer the right next addition to the DHL operating standard, and does it productize the same way Locus and Boston Dynamics did?"',
      caveat:
        'This is built from DHL Group public press releases, DHL Supply Chain announcements, the public partnership track record (Locus, Boston Dynamics, Orange EV, Nikola), the 2025 acquisition disclosures, and Adrian Kumar\'s published interviews and conference talks. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which IDS / Inmar / ReTurn sites are running multi-tenant yard contention most acutely, where the operating-standard rewrite from the 2025 acquisitions is most receptive to a new layer, and how the joint-scoping opportunity at Diageo Plainfield could be sequenced.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. They are years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The read-across for DHL Supply Chain is not direct — DHL is not a CPG end-shipper — but it is the read-across that matters at this account: many of DHL\'s most demanding shipper customers (Diageo, the consumer-vertical anchor accounts, the food-and-beverage anchor accounts) look operationally like Primo. They run multi-site networks with mature site-level yard tech already in place and they need the operating layer above it. Productizing the yard-execution layer into the DHL solutions-design standard means many DHL customer engagements gain access to that operating model as a DHL-branded capability — the same way Locus picking is now a DHL capability the customer doesn\'t source separately, the same way Stretch case-handling is becoming a DHL capability, the same way the Orange EV / Nikola decarbonized yard fleet is the DHL-branded story at Diageo Plainfield. If the operating model lands on the operationally hardest CPG freight in the country, the productization read-across to DHL\'s shipper customer base is the easier lift — and it is what turns a single end-shipper deal into a 1-to-many distribution play across DHL\'s customer network.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
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
          detail: 'Anchors the 1,000+ global facilities figure, 52,000 NA associates, Mark Kunar NA CEO appointment (June 2025), and the Strategy 2030 framing (50% revenue growth by 2030 vs. 2023 baseline).',
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
          detail: 'VP Solutions Design Americas; 50+ engineers; 500+ projects/year, ~$10B+ contract spend designed annually; Master\'s in Industrial Engineering (University of Toronto); adjunct instructor at Ohio University. Public speaking footprint: Robotics Summit & Expo, LiveWorx \'18, OPEX Exchange, ICPR25 Chicago, SupplyChainBrain bylined author. Stated swarming model for AMRs (orchestration over rigid task assignment).',
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
        'Whether the Innovation in Practice Americas format or a Westerville Innovation Center scoping session is the right entry point for a solutions-design-led conversation',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a partnership engagement, not a single-site procurement engagement. DHL Supply Chain is distinctive in this round because the question is not whether yard tech belongs in the 3PL operating model (it already does, at the system-of-record layer) but whether the yard-execution and multi-tenant orchestration layer above the records layer is the right next addition to the DHL operating standard — the same productization path Locus, Boston Dynamics, and Orange EV have already taken inside DHL. The water comparable is intentional. Primo Brands runs the operationally hardest CPG freight in the country, and many of DHL\'s most demanding shipper customers (Diageo, the consumer-vertical anchors) look operationally like Primo. Productizing the yard-execution layer into the DHL solutions-design standard means many customer engagements gain it as a DHL-branded capability rather than as a separately sourced shipper tool.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for DHL Supply Chain — particularly which acquired-network sites are most receptive right now, whether the Diageo Plainfield joint-scoping opportunity is actionable on the DHL side, or how the partnership economics would be structured for productization through Strategy 2030 — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts: a solutions-design scoping session, an Innovation in Practice Americas slot, or a Westerville Innovation Center conversation — not necessarily a vendor demo.',
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
        'Adrian, the solutions-design pattern your team has run for the last decade — identify a customer-side need, pilot a partner technology, roll it out to a customer site, productize across the customer base — is the pattern that put Locus into 35+ sites, Stretch into the 1,000-unit MOU, and Orange EV from first-customer in 2015 to ~100 NA yard trucks. The yard-execution layer fits that productization model exactly: a software stack designed for multi-tenant 3PL deployment, embedded into the DHL operating standard, distributed across customer engagements as a DHL-branded capability inside contract-logistics service-level reporting.',
      openingHook:
        'DHL operates Diageo\'s Plainfield IL campus — the most-watched yard in NA spirits and the showcase site for DHL\'s decarbonization story (~100 NA Orange EV trucks since 2015, Nikola hydrogen Class 8 since October 2024). YardFlow is in conversation with Marsha McIntosh-Hamilton at Diageo about the layer that turns the existing yard-truck fleet from passive equipment into instrumented throughput. The clean version of that conversation runs through DHL — same yard, same site, three parties scoping together.',
      stakeStatement:
        'The 14 Inmar returns centers, the 4 IDS Fulfillment multi-customer e-commerce DCs, and the 10 data-center logistics sites coming online in 2026 are all multi-tenant yards being SOP\'d into the DHL operating standard right now. The single-tenant yard tools that exist in the network today were specified for a different operating model. The window to enter the operating standard at integration speed — not after — is the next four quarters.',

      heroOverride: {
        headline: 'The yard-execution layer that fits the DHL operating standard.',
        subheadline:
          'After Locus, Boston Dynamics, and Orange EV — the multi-tenant yard-execution layer is the natural next addition to the DHL solutions-design standard. Productization, not procurement. Distributed across customer engagements, not bought for a single site. Joint scoping at Plainfield is the proof site already in motion.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
      'Mark Kunar appointed CEO DHL Supply Chain North America (June 2025) — finance/strategy operator; Strategy 2030 target is 50% revenue growth by 2030 vs. 2023 baseline.',
      'Orange EV deployment scale: ~100 NA yard trucks (50-truck milestone Jan 2024; first deployment at Diageo Plainfield IL October 2015 — DHL was Orange EV\'s first customer).',
      'Nikola hydrogen Class 8 at Diageo Plainfield (October 2024) with on-site HYLA refueling — most decarbonized yard in NA spirits and the press anchor for DHL sustainable-logistics narrative.',
      'Locus Robotics: 500M+ picks milestone reached mid-2024; ~5,000 LocusBots across 35+ DHL-managed sites worldwide — the productization template Adrian Kumar\'s team architected.',
    ],
    urgencyDriver:
      'Three windows are open simultaneously and they are not always open. First, the 2025 acquisitions (Inmar, IDS, CRYOPDP) are in active SOP integration — operating standards are being rewritten across 14+ yards right now, which is the cheapest moment for a new layer to enter. Second, the data-center logistics expansion (10 sites, 7M+ sq ft, announced March 2026) is a greenfield multi-tenant yard surface where solutions-design spec is materially cheaper than retrofit. Third, the Diageo Plainfield site is the live cross-reference: DHL operates the yard, Diageo measures the customer-experience surface, YardFlow is in conversation with both — that is the cleanest joint-scoping opportunity in the 3PL/CPG pipeline in 2026.',
  },

  theme: {
    accentColor: '#FFCC00',
  },
};
