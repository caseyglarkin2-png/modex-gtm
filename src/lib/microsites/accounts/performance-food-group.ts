/**
 * Performance Food Group — ABM Microsite Data
 * Quality Tier: Tier 2 Band B (foodservice distribution; ~$60B revenue scale)
 * Pitch shape: network-level yard operating model laddering across PFG's
 * three-segment distribution network. Foodservice broadline DCs run the
 * most operationally complex multi-temp dock arbitration in CPG-adjacent
 * distribution — refrigerated + frozen + ambient inbound from hundreds of
 * CPG suppliers, then DSD route-truck loading for AM delivery to ~300,000
 * customer stops daily. Cheney Brothers (closed Oct 8, 2024 for $2.1B,
 * five DCs in FL+NC, ~$3.2B revenue) added regional foodservice DCs with
 * pre-acquisition yard operating habits. The seam is where two different
 * DC operating philosophies converge at the dock layer.
 * Angle: YARD MANAGEMENT — multi-temp dock arbitration at broadline
 * foodservice DCs, DSD route-load sequencing, and the Cheney-integration
 * yard handoff between legacy PFG and Cheney-network operating norms.
 */

import type { AccountMicrositeData } from '../schema';

export const performanceFoodGroup: AccountMicrositeData = {
  slug: 'performance-food-group',
  accountName: 'Performance Food Group',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Performance Food Group · Broadline foodservice DCs and the multi-temp dock at the gate',
  metaDescription:
    "PFG runs ~155 distribution centers across Foodservice, Specialty, and Convenience (Core-Mark), feeding ~300,000 customer stops daily on DSD route trucks. The Cheney Brothers acquisition added five Southeast foodservice DCs with their own operating practice. The yard layer above the network is where two DC operating philosophies converge at the dock.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the PFG US distribution network',
      composition: [
        {
          label: 'US distribution footprint',
          value: '~155 distribution centers across the United States and Canada, organized into three reportable segments — Foodservice, Specialty (formerly Vistar), and Convenience (Core-Mark)',
        },
        {
          label: 'Segment mix at the dock',
          value: 'Foodservice ~53% of FY25 revenue (broadline distribution to restaurants, schools, healthcare, hospitality) · Convenience ~39% (Core-Mark to c-stores) · Specialty ~8% (vending, theater, hospitality, travel concessions)',
        },
        {
          label: 'Cheney Brothers integration',
          value: 'Acquisition closed October 8, 2024 for $2.1B — five broadline foodservice DCs in Florida and North Carolina, ~$3.2B annual revenue, ~3,600 employees. $50M of run-rate cost synergies targeted across procurement, operations, and logistics over the first three full fiscal years; $42.5M South Carolina DC expansion announced post-close',
        },
        {
          label: 'Multi-temp DC reality',
          value: 'A broadline foodservice DC handles refrigerated, frozen, and ambient inbound from hundreds of CPG suppliers, then loads DSD route trucks across the same three temperature zones for overnight delivery. Multi-temp dock arbitration is the daily reality at every broadline site, not the exception',
        },
        {
          label: 'Customer-delivery cadence',
          value: 'PFG DSD route trucks deliver to ~300,000+ customer stop locations across the network on a near-daily cadence — restaurants, hotels, schools, healthcare facilities, c-stores. Every restaurant opening Tuesday morning depends on Monday night\'s route-load completing on the planned dock window',
        },
        {
          label: 'Capacity build-out posture',
          value: 'Hanover County VA regional sales-and-distribution center under construction ($80.2M, 325,000 sq ft, 125 new jobs); Miami Empire DC 66,000 sq ft expansion completed; St. Louis Ferguson/Berkeley relocation completed March 2025; Cheney SC DC $42.5M expansion in progress. Capacity additions concentrated in the Southeast post-Cheney',
        },
      ],
      hypothesis:
        "The interesting thing about the PFG yard math is what happens at a broadline foodservice DC every single morning. The site is arbitrating refrigerated, frozen, and ambient inbound from hundreds of CPG suppliers — Tyson reefers, Conagra ambient pallets, frozen-protein inbound from a co-packer, produce from a regional grower — against the outbound DSD route loading that has to be on the truck by 8 PM so the driver can hit forty-plus restaurant stops between 4 AM and noon the next day. Three different temperature zones competing for dock priority at the same gate, with the inbound side coming from a long-tail of carriers PFG does not control and the outbound side gated on a fixed route schedule the customer side depends on. Site-level operating discipline at a foodservice DC is mature in the sense that the people inside the building have done this for decades; what is less mature, across a 155-DC network, is a unified standard for how that arbitration is decided. Each DC runs against its own dock-policy reflex, its own appointment-versus-walk-in mix, its own DSD route-load sequencing logic, its own carrier-detention practice. That gap got more expensive in the last eighteen months for three reasons. First, Cheney Brothers closed in October 2024 and added five broadline DCs in Florida and the Carolinas with their own pre-acquisition operating practice — Cheney was the largest independent foodservice distributor in the Southeast for a reason, and integration friction shows up at the dock layer before it shows up at the procurement layer, because procurement integrates on a system and operations integrates on a habit. The $50M of run-rate synergies the deal underwrote sits in procurement, operations, and logistics; the operations and logistics share of that number is the share that depends on the yard layer above the sites agreeing with itself across legacy PFG DCs and Cheney DCs. Second, the capacity build-out is concentrated in the Southeast — the Cheney SC DC $42.5M expansion, the Hanover County VA $80.2M regional DC, the Miami Empire expansion — which is the same geography where the integration seam is most operationally exposed. New DCs going into a network whose operating standard is not yet unified bake the legacy variance into the next decade. Third, the segment mix is structurally unforgiving. Foodservice is 53% of revenue but it is the segment with the highest dock-arbitration complexity per site; Convenience (Core-Mark) is 39% but runs against a different customer cadence (c-store deliveries on weekly/twice-weekly rather than daily) and different freight profile; Specialty is 8% but pulls into a vending/theater/concession channel mix with its own pickup windows. The three segments run against different operating-day shapes at the same parent company, and the yard layer is the surface where those shapes either coordinate or quietly cost. The forward-looking piece is straightforward: as the Cheney integration moves through its three-year synergy window and as the Southeast capacity adds come online, trailer-into-the-yard pressure rises at exactly the DCs where the legacy-versus-Cheney handoff is happening. That is the seam.",
      caveat:
        "This is built from PFG’s public segment disclosures, the Cheney Brothers acquisition record, public facility-expansion press, and reasonable network inference on the broadline foodservice operating model. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether multi-temp dock arbitration at the broadline DCs is decided by site policy, system logic, or operator judgment today; whether the legacy PFG yard SOPs have already been propagated to the Cheney-acquired DCs or whether each Cheney site still runs against pre-acquisition habits; how DSD route-truck loading interacts with inbound dock priority at the same gate during the 4 PM–8 PM peak load window; and where the Southeast capacity build-out has already put visible pressure on the dock layer at the integrating sites.",
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point that can't be recovered with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, with a network-level yard operating model layered on top of their existing site-level systems. The shape similarities to PFG are direct: multi-site network operating across multiple temperature zones, drop-trailer dock arbitration, and a customer-delivery cadence that gates everything downstream. The shape differences are where the framing earns its keep. Primo runs hard freight against three or four product profiles at a bottling-and-distribution plant; a PFG broadline foodservice DC runs against ten thousand-plus SKUs at three temperature regimes from hundreds of inbound suppliers, then loads route trucks across the same temperature spread for daily DSD delivery to thousands of restaurants. The multi-temp dimension that is the premium-SKU edge case at Primo is the operating baseline at every PFG broadline site. The customer count Primo coordinates against — regional DCs and retailers — is dwarfed by the ~300,000 stop locations PFG delivers to daily. The framing line: if a network operating model lands on water — the hardest CPG freight in the country — the read-across to foodservice broadline isn't easier because the freight is gentler, it's easier because the operating-model surface area is the same shape, just with more SKUs, more channels, and more temperature zones to arbitrate. Same shape, different freight, more of it.",
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at PFG are different in kind: (1) a flagship legacy Performance Foodservice broadline DC — the cleanest test of whether a unified yard operating model can land on a site where the in-building operating discipline is already mature and the dock-arbitration problem is the most concentrated; (2) a Cheney-acquired DC inside the three-year synergy window — the cleanest test of whether the operating standard can ride on top of a recently-integrated site where the pre-acquisition yard habits are still the dominant reflex. We would expect the network to make sense of itself within two to four quarters of the pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'pfg-10k',
          source: 'Performance Food Group public segment disclosures and 10-K reporting',
          confidence: 'public',
          detail: 'Anchors the ~155 DC network figure, the three-segment structure (Foodservice ~53%, Convenience/Core-Mark ~39%, Specialty/formerly Vistar ~8% of FY25 revenue), and the broadline foodservice operating model.',
          url: 'https://www.pfgc.com/',
        },
        {
          id: 'pfg-cheney',
          source: 'Cheney Brothers acquisition disclosures (announced Aug 2024, closed Oct 8, 2024)',
          confidence: 'public',
          detail: 'Acquisition closed October 8, 2024 for $2.1B in cash at 9.9x Adjusted EBITDA including $50M run-rate synergies. Cheney brought ~$3.2B annual revenue, ~3,600 employees, and five broadline foodservice DCs in Florida and North Carolina. Synergies targeted in procurement, operations, and logistics over the first three full fiscal years post-close.',
          url: 'https://investors.pfgc.com/press-releases/press-release-details/2024/Performance-Food-Group-Company-Completes-the-Acquisition-of-Cheney-Bros-Inc/default.aspx',
        },
        {
          id: 'pfg-capacity',
          source: 'PFG facility-expansion press (FY25–FY26)',
          confidence: 'public',
          detail: 'Hanover County VA regional sales-and-distribution center ($80.2M, 325,000 sq ft, 125 new jobs); Miami Empire DC 66,000 sq ft expansion; St. Louis Ferguson/Berkeley relocation completed March 2025; Cheney South Carolina DC $42.5M expansion in progress. Capacity adds biased toward the Southeast where the Cheney integration is most operationally exposed.',
        },
        {
          id: 'pfg-leadership',
          source: 'PFG leadership succession disclosures (announced 2025, effective Jan 1, 2026)',
          confidence: 'public',
          detail: 'Scott McPherson became CEO January 1, 2026; George Holm transitioned to Executive Chair and continues to work with McPherson on M&A activities, customer relationships, and strategic direction. Leadership transition timed against the Cheney synergy window and the Southeast capacity build-out.',
          url: 'https://investors.pfgc.com/press-releases/press-release-details/2025/Performance-Food-Group-Company-Announces-Leadership-Succession/default.aspx',
        },
        {
          id: 'foodservice-industry',
          source: 'Foodservice distribution industry trade reporting',
          confidence: 'public',
          detail: 'FoodService Director, Modern Distribution Management, and FreightWaves coverage of broadline foodservice distribution, DSD route-load economics, and the failed PFG–US Foods merger discussions in early 2024. Describes the operating environment most multi-DC broadline foodservice distributors run against, not PFG specifically.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site distribution networks operate under, not PFG specifically.',
        },
        {
          id: 'primo-operating-data',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether multi-temp dock-door arbitration at the broadline foodservice DCs is decided by site policy, system logic, or operator judgment today — and whether the answer differs between legacy PFG DCs and Cheney-acquired DCs',
        'Whether the Cheney Brothers DC yards have been migrated onto Performance Foodservice operating SOPs since the October 2024 close, or whether each Cheney site still runs against pre-acquisition habits at the gate',
        'How DSD route-truck loading sequencing interacts with inbound dock priority at the same gate during the 4 PM–8 PM peak load window — and where that arbitration sits today on a system-versus-operator-judgment spectrum',
        'How the operations and logistics share of the $50M Cheney synergy number is being broken out across procurement contribution versus dock-execution contribution — and whether yard-induced cost leakage is inside that number or sitting outside it',
        'Where the Southeast capacity build-out (Cheney SC expansion, Hanover County VA, Miami Empire) has already produced visible trailer congestion at the gatehouse at the DCs absorbing the integration freight',
        'How the operating-day shapes of the three segments (broadline Foodservice, Core-Mark Convenience, Specialty) interact at any shared facilities or shared carrier pools — and whether the yard layer treats them as one network or three',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. PFG is distinctive in this round because the broadline foodservice DC is, by most operating measures, one of the most complex distribution sites in the country — multi-temp inbound from hundreds of CPG suppliers, DSD route-load outbound to thousands of restaurants every night, and ten thousand-plus SKUs moving through the same gate. Layer the Cheney Brothers integration on top of that operating reality and the network-coordination problem expands at exactly the moment a new CEO is taking the seat and the Southeast capacity build-out is concentrating new throughput at the integration seam. The Primo comparable is the public network we cite — same shape of operating-model problem, harder freight per trailer, fewer SKUs and channels to coordinate across.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "If parts of this read wrong against what you see internally for PFG — particularly whether the Cheney integration has reached the dock layer at every acquired site, how multi-temp dock arbitration is actually decided at a broadline DC during the peak load window, or where the Southeast capacity build-out has already put pressure on the yard first — that's the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'performance-food-group-001',
      name: 'Dylan Greenbaum',
      firstName: 'Dylan',
      lastName: 'Greenbaum',
      title: 'Director, Logistics',
      company: 'Performance Food Group',
      email: 'dylan.greenbaum@pfgc.com',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Operations',
      currentMandate: 'Director-level logistics seat at a foodservice distributor where supply chain is the product. Sits close enough to the network operating layer to see dock-arbitration variance across DCs but far enough above the dock to see the cross-network pattern.',
      bestIntroPath: 'Direct outreach to logistics office',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'performance-food-group-001',
        name: 'Dylan Greenbaum',
        firstName: 'Dylan',
        lastName: 'Greenbaum',
        title: 'Director, Logistics',
        company: 'Performance Food Group',
        email: 'dylan.greenbaum@pfgc.com',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Dylan Greenbaum - Director, Logistics',
      variantSlug: 'dylan-greenbaum',

      framingNarrative:
        "Dylan, the broadline foodservice DC is one of the most operationally complex distribution sites in CPG-adjacent distribution — multi-temp inbound from hundreds of CPG suppliers, DSD route-load outbound to thousands of restaurants overnight, and the Cheney integration adding five Southeast DCs with their own pre-acquisition operating practice. The piece this analysis pokes at is the layer above the sites: how a 155-DC network agrees with itself on multi-temp dock arbitration, DSD route-load sequencing, and the legacy-PFG-versus-Cheney handoff at the gate — and whether the $50M synergy number underwrites a dock-execution layer or quietly depends on one.",
      openingHook:
        "Cheney closed in October 2024 with $50M of run-rate synergies in procurement, operations, and logistics. Procurement integrates on a system; operations and logistics integrate on a habit at the dock. The yard layer above the network is where the operations-and-logistics share of that number either compounds or leaks.",
      stakeStatement:
        "A broadline DC arbitrating reefer, frozen, and ambient inbound against DSD route-load outbound at the same gate during the 4 PM–8 PM peak doesn't have an operating-standard layer above it across 155 sites yet. Every minute of arbitration variance at a Cheney-acquired DC is a minute the synergy number has to make up somewhere else.",

      heroOverride: {
        headline: 'The broadline foodservice DC is one of the most complex distribution sites in CPG. The yard layer above 155 of them is not yet a unified network.',
        subheadline:
          "Multi-temp inbound from hundreds of suppliers. DSD route-load outbound to ~300,000 stops daily. Five Cheney DCs integrating in the Southeast. The dock layer is where two operating philosophies converge — and where the synergy number either compounds or quietly leaks.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. Dylan sits at the seam between network-level logistics planning and DC-level dock execution — he sees the variance pattern across sites in a way DC managers don't. Lead with the multi-temp dock-arbitration and Cheney-integration framing rather than headline metrics; the metrics are the supporting evidence, not the wedge.",
      kpiLanguage: [
        'multi-temp dock arbitration',
        'DSD route-load sequencing',
        'gate-to-dock cycle time',
        'reefer dwell during peak load window',
        'integration-yard SOP alignment',
        'carrier scorecard at the network level',
        'dock-execution variance by site',
        'synergy capture at the operations-and-logistics layer',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — same operating-model shape (multi-site, multi-temp, drop-trailer, customer-delivery-cadence gated), harder freight per trailer, fewer SKUs and channels to coordinate. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at food & beverage facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'Primo Brands operates more than 200 contracted facilities on the same production-and-distribution model. YardFlow cut their gate-to-dock time from 48 to 24 minutes.',
        role: 'Operations Director',
        company: 'National Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '~155 distribution centers across the US and Canada',
    facilityTypes: ['Broadline Foodservice DCs', 'Convenience DCs (Core-Mark)', 'Specialty DCs (vending/theater/concession)'],
    geographicSpread:
      'North America (HQ: Goochland/Richmond VA; nationwide network across Foodservice, Specialty/formerly Vistar, and Convenience/Core-Mark segments; concentrated Southeast post-Cheney with DCs in FL, NC, SC, VA; capacity build-out at Hanover County VA, Miami Empire, Ferguson/Berkeley MO, and the Cheney SC expansion)',
    dailyTrailerMoves: 'High-volume — multi-thousand daily moves across the broadline foodservice network alone',
    fleet: 'Large private DSD fleet plus contract carriers; daily route deliveries to ~300,000+ customer stop locations',
  },

  freight: {
    primaryModes: ['Truckload', 'DSD Route', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — multi-temp inbound from hundreds of CPG suppliers; outbound DSD route trucks loading nightly across refrigerated, frozen, and ambient zones for AM restaurant delivery',
  },

  signals: {
    eventAttendance: 'Past attendee list',
    recentNews: [
      'Cheney Brothers acquisition closed October 8, 2024 for $2.1B — five broadline foodservice DCs in FL and NC, ~$3.2B annual revenue, ~3,600 employees, $50M run-rate synergies targeted across procurement, operations, and logistics.',
      'Cheney South Carolina DC $42.5M expansion announced post-close — capacity adds biased toward the Southeast where the integration is most operationally exposed.',
      'Hanover County VA regional sales-and-distribution center under construction ($80.2M, 325,000 sq ft, 125 new jobs).',
      'Miami Empire DC 66,000 sq ft expansion completed; St. Louis Ferguson/Berkeley relocation completed March 2025.',
      'Scott McPherson became CEO January 1, 2026; George Holm transitioned to Executive Chair and continues to lead on M&A, customer relationships, and strategic direction.',
      'Vistar segment renamed Specialty in fiscal 2025 reporting; FY25 segment mix — Foodservice ~53%, Convenience (Core-Mark) ~39%, Specialty ~8% of revenue.',
    ],
    supplyChainInitiatives: [
      'Cheney Brothers integration — three-year synergy window across procurement, operations, and logistics.',
      'Southeast capacity build-out concentrated at the integration seam (Cheney SC, Hanover County VA, Miami Empire).',
      'Three-segment operating-model coordination across Foodservice, Specialty, and Convenience.',
    ],
    urgencyDriver:
      "Cheney Brothers integration is inside its three-year synergy window; the Southeast capacity build-out is concentrating new throughput at exactly the DCs where the integration seam is most operationally exposed; and the operations-and-logistics share of the $50M synergy number depends on a yard layer above the sites that does not yet have a unified standard across legacy PFG DCs and Cheney-acquired DCs.",
  },

  theme: {
    accentColor: '#2563EB',
    backgroundVariant: 'dark',
  },
};
