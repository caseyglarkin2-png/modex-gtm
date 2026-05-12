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
        { label: 'U.S. manufacturing footprint', value: '~30 plants across ambient, refrigerated, and frozen; multi-temp at most sites' },
        { label: 'Greenfield deployment site', value: 'DeKalb IL automated DC — $400M, 775,000 sq ft, opens 2027; >60% of foodservice volume + ~30% of all dry goods' },
        { label: 'Active modernization', value: '$3B U.S. plant investment announced May 2025 — throughput-out-the-door capacity climbing across ~30 sites' },
        { label: 'Existing yard-tech layer', value: 'Legacy site-level yard automation from a 2007–2009 rollout; current production status across the surviving sites is mixed. The network-level operating layer above the sites is unsolved either way' },
        { label: 'Yard archetype mix', value: '~37% no-gate sites · ~56% guarded with gate+GS (some campus, some scale) · ~63% rural with connectivity exposure · majority three-shift cadence (27-site internal survey)' },
        { label: 'Carrier model', value: '3PL / contract-carrier dependent; heavy rail and intermodal inbound; foodservice + grocery channels run on different cadences' },
        { label: 'Working-capital posture', value: 'Agile@Scale program cut inventory ~20% — leaner inventory makes dock-execution variance a working-capital problem, not just an operations one' },
      ],
      hypothesis:
        'The interesting thing about the Kraft Heinz yard math is what site-level success has *not* done. The dozen-site yard-automation rollout that started at Stockton two decades ago worked — manual yard checks went away, demurrage came down, overflow lots disappeared. Those are real wins and the case study is real. But site-level automation, multiplied across six campuses, is not the same as a network operating model. Each site optimizes its own gate, its own dock priority, its own appointment-versus-walk-in mix, its own multi-temp dock-door arbitration. The network doesn\'t agree with itself on what good looks like.\n\nThat gap got more expensive in the last three years for two reasons. First, Agile@Scale cut inventory roughly 20% — leaner networks turn yard variance into stockouts, so a 90-minute trailer delay that used to land inside safety stock now shows up at the shelf. Second, the $3B U.S. modernization will lift throughput at the plant; throughput-out-the-door becomes trailer-into-the-yard, and modernizing the building without modernizing the yard layer above the sites creates a known flow-control wall at the gatehouse.\n\nThe third thing is forward-looking, and it is where the pilot question lives. DeKalb opens in 2027 as the highest-throughput single node in the U.S. portfolio, with Daifuku driving inside-the-building automation and no entrenched yard-ops process around it. That makes DeKalb the natural *scale-up* target for a network operating model — but not the first pilot. The first pilot lands at one of the smaller no-gate, urban-connectivity facilities — the kind of site where the carrier yard is simplest to instrument, the displacement risk is lowest, and the operating model can be proven without putting the marquee deployment at risk. The proof at the simple site is what earns the right to operate the layer above DeKalb in 2027 and the $3B-modernized plants in the second wave.',
      caveat:
        'This is built from public Kraft Heinz disclosures, the public yard-automation case record, Lighthouse press materials, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether site-level yard data actually ladders into Lighthouse in a way you can act on, whether the DeKalb yard-ops design has been spec\'d yet, and how the $3B plant investment is changing trailer arrival patterns at the sites where capex landed first.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Kraft Heinz operating profile is similar in shape — multi-site, multi-temp, 3PL-dependent, mature site-level yard automation already in place — but with significantly more forgiving freight economics per trailer. If a network can run this operating model on water, the harder freight, the read-across to ambient and refrigerated CPG is the easier lift, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
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
      ],
      unknowns: [
        'Whether site-level yard data currently feeds Lighthouse in a way the control-tower operator can act on at the network layer',
        'Which of the 2007–2009 site-level yard-automation deployments are still in production today vs. retired through facility consolidation or end-of-life refresh',
        'Whether the DeKalb yard-ops design has been spec\'d yet — and who owns that design',
        'How the $3B modernization is changing trailer arrival patterns at the plants that received capex first',
        'How multi-temp dock-door arbitration is decided today at the multi-temp plants — site policy, system logic, or operator judgment',
        'Where Agile@Scale inventory tightening has already produced visible yard-induced stockouts, and which sites those map to',
        'How carrier-experience metrics are reported into the procurement/operations seam, and which yards drive the worst carrier scorecards',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Kraft Heinz is distinctive in this round because the question is not whether yard automation pays back at the site level (it already has, twenty years ago, and the case is public) but whether the operating-system thinking that put planning and forecasting on a single Agile@Scale + Lighthouse stack should run the yard layer above the sites the same way. The water comparable is intentional: Primo Brands runs the hardest CPG freight in the country, and if a network operating model lands on water, ambient and refrigerated foodservice freight is the easier read-across.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Kraft Heinz — particularly whether site-level yard data already ladders into Lighthouse in a usable way, how the DeKalb yard-ops design is being scoped, or where the $3B plant investment has already put pressure on the yard — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
        'Flavio, the operating-system thinking you applied to breweries at AB InBev and to planning at Kraft Heinz through Agile@Scale + Lighthouse is the same thinking that turns site-level yard automation into a network operating model. The site-level case is closed at Kraft Heinz — it has been for almost two decades. The next tier is the one Lighthouse needs and Agile@Scale\'s leaner inventory now demands.',
      openingHook:
        'You already proved at the site level — twice over — that automated yard control pays back. The unanswered question is the layer above the sites: how every yard in the U.S. network agrees on the same dock-door arbitration, the same multi-temp logic, the same exception handling, in a way that feeds Lighthouse and survives the throughput lift coming out of the $3B plant program.',
      stakeStatement:
        'Throughput-out-the-door from a $3B plant program becomes trailer-into-the-yard. Site-by-site yard logic, however mature, doesn\'t arbitrate across sites — and lean inventory turns the unarbitrated minute into a stockout, not a recoverable buffer.',

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

  theme: {
    accentColor: '#C8102E',
  },
};
