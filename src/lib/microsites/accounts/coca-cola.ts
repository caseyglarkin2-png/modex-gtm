import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const COCA_COLA_FACILITY_COUNT_LABEL = getFacilityCountLabel('Coca-Cola', '70+');
const COCA_COLA_FACILITY_COUNT = getFacilityCountLowerBound('Coca-Cola', 70) ?? 70;

// LEGACY SECTIONS (preserved for reference — M3.2-M3.6 may lift prose into memo sections)
/*
 * [
 *     {
 *       type: 'hero',
 *       headline: `Your bottler network runs ${COCA_COLA_FACILITY_COUNT_LABEL} facilities with 200-400 trailer moves per day in peak. The yards were never designed for this volume.`,
 *       subheadline: 'Coca-Cola Consolidated alone reported $14M in detention costs. A 15-minute improvement in turn time across the bottler network saves the system $20M+ annually. That is the invisible 48-hour dock bottleneck hiding in your yard.',
 *       accountCallout: `${COCA_COLA_FACILITY_COUNT_LABEL} disclosed bottler sites, including 60 distribution centers and 10 plants at CCBCC alone, 200-400 trailer moves/day per facility during peak`,
 *       backgroundTheme: 'dark',
 *       cta: {
 *         type: 'meeting',
 *         headline: 'See what a standardized yard network looks like for Coca-Cola',
 *         subtext: '30-minute walk-through of your bottler network with board-ready ROI.',
 *         buttonLabel: 'Book a Network Audit',
 *         calendarLink: BOOKING_LINK,
 *       },
 *     },
 *     {
 *       type: 'problem',
 *       sectionLabel: 'The Hidden Constraint',
 *       headline: 'The yard is where your bottler coordination breaks down',
 *       narrative: 'Coca-Cola\'s franchise model means multiple bottlers sharing inbound ingredients and packaging from the same concentrate plants. When one bottler\'s trailers back up in the yard, it cascades through scheduling for every other bottler waiting for the same ingredients. The yard is the one surface nobody owns but everybody suffers from.',
 *       painPoints: [
 *         {
 *           headline: '$14M in detention costs at Consolidated alone',
 *           description: 'Coca-Cola Consolidated reported $14M in detention and demurrage costs in their 10-K filing. Extrapolate that across the full bottler network and the number is staggering.',
 *           kpiImpact: '$14M detention at CCBCC, likely $40M+ system-wide',
 *           source: 'Coca-Cola Consolidated 2023 10-K filing',
 *           relevantPeople: ['coke-coe', 'coke-jadhav', 'coke-eppert'],
 *         },
 *         {
 *           headline: 'Summer peak creates 40%+ volume spikes',
 *           description: 'May through September drives 40% more volume. Yards designed for average throughput cannot handle peak. The result: longer queues, more detention, missed delivery windows.',
 *           kpiImpact: '40% volume spike, Memorial Day through Labor Day',
 *           relevantPeople: ['coke-coe', 'coke-jadhav', 'coke-eppert'],
 *         },
 *         {
 *           headline: 'Multi-bottler yard contention',
 *           description: 'Multiple bottlers receiving from the same concentrate and packaging plants. Scheduling conflicts at shared inbound facilities create cascading delays nobody tracks.',
 *           relevantPeople: ['coke-coe', 'coke-jadhav', 'coke-eppert'],
 *         },
 *         {
 *           headline: 'Fairlife cold chain complexity',
 *           description: 'The Fairlife acquisition (2020) added ultra-filtered milk requiring cold chain staging. Juice lines need refrigerated staging. Multiple temperature zones now competing for the same dock doors.',
 *           source: 'Fairlife acquisition 2020',
 *           relevantPeople: ['coke-coe', 'coke-jadhav', 'coke-eppert'],
 *         },
 *       ],
 *     },
 *     {
 *       type: 'stakes',
 *       sectionLabel: 'What This Costs Your System',
 *       headline: 'The math nobody tracks across the bottler network',
 *       narrative: `Detention costs, dwell time, driver wait hours, seasonal surge inefficiency. Each bottler tracks their own slice. Nobody has the system-wide view. Coca-Cola Consolidated's $14M is public. The rest is hidden across ${COCA_COLA_FACILITY_COUNT_LABEL} facilities.`,
 *       annualCost: '$40M+ estimated system-wide in yard-driven inefficiency',
 *       costBreakdown: [
 *         { label: 'Detention / demurrage (CCBCC alone)', value: '$14M' },
 *         { label: 'Peak season surge inefficiency', value: '$10M+' },
 *         { label: 'Multi-bottler scheduling conflicts', value: '$8M+' },
 *         { label: 'Gate and spotter labor overlay', value: '$8M+' },
 *       ],
 *       urgencyDriver: 'Coca-Cola Consolidated investing $500M+ in fleet and facility upgrades 2024-2026. The yards should be part of that investment.',
 *     },
 *     {
 *       type: 'solution',
 *       sectionLabel: 'The Fix',
 *       headline: 'One protocol across the bottler network',
 *       narrative: 'YardFlow gives the Coca-Cola system one operating standard for every yard. Not a mandate - a protocol that makes every bottler\'s operation faster and cheaper. The same driver journey at every facility. The same dock assignment logic. The same evidence trail.',
 *       modules: [
 *         { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID.', relevanceToAccount: `Standardizes gate process across ${COCA_COLA_FACILITY_COUNT_LABEL} bottler facilities.` },
 *         { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter task queues. Temperature-zone aware.', relevanceToAccount: 'Critical for Fairlife cold chain and multi-temp staging.' },
 *         { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location and dwell.', relevanceToAccount: 'Real-time visibility across every bottler yard in the system.' },
 *         { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view.', relevanceToAccount: 'System-wide visibility Coca-Cola HQ has never had across bottler yards.' },
 *       ],
 *       accountFit: 'Coca-Cola just partnered with Blue Yonder for supply chain planning. YardFlow fills the physical execution gap - the yard - where Blue Yonder has no reach.',
 *     },
 *     {
 *       type: 'proof',
 *       sectionLabel: 'Proof from Live Deployment',
 *       headline: 'Running today across 24 facilities',
 *       blocks: [
 *         {
 *           type: 'metric',
 *           stats: [
 *             { value: '24', label: 'Facilities Live' },
 *             { value: '>200', label: 'Contracted Network' },
 *             { value: '48-to-24', label: 'Min Truck Turn Time' },
 *             { value: '$1M+', label: 'Per-Site Profit Impact' },
 *             { value: '30 min', label: 'Remote Deployment' },
 *           ],
 *         },
 *         {
 *           type: 'quote',
 *           quote: {
 *             text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office. That was an integral part of our strategy and has been proven.',
 *             role: 'Operations Director',
 *             company: 'National CPG Manufacturer',
 *           },
 *         },
 *       ],
 *     },
 *     {
 *       type: 'network-map',
 *       sectionLabel: 'Your Network',
 *       headline: 'The Coca-Cola system\'s yard footprint',
 *       narrative: 'Every bottler runs its own yard differently. The HQ concentrate plants have different processes from Consolidated\'s DCs, which are different from Reyes Beverage\'s operations, which are different from Liberty Coca-Cola\'s NYC metro yards. YardFlow gives the system one standard.',
 *       facilityCount: COCA_COLA_FACILITY_COUNT_LABEL,
 *       facilityTypes: ['Concentrate Plants (HQ-owned)', 'Bottling Facilities', 'Distribution Centers', 'Cold Storage'],
 *       geographicSpread: 'National - Atlanta HQ, Coca-Cola Consolidated (14 states plus DC, 60 distribution centers and 10 manufacturing plants), Reyes, Liberty, Swire networks',
 *       dailyTrailerMoves: '15,000+ across the system during peak',
 *       peakMultiplier: '1.4x during summer (May-September)',
 *     },
 *     {
 *       type: 'roi',
 *       sectionLabel: 'The Business Case',
 *       headline: 'Conservative ROI for the Coca-Cola system',
 *       narrative: 'Based on public detention data from CCBCC and measured YardFlow improvements at comparable beverage distribution operations.',
 *       roiLines: [
 *         { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
 *         { label: 'Detention cost (CCBCC alone)', before: '$14M/yr', after: '$7M/yr', delta: '-$7M', unit: 'annual' },
 *         { label: 'Peak season dock contention', before: 'Routine bottleneck', after: 'Protocol-managed', delta: 'Eliminated' },
 *         { label: 'System-wide savings estimate', before: '$0 (not tracked)', after: '$20M+/yr', delta: '+$20M', unit: 'annual' },
 *       ],
 *       totalAnnualSavings: '$20M+ across the bottler system',
 *       paybackPeriod: '< 4 months at CCBCC alone',
 *       methodology: `CCBCC detention data from 10-K filing. System-wide estimate based on ${COCA_COLA_FACILITY_COUNT_LABEL} facilities and measured turn time improvements.`,
 *     },
 *     {
 *       type: 'testimonial',
 *       sectionLabel: 'From an Operator Who Runs It',
 *       quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
 *       role: 'Operations Director',
 *       company: 'National Beverage Distributor',
 *     },
 *     {
 *       type: 'cta',
 *       cta: {
 *         type: 'modex-meeting',
 *         headline: 'Coca-Cola HQ is in Atlanta. MODEX is in Atlanta. Let\'s meet.',
 *         subtext: 'You are literally local to the venue. 30-minute walk through your bottler network with board-ready ROI.',
 *         buttonLabel: 'Book a Meeting at MODEX',
 *         calendarLink: BOOKING_LINK,
 *       },
 *       closingLine: 'Your HQ. Your city. Your meeting. $20M+ in annual savings across the system.',
 *     },
 *   ]
 */

export const cocaCola: AccountMicrositeData = {
  slug: 'coca-cola',
  accountName: 'Coca-Cola',
  parentBrand: 'The Coca-Cola Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'B',
  priorityScore: 84,

  pageTitle: 'YardFlow for Coca-Cola - Yard Network Standardization',
  metaDescription: `How YardFlow eliminates the yard bottleneck across Coca-Cola's ${COCA_COLA_FACILITY_COUNT_LABEL} disclosed bottler yard sites.`,

  sections: [],

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
        `Multi-bottler coordination across ${COCA_COLA_FACILITY_COUNT_LABEL} facilities`,
        'Detention costs ($14M+ at CCBCC alone)',
        'Summer peak volume spikes (40%)',
        'Fairlife cold chain integration',
      ],

      communicationStyle: 'Operations executive who rose through bottling - speak to the physical reality he knows.',
      languagePreferences: ['system-wide', 'bottler network', 'operational efficiency', 'procurement leverage'],
      connectionHooks: ['Atlanta HQ is 15 minutes from MODEX venue', 'Came from BIG (bottling) - understands yard operations personally'],
      modexProximity: 'Coca-Cola HQ is literally in Atlanta. MODEX is in Atlanta. He could walk to the meeting.',
    },
    {
      personaId: 'coke-jadhav',
      name: 'Dinesh Jadhav',
      firstName: 'Dinesh',
      lastName: 'Jadhav',
      title: 'Chief Supply Chain Officer, Bottling Investments Group',
      company: 'The Coca-Cola Company',
      email: 'dijadhav@coca-cola.com',
      roleInDeal: 'operator-buyer',
      seniority: 'C-level',
      function: 'Supply Chain',

      careerHistory: [
        { period: 'Current', role: 'Chief Supply Chain Officer, Bottling Investments Group', company: 'The Coca-Cola Company', relevance: 'Owns supply-chain execution for the bottling side of the Coca-Cola system.' },
        { period: 'Prior', role: 'Chief Supply Chain Officer across Southeast Asia, Southwest Asia, and parts of the Middle East', company: 'The Coca-Cola Company', relevance: 'Ran end-to-end supply operations across complex multi-market bottling environments.' },
        { period: 'Earlier', role: 'Executive Director and Head of Supply Chain', company: 'Hindustan Coca-Cola Beverages', relevance: 'Deep bottling-operations background, not just corporate planning distance.' },
      ],
      yearsAtCompany: 'Multi-decade Coca-Cola bottling and supply background',

      currentMandate: 'Drive end-to-end bottling supply-chain performance inside the Bottling Investments Group',
      strategicPriorities: ['Bottling execution discipline', 'End-to-end supply synchronization', 'Peak-season throughput', 'Repeatable operating standards across BIG facilities'],
      knownPainPoints: [
        'Bottling yards absorb concentrate, packaging, and outbound coordination failures first',
        'Peak-season bottler volume surges overwhelm manual dock and yard processes',
        'Shared inbound facilities create cascading delays across multiple operators',
        'Execution variance at the yard undermines otherwise strong planning systems',
      ],

      communicationStyle: 'Bottling operator with enterprise scope. Talk about physical execution, not abstract transformation language.',
      languagePreferences: ['bottling', 'end-to-end', 'throughput', 'execution', 'supply synchronization'],
      connectionHooks: [
        'BIG role means he owns the yards Coca-Cola directly controls',
        'Prior regional CSCO scope proves he understands network-scale execution, not just one plant',
        'His background is supply-chain-heavy enough to discuss dock, staging, and trailer flow directly',
      ],
    },
    {
      personaId: 'coke-eppert',
      name: 'Mark Eppert',
      firstName: 'Mark',
      lastName: 'Eppert',
      title: 'Chief Financial and Supply Chain Officer, Coca-Cola North America',
      company: 'The Coca-Cola Company',
      email: 'meppert@coca-cola.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Finance / Supply Chain',

      currentMandate: 'Lead North America financial performance and supply-chain stewardship across the United States and Canada',
      strategicPriorities: ['Growth with disciplined stewardship', 'North America supply productivity', 'Finding hidden opportunities', 'Cross-functional finance and supply-chain alignment'],
      knownPainPoints: [
        'Detention and dwell leak directly into North America cost structure',
        'Hidden yard variance creates unintended downstream consequences',
        'Peak-season throughput pressure compounds into both cost and service misses',
        'Working-capital drag grows when trailer turns and staging cycles slow down',
      ],

      communicationStyle: 'Finance and supply-chain executive. Lead with cost, service, and capital together, then show the operating lever underneath.',
      languagePreferences: ['performance', 'stewardship', 'growth', 'hidden opportunities', 'operational leadership'],
      connectionHooks: [
        'Atlanta-based North America role is local to MODEX',
        'Public descriptions of his role emphasize both financial management and supply leadership',
        'He is one of the few executives who feels yard waste in both the P&L and the operating cadence',
      ],
      modexProximity: 'Atlanta-based North America leadership role. MODEX is effectively local.',
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
      stakeStatement: `Consolidated reported $14M in detention. That is one bottler. Your system has ${COCA_COLA_FACILITY_COUNT_LABEL} facilities. The number nobody has added up is the one that would get the most attention in your next board meeting.`,

      heroOverride: {
        headline: 'Daniel, you came from the bottling side. You know what those yards look like in July.',
        subheadline: `Coca-Cola Consolidated's $14M in detention costs is public record. That is one bottler. Your system runs ${COCA_COLA_FACILITY_COUNT_LABEL} facilities. YardFlow gives you the system-wide yard protocol your bottler network has never had.`,
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'cta'],

      toneShift: 'He came from bottling operations. He is not a procurement strategist who has never seen a dock. Talk to him like an operator who now has system-wide authority. Concrete, specific, reference the physical reality he knows.',
      kpiLanguage: ['detention cost', 'system-wide efficiency', 'bottler coordination', 'turn time', 'peak season throughput'],
      proofEmphasis: 'The $14M CCBCC detention number is public. Use it. The 48-to-24 min stat maps directly to his system.',
    },
    {
      person: {
        personaId: 'coke-jadhav',
        name: 'Dinesh Jadhav',
        firstName: 'Dinesh',
        lastName: 'Jadhav',
        title: 'Chief Supply Chain Officer, Bottling Investments Group',
        company: 'The Coca-Cola Company',
        email: 'dijadhav@coca-cola.com',
        roleInDeal: 'operator-buyer',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Dinesh Jadhav - BIG Supply Chain',
      variantSlug: 'dinesh-jadhav',

      framingNarrative: 'Dinesh, BIG owns the bottling reality that corporate strategy can only describe. When concentrate, packaging, and outbound trailer flow fall out of sync, the delay is physical before it is digital. You have run end-to-end supply chains across multi-market bottling environments. The fastest lever left is not another planning layer. It is making trailer-to-dock execution deterministic at the yards Coca-Cola actually controls.',
      openingHook: 'You run the bottling side directly. The yard problem shows up in your world first.',
      stakeStatement: 'BIG does not get to blame an independent bottler when dock turns slip. When a yard backs up, the operating company absorbs the service miss, the labor drag, and the peak-season scramble.',

      heroOverride: {
        headline: 'Dinesh, bottling execution breaks at the yard before it shows up in service or cost.',
        subheadline: 'Your role sits where concentrate plants, packaging supply, and bottler operations meet. YardFlow gives BIG a repeatable execution protocol for the yards it directly controls instead of another manual exception process.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'proof', 'network-map', 'cta'],

      toneShift: 'Operator-to-operator. He lives in bottling execution, not just HQ theory. Talk about concentrate flow, dock sequencing, and peak-season throughput.',
      kpiLanguage: ['throughput', 'dock turns', 'bottling execution', 'staging', 'peak readiness'],
      proofEmphasis: 'Lead with repeatability across beverage facilities. The 48-to-24 minute turn-time improvement matters because BIG owns the operating consequence directly.',
    },
    {
      person: {
        personaId: 'coke-eppert',
        name: 'Mark Eppert',
        firstName: 'Mark',
        lastName: 'Eppert',
        title: 'Chief Financial and Supply Chain Officer, Coca-Cola North America',
        company: 'The Coca-Cola Company',
        email: 'meppert@coca-cola.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Finance / Supply Chain',
      },
      fallbackLane: 'cfo',
      label: 'Mark Eppert - NA Finance & Supply Chain',
      variantSlug: 'mark-eppert',

      framingNarrative: 'Mark, very few executives carry both the North America P&L and the supply chain. That means the yard problem lands on your desk twice: once as service friction and again as cost leakage. Detention, dwell, and staging variance are exactly the kind of hidden opportunities and unintended consequences your role is built to surface.',
      openingHook: 'North America feels the yard problem in both the P&L and the supply plan.',
      stakeStatement: 'Detention and dwell are not just operating issues. They are one of the few leaks that hits cost, service, and working capital at the same time across the North America network.',

      heroOverride: {
        headline: 'Mark, North America feels the yard problem in both the P&L and the supply plan.',
        subheadline: 'You oversee financial performance and supply-chain stewardship for Coca-Cola North America. YardFlow gives you a measurable way to remove hidden dock and yard waste before it compounds into detention cost and missed service.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'roi', 'cta'],
      sectionOverrides: [
        {
          sectionType: 'stakes',
          override: {
            headline: 'The cost leak North America feels but never sees in one line',
            narrative: 'Detention, dwell, trailer staging delay, and dock contention typically sit in different operating reports. That is why the yard problem hides. But for the executive carrying both finance and supply chain, it is one leak expressed in three ways: avoidable cost, avoidable service risk, and avoidable working-capital drag.',
          },
        },
      ],

      toneShift: 'Numbers first, but still operationally grounded. Show how one execution protocol changes cost, service, and capital together.',
      kpiLanguage: ['detention cost', 'service risk', 'working capital', 'dock turn time', 'North America productivity'],
      proofEmphasis: 'Lead with the public $14M detention number and then convert the 48-to-24 minute turn-time improvement into a North America operating and financial story.',
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

  roiModel: {
    sourceOfTruth: 'shared-engine',
    calculatorVersion: 'ROI Calculator V2 public contract',
    scenarioLabel: `Conservative ${COCA_COLA_FACILITY_COUNT}-facility Coca-Cola bottler network model using the lower-bound system footprint already documented in research`,
    averageMarginPerShipment: 125,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 10 },
      { archetype: 'drops-no-yms', facilityCount: 36 },
      { archetype: 'without-drops', facilityCount: 24 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 155 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 120 },
      { archetype: 'without-drops', shipmentsPerDay: 40 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: COCA_COLA_FACILITY_COUNT,
        unit: 'facilities',
        sourceNoteId: 'coke-network-footprint',
      },
      {
        label: 'Public detention anchor',
        value: 14_000_000,
        unit: 'USD/year',
        sourceNoteId: 'coke-detention-anchor',
      },
      {
        label: 'Average margin per shipment',
        value: 125,
        unit: 'USD/shipment',
        sourceNoteId: 'coke-margin-estimate',
      },
      {
        label: 'Archetype mix',
        value: '10 with YMS, 36 drops no YMS, 24 without drops',
        sourceNoteId: 'coke-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'coke-network-footprint',
        label: 'Lower-bound Coca-Cola system footprint',
        detail: `The flagship microsite uses Coca-Cola Consolidated's disclosed 60 distribution centers and 10 manufacturing plants as the official ${COCA_COLA_FACILITY_COUNT_LABEL} site lower bound for the modeled bottler footprint.`,
        confidence: 'public',
        citation: 'src/lib/data/facility-facts.json',
      },
      {
        id: 'coke-detention-anchor',
        label: 'CCBCC detention and demurrage anchor',
        detail: 'Coca-Cola Consolidated publicly disclosed a $14M detention and demurrage figure, which remains the external cost anchor for the Coca-Cola flagship ROI story.',
        confidence: 'public',
        citation: 'docs/research-dossiers-top10.md',
      },
      {
        id: 'coke-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is kept materially below the public calculator default to stay conservative relative to bottler economics and mixed beverage routes.',
        confidence: 'estimated',
      },
      {
        id: 'coke-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Facility mix is inferred from a system made up of large bottler sites, company-owned concentrate operations, and smaller facilities still running local dock practices.',
        confidence: 'inferred',
        citation: 'src/lib/data/facility-facts.json',
      },
    ],
  },

  network: {
    facilityCount: COCA_COLA_FACILITY_COUNT_LABEL,
    facilityTypes: ['Concentrate Plants', 'Bottling Facilities', 'Distribution Centers', 'Cold Storage'],
    geographicSpread: 'National - Atlanta HQ, Consolidated (14 states plus DC, 70 disclosed sites), Reyes, Liberty (NYC), Swire (Western US)',
    dailyTrailerMoves: '15,000+ system-wide during peak',
    peakMultiplier: '1.4x during summer',
    fleet: 'Estimated 15,000+ trucks through bottling system',
    keyFacilities: [
      { name: 'Coca-Cola HQ', location: 'Atlanta, GA', type: 'Headquarters', significance: 'Literally in Atlanta, same city as MODEX', yardRelevance: 'Proximity = easiest meeting scheduling possible' },
      { name: 'CCBCC Bottler Footprint', location: '14 states plus DC', type: '10 Manufacturing Plants + 60 Distribution Centers', significance: 'Largest U.S. Coca-Cola bottler disclosed 70 sites in its 2025 10-K', yardRelevance: '$14M detention costs documented in 10-K' },
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
