import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const GENERAL_MILLS_FACILITY_COUNT_LABEL = getFacilityCountLabel('General Mills', '41');
const GENERAL_MILLS_FACILITY_COUNT = getFacilityCountLowerBound('General Mills', 41) ?? 41;

// LEGACY SECTIONS (preserved for reference — M3.2-M3.6 may lift prose into memo sections)
/*
 * [
 *     {
 *       type: 'hero',
 *       headline: 'You closed 3 plants. The remaining facilities just absorbed all that volume. Your yards were not designed for this.',
 *       subheadline: 'General Mills is consolidating production into fewer, higher-throughput facilities. The $82M restructuring makes the plants more competitive. YardFlow makes the yards keep pace.',
 *       accountCallout: `${GENERAL_MILLS_FACILITY_COUNT_LABEL} owned plants, 18,000 supply chain employees, 4 temperature zones`,
 *       backgroundTheme: 'dark',
 *       cta: {
 *         type: 'meeting',
 *         headline: 'See what a standardized yard network looks like for General Mills',
 *         subtext: '30-minute walk-through of your facility network with board-ready ROI.',
 *         buttonLabel: 'Book a Network Audit',
 *         calendarLink: BOOKING_LINK,
 *       },
 *     },
 *     {
 *       type: 'problem',
 *       sectionLabel: 'The Hidden Constraint',
 *       headline: 'The yard is where your consolidation math breaks down',
 *       narrative: 'When you move volume from 3 closing Missouri plants into remaining facilities, every trailer metric gets worse at the receiving end. Longer queues. More dock contention. More temperature-zone conflicts. The plant floor got the $82M investment. The yard got the overflow.',
 *       painPoints: [
 *         {
 *           headline: 'Facility consolidation = yard congestion',
 *           description: 'Closing 3 Missouri plants means remaining facilities absorb more volume. More trailers in the yard, longer dock queues, greater scheduling complexity, higher demurrage.',
 *           kpiImpact: 'Remaining facilities handling 15-25% more trailer volume',
 *           source: 'Oct 2025 restructuring announcement, $82M charges',
 *           relevantPeople: ['gm-gallagher', 'gm-ness'],
 *         },
 *         {
 *           headline: 'Four temperature zones, one yard',
 *           description: 'Cheerios (ambient), Pillsbury (frozen), Haagen-Dazs (ultra-cold), Yoplait (refrigerated) all compete for dock doors at multi-category facilities. A trailer left sitting in summer heat with ice cream inside is a quality event.',
 *           kpiImpact: 'Temperature-zone dock conflicts at every multi-category facility',
 *           relevantPeople: ['gm-underwood', 'gm-bracey'],
 *         },
 *         {
 *           headline: 'Seasonal demand spikes compound the problem',
 *           description: 'Baking season (Oct-Dec) drives 30-50% throughput surges. Snack season follows. Pet food is steady but high volume. Every spike hits the yard before it hits the production line.',
 *           kpiImpact: '30-50% volume surges at key facilities during peak',
 *           relevantPeople: ['gm-bracey', 'gm-stolpestad'],
 *         },
 *         {
 *           headline: 'Carrier satisfaction at risk',
 *           description: 'General Mills relies on contract carriers, not owned fleet. Drivers who experience long wait times deprioritize your loads when capacity tightens. In a driver-shortage environment, yard efficiency is carrier relationship management.',
 *           kpiImpact: 'Carrier deprioritization during tight capacity markets',
 *           relevantPeople: ['gm-ahsanullah', 'gm-bracey'],
 *         },
 *         {
 *           headline: 'New Belvidere DC needs it from day one',
 *           description: 'The state-of-the-art Belvidere, IL distribution center opened April 2024 as a Midwest hub. New facility, new yard operations, no legacy processes to unlearn. The perfect greenfield deployment.',
 *           source: 'April 2024 facility opening',
 *           relevantPeople: ['gm-ness', 'gm-stolpestad'],
 *         },
 *       ],
 *     },
 *     {
 *       type: 'stakes',
 *       sectionLabel: 'What This Costs You',
 *       headline: 'The math General Mills is not tracking in one place',
 *       narrative: 'Paul Gallagher\'s HMM program drove gross margin up 230 basis points. That margin expansion is partially eaten by yard inefficiency that sits across 12+ GL codes. Detention, dwell, gate labor, dock contention, temperature-zone misrouting. It adds up to a number that would get board attention if it were visible.',
 *       annualCost: '$8M-$12M in estimated yard-driven inefficiency across the network',
 *       costBreakdown: [
 *         { label: 'Carrier detention / demurrage', value: '$4M+' },
 *         { label: 'Dock contention (temp-zone conflicts)', value: '$3M+' },
 *         { label: 'Gate and spotter labor overhead', value: '$2M+' },
 *         { label: 'Seasonal surge inefficiency', value: '$2M+' },
 *       ],
 *       urgencyDriver: 'Missouri plant closures phasing through 2026. Remaining facilities absorbing more volume right now.',
 *     },
 *     {
 *       type: 'solution',
 *       sectionLabel: 'The Fix',
 *       headline: 'One protocol across every General Mills yard',
 *       narrative: 'YardFlow replaces the patchwork of local yard practices with a single standardized operating protocol. The same driver journey at Belvidere that runs at Cedar Rapids. The same dock assignment logic at Covington that runs at Hannibal. Variance dies. Throughput becomes calculable.',
 *       modules: [
 *         { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID verification, algorithmic lane direction.', relevanceToAccount: `Standardizes the gate process across ${GENERAL_MILLS_FACILITY_COUNT_LABEL} facilities that today all do it differently.` },
 *         { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter app for move execution and task queues. No more radio dispatching.', relevanceToAccount: 'Eliminates temperature-zone dock assignment errors. Frozen goes to frozen. Every time.' },
 *         { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location, dwell, and lane state.', relevanceToAccount: 'Complements General Mills\' Palantir digital twin - extends supply chain visibility to the yard surface.' },
 *         { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view with alerting and cross-site performance intelligence.', relevanceToAccount: `Gives the supply chain team visibility across all ${GENERAL_MILLS_FACILITY_COUNT_LABEL} yard operations. One screen.` },
 *       ],
 *       accountFit: 'General Mills already built a Palantir digital twin for supply chain visibility. YardFlow fills the gap at the physical execution layer - the yard - where the digital twin has no eyes.',
 *     },
 *     {
 *       type: 'proof',
 *       sectionLabel: 'Proof from Live Deployment',
 *       headline: 'Running today across 24 facilities',
 *       proofVisual: {
 *         type: 'before-after',
 *         headline: 'What happens when consolidation volume hits a standardized yard',
 *         narrative: 'The restructuring only creates a margin win if the receiving yards absorb the extra trailer pressure without creating a new dock bottleneck. That requires one operating standard, not 41 local workarounds.',
 *         beforeAfter: {
 *           before: {
 *             label: 'Today',
 *             description: 'Belvidere, Cedar Rapids, Covington, and the rest of the network each absorb consolidation volume with different gate flow, temperature-zone dispatch rules, and dock-office habits.',
 *           },
 *           after: {
 *             label: 'With YardFlow',
 *             description: 'One protocol gives every facility the same move logic, dock evidence trail, and temperature-zone guardrails so extra throughput does not become extra yard chaos.',
 *           },
 *         },
 *       },
 *       liveDeployment: {
 *         headline: 'Already proven in high-throughput CPG networks',
 *         summary: 'The operating model is live today in multi-site CPG environments where dock-office teams took on additional volume while remaining headcount neutral. That is the exact posture General Mills needs as remaining facilities absorb more trailers.',
 *         badges: ['24 facilities live', '>200 network contracted', 'Headcount-neutral dock office'],
 *       },
 *       methodology: 'Proof metrics reflect measured truck-turn compression, dock-office leverage, and multi-site rollout performance in comparable CPG networks.',
 *       blocks: [
 *         {
 *           type: 'metric',
 *           stats: [
 *             { value: '24', label: 'Facilities Live', context: 'Running the full YardFlow protocol today' },
 *             { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout' },
 *             { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
 *             { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured across live deployments' },
 *             { value: '30 min', label: 'Remote Deployment', context: 'From zero to live at a new facility' },
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
 *       headline: 'General Mills\' yard network at scale',
 *       narrative: 'General Mills\' 41 owned plants form the operating core of a broader yard network. Different gate processes, different spotter dispatch methods, different tribal knowledge. The Belvidere DC opened with a clean slate. The Cedar Rapids plant has had the same gate process for 20 years. YardFlow gives you one standard across the operating core.',
 *       facilityCount: GENERAL_MILLS_FACILITY_COUNT_LABEL,
 *       facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Co-packing Facilities'],
 *       geographicSpread: 'US, Canada, and select international - Cedar Rapids IA, Buffalo NY, Wellston OH, Murfreesboro TN, Covington GA, Hannibal MO, Joplin MO, Belvidere IL',
 *       dailyTrailerMoves: '4,400+ across the network',
 *       peakMultiplier: '1.3-1.5x during baking season (Oct-Dec)',
 *     },
 *     {
 *       type: 'roi',
 *       sectionLabel: 'The Business Case',
 *       headline: 'Conservative ROI model for General Mills',
 *       narrative: `Based on ${GENERAL_MILLS_FACILITY_COUNT} facilities, current industry-average turn times, and measured YardFlow improvements at comparable CPG sites.`,
 *       roiLines: [
 *         { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
 *         { label: 'Carrier detention per facility', before: '$80K/yr', after: '$40K/yr', delta: '-$40K', unit: 'per site' },
 *         { label: 'Temp-zone dock errors', before: '3-5/week', after: '<1/week', delta: '-80%', unit: 'per facility' },
 *         { label: 'Gate labor per facility', before: '2.5 FTE', after: '1.5 FTE', delta: '-1 FTE', unit: 'per site' },
 *       ],
 *       totalAnnualSavings: '$8M-$12M across the network',
 *       paybackPeriod: '< 6 months',
 *       methodology: 'Based on measured results at 24 live CPG facilities extrapolated to General Mills facility count and operational profile.',
 *     },
 *     {
 *       type: 'testimonial',
 *       sectionLabel: 'From an Operator Who Runs It',
 *       quote: 'We believe system-driven dock door assignment will be a valuable next step for dock office optimization.',
 *       role: 'Operations Director',
 *       company: 'National CPG Manufacturer',
 *       context: 'After 12 months of full YardFlow deployment across their facility network.',
 *     },
 *     {
 *       type: 'cta',
 *       cta: {
 *         type: 'meeting',
 *         headline: 'See what a standardized yard network looks like for General Mills',
 *         subtext: 'We map your top 3 facilities, identify the throughput constraint, and build a board-ready rollout plan.',
 *         buttonLabel: 'Book a Network Audit',
 *         calendarLink: BOOKING_LINK,
 *       },
 *       closingLine: 'One conversation. Your yard network. A clear path to $10M+ in annual savings.',
 *     },
 *   ]
 */

export const generalMills: AccountMicrositeData = {
  slug: 'general-mills',
  accountName: 'General Mills',
  coverHeadline: 'The yard layer above Accelerate',
  titleEmphasis: 'above Accelerate',
  parentBrand: 'General Mills, Inc.',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'B',
  priorityScore: 88,

  pageTitle: 'YardFlow for General Mills - Yard Network Standardization',
  metaDescription: `How YardFlow eliminates the yard bottleneck across General Mills' ${GENERAL_MILLS_FACILITY_COUNT_LABEL}-plant manufacturing network.`,

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about General Mills\' network',
      composition: [
        { label: 'Plant footprint', value: `${GENERAL_MILLS_FACILITY_COUNT_LABEL} owned plants — anchor sites: Cedar Rapids, Covington, Belvidere, Hannibal` },
        { label: 'Temperature zones in play', value: 'Ambient (Cheerios) · Frozen (Pillsbury) · Refrigerated (Yoplait) · Ultra-cold (Häagen-Dazs)' },
        { label: 'Daily trailer moves', value: '4,400+ across the network' },
        { label: 'Peak multiplier', value: '1.3-1.5x during baking season (Oct-Dec)' },
        { label: 'Carrier model', value: 'Contract carriers and 3PL — no private fleet' },
        { label: 'Active restructuring', value: '$82M program closing 3 Missouri plants through 2026' },
        { label: 'Accelerate coverage seam', value: 'Five-year strategy framing — boldly build · relentlessly innovate · unleash scale · stand for good. Planning, forecast, the Palantir digital twin, and warehouse automation already operate to a single Accelerate standard. The yard surface above the plants is the one operating layer the strategy has not yet reached' },
        { label: 'HMM productivity program', value: 'Holistic Margin Management lifted from a ~4% historical annual savings rate to an industry-leading ~5% in recent years on the back of digital supply-chain investment — fiscal 2026 targets ~5% HMM savings, ~$100M reinvested in brand. The published productivity engine; the question is whether yard-driven cost variance is currently inside its accounting scope or sitting in the GL codes it does not touch' },
        { label: 'CSCO transition', value: 'Paul Gallagher departed February 2026 for 3M; Jonathan Ness named CSCO effective March 16, 2026 after serving interim from late January. ~20-year General Mills tenure across Supply Chain Strategy, Global Finance, Manufacturing, Procurement, and Transformation. Reports to CEO Jeff Harmening' },
      ],
      hypothesis:
        'Two pressures meet at the yard at the same time. First, the Missouri plant closures push remaining facilities into 15-25% more trailer volume right now — the production lines absorbed the $82M investment, the yards did not. Second, the Palantir digital twin gives end-to-end supply chain visibility everywhere except the dock surface, so the closer the network gets to running on a single operating picture, the more the yard layer stands out as the one place still on local routines.\n\nStack four temperature zones competing for the same dock doors at multi-category sites, and the yard becomes the surface where consolidation math, the HMM productivity program, and the Accelerate operating discipline all stop translating into measured dollars. HMM has already lifted from a ~4% historical savings rate to ~5% on the back of digital supply-chain investment — the engine is running faster than it ever has, which means the cost variance that sits outside its accounting scope is the part of the savings curve that no longer self-resolves. Yard-driven cost (detention, dwell, gate labor, dock contention, temperature-zone misrouting) sits across 12+ GL codes and rarely surfaces as a single line item the HMM scorecard can act on.\n\nThe third thing is the CSCO transition itself. Paul Gallagher\'s "Run, Improve, Transform" framework already covered planning, forecast, the Palantir digital twin, and warehouse automation. Jonathan Ness inherits the framework and the FY2026 reset — softer top line, sharper cost discipline — into seat as of March 16, 2026, with ~20 years of internal tenure across Supply Chain Strategy, Global Finance, Manufacturing, Procurement, and Transformation. That mix is unusual: the new CSCO\'s background is the cost-and-transformation seam where a yard-layer operating model lands cleanly, and the timing is the cleanest 12-month window in a decade for a new operating-layer addition that does not relitigate the existing Run/Improve/Transform map. Belvidere stays the obvious greenfield first deployment; Cedar Rapids stays the hardest-tested brownfield candidate where twenty years of local routine has to be rewritten.',
      pullQuote: 'The closer the network gets to running on a single operating picture, the more the yard layer stands out as the one place still on local routines.',
      caveat:
        'This is built from public filings, the 2025 Global Responsibility Report, the March 2026 CSCO announcement, the CAGNY 2026 Accelerate progress update, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing on detention spend, dock-zone discipline, how much existing YMS coverage is already in place across the 41 plants, and which yard-cost line items the HMM program already counts versus the ones it does not.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Accelerate operating layer',
      artifact: {
        imageSrc: '/artifacts/general-mills-coverage-map.svg',
        imageAlt: 'Accelerate coverage map. Six tiles representing the General Mills operating surfaces touched by the Accelerate strategy. HMM Productivity, Palantir Digital Twin, Forecast & Planning, Warehouse Automation, and Stand for Good are covered. The Yard Network Ops tile is unfilled, marked with a General Mills blue hairline outline.',
        caption: 'Accelerate operating-layer coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Accelerate strategy, HMM productivity, Palantir digital twin, and Stand for Good disclosures. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), and shipped across multi-temp (premium SKUs sit alongside ambient). Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level operating model on top of existing site-level yard systems. The General Mills operating profile is shape-similar — multi-site, multi-temp, contract-carrier-dependent, 41 plants under one Accelerate strategy — with significantly more forgiving freight economics per trailer (cereal and refrigerated yogurt do not weight-out at the same intensity as water). The translation that matters for General Mills is integration shape, not category: Primo is the proof that a network operating model lands on top of mature planning, forecast, and digital-twin investment without disrupting the existing stack — exactly the move Accelerate now needs as Missouri consolidation pushes more volume through fewer plants and as HMM\'s ~5% savings curve runs out of room inside the cost lines it already counts.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline: '30-60 days from kickoff to first measurable impact at the pilot site. Belvidere is the cleanest greenfield candidate; Cedar Rapids is the hardest-tested brownfield candidate. The first 60-day proof is what earns the right to author the yard-layer entry into the Accelerate operating standard the same way HMM and the Palantir digital twin entered it.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'gm-public-footprint',
          source: 'General Mills 2025 Global Responsibility Report',
          confidence: 'public',
          detail: `Anchors the ${GENERAL_MILLS_FACILITY_COUNT_LABEL} owned-plant figure used as the modeled facility count. Network composition references public 10-K disclosures and the Belvidere DC announcement.`,
        },
        {
          id: 'gm-restructuring-disclosure',
          source: 'October 2025 restructuring disclosure ($82M charges, 3 Missouri plant closures)',
          confidence: 'public',
          detail: 'Source for the consolidation pressure narrative. Volume reallocation percentage is inferred from the closing footprint relative to network plant count.',
        },
        {
          id: 'gm-accelerate-cagny-2026',
          source: 'CAGNY February 2026 — Accelerate strategy progress update',
          confidence: 'public',
          detail: 'Five-year Accelerate framing (boldly build · relentlessly innovate · unleash scale · stand for good), FY2026 outlook reset (organic net sales down 1.5–2%, adjusted operating profit down 16–20% constant currency), and the recommitment to digital supply-chain investment as the productivity engine. The operating-discipline frame the yard layer has to fit inside.',
        },
        {
          id: 'gm-hmm-productivity',
          source: 'General Mills HMM productivity disclosures',
          confidence: 'public',
          detail: 'Holistic Margin Management run rate lifted from a ~4% historical annual savings rate to an industry-leading ~5% in recent years on the back of digital supply-chain investment. FY2026 targets ~5% HMM savings and ~$100M reinvested in brand; FY2027 outlook is ≥4% as digital investment returns accelerate. The productivity engine the yard-layer business case has to be sized inside.',
        },
        {
          id: 'gm-ness-tenure',
          source: 'Jonathan Ness — public tenure and CSCO appointment record (March 2026)',
          confidence: 'public',
          detail: 'Named Chief Supply Chain Officer effective March 16, 2026 after serving as interim CSCO from late January following Paul Gallagher\'s February 2026 departure to 3M. ~20 years at General Mills with leadership roles across Supply Chain Strategy, Global Finance, Manufacturing, Procurement, and Transformation. Reports to CEO Jeff Harmening; joined the company\'s Senior Leadership Team. The cost-and-transformation seam in his background is the seat where a yard-layer operating model is the cleanest next entry into the Accelerate map.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These are not General Mills-specific — they describe the conditions most multi-site networks operate under.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Real detention spend by lane and carrier — we estimate, you measure',
        'How much of the 41-plant network is already on a YMS vs. radio-and-clipboard',
        'Where temperature-zone misassignment events concentrate today (which plants, which shifts)',
        'How the Missouri closures are actually being absorbed at the receiving plants — paper plan vs. shift-floor reality',
        'The exact yard-cost line items already inside the HMM program scope vs. still uncounted — and whether yard variance currently surfaces in the FY2026 productivity scorecard or gets absorbed elsewhere',
        'Whether the CSCO transition has paused or accelerated any in-flight Run/Improve/Transform operating-layer additions — and where a yard-layer entry sequences against the inherited roadmap',
        'Whether the Palantir digital twin already ingests yard-state data from any of the 41 plants in a way the network-level operator can act on, or whether the dock surface stops at the warehouse door for the twin today',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. General Mills is distinctive in this round because the operating-system thinking is already on the floor — HMM for productivity, the Palantir digital twin for visibility, warehouse automation at the four-plus sites, planning and forecast at Accelerate cadence. The yard is the one operating layer the strategy has not yet reached. The Run/Improve/Transform framing Paul Gallagher built remains the simplest way to describe where the yard layer actually sits — the part of "Transform" the digital twin cannot see yet — and Jonathan Ness inherits both the framework and the FY2026 reset into seat. This brief sizes that gap, not the site-level work under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Jonathan — the part most worth pushing back on is whether the cost-and-transformation seam you carried through ~20 years of General Mills tenure (Supply Chain Strategy, Global Finance, Manufacturing, Procurement, Transformation) already counts yard-driven variance inside the HMM scorecard you inherit, or whether it sits in the GL codes the productivity engine does not touch yet. That answer reshapes the rest of this. The Missouri consolidation, the four-zone dock contention, and the assumption that the yard layer is still 41 different routines under one Accelerate strategy are the next things to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  // ── THE PEOPLE ──────────────────────────────────────────────────────
  people: [
    {
      personaId: 'gm-ness',
      name: 'Jonathan Ness',
      firstName: 'Jonathan',
      lastName: 'Ness',
      title: 'Chief Supply Chain Officer',
      company: 'General Mills',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      reportsTo: 'Jeff Harmening (Chairman & CEO)',
      directReports: '18,000+ supply chain employees',

      currentMandate: `Owns global supply chain operations across ${GENERAL_MILLS_FACILITY_COUNT_LABEL} owned plants. Effective March 16, 2026 after serving interim CSCO from late January following Paul Gallagher\'s February 2026 departure to 3M. ~20 years General Mills tenure spanning Supply Chain Strategy, Global Finance, Manufacturing, Procurement, and Transformation.`,
      strategicPriorities: ['HMM productivity acceleration', 'Digital supply-chain investment returns', 'Missouri consolidation absorption', 'Accelerate operating-discipline standardization'],
      operationalPhilosophy: 'Inherits the Run/Improve/Transform framework; cost-and-transformation seam in background.',
      knownPainPoints: [
        'FY2026 reset — softer top line, sharper cost discipline expected',
        'Missouri plant closures pushing more volume through fewer sites',
        'Multi-temperature logistics across 4 zones',
        'HMM savings curve running out of room inside the GL lines already counted',
        'Inherits the Accelerate operating standard mid-cycle',
      ],
      speakingTopics: ['Supply chain transformation', 'HMM productivity', 'Manufacturing operations', 'Procurement strategy', 'Digital supply chain'],

      communicationStyle: 'Internal-tenure CSCO — fluent in the cross-functional language of the Accelerate map. Cost discipline, transformation, manufacturing, and procurement vocabulary all live in his background.',
      languagePreferences: ['cost savings', 'HMM', 'productivity', 'transformation', 'operating discipline', 'Run/Improve/Transform'],
      avoidTopics: ['Generic AI hype', 'Technology-first positioning', 'Unproven ROI claims'],
      connectionHooks: ['~20-year General Mills internal tenure', 'Cost-and-transformation cross-functional background', 'Senior Leadership Team member, reports directly to Jeff Harmening'],

      bestIntroPath: 'Direct outreach to CSCO office. If delegated, target VP Logistics / VP Network Operations or the digital supply-chain lead who owns the HMM productivity scorecard.',
    },
    {
      personaId: 'gm-gallagher',
      name: 'Paul Gallagher',
      firstName: 'Paul',
      lastName: 'Gallagher',
      title: 'Group President, Enterprise Supply Chain (3M) — former CSCO, General Mills',
      company: '3M',
      roleInDeal: 'influencer',
      seniority: 'C-level',
      function: 'Supply Chain',

      currentMandate: 'Author of the Run/Improve/Transform framework at General Mills (CSCO June 2021–February 2026); departed February 2026 for 3M. Framework and HMM productivity step-change remain the inherited operating standard.',
      strategicPriorities: ['(Historical) Digital transformation', '(Historical) Cost savings via HMM', '(Historical) Facility consolidation'],
      operationalPhilosophy: 'Run, Improve, and Transform',
      publicQuotes: [
        {
          text: 'AI transformation revolves around people at all stages of the journey',
          source: 'NA Supply Chain Executive Summit 2024, keynote "The People-Centric Approach to AI"',
          relevanceToYardFlow: 'The Run/Improve/Transform framework Jonathan Ness inherits — yard layer is the part of Transform the digital twin cannot see yet.',
        },
      ],
      connectionHooks: ['Top 30 Leaders in Supply Chain 2025 award', 'Palantir digital twin champion', 'Author of the inherited Accelerate operating standard'],

      bestIntroPath: 'No longer at General Mills. Historical-context reference only.',
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
        personaId: 'gm-ness',
        name: 'Jonathan Ness',
        firstName: 'Jonathan',
        lastName: 'Ness',
        title: 'Chief Supply Chain Officer',
        company: 'General Mills',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Jonathan Ness - CSCO',
      variantSlug: 'jonathan-ness',

      framingNarrative:
        'Jonathan, the seat you took on March 16, 2026 is the cleanest 12-month window in a decade to lay one more tile into the Accelerate operating standard. Paul Gallagher\'s Run/Improve/Transform framework already covered planning, forecast, the Palantir digital twin, and warehouse automation — and your ~20 years inside General Mills span exactly the cost-and-transformation seam (Supply Chain Strategy, Global Finance, Manufacturing, Procurement, Transformation) where a yard-layer operating model lands cleanly. The HMM productivity curve has lifted from a ~4% historical rate to ~5%, which is industry-leading and also means the savings inside the GL lines already counted are running out of room. The yard-driven cost variance that sits across 12+ GL codes — detention, dwell, gate labor, dock contention, temperature-zone misrouting — is exactly the kind of line item HMM has not had a way to act on yet, and it is the natural next entry into the productivity scorecard you now own.',
      openingHook:
        'The Accelerate strategy already runs to a single standard for planning, forecast, the Palantir digital twin, and warehouse automation. The yard layer above the 41 plants is the operating surface it has not yet reached — and the productivity engine you inherit is the one place inside General Mills where that gap shows up as a sized number.',
      stakeStatement:
        'Two things are open simultaneously and they are not always open together. The Missouri consolidation is pushing 15-25% more trailer volume through the receiving plants right now, on a $82M restructuring envelope that funded the plants and not the yards. And the FY2026 reset — softer top line, sharper cost discipline — makes the HMM productivity scorecard the most-watched number on your inherited roadmap, at the moment its savings curve runs out of room inside the cost lines already counted. The yard-layer entry into the operating standard lands cleanest now, before either window closes.',

      heroOverride: {
        headline: 'The Accelerate tile no one has filled yet is the yard network operating layer.',
        subheadline: `Planning, forecast, the Palantir digital twin, warehouse automation, and Stand for Good already operate to one Accelerate standard. The yard surface above the ${GENERAL_MILLS_FACILITY_COUNT_LABEL} plants — where Missouri consolidation lands, where four-zone dock contention compounds, and where HMM\'s next savings slice lives — is the unfilled tile.`,
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer internal-tenure framing. Ness is a 20-year General Mills lifer; he does not need the company\'s strategy explained back to him. Acknowledge the existing operating layer (HMM, Palantir, planning, forecast, warehouse automation) as the strategy doing its job — it is. Position the wedge as the next layer above what already runs to one standard, not as a critique of what is in place. The cost-and-transformation seam in his background is the language register; lead with productivity scorecard math, GL-code coverage, and operating-standard sequencing rather than carrier-experience anecdotes.',
      kpiLanguage: [
        'HMM productivity',
        'operating discipline',
        'cost savings',
        'GL-code coverage',
        'dock-door utilization',
        'trailer dwell',
        'transformation',
        'Run/Improve/Transform',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same multi-site multi-temp shape, harder freight (water), already running the network-level operating layer above existing site-level systems. The "headcount-neutral while absorbing more volume" quote is the proof shape that maps to the Missouri-consolidation absorption problem he inherits.',
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
        subheadline: 'General Mills depends on contract carriers. Every minute of excess dwell time degrades the relationship. When capacity tightens, the carriers who were treated well get served first. YardFlow cuts your drop-and-hook turn times in half.',
      },
      sectionOrder: ['hero', 'problem', 'proof', 'solution', 'comparison', 'network-map', 'cta'],
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
            { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: `Network command. All ${GENERAL_MILLS_FACILITY_COUNT_LABEL} sites on one screen.` },
          ],
        },
      ],

      toneShift: 'Operator-to-operator. Plant floor language. Throughput, dock utilization, shift handoffs, production schedule adherence. No abstractions.',
      kpiLanguage: ['dock utilization', 'throughput per shift', 'temperature-zone compliance', 'shift handoff time', 'production schedule adherence'],
      proofEmphasis: 'The protocol as product story. He cares about process standardization, not dashboards.',
    },
    {
      person: {
        personaId: 'gm-bracey',
        name: 'Zoe Bracey',
        firstName: 'Zoe',
        lastName: 'Bracey',
        title: 'Logistics and Customer Operations Business Leader - North American Retail',
        company: 'General Mills',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Logistics / Customer Operations',
      },
      fallbackLane: 'logistics',
      label: 'Zoe Bracey - Customer Operations',
      variantSlug: 'zoe-bracey',

      framingNarrative: 'Zoe, you live on the customer-facing side of the network, where service levels are felt externally and every late trailer becomes a retail problem. The yard matters to you because seasonal surges, carrier coordination, and dock sequence all decide whether the outbound promise holds when volume spikes.',
      openingHook: 'Retail service levels start breaking in the yard before the customer ever sees the miss.',
      stakeStatement: 'When baking-season and snack-season surges hit, General Mills does not just need more throughput. It needs predictable outbound execution so retail customers do not absorb the chaos created upstream at the dock.',

      heroOverride: {
        headline: 'Zoe, the customer promise breaks at the dock before it breaks on the shelf.',
        subheadline: 'You own the part of the network where service levels become visible. Seasonal surges, carrier coordination, and outbound dock timing all compress into one moment in the yard. YardFlow makes that moment more predictable.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'comparison', 'roi', 'cta'],
      addSections: [
        {
          type: 'comparison',
          sectionLabel: 'Customer Impact',
          headline: 'What the retail network feels today vs. with YardFlow',
          rows: [
            { dimension: 'Peak-season outbound readiness', before: 'Volume surge creates dock queue risk', after: 'Priority sequencing protects outbound flow' },
            { dimension: 'Carrier coordination', before: 'Manual calls and reactive rescheduling', after: 'System-managed dock and yard sequence' },
            { dimension: 'Retail service-level exposure', before: 'Late trailer becomes late customer delivery', after: 'Earlier exception detection and cleaner handoff' },
            { dimension: 'Site-to-site consistency', before: 'Each facility handles surge differently', after: 'One protocol across the network' },
          ],
        },
      ],

      toneShift: 'Customer-operations oriented. Tie logistics execution to service levels, retail outcomes, and seasonal surge control instead of abstract network transformation.',
      kpiLanguage: ['service levels', 'customer operations', 'seasonal surge', 'outbound readiness', 'carrier coordination'],
      proofEmphasis: 'Use the headcount-neutral and measured turn-time proof to show that better yard discipline protects the outbound promise without adding operating overhead.',
      avoidPhrases: ['warehouse-only optimization', 'internal ops win with no customer consequence'],
    },
    {
      person: {
        personaId: 'gm-stolpestad',
        name: 'Lars Stolpestad',
        firstName: 'Lars',
        lastName: 'Stolpestad',
        title: 'Customer Service Facility Manager',
        company: 'General Mills',
        roleInDeal: 'routing-contact',
        seniority: 'Manager',
        function: 'Facility Operations',
      },
      fallbackLane: 'ops',
      label: 'Lars Stolpestad - Facility Operations',
      variantSlug: 'lars-stolpestad',

      framingNarrative: 'Lars, you are close enough to the floor to feel every bad gate process, every dock scheduling miss, and every peak-day yard backup in real time. This page is not about enterprise transformation. It is about giving the facility a repeatable operating rhythm when volume stacks up outside the door.',
      openingHook: 'If the gate process is messy, the rest of the shift starts behind and stays behind.',
      stakeStatement: 'Peak-day yard congestion is not a theory at the facility level. It is a shift-by-shift drag on dock flow, team coordination, and customer service. The value of YardFlow is that it turns those recurring exceptions into a standard process.',

      heroOverride: {
        headline: 'Lars, facility performance slips the moment the gate and dock fall out of rhythm.',
        subheadline: 'Gate processes, dock scheduling, and yard visibility determine whether the facility starts the shift clean or spends the day chasing exceptions. YardFlow gives the site one reliable operating sequence.',
      },
      sectionOrder: ['hero', 'problem', 'solution', 'proof', 'timeline', 'cta'],
      addSections: [
        {
          type: 'timeline',
          sectionLabel: 'Facility Rollout',
          headline: 'What a practical site deployment looks like',
          steps: [
            { week: 'Week 1', title: 'Observe the current gate-to-dock flow', description: 'Map how drivers arrive, how the gate queues form, and where dock scheduling breaks during a normal shift.' },
            { week: 'Week 2', title: 'Configure the site protocol', description: 'Set the gate sequence, dock priority rules, temperature-zone constraints, and exception handling for the facility.' },
            { week: 'Week 3', title: 'Run live with the team', description: 'Go live with a workflow the team can actually follow during peak-day pressure, not just in a clean demo.' },
            { week: 'Week 4+', title: 'Standardize the next site', description: 'Carry the same operating sequence into the next facility with less local reinvention.' },
          ],
        },
      ],

      toneShift: 'Practical facility-operations language. Focus on gate process, dock rhythm, shift cleanliness, and recurring daily exceptions.',
      kpiLanguage: ['gate process', 'dock scheduling', 'yard congestion', 'shift flow', 'facility execution'],
      proofEmphasis: 'Lead with the simple operational proof: less queueing, faster turn time, and a system the local team can run consistently during peak days.',
      avoidPhrases: ['board-ready transformation narrative', 'generic executive value'],
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live' },
        { value: '>200', label: 'Contracted Network' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)' },
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

  roiModel: {
    sourceOfTruth: 'shared-engine',
    calculatorVersion: 'ROI Calculator V2 public contract',
    scenarioLabel: `Conservative ${GENERAL_MILLS_FACILITY_COUNT}-facility General Mills network model using the researched facility lower bound and published daily-move estimates`,
    averageMarginPerShipment: 400,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 11 },
      { archetype: 'drops-no-yms', facilityCount: 20 },
      { archetype: 'without-drops', facilityCount: 10 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 160 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 115 },
      { archetype: 'without-drops', shipmentsPerDay: 35 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: GENERAL_MILLS_FACILITY_COUNT,
        unit: 'facilities',
        sourceNoteId: 'gm-network-footprint',
      },
      {
        label: 'Modeled daily trailer moves',
        value: 4_410,
        unit: 'moves/day',
        sourceNoteId: 'gm-daily-moves',
      },
      {
        label: 'Average margin per shipment',
        value: 400,
        unit: 'USD/shipment',
        sourceNoteId: 'gm-margin-estimate',
      },
      {
        label: 'Archetype mix',
        value: '11 with YMS, 20 drops no YMS, 10 without drops',
        sourceNoteId: 'gm-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'gm-network-footprint',
        label: 'General Mills public network footprint',
        detail: `General Mills is modeled using the official lower bound from the 2025 Global Responsibility Report, which states that the company operates ${GENERAL_MILLS_FACILITY_COUNT_LABEL} owned plants around the world.`,
        confidence: 'public',
        citation: 'src/lib/data/facility-facts.json',
      },
      {
        id: 'gm-daily-moves',
        label: 'Daily trailer-move baseline',
        detail: 'Daily moves are weighted to roughly 4,400 trailer moves per day so the modeled archetypes stay aligned with a smaller, higher-throughput 41-plant General Mills footprint.',
        confidence: 'estimated',
        citation: 'src/lib/microsites/accounts/general-mills.ts',
      },
      {
        id: 'gm-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is set below the public calculator default to keep the General Mills pilot scenario conservative until a live audit validates product-mix economics.',
        confidence: 'estimated',
      },
      {
        id: 'gm-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Archetype counts are inferred from a more concentrated General Mills network: a smaller number of larger sites with existing systems, plus a wider group of drop-trailer yards and local-process facilities.',
        confidence: 'inferred',
      },
      {
        id: 'gm-yms-penetration',
        label: 'Existing system penetration',
        detail: 'Warehouse automation and the Palantir digital twin are public, but no dedicated yard-system footprint is publicly disclosed. The pilot therefore assumes partial existing system penetration rather than full network standardization.',
        confidence: 'inferred',
        citation: 'docs/research/paul-gallagher-generalmills-dossier.md',
      },
    ],
  },

  network: {
    facilityCount: GENERAL_MILLS_FACILITY_COUNT_LABEL,
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'Co-packing Facilities'],
    geographicSpread: 'US, Canada - Cedar Rapids IA, Buffalo NY, Wellston OH, Murfreesboro TN, Covington GA, Hannibal MO, Joplin MO, Belvidere IL',
    dailyTrailerMoves: '4,400+ across network',
    peakMultiplier: '1.3-1.5x during baking season',
    fleet: 'Contract carriers and 3PL (no private fleet)',
    keyFacilities: [
      { name: 'Belvidere DC', location: 'Belvidere, IL', type: 'Distribution Center', significance: 'State-of-the-art Midwest hub, opened April 2024', yardRelevance: 'Greenfield - no legacy processes, ideal first deployment' },
      { name: 'Cedar Rapids Plant', location: 'Cedar Rapids, IA', type: 'Manufacturing', significance: 'Major cereal production facility' },
      { name: 'Covington Plant', location: 'Covington, GA', type: 'Manufacturing', significance: 'Near Atlanta (~35 miles)', yardRelevance: 'Proximity to Atlanta metro — natural early pilot site' },
    ],
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: '4,400+ across network',
    peakSeason: 'Baking season (Oct-Dec), snack season (summer)',
    keyRoutes: ['Midwest plants to national DCs', 'Belvidere IL hub to East/West', 'Blue Buffalo separate network'],
    specialRequirements: ['Multi-temperature (ambient, frozen, refrigerated, ultra-cold)', 'Heavy palletized loads (cereal, flour)'],
  },

  signals: {
    eventAttendance: 'General Mills is a major CPG with Covington, GA facility near Atlanta',
    recentNews: [
      'Jonathan Ness named Chief Supply Chain Officer effective March 16, 2026; ~20-year internal tenure spanning Supply Chain Strategy, Global Finance, Manufacturing, Procurement, and Transformation. Reports to CEO Jeff Harmening',
      'Paul Gallagher departed February 2026 to become 3M group president of enterprise supply chain',
      'CAGNY February 2026 — Accelerate strategy progress update; FY2026 organic net sales now expected down 1.5–2%, adjusted operating profit down 16–20% in constant currency',
      'HMM productivity program lifted from ~4% historical annual savings rate to ~5% industry-leading rate; FY2026 targets ~5% HMM savings, ~$100M reinvested in brand',
      '$82M restructuring - 3 Missouri plant closures phasing through 2026',
      'Belvidere, IL DC opened April 2024 as Midwest hub',
      'Warehouse automation at 4+ locations with more in progress',
      'Palantir digital twin for supply chain visibility',
    ],
    supplyChainInitiatives: ['Accelerate strategy operating standard', 'HMM productivity acceleration', 'Digital twin (Palantir)', 'Warehouse automation expansion', 'Sustainability / Scope 3'],
    competitivePressure: 'Peer CPG competitors investing in supply chain digitization',
    urgencyDriver: 'CSCO transition March 2026 + Missouri plant closures absorbing volume through 2026 — cleanest 12-month window in a decade to add one more tile to the Accelerate operating standard',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Accelerate strategy', body: 'Boldly build · relentlessly innovate · unleash scale · stand for good.' },
    { mark: 'CSCO transition', body: 'Jonathan Ness · effective March 16, 2026 · ~20-year General Mills tenure · reports to Jeff Harmening.' },
    { mark: 'HMM productivity', body: '~4% historical → ~5% industry-leading. FY2026 ~$100M reinvested in brand.' },
    { mark: 'Restructuring', body: '$82M program · 3 Missouri plants closing through 2026.' },
    { mark: 'Greenfield', body: 'Belvidere IL DC · opened April 2024 · Midwest hub, no legacy yard habits.' },
    { mark: 'Gallagher in his own words', body: 'Run, Improve, and Transform. The yard is the part of Transform the digital twin cannot see yet — the framework Jonathan Ness inherits.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/general-mills.m4a',
    intro:
      'This brief is for Jonathan Ness. The Run / Improve / Transform framework you inherit already covers planning, forecast, the Palantir digital twin, and warehouse automation. The roughly 39 minutes that follow are about the one operating layer the Accelerate strategy has not yet reached — the yard surface above the 41 plants.',
    chapters: [
      { id: 'thesis', label: 'The unfilled tile in the Accelerate operating standard', start: 0 },
      { id: 'observation', label: 'Where Missouri consolidation and the digital twin both land on the yard', start: 465 },
      { id: 'comparable', label: 'Primo Brands — same multi-temp shape, harder freight', start: 930 },
      { id: 'methodology', label: 'How the brief was built — and where to push back', start: 1395 },
      { id: 'about', label: 'HMM\'s next savings slice and the cleanest 12-month window', start: 1859 },
    ],
    generatedAt: '2026-05-14T23:55:00Z',
  },

  theme: {
    accentColor: '#003DA5',
    backgroundVariant: 'dark',
  },
};
