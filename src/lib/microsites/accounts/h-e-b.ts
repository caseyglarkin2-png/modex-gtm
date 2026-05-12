/**
 * H-E-B — ABM Microsite Data
 * Quality Tier: B (privately-held; public disclosures limited; observation
 *                  built from trade-press, expansion coverage, and reasonable
 *                  network inference)
 * Pitch shape: WEDGE — operating-model layer that arbitrates three inbound
 *              flow types (own-manufacturing inbound + CPG-partner inbound +
 *              import inbound through Texas ports) into the same dock
 *              infrastructure at a Texas DC, feeding a private-label-heavy
 *              SKU mix
 * Angle: YARD MANAGEMENT (three-flow dock arbitration at vertically-integrated
 *        DCs; Houston expansion as the timing accelerant) — NOT driver
 *        experience
 * Stakeholder vocabulary: H-E-B distribution / Parkway Transport operator
 *        register — dock-turn time on perishables, multi-source inbound
 *        sequencing, private-fleet trailer cycle, store-replenishment
 *        cadence in a high-density Texas store cluster
 */

import type { AccountMicrositeData } from '../schema';

export const hEB: AccountMicrositeData = {
  slug: 'h-e-b',
  accountName: 'H-E-B',
  parentBrand: 'H-E-B',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 73,

  pageTitle: 'YardFlow for H-E-B — Three-Flow Dock Arbitration at a Vertically-Integrated Grocery DC',
  metaDescription:
    'How a network-level yard operating model arbitrates the three inbound flow types that meet at an H-E-B distribution center — own-manufacturing inbound, CPG-partner inbound, and import inbound through Texas ports — into the same dock infrastructure feeding a private-label-heavy SKU mix, with the Houston expansion as the timing accelerant.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the H-E-B network',
      composition: [
        {
          label: 'Store network',
          value:
            '~430+ stores across Texas and northeastern Mexico under multiple banners — H-E-B core, Central Market (premium organic / specialty), Mi Tienda (Hispanic-format), Joe V\'s Smart Shop (value), and the HEB Mexico cluster of ~70 stores serving a cross-border consumer base. Texas density is unusually high — the operating-cost case for fast replenishment from in-state DCs is structural, not aspirational.',
        },
        {
          label: 'DC structure',
          value:
            'Texas-centered DC network anchored by the San Antonio Super Regional Grocery Warehouse (~1.6M sq ft, ~200 dock doors, opened 2020) plus a Houston-area DC footprint, a Temple TX hub, and the regional perishable DCs that feed fresh into the network. Outbound delivery cadence runs on the private Parkway Transport fleet on a daily store-replenishment rhythm.',
        },
        {
          label: 'Vertical-integration footprint',
          value:
            'Reported 13+ owned manufacturing plants — H-E-B-owned dairies, bakeries, tortilla plants, meat-processing facilities, ice-cream production, ready-meal kitchens — feeding the DCs as a first-party inbound flow. Vertical-integration depth is unusual among U.S. grocers; most peers are private-label-heavy on a 3P co-manufacturing basis rather than an owned-plant basis.',
        },
        {
          label: 'Houston expansion in flight',
          value:
            'New ~500-acre distribution campus acquired in Hempstead TX (about an hour from Houston, multi-phase build starting late 2024) on top of an existing Houston DC plus a third Houston eCommerce fulfillment center (~100,000 sq ft, opened early 2025). Houston is the active throughput-add region for the network — modernizing the buildings without modernizing the yard layer above the sites creates a known flow-control wall at the gatehouse.',
        },
        {
          label: 'Private-label SKU depth',
          value:
            'H-E-B-brand and Central Market-brand private label is unusually deep — full SKU coverage in dairy, bakery, tortillas, meat, prepared meals, beverages, pet food (Heritage Ranch), and seasonal categories. More SKUs per category means more receiving sequencing decisions per dock door per shift than the mainstream-grocer baseline.',
        },
        {
          label: 'Texas-grown operating culture',
          value:
            'Privately-held since 1905; Butt family ownership; San Antonio HQ; consistently cited in trade press as the operator-respect benchmark in U.S. grocery. The constraint that gets attention here is operational, not strategic — the executive audience reads memos that take the operating layer seriously.',
        },
      ],
      hypothesis:
        'The interesting thing about the H-E-B yard math is the three-flow arbitration problem that almost no other U.S. grocer faces in the same shape. At an H-E-B regional DC, three fundamentally different inbound flows meet at the same dock infrastructure. The first is own-manufacturing inbound — trailers arriving from H-E-B-owned dairies, bakeries, tortilla plants, meat-processing, and ice-cream plants on a high-frequency, short-haul cadence dictated by H-E-B\'s own production schedule. The second is CPG-partner inbound — the conventional national-brand and regional-brand freight on the appointment-and-detention cadence every grocery DC operates under. The third is import inbound — Texas is the largest U.S. port-of-entry state by container volume after California, and Mexico cross-border freight comes through Laredo on a separate customs-clearance cadence; HEB Mexico cross-border flows compound that pattern. Each of these three flows has a different priority logic, a different acceptable dwell window, and a different downstream consequence of delay. Vertical integration is the part that makes the consequences asymmetric: a 90-minute delay on a CPG-partner inbound is a detention-and-OTIF problem; a 90-minute delay on an H-E-B-owned dairy inbound is an H-E-B-owned production-line problem one step upstream and a fresh-shelf-life problem one step downstream. The operating consequences of yard variance compound across more of the value chain than at peer grocers because more of the value chain is H-E-B. The Houston expansion is the timing accelerant. A new ~500-acre Hempstead campus, an active Houston DC, and three Houston eCommerce fulfillment centers built in 2024–2025 mean throughput-into-the-Houston-yard is climbing materially over an 18–36 month window. Modernizing the building automation inside the DC without modernizing the yard layer above the sites moves the throughput constraint from the warehouse to the gatehouse. Private-label SKU depth — every category covered on the H-E-B-brand and Central Market-brand side, plus Mi Tienda, plus Joe V\'s, plus Heritage Ranch pet food — multiplies the number of receiving sequencing decisions per dock door per shift, which compounds the arbitration problem rather than easing it.',
      caveat:
        'This is built from H-E-B public statements (limited because the company is private), Texas trade-press coverage of the San Antonio Super Regional Warehouse and the Hempstead campus, the Houston Chronicle and Supply Chain Dive coverage of the Houston eCommerce expansion, the Wikipedia and trade-press inventory of H-E-B-owned manufacturing plants, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how much of own-manufacturing inbound versus CPG-partner inbound versus import inbound actually shares the same dock doors at the regional DCs today, what the explicit prioritization rule is when those three flows contend for the same slot, and how the Hempstead-campus yard-operations design is being scoped relative to the existing San Antonio Super Regional standard.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they have layered a network-level operating model on top of their existing site-level yard systems. The shape that translates to H-E-B is multi-source-inbound-into-shared-dock-infrastructure: Primo runs spring-water, purified, and premium SKUs out of multiple plant types, sequenced into the same DC dock surface, on a multi-temp cadence. Grocery is a different category from beverage — H-E-B\'s downstream is fresh-shelf-life and store replenishment, not retail-bottled cases — but the operating shape of three (or four) different inbound flows arbitrating for the same dock doors with different downstream costs of error is the same shape. If a network operating model can run on water, the read-across to a vertically-integrated grocer is the easier lift, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at H-E-B are different in kind: (1) the San Antonio Super Regional Grocery Warehouse, where the dock-door count (~200) and the existing operating-standard discipline make the operating-model layer the cleanest second-order improvement on an already-modern building; (2) the Houston expansion (the existing Houston DC plus the Hempstead campus as it stands up), where the throughput-into-the-yard ramp is the timing pressure and a greenfield yard-operations design avoids retrofitting an existing protocol. We would expect the network to make sense of itself within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'heb-public-network',
          source: 'H-E-B public disclosures and trade-press coverage',
          confidence: 'public',
          detail:
            'Anchors the ~430+ store count across Texas and Mexico, the multi-banner structure (H-E-B core, Central Market, Mi Tienda, Joe V\'s Smart Shop, HEB Mexico), the San Antonio HQ, and the privately-held Butt family ownership. H-E-B does not disclose like a public company; trade-press is the primary public anchor.',
          url: 'https://newsroom.heb.com/',
        },
        {
          id: 'heb-san-antonio-warehouse',
          source: 'San Antonio Super Regional Grocery Warehouse public reporting',
          confidence: 'public',
          detail:
            '~1.6 million sq ft, ~200 loading docks, ~17,000 grocery items, ~180 outbound trailers per day at steady state, on an 871-acre East Side San Antonio campus. Anchors the operating-scale baseline for any subsequent yard-operating-model engagement.',
          url: 'https://www.supplychaindive.com/news/h-e-b-construction-largest-warehouse-distribution-fulfillment/542955/',
        },
        {
          id: 'heb-hempstead-campus',
          source: 'Hempstead TX distribution campus public reporting',
          confidence: 'public',
          detail:
            '~500-acre site acquired near Hempstead TX (about an hour from Houston) for a multi-phase distribution campus; first phase of construction expected to start late 2024. Anchors the Houston-region throughput-add window and the cleanest greenfield embed for a yard operating-model layer.',
          url: 'https://www.supplychaindive.com/news/heb-building-texas-distribution-campus/714580/',
        },
        {
          id: 'heb-houston-ecommerce',
          source: 'H-E-B Houston eCommerce fulfillment expansion',
          confidence: 'public',
          detail:
            'Third Houston eCommerce fulfillment center opened early 2025 (~100,000 sq ft); part of a broader Houston-market push that includes new store openings and the Hempstead distribution campus. Operationally, eCommerce fulfillment runs on a different inbound-trailer cadence than store replenishment and adds a fourth flow type at any DC that hosts both.',
        },
        {
          id: 'heb-vertical-integration',
          source: 'H-E-B owned-manufacturing footprint (trade-press inventory)',
          confidence: 'public',
          detail:
            '13+ company-owned manufacturing plants reported across dairy, bakery, tortilla, meat-processing, ice cream, and ready meals. Vertical-integration depth is unusual among U.S. grocers; the operational consequence is a first-party inbound flow at the DCs separate from CPG-partner inbound.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail:
            'Cross-industry baselines on dock-cycle variance, multi-temp dwell distributions, detention-cost ranges, and dock-radio prevalence. These describe the conditions most multi-DC grocery networks operate under, not H-E-B specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail:
            'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'What the explicit prioritization rule is at a flagship H-E-B regional DC when own-manufacturing inbound, CPG-partner inbound, and import inbound contend for the same dock slot — system logic, site policy, or operator judgment',
        'How much of the network is running on a current-generation yard execution system today versus on radio-and-spreadsheet ops, and which sites sit on which standard',
        'How the Hempstead-campus yard-operations design is being scoped relative to the existing San Antonio Super Regional standard — greenfield-on-current-standard or laddered into a new network operating model',
        'How HEB Mexico cross-border flows through Laredo are coordinated with the U.S. side at receiving DCs and whether import cadence is visible at the U.S. yard layer in real time',
        'How dock-door arbitration is currently decided across the multi-temp dock surface (ambient + refrigerated + frozen) at the perishable DCs feeding the high-density Texas store cluster',
        'How Parkway Transport private-fleet outbound metrics are surfaced into the same operating view as the inbound dock cycle, and where the network-level scorecard lives today',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. H-E-B is distinctive in this round for two operating reasons. The first is vertical integration: more of the value chain is H-E-B than at peer grocers — 13+ owned plants in dairy, bakery, tortillas, meat, ice cream, and ready meals — which means own-manufacturing inbound, CPG-partner inbound, and import inbound all meet at the same dock infrastructure at the regional DCs, on three different priority logics with three different downstream costs of error. The second is private-label SKU depth across the H-E-B core, Central Market, Mi Tienda, Joe V\'s, and Heritage Ranch lines, which multiplies the number of receiving sequencing decisions per dock door per shift. The Houston expansion — the existing Houston DC, the third eCommerce fulfillment center opened early 2025, and the new ~500-acre Hempstead campus — is the timing accelerant: throughput is climbing materially over an 18–36 month window. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country and resolves the same multi-source-inbound-into-shared-dock shape on harder economics per trailer. The read-across to vertically-integrated grocery is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for H-E-B — particularly what the explicit prioritization rule is when own-manufacturing, CPG-partner, and import inbound contend for the same dock slot, how the Hempstead-campus yard-operations design is being scoped relative to the San Antonio Super Regional standard, or how Parkway Transport outbound metrics surface into the same operating view as inbound dock cycle — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-041',
      name: 'Troy Retzloff',
      firstName: 'Troy',
      lastName: 'Retzloff',
      title: 'Senior Director of Distribution',
      company: 'H-E-B',
      email: 'troy.retzloff@heb.com',
      linkedinUrl: 'https://www.linkedin.com/in/troy-retzloff-a527a247',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Distribution',
      currentMandate: 'Best publicly surfaced distribution leader at H-E-B.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-042',
      name: 'Craig Stucker',
      firstName: 'Craig',
      lastName: 'Stucker',
      title: 'Director, Parkway Transport at H-E-B',
      company: 'H-E-B',
      email: 'craig.stucker@heb.com',
      linkedinUrl: 'https://www.linkedin.com/in/craigstucker',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Transportation',
      currentMandate: 'Strong transportation operator at H-E-B.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-043',
      name: 'Dakota Socha',
      firstName: 'Dakota',
      lastName: 'Socha',
      title: 'Transportation & Reverse Logistics',
      company: 'H-E-B',
      email: 'dakota.socha@heb.com',
      linkedinUrl: 'https://www.linkedin.com/in/dakota-socha-9635ba61',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Transportation / Reverse Logistics',
      currentMandate: 'Public profile references multi-site transportation and reverse logistics operations at H-E-B.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-044',
      name: 'Jeffrey Matthews',
      firstName: 'Jeffrey',
      lastName: 'Matthews',
      title: 'Operations & Supply Chain Leader',
      company: 'H-E-B',
      email: 'jeffrey.matthews@heb.com',
      linkedinUrl: 'https://www.linkedin.com/in/jeffreymatthews01',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations',
      currentMandate: 'Named H-E-B operations and supply-chain leader.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-045',
      name: 'Troy Shaw',
      firstName: 'Troy',
      lastName: 'Shaw',
      title: 'Supply Chain Strategy / Distribution Management / Transportation Planning',
      company: 'H-E-B',
      email: 'troy.shaw@heb.com',
      linkedinUrl: 'https://www.linkedin.com/in/troy-shaw-822125a',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Supply Chain / Strategy',
      currentMandate: 'Named H-E-B strategy and distribution leader.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-041',
        name: 'Troy Retzloff',
        firstName: 'Troy',
        lastName: 'Retzloff',
        title: 'Senior Director of Distribution',
        company: 'H-E-B',
        email: 'troy.retzloff@heb.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Distribution',
      },
      fallbackLane: 'ops',
      label: 'Troy Retzloff - Senior Director of Distribution',
      variantSlug: 'troy-retzloff',

      framingNarrative:
        'Troy, the operating discipline H-E-B distribution is publicly respected for is the discipline that recognizes the three-flow arbitration problem on the first slide. Own-manufacturing inbound from the H-E-B-owned dairies, bakeries, and tortilla plants; CPG-partner inbound on the appointment-and-detention cadence; import inbound through the Texas ports — three different priority logics meeting at the same dock surface, with vertical integration making the downstream cost of error asymmetric. The Houston expansion is the timing window; the operating-model layer above the regional DCs is the wedge.',
      openingHook:
        'At a vertically-integrated grocer, the yard is where three inbound flows arbitrate for the same dock doors — own-manufacturing, CPG-partner, and import — and a delay on the own-manufacturing side is an H-E-B-owned production-line problem one step upstream and a fresh-shelf-life problem one step downstream. The Hempstead campus and the Houston eCommerce ramp move that arbitration problem into the highest-throughput window the network has run in years.',
      stakeStatement:
        'Vertical integration means more of the value chain is yours — and more of the value chain is exposed to yard variance than at peer grocers. Modernizing the buildings without modernizing the yard layer above the sites moves the throughput constraint from the warehouse to the gatehouse exactly as Houston throughput climbs.',

      heroOverride: {
        headline: 'The operating-model layer above three-flow dock arbitration at H-E-B regional DCs.',
        subheadline:
          'Own-manufacturing inbound from H-E-B-owned plants, CPG-partner inbound on appointment cadence, and import inbound through Texas ports all meet at the same dock infrastructure. Vertical integration makes the downstream cost of variance asymmetric. The Houston expansion is the timing accelerant; the operating-model layer is the wedge.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator, peer-fluent, concise. H-E-B distribution has unusually deep operating respect across the industry; the audience reads memos that take the operating layer seriously. Lead with the three-flow shape; let private-label SKU depth and the Houston ramp do the timing work. Acknowledge the vertical-integration asymmetry explicitly — it is the unique-shape detail at H-E-B versus mainstream grocer peers.',
      kpiLanguage: [
        'three-flow dock arbitration (own-mfg + CPG-partner + import)',
        'first-party inbound cadence from H-E-B-owned plants',
        'multi-temp dock surface arbitration at the perishable DCs',
        'Houston throughput ramp into the Hempstead campus window',
        'private-label SKU depth versus receiving-slot density',
        'Parkway Transport private-fleet outbound cycle',
        'fresh-shelf-life-day exposure to gate-to-dock variance',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-source-inbound-into-shared-dock shape, harder freight (water), already running the network-level operating model on top of existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-042',
        name: 'Craig Stucker',
        firstName: 'Craig',
        lastName: 'Stucker',
        title: 'Director, Parkway Transport at H-E-B',
        company: 'H-E-B',
        email: 'craig.stucker@heb.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Transportation',
      },
      fallbackLane: 'logistics',
      label: 'Craig Stucker - Director Parkway Transport',
      variantSlug: 'craig-stucker',

      framingNarrative:
        'Craig, Parkway Transport sits on the outbound side of the same dock surface that has to absorb three inbound flow types simultaneously — own-manufacturing from the H-E-B-owned plants, CPG-partner inbound on the appointment cadence, and import inbound through the Texas ports. Private-fleet trailer cycle is one of the leverage points where inbound dock arbitration shows up as outbound miles-per-driver and detention recovery; the operating-model layer above the regional DCs is the wedge that makes that linkage visible.',
      openingHook:
        'Private-fleet outbound rhythm in a high-density Texas store cluster is one of the few places in U.S. grocery where the inbound-to-outbound dock cycle is genuinely the binding constraint, not just a reporting line. The Hempstead campus and the Houston throughput ramp move that constraint into a higher-throughput window than the network has run before.',
      stakeStatement:
        'When inbound arbitration slips at a regional DC, Parkway trailer cycle slips downstream — drivers waiting on dock release, outbound waves rolling later, store-replenishment cadence compressing. The asymmetry from vertical integration means the upstream cost of variance is also borne inside H-E-B, not absorbed by a third-party shipper.',

      heroOverride: {
        headline: 'Parkway Transport outbound and three-flow inbound on the same dock surface.',
        subheadline:
          'Inbound arbitration at the regional DCs sets the rhythm Parkway runs outbound on. Three flows (own-manufacturing + CPG-partner + import) into the same docks; private-fleet outbound into a high-density Texas store cluster. The operating-model layer above both halves is what makes the cycle calculable.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Transportation-operator register, concise. Craig runs the private fleet at a respected operator; the audience reads memos that take the operating layer seriously. Lead with the private-fleet linkage to inbound arbitration; do not over-claim on Parkway specifics that are not publicly disclosed.',
      kpiLanguage: [
        'Parkway trailer cycle time and detention recovery',
        'outbound-wave compression from inbound dock variance',
        'driver hours-of-service exposure to dock release variance',
        'store-replenishment cadence in a high-density Texas cluster',
        'multi-temp outbound trailer arbitration',
        'three-flow inbound coordination from the outbound side',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — private-fleet-heavy network with multi-source-inbound-into-shared-dock at the bottling plants, already running the network-level operating model above the existing site-level yard systems.',
    },
    {
      person: {
        personaId: 'P-043',
        name: 'Dakota Socha',
        firstName: 'Dakota',
        lastName: 'Socha',
        title: 'Transportation & Reverse Logistics',
        company: 'H-E-B',
        email: 'dakota.socha@heb.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Transportation / Reverse Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Dakota Socha - Transportation & Reverse Logistics',
      variantSlug: 'dakota-socha',

      framingNarrative:
        'Dakota, reverse-logistics flows at a private-fleet-heavy grocer with vertical-integration depth are a separate inbound pattern at the regional DCs — empty-trailer staging, returns and recall handling, the cross-dock back to the H-E-B-owned plants where own-brand product gets re-handled. That adds a fourth flow inside the three-flow inbound arbitration problem at the dock surface, on a cadence the gatehouse has to recognize as different from CPG-partner inbound.',
      openingHook:
        'Reverse logistics on a private-fleet network with owned-manufacturing inbound is not a return-flow afterthought — it is a structured fourth inbound pattern competing for the same dock surface, and the cadence is materially different from CPG-partner cycle. The operating-model layer above the regional DCs is what makes that fourth pattern visible.',
      stakeStatement:
        'Returns and reverse moves are the easiest part of the yard to under-instrument and the place where unrecovered private-fleet asset hours quietly accumulate. The Houston expansion and the eCommerce-fulfillment ramp add reverse complexity, not just forward throughput.',

      heroOverride: {
        headline: 'Reverse logistics as a fourth inbound flow at the H-E-B regional DCs.',
        subheadline:
          'Empty-trailer staging, returns, recall handling, and cross-dock back to H-E-B-owned plants run on a cadence different from the three forward inbound flows. The operating-model layer above the regional DCs is what makes it visible.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator register, concise. Lead with the reverse-flow shape and the fourth-flow framing; do not overclaim on Dakota\'s specific reverse-logistics mandate.',
      kpiLanguage: [
        'reverse-logistics flow as a fourth inbound pattern',
        'empty-trailer staging and recovery cycle',
        'recall and return cadence at the regional DCs',
        'private-fleet asset-hour recovery',
        'eCommerce-fulfillment reverse loop',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — refillable-format reverse logistics is a structured fourth flow at their bottling plants, resolved inside the same network operating model.',
    },
    {
      person: {
        personaId: 'P-044',
        name: 'Jeffrey Matthews',
        firstName: 'Jeffrey',
        lastName: 'Matthews',
        title: 'Operations & Supply Chain Leader',
        company: 'H-E-B',
        email: 'jeffrey.matthews@heb.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'Jeffrey Matthews - Operations & Supply Chain Leader',
      variantSlug: 'jeffrey-matthews',

      framingNarrative:
        'Jeffrey, the operating-system thinking that built H-E-B\'s reputation in distribution is the same thinking that turns site-level dock execution into a network operating model. Vertical-integration depth means own-manufacturing inbound, CPG-partner inbound, and import inbound all meet at the same dock infrastructure with three different priority logics and three different downstream costs of error. The operating-model layer above the regional DCs is the wedge that arbitrates all three on one rule set; the Houston expansion is the timing accelerant.',
      openingHook:
        'The three-flow arbitration problem at an H-E-B regional DC has no analog at a mainstream public-grocer peer — more of the value chain is H-E-B, which means more of the downstream cost of yard variance is borne inside the enterprise rather than absorbed by a third-party shipper. The Hempstead campus is the cleanest greenfield embed; the existing Houston DC is the highest-throughput pressure point.',
      stakeStatement:
        'Modernizing the buildings without modernizing the yard layer above the sites moves the throughput constraint from the warehouse to the gatehouse. The Hempstead campus is in flight; the eCommerce fulfillment ramp is in flight; private-label SKU depth multiplies the receiving-slot decisions per dock door per shift.',

      heroOverride: {
        headline: 'Three-flow dock arbitration at vertically-integrated DCs is the H-E-B operating-model wedge.',
        subheadline:
          'Own-manufacturing inbound, CPG-partner inbound, and import inbound meet at the same dock surface. Vertical integration makes the downstream cost of variance asymmetric; the Houston expansion is the timing accelerant; the operating-model layer above the regional DCs is the wedge.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Network-operator framing. H-E-B operating culture rewards memos that take the operating layer seriously without overclaiming what is not publicly known. Acknowledge vertical-integration asymmetry explicitly and treat private-label SKU depth as the multiplier on receiving complexity, not as a marketing flex.',
      kpiLanguage: [
        'three-flow dock arbitration (own-mfg + CPG-partner + import)',
        'own-manufacturing inbound cadence from H-E-B-owned plants',
        'private-label SKU density per dock door per shift',
        'multi-temp dock surface (ambient + refrigerated + frozen)',
        'Houston throughput ramp into the Hempstead campus window',
        'cross-border HEB Mexico inbound coordination',
        'operating-model layer above the regional DCs',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — multi-source-inbound-into-shared-dock at scale, harder freight (water), already running the network-level operating model above site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
    {
      person: {
        personaId: 'P-045',
        name: 'Troy Shaw',
        firstName: 'Troy',
        lastName: 'Shaw',
        title: 'Supply Chain Strategy / Distribution Management / Transportation Planning',
        company: 'H-E-B',
        email: 'troy.shaw@heb.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Supply Chain / Strategy',
      },
      fallbackLane: 'ops',
      label: 'Troy Shaw - Supply Chain Strategy / Distribution / Transportation Planning',
      variantSlug: 'troy-shaw',

      framingNarrative:
        'Troy, strategy-and-planning at H-E-B sits on top of one of the structurally hardest yard problems in U.S. grocery — three inbound flow types meeting at the same dock surface (own-manufacturing from H-E-B-owned plants, CPG-partner on appointment cadence, import through Texas ports), with vertical-integration depth making the downstream cost of variance asymmetric, and a Houston expansion in flight that climbs throughput materially over an 18–36 month window. The operating-model layer above the regional DCs is the strategic artifact that turns those three flows into one coordinated cadence.',
      openingHook:
        'Strategic-planning seats at vertically-integrated grocers see the three-flow arbitration problem before operations seats can scope it — and they have the highest leverage on the next-generation yard-operating-model decision because the Hempstead campus design is being scoped now, not after it opens.',
      stakeStatement:
        'The Houston throughput ramp is the largest single-region throughput-add event the H-E-B network has run in years. Designing the yard-operating-model layer at the Hempstead campus before commissioning is materially cheaper than retrofitting it after; the strategic seat is the one that can lock that timing.',

      heroOverride: {
        headline: 'The strategic-planning seat for the next-generation H-E-B yard operating model.',
        subheadline:
          'Three-flow dock arbitration at vertically-integrated regional DCs, Houston throughput ramping into the Hempstead campus window, private-label SKU depth multiplying receiving-slot decisions. The operating-model layer above the regional DCs is the strategic wedge.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Strategy-and-planning register. Lead with the structural shape of the three-flow problem and the Hempstead-campus timing window; treat the operating-model layer as a design decision in flight rather than as a sales pitch.',
      kpiLanguage: [
        'three-flow dock arbitration as a strategic-planning artifact',
        'Hempstead campus yard-operating-model design',
        'Houston throughput ramp over 18–36 months',
        'private-label SKU depth versus receiving-slot density',
        'cross-border HEB Mexico inbound coordination',
        'operating-model layer above the regional DCs',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — strategic adoption of a network operating model above site-level yard systems, on harder freight than grocery. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '~430+ stores across Texas and northeastern Mexico under multiple banners (H-E-B core, Central Market, Mi Tienda, Joe V\'s Smart Shop, HEB Mexico). Texas-centered DC network anchored by the San Antonio Super Regional Grocery Warehouse (~1.6M sq ft, ~200 dock doors, opened 2020), Houston-area DCs plus a third Houston eCommerce fulfillment center (opened early 2025), Temple TX hub, and the new ~500-acre Hempstead TX distribution campus (multi-phase build starting late 2024). 13+ company-owned manufacturing plants (dairy, bakery, tortilla, meat-processing, ice cream, ready meals) feeding the DCs as a first-party inbound flow.',
    facilityTypes: [
      'Super Regional Grocery Warehouses (San Antonio)',
      'Regional Distribution Centers (Houston, Temple, plus the in-flight Hempstead campus)',
      'eCommerce Fulfillment Centers (three in Houston as of early 2025)',
      'Owned Manufacturing Plants (dairy, bakery, tortilla, meat-processing, ice cream, ready meals)',
      'Central Market specialty DCs',
    ],
    geographicSpread:
      'Texas-centered (HQ San Antonio TX) with northeastern Mexico via HEB Mexico (~70 stores). Cross-border freight flows through Laredo. Houston region is the active throughput-add window.',
    dailyTrailerMoves:
      'High-volume — San Antonio Super Regional alone outbounds ~180 trailers per day at steady state across ~200 dock doors holding ~17,000 grocery items. Network total scales with the multi-DC footprint and the Parkway Transport private-fleet outbound rhythm to the high-density Texas store cluster.',
    fleet: 'Parkway Transport private fleet (publicly cited as among the largest private grocery fleets in Texas)',
  },

  freight: {
    primaryModes: ['Truckload', 'Private Fleet (Parkway Transport)', 'LTL', 'Intermodal (Texas port inbound)', 'Cross-Border (HEB Mexico)'],
    avgLoadsPerDay:
      'High-volume — distributed across ambient (center-store, dry grocery), refrigerated (dairy, deli, fresh meat, produce), frozen (ice cream, frozen meals, frozen produce), and the private-label-heavy SKU mix across H-E-B core, Central Market, Mi Tienda, Joe V\'s, and Heritage Ranch brands.',
    specialRequirements: [
      'Three-flow inbound arbitration (own-manufacturing + CPG-partner + import)',
      'Multi-temperature dock surface (ambient + refrigerated + frozen)',
      'Cross-border inbound coordination (HEB Mexico through Laredo)',
      'Private-fleet outbound on a high-density Texas store-replenishment cadence',
      'eCommerce-fulfillment cadence at Houston facilities separate from store replenishment',
      'Private-label SKU density multiplying receiving-slot decisions',
    ],
  },

  signals: {
    eventAttendance: 'Industry conference attendee signal',
    recentNews: [
      'San Antonio Super Regional Grocery Warehouse (~1.6M sq ft, ~200 dock doors) anchors the Texas DC network and sets the operating-scale baseline for any subsequent yard-operating-model engagement.',
      'New ~500-acre Hempstead TX distribution campus acquired; multi-phase construction starting late 2024. Cleanest greenfield embed for a yard operating-model layer in the Houston-region throughput-add window.',
      'Third Houston eCommerce fulfillment center opened early 2025 (~100,000 sq ft); part of a broader Houston push that includes new store openings and the Hempstead campus. eCommerce cadence adds a fourth flow type at any DC that hosts both.',
      '13+ company-owned manufacturing plants (dairy, bakery, tortilla, meat-processing, ice cream, ready meals) feed the DCs as a first-party inbound flow distinct from CPG-partner inbound and import inbound.',
      'Privately-held since 1905, Butt family ownership, San Antonio HQ; consistently cited in trade press as the operator-respect benchmark in U.S. grocery.',
    ],
    supplyChainInitiatives: [
      'Houston region throughput add (Hempstead campus + existing Houston DC + eCommerce fulfillment ramp)',
      'Vertical-integration manufacturing footprint (13+ owned plants) feeding the DCs',
      'Multi-banner store growth (H-E-B core + Central Market + Mi Tienda + Joe V\'s)',
    ],
    urgencyDriver:
      'The three-flow inbound arbitration problem at H-E-B regional DCs (own-manufacturing + CPG-partner + import) is structurally harder than the single-flow shape at mainstream-grocer peers, and vertical-integration depth makes the downstream cost of yard variance asymmetric — yard delay compounds across more of the value chain because more of the value chain is H-E-B. The Houston expansion (existing Houston DC + new ~500-acre Hempstead campus + third eCommerce fulfillment center opened early 2025) is the timing accelerant: throughput is climbing materially over an 18–36 month window, and modernizing the buildings without modernizing the yard layer above the sites moves the throughput constraint from the warehouse to the gatehouse.',
  },

  theme: {
    accentColor: '#E1241A',
    backgroundVariant: 'dark',
  },
};
