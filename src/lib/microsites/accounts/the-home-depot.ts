/**
 * The Home Depot — ABM Microsite Data
 * Quality Tier: 2 Band B (retail)
 * Pitch shape: multi-channel dock arbitration as the network-tier seam
 *   (RDC + FDC + MDO + DFC feed stores, contractor job-sites, and B2C
 *   e-commerce from the same dock infrastructure; the One Supply Chain
 *   planning layer doesn't reach the yard layer below it)
 */

import type { AccountMicrositeData } from '../schema';

export const theHomeDepot: AccountMicrositeData = {
  slug: 'the-home-depot',
  accountName: 'The Home Depot',
  parentBrand: 'The Home Depot',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 77,

  pageTitle: 'YardFlow for The Home Depot — Multi-Channel Dock Arbitration',
  metaDescription:
    'The Home Depot runs four distribution-center archetypes (RDC, FDC, MDO, DFC) feeding stores, contractor job-sites, and B2C delivery from the same dock infrastructure. One Supply Chain is the planning answer; the yard-layer answer is still per-site.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about The Home Depot network',
      composition: [
        { label: 'Store footprint', value: '~2,300 stores across the U.S., Canada, and Mexico — the demand surface every distribution archetype feeds' },
        { label: 'Rapid Deployment Centers (RDCs)', value: 'High-velocity store replenishment — short dwell, appointment-driven, dock cadence built around inbound from suppliers and outbound to stores' },
        { label: 'Flatbed Distribution Centers (FDCs)', value: '17 sites, ~1M sq ft each, rail-served; ~32 flatbeds staged at a time. Lumber and building-materials bulk for the Pro channel; same- or next-day to job-sites' },
        { label: 'Market Delivery Operations (MDOs)', value: '160 cross-dock facilities staging big-and-bulky (appliances, furniture, large home goods) for B2C and Pro delivery — mixed inbound, mixed outbound, mixed appointment vs. drop' },
        { label: 'Direct Fulfillment Centers (DFCs)', value: '20 customer-proximate sites stocking the extended e-commerce assortment; pick-pack-ship cadence sitting next to retail-grade trailer flow' },
        { label: 'One Supply Chain program', value: 'CFO confirmed in 2025 the MDO/DFC/FDC buildout is "essentially complete" — the program now pivots to utilization and gross-margin extraction' },
        { label: 'Pro channel acceleration', value: 'SRS Distribution acquisition closed Sep 2024 ($18.25B); GMS wallboard acquisition closed summer 2025 ($5.5B). Pro-and-trade volume is the growth lane the network was rebuilt for' },
      ],
      hypothesis:
        'The interesting thing about The Home Depot yard math is what One Supply Chain has and has not solved. The planning layer is now coherent — the network knows what inventory should be where, the MDO/DFC/FDC archetypes are built, and the CFO said the capex curve is past its peak. What is not coherent is the yard layer underneath each archetype, because each archetype is doing a fundamentally different job out of the same physical dock infrastructure. An MDO is the clearest case: the same building stages an appliance for a Saturday B2C delivery window, a kitchen-cabinet pallet for a Pro contractor pickup, and inbound store replenishment for the nearest RDC. Three channels, three appointment cadences, three downstream service-level commitments, one set of dock doors. The yard is where they arbitrate. RDCs and FDCs each have their own version of the problem — RDC trailer flow is dense and short-dwell against store delivery windows, FDC flatbed staging is heavy and rail-fed against same-day contractor cycles — but the multi-channel mix at the MDO is the seam that bends hardest, and it bends harder every quarter as the Pro channel grows. The SRS Distribution and GMS acquisitions did not just add SKU breadth; they added Pro-side trailer flow at scale, sitting on top of an already-mixed dock environment. The planning layer can route a load to the right archetype. The yard layer at that archetype still arbitrates which door it lands at, in what order, against which channel\'s clock — and that arbitration is largely site-by-site judgment running on tooling that was built when MDOs only did appliances and FDCs only did lumber.',
      caveat:
        'This is built from public Home Depot disclosures, the One Supply Chain reporting cadence, trade press on the FDC/MDO/DFC buildout, and the SRS/GMS acquisition record. The most useful thing you can do with this is push back on the parts that do not match what the network looks like internally — particularly whether multi-channel dock arbitration at the MDO is already systematized or still operator-judgment, whether the post-SRS Pro mix has stressed yard cadence at specific sites, and how One Supply Chain reporting treats the yard layer today.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the multi-flow gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network feeding stores, foodservice, and direct-to-consumer, and they have layered a network-level yard operating model on top of the site-level yard systems each plant already had. The Home Depot operating profile is shaped differently — retail rather than CPG, multi-channel rather than multi-temp — but the underlying problem rhymes: multiple flow types arbitrating across shared dock infrastructure, where the site-by-site answer is not the same as a network answer. If a network can run this operating model on water — weight-out before cube-out, returns flow on top of forward flow, premium SKUs sharing the dock with ambient — the read-across to multi-channel retail (B2C delivery, contractor pickup, store replenishment sharing the same MDO) is the easier lift, not the harder one. The freight category is different; the network-coordination-across-flows shape is the same.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at Home Depot are different in kind: (1) a high-volume MDO with mixed channel mix — appliance B2C plus Pro pickup plus inbound store replenishment all running through the same dock infrastructure, where the multi-channel arbitration cost is visible from the first week; (2) a flagship FDC where flatbed staging cycles against same-day contractor windows, and where the yard-layer constraint on Pro-channel growth shows up as schedule slip rather than dwell. We would expect the network to make sense of itself within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'thd-10k',
          source: 'The Home Depot 10-K and quarterly investor reporting (FY2024–FY2025)',
          confidence: 'public',
          detail: 'Anchors the ~2,300-store footprint, the One Supply Chain program cadence, and the CFO\'s 2025 statement that the MDO/DFC/FDC buildout is "essentially complete" and pivoting to utilization.',
          url: 'https://ir.homedepot.com/',
        },
        {
          id: 'thd-fdc',
          source: 'The Home Depot Flatbed Distribution Center (FDC) network disclosures',
          confidence: 'public',
          detail: '17 FDCs, ~1M sq ft each, rail-served, ~32 flatbeds staged simultaneously, same- or next-day Pro delivery. First FDC opened in Dallas in 2020.',
          url: 'https://corporate.homedepot.com/news/company/supply-chain-unveils-first-flatbed-distribution-center-fdc',
        },
        {
          id: 'thd-mdo-dfc',
          source: 'One Supply Chain — MDO/DFC build-out reporting',
          confidence: 'public',
          detail: '160 Market Delivery Operations (cross-dock for big-and-bulky), 20 Direct Fulfillment Centers (extended e-commerce assortment). The MDO is the multi-channel arbitration site by design.',
          url: 'https://www.supplychaindive.com/news/home-depot-distribution-delivery-speed-strategy/808125/',
        },
        {
          id: 'thd-srs-gms',
          source: 'SRS Distribution acquisition (Sep 2024, $18.25B) and GMS acquisition (summer 2025, $5.5B)',
          confidence: 'public',
          detail: 'Strategic pro/trade volume additions. Public disclosures and trade-press coverage establish the Pro-channel growth posture that compounds multi-channel dock pressure at MDOs and FDCs.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + retail-logistics yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on multi-channel cross-dock dwell, appointment-vs-drop arbitration, and detention-cost ranges. Describes the conditions multi-channel retail DCs operate under, not Home Depot specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether multi-channel dock arbitration at high-mix MDOs is systematized today or still operator-judgment with appointment-system support',
        'How the post-SRS and post-GMS Pro mix has changed trailer cadence at the FDCs that serve overlapping geographies',
        'How One Supply Chain reporting treats yard-layer metrics — whether dwell, turn time, and dock-utilization variance ladder into the program scorecard at the network tier',
        'Which MDO and FDC sites have already hit channel-mix saturation (the ones where channel B is taking dock time from channel A), and whether that surfaces as a tracked metric',
        'How the RDC layer coordinates with MDO and FDC inbound when the same supplier feeds multiple archetypes in the same market',
        'How carrier-experience and on-time-pickup metrics roll into the Pro-channel scorecard, and which yards drive the worst carrier scores against Pro service-level commitments',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Home Depot is distinctive in this round because the network is unusual in retail: four distribution-center archetypes (RDC, FDC, MDO, DFC) feeding three demand channels (stores, contractor job-sites, B2C delivery) from the same dock infrastructure, with the multi-channel mix at the MDO growing harder every quarter as the Pro side compounds. The planning layer is solved at the program tier; the yard layer where the arbitration physically happens is the unsolved seam. The water comparable is intentional: if a network operating model lands on the freight category where weight, margin, multi-temp, and returns flow all run at once, the read-across to multi-channel retail is the easier lift, not the harder one.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Home Depot — particularly whether multi-channel dock arbitration at the MDOs is already systematized, how the SRS and GMS Pro-channel additions have stressed yard cadence at specific sites, or how One Supply Chain reporting treats the yard layer today — that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-031',
      name: 'John Deaton',
      firstName: 'John',
      lastName: 'Deaton',
      title: 'Executive Vice President – Supply Chain & Product Development',
      company: 'The Home Depot',
      email: 'john.deaton@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/page/home-depot-leadership-0',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate: 'Official top supply-chain executive.',
      bestIntroPath: 'Executive outreach',
    },
    {
      personaId: 'P-032',
      name: 'John Drake',
      firstName: 'John',
      lastName: 'Drake',
      title: 'Senior Vice President – Supply Chain',
      company: 'The Home Depot',
      email: 'john.drake@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/bio/john-drake-senior-vice-president-supply-chain',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Transportation / Delivery',
      currentMandate: 'Official transportation and direct-to-customer delivery owner.',
      bestIntroPath: 'Executive outreach',
    },
    {
      personaId: 'P-033',
      name: 'Amit Kalra',
      firstName: 'Amit',
      lastName: 'Kalra',
      title: 'Senior Vice President – Supply Chain',
      company: 'The Home Depot',
      email: 'amit.kalra@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/bio/amit-kalra-senior-vice-president-supply-chain',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Distribution / Fulfillment',
      currentMandate: 'Official distribution and fulfillment operations owner.',
      bestIntroPath: 'Executive outreach',
    },
    {
      personaId: 'P-034',
      name: 'Richard McPhail',
      firstName: 'Richard',
      lastName: 'McPhail',
      title: 'Executive Vice President & Chief Financial Officer',
      company: 'The Home Depot',
      email: 'richard.mcphail@homedepot.com',
      linkedinUrl: 'https://corporate.homedepot.com/',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Finance / Strategy',
      currentMandate: 'EVP & CFO of The Home Depot; on record across recent reporting that the MDO/DFC/FDC buildout is essentially complete and the program is pivoting to utilization and gross-margin extraction.',
      bestIntroPath: 'Conference / investor-relations outreach',
    },
    {
      personaId: 'P-035',
      name: 'Erin Donnelly',
      firstName: 'Erin',
      lastName: 'Donnelly',
      title: 'Senior Director, Supply Chain Development',
      company: 'The Home Depot',
      email: 'erin.donnelly@homedepot.com',
      linkedinUrl: 'https://www.linkedin.com/in/erin-donnelly-ga',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain Strategy',
      currentMandate: 'Named supply-chain development leader for transformation lane.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-076',
      name: 'Jacquelyn Singleton',
      firstName: 'Jacquelyn',
      lastName: 'Singleton',
      title: 'Supply Chain Professional',
      company: 'The Home Depot',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'Engaged with FreightRoll outreach. Active signal makes this a warm routing path into Home Depot supply chain.',
      bestIntroPath: 'Direct - engaged contact',
    },
    {
      personaId: 'P-077',
      name: 'Joseph Orndoff',
      firstName: 'Joseph',
      lastName: 'Orndoff',
      title: 'Supply Chain Professional',
      company: 'The Home Depot',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'Engaged with FreightRoll outreach. Second warm signal at Home Depot strengthens the routing path.',
      bestIntroPath: 'Direct - engaged contact',
    },
    {
      personaId: 'P-078',
      name: 'Robert Grazian',
      firstName: 'Robert',
      lastName: 'Grazian',
      title: 'Senior Director, Supply Chain',
      company: 'The Home Depot',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      currentMandate: 'Senior Director level at Home Depot supply chain. Decision-maker authority for yard operations tooling.',
      bestIntroPath: 'LinkedIn / warm route via engaged contacts',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-031',
        name: 'John Deaton',
        firstName: 'John',
        lastName: 'Deaton',
        title: 'Executive Vice President – Supply Chain & Product Development',
        company: 'The Home Depot',
        email: 'john.deaton@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'John Deaton - Executive Vice President – Supply Chain & Product Development',
      variantSlug: 'john-deaton',

      framingNarrative:
        'John, the network you own has done something unusual in retail — four distribution-center archetypes coordinating three demand channels from the same dock infrastructure. The planning layer above the archetypes is built. The yard layer underneath each one is still per-site.',
      openingHook:
        'One Supply Chain put the MDO, DFC, and FDC archetypes in the field. The next-tier question is the yard layer below them — where an MDO arbitrates Saturday appliance delivery against Pro contractor pickup against inbound RDC replenishment, all at the same dock, against three different clocks. That arbitration is the seam.',
      stakeStatement:
        'Multi-channel dock arbitration without a network operating model means each archetype loses the same minute differently. Across 197 MDO-DFC-FDC sites plus the RDC layer, the unarbitrated minute compounds — and the Pro-channel growth coming out of SRS and GMS keeps adding flow on top of the constraint.',

      heroOverride: {
        headline: 'John, the One Supply Chain buildout is essentially complete. The yard layer below it is the next tier.',
        subheadline:
          'Four archetypes coordinating store replenishment, Pro contractor pickup, and B2C delivery share the same dock infrastructure. The arbitration between them is where the network either compounds or leaks.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer, network-operator framing. Deaton owns the program; do not pitch him on the program. Position the wedge as the layer below the archetypes, not as replacement for them. Acknowledge the One Supply Chain buildout as the win it is.',
      kpiLanguage: [
        'multi-channel dock arbitration',
        'archetype-tier coordination',
        'cross-archetype trailer cadence',
        'Pro-channel service-level coverage',
        'dock-door utilization across mixed flow',
        'network-tier yard reporting',
      ],
      proofEmphasis:
        'Primo is the public comparable — same network-coordination-across-flows shape, on the hardest CPG freight. The directly-shaped reference (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-032',
        name: 'John Drake',
        firstName: 'John',
        lastName: 'Drake',
        title: 'Senior Vice President – Supply Chain',
        company: 'The Home Depot',
        email: 'john.drake@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Transportation / Delivery',
      },
      fallbackLane: 'logistics',
      label: 'John Drake - Senior Vice President – Supply Chain',
      variantSlug: 'john-drake',

      framingNarrative:
        'John, the transportation side of One Supply Chain is the side that feels the yard variance first — Pro-channel service-level commitments do not bend when an MDO dock door is held by appliance B2C delivery for a second tour.',
      openingHook:
        'The carrier scorecard already knows which MDOs and FDCs cost on-time-pickup. The question is whether the network sees the same variance the carriers do, in a way the Pro-channel service-level commitments can be defended against as the post-SRS and post-GMS mix keeps growing.',
      stakeStatement:
        'Pro-channel service levels (same-day, next-day jobsite delivery) are sold at the network tier and earned at the yard tier. When dock arbitration at the MDO or staging cadence at the FDC slips, the carrier scorecard catches it before the program scorecard does.',

      heroOverride: {
        headline: 'John, the transportation network feels the yard variance before the program scorecard does.',
        subheadline:
          'Pro-channel service levels are earned at the dock door. Multi-channel MDOs and rail-fed FDCs are where the schedule either holds or slips.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Drake reads carrier scorecards weekly. Lead with the metrics he already tracks — on-time pickup, dwell variance, carrier satisfaction — and connect them to the multi-channel dock arbitration story.',
      kpiLanguage: [
        'on-time pickup',
        'carrier scorecard variance',
        'dwell at the MDO',
        'flatbed staging cycle at the FDC',
        'Pro-channel service-level adherence',
        'detention spend',
      ],
      proofEmphasis:
        'The 48-to-24 minute turn-time delta and the dock-office-headcount-held-flat result from Primo are the operator-language proof points. Drake will read them as a peer would.',
    },
    {
      person: {
        personaId: 'P-033',
        name: 'Amit Kalra',
        firstName: 'Amit',
        lastName: 'Kalra',
        title: 'Senior Vice President – Supply Chain',
        company: 'The Home Depot',
        email: 'amit.kalra@homedepot.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Distribution / Fulfillment',
      },
      fallbackLane: 'executive',
      label: 'Amit Kalra - Senior Vice President – Supply Chain',
      variantSlug: 'amit-kalra',

      framingNarrative:
        'Amit, the distribution side of the network is where the multi-channel mix lives — and where it gets harder every quarter the Pro side compounds.',
      openingHook:
        'An MDO is not one operating model — it is three operating models sharing dock doors. B2C appliance delivery on a Saturday window, Pro contractor pickup on a same-day clock, and inbound store replenishment from the supplier — all arbitrating against the same physical infrastructure. The site-level answer is operator judgment; the network-tier answer is the unsolved seam.',
      stakeStatement:
        'Distribution efficiency at the archetype tier is solved by the One Supply Chain buildout. Multi-channel arbitration inside the archetype, especially at high-mix MDOs, is the next-tier constraint — and it tightens every time the Pro mix grows.',

      heroOverride: {
        headline: 'Amit, four distribution archetypes. Three demand channels. One dock per door. The arbitration is the seam.',
        subheadline:
          'MDOs were built for big-and-bulky. They now stage Pro pickup and inbound replenishment alongside it. The yard layer is where the channel mix gets reconciled — or doesn\'t.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Kalra owns the distribution side; talk to him about the dock door, not the program. Lead with the MDO arbitration story specifically.',
      kpiLanguage: [
        'dock-door utilization by channel',
        'channel-mix saturation',
        'cross-channel dwell variance',
        'appointment vs. drop ratio',
        'staging cadence',
        'cross-archetype coordination',
      ],
      proofEmphasis:
        'Primo\'s multi-flow operating model — forward flow, returns flow, multi-temp on the same dock — is the directly-rhyming shape. Different freight category, same arbitration problem.',
    },
    {
      person: {
        personaId: 'P-034',
        name: 'Richard McPhail',
        firstName: 'Richard',
        lastName: 'McPhail',
        title: 'Executive Vice President & Chief Financial Officer',
        company: 'The Home Depot',
        email: 'richard.mcphail@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Finance / Strategy',
      },
      fallbackLane: 'cfo',
      label: 'Richard McPhail - Executive Vice President & Chief Financial Officer',
      variantSlug: 'richard-mcphail',

      framingNarrative:
        'Richard, you said on the record in 2025 that the MDO/DFC/FDC buildout is essentially complete and the next chapter is utilization. The yard layer is the utilization tier.',
      openingHook:
        'The One Supply Chain capex curve is past its peak. The return on that build now depends on how hard each archetype can be utilized — which is a yard-layer question at the dock door, not a planning-layer question at the program. The Pro-channel growth coming out of SRS and GMS is the demand side of that equation; the multi-channel arbitration at the MDO is the supply side.',
      stakeStatement:
        'Utilization is earned in minutes at the dock door. Multi-channel MDOs that arbitrate well absorb Pro-channel growth as operating leverage; ones that do not bend the gross-margin curve the program was built to lift.',

      heroOverride: {
        headline: 'Richard, the capex chapter is closing. The utilization chapter starts at the dock door.',
        subheadline:
          'Multi-channel dock arbitration at the MDO is the utilization tier of One Supply Chain. The yard layer is where the Pro-channel growth either compounds as operating leverage or leaks as variance.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Strategic, board-level, fact-grounded. McPhail is a numbers reader; the analysis already cites him correctly. Position the yard layer as the operating-leverage tier inside the utilization chapter he has already named publicly.',
      kpiLanguage: [
        'asset utilization',
        'gross-margin extraction from capex base',
        'operating leverage on Pro-channel growth',
        'detention and demurrage spend',
        'labor cost per trailer at the archetype tier',
        'network-tier yard reporting',
      ],
      proofEmphasis:
        'The per-site profit impact and headcount-held-flat results from Primo are the CFO-language proof points. McPhail reads in operating leverage, not features.',
    },
    {
      person: {
        personaId: 'P-035',
        name: 'Erin Donnelly',
        firstName: 'Erin',
        lastName: 'Donnelly',
        title: 'Senior Director, Supply Chain Development',
        company: 'The Home Depot',
        email: 'erin.donnelly@homedepot.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain Strategy',
      },
      fallbackLane: 'ops',
      label: 'Erin Donnelly - Senior Director, Supply Chain Development',
      variantSlug: 'erin-donnelly',

      framingNarrative:
        'Erin, supply chain development at Home Depot is the team that owns what comes after One Supply Chain. The yard layer below the archetypes is one of the open seams.',
      openingHook:
        'The MDO, DFC, and FDC archetypes are built. The next-tier program work is the operating model above them — how the network coordinates across archetypes when the same supplier feeds three of them in the same market, how Pro-channel service levels get defended at the dock door, and how multi-channel arbitration at the MDO becomes a system instead of a per-site judgment call.',
      stakeStatement:
        'Supply chain development owns the bridge between what the network has built and what it needs to operate at scale. The yard layer is one of the surfaces where that bridge is not yet built.',

      heroOverride: {
        headline: 'Erin, the archetypes are built. The operating model above them is the next-tier development work.',
        subheadline:
          'Multi-channel dock arbitration at the MDO. Cross-archetype coordination at the market tier. Pro-channel service-level adherence at the yard tier. These are program-design questions, not site-design questions.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Program-level, development-team framing. Donnelly thinks in operating models and rollout plans, not site-by-site operations. Position the wedge as the operating-model tier above the archetypes.',
      kpiLanguage: [
        'network-tier operating model',
        'archetype coordination',
        'rollout cadence',
        'program-tier yard reporting',
        'channel-mix policy',
        'standardized dock-door arbitration',
      ],
      proofEmphasis:
        'The "24 facilities live · >200 contracted" rollout cadence from Primo is the program-language proof point. The operating model has shipped at scale; the question is what it looks like on retail multi-channel.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments at a comparable multi-flow network' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted rollout cadence across comparable operating profiles' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable multi-channel facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'The yard used to be where we lost visibility. Now it is where we gain control over every trailer in the network.',
        role: 'Operations Director',
        company: 'National multi-channel distributor',
      },
    },
  ],

  network: {
    facilityCount: '~2,300 stores · 17 FDCs · 160 MDOs · 20 DFCs · plus the RDC layer',
    facilityTypes: ['Rapid Deployment Centers (RDCs)', 'Flatbed Distribution Centers (FDCs)', 'Market Delivery Operations (MDOs)', 'Direct Fulfillment Centers (DFCs)'],
    geographicSpread: 'United States, Canada, Mexico',
    dailyTrailerMoves: 'High-volume — distributed across four distribution archetypes feeding three demand channels',
    fleet: '3PL and contract-carrier mix; flatbed (FDC), dry van (RDC/MDO), and parcel/LTL (DFC) across the archetypes',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Flatbed', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — distributed across building-materials bulk (FDC), big-and-bulky cross-dock (MDO), high-velocity store replenishment (RDC), and e-commerce fulfillment (DFC)',
  },

  signals: {
    recentNews: [
      'CFO confirmed in 2025 that the MDO/DFC/FDC buildout is essentially complete; program pivots to utilization and gross-margin extraction.',
      'SRS Distribution acquisition closed September 2024 ($18.25B) — added roofing and building-materials Pro-channel volume on top of the FDC network.',
      'GMS wallboard acquisition closed summer 2025 ($5.5B) — additional Pro-channel SKU breadth flowing through overlapping distribution geographies.',
      '17 FDCs operating at ~1M sq ft each, ~32 flatbeds staged simultaneously; same- or next-day Pro-channel delivery is the service-level commitment.',
    ],
    supplyChainInitiatives: [
      'One Supply Chain — the program that built the MDO/DFC/FDC archetypes. The yard layer below each archetype is the unsolved tier.',
    ],
    urgencyDriver:
      'The capex chapter of One Supply Chain is closing; the utilization chapter is starting. Multi-channel dock arbitration at the MDO is the operating-leverage tier of that next chapter, and Pro-channel growth from SRS and GMS keeps tightening the constraint.',
  },

  theme: {
    accentColor: '#C2410C',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 2,
  layoutPreset: 'retail',
};
