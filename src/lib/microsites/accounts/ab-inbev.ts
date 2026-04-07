import type { AccountMicrositeData } from '../schema';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

export const abInbev: AccountMicrositeData = {
  slug: 'ab-inbev',
  accountName: 'AB InBev',
  parentBrand: 'Anheuser-Busch InBev',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 91,

  pageTitle: 'YardFlow for AB InBev - The Last Analog Frontier in Your Supply Chain',
  metaDescription: 'AB InBev achieved 85% touchless planning. The yard is the one surface your digital transformation has not reached.',

  sections: [
    {
      type: 'hero',
      headline: 'You achieved 85% touchless planning. But when that perfectly planned load arrives at the dock, what happens?',
      subheadline: 'Drivers wait. Trailers sit. The yard is the last analog frontier in AB InBev\'s supply chain. 12 breweries, 100+ facilities, 800+ trucks - and the dock still runs on radio calls.',
      accountCallout: '12 US breweries, 100+ facilities, 800+ truck fleet, 85% touchless demand planning',
      backgroundTheme: 'dark',
      cta: {
        type: 'meeting',
        headline: 'See the execution layer between o9 and Sensolus',
        subtext: '30-minute walk-through of your brewery network with board-ready ROI.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Gap in Your Transformation',
      headline: 'o9 plans the supply chain. Sensolus tracks the trailers. Who runs the dock?',
      narrative: 'AB InBev has invested heavily in planning (o9 Solutions) and asset tracking (Sensolus). But between a perfectly planned load and a tracked trailer, there is a 48-minute gap at the dock door. That gap runs on clipboard processes and radio calls from the 1990s. It is the one surface your digital transformation has not touched.',
      painPoints: [
        {
          headline: 'The Sensolus gap',
          description: 'Sensolus tells you where the trailer is. It does not move the trailer faster through the dock. You optimized trailer fleet usage by 15% in 4 months. Now imagine optimizing the dock turn itself by 50%.',
          kpiImpact: 'Sensolus: 15% fleet optimization. YardFlow: 50% dock turn reduction.',
          source: 'Sensolus partnership results, European deployment',
          relevantPeople: ['abi-siqueira', 'abi-moreira'],
        },
        {
          headline: 'Night loading for morning delivery',
          description: 'Route trucks loaded nightly for DSD morning delivery. The dock window is tight. There is no room for congestion. When a trailer misses its slot by 20 minutes, the morning delivery route slips.',
          kpiImpact: 'Missed loading windows cascade to 80+ delivery routes per facility',
          relevantPeople: ['abi-siqueira', 'abi-moreira'],
        },
        {
          headline: 'Summer peak + Super Bowl surge',
          description: 'Memorial Day through Labor Day drives 30-50% volume spikes. Super Bowl week is the single biggest delivery event. Yards designed for average throughput collapse during peak.',
          kpiImpact: '30-50% volume spike during summer peak',
          relevantPeople: ['abi-siqueira', 'abi-moreira'],
        },
        {
          headline: 'Mixed fleet chaos',
          description: '800+ owned trucks, third-party carriers, wholesaler trucks - three different fleets converging on the same dock doors. Add 200+ zero-emission vehicles with charging schedules and the yard becomes a scheduling nightmare.',
          kpiImpact: '3 fleet types competing for dock doors',
          relevantPeople: ['abi-siqueira', 'abi-moreira'],
        },
        {
          headline: 'M&A integration fragmentation',
          description: 'SABMiller (2016), Grupo Modelo, and years of acquisitions created fragmented yard processes. Different breweries run different protocols. Standardization is Elito\'s mandate - the yard is the last holdout.',
          source: 'SABMiller acquisition 2016',
          relevantPeople: ['abi-siqueira', 'abi-moreira'],
        },
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What the Yard Costs You',
      headline: 'The math your o9 dashboard does not show',
      narrative: 'o9 tracks supply chain KPIs at the planning level. Sensolus tracks fleet utilization. Nobody tracks the 48 minutes a trailer sits at the dock between arrival and unload. Across 12 breweries and 100+ facilities, that time adds up to millions.',
      annualCost: '$25M+ estimated in yard-driven inefficiency across the North America network',
      costBreakdown: [
        { label: 'Dock dwell and turn time excess', value: '$10M+' },
        { label: 'Night loading schedule slippage', value: '$5M+' },
        { label: 'Peak season surge inefficiency', value: '$5M+' },
        { label: 'EV fleet idle time at dock (growing)', value: '$3M+' },
        { label: 'Multi-fleet coordination overhead', value: '$2M+' },
      ],
      urgencyDriver: 'AB InBev invested $2B in US facilities over 5 years. The yards were not part of that investment. The EV fleet transition makes yard optimization urgent - EVs need predictable dock times for charging schedules.',
    },
    {
      type: 'solution',
      sectionLabel: 'The Execution Layer',
      headline: 'The layer between o9 planning and Sensolus tracking',
      narrative: 'YardFlow sits between your planning platform and your asset tracking. o9 says what should move. Sensolus says where it is. YardFlow makes it move faster through the dock. One protocol across 12 breweries. Same driver journey, same dock assignment logic, same evidence trail.',
      modules: [
        { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID.', relevanceToAccount: 'Standardizes gate process across 12 breweries and 100+ distribution points.' },
        { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter task queues with priority logic.', relevanceToAccount: 'Replaces radio dispatch. Critical for night loading sequence and EV priority.' },
        { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location and dwell.', relevanceToAccount: 'Complements Sensolus asset tracking with operational intelligence - not just where, but how fast.' },
        { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view.', relevanceToAccount: 'Gives Elito the yard-level visibility he has for planning (via o9) but has never had for execution.' },
      ],
      accountFit: 'AB InBev already bought yard tech (Sensolus for trailer tracking). YardFlow is complementary, not competitive. Sensolus = where are my trailers. YardFlow = how do I move them faster through the dock. Together they close the yard gap.',
    },
    {
      type: 'proof',
      sectionLabel: 'Running in Production',
      headline: 'Measured results from live deployment',
      proofVisual: {
        type: 'comparison',
        headline: 'Where YardFlow closes the execution gap',
        narrative: 'o9 plans the load. Sensolus knows where the trailer is. YardFlow governs what happens between arrival, staging, dock assignment, and release so the dock no longer depends on radio dispatch and tribal knowledge.',
        comparisonLabel: 'Planning and tracking still leave one unowned layer',
        comparisonData: [
          { metric: 'Supply chain layer', competitor: 'o9: demand and load planning', yardflow: 'YardFlow: dock and yard execution' },
          { metric: 'Trailer visibility', competitor: 'Sensolus: asset location', yardflow: 'YardFlow: move priority, dwell, dock readiness' },
          { metric: 'Operational outcome', competitor: 'Tracked load, manual handoff', yardflow: '48-to-24 minute dock turn with one protocol' },
        ],
      },
      liveDeployment: {
        headline: 'Proven before the beer peak hits',
        summary: 'This deployment pattern is already live in high-volume CPG and beverage-style operations where dock offices absorb additional throughput without adding coordination headcount. That is the exact gap between AB InBev planning and execution today.',
        badges: ['24 facilities live', '48-to-24 min turn time', '30 min remote deployment'],
      },
      methodology: 'Benchmarks pair AB InBev\'s published Sensolus fleet gains with measured YardFlow dock-turn improvements in comparable live deployments.',
      blocks: [
        {
          type: 'metric',
          stats: [
            { value: '24', label: 'Facilities Live' },
            { value: '>200', label: 'Contracted Network' },
            { value: '48-to-24', label: 'Min Truck Turn Time' },
            { value: '$1M+', label: 'Per-Site Profit Impact' },
            { value: '30 min', label: 'Remote Deployment' },
          ],
        },
        {
          type: 'quote',
          quote: {
            text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
            role: 'Operations Director',
            company: 'National CPG Manufacturer',
          },
        },
      ],
    },
    {
      type: 'network-map',
      sectionLabel: 'Your Brewery Network',
      headline: 'AB InBev North America yard footprint',
      narrative: 'Twelve breweries. Seventeen company-owned distributorships. One hundred-plus total facilities. The yard protocol at each one is different - a legacy of M&A integration. YardFlow gives the network one standard.',
      facilityCount: '100+',
      facilityTypes: ['Breweries (12)', 'ABOne Distributors (17)', 'Agricultural/Packaging (23)', 'Distribution Centers'],
      geographicSpread: 'CA, NY, GA, TX, NJ, VA, MO, AZ, PA, CO, FL, OH',
      dailyTrailerMoves: '5,000+ across the brewery network',
      peakMultiplier: '1.5x during summer (Memorial Day-Labor Day)',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'ROI for AB InBev North America',
      narrative: 'Based on measured YardFlow improvements and AB InBev\'s own Sensolus results as a baseline.',
      roiLines: [
        { label: 'Avg dock turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'Trailer fleet utilization', before: '+15% (Sensolus)', after: '+50% (YardFlow + Sensolus)', delta: '3.3x improvement', unit: 'efficiency' },
        { label: 'Night loading schedule adherence', before: '~80%', after: '95%+', delta: '+15 pts', unit: 'on-time %' },
        { label: 'EV fleet dock priority', before: 'Manual', after: 'Automated', delta: 'EV-ready yard', unit: 'capability' },
        { label: 'Annual network savings', before: '$0 (not tracked)', after: '$15M+', delta: '+$15M', unit: 'annual' },
      ],
      totalAnnualSavings: '$15M+ across brewery network, $25M+ including distribution',
      paybackPeriod: '< 3 months per brewery',
      methodology: 'Sensolus 15% optimization used as baseline. YardFlow measured 50% dock turn improvement at comparable beverage operations. Conservative estimate across 12 breweries.',
    },
    {
      type: 'testimonial',
      sectionLabel: 'From Operations',
      quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
      role: 'Operations Director',
      company: 'National Beverage Distributor',
    },
    {
      type: 'cta',
      cta: {
        type: 'modex-meeting',
        headline: 'Your Cartersville brewery is 90 minutes from MODEX. Let\'s talk.',
        subtext: '30-minute walk through your brewery network ROI. The yard is the last analog frontier.',
        buttonLabel: 'Book a Meeting at MODEX',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'You got planning to 85% touchless. The yard is the next 15%. Let\'s talk at MODEX.',
    },
  ],

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'abi-siqueira',
      name: 'Elito Siqueira',
      firstName: 'Elito',
      lastName: 'Siqueira',
      title: 'Chief Supply Chain & Distribution Co. Officer, North America',
      company: 'Anheuser-Busch InBev',
      email: 'elito.siqueira@ab-inbev.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain & Distribution',
      reportsTo: 'CEO Michel Doukeris (via NA leadership)',

      careerHistory: [
        { period: '~1998-present', role: 'Multiple roles spanning 28 years', company: 'AB InBev', relevance: 'Entire career at AB InBev. Understands every layer of the operation.' },
        { period: 'Early career', role: 'Logistics Director, Asia Pacific', company: 'AB InBev', relevance: 'Deep logistics foundation - started in the physical operations.' },
        { period: 'Mid career', role: 'Global SVP Supply Chain Planning', company: 'AB InBev', relevance: 'Led the o9 planning transformation that achieved 85% touchless.' },
        { period: 'Current', role: 'Chief Supply Chain & Distribution Co. Officer, North America', company: 'AB InBev', relevance: 'Top supply chain role for US. Owns 12 breweries, 100+ facilities, 800+ trucks. Can make the decision.' },
      ],
      yearsAtCompany: '28+',
      knownForPhrase: 'Touchless planning champion - automation-first approach to supply chain',

      currentMandate: 'Supply chain complexity reduction, digital transformation, sustainability/EV fleet transition',
      strategicPriorities: [
        'Touchless planning (85% achieved in demand planning)',
        'M&A integration and process standardization',
        'Fleet electrification (200+ EVs, Nikola/BYD partnerships)',
        'End-to-end supply chain visibility',
      ],
      knownPainPoints: [
        'Sensolus deployed in Europe for yard management but unclear if in North America yet',
        'Night loading for morning DSD delivery - tight dock windows',
        'Mixed fleet (owned + 3PL + wholesaler) yard coordination',
        'M&A fragmentation - different breweries run different yard protocols',
        'EV charging schedules need predictable dock times',
      ],

      publicQuotes: [
        {
          text: 'Our supply chain KPIs are at an all-time high.',
          context: 'Aim10x Digital 2024 keynote on planning transformation',
          source: 'Aim10x Digital 2024',
          relevanceToYardFlow: 'He is proud of what he has built. The pitch needs to be: you achieved this in planning, the yard is the next frontier.',
        },
        {
          text: 'The focus is on touchless planning - automation-first approach to demand planning.',
          context: 'Consumer Goods Technology interview on AB InBev supply chain',
          source: 'Consumer Goods Technology',
          relevanceToYardFlow: 'His philosophy is automation-first. YardFlow aligns perfectly - automating the last manual process.',
        },
      ],

      communicationStyle: 'Transformation executive. Data-driven but operationally grounded (started in logistics). Speak in transformation language - he sees himself as a change agent. Reference his own work to show you did the homework.',
      languagePreferences: ['touchless', 'automation', 'transformation', 'complexity reduction', 'end-to-end', 'standardization'],
      kpiLanguage: ['touchless %', 'dock turn time', 'fleet utilization', 'schedule adherence', 'KPIs at all-time high'],
      connectionHooks: [
        'Reference his Aim10x talks (2024 and 2025) to show you follow his work',
        'Ask about Sensolus deployment in North America - opens the yard conversation',
        'ABOne network (owned wholesalers) is the easiest pilot footprint',
        'EV fleet needs predictable dock times - ties to sustainability mandate',
        'Cartersville, GA brewery is 90 minutes from MODEX',
      ],
      modexProximity: 'Cartersville, GA brewery is 90 min from MODEX venue. AB InBev is a major CPG/beverage co with likely MODEX attendance.',
    },
    {
      personaId: 'abi-moreira',
      name: 'Ricardo Moreira',
      firstName: 'Ricardo',
      lastName: 'Moreira',
      title: 'Chief Supply Officer',
      company: 'Anheuser-Busch InBev',
      email: 'ricardo.moreira@ab-inbev.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply / Logistics / Procurement',
      reportsTo: 'CEO Michel Doukeris',

      careerHistory: [
        { period: '1995-present', role: 'Multiple leadership roles across Ambev and AB InBev', company: 'AB InBev / Ambev', relevance: 'Nearly three decades inside the operating system he now needs to standardize globally.' },
        { period: '2001-2012', role: 'Regional Sales Director; VP Logistics & Procurement, Latin America North', company: 'AB InBev / Ambev', relevance: 'Direct logistics and procurement background before the global supply seat.' },
        { period: '2013-2018', role: 'Led Sales, Marketing, and Distribution in Mexico', company: 'AB InBev', relevance: 'Owned the Grupo Modelo commercial integration and knows the reality of post-M&A standardization.' },
        { period: '2019-2023', role: 'CEO, Africa Zone', company: 'AB InBev', relevance: 'Ran a major operating zone before moving into the enterprise supply role.' },
        { period: 'Current', role: 'Chief Supply Officer', company: 'AB InBev', relevance: 'Owns the global supply agenda spanning logistics, procurement, and execution discipline.' },
      ],
      yearsAtCompany: '29+',

      currentMandate: 'Global supply standardization across procurement, logistics, and distribution execution',
      strategicPriorities: [
        'Cross-network supply standardization',
        'Procurement and logistics coordination',
        'Post-integration operating discipline',
        'Reducing site-to-site execution variance',
      ],
      knownPainPoints: [
        'Planning and tracking systems are standardized faster than dock execution protocols',
        'M&A-driven process variance still shows up site by site in brewery yards',
        'Distribution complexity between breweries, wholesalers, and mixed fleets',
        'Need to translate global supply standards into repeatable site-level execution',
      ],

      publicQuotes: [
        {
          text: 'I am excited to collaborate with colleagues and partners from around the world.',
          context: 'Public comments on taking the Chief Supply Officer role',
          source: 'Procurement Magazine, March 2024',
          relevanceToYardFlow: 'He is entering the role as a global standardizer and collaborator. YardFlow should be framed as execution discipline, not another point tool.',
        },
      ],

      communicationStyle: 'Global supply executive with logistics and procurement depth. Lead with standardization, integration, and execution discipline rather than local site heroics.',
      languagePreferences: ['standardization', 'collaboration', 'supply', 'logistics', 'procurement', 'execution discipline'],
      kpiLanguage: ['dock turn time', 'network standardization', 'schedule adherence', 'fleet utilization', 'site-to-site variance'],
      connectionHooks: [
        'Reference his January 2024 move into the Chief Supply Officer role',
        'Tie YardFlow to the same integration muscle he used after Grupo Modelo',
        'Position the yard as the least standardized execution layer between breweries and wholesalers',
      ],
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'abi-siqueira',
        name: 'Elito Siqueira',
        firstName: 'Elito',
        lastName: 'Siqueira',
        title: 'Chief Supply Chain & Distribution Co. Officer, North America',
        company: 'Anheuser-Busch InBev',
        email: 'elito.siqueira@ab-inbev.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain & Distribution',
      },
      fallbackLane: 'executive',
      label: 'Elito Siqueira - CSCO NA',
      variantSlug: 'elito-siqueira',

      framingNarrative: 'Elito, you have spent five years building the most advanced planning operation in the beverage industry. 85% touchless demand planning. KPIs at all-time highs. But when that perfectly planned load arrives at the Cartersville dock, the driver gets out, walks to a window, and waits for someone with a clipboard. The yard is the last analog frontier in your digital transformation.',
      openingHook: 'You achieved 85% touchless planning. The dock still runs on radio calls.',
      stakeStatement: 'You deployed Sensolus in Europe and got 15% trailer fleet optimization in 4 months. YardFlow delivers 3x that impact on dock turns - and it bridges the gap between o9 planning and Sensolus tracking that nobody else fills.',

      heroOverride: {
        headline: 'Elito, you got planning to 85% touchless. The yard is the last analog frontier.',
        subheadline: 'You deployed Sensolus for trailer tracking. You built the o9 planning transformation. But between a perfectly planned load and a tracked trailer, there is a 48-minute gap at the dock door. YardFlow closes it.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'solution', 'proof', 'network-map', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Elito, your Cartersville brewery is 90 minutes from MODEX.',
        subtext: '30 minutes on what touchless yard operations look like. The ABOne network is the perfect pilot.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Elito',
        personContext: 'touchless yard operations for the AB InBev North America network',
      },

      toneShift: 'He is a transformation leader who sees himself as a change agent. He has public talks and case studies to reference. Mirror his own language (touchless, complexity reduction, transformation) and position YardFlow as the next chapter of the story he has been telling publicly for 5 years. Do not sell him - invite him to extend his own narrative.',
      kpiLanguage: ['touchless yard %', 'dock turn time', 'fleet utilization', 'schedule adherence', 'KPIs at all-time high', 'complexity reduction'],
      proofEmphasis: 'Lead with Sensolus comparison: they got 15% trailer fleet optimization, YardFlow delivers 50% dock turn reduction. He is already a buyer of yard tech. The deployment comparison is the hook. Also reference the o9 positioning: planning (o9) + tracking (Sensolus) + execution (YardFlow) = end-to-end.',
    },
    {
      person: {
        personaId: 'abi-moreira',
        name: 'Ricardo Moreira',
        firstName: 'Ricardo',
        lastName: 'Moreira',
        title: 'Chief Supply Officer',
        company: 'Anheuser-Busch InBev',
        email: 'ricardo.moreira@ab-inbev.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply / Logistics / Procurement',
      },
      fallbackLane: 'executive',
      label: 'Ricardo Moreira - Chief Supply Officer',
      variantSlug: 'ricardo-moreira',

      framingNarrative: 'Ricardo, you took the Chief Supply Officer role after leading Africa Zone and earlier integrating Grupo Modelo. You have already standardized procurement, logistics, and distribution across acquisitions and geographies. The yard is still the least standardized execution layer in the AB InBev system. It is where the same planned load, tracked trailer, and dock process still vary site by site.',
      openingHook: 'You own global supply now. The yard is still a local workaround.',
      stakeStatement: 'AB InBev standardized planning with o9 and asset visibility with Sensolus. But dock execution still changes brewery by brewery. That site-level variance is exactly the kind of supply friction a Chief Supply Officer is supposed to eliminate.',

      heroOverride: {
        headline: 'Ricardo, the supply network is standardized on paper. The yard still varies by site.',
        subheadline: 'You have led logistics, procurement, distribution, and post-acquisition integration across AB InBev. YardFlow gives you one execution protocol between brewery, wholesaler, and fleet so the dock no longer depends on local workarounds.',
      },
      sectionOrder: ['hero', 'problem', 'proof', 'solution', 'network-map', 'roi', 'cta'],
      ctaOverride: {
        type: 'meeting',
        headline: 'Ricardo, let\'s compare global standards to yard reality.',
        subtext: '30 minutes on where dock execution is still creating site-to-site variance across breweries and ABOne distribution.',
        buttonLabel: 'Book a Supply Review',
        calendarLink: BOOKING_LINK,
        personName: 'Ricardo',
        personContext: 'global supply standardization across brewery and ABOne yards',
      },
      sectionOverrides: [
        {
          sectionType: 'solution',
          override: {
            accountFit: 'Ricardo already owns logistics, procurement, and cross-network operating discipline at the enterprise level. YardFlow gives the Chief Supply Officer one execution standard across breweries and ABOne distribution, not another disconnected visibility tool.',
          },
        },
      ],

      toneShift: 'He is a global supply executive with logistics and procurement depth. Do not make this a plant-manager conversation. Speak to standardization, integration, and operating discipline across zones.',
      kpiLanguage: ['network standardization', 'dock turn time', 'site variance', 'schedule adherence', 'fleet utilization', 'execution discipline'],
      proofEmphasis: 'Lead with cross-network repeatability. YardFlow is not another visibility layer. It is the operating protocol that makes o9 planning and Sensolus tracking behave the same way from brewery to brewery.',
    },
  ],

  genericVariants: [],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live' },
        { value: '>200', label: 'Contracted Network' },
        { value: '48-to-24', label: 'Min Truck Turn Time' },
        { value: '$1M+', label: 'Per-Site Profit Impact' },
      ],
    },
  ],

  network: {
    facilityCount: '100+',
    facilityTypes: ['Breweries (12)', 'ABOne Distributors (17)', 'Agricultural/Packaging (23)', 'Distribution Centers'],
    geographicSpread: 'CA, NY, GA, TX, NJ, VA, MO, AZ, PA, CO, FL, OH',
    dailyTrailerMoves: '5,000+ across the brewery network',
    peakMultiplier: '1.5x during summer (Memorial Day-Labor Day)',
    fleet: '800+ trucks, 200+ zero-emission vehicles',
    keyFacilities: [
      { name: 'Cartersville Brewery', location: 'Cartersville, GA', type: 'Brewery', significance: '90 minutes from MODEX venue', yardRelevance: 'Closest brewery to MODEX. Natural pilot site for post-conference deployment.' },
      { name: 'ABOne Distributorships', location: '17 locations nationwide', type: 'Distribution', significance: 'Company-owned wholesalers, 40,000+ customers', yardRelevance: 'Owned distribution = easiest pilot footprint (no franchise negotiation needed)' },
      { name: 'Fort Collins Brewery', location: 'Fort Collins, CO', type: 'Brewery', significance: 'Major production facility', yardRelevance: 'High-volume brewery with complex dock scheduling' },
      { name: 'Newark Brewery', location: 'Newark, NJ', type: 'Brewery', significance: 'Northeast hub', yardRelevance: 'Dense metro delivery routes = tight night loading windows' },
    ],
  },

  freight: {
    primaryModes: ['Dedicated Fleet', 'DSD', '3PL'],
    avgLoadsPerDay: '5,000+',
    peakSeason: 'Summer (Memorial Day-Labor Day), Super Bowl week, 4th of July',
    keyRoutes: ['Brewery to wholesaler', 'ABOne to retail (DSD)', 'Agricultural inputs to brewery'],
    detentionCost: 'Not publicly disclosed but estimated $15M+ based on fleet scale',
    specialRequirements: [
      'Night loading for morning DSD delivery',
      'Temperature-sensitive (not refrigerated but heat-sensitive)',
      'EV charging schedule integration (200+ EVs)',
      'Mixed fleet coordination (owned + 3PL + wholesaler)',
      'High SKU count (500+ brands) requires complex loading/staging',
    ],
  },

  signals: {
    modexAttendance: 'Major CPG/beverage company. Supply chain technology is stated priority. Cartersville brewery 90 min from venue.',
    recentNews: [
      'o9 Solutions partnership achieving 85% touchless demand planning',
      'Sensolus partnership for IoT-based yard management and trailer tracking (Europe)',
      'Fleet electrification: 200+ EVs operating, Nikola/BYD partnerships',
      '$2B invested in US facilities over 5 years',
      'Aim10x 2024/2025: Elito keynotes on supply chain transformation',
      'Dispatch automation reduced late deliveries by 80%',
    ],
    supplyChainInitiatives: [
      'Touchless planning (o9)',
      'Yard management (Sensolus - Europe)',
      'Fleet electrification',
      'Dispatch automation',
      'M&A integration standardization',
    ],
    urgencyDriver: 'Already bought yard tech (Sensolus). EV fleet needs predictable dock times. Summer 2026 peak is 2 months after MODEX. Elito is a public transformation champion who needs the next win for Aim10x 2027.',
  },

  theme: {
    accentColor: '#004B87',
    backgroundVariant: 'dark',
  },
};
