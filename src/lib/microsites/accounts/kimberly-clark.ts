/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Kimberly-Clark is a confirmed PINC/Kaleris incumbent per the hunt list
 * (acct_008). The gate-and-locate layer is in production at NA facilities;
 * the in-yard execution and dock-orchestration layer is the displacement
 * opening. Coexistence-wedge positioning: the PINC selection was correct
 * at the time; the Powering Care operating problem has moved.
 *
 * This intel powers the cold-email displacement framing (see
 * docs/research/tamera-fenske-kimberly-clark-dossier.md and the cold-email
 * kit at docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It
 * must not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section. The memo speaks
 * about "the gate-and-locate layer you already operate" without naming
 * Kaleris/PINC.
 */

/**
 * Kimberly-Clark — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — hunt list acct_008)
 * Pitch shape: coexistence wedge (in-yard execution + dock-orchestration
 * layer above the existing gate-and-locate system), not displacement
 * Angle: YARD MANAGEMENT (dock-door utilization, dock-cycle measurement,
 * in-yard execution, mill-to-converter dock arbitration) — NOT driver
 * experience
 * Stakeholder vocabulary: industrial-ops (Fenske's Stanley Black & Decker
 * pedigree) — OEE-equivalent, cycle-time-per-asset, throughput-per-dock,
 * capital-avoidance-per-productivity-unit
 */

import type { AccountMicrositeData } from '../schema';

export const kimberlyClark: AccountMicrositeData = {
  slug: 'kimberly-clark',
  accountName: 'Kimberly-Clark',
  parentBrand: 'Kimberly-Clark Corporation',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 78,

  pageTitle: 'YardFlow for Kimberly-Clark - Gate-In to Dock-In for Powering Care',
  metaDescription:
    'How an in-yard execution and dock-orchestration layer lands on top of Kimberly-Clark\'s existing gate-and-locate system — converting Marinette-consolidation trailer pressure into Powering Care productivity, without capex.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Kimberly-Clark NA network',
      composition: [
        { label: 'NA manufacturing footprint', value: '~15–20 plants post-Marinette closures — Personal Care (Huggies, Pull-Ups, Depend, Kotex) + Consumer Tissue (Kleenex, Scott, Cottonelle) + K-C Professional (B2B away-from-home)' },
        { label: 'Structural yard math', value: 'Cube-out, not weight-out — a trailer of diapers cubes at ~25–30% of weight limit. K-C runs more physical trailers per ton of finished goods than any food-CPG peer at the same revenue scale' },
        { label: 'Inbound profile', value: 'Heavy rail-and-truck pulp/recycled-fiber inbound into integrated mills; giant paper rolls move by truck and rail from mill to converter, often inside the same operating entity' },
        { label: 'Outbound profile', value: 'Mixed retail (Walmart, Target, Costco, Sam\'s, Kroger, Amazon) + K-C Professional (B2B away-from-home) running on different cadence and trailer profiles from the same yard at most plants' },
        { label: 'Existing yard-tech layer', value: 'Gate-and-locate yard tracking is in production at NA facilities; the in-yard execution and dock-orchestration layer above it is unsolved' },
        { label: 'Operating posture', value: 'Powering Care productivity program (announced 2024, executing 2024–2027) is the board-visible commitment Fenske personally owns; Marinette mill closures are consolidating volume into surviving yards right now' },
      ],
      hypothesis:
        'The interesting thing about the Kimberly-Clark yard math is the structural amplification. K-C is cube-heavy across both halves of the network — diaper trailers cube out at ~25–30% of weight limit, tissue trailers are weight-limited only on rare lanes — which means the same dollar of finished goods moves in more physical trailers than at a comparably sized food-CPG peer. Every trailer is a gate-in event, a dock-in event, a hostler move, an exit event. Yard scale at K-C is multiplied versus peers operating at the same revenue, and yard turn-time savings therefore compound harder. Two things happened in the last twenty-four months that turned this from a chronic pattern into an acute operating problem. First, Powering Care put a board-visible productivity number on the table and made it the metric Tamera Fenske is personally accountable for delivering. Second, the Marinette consolidation began re-allocating Wisconsin tissue volume into surviving facilities that have the same dock-door count they had in 2022. Same yard layout, more trailers. The gate-and-locate layer you already operate gives the system of record for where trailers are; what it does not give is the in-yard execution and dock-orchestration logic that determines whether the consolidated throughput lands inside the existing dock-cycle envelope or breaks it. That gap is the unsolved seam between the existing yard system, the SAP S/4HANA backbone, and the Powering Care productivity number. The international Personal Care spin-off through 2025–2026 makes the NA-focused entity\'s yard KPIs more visible to the parent\'s published margin number, not less — which is the reason this conversation has a timing driver rather than being a forever-deferred operating-cost line.',
      caveat:
        'This is built from K-C public disclosures, Powering Care earnings-call commentary, public reporting on Marinette closures and HQ relocation, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: which surviving facilities are absorbing the most Marinette volume in 2026, whether the gate-and-locate layer\'s data is currently surfacing into a usable dock-orchestration view at the network level, and where the cube-heavy trailer-count math is biting hardest right now.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube — the inverse problem of a K-C diaper trailer, which cubes out at ~25–30% of weight limit), low-margin (so every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level operating model on top of their existing site-level yard systems. The K-C operating profile is shape-similar — multi-site, multi-channel, 3PL-dependent, mature gate-and-locate yard tech already in place — but with cube-heavy economics that make turn-time savings compound harder than they did at Primo, not the other way around. If a network operating model can run on water — the hardest CPG freight in North America — the read-across to a cube-heavy network running on Powering Care productivity math is the easier lift.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot target at K-C is the single surviving NA plant that absorbed the most Marinette volume re-allocation — same dock-door count, materially more trailers, the binding-constraint problem that yard standardization specifically addresses. The cube-heavy math means a 24-minute turn-time reduction clears more trailers per shift here than the same reduction at an equivalent food-CPG plant.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'kc-public-network',
          source: 'Kimberly-Clark Corporation public network disclosures and corporate exec page',
          confidence: 'public',
          detail: 'Anchors the ~15–20 NA plant figure (post-Marinette), the Personal Care + Consumer Tissue + K-C Professional segment structure, and the Tamera Fenske role and pedigree (Stanley Black & Decker → K-C CSCO, September 2022).',
          url: 'https://www.kimberly-clark.com/en-us/company/leadership',
        },
        {
          id: 'kc-powering-care',
          source: 'Powering Care strategy disclosures and earnings-call commentary',
          confidence: 'public',
          detail: 'K-C\'s headline strategic reset, announced 2024 and executing through 2027. Components: network rationalization, multi-year productivity savings target, capital re-deployment into surviving facilities. Tamera Fenske is the operating sponsor.',
        },
        {
          id: 'kc-marinette',
          source: 'Public reporting on Marinette WI mill closures',
          confidence: 'public',
          detail: 'Cold Spring and Lakeview mills announced for closure under Powering Care; volume re-allocates to surviving Wisconsin operations and the Southeastern complex. Standard consolidation pattern: same demand, fewer facilities, more trailers per surviving yard.',
        },
        {
          id: 'kc-international-spin',
          source: 'International Personal Care spin-off announcement (2024, executing 2025–2026)',
          confidence: 'public',
          detail: 'K-C separating its international personal care business into a standalone publicly traded company. Parent retains NA Personal Care, Consumer Tissue, and K-C Professional — which means NA yard KPIs become more visible to the parent\'s published margin number post-spin, not less.',
        },
        {
          id: 'cube-heavy-math',
          source: 'Industry freight-density data on diaper, tissue, and personal-care outbound',
          confidence: 'public',
          detail: 'Diaper trailers cube out at ~25–30% of weight limit; tissue is volume-heavy similarly across most lanes. This is a structural feature of the category, not a K-C-specific number, but it amplifies yard math at K-C versus food-CPG peers at the same revenue scale.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most multi-site CPG networks operate under, not K-C specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Which surviving NA plants are absorbing the most Marinette volume re-allocation in 2026 — and which are running closest to dock-cycle capacity',
        'How K-C Professional (B2B away-from-home) outbound interleaves with retail-channel outbound at the plants running both, and whether mixed-channel dock contention is currently visible in the yard data',
        'Whether the existing gate-and-locate layer\'s data is surfacing into a dock-orchestration view at the network level today, or only as site-by-site records',
        'Whether SAP Yard Logistics (the S/4HANA-native yard module) is in scope for the S/4 transformation, which would change the discovery shape',
        'How carrier-experience metrics map into the cube-heavy lane economics — carriers running K-C lanes earn less per cube-mile than carriers running denser freight, which makes yard friction disproportionately expensive in tight-capacity markets',
        'Where mill-to-converter inbound (giant paper rolls moving from K-C tissue mills to K-C converter plants) is creating the worst inbound dock contention',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. The K-C-specific angle is the cube-heavy structural math: yard turn-time savings compound harder at a network that moves more physical trailers per ton of finished goods than at one that moves fewer. The water comparable is intentional. Primo Brands runs the operationally hardest freight in the country (heavy, low-margin, multi-temp at the premium SKU layer, refill returns); the K-C network is the inverse problem (cube-out, not weight-out) with the same network shape, which means the operating model reads across with the easier-lift direction running toward K-C, not away from it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Kimberly-Clark — particularly the Marinette-consolidation pressure on specific surviving plants, the mill-to-converter inbound dock-contention pattern, or whether the gate-and-locate layer\'s data is already surfacing into a usable dock-orchestration view at the network level — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'kimberly-clark-001',
      name: 'Tamera Fenske',
      firstName: 'Tamera',
      lastName: 'Fenske',
      title: 'Chief Supply Chain Officer',
      company: 'Kimberly-Clark',
      email: 'tamera.fenske@kcc.com',
      linkedinUrl: 'https://www.linkedin.com/in/tamera-fenske/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',
      currentMandate:
        'Owns global supply chain at K-C since September 2022 — manufacturing, planning, procurement, logistics, customer logistics, quality, safety, sustainability. Recruited from Stanley Black & Decker (President of Global Operations) to deliver Powering Care productivity. Industrial-ops pedigree; not a CPG-native CSCO. Sits across both Personal Care and Consumer Tissue segments.',
      bestIntroPath:
        'Direct outreach to CSCO office. If delegated, target VP Logistics & Customer Logistics or VP Manufacturing & Engineering as alternates; reach via mutual connection preferred over cold inbound.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kimberly-clark-001',
        name: 'Tamera Fenske',
        firstName: 'Tamera',
        lastName: 'Fenske',
        title: 'Chief Supply Chain Officer',
        company: 'Kimberly-Clark',
        email: 'tamera.fenske@kcc.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Tamera Fenske - Chief Supply Chain Officer',
      variantSlug: 'tamera-fenske',

      framingNarrative:
        'Tamera, the industrial-ops thinking you carried from Stanley Black & Decker into K-C — cycle-time-per-asset, throughput-per-dock-door, capital-avoidance-per-productivity-unit — is the thinking that turns the gate-and-locate layer K-C already operates into an in-yard execution and dock-orchestration layer above it. Powering Care needs facility-granular dock-cycle measurement, not gate-and-locate records. The Marinette consolidation already changed the operating problem.',
      openingHook:
        'The yard layer K-C operates today gives you the system of record for where trailers are. What it does not give you — and what Powering Care\'s productivity number now requires — is the in-yard execution and dock-orchestration logic that determines whether the consolidated Marinette volume lands inside the dock-cycle envelope at surviving plants, or breaks it.',
      stakeStatement:
        'Cube-heavy yards compound turn-time savings harder than tonnage-heavy yards. The same 24-minute turn-time reduction clears more trailers per shift at K-C than at an equivalent food-CPG plant. Powering Care productivity attribution to specific operating changes is the lever; the dock-cycle measurement layer is the data that lets you attribute it.',

      heroOverride: {
        headline: 'Powering Care needs the dock-cycle measurement layer above gate-and-locate.',
        subheadline:
          'Marinette consolidation is loading more trailers through surviving K-C yards right now. The cube-heavy structural math means turn-time savings compound harder here than at food-CPG peers — and the productivity number lives or dies on the in-yard execution layer the existing yard system was never built to be.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Industrial-ops vocabulary, not CPG-OTIF vocabulary. Tamera came from Stanley Black & Decker; she reads operating math faster than category narrative. Acknowledge the existing yard layer respectfully — the original selection was correct; the operating problem has moved. Position the wedge as the layer above (in-yard execution + dock-orchestration), not as replacement of the gate-and-locate system. Number-dense, low-adjective.',
      kpiLanguage: [
        'cycle-time-per-yard-asset',
        'throughput-per-dock-door',
        'dock-cycle envelope',
        'capital-avoidance-per-productivity-unit',
        'gate-in to dock-in measurement',
        'in-yard execution',
        'cube-heavy yard math',
        'Powering Care productivity attribution',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same network shape, harder freight (water), already running the network-level layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '~15–20 NA manufacturing facilities post-Marinette closures (Personal Care + Consumer Tissue + K-C Professional); ~50 globally',
    facilityTypes: ['Manufacturing Plants', 'Integrated Tissue Mills', 'Converter Plants', 'Distribution Centers'],
    geographicSpread:
      'North America (HQ: Irving, TX since 2023–2024; key plants include Beech Island SC, Mobile AL, Loudon TN, New Milford CT, Owensboro KY, Maumelle AR, Paris TX, plus surviving Wisconsin operations post-Marinette)',
    dailyTrailerMoves:
      'High-volume — cube-heavy outbound means K-C runs more physical trailers per ton of finished goods than any food-CPG peer at the same revenue scale; trailer count rising at surviving facilities as Marinette volume re-allocates',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL', 'Rail (inbound pulp/recycled fiber)'],
    avgLoadsPerDay:
      'High-volume — cube-heavy outbound (diapers cube out at ~25–30% of weight limit); heavy inbound pulp and recycled-fiber rail and truck into integrated mills; mill-to-converter giant-paper-roll movements inside the operating entity',
  },

  signals: {
    recentNews: [
      'Powering Care strategy (announced 2024) — "most fundamental restructuring of the company in decades"; multi-year productivity target executing 2024–2027 with Tamera Fenske as operating sponsor.',
      'Marinette WI mill closures (Cold Spring and Lakeview) under Powering Care — volume re-allocating to surviving Wisconsin operations and the Southeastern complex right now.',
      'International Personal Care spin-off announced 2024, executing 2025–2026 — NA-focused entity will have more visible yard KPIs in the parent\'s published margin number, not fewer.',
      'HQ relocated Neenah WI → Irving TX in 2023–2024 — repositioning culturally and geographically closer to CPG peers and DFW retailer HQs.',
      'Tamera Fenske recruited September 2022 from Stanley Black & Decker (President of Global Operations) — industrial-ops pedigree, not CPG-native; comfortable with footprint rationalization and capital discipline.',
    ],
    urgencyDriver:
      'Powering Care productivity is the board-visible commitment Fenske personally owns; the Marinette consolidation is loading more trailers through surviving K-C yards in 2026 against the same dock-door count those yards had in 2022. Cube-heavy structural math means yard turn-time savings compound harder at K-C than at food-CPG peers at the same revenue scale — the in-yard execution layer above the existing gate-and-locate system is the no-capex throughput lever that converts directly to Powering Care productivity attribution.',
  },

  theme: {
    accentColor: '#005EB8',
  },
};
