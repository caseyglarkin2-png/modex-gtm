/**
 * Dannon (Danone North America) — ABM Microsite Data
 * Quality Tier: A (Phase 6A A+ overhaul — May 2026)
 * WARM INTRO ONLY — via Mark Shaughnessy
 * NEVER cold email or cold outreach
 *
 * Pitch shape: coexistence wedge (network-level operating layer *above*
 * plant-level yard routines), not displacement.
 * Angle: YARD MANAGEMENT (multi-temp dock arbitration, trailer dwell,
 * shelf-clock burn, network OEE) tied to fresh-dairy quality and
 * the Renew Danone productivity ledger — NOT driver experience.
 *
 * Decision-maker: Heiko Gerling, COO Danone Americas (named June 2025).
 *  - 25+ years FMCG ops; Kraft Heinz MD 2014-2019 (the 3G-era
 *    operating-discipline-first culture), Aryzta MD 2019-2021,
 *    return to Danone 2021. SVP Global Operations Excellence
 *    2024-Jun 2025. MBA U. of Cooperative Education, Mannheim.
 *  - Public Sept 2025 Supply Chain Magazine interview framed
 *    resilience as "structure, plans, agility, and foresight."
 *  - Scope: manufacturing, logistics, customer service, procurement,
 *    S&OP, quality and food safety — broader than a typical CSCO.
 *
 * Sources (this file's hand-authored prose):
 *   - docs/research/heiko-gerling-dannon-dossier.md
 *   - Renew Danone strategy disclosures (2025-2028 chapter)
 *   - Danone Climate Transition Plan (Dec 2023)
 *   - Microsoft AI Academy partnership announcements (2024-2025)
 *   - Minster OH plant expansion (Aug 2025)
 *   - Jacksonville FL $65M line + new Southeast DC (Jun 2025)
 */

import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const DANNON_FACILITY_COUNT_LABEL = getFacilityCountLabel('Dannon', '13');
const DANNON_FACILITY_COUNT = getFacilityCountLowerBound('Dannon', 13) ?? 13;

// LEGACY SECTIONS (preserved for reference — M3.2-M3.6 may lift prose into memo sections)
/*
 * [
 *     {
 *       type: 'hero',
 *       headline: 'Fresh dairy has a 14-day shelf clock. Every hour your trailers wait in the yard is product life you never get back.',
 *       subheadline: `Danone runs ${DANNON_FACILITY_COUNT_LABEL} North American production facilities across dairy, plant-based, medical nutrition, and water. Four temperature profiles competing for dock doors at every multi-category facility. YardFlow standardizes the yard across all of them.`,
 *       accountCallout: 'Danone North America - Fresh Dairy, Plant-Based, Medical Nutrition, Waters',
 *       backgroundTheme: 'dark',
 *       cta: {
 *         type: 'meeting',
 *         headline: 'See what a standardized yard looks like for Danone',
 *         subtext: '30-minute walk-through of your facility network with board-ready ROI. Routed through Mark Shaughnessy.',
 *         buttonLabel: 'Request an Introduction',
 *         calendarLink: BOOKING_LINK,
 *       },
 *     },
 *     {
 *       type: 'problem',
 *       sectionLabel: 'The Hidden Constraint',
 *       headline: 'The yard is where Danone\'s product freshness commitment breaks down',
 *       narrative: 'Danone North America produces fresh dairy, plant-based products, and medical nutrition - all with tight shelf life windows. When a refrigerated trailer sits an extra 30 minutes in the yard during summer, product quality degrades. The yard is not just a logistics problem. It is a quality problem.',
 *       painPoints: [
 *         {
 *           headline: 'Temperature-controlled yard dwell erodes shelf life',
 *           description: `Danone moves fresh and chilled dairy products across ${DANNON_FACILITY_COUNT_LABEL} plants. Reefer trailers sitting in yards without visibility into dock readiness means product shelf life burns before the case is even picked. At dairy margins, that dwell is measurable in shrink dollars.`,
 *           kpiImpact: '$3M-$5M in annual shrink exposure from excess yard dwell across the fresh network',
 *           relevantPeople: ['P-001', 'P-002', 'P-004', 'P-005'],
 *         },
 *         {
 *           headline: 'Plant-level yard protocols fragment cross-facility visibility',
 *           description: `Each Danone production facility runs its own gate, dock, and spotter coordination. When the White Plains supply chain team wants a network view of trailer utilization or dock throughput, they are stitching together spreadsheets from ${DANNON_FACILITY_COUNT_LABEL} different local teams.`,
 *           kpiImpact: 'Zero real-time network visibility across the yard layer',
 *           relevantPeople: ['P-001', 'P-002', 'P-004', 'P-005'],
 *         },
 *         {
 *           headline: 'Carrier detention costs compound across the fresh network',
 *           description: 'Fresh dairy carriers operate on tight appointment windows. When dock contention pushes wait times past the threshold, detention charges hit every facility individually. No one is tracking the aggregate network-level carrier cost.',
 *           kpiImpact: '$2M+ in annual detention and accessorial charges across the network',
 *           relevantPeople: ['P-001', 'P-002', 'P-003', 'P-005'],
 *         },
 *       ],
 *     },
 *     {
 *       type: 'stakes',
 *       sectionLabel: 'What This Costs You',
 *       headline: 'The freshness math Danone is not tracking in one place',
 *       narrative: `Every minute of excess yard dwell time at a Danone facility is a minute off product shelf life. Across ${DANNON_FACILITY_COUNT_LABEL} facilities producing perishable goods, that time compounds into quality events, carrier dissatisfaction, and hidden costs distributed across dozens of GL codes.`,
 *       annualCost: '$5M-$8M in estimated yard-driven inefficiency across the North America network',
 *       costBreakdown: [
 *         { label: 'Product shrink from yard dwell on perishables', value: '$3M-$5M' },
 *         { label: 'Carrier detention / demurrage across fresh network', value: '$2M+' },
 *         { label: `Gate and spotter labor overhead (${DANNON_FACILITY_COUNT_LABEL} facilities)`, value: '$1M+' },
 *         { label: 'Temperature-zone dock misassignment events', value: '$500K+' },
 *       ],
 *       urgencyDriver: 'Fresh dairy and plant-based products have zero tolerance for yard-induced delays. Every season compounds the problem.',
 *     },
 *     {
 *       type: 'solution',
 *       sectionLabel: 'The Fix',
 *       headline: 'One protocol across every Danone yard',
 *       narrative: 'YardFlow replaces the patchwork of local yard practices with a single standardized operating protocol. Temperature-zone dock assignment enforced automatically. Freshness-critical loads prioritized. Same driver journey at every facility.',
 *       modules: [
 *         { id: 'flowDRIVER', name: 'flowDRIVER', verb: 'Verify', shortDescription: 'Digital driver check-in to check-out. QR + wallet ID verification, algorithmic lane direction.', relevanceToAccount: `Standardizes the gate process across ${DANNON_FACILITY_COUNT_LABEL} Danone facilities.` },
 *         { id: 'flowSPOTTER', name: 'flowSPOTTER', verb: 'Execute', shortDescription: 'Spotter app for move execution and task queues. Temperature-zone aware.', relevanceToAccount: 'Enforces temp-zone dock assignment. Fresh dairy goes to refrigerated. Every time.' },
 *         { id: 'flowTWIN', name: 'flowTWIN', verb: 'Map', shortDescription: 'Digital twin of the yard. Real-time trailer location, dwell, and lane state.', relevanceToAccount: 'Visibility into dwell time for perishable loads. Freshness clock starts in the yard.' },
 *         { id: 'flowNETWORK', name: 'flowNETWORK', verb: 'Scale', shortDescription: 'Network-wide command view with alerting and cross-site performance intelligence.', relevanceToAccount: 'One view across all Danone North America yard operations.' },
 *       ],
 *       accountFit: 'Primo proof should land hardest here because both are high-volume food / beverage-style networks with plant throughput pressure.',
 *     },
 *     {
 *       type: 'proof',
 *       sectionLabel: 'Proof from Live Deployment',
 *       headline: 'Running today across 24 facilities',
 *       blocks: [
 *         {
 *           type: 'metric',
 *           stats: [
 *             { value: '24', label: 'Facilities Live', context: 'Running the full YardFlow protocol today' },
 *             { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout' },
 *             { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
 *             { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured across live deployments' },
 *           ],
 *         },
 *         {
 *           type: 'quote',
 *           quote: {
 *             text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
 *             role: 'Operations Director',
 *             company: 'National CPG/Beverage Manufacturer',
 *           },
 *         },
 *       ],
 *     },
 *     {
 *       type: 'network-map',
 *       sectionLabel: 'Your Network',
 *       headline: 'Danone North America\'s yard network',
 *       narrative: 'Every facility runs its own yard protocol today. YardFlow gives Danone one standard across all of them - with temperature-zone intelligence built in.',
 *       facilityCount: DANNON_FACILITY_COUNT_LABEL,
 *       facilityTypes: ['Dairy Production', 'Plant-Based Production', 'Water Operations', 'Distribution Centers'],
 *       geographicSpread: 'North America',
 *       dailyTrailerMoves: '1,000+ across the network',
 *     },
 *     {
 *       type: 'roi',
 *       sectionLabel: 'The Business Case',
 *       headline: 'Conservative ROI model for Danone North America',
 *       narrative: 'Based on measured YardFlow improvements at comparable fresh food/beverage operations.',
 *       roiLines: [
 *         { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '-50%', unit: 'minutes' },
 *         { label: 'Carrier detention per facility', before: '$80K/yr', after: '$40K/yr', delta: '-$40K', unit: 'per site' },
 *         { label: 'Temp-zone dock errors', before: '3-5/week', after: '<1/week', delta: '-80%', unit: 'per facility' },
 *         { label: 'Gate labor per facility', before: '2.5 FTE', after: '1.5 FTE', delta: '-1 FTE', unit: 'per site' },
 *       ],
 *       totalAnnualSavings: '$5M-$8M across the network',
 *       paybackPeriod: '< 6 months',
 *       methodology: 'Based on measured results at 24 live CPG facilities extrapolated to Danone facility count and operational profile.',
 *     },
 *     {
 *       type: 'testimonial',
 *       sectionLabel: 'From an Operator Who Runs It',
 *       quote: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
 *       role: 'Operations Director',
 *       company: 'National CPG/Beverage Manufacturer',
 *       context: 'After 12 months of full YardFlow deployment across their facility network.',
 *     },
 *     {
 *       type: 'cta',
 *       cta: {
 *         type: 'meeting',
 *         headline: 'Danone is a warm introduction through Mark Shaughnessy',
 *         subtext: 'This conversation is routed through a trusted mutual connection. 30 minutes to walk your yard network.',
 *         buttonLabel: 'Request an Introduction',
 *         calendarLink: BOOKING_LINK,
 *       },
 *       closingLine: 'One conversation. Your yard network. A clear path to $5M+ in annual freshness-protected savings.',
 *     },
 *   ]
 */

export const dannon: AccountMicrositeData = {
  slug: 'dannon',
  accountName: 'Dannon',
  coverHeadline: 'The yard tile Renew Danone has not filled yet',
  titleEmphasis: 'Renew Danone has not filled yet',
  coverFootprint: '13 US plants · Jacksonville hub 2026',
  parentBrand: 'Danone North America',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 95,

  pageTitle: 'YardFlow for Danone North America - Network-Level Yard Operating Model',
  metaDescription:
    'How a network-level yard operating model lands on top of plant-level yard practices across Danone North America\'s 13 U.S. plants — completing the operating-system surface Renew Danone and the Microsoft AI partnership already touch.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Danone North America network',
      composition: [
        { label: 'U.S. production footprint', value: `${DANNON_FACILITY_COUNT_LABEL} owned plants plus ~9 contract manufacturers across CA, CO, FL, ID, IN, NY, NC, OH, PA, TX, UT, VA — the operating-system surface Renew Danone and the Microsoft AI Academy already touch, and the yard layer above the sites does not` },
        { label: 'Greenfield deployment site', value: 'Jacksonville FL Southeast distribution hub — new node going live alongside the $65M International Delight / STōK line; the cleanest single yard standard to design from go-live' },
        { label: 'Active expansion', value: 'Minster OH +48,000 sq ft and 60% more milk volume over the next two years (Oikos +40% YoY in 2024) — more throughput-out-the-door through largely the same dock surface' },
        { label: 'Operating-system anchors', value: 'Renew Danone (LFL +3-5%, COGS productivity as an explicit pillar) and the Microsoft AI Academy (20,000 staff trained by 2026, extending to 100,000 globally, with predictive maintenance, performance analytics, real-time logistics adjustments already in scope) — yard-network ops is the tile neither one currently fills' },
        { label: 'Existing yard-tech layer', value: 'No public reference to a network-level YMS. Plant-level routines vary site by site; the White Plains supply chain team stitches a network view from 13 local protocols and ~9 co-manufacturer protocols on top' },
        { label: 'Temperature-profile mix', value: 'Four zones competing for the same dock surface at multi-category sites — refrigerated fresh dairy (Activia, Oikos, Dannon), refrigerated plant-based (Silk, So Delicious), refrigerated coffee/creamer (International Delight, STōK), and ambient premium water (evian, Volvic, imported)' },
        { label: 'Freshness clock', value: 'Fresh dairy ~14-day shelf life from production; every minute of yard dwell comes out of at-shelf life. Quality and food safety report up through the COO — yard dwell is a quality problem before it is a logistics-cost problem' },
        { label: 'Scope 3 logistics commitment', value: 'Logistics = 8% of Danone group GHG · -42% Scope 3 non-FLAG by 2030 vs. 2020 baseline · -90% by 2050 — truck idle in the yard is a directly attributable, measurable line item against an existing public commitment' },
      ],
      hypothesis:
        'Each plant in the Danone North America network runs its own gate, dock, and spotter routine today. Each routine works. The site-level case for keeping the trailer flow moving was paid back years ago, plant by plant, the way fresh-network plants have always paid back their own dock investments. What it has not become, after thirteen owned plants and nine contract manufacturers, is a network operating model. Each site optimizes its own door priority, its own multi-temp arbitration, its own driver experience. The network does not agree with itself on what good looks like — and that is the part Renew Danone cannot fix from the productivity ledger and the Microsoft AI Academy cannot fix from the plant floor.\n\nThat gap got more expensive over the last two years for three reasons. First, Oikos sales rose 40% in 2024, which is why Minster needs 60% more milk through largely the same dock surface over the next two years; the building got more capable, the yard around it did not. Second, fresh dairy carries a 14-day shelf clock that starts before the case is picked, so a 45-minute reefer delay in July becomes shrink, service recovery, and a retailer chargeback in the same week. Third, Danone group has publicly committed to -42% Scope 3 non-FLAG by 2030 and named logistics as 8% of total emissions; truck idle in the yard is the most directly attributable, measurable line item against that commitment, and right now nobody is counting it as such.\n\nThe third thing is the pilot question itself. The new Jacksonville Southeast distribution hub is going live alongside the $65M International Delight / STōK production line. New distribution facilities typically run 15-25% below optimal dock utilization in their first 12-18 months as standard operating procedures get worked out. That makes Jacksonville the cleanest single place to embed a yard standard before the local routine gets locked in — not the marquee Mount Crawford plant, not the Minster expansion, not the 13-site rip-and-replace pitch. The proof at Jacksonville is what earns the right to operate the layer above Mount Crawford, Minster, and the co-manufacturer network in the second wave.',
      pullQuote: 'The network does not agree with itself on what good looks like.',
      caveat:
        'This is built from public Danone disclosures, the Sept 2025 Supply Chain Magazine interview, the Microsoft partnership announcements, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do is push back on whether the yard layer is already more standardized than we think, whether the Jacksonville hub project has already locked in a yard design, and how Minster and Mount Crawford are absorbing throughput growth at the dock today.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/dannon-coverage-map.svg',
        imageAlt: 'Operating-system coverage map. Six tiles representing Danone North America operating-system domains. Renew Productivity, Microsoft AI Academy, S&OP, Quality & Food Safety, and Scope 3 Logistics are covered. The Yard Network Ops tile is unfilled, marked with a Danone-blue hairline outline.',
        caption: 'Operating-system coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Renew Danone, Microsoft AI Academy, and Climate Transition Plan disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you cannot recover with price), and shipped across multi-temp (premium spring and alkaline SKUs sit alongside ambient). Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Danone North America operating profile is similar in shape — multi-site, multi-temp, 3PL-dependent, premium-import water inside the mix — but with significantly more forgiving freight economics per trailer and a 14-day fresh-dairy clock that makes shrink the leading indicator instead of margin per case. Primo runs the operating layer Renew Danone is shaped to host — same coordinates, harder freight.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30-60 days from kickoff to first measurable impact at the pilot site. The cleanest place this lands first is not the marquee Mount Crawford plant or the Minster expansion — it is the new Jacksonville Southeast distribution hub, where the yard standard can be embedded before local routines lock in and the displacement risk is closest to zero. Mount Crawford, Minster, and the co-manufacturer network are the second wave once the operating model has its first 60-day proof. We would expect the network to make sense of itself within two to four quarters of that first pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'danone-public-footprint',
          source: 'Danone North America company overview',
          confidence: 'public',
          detail: `Danone North America states it operates ${DANNON_FACILITY_COUNT_LABEL} production facilities, plus ~9 contract manufacturing partners. Anchors the footprint, category mix, and the Mount Crawford / Minster / Jacksonville / Fort Worth / DuBois / City of Industry / Bridgeton / Springfield plant set.`,
          url: 'https://www.danonenorthamerica.com/about-us/',
        },
        {
          id: 'gerling-interview-2025',
          source: 'Supply Chain Magazine — "The Supply Chain Interview: Heiko Gerling" (Sept 2025)',
          confidence: 'public',
          detail: 'Heiko\'s first major external interview after the June 2025 COO appointment. Themes: supply-chain resilience as "structure, plans, agility, and foresight," in-country manufacturing (90% of Danone US products made in-country), digital tools and automation as resilience levers. The resilience framing is the COO\'s own language.',
        },
        {
          id: 'renew-danone',
          source: 'Renew Danone strategy (2025-2028 chapter)',
          confidence: 'public',
          detail: 'LFL net sales growth target +3% to +5%; recurring operating income to grow faster than net sales; "record productivity" cited in FY2024 earnings as a margin lever; COGS productivity is an explicit strategy pillar.',
        },
        {
          id: 'microsoft-ai-academy',
          source: 'Danone × Microsoft AI partnership disclosures',
          confidence: 'public',
          detail: 'Multi-year partnership announced 2024. AI Academy targeting 20,000 staff trained by 2026 (extended to 100,000 globally). Manufacturing-side use cases: predictive maintenance, performance analytics, predictive forecasting, real-time logistics adjustments. Autonomous agents deployed for order-to-cash. Driven globally by Vikram Agarwal; applied in NA by the operations org.',
        },
        {
          id: 'minster-expansion',
          source: 'Minster OH plant expansion (Aug 2025)',
          confidence: 'public',
          detail: '~48,000 sq ft addition · 30 new full-time jobs · 60% more milk required over the next two years · driven by Oikos sales +40% YoY in 2024. More throughput-out-the-door, same dock surface — the textbook yard-as-constraint pattern.',
        },
        {
          id: 'jacksonville-expansion',
          source: 'Jacksonville FL $65M production line + new Southeast DC (June 2025)',
          confidence: 'public',
          detail: 'Ribbon-cut June 17, 2025. 30% reduction in bottle loss via new molding process. 200 jobs locally. New Southeast distribution hub under construction in the Jacksonville area — net-new yard operations to design from go-live, the closest Danone NA gets to a greenfield embed.',
        },
        {
          id: 'climate-transition-plan',
          source: 'Danone Climate Transition Plan (Dec 2023)',
          confidence: 'public',
          detail: 'Scope 3 non-FLAG (Packaging, Logistics, Co-manufacturing) target: -42% by 2030 vs. 2020 baseline; -90% by 2050. Logistics named as 8% of total Danone GHG. Logistics decarbonization levers Danone names: warehouse energy efficiency, route optimization, modal shift, fuel switching. Yard idle is the most directly attributable line item Danone does not yet count separately.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site fresh-network operators face today, not Danone specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'gerling-tenure',
          source: 'Heiko Gerling — public tenure record',
          confidence: 'public',
          detail: '25+ years FMCG operations leadership across Germany, France, and the United States. First Danone stint 2005-2013. Managing Director, Central & North & East Europe at Kraft Heinz (Nov 2014 - Apr 2019) — the 3G-era operating-discipline-first culture. Managing Director Germany / Austria / Poland at Aryzta (May 2019 - May 2021). Return to Danone 2021. SVP Global Operations Excellence 2024 - June 2025. Named Chief Operations Officer, Danone Americas June 2025. MBA, University of Cooperative Education, Mannheim.',
          url: 'https://www.linkedin.com/in/heiko-gerling-a5066911/',
        },
      ],
      unknowns: [
        'Whether the Jacksonville Southeast DC project has already specified a yard design — and who owns it before the hub goes live',
        'Whether any of the 13 owned plants run a site-level YMS today (PINC, Kaleris, 4Site) that the network-level layer would sit above rather than replace',
        'How multi-temperature dock-door arbitration is decided today at Mount Crawford and Bridgeton — site policy, system logic, or operator judgment',
        'Whether the ~9 contract-manufacturing partners are inside or outside the standardization scope from day one',
        'Whether Renew Danone\'s COGS-productivity ledger already has a line item for yard-driven shrink and detention, or whether yard variance is currently absorbed into forecast error and quality recovery',
        'Where the Microsoft AI Academy\'s real-time logistics adjustments use case starts and stops — and whether yard-gate-to-dock data is in or out of that scope today',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. The Mark Shaughnessy intro path is the only outreach lane we are using here; nothing on this page is meant to bypass that. Danone is distinctive in this round because the operating-system thinking is already on the floor — Renew Danone for productivity, the Microsoft AI Academy for plant intelligence, the Climate Transition Plan for Scope 3 logistics, S&OP for plan-to-execute alignment. The yard is the one tile that has not yet caught the same operating discipline. This brief sizes that gap, not the site-level wins under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Heiko — the part most worth pushing back on is whether the operating-discipline-first instinct you carried through the Kraft Heinz Managing Director years has reached the yard layer at Danone yet, or whether it has reached planning, productivity, and the AI Academy and stopped one tile short. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-001',
      name: 'Heiko Gerling',
      firstName: 'Heiko',
      lastName: 'Gerling',
      title: 'Chief Operations Officer, North America',
      company: 'Dannon',
      email: 'heiko.gerling@danone.com',
      linkedinUrl: 'https://www.danonenorthamerica.com/about-us/our-leaders.html',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations / Supply Chain',
      currentMandate: 'Official Danone North America operations lead spanning manufacturing, logistics, customer service, procurement, and S&OP.',
      bestIntroPath: 'Mark -> Heiko / CSCO office',
    },
    {
      personaId: 'P-002',
      name: 'Whitney Klemm',
      firstName: 'Whitney',
      lastName: 'Klemm',
      title: 'Supply Chain Leader',
      company: 'Dannon',
      email: 'whitney.klemm@danone.com',
      linkedinUrl: 'https://www.linkedin.com/in/whitneyklemm',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate: 'Relevant Danone supply chain operator who can help triangulate the North America org.',
      bestIntroPath: 'Use intro to request proper routing if Heiko delegates',
    },
    {
      personaId: 'P-003',
      name: 'Jacqueline Beckman',
      firstName: 'Jacqueline',
      lastName: 'Beckman',
      title: 'Senior Procurement Manager',
      company: 'Dannon',
      email: 'jacqueline.beckman@danone.com',
      linkedinUrl: 'https://www.linkedin.com/in/jacqueline-vesey',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Procurement / Logistics',
      currentMandate: 'Procurement and supplier-side operator tied to the Danone network.',
      bestIntroPath: 'LinkedIn / network outreach',
    },
    {
      personaId: 'P-004',
      name: 'Annette Tolve',
      firstName: 'Annette',
      lastName: 'Tolve',
      title: 'Demand Planner',
      company: 'Dannon',
      email: 'annette.tolve@danone.com',
      linkedinUrl: 'https://www.linkedin.com/in/annette-tolve-40687b98',
      roleInDeal: 'influencer',
      seniority: 'VP',
      function: 'Planning / Customer Operations',
      currentMandate: 'Planning contact useful for S&OP and service-level angle.',
      bestIntroPath: 'LinkedIn / network outreach',
    },
    {
      personaId: 'P-005',
      name: 'Jay Luikart',
      firstName: 'Jay',
      lastName: 'Luikart',
      title: 'Operations Executive, Away From Home',
      company: 'Dannon',
      email: 'jay.luikart@danone.com',
      linkedinUrl: 'https://www.linkedin.com/in/jayluikart',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Plant / Site Operations',
      currentMandate: 'Public profile references Danone North America scope including manufacturing, logistics, warehousing, procurement, and S&OP.',
      bestIntroPath: 'LinkedIn / network outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-001',
        name: 'Heiko Gerling',
        firstName: 'Heiko',
        lastName: 'Gerling',
        title: 'Chief Operations Officer, North America',
        company: 'Dannon',
        email: 'heiko.gerling@danone.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Heiko Gerling - Chief Operations Officer',
      variantSlug: 'heiko-gerling',

      framingNarrative:
        'Heiko, the operating-discipline-first instinct you carried through the Kraft Heinz Managing Director years — uniform standards across every plant, every shift, every market — is the same instinct you brought back to Danone for productivity through Renew Danone and for plant intelligence through the Microsoft AI Academy. The yard is the tile that has not been laid into that operating system yet. Site-level routines work, plant by plant. The network operating layer above the sites is what Renew Danone\'s productivity ledger now needs, what the Climate Transition Plan\'s -42% Scope 3 commitment can attribute to, and what the AI Academy\'s real-time logistics adjustments use case is shaped to host.',
      openingHook:
        'Resilience as structure, plans, agility, and foresight — your phrase. At Danone NA it has reached planning, productivity, and the AI Academy. It has not yet reached the yard.',
      stakeStatement:
        'Minster needs 60% more milk over the next two years through largely the same dock surface. Oikos is up 40%. The Jacksonville Southeast hub is going live. Renew Danone has made COGS productivity an explicit pillar and the Climate Transition Plan has put a -42% number on logistics emissions. The gap between all of that and the trailer-into-the-yard reality is the network yard layer — and it is the only operating-system tile at Danone NA that is not yet running to a single standard.',

      heroOverride: {
        headline: 'The yard tile Renew Danone has not filled yet is the network operating layer above the plants.',
        subheadline:
          'Plant-level yard routines work at Danone NA. The network operating model above them — the one Renew Danone\'s productivity ledger now needs and the Climate Transition Plan\'s -42% Scope 3 commitment can attribute to — is the unfilled tile. The new Jacksonville Southeast hub is the cleanest place to embed it before local routines lock in; Mount Crawford and Minster are where it scales.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Heiko ran general-management P&Ls at Kraft Heinz and Aryzta before returning to Danone; he is wired to revenue and customer service, not just OEE. German dual-study background means American sales maximalism reads as low-credibility — be precise, be quantified, be willing to be wrong on specifics. Quote his own resilience language back at him only where it earns the quote. Acknowledge plant-level yard work as work — it is. Position the wedge as the layer above sites (network operating model), not as replacement of sites.',
      kpiLanguage: [
        'network OEE',
        'dock-door utilization',
        'trailer dwell',
        'shelf-clock burn',
        'multi-temp dock arbitration',
        'COGS productivity',
        'Scope 3 logistics',
        'carrier scorecard',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same network shape, harder freight (water), already running the network-level layer above site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic. Lead with the Jacksonville greenfield embed; the Minster expansion math is the urgency line.',
    },
    {
      person: {
        personaId: 'P-002',
        name: 'Whitney Klemm',
        firstName: 'Whitney',
        lastName: 'Klemm',
        title: 'Supply Chain Leader',
        company: 'Dannon',
        email: 'whitney.klemm@danone.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Whitney Klemm - Supply Chain Leader',
      variantSlug: 'whitney-klemm',

      framingNarrative: `Whitney, the supply chain team sees the network as plan, inventory, and service commitments. The yard is where those commitments become real trailer moves, and today that conversion still depends on local workarounds. If Danone wants one North America supply picture, the yard cannot stay as ${DANNON_FACILITY_COUNT_LABEL} separate site habits.`,
      openingHook: 'The supply plan is only as good as the dock sequence that actually happens.',
      stakeStatement: 'When the yard stays local and invisible, service variance enters the network looking like a planning issue instead of an execution issue. That is the layer this fixes.',

      heroOverride: {
        headline: 'Whitney, the supply chain team sees network metrics. The yard is the layer where those metrics break.',
        subheadline: `You can only standardize what the network can see. YardFlow turns ${DANNON_FACILITY_COUNT_LABEL} local yard routines into one visible, measurable supply layer for Danone North America.`,
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],

      toneShift: 'Network-oriented supply chain language. She is a routing and triangulation contact, so make it easy to see where the real operating owner should lean in.',
      kpiLanguage: ['truck turn time', 'dock utilization', 'throughput per shift', 'detention cost', 'carrier satisfaction'],
      proofEmphasis: `Emphasize one protocol across ${DANNON_FACILITY_COUNT_LABEL} facilities and visibility into the yard layer, not just site savings.`,
    },
    {
      person: {
        personaId: 'P-003',
        name: 'Jacqueline Beckman',
        firstName: 'Jacqueline',
        lastName: 'Beckman',
        title: 'Senior Procurement Manager',
        company: 'Dannon',
        email: 'jacqueline.beckman@danone.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Procurement / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Jacqueline Beckman - Senior Procurement Manager',
      variantSlug: 'jacqueline-beckman',

      framingNarrative: 'Jacqueline, carrier accessorials and supplier-side friction rarely look like a yard problem in the spreadsheet, but that is where they start. When reefer appointments slip, procurement pays for service unreliability that operations experienced hours earlier.',
      openingHook: 'Every detention invoice is a supplier-cost symptom of a yard process failure.',
      stakeStatement: 'The fastest way to strengthen carrier leverage is to remove the dock and yard delays that make Danone expensive to serve.',

      heroOverride: {
        headline: 'Jacqueline, every carrier detention charge at a Danone plant is a procurement problem hiding in the yard.',
        subheadline: 'If a carrier waits at the gate or the wrong reefer gets staged, procurement pays for an execution problem it did not create. YardFlow closes that gap.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],

      toneShift: 'Procurement and carrier-management language. Focus on accessorials, appointment discipline, and supplier trust.',
      kpiLanguage: ['turn time', 'detention cost', 'dwell time', 'on-time pickup', 'carrier satisfaction'],
      proofEmphasis: 'Use detention reduction and headcount-neutral volume absorption as procurement leverage, not just ops performance.',
    },
    {
      person: {
        personaId: 'P-004',
        name: 'Annette Tolve',
        firstName: 'Annette',
        lastName: 'Tolve',
        title: 'Demand Planner',
        company: 'Dannon',
        email: 'annette.tolve@danone.com',
        roleInDeal: 'influencer',
        seniority: 'VP',
        function: 'Planning / Customer Operations',
      },
      fallbackLane: 'ops',
      label: 'Annette Tolve - Demand Planner',
      variantSlug: 'annette-tolve',

      framingNarrative: 'Annette, S&OP can balance forecast, inventory, and service on paper. The yard is where those promises meet a live reefer, a real dock door, and a freshness clock that keeps moving. If the execution layer stays invisible to planning, the network keeps absorbing avoidable misses as if they were forecast error.',
      openingHook: 'The plan does not fail in the spreadsheet. It fails when the right trailer is not at the right refrigerated door.',
      stakeStatement: 'When the yard is invisible to planning, customer-service and freshness misses get misclassified as demand noise instead of execution delay.',

      heroOverride: {
        headline: 'Annette, the demand plan is only as good as the dock execution that fulfills it. The yard is the gap.',
        subheadline: 'S&OP does not stop at the appointment calendar. The refrigerated door sequence has to match the plan or freshness and service both slip.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],

      toneShift: 'Planning and customer-service language. Tie yard performance directly to schedule adherence and freshness-protected service.',
      kpiLanguage: ['truck turn time', 'dock utilization', 'throughput per shift', 'detention cost', 'carrier satisfaction'],
      proofEmphasis: 'Lead with schedule adherence, dock readiness, and the way YardFlow reduces execution noise that planning teams currently absorb downstream.',
    },
    {
      person: {
        personaId: 'P-005',
        name: 'Jay Luikart',
        firstName: 'Jay',
        lastName: 'Luikart',
        title: 'Operations Executive, Away From Home',
        company: 'Dannon',
        email: 'jay.luikart@danone.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Plant / Site Operations',
      },
      fallbackLane: 'ops',
      label: 'Jay Luikart - Operations Executive',
      variantSlug: 'jay-luikart',

      framingNarrative: 'Jay, the Away From Home business runs on tight appointments, mixed order profiles, and no tolerance for late docks. The yard is where that precision breaks first, especially when temperature-sensitive product shares space with the rest of the network.',
      openingHook: 'Away From Home lives on appointment precision. The yard is still treating it like a general queue.',
      stakeStatement: 'When the wrong trailer sits in the wrong lane for 20 extra minutes, the service failure is not abstract. It shows up as a missed delivery window and a frustrated customer account.',

      heroOverride: {
        headline: 'Jay, the Away From Home network runs on tight appointments. The yard is where appointment precision dies.',
        subheadline: 'Away From Home orders punish yard variance faster than retail replenishment does. YardFlow gives site teams a deterministic sequence instead of radio-driven guesswork.',
      },
      sectionOrder: ['hero', 'problem', 'stakes', 'proof', 'solution', 'network-map', 'roi', 'testimonial', 'cta'],

      toneShift: 'Field-operations language. He cares about appointment precision, warehouse flow, and what the site team has to do when the yard falls behind.',
      kpiLanguage: ['truck turn time', 'dock utilization', 'throughput per shift', 'detention cost', 'carrier satisfaction'],
      proofEmphasis: 'Lead with queue control, dock sequencing, and the ability to absorb more volume without adding dock-office headcount.',
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
        company: 'National CPG/Beverage Manufacturer',
      },
    },
  ],

  roiModel: {
    sourceOfTruth: 'shared-engine',
    calculatorVersion: 'ROI Calculator V2 public contract',
    scenarioLabel: `Official ${DANNON_FACILITY_COUNT_LABEL}-location Danone North America production network model anchored to the company overview page`,
    averageMarginPerShipment: 250,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 2 },
      { archetype: 'drops-no-yms', facilityCount: 7 },
      { archetype: 'without-drops', facilityCount: 4 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 110 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 75 },
      { archetype: 'without-drops', shipmentsPerDay: 26 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: DANNON_FACILITY_COUNT,
        unit: 'production locations',
        sourceNoteId: 'dannon-network-footprint',
      },
      {
        label: 'Modeled daily trailer moves',
        value: 849,
        unit: 'moves/day',
        sourceNoteId: 'dannon-throughput-profile',
      },
      {
        label: 'Average margin per shipment',
        value: 250,
        unit: 'USD/shipment',
        sourceNoteId: 'dannon-margin-estimate',
      },
      {
        label: 'Archetype mix',
        value: '2 with YMS, 7 drops no YMS, 4 without drops',
        sourceNoteId: 'dannon-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'dannon-network-footprint',
        label: 'Danone North America production footprint',
        detail: `Danone North America states on its official company overview page that it operates ${DANNON_FACILITY_COUNT_LABEL} production locations. That replaces the earlier placeholder facility count in the Dannon flagship page.`,
        confidence: 'public',
        citation: 'https://www.danonenorthamerica.com/about-us/',
      },
      {
        id: 'dannon-throughput-profile',
        label: 'Danone throughput profile',
        detail: 'Shipment-per-day assumptions are conservative for a fresh dairy and plant-based network where dock visibility matters more than headline site count alone.',
        confidence: 'estimated',
        citation: 'src/lib/data/facility-facts.json',
      },
      {
        id: 'dannon-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is kept below the public calculator default to stay conservative relative to dairy, plant-based, and medical-nutrition economics.',
        confidence: 'estimated',
      },
      {
        id: 'dannon-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Facility mix is inferred from a network of large production sites with a smaller number of more mature facilities already operating with stronger dock controls.',
        confidence: 'inferred',
        citation: 'src/lib/data/facility-facts.json',
      },
    ],
  },

  network: {
    facilityCount: DANNON_FACILITY_COUNT_LABEL,
    facilityTypes: ['Dairy Production', 'Plant-Based Production', 'Water Operations', 'Distribution Centers'],
    geographicSpread: 'North America',
    dailyTrailerMoves: '1,000+ across network',
    fleet: 'Contract carriers and 3PL',
  },

  freight: {
    primaryModes: ['Truckload', 'Refrigerated', 'LTL'],
    avgLoadsPerDay: '1,000+',
    peakSeason: 'Year-round fresh dairy production',
    specialRequirements: ['Temperature-controlled (multiple zones)', 'Fresh product shelf life sensitivity'],
  },

  signals: {
    eventAttendance: 'Recurring industry-conference attendance signal',
    recentNews: [
      'Heiko Gerling named Chief Operations Officer, Danone Americas (June 2025) — first major external interview in Supply Chain Magazine September 2025 framed resilience as "structure, plans, agility, and foresight."',
      'Minster OH plant expansion (Aug 2025) — ~48,000 sq ft added, 30 new jobs, 60% more milk volume needed over the next two years driven by Oikos +40% YoY in 2024.',
      'Jacksonville FL $65M International Delight / STōK production line opened June 17 2025; new Southeast distribution hub under construction nearby — the cleanest greenfield yard-design window in the NA network.',
      'Renew Danone strategy (2025-2028 chapter) names COGS productivity as an explicit pillar; FY2024 earnings cited "record productivity" as a margin lever.',
      'Microsoft AI Academy scaling toward 100,000 staff trained globally — predictive maintenance, performance analytics, real-time logistics adjustments are named manufacturing use cases.',
      'Climate Transition Plan commits Scope 3 non-FLAG to -42% by 2030; logistics named as 8% of total Danone GHG.',
    ],
    supplyChainInitiatives: [
      'Renew Danone productivity ledger',
      'Microsoft AI Academy (manufacturing + real-time logistics use cases)',
      'Climate Transition Plan — -42% Scope 3 non-FLAG by 2030',
      'Jacksonville Southeast DC build-out',
      'Minster +60% milk capacity expansion',
    ],
    urgencyDriver:
      'The operating-system discipline Heiko applied at Kraft Heinz — uniform standards across every plant, every shift — has been delivered at Danone NA for productivity (Renew Danone) and plant intelligence (Microsoft AI Academy) but not for the yard layer above the sites. The Jacksonville Southeast hub is the highest-leverage single deployment window in the NA portfolio; the Minster +60% throughput is the timing driver for the rest.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Greenfield window', body: 'Jacksonville Southeast hub · ribbon-cut alongside $65M International Delight / STōK line · the cleanest yard-standard embed before local routines lock in.' },
    { mark: 'Throughput pressure', body: 'Minster · +48,000 sq ft · 60% more milk over two years · Oikos +40% YoY 2024. More throughput-out-the-door, same dock surface.' },
    { mark: 'Strategy anchor', body: 'Renew Danone names COGS productivity as an explicit pillar. Yard standardization is the productivity lever that does not require new dock capex.' },
    { mark: 'Gerling in his own words', body: 'Resilience is "structure, plans, agility, and foresight." Yard standardization is the resilience layer most fresh networks do not have yet.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted. The public network-operating-layer comparable for fresh-shape CPG.' },
  ],

  audioBrief: {
    src: '/audio/dannon.m4a',
    intro:
      'Twenty-three minutes, for Heiko Gerling. The operating-discipline-first instinct you carried through the Kraft Heinz Managing Director years now runs Danone North America productivity and plant intelligence — Renew Danone and the Microsoft AI Academy. What follows is about the one tile it has not yet reached.',
    chapters: [
      { id: 'thesis', label: 'The plant-level case is closed', start: 0 },
      { id: 'what-renew-made', label: 'What Renew Danone made expensive', start: 280 },
      { id: 'unfilled-tile', label: 'The unfilled operating-system tile', start: 560 },
      { id: 'jacksonville-window', label: 'Why the first pilot is Jacksonville, not Mount Crawford', start: 840 },
      { id: 'greenfield-proof', label: 'What proof at the greenfield earns', start: 1120 },
    ],
    videoFollowUp: {
      src: '/audio/dannon-video.mp4',
      intro:
        'Or watch. The same brief, compressed into a few minutes — for the times forwarding a video is easier than describing the memo.',
    },
    generatedAt: '2026-05-14T21:16:00Z',
  },

  theme: {
    accentColor: '#0046AD',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 1,
  layoutPreset: 'partnership',
};
