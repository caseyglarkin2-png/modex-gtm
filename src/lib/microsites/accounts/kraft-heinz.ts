/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Kraft Heinz is a confirmed PINC/Kaleris incumbent per the Kaleris–Kraft Heinz
 * Case Study (PDF, Jan 2025; kaleris.com/wp-content/uploads/2025/01/Kaleris-KraftHeinz-Case-Study.pdf)
 * and the Kaleris YMS Archives page. Specifics:
 *   - PINC relationship dates to 2006 at the Stockton, CA 24/7 mixing center (~20-year incumbent)
 *   - Rollout to 12 additional distribution facilities across six campus locations (2007–2009)
 *   - Cited wins: 50% reduction in truck and driver resources at pilot site; elimination of
 *     manual yard checks and overflow lots; reduction in demurrage and detention charges
 *   - Five man-hours per day of manual yard checks eliminated at the Stockton pilot site
 *
 * This intel powers the "displacement" cold-email framing (see
 * docs/research/flavio-torres-kraft-heinz-dossier.md and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section. The memo speaks
 * about "your existing site-level yard automation" without naming Kaleris.
 */

/**
 * Kraft Heinz — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — case study PDF)
 * Pitch shape: coexistence wedge (network-level operating layer *above*
 * site-level YMS), not displacement
 * Angle: YARD MANAGEMENT (dock-door utilization, trailer dwell,
 * dock-to-stock flow, network OEE) — NOT driver experience
 */

import type { AccountMicrositeData } from '../schema';

export const kraftHeinz: AccountMicrositeData = {
  slug: 'kraft-heinz',
  accountName: 'Kraft Heinz',
  coverHeadline: 'The yard layer above Lighthouse',
  titleEmphasis: 'above Lighthouse',
  coverFootprint: '~30 US plants · DeKalb 2027',
  parentBrand: 'The Kraft Heinz Company',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 89,

  pageTitle: 'YardFlow for Kraft Heinz - Network-Level Yard Operating Model',
  metaDescription:
    'How a network-level yard operating model lands on top of site-level yard automation across Kraft Heinz\'s 30 U.S. plants — closing the unfilled Lighthouse tile and protecting the $3B modernization investment.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Kraft Heinz U.S. network',
      composition: [
        { label: 'U.S. manufacturing footprint', value: '~30 U.S. plants across ambient / refrigerated / frozen, ~70 globally — the operating-system surface Agile@Scale and Lighthouse already touch, and the yard layer above the sites does not' },
        { label: 'Greenfield deployment site', value: 'DeKalb IL automated DC — $400M, 775,000 sq ft, opens 2027; >60% of foodservice volume + ~30% of all dry goods' },
        { label: 'Active modernization', value: '$3B U.S. plant investment announced May 2025 — throughput-out-the-door capacity climbing across ~30 sites' },
        { label: 'Existing yard-tech layer', value: 'Legacy site-level yard automation from a 2007–2009 rollout; current production status across the surviving sites is mixed. The network-level operating layer above the sites is unsolved either way' },
        { label: 'Yard archetype mix', value: '~37% no-gate sites · ~56% guarded with gate+GS (some campus, some scale) · ~63% rural with connectivity exposure · majority three-shift cadence (27-site internal survey)' },
        { label: 'Lighthouse coverage seam', value: 'Microsoft-built control tower; reported impact ~12% production-efficiency gain, ~$30M sales-side, "reactive to proactive" framing. Whether site-level yard feeds ladder into Lighthouse at the network layer is the unanswered question' },
        { label: 'Forecast adoption', value: '48.2% autonomous forecast adoption · 10.4% weekly accuracy lift at SKU-location-customer (Agile@Scale). The plan has gotten sharper; the yard has not' },
        { label: 'Working-capital posture', value: 'Agile@Scale program cut inventory ~20% — leaner inventory makes dock-execution variance a working-capital problem, not just an operations one' },
      ],
      hypothesis:
        'Site-level yard automation has already paid back at Kraft Heinz — twice over, twenty years running. Manual yard checks went away. Demurrage came down. Overflow lots disappeared. The case is closed at the site. What it has not become, after a dozen sites and six campuses, is a network operating model. Each site optimizes its own gate, its own dock priority, its own multi-temp arbitration. The network doesn\'t agree with itself on what good looks like — and that is the part Lighthouse cannot fix from above and Agile@Scale cannot fix from the plan.\n\nThat gap got more expensive in the last three years for two reasons. First, Agile@Scale cut inventory roughly 20%. A 90-minute trailer delay that used to land inside safety stock now lands on the shelf. Second, the $3B U.S. modernization will lift throughput at the plant; throughput-out-the-door becomes trailer-into-the-yard, and modernizing the building without modernizing the yard layer above the sites creates a known flow-control wall at the gatehouse.\n\nThe third thing is the pilot question itself. DeKalb opens in 2027 as the highest-throughput node in the portfolio — the marquee deployment. That makes it the scale-up target once the operating model is proven, not the proving ground. The first pilot lands at one of the smaller no-gate, urban-connectivity sites where the carrier yard is simplest to instrument, the displacement risk is lowest, and the operating model can be proven without putting the marquee deployment at risk. The proof at the simple site is what earns the right to operate the layer above DeKalb in 2027 and the $3B-modernized plants in the second wave.',
      pullQuote: 'The network doesn\'t agree with itself on what good looks like.',
      caveat:
        'This is built from public Kraft Heinz disclosures, the public yard-automation case record, Lighthouse press materials, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether site-level yard data actually ladders into Lighthouse in a way you can act on, whether the DeKalb yard-ops design has been spec\'d yet, and how the $3B plant investment is changing trailer arrival patterns at the sites where capex landed first.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/kraft-heinz-lighthouse-tile.svg',
        imageAlt: 'Operating-tower coverage map. Six tiles representing Kraft Heinz control-tower domains. Planning, Forecast, Demand, Inventory, and OTIF are covered. The Yard Network Ops tile is unfilled, marked with a Kraft Heinz red hairline outline.',
        caption: 'Operating-tower coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Lighthouse + Agile@Scale + OMP/o9 disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), and shipped across multi-temp (premium SKUs sit alongside ambient). Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Kraft Heinz operating profile is similar in shape — multi-site, multi-temp, 3PL-dependent, mature site-level yard automation already in place — but with significantly more forgiving freight economics per trailer. Primo runs the operating layer Lighthouse is shaped to host — same coordinates, harder freight.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The sites where this lands first are not the marquee nodes — they are the smaller no-gate, no-YMS, urban-connectivity facilities where the carrier yard is simplest to instrument, the displacement risk is lowest, and the operating model can be proven before it has to scale. DeKalb 2027 is where the proven model expands into the highest-throughput node in the U.S. portfolio; the $3B-modernized plants are the second wave once the network operating layer has its first 60-day proof. We would expect the network to make sense of itself within two to four quarters of that first pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'khc-public-network',
          source: 'Kraft Heinz public network disclosures',
          confidence: 'public',
          detail: 'Anchors the ~30 U.S. plant figure, dual-HQ structure (Chicago/Pittsburgh), and the published manufacturing footprint across ambient, refrigerated, frozen, and shelf-stable beverage product lines.',
          url: 'https://www.kraftheinzcompany.com/',
        },
        {
          id: 'khc-3b-investment',
          source: 'Kraft Heinz $3B U.S. manufacturing modernization (May 2025)',
          confidence: 'public',
          detail: 'Largest plant investment in decades, touching ~30 U.S. facilities. Operationally, this is a plant-level capacity, automation, and reliability program — the kind that creates throughput downstream of the yard.',
          url: 'https://www.supplychaindive.com/news/kraft-heinz-3-billion-us-investment-manufacturing/',
        },
        {
          id: 'khc-dekalb',
          source: 'Kraft Heinz DeKalb IL automated DC',
          confidence: 'public',
          detail: '$400M, 775,000 sq ft. Targets >60% of foodservice volume and ~30% of dry goods. Daifuku is the automation integrator; opening pushed from 2025 to 2027 per public construction reporting.',
        },
        {
          id: 'khc-lighthouse',
          source: 'Kraft Heinz Lighthouse (Microsoft-built control tower)',
          confidence: 'public',
          detail: 'Proprietary control tower built with Microsoft (announced April 2022 as the foundation of the broader digital transformation). End-to-end farm-to-fork visibility; AI-coordinated demand planning and disruption response; CEO Carlos Abrams-Rivera frames the impact as "reactive to proactive." Public reporting cites ~12% production-efficiency gains and ~$30M in sales-side impact attributed to AI + Lighthouse. Whether site-level yard feeds ladder into Lighthouse at the network layer in a usable way is a discovery question, not a public fact.',
          url: 'https://news.microsoft.com/source/2022/04/21/kraft-heinz-and-microsoft-join-forces-to-accelerate-supply-chain-innovation-as-part-of-broader-digital-transformation/',
        },
        {
          id: 'khc-agile-at-scale',
          source: 'Kraft Heinz Agile@Scale program disclosures',
          confidence: 'public',
          detail: 'Public reporting cites ~20% inventory reduction, 48.2% autonomous forecast adoption by early 2025, 10.4% improvement in weekly forecast accuracy at SKU-location-customer level. Leaner inventory makes yard variance a working-capital problem.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site CPG networks operate under, not Kraft Heinz specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'torres-tenure',
          source: 'Flavio Torres — public tenure record',
          confidence: 'public',
          detail: '~25 years at AB InBev ending as VP Supply Global; named EVP & Global CSCO at Kraft Heinz; public executive sponsor of Agile@Scale, Lighthouse, and OMP / o9 partnerships.',
          url: 'https://www.linkedin.com/in/flavio-torres-19a07012/',
        },
      ],
      unknowns: [
        'Whether yard feeds reach Lighthouse at the network layer in a way the control-tower operator can act on without screen-switching',
        'Whether the OMP + o9 planning stack and Lighthouse already arbitrate yard-induced supply variance — or whether yard variance is currently absorbed into forecast error',
        'Which of the 2007–2009 site-level yard-automation deployments are still in production today vs. retired through facility consolidation or end-of-life refresh',
        'Whether the DeKalb yard-ops design has been spec\'d yet — and who owns that design',
        'How the $3B modernization is changing trailer arrival patterns at the plants that received capex first',
        'How multi-temp dock-door arbitration is decided today at the multi-temp plants — site policy, system logic, or operator judgment',
        'Where Agile@Scale inventory tightening has already produced visible yard-induced stockouts, and which sites those map to',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Kraft Heinz is distinctive in this round because the operating-system thinking is already on the floor — Agile@Scale for planning, Lighthouse for visibility, OMP and o9 for orchestration. The yard is the one layer that has not yet caught the same operating discipline. This brief sizes that gap, not the site-level wins under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Flavio — the part most worth pushing back on is whether the operating-system discipline you carried out of twenty-five years at AB InBev has reached the yard layer yet, or whether it stopped at the planning and visibility tiers. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'kraft-heinz-001',
      name: 'Flavio Torres',
      firstName: 'Flavio',
      lastName: 'Torres',
      title: 'EVP & Global Chief Supply Chain Officer',
      company: 'Kraft Heinz',
      email: 'flavio.torres@kraftheinz.com',
      linkedinUrl: 'https://www.linkedin.com/in/flavio-torres-19a07012/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',
      currentMandate:
        'Owns manufacturing, logistics, and quality across ~70 plants globally. AB InBev pedigree (~25 years, ending as VP Supply Global). Named executive sponsor of Agile@Scale, Lighthouse, and OMP/o9 partnerships. Public phrase "speed and scale" is his own.',
      bestIntroPath:
        'Direct outreach to EVP supply chain office. If delegated, target VP Logistics / VP Network Logistics or VP Distribution Operations, cc the Enterprise Apps / Digital Supply Chain lead who owns Lighthouse build.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kraft-heinz-001',
        name: 'Flavio Torres',
        firstName: 'Flavio',
        lastName: 'Torres',
        title: 'EVP & Global Chief Supply Chain Officer',
        company: 'Kraft Heinz',
        email: 'flavio.torres@kraftheinz.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Flavio Torres - EVP & Global Chief Supply Chain Officer',
      variantSlug: 'flavio-torres',

      framingNarrative:
        'Flavio, the operating-system discipline you carried out of twenty-five years at AB InBev — uniform standards across every brewery, every site, every shift — is the same discipline you brought to planning at Kraft Heinz through Agile@Scale and to visibility through Lighthouse. The yard is the tile that has not been laid into that operating system yet. Site-level automation closed the site-level case two decades ago. The network operating layer above the sites is what Agile@Scale\'s leaner inventory now needs and what Lighthouse is shaped to host.',
      openingHook:
        'Speed and scale was your phrase. At Kraft Heinz it has reached planning and visibility — Agile@Scale, Lighthouse, OMP, o9. It has not yet reached the yard.',
      stakeStatement:
        'The $3B modernization is moving throughput-out-the-door across ~30 plants. Agile@Scale removed the inventory buffer that used to absorb yard variance. The gap between those two is the network yard layer — and it is the only operating-system tile at Kraft Heinz that is not yet running to a single standard.',

      heroOverride: {
        headline: 'The Lighthouse tile no one has filled yet is the yard network operating layer.',
        subheadline:
          'Site-level yard automation is proven at Kraft Heinz. The network operating model above it — the one Agile@Scale\'s leaner inventory now needs and Lighthouse is shaped to host — is the unfilled tile. The smaller no-gate sites are the cleanest place to prove it; DeKalb 2027 is where it scales.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Torres ran AB InBev\'s global supply for 25 years; he doesn\'t need a glossary. Acknowledge the site-level yard automation win as a win — it is one. Position the wedge as the layer above sites (network operating model), not as replacement of sites. Quote his own language ("speed and scale") back at him only where it earns the quote.',
      kpiLanguage: [
        'network OEE',
        'dock-door utilization',
        'trailer dwell',
        'dock-to-stock cycle time',
        'multi-temp dock arbitration',
        'working-capital lever',
        'carrier scorecard',
        'control-tower coverage',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same network shape, harder freight (water), already running the network-level layer above site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~30 U.S. plants (~70 globally); DeKalb IL automated DC (775,000 sq ft, opens 2027)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Mixing Centers'],
    geographicSpread:
      'North America (dual HQ: Chicago, IL / Pittsburgh, PA; plants include Holland MI, Davenport IA, Fremont OH, Newberry SC, Mason City IA, Garland TX, Champaign IL, Pittsburgh PA, Muscatine IA, Tulare CA, Stockton CA, Wausau WI, DeKalb IL, and ~17 more U.S. sites)',
    dailyTrailerMoves: 'High-volume — modeled at the network level across ~30 U.S. plants and rising as $3B modernization throughput lands',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — distributed across ambient (sauces, condiments, dry meals), refrigerated (Philadelphia, Oscar Mayer, Lunchables), frozen (Ore-Ida, Smart Ones), and shelf-stable beverage (Capri Sun, Kool-Aid)',
  },

  signals: {
    recentNews: [
      '$3B U.S. manufacturing modernization (May 2025) — touches ~30 U.S. facilities; the largest plant investment in decades.',
      'DeKalb IL automated DC ($400M, 775,000 sq ft) targets >60% of foodservice volume + ~30% of dry goods; opens 2027 with Daifuku-driven automation inside the building.',
      'Kraft Heinz Lighthouse — Microsoft-built control tower — is Torres\' signature digital initiative; yard network ops is the obvious unfilled tile.',
      'Agile@Scale program cut inventory ~20% with 48.2% autonomous forecast adoption — leaner inventory makes yard variance a working-capital lever.',
      'Corporate split into Global Taste Elevation Co. and N.A. Grocery Co. paused February 2026; $600M turnaround investment announced instead. Network-ops investments are unfrozen.',
    ],
    urgencyDriver:
      'The operating-system discipline Torres applied at AB InBev — uniform standards across every site — has been delivered at Kraft Heinz for planning (Agile@Scale) and visibility (Lighthouse) but not for the yard layer above the sites. The DeKalb greenfield (opens 2027) is the highest-leverage single deployment site in the U.S. portfolio; the $3B modernization throughput is the timing driver for the rest.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Greenfield', body: 'DeKalb · $400M · opens 2027 · highest-throughput single node.' },
    { mark: 'Modernization', body: '$3B U.S. plant investment · ~30 sites · May 2025.' },
    { mark: 'Working capital', body: 'Agile@Scale cut inventory ~20%. Yard variance is now a working-capital line.' },
    { mark: 'Torres in his own words', body: 'Speed and scale reached planning and visibility. It has not yet reached the yard.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Flavio Torres. The operating-system discipline you carried out of twenty-five years at AB InBev now runs Kraft Heinz planning and visibility — Agile@Scale and Lighthouse. The five minutes that follow are about the one tile it has not yet reached.',
    chapters: [
      { id: 'thesis', label: 'I. The site-level case is closed', start: 0 },
      { id: 'what-agile-made', label: 'II. What Agile@Scale made expensive', start: 65 },
      { id: 'unfilled-tile', label: 'III. The unfilled Lighthouse tile', start: 130 },
      { id: 'not-dekalb', label: 'IV. Why the first pilot is not DeKalb', start: 195 },
      { id: 'simple-site-proof', label: 'V. What proof at the simple site earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#C8102E',
  },
};
