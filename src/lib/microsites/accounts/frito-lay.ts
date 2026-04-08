import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';
const FRITO_LAY_FACILITY_COUNT_LABEL = getFacilityCountLabel('Frito-Lay', '230+');
const FRITO_LAY_FACILITY_COUNT = getFacilityCountLowerBound('Frito-Lay', 230) ?? 230;

export const fritoLay: AccountMicrositeData = {
  slug: 'frito-lay',
  accountName: 'Frito-Lay',
  parentBrand: 'PepsiCo',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 93,

  pageTitle: 'YardFlow for Frito-Lay - Yard Execution at Snack-Network Speed',
  metaDescription: `How YardFlow eliminates the yard bottleneck across Frito-Lay's ${FRITO_LAY_FACILITY_COUNT_LABEL} site high-velocity snack network.`,

  sections: [
    {
      type: 'hero',
      headline: 'Your snack network runs at a velocity most supply chains never see. Your yards were not built for this speed.',
      subheadline: 'Frito-Lay moves product from plant to shelf faster than almost any CPG network in the world. But between the production line and the outbound trailer, there is a yard that still runs on clipboards and radio calls. That gap costs you more than you are tracking.',
      accountCallout: '30+ manufacturing plants, 200+ distribution centers, highest-velocity CPG network in North America',
      backgroundTheme: 'dark',
      cta: {
        type: 'meeting',
        headline: 'See what standardized yard execution looks like at snack-network speed',
        subtext: '30-minute walk-through of your plant network with board-ready ROI.',
        buttonLabel: 'Book a Network Audit',
        calendarLink: BOOKING_LINK,
      },
    },
    {
      type: 'problem',
      sectionLabel: 'The Hidden Constraint',
      headline: 'The fastest production lines in CPG are feeding the slowest yards',
      narrative: 'Frito-Lay\'s manufacturing lines run at extraordinary speed. Lays, Doritos, Cheetos - continuous production that does not wait. But when that product hits the yard for outbound staging, the pace drops to whatever speed a radio-dispatched spotter can manage. The production line runs at 2026 speed. The yard runs at 1996 speed.',
      painPoints: [
        {
          headline: 'Production-to-trailer handoff gap',
          description: 'Continuous production lines generate outbound loads at a pace the yard was never designed to match. Every 30-minute delay in trailer staging cascades to delivery routes across the region.',
          kpiImpact: 'Minutes of dock delay = hours of route delay downstream',
          relevantPeople: ['fl-watson', 'fl-mars', 'fl-chambers'],
        },
        {
          headline: 'Inbound raw material coordination',
          description: 'Potatoes, corn, oils, seasonings - agricultural inbound with weather-dependent timing and variable carrier quality. The inbound yard is a scheduling puzzle that resets every day.',
          kpiImpact: 'Agricultural inbound variability hits dock scheduling daily',
          relevantPeople: ['fl-chambers', 'fl-fanslow'],
        },
        {
          headline: 'DSD route loading precision',
          description: 'Direct store delivery routes are loaded overnight for morning departure. Loading sequence matters - wrong staging order means wrong trailer-to-route assignment. The yard is where that sequence either works or breaks.',
          kpiImpact: 'Staging errors cascade to retail stock-outs',
          relevantPeople: ['fl-mars', 'fl-scott'],
        },
        {
          headline: 'Multi-site standardization gap',
          description: 'Thirty-plus manufacturing plants and 200-plus distribution centers. Every site runs its yard differently. What works at the Plano headquarters campus does not transfer to the Topeka plant or the Perry, GA facility.',
          kpiImpact: `No standard yard protocol across ${FRITO_LAY_FACILITY_COUNT_LABEL} sites`,
          relevantPeople: ['fl-watson', 'fl-scott'],
        },
        {
          headline: 'Carrier and fleet coordination',
          description: 'Owned fleet, contract carriers, agricultural haulers, DSD route trucks - four different fleet types hitting the same dock doors. No unified system manages that traffic.',
          kpiImpact: '4 fleet types, no unified yard system',
          relevantPeople: ['fl-mars', 'fl-scott', 'fl-fanslow'],
        },
      ],
    },
    {
      type: 'stakes',
      sectionLabel: 'What the Yard Costs You',
      headline: 'The variance tax on the fastest CPG network in America',
      narrative: `At Frito-Lay's volume, small execution gains matter enormously. A 15-minute improvement in truck turn time across ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities is not a rounding error. It is tens of millions in recovered capacity. But nobody is measuring it because the yard has never had a system.`,
      annualCost: '$30M+ estimated in yard-driven inefficiency across the network',
      costBreakdown: [
        { label: 'Dock dwell and turn time excess', value: '$12M+' },
        { label: 'DSD route loading delays', value: '$6M+' },
        { label: 'Inbound agricultural staging waste', value: '$5M+' },
        { label: 'Multi-fleet coordination overhead', value: '$4M+' },
        { label: 'Site-to-site process variance', value: '$3M+' },
      ],
      urgencyDriver: 'PepsiCo is investing in supply chain technology and network optimization. The yard is the one surface that investment has not reached.',
    },
    {
      type: 'solution',
      sectionLabel: 'The Fix',
      headline: 'One yard protocol at snack-network speed',
      narrative: 'YardFlow gives Frito-Lay one operating standard for every yard. Same driver journey at the Plano campus and the Perry plant. Same dock assignment logic at every facility. Same evidence trail for every trailer move. The system matches the speed your production lines already run.',
      modules: [
        { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID.', relevanceToAccount: 'Standardizes gate process for owned fleet, contract carriers, and agricultural haulers.' },
        { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter task queues with priority logic.', relevanceToAccount: 'Critical for DSD route loading - ensures correct staging sequence for morning departures.' },
        { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location and dwell.', relevanceToAccount: 'Replaces clipboard tracking. Real-time view of every trailer at every plant.' },
        { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view.', relevanceToAccount: 'Gives Brian Watson the network-level yard visibility that Frito-Lay has never had.' },
      ],
      accountFit: 'High-velocity CPG + DSD delivery model = the exact use case YardFlow was designed for. Frito-Lay\'s network speed amplifies the ROI of every minute saved at the dock.',
    },
    {
      type: 'proof',
      sectionLabel: 'Running in Production',
      headline: 'Measured results from live CPG deployment',
      proofVisual: {
        type: 'before-after',
        headline: 'What changes when the yard runs on one protocol',
        narrative: 'The difference is not cosmetic. The production-to-trailer handoff stops depending on local tribal knowledge and starts running on one operating standard across the network.',
        beforeAfter: {
          before: {
            label: 'Today',
            description: 'Clipboards, radio dispatch, and site-by-site variance slow the outbound handoff just as production volume peaks.',
          },
          after: {
            label: 'With YardFlow',
            description: 'Standardized gate flow, staged move queues, and live dock visibility compress truck turn time at snack-network speed.',
          },
        },
      },
      liveDeployment: {
        headline: 'Already live in high-volume CPG operations',
        summary: 'This is not a concept deck. The operating model is running today across 24 facilities, contracted for more than 200, and proven to absorb new volume without adding dock-office headcount.',
        badges: ['24 facilities live', '>200 network contracted', '30 min remote deployment'],
      },
      methodology: 'Proof metrics reflect measured truck-turn improvement, documented dock-office leverage, and live deployment rollouts in comparable CPG environments.',
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
      headline: 'Frito-Lay\'s yard footprint across North America',
      narrative: 'Thirty-plus manufacturing plants and 200-plus distribution centers. Agricultural inbound from potato and corn country. DSD routes loading overnight at every facility. The yard protocol at each site is different. YardFlow makes it one.',
      facilityCount: FRITO_LAY_FACILITY_COUNT_LABEL,
      facilityTypes: ['Manufacturing Plants (30+)', 'Distribution Centers', 'Regional Mixing Centers', 'Agricultural Receiving'],
      geographicSpread: 'National - Plano TX (HQ), plants across 20+ states, DSD network covering 95% of US retail',
      dailyTrailerMoves: '14,000+ across the network',
      peakMultiplier: '1.3x during summer and holiday seasons (Super Bowl, back-to-school)',
    },
    {
      type: 'roi',
      sectionLabel: 'The Business Case',
      headline: 'ROI for the Frito-Lay network',
      narrative: `At Frito-Lay's volume, small gains compound fast. Measured YardFlow improvements applied conservatively across ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities.`,
      roiLines: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
        { label: 'DSD route loading accuracy', before: '~85%', after: '97%+', delta: '+12 pts', unit: 'on-time %' },
        { label: 'Inbound dock scheduling', before: 'Manual / radio', after: 'System-managed', delta: 'Automated' },
        { label: 'Network site standardization', before: '0% (every site different)', after: '100% standard protocol', delta: 'Full network' },
        { label: 'Annual network savings', before: '$0 (not tracked)', after: '$20M+', delta: '+$20M', unit: 'annual' },
      ],
      totalAnnualSavings: '$20M+ across the Frito-Lay network',
      paybackPeriod: '< 3 months per facility',
      methodology: `Based on measured 50% truck turn time reduction at comparable CPG operations. Conservative estimate for ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities at Frito-Lay volume.`,
    },
    {
      type: 'testimonial',
      sectionLabel: 'From a CPG Operator',
      quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
      role: 'Operations Director',
      company: 'National CPG Manufacturer',
    },
    {
      type: 'cta',
      cta: {
        type: 'modex-meeting',
        headline: 'Frito-Lay is a past MODEX attendee. Let\'s meet this year.',
        subtext: '30-minute walk through your network with board-ready ROI. The yard is where snack-network speed breaks down.',
        buttonLabel: 'Book a Meeting at MODEX',
        calendarLink: BOOKING_LINK,
      },
      closingLine: 'The fastest production lines in CPG deserve the fastest yards. Let\'s talk at MODEX.',
    },
  ],

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'fl-watson',
      name: 'Brian Watson',
      firstName: 'Brian',
      lastName: 'Watson',
      title: 'Vice President of Supply Chain',
      company: 'Frito-Lay / PepsiCo',
      email: 'brian.watson@pepsico.com',
      linkedinUrl: 'https://www.linkedin.com/in/brian-watson-906532142',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',

      currentMandate: 'Network-wide supply chain performance and standardization',
      strategicPriorities: ['Multi-site standardization', 'Throughput optimization', 'Network execution visibility'],
      knownPainPoints: ['No network-wide yard protocol', 'Site-to-site process variance', 'No unified yard metrics'],

      communicationStyle: 'Senior executive. Lead with network-level impact and strategic value. He cares about the system, not individual sites.',
      languagePreferences: ['network', 'standardization', 'execution', 'throughput', 'at scale'],
      connectionHooks: ['Past MODEX attendee signal', 'PepsiCo network / LinkedIn path'],
    },
    {
      personaId: 'fl-mars',
      name: 'Beth Mars',
      firstName: 'Beth',
      lastName: 'Mars',
      title: 'Transportation Director',
      company: 'Frito-Lay / PepsiCo',
      email: 'beth.mars@pepsico.com',
      linkedinUrl: 'https://www.linkedin.com/in/bethmars',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Transportation',

      currentMandate: 'Fleet efficiency and transportation execution across the Frito-Lay network',
      strategicPriorities: ['Fleet utilization', 'Carrier management', 'DSD transportation efficiency'],
      knownPainPoints: ['Multi-fleet coordination (owned + contract + ag)', 'DSD route loading precision', 'Dock scheduling for outbound fleet'],

      communicationStyle: 'Operations leader. Transportation-focused. Speak in fleet, turn time, and dock scheduling language.',
      languagePreferences: ['fleet', 'turn time', 'dock scheduling', 'carrier management', 'DSD'],
      connectionHooks: ['Transportation-heavy operator relevant to high-volume plant flows'],
    },
    {
      personaId: 'fl-scott',
      name: 'Dr. Isaac Scott',
      firstName: 'Isaac',
      lastName: 'Scott',
      title: 'National Senior Director Transportation',
      company: 'PepsiCo (Frito-Lay)',
      email: 'isaac.scott@pepsico.com',
      linkedinUrl: 'https://www.linkedin.com/in/dr-isaac-scott-69887131',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Logistics',

      currentMandate: 'National transportation operations and network logistics for Frito-Lay',
      strategicPriorities: ['National transportation optimization', 'Network logistics coordination', 'Multi-site standardization'],
      knownPainPoints: ['DSD route loading scheduling', 'Multi-site process variance', 'Carrier and fleet coordination'],

      communicationStyle: 'Logistics professional with academic background (Dr.). Data-driven, systematic thinking. Present the problem quantitatively.',
      languagePreferences: ['logistics', 'network optimization', 'standardization', 'data-driven'],
      connectionHooks: ['Direct transportation leader tied to the Frito-Lay network'],
    },
    {
      personaId: 'fl-chambers',
      name: 'David Chambers',
      firstName: 'David',
      lastName: 'Chambers',
      title: 'Inbound Transportation Operations Leader',
      company: 'Frito-Lay / PepsiCo',
      email: 'david.chambers@pepsico.com',
      linkedinUrl: 'https://www.linkedin.com/in/david-chambers-809b1a137',
      roleInDeal: 'influencer',
      seniority: 'Director',
      function: 'Distribution',

      currentMandate: 'Frito-Lay inbound transportation for agricultural and raw materials',
      strategicPriorities: ['Inbound raw material logistics', 'Agricultural carrier management', 'Dock scheduling for inbound'],
      knownPainPoints: ['Agricultural inbound variability', 'Weather-dependent timing', 'Variable carrier quality on ag lanes'],

      communicationStyle: 'Operations specialist. He manages the inbound side - potatoes, corn, oils. Speak to the agricultural supply chain reality.',
      languagePreferences: ['inbound', 'agricultural', 'raw materials', 'carrier quality', 'dock scheduling'],
      connectionHooks: ['Manages Frito-Lay inbound transportation for agro and raw materials'],
    },
    {
      personaId: 'fl-fanslow',
      name: 'Bob Fanslow',
      firstName: 'Bob',
      lastName: 'Fanslow',
      title: 'Supply Chain Logistics Manager',
      company: 'Frito-Lay / PepsiCo',
      email: 'bob.fanslow@pepsico.com',
      linkedinUrl: 'https://www.linkedin.com/in/bobfanslow',
      roleInDeal: 'influencer',
      seniority: 'Director',
      function: 'Transportation',

      currentMandate: 'Logistics operations including OTR fleet, shipping, and inbound potato logistics',
      strategicPriorities: ['OTR fleet efficiency', 'Shipping logistics', 'Inbound potato logistics optimization'],
      knownPainPoints: ['OTR fleet dock scheduling', 'Inbound potato logistics variability', 'Shipping coordination across network'],

      communicationStyle: 'Long-tenured operations professional. Has seen the yard problem for years. Practical, not strategic. Speak to daily pain, not transformation narratives.',
      languagePreferences: ['fleet', 'shipping', 'logistics', 'dock', 'practical'],
      connectionHooks: ['Long Frito-Lay background across OTR fleet, shipping, and inbound potato logistics'],
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'fl-watson',
        name: 'Brian Watson',
        firstName: 'Brian',
        lastName: 'Watson',
        title: 'Vice President of Supply Chain',
        company: 'Frito-Lay / PepsiCo',
        email: 'brian.watson@pepsico.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Brian Watson - VP Supply Chain',
      variantSlug: 'brian-watson',

      framingNarrative: `Brian, Frito-Lay runs the highest-velocity CPG network in North America. Your production lines are world-class. But when product hits the yard for outbound staging, the pace drops to whatever speed a radio-dispatched spotter can manage. Across ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities, that gap is costing the network more than anyone is measuring.`,
      openingHook: 'Your production lines run at 2026 speed. Your yards run at 1996 speed.',
      stakeStatement: `At Frito-Lay's volume, a 15-minute improvement in truck turn time across ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities is not a rounding error. It is $20M+ in recovered capacity that nobody is tracking.`,

      heroOverride: {
        headline: 'Brian, the fastest production lines in CPG are feeding the slowest yards.',
        subheadline: `Frito-Lay's network speed is unmatched. But the yard - the surface between production and the road - still runs on clipboards and radio calls. One protocol across ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities changes the math.`,
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Brian, Frito-Lay is a past MODEX attendee. Let\'s meet this year.',
        subtext: '30 minutes on what network-wide yard standardization looks like at Frito-Lay\'s speed.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Brian',
        personContext: `network-wide yard standardization for ${FRITO_LAY_FACILITY_COUNT_LABEL} Frito-Lay facilities`,
      },

      toneShift: 'He is the senior supply chain leader. Speak to network-level impact, not individual sites. He cares about standardization across the system, not fixing one dock.',
      kpiLanguage: ['network throughput', 'standardization', 'turn time', 'capacity recovery', 'multi-site ROI'],
      proofEmphasis: `Lead with the ${FRITO_LAY_FACILITY_COUNT_LABEL} site network stat - it mirrors his world. The $1M+ per-site impact multiplied across his ${FRITO_LAY_FACILITY_COUNT_LABEL} facilities is the number that gets his attention.`,
    },
    {
      person: {
        personaId: 'fl-mars',
        name: 'Beth Mars',
        firstName: 'Beth',
        lastName: 'Mars',
        title: 'Transportation Director',
        company: 'Frito-Lay / PepsiCo',
        email: 'beth.mars@pepsico.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Transportation',
      },
      fallbackLane: 'logistics',
      label: 'Beth Mars - Transportation Director',
      variantSlug: 'beth-mars',

      framingNarrative: 'Beth, you manage transportation for the highest-velocity snack network in America. Your fleet gets product to 95% of US retail. But the dock - where your drivers wait, where your trailers sit, where your DSD routes get loaded - is still the one surface running on manual processes. Every minute of dock delay cascades into your route schedule.',
      openingHook: 'Your fleet is world-class. Your docks are holding it back.',
      stakeStatement: 'DSD route loading precision drives retail shelf availability. When the yard slips, the morning route slips, and the shelf goes empty. That is the connection nobody is measuring.',

      heroOverride: {
        headline: 'Beth, your fleet handles the hardest last mile in CPG. The dock is the bottleneck.',
        subheadline: 'DSD route loading runs overnight. The staging sequence has to be right. When the yard runs on radio calls, the wrong trailer ends up at the wrong door, and the morning route starts behind.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'proof', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Beth, let\'s talk about what a system-managed dock looks like for DSD.',
        subtext: '30 minutes on dock scheduling for the fastest fleet in CPG.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Beth',
        personContext: 'dock scheduling and DSD route loading for Frito-Lay transportation',
      },

      toneShift: 'She is a transportation operator. Speak in fleet and dock language, not executive strategy. She cares about turn times, driver wait, staging sequence, and route loading precision.',
      kpiLanguage: ['turn time', 'dock scheduling', 'DSD route loading', 'fleet utilization', 'driver wait time'],
      proofEmphasis: 'Lead with the 48-to-24 minute dock turn stat. That is her world. The headcount-neutral quote maps to her dock office teams.',
    },
    {
      person: {
        personaId: 'fl-chambers',
        name: 'David Chambers',
        firstName: 'David',
        lastName: 'Chambers',
        title: 'Inbound Transportation Operations Leader',
        company: 'Frito-Lay / PepsiCo',
        email: 'david.chambers@pepsico.com',
        roleInDeal: 'influencer',
        seniority: 'Director',
        function: 'Distribution',
      },
      fallbackLane: 'logistics',
      label: 'David Chambers - Inbound Transportation',
      variantSlug: 'david-chambers',

      framingNarrative: 'David, you manage the inbound side of Frito-Lay\'s supply chain - the potatoes, the corn, the oils, the seasonings. Agricultural inbound is inherently variable. Weather changes timing. Carrier quality is inconsistent. The dock schedule resets every day. YardFlow gives you a system that handles that variability instead of forcing your team to manage it manually.',
      openingHook: 'Agricultural inbound variability is a daily reality. Your dock scheduling should not be.',
      stakeStatement: 'When an agricultural haul arrives 2 hours late and there is no system to reschedule the dock, your team scrambles. That scramble happens every day across every plant. It does not have to.',

      heroOverride: {
        headline: 'David, agricultural inbound is inherently variable. Your dock scheduling does not have to be.',
        subheadline: 'Potatoes, corn, oils - the raw materials that feed Frito-Lay\'s production lines arrive on variable timing. YardFlow gives your dock a system that adapts to that reality instead of fighting it.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'proof', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'David, let\'s talk about inbound dock scheduling for agricultural freight.',
        subtext: '30 minutes on how YardFlow handles variable inbound timing.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'David',
        personContext: 'inbound dock scheduling for agricultural and raw material logistics',
      },

      toneShift: 'He is an inbound operations specialist. Do not talk about DSD or outbound - that is Beth\'s world. Talk about agricultural inbound, carrier quality, weather variability, and dock scheduling on the receiving side.',
      kpiLanguage: ['inbound scheduling', 'carrier quality', 'dock utilization', 'agricultural timing', 'raw material flow'],
      proofEmphasis: 'The dock turn time improvement matters on inbound too. Frame it as: when an ag haul arrives, how fast does it get to the door? That is the number he cares about.',
    },
    {
      person: {
        personaId: 'fl-scott',
        name: 'Dr. Isaac Scott',
        firstName: 'Isaac',
        lastName: 'Scott',
        title: 'National Senior Director Transportation',
        company: 'PepsiCo (Frito-Lay)',
        email: 'isaac.scott@pepsico.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Isaac Scott - National Transportation',
      variantSlug: 'isaac-scott',

      framingNarrative: 'Isaac, your remit is national transportation performance, which means local yard chaos becomes your problem the moment it creates route variance across the network. Frito-Lay has the volume, the fleet mix, and the site count where transportation optimization stops being credible if every plant still runs a different yard protocol.',
      openingHook: 'A national transportation network cannot run on local yard habits and still call itself standardized.',
      stakeStatement: 'Every plant-specific dock workaround creates network-wide variance in turn times, route readiness, and carrier performance. Without a common execution layer at the yard, the transportation system stays partially manual no matter how optimized the network model looks on paper.',

      heroOverride: {
        headline: 'Isaac, national transportation performance still breaks at the yard.',
        subheadline: 'Frito-Lay can optimize routes, capacity, and transportation planning at the network level. But once a trailer hits the dock, each site falls back to its own local process. That is where national variance is born.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'solution', 'proof', 'network-map', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Isaac, let\'s look at national transportation variance from the yard up.',
        subtext: '30 minutes on the execution layer between network transportation planning and site-level dock reality.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Isaac',
        personContext: 'national transportation standardization across the Frito-Lay network',
      },

      toneShift: 'Data-driven and systematic. He has an academic bent and a national remit, so quantify the variance problem and frame YardFlow as a network-standardization mechanism, not a local yard tool.',
      kpiLanguage: ['network optimization', 'standardization', 'turn time', 'route readiness', 'transportation variance'],
      proofEmphasis: 'Lead with measured turn-time compression and the multi-site standardization story. He needs proof that one protocol can reduce national transportation noise, not just fix one facility.',
      avoidPhrases: ['plant manager workaround', 'one-off site fix'],
    },
    {
      person: {
        personaId: 'fl-fanslow',
        name: 'Bob Fanslow',
        firstName: 'Bob',
        lastName: 'Fanslow',
        title: 'Supply Chain Logistics Manager',
        company: 'Frito-Lay / PepsiCo',
        email: 'bob.fanslow@pepsico.com',
        roleInDeal: 'influencer',
        seniority: 'Director',
        function: 'Transportation',
      },
      fallbackLane: 'logistics',
      label: 'Bob Fanslow - Logistics Operations',
      variantSlug: 'bob-fanslow',

      framingNarrative: 'Bob, you have lived the practical side of Frito-Lay logistics across OTR fleet, shipping, and inbound potato flow. The pitch here is not transformation theater. It is fewer manual resets, fewer radio calls, and less time spent untangling the same dock and yard problems your team already knows too well.',
      openingHook: 'You should not need tribal knowledge to decide which trailer goes to which door next.',
      stakeStatement: 'When OTR shipping, inbound potato timing, and dock availability all collide, the team burns time managing exceptions manually. That is daily friction, not strategy debt, and it compounds across every shift.',

      heroOverride: {
        headline: 'Bob, the daily yard scramble is still stealing time from the team.',
        subheadline: 'OTR fleet moves, shipping coordination, and inbound potato logistics all meet at the same dock surface. When that surface depends on radios and memory, your team spends the shift firefighting instead of executing a clean plan.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'proof', 'roi', 'cta'],
      ctaOverride: {
        type: 'modex-meeting',
        headline: 'Bob, let\'s talk about a more practical yard workflow.',
        subtext: '30 minutes on reducing the daily dock and yard scramble across fleet, shipping, and inbound potato flow.',
        buttonLabel: 'Meet at MODEX',
        calendarLink: BOOKING_LINK,
        personName: 'Bob',
        personContext: 'practical yard execution for shipping, OTR fleet, and inbound potato logistics',
      },

      toneShift: 'Practical, direct, operations-first. He does not need a transformation speech. He needs a believable workflow improvement that removes repetitive friction from the team\'s day.',
      kpiLanguage: ['fleet', 'shipping', 'dock', 'logistics', 'practical workflow'],
      proofEmphasis: 'Use the headcount-neutral dock-office proof and fast deployment story. He needs to believe the system helps the team quickly without adding process overhead.',
      avoidPhrases: ['digital transformation agenda', 'board-level narrative'],
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

  roiModel: {
    sourceOfTruth: 'shared-engine',
    calculatorVersion: 'ROI Calculator V2 public contract',
    scenarioLabel: `Lower-bound ${FRITO_LAY_FACILITY_COUNT}-facility Frito-Lay network model using the current flagship research baseline`,
    averageMarginPerShipment: 90,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 30 },
      { archetype: 'drops-no-yms', facilityCount: 120 },
      { archetype: 'without-drops', facilityCount: 80 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 110 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 75 },
      { archetype: 'without-drops', shipmentsPerDay: 20 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: FRITO_LAY_FACILITY_COUNT,
        unit: 'facilities',
        sourceNoteId: 'frito-network-footprint',
      },
      {
        label: 'Modeled daily trailer moves',
        value: 13_900,
        unit: 'moves/day',
        sourceNoteId: 'frito-throughput-profile',
      },
      {
        label: 'Average margin per shipment',
        value: 90,
        unit: 'USD/shipment',
        sourceNoteId: 'frito-margin-estimate',
      },
      {
        label: 'Archetype mix',
        value: '30 with YMS, 120 drops no YMS, 80 without drops',
        sourceNoteId: 'frito-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'frito-network-footprint',
        label: 'Lower-bound Frito-Lay network footprint',
        detail: `The flagship microsite now uses the official Frito-Lay company facts split of 30-plus manufacturing facilities and 200-plus distribution centers, yielding a conservative ${FRITO_LAY_FACILITY_COUNT_LABEL} site lower bound for the modeled network.`,
        confidence: 'public',
        citation: 'src/lib/data/facility-facts.json',
      },
      {
        id: 'frito-throughput-profile',
        label: 'Snack-network throughput profile',
        detail: 'Shipment-per-day assumptions are tuned to a high-velocity snack network with heavy overnight route loading and broad drop-trailer usage, while staying conservative relative to the main page daily-move narrative.',
        confidence: 'estimated',
        citation: 'src/lib/microsites/accounts/frito-lay.ts',
      },
      {
        id: 'frito-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is kept well below the public calculator default so the Frito-Lay model does not overstate value on lighter-margin snack shipments.',
        confidence: 'estimated',
      },
      {
        id: 'frito-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Facility mix is weighted toward distribution points and regional hubs, with the 30-plus manufacturing footprint carrying the highest share of structured dock controls in the modeled network.',
        confidence: 'inferred',
        citation: 'src/lib/data/facility-facts.json',
      },
    ],
  },

  network: {
    facilityCount: FRITO_LAY_FACILITY_COUNT_LABEL,
    facilityTypes: ['Manufacturing Plants (30+)', 'Distribution Centers', 'Regional Mixing Centers', 'Agricultural Receiving'],
    geographicSpread: 'National - Plano TX (HQ), plants across 20+ states',
    dailyTrailerMoves: '14,000+ across the network',
    peakMultiplier: '1.3x during summer and holiday seasons',
    fleet: 'Large owned fleet + contract carriers + agricultural haulers',
    keyFacilities: [
      { name: 'Plano, TX HQ Campus', location: 'Plano, TX', type: 'HQ / Manufacturing', significance: 'Corporate headquarters and major production facility', yardRelevance: 'Highest-visibility yard in the network. Pilot site candidate.' },
      { name: 'Perry, GA Plant', location: 'Perry, GA', type: 'Manufacturing', significance: '~150 miles from MODEX venue in Atlanta', yardRelevance: 'Closest Frito-Lay plant to MODEX. Natural pilot site for post-conference deployment.' },
      { name: 'Topeka, KS Plant', location: 'Topeka, KS', type: 'Manufacturing', significance: 'Major production facility', yardRelevance: 'High-volume plant with complex inbound agricultural receiving.' },
    ],
  },

  freight: {
    primaryModes: ['DSD', 'Truckload', 'Agricultural Inbound'],
    avgLoadsPerDay: '14,000+',
    peakSeason: 'Summer + holiday seasons (Super Bowl, back-to-school, Thanksgiving/Christmas)',
    keyRoutes: ['Agricultural inbound (potato/corn country)', 'Plant to DC', 'DC to retail (DSD)'],
    detentionCost: 'Not publicly disclosed but estimated $20M+ based on network scale and velocity',
    specialRequirements: [
      'DSD overnight loading for morning route departure',
      'Agricultural inbound with variable timing',
      'Multi-fleet coordination (owned + contract + ag haulers)',
      'High SKU count (Lays, Doritos, Cheetos, Tostitos, etc.) requires staging precision',
    ],
  },

  signals: {
    modexAttendance: 'Past MODEX attendee list. Perry GA plant ~150 miles from venue.',
    recentNews: [
      'PepsiCo supply chain technology investment',
      'Network optimization and multi-site standardization initiatives',
      'DSD delivery model evolution',
    ],
    supplyChainInitiatives: ['Network standardization', 'DSD optimization', 'Supply chain technology'],
    urgencyDriver: 'Past MODEX attendee. Highest-velocity CPG network = highest ROI per minute of dock time saved. Perry GA plant is near MODEX for post-conference pilot.',
  },

  theme: {
    accentColor: '#E21A2C',
    backgroundVariant: 'dark',
  },
};
