/**
 * Toyota Motor North America — ABM Microsite Data
 * Quality Tier: A+ (Tier 2, Band B — automotive, JIT-native manufacturer)
 * Pitch shape: TPS-extension wedge. Toyota perfected JIT inside the plant
 * gate; the yard outside the gate runs on radios. Frame as an extension of
 * the operating philosophy, not an alternative to it.
 * Angle: YARD MANAGEMENT — the layer between the supplier truck and the
 * dock that the Toyota Production System has not yet standardized,
 * timed against the TBMNC Liberty NC battery plant ramp (production
 * officially powered on November 2025; 14 lines / 30 GWh full capacity;
 * cells feed Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first
 * U.S.-built Toyota 3-row BEV).
 *
 * Phase 9 A+ uplift extends the Phase 7 baseline ("The yard layer above
 * TPS"). Adds: TPS coverage-map artifact (5 covered TPS tiles + YARD
 * NETWORK OPS unfilled in Toyota red #EB0A1E); TBMNC ramp + multi-pathway
 * variance + line-side inventory composition rows; Primo-to-TPS-extension
 * closing on the comparable; Nielsen tenure source + 2 new methodology
 * unknowns; Nielsen-personalized about + signOff hooking the Georgetown
 * 1987 buyer origin and the 2017 EVP/CSCO/CQO seat with TPS-development
 * scope.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const toyota: AccountMicrositeData = {
  slug: 'toyota',
  accountName: 'Toyota',
  coverHeadline: 'The yard layer above TPS',
  titleEmphasis: 'above TPS',
  coverFootprint: '14 US plants · TBMNC ramping',
  parentBrand: 'Toyota Motor North America',
  vertical: 'automotive',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Toyota Motor North America · JIT assembly requires JIT yard execution — the protocol gap',
  metaDescription:
    'Toyota Motor North America operates a 14-plant U.S. assembly footprint on the tightest JIT discipline in manufacturing. The yard between the supplier gate and the assembly dock is the one layer the Toyota Production System has not standardized.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Toyota U.S. network',
      composition: [
        {
          label: 'U.S. assembly footprint',
          value: '14 manufacturing facilities across vehicle assembly, engines, and components — Georgetown KY (Camry, Lexus ES — the largest single Toyota plant in the world), Princeton IN (Highlander, Sequoia, Grand Highlander), San Antonio TX (Tundra, Sequoia), Blue Springs MS (Corolla), Buffalo WV (engines/transmissions), plus parts and accessory plants',
        },
        {
          label: 'TBMNC greenfield ramp',
          value: 'Toyota Battery Manufacturing North Carolina (TBMNC) in Liberty NC — $13.9B build, ~$14B total NC investment, the largest single investment in Toyota history. 1,850-acre site; production officially powered on November 2025 with first cell shipments in June 2025; ramping to 14 production lines and ~30 GWh annually at full capacity. Cells feed Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first U.S.-built Toyota 3-row BEV. The receiving-yard design at Liberty and at the cell-receiving assembly plants is being set during the 2025–2027 ramp window, before the operating pattern hardens',
        },
        {
          label: 'Line-side inventory math',
          value: 'Line-side parts inventory at TMNA assembly plants is measured in hours of production, not days — at the Camry / Lexus ES line at Georgetown the line-side buffer is denominated in single-digit hours. The kanban-pull authorization at the dock fires downstream of trailer arrival at the gate; every minute of variance between the supplier truck reaching the gate and the trailer being live at the right dock door consumes a measurable percentage of the line-side buffer for that part',
        },
        {
          label: 'Multi-pathway variance budget',
          value: "Toyota's multi-pathway strategy means a single assembly line now builds ICE, hybrid, PHEV, and BEV variants in mixed sequence. Each variant pulls from a different supplier subset; the inbound-SKU set on a multi-pathway line is materially larger than on the same line five years ago. The variance budget per supplier shrinks as the supplier count grows — same kanban tolerance, more arrivals to land inside it. Battery-cell freight from TBMNC adds heavy, hazmat-classified, single-source flow to the inbound mix",
        },
        {
          label: 'Operating philosophy',
          value: "Toyota Production System (TPS) — the global benchmark for lean manufacturing. JIT delivery, kanban-pull, andon-cord stop authority, jidoka (autonomation), heijunka (level loading). Standardized work is the foundation; the yard between the supplier gate and the dock sits between two layers of standardized work without yet being standardized itself",
        },
        {
          label: 'Logistics-arm involvement',
          value: 'Toyota Tsusho (Toyota Group trading and logistics arm) coordinates a meaningful share of inbound parts logistics across the North American network; the relationship between Tsusho\'s lane planning and the receiving-yard execution at each plant is one of the seams the operating model runs through',
        },
      ],
      hypothesis:
        "The interesting thing about the Toyota yard math is that Toyota's own operating philosophy already names the problem. TPS is built on the kanban-pull principle: a downstream station signals upstream for the part it needs, and the part arrives exactly when the line is ready to consume it. Inside the plant, TPS has standardized that handoff to a level no other manufacturer in the world has matched — sequenced delivery, line-side rack discipline, andon-cord authority that stops the entire line if a part isn't there. The kanban signal works because the part is there. The kanban signal cannot pull a part that hasn't reached the dock. That is the structural observation, and the corollary follows from it: every minute of variance between the supplier truck arriving at the gate and the trailer being live at the right dock door is, by definition, a TPS violation. The line was ready; the part wasn't. TPS doesn't reach across the gatehouse today not because the Production System doesn't have an opinion about the yard but because the yard layer has been operating below the visibility threshold TPS standardizes against — radios, schedulers, gate guards who know which carriers run which milkruns. At most North American manufacturers that is good enough. At a TMNA assembly plant, with line-side inventory in single-digit hours, it is the one layer of the JIT chain still running on the pre-TPS standard.\n\nThat gap got more expensive in the last three years for two compounding reasons. First, the multi-pathway electrification strategy expanded the inbound supplier base — ICE plus hybrid plus PHEV plus BEV variants on the same line means more SKUs, more carriers, more milkrun routes, and more dock-door arbitration decisions per shift than the same plant made five years ago. The kanban tolerance per supplier is unchanged; the supplier count grew under it. Second, TBMNC is the timing accelerant. Liberty NC officially powered on production in November 2025 and is ramping toward 14 production lines and 30 GWh of annual cell output. Battery-cell freight is heavy, hazmat-classified, and single-source to the assembly plants it feeds — Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first U.S.-built Toyota 3-row BEV. The yard-ops design for Liberty itself, and for the assembly plants receiving the cells, is being scoped now in the window before the operating pattern hardens.\n\nThe opportunity isn't replacing TPS; nobody is going to replace TPS. The opportunity is extending TPS principles — standardized work, sequenced flow, andon-equivalent stop authority — to the yard layer above the dock, in the same way TPS extended them to the line above the operator decades ago. The wedge is the extension, not the alternative.",
      pullQuote: "The kanban signal cannot pull a part that hasn't reached the dock.",
      caveat:
        "This is built from public TMNA disclosures, the public TBMNC investment record, Toyota Production System literature, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether yard variance currently surfaces in TPS metrics today or sits below the visibility threshold, how Toyota Tsusho's lane-planning visibility extends into the receiving yards at the assembly plants, where the TBMNC yard-ops design currently sits in the project plan, and which assembly plant has already started feeling the inbound-mix expansion from multi-pathway electrification at the dock.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/toyota-coverage-map.svg',
        imageAlt: 'Toyota Production System coverage map. Six tiles representing the operating layers of TPS. TPS Production, Jidoka Quality, Just-In-Time, Kanban Pull, and Heijunka Leveling are covered. The Yard Network Ops tile is unfilled, marked with a Toyota red hairline outline.',
        caption: 'TPS coverage map · 1 layer unfilled.',
        source: 'Composition modeled from public TPS literature + TMNA operations disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can't recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Toyota operating profile is different in industry, similar in structural shape: multi-site, multi-supplier, with mature in-plant operating discipline (TPS) already in place, where the binding constraint on throughput is the variance budget per minute rather than the variance budget per dollar. The freight comparison runs the opposite direction from the usual read-across — Primo is harder per case, but a TPS assembly plant has a tighter tolerance per minute than any beverage plant in the country. Both networks have the same underlying problem: site-level execution is mature, network-level yard discipline above the sites is the unsolved layer. If a network operating model can run on water — the operationally hardest CPG freight — the read-across to a JIT assembly network is a different vertical with the same shape, not a harder lift. The shape Primo built above its plants is the same shape TPS would extend above the dock: standardized work, sequenced flow, and stop-authority at the layer that today still runs on radios.",
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at Toyota are different in kind: (1) TBMNC in Liberty NC, because it is a greenfield with no entrenched yard-ops habit to displace and the receiving design is still being scoped while the cell-production ramp builds out; (2) Georgetown KY, because it is the highest-throughput single assembly plant in the world, runs the most concurrent variant mix on one site, and is where any network-wide protocol ultimately has to prove out under the tightest JIT tolerance in the network. We would expect the operating model to make sense of itself across the assembly network within two to four quarters of the pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'tmna-public-network',
          source: 'Toyota Motor North America public manufacturing disclosures',
          confidence: 'public',
          detail: 'Anchors the 14-plant U.S. footprint, the Georgetown / Princeton / San Antonio / Blue Springs / Buffalo / Huntsville plant set, and the multi-pathway electrification scope across ICE, hybrid, PHEV, and BEV variants on shared lines.',
          url: 'https://www.toyota.com/usa/operations/',
        },
        {
          id: 'tbmnc-investment',
          source: 'Toyota Battery Manufacturing North Carolina (TBMNC) investment + production disclosures',
          confidence: 'public',
          detail: '$13.9B build, ~$14B total NC investment — the largest single investment in Toyota history. 1,850-acre site, ~5,100 jobs at full ramp. First cell shipments June 2025; production officially powered on November 12, 2025. At full capacity, 14 production lines and ~30 GWh annually feeding Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first U.S.-built Toyota 3-row BEV. Operationally, the cleanest greenfield yard-ops design opportunity in the portfolio.',
          url: 'https://pressroom.toyota.com/facility/toyota-battery-manufacturing-north-carolina/',
        },
        {
          id: 'tps-public',
          source: 'Toyota Production System (TPS) public literature',
          confidence: 'public',
          detail: 'Standard references on JIT delivery, kanban-pull, jidoka, heijunka, andon-cord authority, and standardized work — the operating philosophy that defines line-side discipline at every TMNA assembly plant. The argument that the yard is the unstandardized layer of an otherwise standardized operating system runs through this literature, not against it.',
        },
        {
          id: 'tmna-multi-pathway',
          source: 'Toyota multi-pathway electrification strategy reporting',
          confidence: 'public',
          detail: 'Toyota\'s public position that the U.S. assembly network builds ICE, hybrid, PHEV, and BEV variants in mixed sequence on shared lines. Industry trade-press coverage (Automotive News, Reuters) documents the inbound-supplier-mix implications as the variant set expands.',
        },
        {
          id: 'tsusho-logistics',
          source: 'Toyota Tsusho North America logistics disclosures',
          confidence: 'public',
          detail: 'Toyota Group trading and logistics arm; coordinates a meaningful share of inbound parts logistics across the assembly network. The lane-planning-to-receiving-yard handoff is one of the seams the operating model runs through; specifics on which lanes Tsusho owns versus contract carriers are not fully public.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + automotive-industry yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site assembly networks operate under, not Toyota specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'nielsen-tenure',
          source: 'Chris Nielsen — public tenure record',
          confidence: 'public',
          detail: 'Joined Toyota in 1987 as a buyer at the Georgetown, Kentucky plant; rose to EVP, Chief Supply Chain Officer & Chief Quality Officer at TMNA in 2017. ~39-year Toyota lifer with a TPS-development portfolio at the North American level. Owns purchasing, logistics, quality, integrated planning & control, innovation & strategy, service parts & accessories, and the TPS development groups.',
          url: 'https://pressroom.toyota.com/biographies/chris-nielsen/',
        },
      ],
      unknowns: [
        'Whether yard variance currently surfaces inside TPS metrics today, or sits below the visibility threshold the Production System standardizes against',
        'Where the TBMNC yard-ops design currently sits in the project plan — and which function owns the receiving-yard scope inside the build, especially as cell output ramps toward the 14-line / 30 GWh full-capacity profile',
        'How Toyota Tsusho\'s lane-planning visibility extends into the receiving yards at the assembly plants, and where the handoff from carrier scheduling to dock execution lives today',
        'Which assembly plant has already started feeling the inbound-supplier-mix expansion from multi-pathway electrification at the dock first',
        'How battery-cell inbound at the assembly plants (hazmat classification, single-source dependency, weight profile) is being handled differently from conventional parts inbound at the same dock — and whether the receiving cadence for cells has been treated as a separate kanban tier or folded into the existing milkrun pattern',
        'Whether milkrun cascading delay — where a late pickup at one supplier propagates through the rest of a fixed-route — is owned by Tsusho lane planning, the assembly-plant receiving yard, or the inbound carrier in current operating practice',
        'Whether the receiving-yard design currently being scoped at Liberty NC has been carried back into the TPS-development scope as a standardized-work problem, or is being treated site-locally inside the TBMNC build team',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Toyota is distinctive in this round because the analytical wedge isn't a YardFlow argument; it's a Toyota Production System argument. TPS perfected the standardized handoff inside the plant on the kanban-pull principle decades ago. The yard between the supplier truck and the dock is the one layer that handoff doesn't yet cover — not because TPS doesn't have an opinion about it, but because the yard layer has been operating below the visibility threshold the rest of the Production System runs to. Liberty NC is the cleanest place in the portfolio to set the extension before the pattern hardens.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Chris — you joined Toyota at Georgetown in 1987 and carried the TPS-development scope into the EVP & CSCO seat in 2017; the argument in this brief is that the same standardized-work discipline that took the line above the operator could now take the yard above the dock. The part most worth pushing back on is whether yard variance is already inside the TPS metric set you run to, where the TBMNC yard-ops design sits today, how the Tsusho-to-receiving-yard handoff actually works, or which assembly plant has felt the multi-pathway inbound-mix expansion first. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'toyota-001',
      name: 'Chris Nielsen',
      firstName: 'Chris',
      lastName: 'Nielsen',
      title: 'Executive Vice President & Chief Supply Chain Officer / Chief Quality Officer',
      company: 'Toyota Motor North America',
      email: 'chris.nielsen@toyota.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain / Operations',
      currentMandate:
        'Toyota lifer — joined 1987 as a purchasing buyer at the Georgetown KY plant; rose to EVP, Chief Supply Chain Officer & Chief Quality Officer at Toyota Motor North America in 2017. Owns purchasing, logistics, quality, integrated planning & control, innovation & strategy, service parts & accessories, and Toyota Production System development across the North American network. TBMNC in Liberty NC (production powered on November 2025; ramping to 14 lines / 30 GWh full capacity) sits inside his portfolio. Reports up to Tetsuo "Ted" Ogawa, President & CEO of TMNA.',
      bestIntroPath:
        'Direct outreach to the CSCO office. Secondary routing through VP Logistics / VP Production Engineering, with Toyota Tsusho North America logistics-planning leadership as a parallel path on the inbound-lane side of the yard handoff.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'toyota-001',
        name: 'Chris Nielsen',
        firstName: 'Chris',
        lastName: 'Nielsen',
        title: 'Executive Vice President & Chief Supply Chain Officer / Chief Quality Officer',
        company: 'Toyota Motor North America',
        email: 'chris.nielsen@toyota.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Chris Nielsen - Executive Vice President & Chief Supply Chain Officer / Chief Quality Officer',
      variantSlug: 'chris-nielsen',

      framingNarrative:
        "Chris, you came in as a buyer at Georgetown in 1987 and you have run the TPS-development scope into the EVP & CSCO seat since 2017. The thesis here is not a YardFlow argument; it's a TPS argument. The Production System standardized the line above the operator decades ago on the kanban-pull principle. The yard between the supplier truck and the dock is the one layer that handoff doesn't yet cover — not because TPS doesn't have an opinion about it, but because the yard layer has been operating below the visibility threshold the rest of the Production System runs to. Liberty NC is the cleanest greenfield in the network to set the extension before the pattern hardens.",
      openingHook:
        "TPS works because the part is there when the line pulls for it. The kanban signal cannot pull a part that hasn't reached the dock. That sentence is the analysis: every minute of yard variance between the supplier truck and the dock is, by definition, a Production System violation — the line was ready and the part wasn't. The line-side discipline that took decades to build inside the plant is the same shape of discipline the yard layer above the dock has not yet been standardized to. The wedge is extension, not alternative.",
      stakeStatement:
        "Multi-pathway electrification expanded the inbound-supplier base on every assembly line; the variance budget per supplier shrank as the supplier count grew under an unchanged kanban tolerance. TBMNC is the timing accelerant — Liberty officially powered on production in November 2025 and is ramping to 14 lines and 30 GWh of cell output feeding Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first U.S.-built 3-row BEV. Battery-cell freight is heavy, hazmat-classified, and single-source, and the receiving-yard design at Liberty and at the cell-receiving assembly plants is being scoped now. Every minute the Production System doesn't standardize at the yard layer is a minute that has to be absorbed somewhere else in the JIT chain — or it lands on the line.",

      heroOverride: {
        headline: 'The yard between the supplier truck and the dock is the one layer TPS has not yet standardized.',
        subheadline:
          "Line-side discipline inside the plant runs on the tightest JIT standard in manufacturing. The kanban signal cannot pull a part that hasn't reached the dock. Liberty NC is the cleanest greenfield in the network to extend the Production System into the yard before the operating pattern hardens.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Peer-to-peer operator framing. Nielsen is a 39-year Toyota lifer — Georgetown buyer in 1987, EVP & CSCO / CQO from 2017 — running purchasing, logistics, quality, integrated planning, and TPS development at the North American level. He does not need a glossary on JIT or kanban; he wrote the standardized-work discipline this brief proposes extending. Position the wedge as an extension of TPS, not an alternative to it. The credibility move is naming the kanban-pull contradiction precisely (the signal cannot pull a part that hasn't arrived) and treating the yard as the piece of the operating system that has been running below the Production System's visibility threshold, not outside its philosophy.",
      kpiLanguage: [
        'gate-to-dock cycle time',
        'milkrun cascade delay',
        'kanban-pull integrity',
        'inbound-parts variance per shift',
        'dock-door arbitration at multi-variant plants',
        'TBMNC receiving-yard design',
        'carrier scorecard across Tsusho and contract lanes',
        'standardized work at the yard layer',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — different vertical, same structural shape: multi-site, multi-input, mature in-plant operating discipline already in place, network-level yard discipline above the sites as the unsolved layer. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at manufacturing facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'Primo Brands operates more than 200 contracted facilities on the same production-and-distribution model. YardFlow cut their gate-to-dock time from 48 to 24 minutes.',
        role: 'Operations Director',
        company: 'National Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '14 U.S. manufacturing facilities plus TBMNC battery-cell plant in Liberty NC',
    facilityTypes: ['Vehicle Assembly Plants', 'Engine & Transmission Plants', 'Parts & Accessory Plants', 'Battery-Cell Manufacturing'],
    geographicSpread:
      'North America (HQ: Plano TX; assembly plants in Georgetown KY, Princeton IN, San Antonio TX, Blue Springs MS; engine/transmission and components plants in Buffalo WV, Huntsville AL, Troy MO, Jackson TN; TBMNC battery-cell plant in Liberty NC, production powered on November 2025 and ramping to 14 lines / 30 GWh)',
    dailyTrailerMoves: 'High-volume — inbound parts, milkrun supplier consolidations, intra-network components, and outbound finished vehicles across the assembly footprint',
    fleet: 'Toyota Tsusho coordinated lanes plus contract carriers across the inbound supplier base',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — inbound parts from a multi-thousand supplier base on milkrun and direct lanes; battery-cell inbound from TBMNC to U.S. assembly plants as the 14-line / 30 GWh ramp builds out; outbound finished-vehicle lanes from each assembly plant to the dealer network',
  },

  signals: {
    recentNews: [
      'TBMNC Liberty NC battery-cell plant ($13.9B build, ~$14B total NC investment) — the largest single investment in Toyota history; production officially powered on November 2025 (first cell shipments June 2025), ramping to 14 production lines and ~30 GWh annually at full capacity feeding Camry HEV, Corolla Cross HEV, RAV4 HEV, and the first U.S.-built Toyota 3-row BEV.',
      'Multi-pathway electrification strategy holding the line through 2025–2026 — ICE, hybrid, PHEV, and BEV variants in mixed sequence on shared lines across the U.S. assembly network.',
      'Georgetown KY (largest Toyota plant in the world) continues to anchor Camry and Lexus ES production while the variant mix expands.',
      'Toyota Tsusho North America coordinating inbound logistics across a multi-thousand supplier base as the EV transition reshapes the supplier mix.',
    ],
    supplyChainInitiatives: [
      'TBMNC Liberty NC greenfield buildout — yard-ops design active in the window before operating patterns harden.',
      'Multi-pathway electrification inbound-mix expansion across the assembly network.',
      'Toyota Production System development at the North American level — site-level work standardization with the yard layer above the sites as the unstandardized seam.',
    ],
    urgencyDriver:
      'TBMNC at Liberty NC is the cleanest greenfield in the portfolio and the largest single investment in Toyota history; production officially powered on in November 2025 and the receiving-yard design at Liberty and at the cell-receiving assembly plants is being scoped through the 14-line / 30 GWh ramp window. Multi-pathway electrification is the structural driver — the inbound-supplier base on every line is broader than it was three years ago, and the variance budget per supplier has shrunk with it.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Greenfield', body: 'TBMNC Liberty NC · $13.9B build · largest single investment in Toyota history · production powered on November 2025 · ramping to 14 lines / 30 GWh.' },
    { mark: 'Operating philosophy', body: 'TPS standardizes the line above the operator. The yard above the dock is the unstandardized seam.' },
    { mark: 'Inbound mix', body: 'Multi-pathway electrification — ICE + hybrid + PHEV + BEV on one line. Variance budget per supplier shrinks as supplier count grows.' },
    { mark: 'Line-side tolerance', body: 'TMNA assembly plants run line-side inventory in hours, not days. Yard variance lands on the line.' },
    { mark: 'Coverage map', body: '5 TPS tiles covered. 1 unfilled. The yard layer above the dock.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, different freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      "This brief is for Chris Nielsen. You came in as a buyer at Georgetown in 1987 and carried the TPS-development scope into the EVP & CSCO seat in 2017. The Production System has standardized the line-side handoff inside the plant on the kanban-pull principle for four decades. The five minutes that follow are about the one layer TPS has not yet covered — the yard between the supplier truck and the dock — and why Liberty NC is the cleanest greenfield in the network to extend the standard before the pattern hardens.",
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#EB0A1E',
    backgroundVariant: 'dark',
  },
};
