/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * AB InBev has a documented PINC/Kaleris incumbent footprint at brewery
 * yards (site-level yard automation legacy). Specifics live in internal
 * dossier; rendered prospect copy MUST refer only to "site-level yard
 * automation" or "existing yard-tech layer" generically — never name
 * PINC, Kaleris, or the rollout history. The wedge is the network
 * operating layer above the sites (same shape as Kraft Heinz), not
 * displacement of the site-level stack.
 */

/**
 * AB InBev (Anheuser-Busch InBev) — ABM Microsite Data
 * Quality Tier: A+ (named C-level targets; substantive public intel on
 * digital-supply-chain stack; Gartner Top 25 2025 winner; signature
 * touchless-planning thread is Elito Siqueira's own scoreboard)
 * Pitch shape: coexistence wedge — yard-execution operating layer sits
 * between o9 (planning) and Sensolus (asset telemetry); not replacement
 * of either, and does not touch the site-level yard-tech layer beneath.
 * Angle: YARD MANAGEMENT — dock-door arbitration, multi-fleet
 * coordination, three-tier-distribution dock variability, night-loading
 * windows for DSD morning delivery, EV-charging-aware dock priority.
 * Signature-initiative thread: Touchless Planning (o9, 85% U.S.) +
 * Brewing Futures ($600M U.S. capex 2025-2026). These two together are
 * the AB InBev "operating-system" surface; the yard is the unfilled
 * tile.
 */

import type { AccountMicrositeData } from '../schema';
import { getFacilityCountLabel, getFacilityCountLowerBound } from '../../research/facility-fact-registry';

const AB_INBEV_FACILITY_COUNT_LABEL = getFacilityCountLabel('AB InBev', '100');
const AB_INBEV_FACILITY_COUNT = getFacilityCountLowerBound('AB InBev', 100) ?? 100;

export const abInbev: AccountMicrositeData = {
  slug: 'ab-inbev',
  accountName: 'AB InBev',
  coverHeadline: 'The yard layer between o9 and Sensolus',
  titleEmphasis: 'between o9 and Sensolus',
  coverFootprint: '~100 US facilities · 9 flagship breweries',
  parentBrand: 'Anheuser-Busch InBev',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 91,

  pageTitle: 'YardFlow for AB InBev — The execution layer between o9 and Sensolus',
  metaDescription:
    'Touchless planning on o9 reached 85% in the U.S. Sensolus proved 15% trailer-fleet utilization in Europe. The yard layer between the o9 plan and the Sensolus telemetry — across nine flagship breweries, ~100 U.S. facilities, an 800-truck dedicated fleet, ABOne owned distribution, and the three-tier wholesaler overlay — is the operating-system tile that has not yet been laid in. The $600M Brewing Futures capex is the timing driver.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the AB InBev U.S. brewing network',
      composition: [
        { label: 'U.S. manufacturing footprint', value: `~${AB_INBEV_FACILITY_COUNT_LABEL} U.S. facilities — nine flagship breweries (post-Newark/Merrimack/Fairfield rationalization) plus agricultural, packaging, and ABOne distributorships. This is the operating-system surface o9 and Sensolus already touch, and the yard layer above the sites does not.` },
        { label: 'Active capex program', value: 'Brewing Futures — $600M U.S. manufacturing investment doubled for 2025–2026 with named site-level commitments at Cartersville GA ($9.2M), Houston TX ($17M), Jacksonville FL ($30M), and Los Angeles CA ($7.4M). Throughput-out-the-brewline becomes trailer-into-the-yard at the same sites within the same cycle.' },
        { label: 'Touchless planning scoreboard', value: 'o9 Solutions runs U.S. demand and supply planning at 85% touchless; forecast accuracy +11pp to 87%; U.S. service levels at 99.5%; U.S. out-of-stocks below 0.5%; inventory cut ~20%. The plan has gotten sharper; the yard has not.' },
        { label: 'Trailer-telemetry coverage seam', value: 'Sensolus IoT trailer telemetry deployed in Europe — published 15% fleet-utilization lift in four months. Whether the partnership has been extended to North American breweries is a discovery question, not a public fact. Either way, telemetry tells the dock where trailers are; it does not tell the dock office which trailer is next, which door, or which spotter move clears the most downstream value.' },
        { label: 'Distribution model', value: 'Three-tier (brewery → wholesaler → retailer) with ABOne (ABSD) owned wholesalers held below ~10% national volume per the operative DOJ understanding; Southern Glazer\'s absorbed the NYC owned-distribution arm in 2025. The same load type leaves a brewery into three different ownership models — owned ABOne, franchise wholesaler, or 3PL cross-dock — and each one runs a different process at the gate.' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard automation has been on the floor at the high-volume breweries for years; current production status across the surviving sites is mixed. The network operating layer above the sites is unsolved either way.' },
        { label: 'Fleet posture', value: '800+ owned trucks, 200+ zero-emission units (Nikola/BYD), plus 3PL and wholesaler equipment converging on the same dock doors. A zero-emission truck cannot wait out yard variability the way a diesel can — battery state of charge is a hard constraint, and the dock is where EV economics either work or quietly stop working.' },
        { label: 'Yard archetype mix', value: 'High-volume breweries with tight night-loading windows for morning DSD · single-facility SKU spread (Cartersville: ~48 SKUs into ~32 states) · summer 1.5× peak (Memorial Day → Labor Day) · Super Bowl week surge · majority three-shift cadence at the flagship sites' },
      ],
      hypothesis:
        'Touchless planning at AB InBev has already paid back — five years running, 85% in the U.S., 99.5% service levels, sub-0.5% out-of-stocks, the Gartner Supply Chain Top 25 citation in 2025. The case is closed at the plan. What it has not become, after five years and a Gartner trophy, is a network operating standard at the dock. Between the o9 load that\'s perfectly planned and the Sensolus trailer that\'s perfectly tracked there is still a window where the driver pulls up to a gatehouse and waits for a human with a radio to decide which door to open. Each site arbitrates that window on its own logic — its own dock priority, its own multi-fleet sequencing, its own treatment of EV-charging constraints — and the three-tier overlay means the same load type lands into three different yard ownership models the moment it leaves the brewery. The network doesn\'t agree with itself on what good looks like at the dock — and that is the part o9 cannot fix from the plan and Sensolus cannot fix from the trailer.\n\nThat gap got more expensive in the last cycle for three reasons. First, touchless planning at 85% removed the slack the dock used to absorb. A 90-minute trailer delay that used to land inside safety stock now lands on a DSD route at dawn; with U.S. out-of-stocks below 0.5%, the headroom is gone. Second, Brewing Futures is putting throughput-into-the-yard pressure on specific named sites (Cartersville, Houston, Jacksonville, Los Angeles) faster than the yard layer at those sites has been re-engineered to absorb it; capex that lifts brewline throughput becomes trailer arrivals at the dock, and modernizing the building without modernizing the yard layer above the sites creates a known flow-control wall at the gatehouse. Third, the EV transition has turned the dock into a battery-economics surface — a zero-emission truck cannot wait out yard variability the way a diesel can, and the yard is where the 200+ Nikola/BYD units either earn their charge schedules or quietly stop running their routes.\n\nThe third thing is the pilot question itself. The flagship high-volume breweries are the marquee deployment targets — they are not the proving ground. The two highest-leverage pilot footprints are different in kind: Cartersville, because it is a single facility producing ~48 SKUs into ~32 states with a $9.2M Brewing Futures capex lift landing on top of an unchanged yard layer (the throughput-into-the-yard pressure is concentrated and visible there); and the ABOne network specifically, because owned distribution avoids the franchise-negotiation overhead that would slow a network rollout, and it is the place where one dock standard can be enforced end-to-end without a wholesaler-by-wholesaler conversation. The proof at either of those earns the right to operate the layer above the rest of the flagship breweries and the franchise-wholesaler dock surface in the wave that follows.',
      pullQuote: 'The network doesn\'t agree with itself on what good looks like at the dock.',
      caveat:
        'This is built from AB InBev\'s public disclosures (the Brewing Futures $600M release, the published o9 customer case material from 2024 and 2025, the published Sensolus partnership results, the Gartner Supply Chain Top 25 2025 citation, and the corporate facilities page) plus reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether Sensolus has been rolled out in North America at all (the published case is European), whether the dock-door logic at the Brewing Futures capex sites has already been re-spec\'d ahead of the throughput lift, and which sites the EV-charging-versus-dock-window constraint is biting first.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/ab-inbev-coverage-map.svg',
        imageAlt: 'Operating-system coverage map. Six tiles representing AB InBev\'s digital-supply-chain operating surface. Planning, Forecast, Inventory, Telemetry, and B2B Demand are covered. The Yard Execution tile is unfilled, marked with an AB InBev navy hairline outline.',
        caption: 'Operating-system coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public AB InBev × o9, AB InBev × Sensolus, BEES, and Brewing Futures disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube — every load is at the weight ceiling), low-margin (every minute of yard waste is a margin point you cannot recover with price), and multi-temp at the premium SKU layer (premium spring and alkaline sit alongside ambient). Primo is years ahead of every other CPG category on yard automation and digitization — they had to be, because the freight cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, mixed owned-and-3PL fleets, and a mature site-level yard-tech stack — and they have layered a network-level yard operating model on top of that stack. The shape similarities to AB InBev are tight: multi-site (Primo bottling plants ↔ AB InBev breweries), regional drop-trailer distribution (Primo DCs ↔ ABOne and franchise wholesalers), mixed fleet (owned + 3PL + wholesaler equipment converging on the same doors), tight night-loading windows for next-morning route delivery, and a digital-supply-chain stack already in place that the yard layer needs to ladder up into. The freight differences favor AB InBev: a case of beer is materially easier than a case of water on the weight-and-margin math. Primo runs the operating layer that sits between a planning system and trailer telemetry — same coordinates as o9-and-Sensolus, harder freight.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The sites where this lands first are not the marquee flagships — they are the highest-leverage proving grounds: Cartersville, a single facility producing ~48 SKUs into ~32 states with a $9.2M Brewing Futures capex lift landing on top of an unchanged yard layer; or the ABOne network specifically, where owned distribution avoids the franchise-negotiation overhead and one dock standard can be enforced end-to-end. The proof at either earns the right to operate the layer above the rest of the flagship breweries and the franchise-wholesaler dock surface in the wave that follows. We would expect the U.S. brewery network to agree with itself on dock-door logic, multi-fleet arbitration, and EV-charging-aware sequencing within two to four quarters of that first pilot.',
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
          source: 'AB InBev × o9 Solutions planning transformation (published customer case material, 2024–2025)',
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
        {
          id: 'siqueira-tenure',
          source: 'Elito Siqueira — public tenure record',
          confidence: 'public',
          detail: '~28 years at AB InBev across logistics, planning, and operations leadership in Asia Pacific, the global supply seat (Global SVP Supply Chain Planning — the o9 era), and now Chief Supply Chain & Distribution Co. Officer for North America. Public executive sponsor of the touchless-planning transformation; AB InBev\'s named voice on supply chain at recurring industry-conference panels in 2024 and 2025.',
          url: 'https://o9solutions.com/articles/ab-inbev-journey-with-o9-transforming-supply-chain-planning',
        },
      ],
      unknowns: [
        'Whether o9 outputs and Sensolus telemetry already arbitrate yard-induced supply variance at the network layer, or whether yard variance is currently absorbed into forecast error and dock-office judgment',
        'Whether Sensolus has been rolled out at North American breweries, or whether the published 15% fleet-utilization result is still Europe-only',
        'Whether the dock-door logic at the Brewing Futures capex sites (Cartersville, Houston, Jacksonville, LA) has been re-spec\'d ahead of the throughput lift, or whether the yard layer at those sites is operating against pre-capex baselines',
        'How the EV-charging-versus-dock-window constraint is being resolved today at the breweries running the 200+ Nikola/BYD units, and which sites are biting first',
        'Whether the ABOne dock standard varies measurably from independent-wholesaler dock practice, and where the standardization gap is widest in the network',
        'How the night-loading-into-DSD-morning sequence is currently arbitrated at sites where the route count exceeds the dock door count by a meaningful multiple',
        'Which of the surviving site-level yard-automation deployments are still in active production today vs. retired through facility consolidation or end-of-life refresh',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. AB InBev is distinctive in this round because the operating-system thinking is already on the floor — o9 for planning, Sensolus for trailer telemetry, BEES for B2B demand capture, the Gartner Supply Chain Top 25 citation as the public scoreboard. The yard is the one layer that has not yet caught the same operating discipline. The three-tier overlay — owned ABOne yards, franchise-wholesaler yards, 3PL cross-docks — makes dock standardization a genuinely harder problem than at a single-channel CPG network, which is the reason a multi-site, multi-fleet comparable like Primo Brands reads across cleanly even though the freight category is different. This brief sizes that gap, not the plan-side wins above it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Elito — the part most worth pushing back on is whether the touchless-planning discipline you have spent five years building at AB InBev has reached the dock layer yet, or whether it stopped at the o9 output and the Sensolus trailer. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
        'Elito, the touchless-planning discipline you carried through twenty-eight years at AB InBev — uniform standards across every region, every plan cycle, every shift — is the same discipline you brought to U.S. demand planning at 85% touchless on o9, to forecast accuracy at 87%, to U.S. service at 99.5%, and to the Gartner Supply Chain Top 25 citation in 2025. The yard is the tile that has not been laid into that operating system yet. The plan-side case for touchless is closed — and won. The network operating layer above the dock is what 85% touchless now demands and what Brewing Futures throughput is about to land on at the named capex sites.',
      openingHook:
        'Touchless planning was your phrase, and the U.S. scoreboard is yours: 85% touchless demand, +11pp forecast accuracy to 87%, service at 99.5%, out-of-stocks below 0.5%, inventory down ~20%. It has reached planning and trailer telemetry. It has not yet reached the dock.',
      stakeStatement:
        'The $600M Brewing Futures program is moving throughput-out-the-brewline across nine flagship breweries — Cartersville, Houston, Jacksonville, Los Angeles are already named. Touchless planning at 85% removed the inventory buffer that used to absorb dock variance. The gap between those two is the network yard layer — and it is the only operating-system tile at AB InBev that is not yet running to a single standard from brewery to ABOne to franchise wholesaler.',

      heroOverride: {
        headline: 'Elito, the touchless discipline you built on planning has not yet reached the dock.',
        subheadline:
          'o9 runs U.S. demand at 85% touchless. Sensolus proved 15% trailer-fleet utilization in Europe. The yard layer between the o9 plan and the Sensolus trailer is the unsolved seam — and the $600M Brewing Futures throughput is about to land on it.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer transformation-operator framing. Twenty-eight years inside AB InBev; he doesn\'t need a glossary. Acknowledge the o9 and Sensolus wins as wins — they are. Position the wedge as the operating layer above sites (network-level dock execution), not as a replacement of either platform. Quote his own language ("touchless," "KPIs at all-time high") sparingly and only where it earns the quote. Cartersville is the most credible single-pilot anchor; ABOne is the most credible network-rollout anchor.',
      kpiLanguage: [
        'touchless dock %',
        'dock-door utilization',
        'trailer dwell',
        'dock-to-route cycle time',
        'multi-fleet dock arbitration',
        'EV-charging-aware sequencing',
        'site-to-site execution variance',
        'three-tier dock standardization',
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
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)' },
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
    eventAttendance: 'Major CPG/beverage operator. Supply-chain technology is a stated priority; Siqueira is a recurring industry-conference speaker on touchless planning.',
    recentNews: [
      'Brewing Futures — $600M U.S. manufacturing investment doubled for 2025–2026 with named site commitments at Cartersville, Houston, Jacksonville, and Los Angeles',
      'o9 Solutions partnership — 85% touchless U.S. demand planning, +11pp forecast accuracy to 87%, 99.5% U.S. service, U.S. out-of-stocks below 0.5%, ~20% inventory reduction',
      'Sensolus partnership — IoT trailer telemetry with a published 15% fleet-utilization lift in four months (European deployment)',
      'Gartner Supply Chain Top 25 — 2025 winner; integrated planning, visibility, and execution discipline as the cited evaluation criteria',
      'Fleet electrification — 200+ zero-emission vehicles operating; Nikola hydrogen-electric and BYD electric partnerships; ENGIE charging/solar infrastructure',
      'BEES B2B platform — 3.7M+ monthly active users; the demand-side digitization layer feeding the o9 plan',
      'Dispatch automation — late deliveries reduced 80% through automated dispatching',
    ],
    supplyChainInitiatives: [
      'Touchless planning (o9)',
      'Trailer telemetry (Sensolus — Europe)',
      'Brewing Futures plant capex',
      'Fleet electrification',
      'Dispatch automation',
      'BEES B2B demand capture',
      'M&A integration standardization',
    ],
    urgencyDriver: 'The touchless-planning discipline Siqueira applied at AB InBev — uniform standards across every region, every plan cycle, every shift — has been delivered for planning (o9 at 85%) and trailer telemetry (Sensolus in Europe) but not for the dock layer above the sites. Brewing Futures throughput is the timing driver: $600M of plant capex landing at named breweries (Cartersville, Houston, Jacksonville, LA) while the yard layer at those sites is operating against pre-capex baselines. Summer-peak surge (1.5× Memorial Day → Labor Day) and the 200+ EV fleet\'s charge-schedule dependence on dock predictability are the operating pressures behind the timing.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Capex program', body: 'Brewing Futures · $600M U.S. plant investment · 2025–2026 · doubled mid-cycle.' },
    { mark: 'Named capex sites', body: 'Cartersville $9.2M · Houston $17M · Jacksonville $30M · LA $7.4M.' },
    { mark: 'Touchless scoreboard', body: 'o9 · 85% touchless U.S. demand · 99.5% service · OOS below 0.5%.' },
    { mark: 'Siqueira in his own words', body: '"Our supply chain KPIs are at an all-time high." Touchless reached planning and telemetry. Not the dock.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Elito Siqueira. The touchless-planning discipline you have spent five years building at AB InBev now runs U.S. demand at 85% touchless and trailer telemetry at 15% lift in the European deployment. The five minutes that follow are about the one tile it has not yet reached.',
    chapters: [
      { id: 'thesis', label: 'I. The plan-side case is closed', start: 0 },
      { id: 'what-touchless-made', label: 'II. What touchless planning made expensive', start: 65 },
      { id: 'unfilled-tile', label: 'III. The unfilled tile between o9 and Sensolus', start: 130 },
      { id: 'not-flagship', label: 'IV. Why the first pilot is not a flagship brewery', start: 195 },
      { id: 'simple-site-proof', label: 'V. What proof at Cartersville or ABOne earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#004B87',
    backgroundVariant: 'dark',
  },
};
