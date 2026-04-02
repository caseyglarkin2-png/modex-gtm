import type { AccountMicrositeData } from '../schema';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

export const cocaCola: AccountMicrositeData = {
  slug: 'coca-cola',
  accountName: 'Coca-Cola',
  parentBrand: 'The Coca-Cola Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'B',
  priorityScore: 84,

  pageTitle: 'YardFlow for Coca-Cola - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Coca-Cola\'s 70+ bottler distribution centers.',

  sections: [
    {
      type: 'hero',
      headline: 'Your bottler network runs 70+ facilities with 200-400 trailer moves per day in peak. The yards were never designed for this volume.',
      subheadline: 'Coca-Cola Consolidated alone reported $14M in detention costs. A 15-minute improvement in turn time across the bottler network saves the system $20M+ annually. That is the invisible 48-hour dock bottleneck hiding in your yard.',
      accountCallout: '70+ distribution centers, 200-400 trailer moves/day per facility during peak, $14M detention costs at CCBCC alone',
      backgroundTheme: 'dark',
      cta: {
        type: 'meeting',
        headline: 'See what a standardized yard network looks like for Coca-Cola',
        subtext: '30-minute walk-through of your bottler network with board-ready ROI.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Hidden Constraint',
      headline: 'The yard is where your bottler coordination breaks down',
      narrative: 'Coca-Cola\'s franchise model means multiple bottlers sharing inbound ingredients and packaging from the same concentrate plants. When one bottler\'s trailers back up in the yard, it cascades through scheduling for every other bottler waiting for the same ingredients. The yard is the one surface nobody owns but everybody suffers from.',
      painPoints: [
        {
          headline: '$14M in detention costs at Consolidated alone',
          description: 'Coca-Cola Consolidated reported $14M in detention and demurrage costs in their 10-K filing. Extrapolate that across the full bottler network and the number is staggering.',
          kpiImpact: '$14M detention at CCBCC, likely $40M+ system-wide',
          source: 'Coca-Cola Consolidated 2023 10-K filing',
          relevantPeople: ['coke-coe'],
        },
        {
          headline: 'Summer peak creates 40%+ volume spikes',
          description: 'May through September drives 40% more volume. Yards designed for average throughput cannot handle peak. The result: longer queues, more detention, missed delivery windows.',
          kpiImpact: '40% volume spike, Memorial Day through Labor Day',
          relevantPeople: ['coke-coe'],
        },
        {
          headline: 'Multi-bottler yard contention',
          description: 'Multiple bottlers receiving from the same concentrate and packaging plants. Scheduling conflicts at shared inbound facilities create cascading delays nobody tracks.',
          relevantPeople: ['coke-coe'],
        },
        {
          headline: 'Fairlife cold chain complexity',
          description: 'The Fairlife acquisition (2020) added ultra-filtered milk requiring cold chain staging. Juice lines need refrigerated staging. Multiple temperature zones now competing for the same dock doors.',
          source: 'Fairlife acquisition 2020',
          relevantPeople: ['coke-coe'],
        },
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What This Costs Your System',
      headline: 'The math nobody tracks across the bottler network',
      narrative: 'Detention costs, dwell time, driver wait hours, seasonal surge inefficiency. Each bottler tracks their own slice. Nobody has the system-wide view. Coca-Cola Consolidated\'s $14M is public. The rest is hidden across 70+ facilities.',
      annualCost: '$40M+ estimated system-wide in yard-driven inefficiency',
      costBreakdown: [
        { label: 'Detention / demurrage (CCBCC alone)', value: '$14M' },
        { label: 'Peak season surge inefficiency', value: '$10M+' },
        { label: 'Multi-bottler scheduling conflicts', value: '$8M+' },
        { label: 'Gate and spotter labor overlay', value: '$8M+' },
      ],
      urgencyDriver: 'Coca-Cola Consolidated investing $500M+ in fleet and facility upgrades 2024-2026. The yards should be part of that investment.',
    },
    {
      type: 'solution',
      sectionLabel: 'The Fix',
      headline: 'One protocol across the bottler network',
      narrative: 'YardFlow gives the Coca-Cola system one operating standard for every yard. Not a mandate - a protocol that makes every bottler\'s operation faster and cheaper. The same driver journey at every facility. The same dock assignment logic. The same evidence trail.',
      modules: [
        { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID.', relevanceToAccount: 'Standardizes gate process across 70+ bottler facilities.' },
        { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter task queues. Temperature-zone aware.', relevanceToAccount: 'Critical for Fairlife cold chain and multi-temp staging.' },
        { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location and dwell.', relevanceToAccount: 'Real-time visibility across every bottler yard in the system.' },
        { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view.', relevanceToAccount: 'System-wide visibility Coca-Cola HQ has never had across bottler yards.' },
      ],
      accountFit: 'Coca-Cola just partnered with Blue Yonder for supply chain planning. YardFlow fills the physical execution gap - the yard - where Blue Yonder has no reach.',
    },
    {
      type: 'proof',
      sectionLabel: 'Proof from Live Deployment',
      headline: 'Running today across 24 facilities',
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
      headline: 'The Coca-Cola system\'s yard footprint',
      narrative: 'Every bottler runs its own yard differently. The HQ concentrate plants have different processes from Consolidated\'s DCs, which are different from Reyes Beverage\'s operations, which are different from Liberty Coca-Cola\'s NYC metro yards. YardFlow gives the system one standard.',
      facilityCount: '70+',
      facilityTypes: ['Concentrate Plants (HQ-owned)', 'Bottling Facilities', 'Distribution Centers', 'Cold Storage'],
      geographicSpread: 'National - Atlanta HQ, 14 CCBCC production facilities, Reyes, Liberty, Swire networks',
      dailyTrailerMoves: '15,000+ across the system during peak',
      peakMultiplier: '1.4x during summer (May-September)',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'Conservative ROI for the Coca-Cola system',
      narrative: 'Based on public detention data from CCBCC and measured YardFlow improvements at comparable beverage distribution operations.',
      roiLines: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'Detention cost (CCBCC alone)', before: '$14M/yr', after: '$7M/yr', delta: '-$7M', unit: 'annual' },
        { label: 'Peak season dock contention', before: 'Routine bottleneck', after: 'Protocol-managed', delta: 'Eliminated' },
        { label: 'System-wide savings estimate', before: '$0 (not tracked)', after: '$20M+/yr', delta: '+$20M', unit: 'annual' },
      ],
      totalAnnualSavings: '$20M+ across the bottler system',
      paybackPeriod: '< 4 months at CCBCC alone',
      methodology: 'CCBCC detention data from 10-K filing. System-wide estimate based on 70+ facilities and measured turn time improvements.',
    },
    {
      type: 'testimonial',
      sectionLabel: 'From an Operator Who Runs It',
      quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
      role: 'Operations Director',
      company: 'National Beverage Distributor',
    },
    {
      type: 'cta',
      cta: {
        type: 'modex-meeting',
        headline: 'Coca-Cola HQ is in Atlanta. MODEX is in Atlanta. Let\'s meet.',
        subtext: 'You are literally local to the venue. 30-minute walk through your bottler network with board-ready ROI.',
        buttonLabel: 'Book a Meeting at MODEX',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'Your HQ. Your city. Your meeting. $20M+ in annual savings across the system.',
    },
  ],

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'coke-coe',
      name: 'Daniel Coe',
      firstName: 'Daniel',
      lastName: 'Coe',
      title: 'President, Chief Procurement Officer & Supply Chain Services',
      company: 'The Coca-Cola Company',
      email: 'dcoe@coca-cola.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Procurement / Supply Chain',
      reportsTo: 'CEO James Quincey',

      careerHistory: [
        { period: '2022-present', role: 'President, CPO & Supply Chain Services', company: 'Coca-Cola', relevance: 'Owns procurement and supply chain services for the entire Coca-Cola system.' },
        { period: 'Prior', role: 'President, Bottling Investments Group (BIG)', company: 'Coca-Cola', relevance: 'Led BIG - meaning he understands bottler operations from the inside. Knows where the pain is.' },
      ],
      yearsAtCompany: '20+',
      knownForPhrase: 'Deep operations background, rose through bottling side - understands the physical reality',

      currentMandate: 'System-wide supply chain transformation, digital capabilities investment',
      strategicPriorities: ['Supply chain transformation', 'Digital capabilities', 'Bottler network coordination'],
      knownPainPoints: [
        'Multi-bottler coordination across 70+ facilities',
        'Detention costs ($14M+ at CCBCC alone)',
        'Summer peak volume spikes (40%)',
        'Fairlife cold chain integration',
      ],

      communicationStyle: 'Operations executive who rose through bottling - speak to the physical reality he knows.',
      languagePreferences: ['system-wide', 'bottler network', 'operational efficiency', 'procurement leverage'],
      connectionHooks: ['Atlanta HQ is 15 minutes from MODEX venue', 'Came from BIG (bottling) - understands yard operations personally'],
      modexProximity: 'Coca-Cola HQ is literally in Atlanta. MODEX is in Atlanta. He could walk to the meeting.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'coke-coe',
        name: 'Daniel Coe',
        firstName: 'Daniel',
        lastName: 'Coe',
        title: 'President, Chief Procurement Officer & Supply Chain Services',
        company: 'The Coca-Cola Company',
        email: 'dcoe@coca-cola.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Procurement / Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Daniel Coe - CPO & Supply Chain',
      variantSlug: 'daniel-coe',

      framingNarrative: 'Daniel, you ran the Bottling Investments Group. You have been inside the bottler yards. You know what happens when a trailer sits for an extra 30 minutes during summer peak. Now you own the system-wide supply chain mandate. The yard is the one surface your digital transformation has not reached yet.',
      openingHook: 'You came from the bottling side. You know what those yards look like in July.',
      stakeStatement: 'Consolidated reported $14M in detention. That is one bottler. Your system has 70+ facilities. The number nobody has added up is the one that would get the most attention in your next board meeting.',

      heroOverride: {
        headline: 'Daniel, you came from the bottling side. You know what those yards look like in July.',
        subheadline: 'Coca-Cola Consolidated\'s $14M in detention costs is public record. That is one bottler. Your system runs 70+ facilities. YardFlow gives you the system-wide yard protocol your bottler network has never had.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Daniel, your HQ is in Atlanta. MODEX is in Atlanta.',
        subtext: 'This is the easiest meeting either of us will ever schedule. 30 minutes on what a system-wide yard protocol looks like.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Daniel',
        personContext: 'system-wide yard protocol for the Coca-Cola bottler network',
      },

      toneShift: 'He came from bottling operations. He is not a procurement strategist who has never seen a dock. Talk to him like an operator who now has system-wide authority. Concrete, specific, reference the physical reality he knows.',
      kpiLanguage: ['detention cost', 'system-wide efficiency', 'bottler coordination', 'turn time', 'peak season throughput'],
      proofEmphasis: 'The $14M CCBCC detention number is public. Use it. The 48-to-24 min stat maps directly to his system.',
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
  ],

  network: {
    facilityCount: '70+',
    facilityTypes: ['Concentrate Plants', 'Bottling Facilities', 'Distribution Centers', 'Cold Storage'],
    geographicSpread: 'National - Atlanta HQ, Consolidated (14 facilities), Reyes, Liberty (NYC), Swire (Western US)',
    dailyTrailerMoves: '15,000+ system-wide during peak',
    peakMultiplier: '1.4x during summer',
    fleet: 'Estimated 15,000+ trucks through bottling system',
    keyFacilities: [
      { name: 'Coca-Cola HQ', location: 'Atlanta, GA', type: 'Headquarters', significance: 'Literally in Atlanta, same city as MODEX', yardRelevance: 'Proximity = easiest meeting scheduling possible' },
      { name: 'CCBCC Production Facilities', location: '14 locations', type: 'Bottling/Production', significance: 'Largest US bottler, ~350,000 sq ft avg', yardRelevance: '$14M detention costs documented in 10-K' },
    ],
  },

  freight: {
    primaryModes: ['Truckload', 'DSD', 'Intermodal'],
    avgLoadsPerDay: '15,000+ system-wide during peak',
    peakSeason: 'Summer (May-September), 40% volume spike. Memorial Day, July 4th, Labor Day peaks.',
    keyRoutes: ['Concentrate plants to bottlers', 'Bottlers to DCs', 'DCs to retail'],
    detentionCost: '$14M at CCBCC alone (2023 10-K), estimated $40M+ system-wide',
    specialRequirements: ['Multi-temperature (ambient + cold chain for Fairlife)', 'Reusable container returns (glass bottles)'],
  },

  signals: {
    modexAttendance: 'Coca-Cola HQ in Atlanta. MODEX in Atlanta. High likelihood of local attendance.',
    recentNews: [
      'Q4 2024: "supply chain transformation" initiative, digital capabilities investment',
      'Blue Yonder partnership for supply chain planning (2024)',
      'CCBCC investing $500M+ in fleet and facility upgrades 2024-2026',
      'Fairlife acquisition (2020) adding cold chain complexity',
    ],
    supplyChainInitiatives: ['Supply chain transformation', 'Blue Yonder partnership', 'Digital capabilities investment'],
    urgencyDriver: 'CCBCC $500M facility investment happening now. HQ is local to MODEX. Lowest-friction meeting possible.',
  },

  theme: {
    accentColor: '#F40009',
    backgroundVariant: 'dark',
  },
};
