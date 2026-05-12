/**
 * AB InBev (Anheuser-Busch InBev) — ABM Microsite Data
 * Quality Tier: A (named C-level targets; substantive public intel on
 * digital-supply-chain stack; Gartner Top 25 2025 winner)
 * Pitch shape: coexistence wedge — yard-execution operating layer sits
 * between o9 (planning) and Sensolus (asset tracking); not replacement
 * of either.
 * Angle: YARD MANAGEMENT — dock-door arbitration, multi-fleet
 * coordination, three-tier-distribution dock variability, night-loading
 * windows for DSD morning delivery.
 */

import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const AB_INBEV_FACILITY_COUNT_LABEL = getFacilityCountLabel('AB InBev', '100');
const AB_INBEV_FACILITY_COUNT = getFacilityCountLowerBound('AB InBev', 100) ?? 100;

export const abInbev: AccountMicrositeData = {
  slug: 'ab-inbev',
  accountName: 'AB InBev',
  parentBrand: 'Anheuser-Busch InBev',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 91,

  pageTitle: 'AB InBev · The execution layer between o9 planning and Sensolus tracking',
  metaDescription:
    'AB InBev runs ~100 U.S. facilities, an 800-truck dedicated fleet, an owned wholesaler network (ABOne), and a three-tier system that varies state by state. The yard layer between o9 demand plans and Sensolus trailer telemetry is the one execution surface that has not been standardized.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the AB InBev U.S. brewing network',
      composition: [
        { label: 'U.S. footprint', value: `~${AB_INBEV_FACILITY_COUNT_LABEL} facilities — nine flagship breweries (post-Newark/Merrimack/Fairfield rationalization) plus agricultural, packaging, and ABOne distributorships` },
        { label: 'Active capex program', value: '$600M U.S. manufacturing investment doubled in 2025 under the Brewing Futures program — Cartersville GA ($9.2M), Houston TX ($17M), Jacksonville FL ($30M), Los Angeles CA ($7.4M) among the named sites' },
        { label: 'Domestic production share', value: '99% of beer sold in the U.S. is manufactured in the U.S. — throughput pressure lands inside the existing network, not on imports' },
        { label: 'Distribution model', value: 'Three-tier (brewery → wholesaler → retailer) with ABOne (ABSD) owned wholesalers held below ~10% national volume per the operative DOJ understanding; Southern Glazer\'s absorbed the NYC owned-distribution arm in 2025' },
        { label: 'Existing digital stack', value: 'o9 Solutions runs demand and supply planning at 85% touchless in the U.S.; Sensolus IoT trailer telemetry deployed in Europe with a published 15% fleet-utilization lift in four months; Lighthouse-style control-tower discipline implied by the Gartner Supply Chain Top 25 2025 win' },
        { label: 'Fleet posture', value: '800+ owned trucks, 200+ zero-emission units (Nikola/BYD), plus 3PL and wholesaler equipment converging on the same dock doors at the high-volume breweries' },
      ],
      hypothesis:
        'The thing that\'s interesting about the AB InBev yard math is what the digital-supply-chain investment has *not* yet touched. o9 has taken U.S. demand planning to 85% touchless and Sensolus has demonstrated a 15% trailer-fleet optimization lift in the European deployment — both are real wins, both are publicly disclosed, and both stop short of the dock. Between the o9 load that\'s perfectly planned and the Sensolus trailer that\'s perfectly tracked, there is still a window where the driver pulls up to a gatehouse and waits for a human with a radio to decide which door to open. That window is roughly forty-eight minutes on industry-benchmark math, and at a brewery like Cartersville — forty-eight SKUs flowing to thirty-two states out of one facility — it is the throughput-limiting constraint, not the brewline. Three things are making that gap more expensive in the current cycle. First, the $600M Brewing Futures program is putting throughput-into-the-yard pressure on specific named sites (Cartersville, Houston, Jacksonville, Los Angeles) faster than the yard layer at those sites has been re-engineered to absorb it; capex that lifts plant throughput becomes trailer arrivals at the dock, and the dock at most of these sites still arbitrates appointments versus walk-ins on operator judgment. Second, the three-tier system gives AB InBev no single dock standard to enforce — the same load type leaves the brewery into an owned ABOne yard, a franchise-wholesaler yard, or a 3PL cross-dock, and each one has a different process at the gate. Standardizing brewery dock execution does not standardize the wholesaler dock; that variability ricochets back into the brewery loading sequence the next morning. Third, the night-loading window for morning DSD delivery has zero slack. The dock window is tight by design — route trucks load through the night to feed regional DSD runs at dawn — and a single twenty-minute slip cascades into eighty-plus delivery routes the next day. The mixed-fleet reality is where the gap shows up hardest. Eight hundred owned trucks, two hundred-plus EVs whose charging schedules require predictable dock times, third-party carriers, and wholesaler trucks all converge on the same doors; on a Memorial-Day-to-Labor-Day surge or a Super Bowl week, the radio-and-clipboard arbitration that works at average throughput collapses. The forward-looking item is the EV transition itself: a zero-emission truck cannot wait out yard variability the way a diesel can — battery state of charge is a hard constraint, and the yard layer is where EV economics either work or quietly stop working. Sensolus tells you where the trailer is. It does not tell the dock office which trailer is the next priority, which spotter move clears the most downstream value, or which door the EV needs in the next twenty minutes to make its return run. That layer is the unsolved seam.',
      caveat:
        'This is built from AB InBev\'s public disclosures (the $600M Brewing Futures release, the o9 case material from aim10x 2024 and 2025, the published Sensolus partnership results, and the Gartner Supply Chain Top 25 2025 citation) plus reasonable network inference. We may be wrong about parts of it — the most useful pushback is on whether Sensolus has been rolled out in North America at all (the published case is European), whether the dock-door logic at the high-capex breweries has already been re-spec\'d ahead of the throughput lift, and which sites the EV-charging-versus-dock-window constraint is biting first.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube — every load is at the weight ceiling), low-margin (every minute of yard waste is a margin point you cannot recover with price), multi-temp at the premium SKU layer (premium spring and alkaline sit alongside ambient), and complicated by return logistics for the refillable five-gallon format. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be, because the freight cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, mixed owned-and-3PL fleets, and an existing site-level yard-tech stack — and they have layered a network-level yard operating model on top of that stack. The shape similarities to AB InBev\'s U.S. operation are tight: multi-site (Primo bottling plants ↔ AB InBev breweries), regional drop-trailer distribution (Primo DCs ↔ ABOne and franchise wholesalers), mixed fleet (owned + 3PL + wholesaler equipment converging at the same doors), and a mature digital supply chain stack already in place that the yard layer needs to ladder up into. The freight differences favor AB InBev: a case of beer is materially easier than a case of water on the weight-and-margin math, and there is no refill leg. If a network operating model can run on water, beer is the easier read-across, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at AB InBev are different in kind: (1) Cartersville, because it is a single facility producing 48 SKUs into 32 states with a fresh $9.2M Brewing Futures capex lift landing on top of an unchanged yard layer — the throughput-into-the-yard pressure is concentrated and visible; and (2) the ABOne network specifically, because owned distribution avoids the franchise-negotiation overhead that would slow a network rollout, and it is the place where AB InBev can enforce one dock standard end-to-end. The expectation is that the U.S. brewery network agrees with itself on dock-door logic, multi-fleet arbitration, and EV-charging-aware sequencing within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'abi-network-footprint',
          source: 'Anheuser-Busch U.S. facilities footprint',
          confidence: 'public',
          detail: `Anheuser-Busch states that it maintains ${AB_INBEV_FACILITY_COUNT_LABEL} facilities across the country, with nine flagship breweries post-Newark sale and the Merrimack/Fairfield closures. The corporate facilities page is the network baseline for this analysis.`,
          url: 'https://www.anheuser-busch.com/facilities',
        },
        {
          id: 'abi-brewing-futures',
          source: 'Brewing Futures $600M U.S. manufacturing investment (2025–2026)',
          confidence: 'public',
          detail: 'AB InBev doubled its U.S. manufacturing investment to $600M for 2025–2026, including named site-level commitments at Cartersville GA ($9.2M), Houston TX ($17M), Jacksonville FL ($30M), and Los Angeles CA ($7.4M). Operationally, this is plant-level throughput, packaging, and reliability capex — the kind that creates trailer pressure on the yard immediately downstream.',
          url: 'https://www.anheuser-busch.com/newsroom/anheuser-busch-investing-9.2M-in-its-cartersville-brewery-to-drive-local-economic-growth',
        },
        {
          id: 'abi-o9-results',
          source: 'AB InBev × o9 Solutions planning transformation (aim10x 2024 / 2025)',
          confidence: 'public',
          detail: 'Published outcomes: ~20% inventory reduction, forecast accuracy +11pp to 87%, U.S. service levels at 99.5%, U.S. out-of-stocks below 0.5%, and 85% touchless demand planning in the U.S. Elito Siqueira is the named executive sponsor. The relevance is that the leaner the inventory, the more dock-execution variance shows up as a working-capital and service-level problem rather than a buffer-absorbed one.',
          url: 'https://o9solutions.com/articles/ab-inbev-journey-with-o9-transforming-supply-chain-planning',
        },
        {
          id: 'abi-sensolus',
          source: 'AB InBev × Sensolus yard / trailer telemetry partnership',
          confidence: 'public',
          detail: 'Sensolus IoT trailer-tracking results published by the vendor: 15% trailer-fleet utilization lift in four months in the European deployment. Whether the partnership has been extended to North American breweries is a discovery question, not a public fact.',
          url: 'https://www.sensolus.com/ab-inbev/',
        },
        {
          id: 'abi-gartner-top-25',
          source: 'Gartner Supply Chain Top 25 — 2025 (AB InBev cited)',
          confidence: 'public',
          detail: 'AB InBev is one of the named winners of the Gartner Supply Chain Top 25 in 2025. The relevance is corroborative — Gartner rewards integrated planning, visibility, and execution discipline; the execution layer at the dock is the natural next investment surface.',
          url: 'https://www.gartner.com/en/supply-chain/trends/supply-chain-award-winner-2025-ab-inbev',
        },
        {
          id: 'abi-three-tier',
          source: 'Three-tier distribution and ABOne (ABSD) structure',
          confidence: 'public',
          detail: 'AB InBev operates inside the U.S. three-tier system; ABOne (Anheuser-Busch Sales & Distribution Co.) holds the owned-wholesaler footprint under the operative ~10% national volume understanding with the DOJ. Southern Glazer\'s acquired the NYC owned-distribution arm in 2025, consistent with a posture of partnering with independent wholesalers rather than expanding owned distribution.',
          url: 'https://www.anheuser-busch.com/abone',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA / Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site beverage networks operate under at average throughput, not AB InBev specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and operations team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether Sensolus has been rolled out at North American breweries, or whether the published 15% fleet-utilization result is still Europe-only',
        'Whether the dock-door logic at the Brewing Futures capex sites (Cartersville, Houston, Jacksonville, LA) has been re-spec\'d ahead of the throughput lift, or whether the yard layer at those sites is operating against pre-capex baselines',
        'How multi-temp considerations actually play in U.S. beer dock arbitration — heat sensitivity at the high-volume sites versus ambient for the long-tail SKUs',
        'How the EV-charging-versus-dock-window constraint is being resolved today at the breweries running the 200+ Nikola/BYD units, and which sites are biting first',
        'Whether the ABOne dock standard varies measurably from independent-wholesaler dock practice, and where the standardization gap is widest in the network',
        'How the night-loading-into-DSD-morning sequence is currently arbitrated at sites where the route count exceeds the dock door count by a meaningful multiple',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. AB InBev is distinctive in this round because the digital-supply-chain stack is unusually mature (o9 at 85% touchless in the U.S., Sensolus deployed in Europe, Gartner Top 25 in 2025) but the yard layer that sits between planning and asset telemetry has not been re-engineered against the throughput pressure the $600M Brewing Futures program is putting on specific named sites. The three-tier-distribution overlay — owned ABOne yards, franchise-wholesaler yards, 3PL cross-docks — makes dock-execution standardization a genuinely harder problem than at a single-channel CPG network, which is the reason a multi-site multi-fleet comparable like Primo Brands reads across cleanly even though the freight category is different.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for AB InBev — whether Sensolus is already running in North America, whether the dock-door logic at the Brewing Futures capex sites has been touched, or where EV-charging-versus-dock-window is biting first — that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

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
        { period: 'Current', role: 'Chief Supply Chain & Distribution Co. Officer, North America', company: 'AB InBev', relevance: `Top supply chain role for US. Owns nine flagship breweries (post-Newark/Merrimack/Fairfield rationalization), ${AB_INBEV_FACILITY_COUNT_LABEL} facilities, 800+ trucks. Can make the decision.` },
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
        'Cartersville GA brewery 90 min from major Atlanta industry events',
      ],
      eventProximity: 'Cartersville GA brewery 90 min from major Atlanta industry events',
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

      framingNarrative:
        'Elito, the operating-system thinking that took U.S. demand planning to 85% touchless on o9, dropped inventory roughly 20%, and earned the Gartner Supply Chain Top 25 citation in 2025 is the same thinking that hasn\'t yet been applied to the dock layer between the o9 plan and the Sensolus telemetry. The site-level case for digital supply chain at AB InBev is closed — and won. The next tier is the one your leaner inventory now demands and your Brewing Futures throughput is about to surface at the named capex sites.',
      openingHook:
        'You proved end-to-end at the planning layer: 85% touchless in the U.S., inventory down 20%, service at 99.5%. The unsolved question is the dock layer above the sites — how Cartersville, Houston, Jacksonville, and the LA yards agree on the same dock-door arbitration, the same multi-fleet sequencing, and the same EV-charging-aware priority logic, in a way that feeds the same control-tower discipline o9 outputs already do.',
      stakeStatement:
        'Throughput-out-the-door from a $600M Brewing Futures capex program becomes trailer-into-the-yard at the same nine flagship breweries within the same cycle. The o9 plan can be 85% touchless; if the dock arbitrates on operator judgment, the leaner inventory turns the unarbitrated minute into a missed DSD route, not a recoverable buffer.',

      heroOverride: {
        headline: 'Elito, the operating-system discipline you built on planning has not yet reached the dock.',
        subheadline:
          'o9 runs U.S. demand at 85% touchless. Sensolus proved 15% fleet utilization in Europe. The yard layer between the o9 plan and the Sensolus trailer telemetry is the unsolved seam — and the $600M Brewing Futures throughput is about to land on it.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer transformation-operator framing. Twenty-eight years inside AB InBev; he doesn\'t need a glossary. Acknowledge the o9 and Sensolus wins as wins — they are. Position the wedge as the operating layer above sites (network-level dock execution), not as a replacement of either platform. Quote his own language ("touchless," "KPIs at all-time high") sparingly and only where it earns the quote.',
      kpiLanguage: [
        'touchless yard %',
        'dock-door utilization',
        'trailer dwell',
        'dock-to-stock cycle time',
        'multi-fleet dock arbitration',
        'EV-charging-aware sequencing',
        'site-to-site execution variance',
        'control-tower coverage at the dock',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-fleet, mature-digital-supply-chain shape, on harder freight (water). The directly-shaped reference (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
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

      framingNarrative:
        'Ricardo, the integration discipline you applied after Grupo Modelo and again across the Africa zone is the same discipline that has not yet been pointed at the dock layer between AB InBev breweries, ABOne yards, franchise wholesalers, and 3PL cross-docks. Planning is standardized on o9. Trailer telemetry is standardized on Sensolus in the European deployment. The dock — where the same load type leaves a brewery into three different ownership models — still varies site by site by site.',
      openingHook:
        'The three-tier-distribution overlay means a single load type from Cartersville lands into an ABOne yard, a franchise-wholesaler yard, or a 3PL cross-dock — and each one arbitrates dock priority differently. The o9 plan does not care which yard it lands in. The dock standard above the sites is what would.',
      stakeStatement:
        'AB InBev is one of the few global CPG networks where the procurement, logistics, and distribution stack reports up to one supply seat. The dock-execution variance between brewery, ABOne, and independent-wholesaler is exactly the kind of cross-network friction the Chief Supply Officer role is structurally positioned to eliminate — and the layer that o9 and Sensolus together do not reach.',

      heroOverride: {
        headline: 'Ricardo, the supply network is standardized at the plan layer and the telemetry layer. The dock layer between them is not.',
        subheadline:
          'You\'ve standardized procurement, logistics, and distribution across acquisitions and zones. The three-tier dock layer — brewery, ABOne, franchise wholesaler, 3PL cross-dock — is the execution surface that o9 and Sensolus together do not yet arbitrate.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Global-supply-executive register, not plant-manager register. Lead with cross-network standardization, post-acquisition integration discipline, and the three-tier-distribution overlay that is specific to U.S. beer. Do not make this a single-site conversation.',
      kpiLanguage: [
        'network standardization',
        'site-to-site execution variance',
        'dock turn time',
        'multi-fleet dock arbitration',
        'three-tier dock standardization',
        'ABOne vs. franchise-wholesaler dock parity',
        'fleet utilization',
        'execution discipline',
      ],
      proofEmphasis:
        'Primo Brands is the public comparable — multi-site, multi-fleet, mature digital supply chain, network-level operating model layered on top of site-level yard systems. Frame the wedge as the operating protocol that makes o9 planning and Sensolus telemetry behave the same way from brewery to brewery to wholesaler.',
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
    scenarioLabel: `Official ${AB_INBEV_FACILITY_COUNT_LABEL}-facility U.S. Anheuser-Busch network model anchored to the corporate facilities page`,
    averageMarginPerShipment: 140,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 18 },
      { archetype: 'drops-no-yms', facilityCount: 52 },
      { archetype: 'without-drops', facilityCount: 30 },
    ],
    archetypeAssumptions: [
      { archetype: 'with-yms', shipmentsPerDay: 135 },
      { archetype: 'drops-no-yms', shipmentsPerDay: 95 },
      { archetype: 'without-drops', shipmentsPerDay: 32 },
    ],
    accountAssumptions: [
      {
        label: 'Modeled facility count',
        value: AB_INBEV_FACILITY_COUNT,
        unit: 'facilities',
        sourceNoteId: 'abi-network-footprint',
      },
      {
        label: 'Average margin per shipment',
        value: 140,
        unit: 'USD/shipment',
        sourceNoteId: 'abi-margin-estimate',
      },
      {
        label: 'Modeled daily trailer moves',
        value: 5380,
        unit: 'moves/day',
        sourceNoteId: 'abi-throughput-profile',
      },
      {
        label: 'Archetype mix',
        value: '18 with YMS, 52 drops no YMS, 30 without drops',
        sourceNoteId: 'abi-facility-mix',
      },
    ],
    sourceNotes: [
      {
        id: 'abi-network-footprint',
        label: 'Anheuser-Busch U.S. facilities footprint',
        detail: `Anheuser-Busch states that it maintains ${AB_INBEV_FACILITY_COUNT_LABEL} facilities across the country. The flagship AB InBev microsite uses that official U.S. facilities figure as the network baseline.`,
        confidence: 'public',
        citation: 'https://www.anheuser-busch.com/facilities',
      },
      {
        id: 'abi-margin-estimate',
        label: 'Conservative per-shipment margin',
        detail: 'Average margin per shipment is set materially below the public calculator default so the modeled AB InBev value stays conservative against beer, packaging, and owned-distribution economics.',
        confidence: 'estimated',
      },
      {
        id: 'abi-throughput-profile',
        label: 'North America brewery throughput profile',
        detail: 'Shipment-per-day assumptions reflect high-volume brewery and wholesaler operations while staying below the public calculator benchmark on a per-facility basis.',
        confidence: 'estimated',
        citation: 'docs/research/elito-siqueira-abinbev-dossier.md',
      },
      {
        id: 'abi-facility-mix',
        label: 'Facility archetype mix',
        detail: 'Facility mix is inferred from the published brewery footprint, ABOne distribution coverage, and the broader 100-facility national footprint described in the flagship research.',
        confidence: 'inferred',
        citation: 'src/lib/data/facility-facts.json',
      },
    ],
  },

  network: {
    facilityCount: AB_INBEV_FACILITY_COUNT_LABEL,
    facilityTypes: ['Breweries (12)', 'ABOne Distributors (17)', 'Agricultural/Packaging (23)', 'Distribution Centers'],
    geographicSpread: 'CA, NY, GA, TX, NJ, VA, MO, AZ, PA, CO, FL, OH',
    dailyTrailerMoves: '5,000+ across the brewery network',
    peakMultiplier: '1.5x during summer (Memorial Day-Labor Day)',
    fleet: '800+ trucks, 200+ zero-emission vehicles',
    keyFacilities: [
      { name: 'Cartersville Brewery', location: 'Cartersville, GA', type: 'Brewery', significance: '~90 minutes from Atlanta', yardRelevance: 'Nearest brewery to Atlanta metro. Natural pilot site for early deployment.' },
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
    eventAttendance: 'Major CPG/beverage company. Supply chain technology is stated priority. Cartersville brewery 90 min from Atlanta.',
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
    urgencyDriver: 'Already bought yard tech (Sensolus). EV fleet needs predictable dock times. Summer 2026 peak is approaching. Elito is a public transformation champion who needs the next win for Aim10x 2027.',
  },

  theme: {
    accentColor: '#004B87',
    backgroundVariant: 'dark',
  },
};
