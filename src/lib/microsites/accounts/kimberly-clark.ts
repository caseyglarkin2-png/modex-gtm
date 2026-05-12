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
 *
 * Tamera Fenske pedigree correction (validated May 2026):
 *   - 22 years at 3M, ending as SVP US & Canada Manufacturing and Supply
 *     Chain (responsibility across all business groups; preceded by plant
 *     management and global-business operations roles).
 *   - Earlier career: Marathon Ashland Petroleum, Dow Chemical.
 *   - Named CSCO at Kimberly-Clark September 19, 2022.
 *   - Owns procurement, manufacturing, logistics, transportation, safety,
 *     sustainability, and Global Nonwovens.
 *   - Sources: PRNewswire 2022-09-09; K-C investor page; Supply Chain Dive.
 *   - Replaces the (incorrect) Stanley Black & Decker pedigree carried in
 *     earlier drafts.
 *
 * Powering Care timing intel (validated May 2026):
 *   - Productivity savings: 5.9% in 2024 (record high), targeting ~5% in
 *     2025, ~6% in 2026 — the productivity number is the live KPI Fenske
 *     reports against; not a one-time program total.
 *   - International restructuring is a Suzano JV (announced June 5, 2025;
 *     closing targeted mid-2026; K-C retains 49% of a $3.4B enterprise-
 *     value entity holding the international family-care + professional
 *     business, ~$3.3B 2024 sales, ~22 international facilities, ~9,000
 *     employees). Five global brands (Scott, Kleenex, Viva, WypAll, K-C
 *     Professional) are licensed to the JV; K-C parent retains them.
 *   - Replaces the (vague) "international personal care spin-off"
 *     framing in earlier drafts.
 */

/**
 * Kimberly-Clark — ABM Microsite Data
 * Quality Tier: A+ (confirmed Kaleris customer — hunt list acct_008)
 * Pitch shape: coexistence wedge (in-yard execution + dock-orchestration
 * layer above the existing gate-and-locate system), not displacement
 * Angle: YARD MANAGEMENT (dock-door utilization, dock-cycle measurement,
 * in-yard execution, mill-to-converter dock arbitration) — NOT driver
 * experience
 * Stakeholder vocabulary: industrial-ops (Fenske's 22-year 3M pedigree,
 * ending as SVP US & Canada Manufacturing and Supply Chain) —
 * OEE-equivalent, cycle-time-per-asset, throughput-per-dock,
 * capital-avoidance-per-productivity-unit
 */

import type { AccountMicrositeData } from '../schema';

export const kimberlyClark: AccountMicrositeData = {
  slug: 'kimberly-clark',
  accountName: 'Kimberly-Clark',
  coverHeadline: 'The yard layer Powering Care needs next',
  titleEmphasis: 'Powering Care needs next',
  coverFootprint: '~15–20 NA · Suzano JV mid-2026',
  parentBrand: 'Kimberly-Clark Corporation',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 78,

  pageTitle: 'YardFlow for Kimberly-Clark - The Yard Layer Powering Care Needs Next',
  metaDescription:
    'How an in-yard execution and dock-orchestration layer lands on top of Kimberly-Clark\'s existing gate-and-locate system — converting cube-heavy trailer pressure into Powering Care productivity attribution, without capex.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Kimberly-Clark NA network',
      composition: [
        { label: 'NA manufacturing footprint', value: '~15–20 plants — Personal Care (Huggies, Pull-Ups, Depend, Kotex) + Consumer Tissue (Kleenex, Scott, Cottonelle) + K-C Professional (B2B away-from-home). The footprint Powering Care is sized against, and the surface the yard layer sits on top of' },
        { label: 'Powering Care productivity engine', value: '5.9% productivity savings in 2024 (record high) · ~5% target 2025 · ~6% expected 2026. This is the running KPI Tamera Fenske reports against, not a one-time program total' },
        { label: 'Structural yard math', value: 'Cube-out, not weight-out — a trailer of diapers cubes at ~25–30% of weight limit; tissue is volume-heavy on most lanes. K-C runs more physical trailers per ton of finished goods than any food-CPG peer at the same revenue scale' },
        { label: 'Suzano JV consolidation', value: 'International family-care + professional business contributed to a $3.4B JV with Suzano (announced June 2025, closing mid-2026); K-C retains 49% and licenses Scott / Kleenex / Viva / WypAll / K-C Professional brands. NA-retained entity becomes the published-margin surface' },
        { label: 'Inbound profile', value: 'Heavy rail-and-truck pulp and recycled-fiber inbound into integrated mills; giant paper rolls move by truck and rail from mill to converter, often inside the same operating entity' },
        { label: 'Outbound profile', value: 'Mixed retail (Walmart, Target, Costco, Sam\'s, Kroger, Amazon) + K-C Professional (B2B away-from-home) running on different cadence and trailer profiles from the same yard at most plants' },
        { label: 'Existing yard-tech layer', value: 'Gate-and-locate yard tracking is in production at NA facilities; the in-yard execution and dock-orchestration layer above it — the layer that turns trailer location into dock-cycle outcomes — is unsolved' },
        { label: 'CSCO operating posture', value: 'Tamera Fenske recruited September 2022 from 3M (22 years, ending as SVP US & Canada Manufacturing and Supply Chain). Industrial-ops vocabulary, not CPG-native. Owns procurement, manufacturing, logistics, safety, sustainability, and Global Nonwovens — sits across both Personal Care and Consumer Tissue' },
      ],
      hypothesis:
        'Powering Care is, mechanically, a productivity-savings engine. 5.9% landed in 2024; ~5% is the bar in 2025; ~6% is the expected 2026 number. That is not a one-time program total — it is the operating cadence Tamera Fenske reports against on every quarterly call, and the surface that absorbs every operating improvement that lands and every one that does not. Anything that converts directly to that running number is on her agenda. Anything that does not, is not.\n\nThe structural feature that matters for the yard is cube. K-C is cube-heavy across both halves of the network — diaper trailers cube out at ~25–30% of weight limit, tissue trailers are weight-limited only on rare lanes — which means the same dollar of finished goods moves in more physical trailers than at a comparably sized food-CPG peer. Every trailer is a gate-in event, a dock-in event, a hostler move, an exit event. Yard scale at K-C is multiplied versus peers operating at the same revenue, and yard turn-time savings therefore compound harder. The cube-out / weight-out asymmetry is a structural amplifier, not a category note.\n\nThe gate-and-locate layer you already operate gives you the system of record for where trailers are; what it does not give you is the in-yard execution and dock-orchestration logic that turns trailer location into dock-cycle outcomes the productivity number can attribute to. That gap is the unsolved seam between the existing yard system, the SAP S/4HANA backbone, and the Powering Care attribution model. The Suzano JV closing mid-2026 will move the international family-care and professional business off the parent\'s P&L; the NA-retained entity\'s yard KPIs become more visible to the published margin number after that close, not less — which is the reason this conversation has a timing driver rather than being a forever-deferred operating-cost line.',
      pullQuote: 'The cube-out / weight-out asymmetry is a structural amplifier, not a category note.',
      caveat:
        'This is built from K-C public disclosures, Powering Care earnings-call commentary, the Suzano JV announcement and SEC filing, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the gate-and-locate layer\'s data is currently surfacing into a usable dock-orchestration view at the network level, how the Suzano JV close is reshaping the NA-retained operating standards, and where the cube-heavy trailer-count math is biting hardest at the surviving plants right now.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/kimberly-clark-coverage-map.svg',
        imageAlt: 'Operating-system coverage map. Six tiles representing Kimberly-Clark operating-system domains. SAP S/4HANA, planning, procurement, manufacturing, and customer logistics are covered. The In-Yard Execution tile is unfilled, marked with a K-C blue hairline outline.',
        caption: 'Operating-system coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Powering Care + S/4HANA + Suzano-JV disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube — the inverse problem of a K-C diaper trailer, which cubes out at ~25–30% of weight limit), low-margin (so every minute of yard waste is a margin point you cannot recover with price), and shipped across multi-temp at the premium SKU layer. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level operating model on top of their existing site-level yard systems. The K-C operating profile is shape-similar — multi-site, multi-channel, 3PL-dependent, mature gate-and-locate yard tech already in place — but with cube-heavy economics that make turn-time savings compound harder than they did at Primo, not the other way around. Primo runs the operating layer Powering Care attribution is shaped to host — same coordinates, harder freight.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The strongest pilot target at K-C is the single NA plant running the worst dock-cycle variance against the cube-heavy trailer-count baseline — same dock-door count, materially more in-yard execution friction, the binding-constraint problem that yard standardization specifically addresses. The cube-heavy math means a 24-minute turn-time reduction clears more trailers per shift here than the same reduction at an equivalent food-CPG plant — and the trailers it clears land inside the Powering Care productivity number the same week they clear.',
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
          detail: 'Anchors the ~15–20 NA plant figure, the Personal Care + Consumer Tissue + K-C Professional segment structure, the dual-HQ to Irving TX relocation (2023–2024), and the Tamera Fenske role scope (manufacturing, procurement, logistics, transportation, safety, sustainability, Global Nonwovens).',
          url: 'https://www.kimberly-clark.com/en-us/company/leadership',
        },
        {
          id: 'kc-powering-care',
          source: 'Powering Care strategy disclosures and earnings-call commentary',
          confidence: 'public',
          detail: 'K-C\'s headline strategic reset, announced at 2024 Investor Day and executing as a running productivity engine. Public productivity savings: 5.9% in 2024 (record high), ~5% target 2025, ~6% expected 2026. Tamera Fenske is the operating sponsor; the productivity number is the live KPI she reports against.',
          url: 'https://www.kimberly-clark.com/en-us/powering-care',
        },
        {
          id: 'kc-suzano-jv',
          source: 'Suzano JV announcement (June 5, 2025; closing targeted mid-2026)',
          confidence: 'public',
          detail: 'K-C contributing substantially all of its International Family Care and Professional ("IFP") business to a $3.4B enterprise-value JV; K-C 49%, Suzano 51%. ~$3.3B 2024 sales, ~22 international facilities, ~9,000 employees transfer. Scott, Kleenex, Viva, WypAll, and K-C Professional brands are licensed to the JV under long-term agreement. Post-close, NA-retained entity is what Fenske operates against.',
          url: 'https://www.prnewswire.com/news-releases/kimberly-clark-announces-major-step-forward-in-its-powering-care-transformation-302474231.html',
        },
        {
          id: 'kc-fenske-tenure',
          source: 'Tamera Fenske — public tenure record',
          confidence: 'public',
          detail: '22 years at 3M, ending as SVP US & Canada Manufacturing and Supply Chain (responsibility across all business groups, preceded by plant management and global-business operations roles). Earlier career: Marathon Ashland Petroleum, Dow Chemical. Named K-C CSCO effective September 19, 2022. Industrial-ops pedigree, not CPG-native.',
          url: 'https://www.linkedin.com/in/tamera-fenske-08121a7/',
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
        'Whether the existing gate-and-locate layer\'s data is currently surfacing into a dock-orchestration view at the network level today, or only as site-by-site records the productivity engine cannot attribute to',
        'Whether SAP Yard Logistics (the S/4HANA-native yard module) is in scope for the S/4 transformation, which would change the discovery shape',
        'How the Suzano JV close in mid-2026 reshapes the NA-retained entity\'s operating standards — and whether yard standardization decisions get re-opened during that close',
        'Which NA plants are running closest to dock-cycle capacity against the cube-heavy trailer-count baseline right now',
        'How K-C Professional (B2B away-from-home) outbound interleaves with retail-channel outbound at the plants running both, and whether mixed-channel dock contention is currently visible in the yard data',
        'Whether the 3M operating-standards muscle Tamera carried into K-C has reached the yard layer yet, or whether it stopped at the planning, manufacturing, and procurement tiers',
        'Where mill-to-converter inbound (giant paper rolls moving from K-C tissue mills to K-C converter plants) is creating the worst inbound dock contention',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Kimberly-Clark is distinctive in this round because the operating-system thinking Tamera carried out of twenty-two years at 3M — uniform manufacturing and supply-chain standards across every business group and every site — is already on the floor for planning, procurement, manufacturing, and customer logistics. The yard is the one layer that has not yet caught the same operating discipline. This brief sizes that gap, not the site-level wins under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Tamera — the part most worth pushing back on is whether the operating-standards muscle you carried out of twenty-two years at 3M has reached the yard layer yet, or whether it stopped at the planning, manufacturing, and procurement tiers. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
      linkedinUrl: 'https://www.linkedin.com/in/tamera-fenske-08121a7/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',
      currentMandate:
        'Owns global supply chain at K-C since September 2022 — procurement, manufacturing, logistics, transportation, safety, sustainability, and Global Nonwovens. Recruited from 3M (22 years, ending as SVP US & Canada Manufacturing and Supply Chain across all business groups) to deliver Powering Care productivity. Industrial-ops pedigree; not a CPG-native CSCO. Sits across both Personal Care and Consumer Tissue segments.',
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
        'Tamera, the operating-standards muscle you carried out of twenty-two years at 3M — uniform manufacturing and supply-chain practice across every business group, every site, every shift — is the same muscle K-C has applied to planning, procurement, and manufacturing under Powering Care. The yard is the tile that has not been laid into that operating system yet. The gate-and-locate layer K-C already operates is the system of record for where trailers are; the in-yard execution and dock-orchestration layer above it is what Powering Care\'s productivity number now requires, and what the cube-heavy trailer-count math at K-C compounds harder than at any food-CPG peer.',
      openingHook:
        'Powering Care landed 5.9% productivity in 2024 against a running operating cadence, not a one-time program total. The yard layer K-C operates today gives you the system of record for where trailers are; what it does not give you — and what the productivity number now requires — is the in-yard execution and dock-orchestration logic that turns trailer location into dock-cycle outcomes the engine can attribute to.',
      stakeStatement:
        'Cube-heavy yards compound turn-time savings harder than tonnage-heavy yards. The same 24-minute turn-time reduction clears more trailers per shift at K-C than at an equivalent food-CPG plant. Powering Care productivity attribution to specific operating changes is the lever; the in-yard execution layer above gate-and-locate is the data that lets you attribute it. The Suzano JV close in mid-2026 makes the NA-retained entity\'s yard KPIs more visible to the published margin number, not less.',

      heroOverride: {
        headline: 'Powering Care needs the in-yard execution layer above gate-and-locate.',
        subheadline:
          'The productivity engine is running at ~6% for 2026. The cube-heavy structural math means turn-time savings compound harder at K-C than at any food-CPG peer — and the productivity number lives or dies on the in-yard execution layer the existing yard system was never built to be.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Industrial-ops vocabulary, not CPG-OTIF vocabulary. Tamera came out of twenty-two years at 3M; she reads operating math faster than category narrative. Acknowledge the existing yard layer respectfully — the original selection was correct; the operating problem has moved. Position the wedge as the layer above (in-yard execution + dock-orchestration), not as replacement of the gate-and-locate system. Number-dense, low-adjective.',
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
      '~15–20 NA manufacturing facilities (Personal Care + Consumer Tissue + K-C Professional); international family-care + professional business contributed to Suzano JV (closing mid-2026)',
    facilityTypes: ['Manufacturing Plants', 'Integrated Tissue Mills', 'Converter Plants', 'Distribution Centers'],
    geographicSpread:
      'North America (HQ: Irving, TX since 2023–2024, relocated from Neenah WI; key plants include Beech Island SC, Mobile AL, Loudon TN, New Milford CT, Owensboro KY, Maumelle AR, Paris TX, plus surviving Wisconsin operations)',
    dailyTrailerMoves:
      'High-volume — cube-heavy outbound means K-C runs more physical trailers per ton of finished goods than any food-CPG peer at the same revenue scale',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL', 'Rail (inbound pulp/recycled fiber)'],
    avgLoadsPerDay:
      'High-volume — cube-heavy outbound (diapers cube out at ~25–30% of weight limit); heavy inbound pulp and recycled-fiber rail and truck into integrated mills; mill-to-converter giant-paper-roll movements inside the operating entity',
  },

  signals: {
    recentNews: [
      'Powering Care productivity engine running at 5.9% savings in 2024 (record high), ~5% target 2025, ~6% expected 2026 — the live KPI Tamera Fenske reports against on every quarterly call.',
      'Suzano JV announced June 5, 2025 — K-C contributing International Family Care + Professional business to a $3.4B JV (49% K-C / 51% Suzano), closing targeted mid-2026; ~$3.3B 2024 sales and ~22 international facilities transfer.',
      'HQ relocated Neenah WI → Irving TX in 2023–2024 — repositioning culturally and geographically closer to CPG peers and DFW retailer HQs.',
      'Tamera Fenske recruited September 2022 from 3M (22 years, ending as SVP US & Canada Manufacturing and Supply Chain across all business groups) — industrial-ops pedigree, not CPG-native; comfortable with footprint rationalization and capital discipline.',
      'SAP S/4HANA transformation in flight as the operating-system backbone Powering Care productivity attribution is built on top of.',
    ],
    urgencyDriver:
      'Powering Care productivity is the running KPI Fenske personally owns; the in-yard execution layer above the existing gate-and-locate system is the no-capex throughput lever that converts directly to productivity attribution. Cube-heavy structural math means yard turn-time savings compound harder at K-C than at food-CPG peers at the same revenue scale. The Suzano JV close in mid-2026 moves the international family-care and professional business off the parent\'s P&L — making the NA-retained entity\'s yard KPIs more visible to the published margin number, not less.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Productivity engine', body: 'Powering Care · 5.9% savings 2024 · ~5% 2025 · ~6% 2026.' },
    { mark: 'Cube-heavy math', body: 'Diaper trailers cube out at ~25–30% of weight limit. Yard scale is multiplied.' },
    { mark: 'Suzano JV', body: '$3.4B EV · K-C 49% · closing mid-2026 · NA-retained entity becomes the margin surface.' },
    { mark: 'Fenske in her own words', body: 'Twenty-two years at 3M, end-to-end supply chain for US and Canada across every business group.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Tamera Fenske. The operating-standards muscle you carried out of twenty-two years at 3M now runs Kimberly-Clark planning, procurement, and manufacturing under Powering Care. The five minutes that follow are about the one layer it has not yet reached.',
    chapters: [
      { id: 'thesis', label: 'I. Powering Care is a running productivity engine', start: 0 },
      { id: 'cube-amplifier', label: 'II. The cube-out / weight-out amplifier', start: 65 },
      { id: 'unfilled-tile', label: 'III. The layer above gate-and-locate', start: 130 },
      { id: 'suzano-window', label: 'IV. The Suzano JV close as a timing driver', start: 195 },
      { id: 'first-pilot', label: 'V. What proof at the worst-dock-cycle plant earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#005EB8',
  },
};
