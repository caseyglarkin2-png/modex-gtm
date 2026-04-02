import type { AccountMicrositeData } from '../schema';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

export const generalMills: AccountMicrositeData = {
  slug: 'general-mills',
  accountName: 'General Mills',
  parentBrand: 'General Mills, Inc.',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'B',
  priorityScore: 88,

  pageTitle: 'YardFlow for General Mills - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across General Mills\' 50+ manufacturing and distribution facilities.',

  sections: [
    {
      type: 'hero',
      headline: 'You closed 3 plants. The remaining facilities just absorbed all that volume. Your yards were not designed for this.',
      subheadline: 'General Mills is consolidating production into fewer, higher-throughput facilities. The $82M restructuring makes the plants more competitive. YardFlow makes the yards keep pace.',
      accountCallout: '50+ manufacturing facilities, 18,000 supply chain employees, 4 temperature zones',
      backgroundTheme: 'dark',
      cta: {
        type: 'meeting',
        headline: 'See what a standardized yard network looks like for General Mills',
        subtext: '30-minute walk-through of your facility network with board-ready ROI.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Hidden Constraint',
      headline: 'The yard is where your consolidation math breaks down',
      narrative: 'When you move volume from 3 closing Missouri plants into remaining facilities, every trailer metric gets worse at the receiving end. Longer queues. More dock contention. More temperature-zone conflicts. The plant floor got the $82M investment. The yard got the overflow.',
      painPoints: [
        {
          headline: 'Facility consolidation = yard congestion',
          description: 'Closing 3 Missouri plants means remaining facilities absorb more volume. More trailers in the yard, longer dock queues, greater scheduling complexity, higher demurrage.',
          kpiImpact: 'Remaining facilities handling 15-25% more trailer volume',
          source: 'Oct 2025 restructuring announcement, $82M charges',
          relevantPeople: ['gm-gallagher', 'gm-ness'],
        },
        {
          headline: 'Four temperature zones, one yard',
          description: 'Cheerios (ambient), Pillsbury (frozen), Haagen-Dazs (ultra-cold), Yoplait (refrigerated) all compete for dock doors at multi-category facilities. A trailer left sitting in summer heat with ice cream inside is a quality event.',
          kpiImpact: 'Temperature-zone dock conflicts at every multi-category facility',
          relevantPeople: ['gm-underwood', 'gm-bracey'],
        },
        {
          headline: 'Seasonal demand spikes compound the problem',
          description: 'Baking season (Oct-Dec) drives 30-50% throughput surges. Snack season follows. Pet food is steady but high volume. Every spike hits the yard before it hits the production line.',
          kpiImpact: '30-50% volume surges at key facilities during peak',
          relevantPeople: ['gm-bracey', 'gm-stolpestad'],
        },
        {
          headline: 'Carrier satisfaction at risk',
          description: 'General Mills relies on contract carriers, not owned fleet. Drivers who experience long wait times deprioritize your loads when capacity tightens. In a driver-shortage environment, yard efficiency is carrier relationship management.',
          kpiImpact: 'Carrier deprioritization during tight capacity markets',
          relevantPeople: ['gm-ahsanullah', 'gm-bracey'],
        },
        {
          headline: 'New Belvidere DC needs it from day one',
          description: 'The state-of-the-art Belvidere, IL distribution center opened April 2024 as a Midwest hub. New facility, new yard operations, no legacy processes to unlearn. The perfect greenfield deployment.',
          source: 'April 2024 facility opening',
          relevantPeople: ['gm-ness', 'gm-stolpestad'],
        },
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What This Costs You',
      headline: 'The math General Mills is not tracking in one place',
      narrative: 'Paul Gallagher\'s HMM program drove gross margin up 230 basis points. That margin expansion is partially eaten by yard inefficiency that sits across 12+ GL codes. Detention, dwell, gate labor, dock contention, temperature-zone misrouting. It adds up to a number that would get board attention if it were visible.',
      annualCost: '$10M-$15M in estimated yard-driven inefficiency across the network',
      costBreakdown: [
        { label: 'Carrier detention / demurrage', value: '$4M+' },
        { label: 'Dock contention (temp-zone conflicts)', value: '$3M+' },
        { label: 'Gate and spotter labor overhead', value: '$2M+' },
        { label: 'Seasonal surge inefficiency', value: '$2M+' },
      ],
      urgencyDriver: 'Missouri plant closures phasing through 2026. Remaining facilities absorbing more volume right now.',
    },
    {
      type: 'solution',
      sectionLabel: 'The Fix',
      headline: 'One protocol across every General Mills yard',
      narrative: 'YardFlow replaces the patchwork of local yard practices with a single standardized operating protocol. The same driver journey at Belvidere that runs at Cedar Rapids. The same dock assignment logic at Covington that runs at Hannibal. Variance dies. Throughput becomes calculable.',
      modules: [
        { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID verification, algorithmic lane direction.', relevanceToAccount: 'Standardizes the gate process across 50+ facilities that today all do it differently.' },
        { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter app for move execution and task queues. No more radio dispatching.', relevanceToAccount: 'Eliminates temperature-zone dock assignment errors. Frozen goes to frozen. Every time.' },
        { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location, dwell, and lane state.', relevanceToAccount: 'Complements General Mills\' Palantir digital twin - extends supply chain visibility to the yard surface.' },
        { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view with alerting and cross-site performance intelligence.', relevanceToAccount: 'Gives the supply chain team visibility across all 50+ yard operations. One screen.' },
      ],
      accountFit: 'General Mills already built a Palantir digital twin for supply chain visibility. YardFlow fills the gap at the physical execution layer - the yard - where the digital twin has no eyes.',
    },
    {
      type: 'proof',
      sectionLabel: 'Proof from Live Deployment',
      headline: 'Running today across 24 facilities',
      blocks: [
        {
          type: 'metric',
          stats: [
            { value: '24', label: 'Facilities Live', context: 'Running the full YardFlow protocol today' },
            { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout' },
            { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
            { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured across live deployments' },
            { value: '30 min', label: 'Remote Deployment', context: 'From zero to live at a new facility' },
          ],
        },
        {
          type: 'quote',
          quote: {
            text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office. That was an integral part of our strategy and has been proven.',
            role: 'Operations Director',
            company: 'National CPG Manufacturer',
          },
        },
      ],
    },
    {
      type: 'network-map',
      sectionLabel: 'Your Network',
      headline: 'General Mills\' yard network at scale',
      narrative: 'Every one of these facilities runs its own yard protocol today. Different gate processes, different spotter dispatch methods, different tribal knowledge. The Belvidere DC opened with a clean slate. The Cedar Rapids plant has had the same gate process for 20 years. YardFlow gives you one standard across all of them.',
      facilityCount: '50+',
      facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Co-packing Facilities'],
      geographicSpread: 'US, Canada, and select international - Cedar Rapids IA, Buffalo NY, Wellston OH, Murfreesboro TN, Covington GA, Hannibal MO, Joplin MO, Belvidere IL',
      dailyTrailerMoves: '5,000+ across the network',
      peakMultiplier: '1.3-1.5x during baking season (Oct-Dec)',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'Conservative ROI model for General Mills',
      narrative: 'Based on 50 facilities, current industry-average turn times, and measured YardFlow improvements at comparable CPG sites.',
      roiLines: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'Carrier detention per facility', before: '$80K/yr', after: '$40K/yr', delta: '-$40K', unit: 'per site' },
        { label: 'Temp-zone dock errors', before: '3-5/week', after: '<1/week', delta: '-80%', unit: 'per facility' },
        { label: 'Gate labor per facility', before: '2.5 FTE', after: '1.5 FTE', delta: '-1 FTE', unit: 'per site' },
      ],
      totalAnnualSavings: '$10M-$15M across the network',
      paybackPeriod: '< 6 months',
      methodology: 'Based on measured results at 24 live CPG facilities extrapolated to General Mills facility count and operational profile.',
    },
    {
      type: 'testimonial',
      sectionLabel: 'From an Operator Who Runs It',
      quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
      role: 'Operations Director',
      company: 'National CPG Manufacturer',
      context: 'After 12 months of full YardFlow deployment across their facility network.',
    },
    {
      type: 'cta',
      cta: {
        type: 'meeting',
        headline: 'See what a standardized yard network looks like for General Mills',
        subtext: 'We map your top 3 facilities, identify the throughput constraint, and build a board-ready rollout plan.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'One conversation. Your yard network. A clear path to $10M+ in annual savings.',
    },
  ],

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'gm-gallagher',
      name: 'Paul Gallagher',
      firstName: 'Paul',
      lastName: 'Gallagher',
      title: 'Chief Supply Chain Officer',
      company: 'General Mills',
      email: 'paul.gallagher@genmills.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      reportsTo: 'CEO',
      directReports: '18,000 supply chain employees',

      careerHistory: [
        { period: '2021-present', role: 'Chief Supply Chain Officer', company: 'General Mills', relevance: 'Owns the entire supply chain org including all yard operations across 50+ facilities.' },
        { period: '2019-2021', role: 'VP, North America Supply Chain', company: 'General Mills' },
        { period: '2013-2019', role: 'President, North America Supply', company: 'Diageo', relevance: 'Ran beverage/spirits supply chains - high-complexity, regulated, multi-temp. Diageo is also a target account.' },
      ],
      yearsInRole: '5+',
      previousCompanies: ['Diageo'],
      knownForPhrase: 'People-first operator credited with record cost savings while maintaining service levels',

      currentMandate: 'Driving digital transformation and cost savings across 50+ facilities, $82M restructuring program',
      strategicPriorities: ['Digital transformation', 'Cost savings via HMM', 'Facility consolidation', 'Sustainability (Scope 3)'],
      operationalPhilosophy: 'Run, Improve, and Transform',
      knownPainPoints: [
        'Facility consolidation pushing more volume through fewer sites',
        'Multi-temperature logistics across 4 zones',
        'Seasonal demand spikes (30-50%)',
        'Blue Buffalo integration complexity',
      ],
      publicQuotes: [
        {
          text: 'The nature of supply chain is always you\'re dealing with complexities',
          source: 'Supply Chain Dive, March 2024',
          relevanceToYardFlow: 'He frames complexity as the constant. YardFlow reduces complexity at the yard level.',
        },
        {
          text: 'AI transformation revolves around people at all stages of the journey',
          source: 'NA Supply Chain Executive Summit 2024, keynote "The People-Centric Approach to AI"',
          relevanceToYardFlow: 'He leads with people, not tech. Position YardFlow as a protocol people follow, not software they learn.',
        },
      ],
      speakingTopics: ['AI transformation', 'People-centric technology', 'Digital twin (Palantir)', 'Cost savings'],

      communicationStyle: 'Data-driven but people-first. Leads with outcomes, not features. Values proven results over promises.',
      languagePreferences: ['cost savings', 'service levels', 'digital transformation', 'operational discipline', 'Run/Improve/Transform'],
      avoidTopics: ['Generic AI hype', 'Technology-first positioning', 'Unproven ROI claims'],
      connectionHooks: ['Diageo background (also a target account)', 'Top 30 Leaders in Supply Chain 2025 award', 'Palantir digital twin champion'],

      bestIntroPath: 'Direct email (suppressed) - phone only. HQ Minneapolis.',
      contactConstraints: 'Email suppressed - phone only',
    },
    {
      personaId: 'gm-ness',
      name: 'Jonathan Ness',
      firstName: 'Jonathan',
      lastName: 'Ness',
      title: 'Chief Supply Chain Officer',
      company: 'General Mills',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Supply Chain',
      reportsTo: 'Paul Gallagher',

      currentMandate: 'Day-to-day supply chain operations oversight',
      bestIntroPath: 'Phone only - email suppressed',
      contactConstraints: 'Email suppressed - phone only',
    },
    {
      personaId: 'gm-ahsanullah',
      name: 'Nisar Ahsanullah',
      firstName: 'Nisar',
      lastName: 'Ahsanullah',
      title: 'Supply Chain Leader - Logistics',
      company: 'General Mills',
      roleInDeal: 'operator-buyer',
      seniority: 'VP',
      function: 'Logistics',

      currentMandate: 'Logistics operations including carrier management and transportation',
      knownPainPoints: ['Carrier satisfaction and retention', 'Detention costs', 'Fleet coordination'],
    },
    {
      personaId: 'gm-underwood',
      name: 'Ryan Underwood',
      firstName: 'Ryan',
      lastName: 'Underwood',
      title: 'Manufacturing and Logistics Operations Leader',
      company: 'General Mills',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Manufacturing / Logistics',

      currentMandate: 'Manufacturing and logistics operations - where the yard meets the plant floor',
      knownPainPoints: ['Plant consolidation throughput pressure', 'Multi-temp dock assignment', 'Production schedule adherence'],
    },
    {
      personaId: 'gm-bracey',
      name: 'Zoe Bracey',
      firstName: 'Zoe',
      lastName: 'Bracey',
      title: 'Logistics and Customer Operations Business Leader - North American Retail',
      company: 'General Mills',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Logistics / Customer Operations',

      currentMandate: 'Customer-facing logistics operations - on-time delivery and service levels',
      knownPainPoints: ['Seasonal volume surges', 'Customer delivery SLAs', 'Carrier coordination'],
    },
    {
      personaId: 'gm-stolpestad',
      name: 'Lars Stolpestad',
      firstName: 'Lars',
      lastName: 'Stolpestad',
      title: 'Customer Service Facility Manager',
      company: 'General Mills',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Facility Operations',

      currentMandate: 'Facility-level operations management',
      knownPainPoints: ['Gate processes', 'Dock scheduling', 'Yard congestion during peak'],
    },
  ],

  // ── PERSON VARIANTS ─────────────────────────────────────────────────
  personVariants: [
    {
      person: {
        personaId: 'gm-gallagher',
        name: 'Paul Gallagher',
        firstName: 'Paul',
        lastName: 'Gallagher',
        title: 'Chief Supply Chain Officer',
        company: 'General Mills',
        email: 'paul.gallagher@genmills.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Paul Gallagher - CSCO',
      variantSlug: 'paul-gallagher',

      framingNarrative: 'Paul, your "Run, Improve, Transform" framework is exactly right. You\'ve already handled "Run" (record service levels) and "Improve" (HMM cost savings, 230bp gross margin expansion). YardFlow is "Transform" - the standardized operating protocol that turns your yard from a tribal knowledge surface into a calculable network asset.',
      openingHook: 'You built a digital twin with Palantir to see your entire supply chain. There is one surface it cannot see: the yard.',
      stakeStatement: 'With 3 Missouri plants closing through 2026, remaining facilities are absorbing 15-25% more volume right now. The $82M restructuring made the plants more competitive. Nothing was allocated to make the yards keep pace.',

      heroOverride: {
        headline: 'Paul, your Palantir digital twin sees everything except the yard',
        subheadline: 'You built end-to-end supply chain visibility. But the 50+ facility yards where trailers stage, wait, and compound costs are still running on local tribal knowledge. YardFlow closes that gap.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],
      ctaOverride: {
        type: 'meeting',
        headline: 'Paul, let\'s walk your yard network',
        subtext: '30-minute conversation about your facility consolidation and where YardFlow fits in the "Transform" phase.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
        personName: 'Paul',
        personContext: 'your $82M restructuring and facility consolidation',
      },
      sectionOverrides: [
        {
          sectionType: 'stakes',
          override: {
            headline: 'The cost your HMM program cannot reach',
            narrative: 'Your Holistic Margin Management program drove gross margin up 230 basis points. That is real discipline. But yard-driven costs sit across 12+ GL codes and never surface as a single line item. Detention, dwell, gate labor, dock contention, temperature-zone conflicts. At 50+ facilities, it aggregates to a number your board would notice if they could see it.',
          },
        },
        {
          sectionType: 'solution',
          override: {
            accountFit: 'You already champion digital transformation - the Palantir digital twin proves that. YardFlow extends your visibility to the physical execution layer. Your "Run, Improve, Transform" framework has a gap at the yard. This fills it.',
          },
        },
      ],

      toneShift: 'Strategic, people-first, transformation-focused. Reference his Run/Improve/Transform framework. He values proven results and people-centric technology. Lead with what operators experience, not what dashboards show.',
      kpiLanguage: ['cost savings', 'service levels', 'digital transformation', 'operational discipline', 'headcount neutral', 'margin expansion'],
      proofEmphasis: 'The "headcount neutral" customer quote is key - Gallagher cares about people. Frame YardFlow as enabling his team, not replacing it.',
      avoidPhrases: ['AI-powered', 'disruptive', 'cutting-edge', 'paradigm shift'],
    },
    {
      person: {
        personaId: 'gm-ahsanullah',
        name: 'Nisar Ahsanullah',
        firstName: 'Nisar',
        lastName: 'Ahsanullah',
        title: 'Supply Chain Leader - Logistics',
        company: 'General Mills',
        roleInDeal: 'operator-buyer',
        seniority: 'VP',
        function: 'Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Nisar Ahsanullah - Logistics',
      variantSlug: 'nisar-ahsanullah',

      framingNarrative: 'Nisar, you manage the carrier relationships that keep General Mills moving. Every minute a driver waits at the gate is a minute that shows up in your carrier scorecards, your detention invoices, and your capacity availability during the next tight market.',
      openingHook: 'Your carriers remember who made them wait. When capacity tightens, those memories become your problem.',
      stakeStatement: 'General Mills relies on contract carriers. Yard efficiency is not just an operational metric - it is carrier relationship management. And with 3 fewer plants pushing more volume through the remaining network, your carriers are feeling it.',

      heroOverride: {
        headline: 'Your carriers remember who made them wait',
        subheadline: 'General Mills depends on contract carriers. Every minute of excess dwell time degrades the relationship. When capacity tightens, the carriers who were treated well get served first. YardFlow cuts your turn times in half.',
      },
      sectionOrder: ['hero', 'problem', 'proof', 'solution', 'comparison', 'network-map', 'cta'],
      ctaOverride: {
        type: 'audit',
        headline: 'Nisar, let\'s look at your turn times',
        subtext: 'We map your top 3 facilities, measure the carrier experience, and show you where 24-minute turns are hiding.',
        buttonLabel: 'Start the Network Audit',
        calendarLink: BOOKING_LINK,
        personName: 'Nisar',
        personContext: 'carrier satisfaction and detention cost reduction',
      },
      addSections: [
        {
          type: 'comparison',
          sectionLabel: 'The Carrier Experience',
          headline: 'What your drivers see today vs. with YardFlow',
          rows: [
            { dimension: 'Gate check-in', before: 'Manual paperwork, 15-20 min', after: 'QR scan, 2 min' },
            { dimension: 'Dock assignment', before: 'Radio call, wait for callback', after: 'Algorithmic, instant' },
            { dimension: 'Average turn time', before: '48 min', after: '24 min' },
            { dimension: 'Detention invoices', before: 'Routine', after: 'Exception' },
            { dimension: 'Carrier satisfaction', before: 'Unknown', after: 'Measured per facility' },
          ],
        },
      ],

      toneShift: 'Operator-to-operator. Carrier language. Turn times, detention, driver experience. No abstractions. He lives in the logistics weeds.',
      kpiLanguage: ['truck turn time', 'detention cost', 'carrier satisfaction', 'dwell time', 'on-time pickup', 'gate-to-gate time'],
      proofEmphasis: 'The 48-to-24 min turn time stat is his headline number. Frame everything around carrier experience and detention cost.',
    },
    {
      person: {
        personaId: 'gm-underwood',
        name: 'Ryan Underwood',
        firstName: 'Ryan',
        lastName: 'Underwood',
        title: 'Manufacturing and Logistics Operations Leader',
        company: 'General Mills',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Manufacturing / Logistics',
      },
      fallbackLane: 'ops',
      label: 'Ryan Underwood - Operations',
      variantSlug: 'ryan-underwood',

      framingNarrative: 'Ryan, you sit at the intersection of manufacturing and logistics. The plant floor has automation, MES, and digital twins. The yard outside the dock door runs on clipboards and radio calls. That gap is where your production schedule breaks.',
      openingHook: 'Your plant floor is a precision machine. Your yard is a parking lot with radios.',
      stakeStatement: 'Every temperature-zone dock assignment error costs time the production schedule cannot recover. Every shift handoff that resets yard state is 30 minutes of throughput you will never get back.',

      heroOverride: {
        headline: 'Your plant floor is a precision machine. Your yard runs on radios and tribal knowledge.',
        subheadline: 'General Mills invested in manufacturing automation, MES systems, and Palantir digital twins. The yard - where trailers stage, dock assignment happens, and production schedule adherence is decided - still runs on manual processes.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'modules', 'proof', 'timeline', 'cta'],
      ctaOverride: {
        type: 'audit',
        headline: 'Ryan, let\'s walk your yards',
        subtext: 'We map the gap between your plant floor automation and your yard operations. 30 minutes.',
        buttonLabel: 'Start the Network Audit',
        calendarLink: BOOKING_LINK,
        personName: 'Ryan',
        personContext: 'bridging the gap between plant automation and yard operations',
      },
      addSections: [
        {
          type: 'timeline',
          sectionLabel: 'Deployment Timeline',
          headline: 'Live in your first facility this month',
          steps: [
            { week: 'Week 1', title: 'Facility Mapping', description: 'Remote mapping of yard layout, dock configuration, temperature zones, and current process.' },
            { week: 'Week 2', title: 'Protocol Configuration', description: 'YardFlow configured to your gate sequence, temp-zone dock rules, and shift patterns.' },
            { week: 'Week 3', title: 'Go-Live', description: '30-minute remote deployment. Training is part of the protocol, not a separate step.' },
            { week: 'Week 4+', title: 'Network Rollout', description: 'Same protocol to facility #2, #3, #4. Each deployment faster than the last.' },
          ],
        },
        {
          type: 'modules',
          sectionLabel: 'The Protocol',
          headline: 'Six modules. One driver journey. Network-wide control.',
          narrative: 'YardFlow is not a dashboard. It is a protocol your drivers, spotters, and dock workers follow. Every move is structured, every handoff documented, every temperature-zone assignment enforced.',
          modules: [
            { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID.' },
            { id: 'flowBOL', name: 'flowBOL', verb: 'Document', shortDescription: 'Touchless BOL creation with timestamped chain of custody.' },
            { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter task queues. Temperature-zone aware. No radio.' },
            { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Real-time digital twin. Every trailer, every lane, every dock.' },
            { id: 'flowAI', name: 'flowAI', verb: 'Orchestrate', shortDescription: 'AI agent routing moves, flagging exceptions, enforcing temp-zone rules.' },
            { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network command. All 50+ sites on one screen.' },
          ],
        },
      ],

      toneShift: 'Operator-to-operator. Plant floor language. Throughput, dock utilization, shift handoffs, production schedule adherence. No abstractions.',
      kpiLanguage: ['dock utilization', 'throughput per shift', 'temperature-zone compliance', 'shift handoff time', 'production schedule adherence'],
      proofEmphasis: 'The protocol as product story. He cares about process standardization, not dashboards.',
    },
  ],

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
    {
      type: 'quote',
      quote: {
        text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
        role: 'Operations Director',
        company: 'National CPG Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '50+',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Co-packing Facilities'],
    geographicSpread: 'US, Canada - Cedar Rapids IA, Buffalo NY, Wellston OH, Murfreesboro TN, Covington GA, Hannibal MO, Joplin MO, Belvidere IL',
    dailyTrailerMoves: '5,000+ across network',
    peakMultiplier: '1.3-1.5x during baking season',
    fleet: 'Contract carriers and 3PL (no private fleet)',
    keyFacilities: [
      { name: 'Belvidere DC', location: 'Belvidere, IL', type: 'Distribution Center', significance: 'State-of-the-art Midwest hub, opened April 2024', yardRelevance: 'Greenfield - no legacy processes, ideal first deployment' },
      { name: 'Cedar Rapids Plant', location: 'Cedar Rapids, IA', type: 'Manufacturing', significance: 'Major cereal production facility' },
      { name: 'Covington Plant', location: 'Covington, GA', type: 'Manufacturing', significance: 'Near MODEX venue in Atlanta', yardRelevance: 'Proximity to MODEX for potential site visit' },
    ],
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: '5,000+ across network',
    peakSeason: 'Baking season (Oct-Dec), snack season (summer)',
    keyRoutes: ['Midwest plants to national DCs', 'Belvidere IL hub to East/West', 'Blue Buffalo separate network'],
    specialRequirements: ['Multi-temperature (ambient, frozen, refrigerated, ultra-cold)', 'Heavy palletized loads (cereal, flour)'],
  },

  signals: {
    modexAttendance: 'General Mills is a major CPG with Covington, GA facility near MODEX venue',
    recentNews: [
      '$82M restructuring - 3 Missouri plant closures phasing through 2026',
      'Belvidere, IL DC opened April 2024 as Midwest hub',
      'Warehouse automation at 4+ locations with more in progress',
      'Palantir digital twin for supply chain visibility',
      'Top 30 Leaders in Supply Chain award for Paul Gallagher (2025)',
    ],
    supplyChainInitiatives: ['Digital twin (Palantir)', 'Warehouse automation expansion', 'HMM cost savings program', 'Sustainability / Scope 3'],
    competitivePressure: 'Post mills CPG competitors investing in supply chain digitization',
    urgencyDriver: 'Missouri plant closures happening NOW - remaining facilities absorbing volume through 2026',
  },

  theme: {
    accentColor: '#003DA5',
    backgroundVariant: 'dark',
  },
};
