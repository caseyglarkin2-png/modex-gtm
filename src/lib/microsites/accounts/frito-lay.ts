/**
 * Frito-Lay — ABM Microsite Data
 * Quality Tier: A+ (Phase 6A — top-of-list account, public PepsiCo Foods
 * North America anchor)
 *
 * Pitch shape: coexistence wedge — a network-level yard operating layer
 * above PepsiCo Foods' digital surfaces (pep+, the Siemens / NVIDIA digital
 * twin program, plant-floor AI, route-loading systems). Not displacement.
 *
 * Angle: YARD MANAGEMENT at snack-network velocity (dock-door utilization,
 * trailer dwell, DSD route-loading sequence, agricultural inbound
 * arbitration, network OEE) — NOT driver experience.
 *
 * Decision-maker anchor: Brian Watson, VP Supply Chain, Frito-Lay /
 * PepsiCo. Steven Williams (former CEO Frito-Lay / PepsiCo Foods North
 * America, now EVP & Vice Chairman, Global Chief Commercial Officer) is
 * the corporate sponsor of the snack-network operating discipline this
 * memo names. The memo speaks past Watson to the operating-system surface
 * Williams handed off.
 */

import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const FRITO_LAY_FACILITY_COUNT_LABEL = getFacilityCountLabel('Frito-Lay', '230+');
const FRITO_LAY_FACILITY_COUNT = getFacilityCountLowerBound('Frito-Lay', 230) ?? 230;

// LEGACY SECTIONS (preserved for reference — M3.2-M3.6 may lift prose into memo sections)
/*
 * Pre-M3 hero/problem/stakes/solution/proof/network-map/roi/testimonial/cta
 * shapes were collapsed into the memo template in Sprint M3. Original
 * narrative beats (production-line / yard speed mismatch, four-fleet dock
 * contention, DSD route-loading precision, agricultural inbound
 * variability) are preserved in the observation + comparable + about
 * sections below.
 */

export const fritoLay: AccountMicrositeData = {
  slug: 'frito-lay',
  accountName: 'Frito-Lay',
  coverHeadline: 'The yard tile pep+ has not laid yet',
  titleEmphasis: 'pep+ has not laid yet',
  coverFootprint: '~30 plants · 200+ DCs · DSD to 95%',
  parentBrand: 'PepsiCo',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 93,

  pageTitle: 'YardFlow for Frito-Lay - The Yard Layer Above pep+',
  metaDescription: `How a network-level yard operating model lands on top of the digital surfaces pep+ and the PepsiCo Foods digital-twin program already touch — across Frito-Lay's ${FRITO_LAY_FACILITY_COUNT_LABEL}-site snack network at industry-leading velocity.`,

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Frito-Lay U.S. network',
      composition: [
        { label: 'U.S. manufacturing footprint', value: '30+ manufacturing plants · 200+ distribution centers · DSD coverage to 95% of US retail — the operating-system surface pep+ already touches, and the yard layer above the sites does not' },
        { label: 'pep+ visibility tile', value: 'PepsiCo Positive (pep+) is the end-to-end transformation announced September 2021; the digital surfaces it stitches together — planning, plant-floor AI, route loading, sustainability reporting — reach the dock but stop short of the gate' },
        { label: 'Siemens / NVIDIA digital-twin program', value: 'Industry-first PepsiCo / Siemens / NVIDIA collaboration (CES 2026) — physics-level twins of every machine, conveyor, pallet route, and operator path. Reported 20% throughput lift on initial deployment; 10–15% capex reduction through virtual validation. The twin covers the four walls of the plant. The yard outside the dock door is not in the twin' },
        { label: 'Plant-floor AI in production', value: 'Cheetos AI: a model trained on ideal product attributes scans every Cheeto on the production line and makes nanosecond adjustments to temperature, shape, and consistency. The line is running on machine vision. The trailer staging is not' },
        { label: 'Autonomous yard pilot', value: 'PepsiCo / Outrider autonomous yard-truck deployment at a Frito-Lay DC reported ~50% reduction in yard-truck idle time. Validates that yard-side automation pays back at Frito-Lay; the question now is the operating layer above multiple sites' },
        { label: 'Daily trailer moves', value: '14,000+ across the network — at 1.3x peak during summer and holiday seasons (Super Bowl, back-to-school)' },
        { label: 'Fleet mix at the dock', value: 'Owned fleet + contract carriers + agricultural haulers + DSD route trucks — four fleet types arbitrating the same doors at overnight load-out' },
        { label: 'Working-capital posture', value: 'PepsiCo Foods has become the #1 supplier in Kantar PoweRanking nine consecutive years (2016–2024). Leaner planning and faster shelf turn make trailer dwell a working-capital line, not just an ops line' },
      ],
      hypothesis:
        'Frito-Lay runs the highest-velocity CPG production lines in North America, and pep+ has already proven that the digital operating model lands inside the plant. The Siemens / NVIDIA twin is up at the machine-conveyor-operator level. Cheetos AI runs the line in nanoseconds. The Outrider pilot showed that yard-side automation pays back at a single Frito-Lay DC. The case for digital execution inside the four walls is closed. What it has not become, across 30+ manufacturing plants and 200+ distribution centers, is a network operating model for the yard outside the dock door. Each site invents its own gate routine, its own dock priority, its own DSD-staging sequence. The network does not agree with itself on what good looks like — and that is the part pep+ cannot fix from the strategy layer and the plant twin cannot fix from inside the building.\n\nThat gap got more expensive in the last three years for two reasons. First, plant-floor velocity has pulled away from yard-side execution. A 90-minute trailer delay used to be absorbed inside DSD slack; with the production line running on machine vision and the twin lifting throughput 20% on initial deployment, the yard is the variance that lands on the route. Second, the four-fleet dock — owned, contract, agricultural, DSD — has no shared operating standard. Overnight DSD route-loading sequence is the moment that has to be right or the morning route starts behind; agricultural inbound resets the dock schedule every weather day; and neither shows up at the network layer in a way the snack-network operator can act on without screen-switching.\n\nThe third thing is the pilot question itself. Plano is the highest-visibility yard in the portfolio — the marquee deployment. That makes it the scale-up target once the operating model is proven, not the proving ground. The first pilot lands at a smaller, simpler site — the Perry, GA plant sits ~150 miles from Atlanta with a manageable carrier yard, and Topeka is a high-volume single-shift candidate with complex agricultural inbound to stress-test multi-fleet sequencing. The proof at the simple site is what earns the right to operate the layer above Plano, above the digital-twin plants in the second wave, and across the 200+ DCs in the third.',
      pullQuote: 'The network does not agree with itself on what good looks like.',
      caveat:
        'This is built from public PepsiCo and Frito-Lay disclosures, the public pep+ and digital-twin record, the Outrider yard pilot reporting, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether yard-side feeds reach the pep+ control surface in a way the network operator can act on, whether the digital-twin program is already extending past the dock door, how the four-fleet dock is sequenced today, and where DSD route-loading accuracy is actually landing across the 30+ manufacturing plants.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/frito-lay-coverage-map.svg',
        imageAlt: 'pep+ digital coverage map. Six tiles representing the PepsiCo Foods operating surfaces touched by pep+ and the Siemens/NVIDIA digital twin program. Plant Twin, Throughput, Forecast, Inventory, and Route Loading are covered. The Yard Network Ops tile is unfilled, marked with a Frito-Lay red hairline outline.',
        caption: 'pep+ digital coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public pep+, PepsiCo / Siemens / NVIDIA, and PepsiCo Foods digital disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), and shipped across multi-temp (premium SKUs sit alongside ambient). Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Frito-Lay operating profile is the same shape — multi-site, multi-fleet, DSD-dependent, plant-floor automation already in motion under pep+ — but with significantly more forgiving freight economics per trailer and a velocity profile that turns every saved dock minute into network-level capacity. Primo runs the operating layer pep+ is shaped to host — same coordinates, harder freight.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted · 30-min remote deployment', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The sites where this lands first are not the marquee nodes — Perry, GA (~150 miles from Atlanta) and Topeka, KS are the simpler, lower-risk facilities where the carrier yard is most instrument-able, the displacement risk is lowest, and the operating model can be proven before it has to scale. Plano is where the proven model expands into the highest-visibility node in the U.S. portfolio; the digital-twin plants are the second wave once the network operating layer has its first 60-day proof, and the 200+ DCs are the third. We would expect the network to make sense of itself within two to four quarters of that first pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'frito-public-footprint',
          source: 'Frito-Lay company facts and PepsiCo disclosures',
          confidence: 'public',
          detail: `Anchors the 30+ manufacturing plant / 200+ DC split that yields the conservative ${FRITO_LAY_FACILITY_COUNT_LABEL}-site lower bound used here. DSD coverage to 95% of US retail and route model from public PepsiCo / Frito-Lay materials.`,
          url: 'https://www.fritolay.com/about-frito-lay/company-story',
        },
        {
          id: 'pep-plus-program',
          source: 'PepsiCo pep+ (PepsiCo Positive) end-to-end transformation',
          confidence: 'public',
          detail: 'Strategic end-to-end transformation announced September 2021. The operating surface pep+ touches — planning, plant-floor execution, route loading, sustainability reporting — reaches the dock but stops short of the gate. Whether yard-side feeds ladder into the pep+ control surface in a usable way is a discovery question, not a public fact.',
          url: 'https://www.pepsico.com/our-stories/press-release/pepsico-announces-strategic-end-to-end-transformation-pep-pepsico-positive09142021',
        },
        {
          id: 'pepsico-siemens-nvidia-twin',
          source: 'PepsiCo / Siemens / NVIDIA digital-twin collaboration (CES 2026)',
          confidence: 'public',
          detail: 'Industry-first multi-year collaboration covering U.S. manufacturing and warehouse facilities. Physics-level twins of machines, conveyors, pallet routes, operator paths. Public reporting cites 20% throughput lift on initial deployment, 90% of issues identified pre-build, 10–15% capex reduction. Coverage is inside the building.',
          url: 'https://www.pepsico.com/newsroom/press-releases/2025/pepsico-announces-industry-first-ai-and-digital-twin-collaboration-with-siemens-and-nvidia',
        },
        {
          id: 'frito-outrider-pilot',
          source: 'PepsiCo / Outrider autonomous yard-truck pilot at Frito-Lay DC',
          confidence: 'public',
          detail: 'Reported ~50% reduction in yard-truck idle time at a Frito-Lay distribution center. Single-site proof that yard-side automation pays back at Frito-Lay velocity; the open question is the operating layer above multiple sites and across the four-fleet dock.',
          url: 'https://www.outrider.ai/',
        },
        {
          id: 'frito-cheetos-ai',
          source: 'Frito-Lay plant-floor AI (Cheetos production-line vision model)',
          confidence: 'public',
          detail: 'Public reporting describes a Cheetos-specific vision model that scans every product on the line and adjusts temperature, shape, and consistency in nanoseconds. The plant floor is running on machine vision; the trailer staging outside the dock is not.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most high-volume CPG networks operate under, not Frito-Lay specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'watson-tenure',
          source: 'Brian Watson — public tenure and remit',
          confidence: 'public',
          detail: 'VP Supply Chain at Frito-Lay / PepsiCo. Network-wide remit covering manufacturing, logistics, and distribution standardization across the snack network. Reports up into the PepsiCo Foods supply-chain organization that Steven Williams (former CEO PepsiCo Foods North America, now EVP & Vice Chairman, Global CCO) built into the #1-ranked CPG supplier on Kantar PoweRanking nine years running.',
          url: 'https://www.linkedin.com/in/brian-watson-906532142',
        },
      ],
      unknowns: [
        'Whether yard-side feeds reach the pep+ control surface in a way the network operator can act on without screen-switching',
        'Whether the Siemens / NVIDIA digital-twin program is already extending past the dock door into trailer staging, gate sequencing, or carrier flow — or whether the twin stops at the building line',
        'How the four fleet types — owned, contract, agricultural, DSD — are sequenced at the dock today; site policy, system logic, or operator judgment',
        'Where DSD route-loading accuracy is actually landing across the 30+ manufacturing plants, and where the variance concentrates',
        'How the Outrider pilot is being scoped for expansion — single-DC scale-up, multi-site rollout, or evaluation hold',
        'Existing YMS / dock-scheduling coverage across the manufacturing plants vs. the 200+ DCs — and where the operating-standard gap is widest',
        'How agricultural-inbound variability propagates into overnight DSD staging at the plants that run both flows on the same dock surface',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Frito-Lay is distinctive in this round because the operating-system thinking is already on the floor — pep+ for the end-to-end transformation, the Siemens / NVIDIA twin for the plant, Cheetos AI for the line, Outrider for the yard at one site. The yard layer above the sites is the one that has not yet caught the same operating discipline. This brief sizes that gap, not the site-level and plant-floor wins under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        `Brian — the part most worth pushing back on is whether the operating-system discipline that turned PepsiCo Foods into the #1-ranked CPG supplier nine years running has reached the yard layer yet, or whether it stopped at the plant floor and the route truck. That answer reshapes the rest of this. The ${FRITO_LAY_FACILITY_COUNT_LABEL}-site assumption, the four-fleet contention frame, and the pep+ coverage seam are all worth challenging if any of them read wrong against what you see internally. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.`,
    },
  ],

  needsHandTuning: false,

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

      currentMandate: 'Network-wide supply chain performance and standardization across the Frito-Lay snack network',
      strategicPriorities: ['Multi-site standardization', 'Throughput optimization', 'Network execution visibility'],
      knownPainPoints: ['No network-wide yard protocol', 'Site-to-site process variance', 'No unified yard metrics across the four-fleet dock'],

      communicationStyle: 'Senior executive. Lead with network-level impact and strategic value. He cares about the system, not individual sites.',
      languagePreferences: ['network', 'standardization', 'execution', 'throughput', 'at scale'],
      connectionHooks: ['Industry conference attendee signal', 'PepsiCo Foods network / LinkedIn path', 'pep+ operating-system framing'],
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

      framingNarrative:
        'Brian, the operating-system discipline that turned PepsiCo Foods into the #1-ranked CPG supplier nine years running has already reached the plant floor at Frito-Lay. pep+ stitches the end-to-end strategy together. The Siemens / NVIDIA twin runs inside the building. Cheetos AI runs the line in nanoseconds. The Outrider pilot proved yard-side automation pays back at a single DC. The yard layer above the sites — the one that arbitrates a four-fleet dock across 30+ manufacturing plants and 200+ DCs at snack-network velocity — is the tile that has not been laid into that operating system yet. Site-level proof exists. The network operating layer above the sites is what pep+ is shaped to host.',
      openingHook:
        'pep+ has reached the plant floor at Frito-Lay. The Siemens / NVIDIA twin covers the building. The yard outside the dock door is the one operating surface still running on local routines.',
      stakeStatement:
        'The plant twin is lifting throughput 20% on initial deployment; Cheetos AI is making nanosecond line adjustments. Plant-floor velocity has pulled away from yard-side execution, and the four-fleet dock has no shared operating standard. The gap between those two is the network yard layer — and it is the only operating-system surface at Frito-Lay that is not yet running to a single standard across the snack network.',

      heroOverride: {
        headline: 'The pep+ tile no one has filled yet is the yard network operating layer.',
        subheadline: `Plant-floor digitization is proven at Frito-Lay — pep+, the Siemens / NVIDIA twin, Cheetos AI, the Outrider pilot. The network operating model above the sites — the one snack-network velocity now needs and pep+ is shaped to host — is the unfilled tile. The smaller plants (Perry, Topeka) are the cleanest place to prove it; Plano is where it scales; the ${FRITO_LAY_FACILITY_COUNT_LABEL}-site network is the third wave.`,
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Watson runs network-wide supply chain for the highest-velocity CPG network in North America; he does not need a glossary. Acknowledge the plant-floor and single-site wins as wins — they are. Position the wedge as the layer above sites (network operating model), not as replacement of sites or of the digital twin. Reference pep+ and the Siemens / NVIDIA twin by name only where they earn the mention; the discipline you are naming is the operating-system discipline Steven Williams built into PepsiCo Foods.',
      kpiLanguage: [
        'network throughput',
        'multi-site standardization',
        'truck turn time',
        'dock-door utilization',
        'four-fleet dock arbitration',
        'DSD route-loading sequence',
        'capacity recovery',
        'pep+ control-surface coverage',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same network shape, harder freight (water), already running the network-level layer above site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
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
      { name: 'Plano, TX HQ Campus', location: 'Plano, TX', type: 'HQ / Manufacturing', significance: 'Corporate headquarters and major production facility', yardRelevance: 'Highest-visibility yard in the network. Marquee deployment, not pilot candidate.' },
      { name: 'Perry, GA Plant', location: 'Perry, GA', type: 'Manufacturing', significance: '~150 miles from Atlanta', yardRelevance: 'Closest Frito-Lay plant to Atlanta. Natural early pilot site.' },
      { name: 'Topeka, KS Plant', location: 'Topeka, KS', type: 'Manufacturing', significance: 'Major production facility', yardRelevance: 'High-volume plant with complex inbound agricultural receiving. Pilot candidate for four-fleet dock arbitration.' },
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
    eventAttendance: 'Past attendee list signal',
    recentNews: [
      'pep+ (PepsiCo Positive) end-to-end transformation — September 2021 — the corporate operating-system program covering planning, plant-floor execution, route loading, and sustainability reporting.',
      'PepsiCo / Siemens / NVIDIA digital-twin collaboration (CES 2026) — industry-first; physics-level twins of machines, conveyors, pallet routes, operator paths. 20% throughput lift reported on initial deployment; 10–15% capex reduction through virtual validation.',
      'PepsiCo / Outrider autonomous yard-truck pilot at a Frito-Lay DC — reported ~50% reduction in yard-truck idle time. Yard-side automation proof at a single site.',
      'Cheetos AI: production-line vision model adjusting temperature, shape, and consistency in nanoseconds — plant-floor velocity is on machine vision; yard-side execution is not.',
      'PepsiCo Foods has been the #1 supplier in Kantar PoweRanking nine consecutive years (2016–2024) — the operating-system discipline Steven Williams built and Brian Watson now runs at the supply-chain layer.',
    ],
    supplyChainInitiatives: ['pep+ end-to-end transformation', 'Siemens / NVIDIA digital twin', 'Outrider autonomous yard pilot', 'Cheetos AI plant-floor vision', 'Network standardization across 30+ manufacturing plants and 200+ DCs'],
    urgencyDriver:
      'Plant-floor digitization is proven at Frito-Lay — pep+, the Siemens / NVIDIA twin, Cheetos AI, the Outrider single-site pilot. Plant-floor velocity has pulled away from yard-side execution. Perry, GA (~150 mi from Atlanta) and Topeka, KS are the natural early-pilot candidates; Plano is the marquee scale-up; the 200+ DC tier is the third wave.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'pep+ transformation', body: 'PepsiCo Positive · end-to-end · announced September 2021.' },
    { mark: 'Plant twin', body: 'Siemens / NVIDIA digital twin · 20% throughput lift · 10–15% capex reduction.' },
    { mark: 'Yard-side proof', body: 'Outrider autonomous yard-truck pilot · ~50% reduction in idle time at a Frito-Lay DC.' },
    { mark: 'Network rank', body: 'PepsiCo Foods · #1 supplier on Kantar PoweRanking, nine years running (2016–2024).' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Brian Watson. The operating-system discipline that turned PepsiCo Foods into the #1-ranked CPG supplier nine years running has already reached the plant floor at Frito-Lay — pep+, the Siemens / NVIDIA twin, Cheetos AI, the Outrider single-site pilot. The five minutes that follow are about the one tile it has not yet reached.',
    chapters: [
      { id: 'thesis', label: 'I. The plant-floor case is closed', start: 0 },
      { id: 'what-velocity-made', label: 'II. What snack-network velocity made expensive', start: 65 },
      { id: 'unfilled-tile', label: 'III. The unfilled pep+ tile', start: 130 },
      { id: 'not-plano', label: 'IV. Why the first pilot is not Plano', start: 195 },
      { id: 'simple-site-proof', label: 'V. What proof at the simple site earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#E21A2C',
    backgroundVariant: 'dark',
  },
};
