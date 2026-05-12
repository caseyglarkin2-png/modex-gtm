/**
 * Toyota Motor North America — ABM Microsite Data
 * Quality Tier: A (Tier 2, Band B — automotive, JIT-native manufacturer)
 * Pitch shape: TPS-extension wedge. Toyota perfected JIT inside the plant
 * gate; the yard outside the gate runs on radios. Frame as an extension of
 * the operating philosophy, not an alternative to it.
 * Angle: YARD MANAGEMENT — the layer between the supplier truck and the
 * dock that the Toyota Production System has not yet standardized,
 * timed against the Liberty NC battery plant 2026 opening.
 */

import type { AccountMicrositeData } from '../schema';

export const toyota: AccountMicrositeData = {
  slug: 'toyota',
  accountName: 'Toyota',
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
          label: 'Greenfield battery-cell capacity',
          value: 'Toyota Battery Manufacturing North Carolina (TBMNC) in Liberty NC — $13.9B build, ~$14B total NC investment, the largest single investment in Toyota history. Production ramp running through 2026, with first cell output already shipping to U.S. assembly plants',
        },
        {
          label: 'Inbound parts cadence',
          value: 'Milkrun supplier runs and JIT cross-docked inbound to the line; the line-side parts inventory at most TMNA assembly plants is measured in hours of production, not days. Kanban-pull authorization at the dock is downstream of trailer arrival at the gate',
        },
        {
          label: 'Operating philosophy',
          value: "Toyota Production System (TPS) — the global benchmark for lean manufacturing. JIT delivery, kanban-pull, andon-cord stop authority, jidoka (autonomation), heijunka (level loading). Standardized work is the foundation; the yard sits between two layers of standardized work without yet being standardized itself",
        },
        {
          label: 'EV / multi-pathway transition',
          value: 'Toyota\'s multi-pathway electrification strategy means a single assembly line now builds ICE, hybrid, plug-in hybrid, and BEV variants in mixed sequence. Each variant pulls from a different supplier base; the EV powertrain adds battery-cell freight (heavy, hazmat-classified, single-source) to the inbound mix',
        },
        {
          label: 'Logistics-arm involvement',
          value: 'Toyota Tsusho (Toyota Group trading and logistics arm) coordinates a meaningful share of inbound parts logistics across the North American network; the relationship between Tsusho\'s lane planning and the receiving-yard execution at each plant is one of the seams the operating model runs through',
        },
      ],
      hypothesis:
        "The interesting thing about the Toyota yard math is that Toyota's own operating philosophy already names the problem. TPS is built on the kanban-pull principle: a downstream station signals upstream for the part it needs, and the part arrives exactly when the line is ready to consume it. Inside the plant, TPS has standardized that handoff to a level no other manufacturer in the world has matched — sequenced delivery, line-side rack discipline, andon-cord authority that stops the entire line if a part isn't there. The kanban signal works because the part is there. The kanban signal cannot pull a part that hasn't reached the dock. That is the structural observation. Every minute of variance in the yard between the supplier truck arriving at the gate and the trailer being live at the right dock door is, by definition, a TPS violation. The line was ready; the part wasn't. TPS doesn't reach across the gatehouse, not because TPS doesn't have an opinion about it but because the yard layer has been operating below the visibility threshold that TPS standardizes against. Plants have radios, schedulers, and gate guards who know which carriers run which milkruns. That is the same execution architecture most manufacturing yards in North America use, and at most manufacturers it is good enough. At a Toyota assembly plant, with line-side inventory measured in hours, it is the one layer of the JIT chain still operating on the pre-TPS standard. That gap got more expensive in the last three years for two reasons. First, the multi-pathway electrification strategy expanded the inbound supplier base — ICE plus hybrid plus PHEV plus BEV variants on the same line means more SKUs, more carriers, more milkrun routes, more dock-door arbitration decisions per shift than the same plant made five years ago. The variance budget per supplier shrinks as the supplier count grows. Second, TBMNC is the timing accelerant. Liberty NC is a greenfield, the largest single investment in Toyota history, and it is shipping cells into the assembly network as the 2026 ramp builds out. Battery-cell freight is heavy, hazmat-classified, and single-source to the assembly plants it feeds. The yard-ops design for Liberty itself, and for the assembly plants receiving the cells, is being decided now in the window before the operating pattern hardens. The opportunity isn't replacing TPS; nobody is going to replace TPS. The opportunity is extending TPS principles — standardized work, sequenced flow, andon-equivalent stop authority — to the yard layer above the dock, in the same way TPS extended them to the line above the operator decades ago.",
      caveat:
        "This is built from public TMNA disclosures, the public TBMNC investment record, Toyota Production System literature, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether yard variance currently surfaces in TPS metrics today or sits below the visibility threshold, how Toyota Tsusho's lane-planning visibility extends into the receiving yards at the assembly plants, where the TBMNC yard-ops design currently sits in the project plan, and which assembly plant has already started feeling the inbound-mix expansion from multi-pathway electrification at the dock.",
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can't recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Toyota operating profile is different in industry, similar in structural shape: multi-site, multi-supplier, with mature in-plant operating discipline (TPS) already in place, where the binding constraint on throughput is the variance budget per minute rather than the variance budget per dollar. The freight comparison runs the opposite direction from the usual read-across — Primo is harder per case, but a TPS assembly plant has a tighter tolerance per minute than any beverage plant in the country. Both networks have the same underlying problem: site-level execution is mature, network-level yard discipline above the sites is the unsolved layer. If a network operating model can run on water — the operationally hardest CPG freight — the read-across to a JIT assembly network is a different vertical with the same shape, not a harder lift.",
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
          source: 'Toyota Battery Manufacturing North Carolina (TBMNC) investment disclosures',
          confidence: 'public',
          detail: '$13.9B build, ~$14B total NC investment — the largest single investment in Toyota history. Production ramp running through 2026, with cell output already shipping into the U.S. assembly network. Operationally, the cleanest greenfield yard-ops design opportunity in the portfolio.',
          url: 'https://www.toyota.com/usa/newsroom/2024/10/02/toyota-tbmnc-investment-update',
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
      ],
      unknowns: [
        'Whether yard variance currently surfaces inside TPS metrics today, or sits below the visibility threshold the Production System standardizes against',
        'Where the TBMNC yard-ops design currently sits in the project plan — and which function owns the receiving-yard scope inside the build',
        'How Toyota Tsusho\'s lane-planning visibility extends into the receiving yards at the assembly plants, and where the handoff from carrier scheduling to dock execution lives today',
        'Which assembly plant has already started feeling the inbound-supplier-mix expansion from multi-pathway electrification at the dock first',
        'How battery-cell inbound at the assembly plants (hazmat classification, single-source dependency, weight profile) is being handled differently from conventional parts inbound at the same dock',
        'Whether milkrun cascading delay — where a late pickup at one supplier propagates through the rest of a fixed-route — is owned by Tsusho lane planning, the assembly-plant receiving yard, or the inbound carrier in current operating practice',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Toyota is distinctive in this round because the analytical wedge isn't a YardFlow argument; it's a Toyota Production System argument. TPS perfected the standardized handoff inside the plant on the kanban-pull principle decades ago. The yard between the supplier truck and the dock is the one layer that handoff doesn't yet cover — not because TPS doesn't have an opinion about it, but because the yard layer has been operating below the visibility threshold the rest of the Production System runs to. Liberty NC is the cleanest place in the portfolio to set the extension before the pattern hardens.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "If parts of this read wrong against what you see internally for TMNA — particularly whether yard variance is already inside the TPS metric set, where the TBMNC yard-ops design sits today, how the Tsusho-to-receiving-yard handoff actually works, or which assembly plant has felt the multi-pathway inbound-mix expansion first — that's the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
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
        'Toyota lifer (joined 1987). EVP & CSCO / CQO at Toyota Motor North America. Owns purchasing, logistics, quality, integrated planning & control, innovation & strategy, service parts & accessories, and Toyota Production System development across the North American network. TBMNC in Liberty NC sits inside his portfolio.',
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
        "Chris, the Toyota Production System has standardized the handoff inside the plant on the kanban-pull principle for four decades — line-side discipline, sequenced delivery, andon-cord authority. The piece this analysis pokes at is the one layer the Production System hasn't yet covered: the yard between the supplier truck arriving at the gate and the trailer being live at the right dock. Inside the plant, TPS standardizes against minutes. Outside the gate, the same minutes still run on radios. Liberty NC is the cleanest greenfield in the network to extend the standard before the pattern hardens.",
      openingHook:
        "TPS works because the part is there when the line pulls for it. The kanban signal can't pull a part that hasn't reached the dock. That sentence is the analysis: every minute of yard variance between the supplier truck and the dock is, by definition, a Production System violation — the line was ready and the part wasn't. The line-side discipline that took decades to build inside the plant is the same shape of discipline the yard layer above the dock has not yet been standardized to.",
      stakeStatement:
        "Multi-pathway electrification expanded the inbound-supplier base on every assembly line; the variance budget per supplier shrank as the supplier count grew. TBMNC is the timing accelerant — battery-cell freight is heavy, hazmat-classified, and single-source, and the receiving-yard design at Liberty and at the cell-receiving assembly plants is being decided now. Every minute the Production System doesn't standardize at the yard layer is a minute that has to be absorbed somewhere else in the JIT chain.",

      heroOverride: {
        headline: 'The yard between the supplier truck and the dock is the one layer TPS has not yet standardized.',
        subheadline:
          "Line-side discipline inside the plant runs on the tightest JIT standard in manufacturing. The kanban signal cannot pull a part that hasn't reached the dock. Liberty NC is the cleanest greenfield in the network to extend the Production System into the yard before the operating pattern hardens.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        "Peer-to-peer operator framing. Nielsen is a 39-year Toyota lifer running purchasing, logistics, quality, integrated planning, and TPS development at the North American level — he does not need a glossary on JIT. Position the wedge as an extension of TPS, not an alternative to it. The credibility move is naming the kanban-pull contradiction precisely (the signal cannot pull a part that hasn't arrived) and treating the yard layer as the piece of the operating system that has been operating below the Production System's visibility threshold.",
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
      'North America (HQ: Plano TX; assembly plants in Georgetown KY, Princeton IN, San Antonio TX, Blue Springs MS; engine/transmission and components plants in Buffalo WV, Huntsville AL, Troy MO, Jackson TN; TBMNC battery-cell plant in Liberty NC opening through 2026)',
    dailyTrailerMoves: 'High-volume — inbound parts, milkrun supplier consolidations, intra-network components, and outbound finished vehicles across the assembly footprint',
    fleet: 'Toyota Tsusho coordinated lanes plus contract carriers across the inbound supplier base',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: 'High-volume — inbound parts from a multi-thousand supplier base on milkrun and direct lanes; battery-cell inbound from TBMNC to U.S. assembly plants as the 2026 ramp builds out; outbound finished-vehicle lanes from each assembly plant to the dealer network',
  },

  signals: {
    recentNews: [
      'TBMNC Liberty NC battery-cell plant ($13.9B build, ~$14B total NC investment) — the largest single investment in Toyota history; production ramp running through 2026 with cell output already shipping to U.S. assembly plants.',
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
      'TBMNC at Liberty NC is the cleanest greenfield in the portfolio and the largest single investment in Toyota history; the receiving-yard design at Liberty and at the cell-receiving assembly plants is being scoped now. Multi-pathway electrification is the structural driver — the inbound-supplier base on every line is broader than it was three years ago, and the variance budget per supplier has shrunk with it.',
  },

  theme: {
    accentColor: '#DC2626',
    backgroundVariant: 'dark',
  },
};
