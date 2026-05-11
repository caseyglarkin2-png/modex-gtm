/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * UNFI inherited a PINC/Kaleris-era yard RFID footprint when it acquired
 * SuperValu in 2018. SuperValu is named in published PINC customer
 * materials and the Kaleris/Daimler case study customer list. Specifics:
 *   - PINC RFID-generation tooling at legacy SuperValu DCs — solved
 *     2010-era trailer-tracking; never designed for the network-level
 *     operating model UNFI now needs
 *   - 3+ years of UNFI integration + the DC closure cadence (Logan
 *     Township, Billings, Bismarck, Fort Wayne, Sturtevant, Allentown)
 *     means some originally-named sites may have been retired
 *   - Legacy UNFI side (natural/organic specialty) never had the same
 *     RFID build-out; third generation of facilities (Manchester PA H1
 *     FY25, Sarasota FL H1 FY26) is being commissioned on whatever the
 *     current standard is. Three generations of yard tooling across the
 *     same enterprise.
 *
 * Persona context: Mark Bushway promoted to dual-chair role January 2025
 * (President Natural/Organic/Specialty & Fresh Products + CSCO). 20+ year
 * UNFI tenure (joined 2003 from C&S Wholesale Grocers — 13 years there
 * 1989–2003). Promoted from Atlantic Region President (8 DCs) to CSCO Jan
 * 2022 → dual chair Jan 2025. Operator path. Erin Horvath is a NEW CSCTO
 * peer-or-adjacent role (separation of "run the network" / "rebuild the
 * operating model").
 *
 * Cyberattack June 2024: shut down entire UNFI network for weeks; $350M-
 * $425M sales impact disclosed. EVERY operating-tech proposal in 2026 is
 * screened against "what happens when this goes dark for a week."
 *
 * Pitch shape: MODERNIZATION (operating model above the legacy SuperValu
 * PINC stack + the new-build third generation). Not displacement of any
 * specific tool — ingestion of multiple stacks into one network operating
 * layer. Cyberattack-resilience-aware: cached-local gate decisions,
 * documented degraded-operating procedure, edge-resident logic.
 *
 * Previous outreach: March 28 / March 30, 2026 cold emails on cold-chain
 * gate-to-dock framing reached Bushway. No reply. Second-touch must use a
 * materially different angle (consolidation throughput math, not cold-chain
 * food-safety).
 *
 * This intel powers the cold-email modernization framing (see
 * docs/research/mark-bushway-unfi-dossier.md). It must not appear in any
 * prospect-facing surface. The memo references "the legacy SuperValu yard
 * stack" / "the three generations of yard tooling running across the same
 * enterprise" — never PINC/Kaleris.
 */

/**
 * UNFI — ABM Microsite Data
 * Quality Tier: B (probable Kaleris/PINC at legacy SuperValu DCs —
 *                  SuperValu named in published PINC customer materials;
 *                  current active deployment depth after 3+ years of UNFI
 *                  integration and DC closures is unverified)
 * Pitch shape: modernization — operating-model layer above three
 *              generations of yard tooling (legacy SuperValu, legacy UNFI
 *              natural-specialty, new-build Manchester / Sarasota)
 * Angle: YARD MANAGEMENT (consolidation throughput math at surviving DCs;
 *        multi-banner outbound — Whole Foods + independent natural +
 *        conventional + Cub Foods/Shoppers — through the same dock surface;
 *        cold-chain time-to-temp-check; cyberattack resilience as
 *        screening criterion) — NOT driver experience
 * Stakeholder vocabulary: long-tenure-DC-operator register
 *        (Bushway\'s 23 years of DC and regional GM seat-time before
 *        corporate chair; cyberattack-rebuild leadership; dual-chair
 *        President + CSCO mandate) — throughput per dock, detention
 *        recovery, on-time-out-the-gate, cold-chain time-to-temp,
 *        resilience under outage
 */

import type { AccountMicrositeData } from '../schema';

export const unfi: AccountMicrositeData = {
  slug: 'unfi',
  accountName: 'UNFI',
  parentBrand: 'United Natural Foods, Inc.',
  vertical: 'grocery',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for UNFI - The Operating Model Above Three Generations of Yard Tooling',
  metaDescription:
    'How a network-level yard operating model lands on top of the three generations of yard tooling running across the combined UNFI network — the legacy SuperValu RFID-era stack, the legacy UNFI natural-organic-specialty footprint, and the third-generation new-builds at Manchester PA and Sarasota FL — and survives the cyberattack-resilience screening criterion The Great Consolidation makes non-negotiable.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the UNFI network',
      composition: [
        { label: 'Network mid-consolidation', value: '52 DCs across US and Canada at the June 2024 cyberattack disclosure (down from 56 at Bushway\'s CSCO appointment Dec 2021). Lower again by FY27. The closure cadence: Logan Township NJ (2023) → Allentown PA; Billings MT + Bismarck ND (2024); Fort Wayne IN (Feb 2025) + two Central region DCs; Sturtevant WI (443 positions by Aug 2026); Allentown PA closing in 2026 — the same site that absorbed Logan Township volume two years earlier' },
        { label: 'New capacity in parallel', value: 'Manchester PA opened Q1 FY25; Sarasota FL scheduled H1 FY26. Pattern: "fewer, larger, more automated" — textbook regional-DC consolidation. Three generations of yard tooling now running across the same enterprise (legacy SuperValu, legacy UNFI natural-organic, new-build) on the same closure-and-consolidation timeline shoving more trailers per dock through the surviving facilities' },
        { label: 'Existing yard-tech layer', value: 'The legacy SuperValu DCs that joined UNFI in 2018 brought a 2010-era yard RFID stack designed for site-by-site trailer tracking. The legacy UNFI natural-organic side never had the same RFID build-out. Manchester PA + Sarasota FL are being commissioned on whatever the current standard is. The network-level operating-model layer that runs all three generations as one yard is unsolved' },
        { label: 'Mixed-banner outbound through shared docks', value: 'Wholesale to Whole Foods (high-volume, scheduled, multi-temp, predictable cadence) + wholesale to independent natural grocers (lower-volume, more sites per route, brittle SKU mix) + wholesale to conventional grocers (legacy SuperValu customer base, scheduled FTL) + replenishment to UNFI\'s own retail banners (Cub Foods, Shoppers, separate cadence). Yards serving multiple of these patterns simultaneously have to stage trailers for fundamentally different outbound rhythms' },
        { label: 'Cyberattack-resilience screening criterion', value: 'June 5–6, 2024 cyberattack disconnected the entire UNFI network for weeks; Whole Foods stores ran on empty shelves; $350M–$425M sales loss disclosed. Bushway was the CSCO of record during the event and led the network walk-back to normal. Every operating-tech proposal in 2026 is screened against "what happens to this if the systems go dark for a week"' },
        { label: 'Dual chair + transformation seam', value: 'Bushway is President of Natural/Organic/Specialty & Fresh Products AND CSCO since January 2025 — divisional P&L plus enterprise supply chain in one seat. Erin Horvath joined in a new Chief Supply Chain Transformation Officer role separating "run the network" (Bushway) from "rebuild the operating model" (Horvath). Both names belong in any operating-model conversation' },
      ],
      hypothesis:
        'The interesting thing about the UNFI yard math is the structural unevenness. The 2018 SuperValu acquisition brought a 2010-era yard RFID footprint into the company overnight — sized for the conventional-grocery wholesale Plains DC pattern, on a customer mix that included Cub Foods (now UNFI-owned) and a long tail of conventional independents. The legacy UNFI side that pre-dated SuperValu was the natural-organic specialist with a smaller-average-facility, refrigerated-heavy, cluster-near-Whole-Foods profile that never had the same RFID build-out investment. The Manchester PA and Sarasota FL new-builds being commissioned now run on whatever the current standard is — three generations of yard tooling across the same enterprise. That gap got more expensive in three steps in the last twenty-four months. First, The Great Consolidation closure cadence (Logan Township into Allentown, Billings + Bismarck, Fort Wayne, the Central region DCs, Sturtevant, Allentown closing in 2026) inherently compresses trailers through fewer surviving docks — same demand, fewer DCs, more trucks per surviving yard. Each closure is a forced yard-protocol decision at the receiving facility, because the inbound trailer pool changes shape with every closure. Second, the June 2024 cyberattack made cyber-and-operational resilience the screening criterion for every operating-technology proposal — vendors who do not have a documented graceful-degradation mode lose the meeting in the first conversation. Third, the January 2025 division split (Natural/Organic/Specialty/Fresh under Bushway, Conventional Grocery under a separate President, Retail under David Best running the Cub Foods / Shoppers banner business) made the yard the point where three divisions\' priorities meet — and there is no network-level yard operating system today that surfaces the right ownership lens at the right moment. The modernization wedge writes itself from this combination, and it writes itself in a particular shape: not rip-and-replace, but operating-model layer above the legacy SuperValu RFID footprint, the legacy UNFI natural-organic footprint, and the new-build third generation, with documented resilience under outage.',
      caveat:
        'This is built from UNFI investor disclosures, the Great Consolidation analyst framing, the June 2024 cyberattack disclosures and recovery commentary, the published DC closure cadence, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how much of the legacy SuperValu yard RFID footprint remains active after 3+ years of UNFI integration and the closure cadence, which surviving DCs are running closest to dock-cycle saturation in 2026, and how the Bushway-Horvath role split is currently coordinating around operating-model decisions vs. operating-network decisions.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The UNFI operating profile is shape-similar — multi-site, multi-temp (ambient + refrigerated + frozen + controlled-environment specialty), 3PL-DC-dependent for some flows but private-fleet-dependent for retail-banner replenishment, with the same shape of heterogeneous-yard-tooling-after-acquisition problem the comparable directly resolved — but at wholesale-grocery economics with the Whole Foods, independent natural, conventional, and Cub Foods banner mix that no single CPG peer carries. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a 52-DC mid-consolidation grocery wholesale network running on three generations of yard tooling is the easier lift.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The cleanest first pilot at UNFI is one consolidation-receiving DC — Manchester PA (new-build, opened Q1 FY25) or one of the surviving Plains DCs absorbing the Billings/Bismarck volume re-allocation. Manchester is the new-build greenfield embed where the operating-model layer ships into the building rather than retrofitting. The Plains DC is the closure-pressure embed where the throughput-per-dock math is most visible. Either approach lands inside The Great Consolidation operating narrative the CEO is selling Wall Street.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'unfi-public-network',
          source: 'UNFI investor disclosures + Great Consolidation analyst framing',
          confidence: 'public',
          detail: 'Anchors the 52-DC count at the June 2024 cyberattack disclosure (down from 56 at Bushway\'s December 2021 CSCO appointment), the closure cadence (Logan Township NJ 2023; Billings MT + Bismarck ND 2024; Fort Wayne IN Feb 2025; Sturtevant WI Aug 2026; Allentown PA 2026), the new capacity (Manchester PA Q1 FY25, Sarasota FL H1 FY26), and the "fewer, larger, more automated" pattern.',
          url: 'https://www.unfi.com/',
        },
        {
          id: 'unfi-cyberattack',
          source: 'UNFI June 2024 cyberattack disclosures + recovery commentary',
          confidence: 'public',
          detail: 'Cyberattack disclosed June 5–6, 2024; entire IT network disconnected; recovery extended past initial June 15 target; $350M–$425M sales loss disclosed; cyber insurance recovery through FY2026. Bushway was CSCO of record during the event and led the network walk-back to normal operations. Resilience under outage is now the screening criterion for every operating-tech proposal.',
        },
        {
          id: 'unfi-supervalu-acquisition',
          source: 'UNFI / SuperValu integration legacy',
          confidence: 'public',
          detail: 'UNFI acquired SuperValu in 2018 — overnight expansion from ~30 natural-organic specialist DCs to ~60 combined DCs and the conventional-grocery wholesale Plains footprint. SuperValu is named in the published category-vendor reference materials for site-level yard automation — the legacy RFID-era yard footprint UNFI inherited. Active deployment depth after 3+ years of UNFI integration and DC closures is unverified at the site level.',
        },
        {
          id: 'unfi-division-split',
          source: 'UNFI wholesale division realignment (January 2025)',
          confidence: 'public',
          detail: 'Wholesale division split into Conventional Grocery Products and Natural/Organic/Specialty/Fresh Products. Bushway runs Natural/Organic/Specialty/Fresh + enterprise CSCO. David Best appointed President & CEO of Retail (Cub Foods / Shoppers) August 2025. Erin Horvath joined as Chief Supply Chain Transformation Officer — new role separating "run the network" from "rebuild the operating model."',
        },
        {
          id: 'unfi-bushway-career',
          source: 'Mark Bushway public career record',
          confidence: 'public',
          detail: '~20 years inside UNFI (joined 2003 from C&S Wholesale Grocers, 13 years 1989–2003). GM Chesterfield NH DC (2003–2006); Operations Project Manager (2006–2008); VP Distribution Atlantic Region with 8 DCs; Director Real Estate & Construction; President Atlantic Region; CSCO Jan 2022; President Natural/Organic/Specialty & Fresh + CSCO since Jan 2025. Plymouth State University 1989.',
        },
        {
          id: 'unfi-sandy-douglas',
          source: 'UNFI CEO Sandy Douglas public framing',
          confidence: 'public',
          detail: 'CEO Sandy Douglas since 2021 (Coca-Cola Refreshments / Staples / Aramark background). FY26 strategy: margin-and-efficiency over growth. The Street rewarding efficiency over growth at UNFI right now. Mark Bushway is the operator who has to deliver that.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, multi-temp dwell distributions, and detention-cost ranges. These describe the conditions most multi-DC grocery wholesale networks operate under, not UNFI specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'How much of the legacy SuperValu yard RFID footprint remains active after 3+ years of UNFI integration and the closure cadence — some originally-named sites may have been retired or migrated to a different stack',
        'Which surviving DCs are running closest to dock-cycle saturation in 2026 as the Sturtevant, Allentown, Fort Wayne, and Central region volumes re-allocate',
        'How the Bushway-Horvath role split is currently coordinating around operating-model decisions (Horvath) vs. operating-network decisions (Bushway) — the dotted-line vs. solid-line org-design configuration is not public',
        'Whether the Manchester PA new-build (opened Q1 FY25) and the Sarasota FL new-build (H1 FY26) shipped or will ship with a yard-execution layer designed for the combined enterprise, or with whatever site-level standard was on hand at commissioning',
        'How carrier-experience metrics and outbound chargeback exposure across the four banner patterns (Whole Foods + independent natural + conventional + Cub Foods/Shoppers) are surfaced today, and whether there is a network-level scorecard',
        'How cold-chain time-to-temp-check is measured at the gate today across the legacy SuperValu cold-chain DCs and the legacy UNFI refrigerated-heavy specialty DCs',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. UNFI is distinctive in this round because three generations of yard tooling are running across the same enterprise simultaneously, on a consolidation cadence that compresses more trailers through fewer surviving docks every quarter, with a cyberattack-resilience screening criterion that filters out vendors who do not have a documented graceful-degradation mode. The modernization wedge is operating-model layer above all three generations, not rip-and-replace of any specific tool. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the read-across to a 52-DC mid-consolidation grocery wholesale network with multi-banner outbound is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for UNFI — particularly how much of the legacy SuperValu yard RFID footprint remains active after the closure cadence, which surviving DCs are running closest to dock-cycle saturation in 2026, or how the Bushway-Horvath role split is currently coordinating around operating-model decisions — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'unfi-001',
      name: 'Mark Bushway',
      firstName: 'Mark',
      lastName: 'Bushway',
      title: 'President of Natural, Organic, Specialty & Fresh Products and Chief Supply Chain Officer',
      company: 'UNFI',
      email: 'mbushway@unfi.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain',
      reportsTo: 'Sandy Douglas, CEO',
      currentMandate:
        'Dual chair since January 2025: divisional P&L for Natural/Organic/Specialty/Fresh Products + enterprise CSCO across the 52-DC network serving ~30,000 customer locations. ~20-year UNFI tenure (joined 2003 from C&S Wholesale Grocers, 13 years there 1989–2003); GM Chesterfield NH DC → Operations Project Manager → VP Distribution Atlantic Region (8 DCs) → President Atlantic Region → CSCO Jan 2022 → dual chair Jan 2025. Operator path, not consultant path; 23 years of DC and regional GM seat-time before the corporate chair. The CSCO of record during the June 2024 cyberattack and the leader who walked the network back to normal operations.',
      bestIntroPath:
        'Direct outreach to the dual-chair seat with consolidation-throughput-math framing — explicitly different from the cold-chain food-safety angle of the March 2026 outreach that received no reply. Parallel-track outreach to Erin Horvath (CSCTO) is the second route — transformation chair is the operating-model-rebuild seat, separate enough from the operating P&L to read as parallel rather than escalation. UNFI HQ Providence RI is a plausible site-visit destination. If Bushway delegates: an Atlantic Region VP is the cleanest peer-network alternate given his Atlantic history.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'unfi-001',
        name: 'Mark Bushway',
        firstName: 'Mark',
        lastName: 'Bushway',
        title: 'President of Natural, Organic, Specialty & Fresh Products and Chief Supply Chain Officer',
        company: 'UNFI',
        email: 'mbushway@unfi.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Mark Bushway - President Natural/Organic/Specialty & Fresh + CSCO',
      variantSlug: 'mark-bushway',

      framingNarrative:
        'Mark, the operator discipline you carried through 13 years at C&S and 23 years inside UNFI — running 8 DCs as Atlantic Region VP before the corporate chair — is the discipline that recognizes the three-generations-of-yard-tooling problem on the first slide. The modernization wedge is not rip-and-replace; it is the operating-model layer above the legacy SuperValu RFID footprint, the legacy UNFI natural-organic footprint, and the third-generation new-builds at Manchester PA and Sarasota FL. The Great Consolidation throughput math is what makes the timing now — and the cyberattack-resilience screening criterion is the architecture filter every credible vendor passes through first.',
      openingHook:
        'As Allentown winds down and the Central region absorbs the legacy SuperValu volume, the yard density math at the surviving facilities is the part of the consolidation thesis that gets harder before it gets easier. Three generations of yard tooling running across the same enterprise — the legacy SuperValu RFID stack, the legacy UNFI natural-organic side, and the Manchester PA + Sarasota FL third generation — is the modernization wedge. The operating-model layer above all three is what every closure event quietly asks for, and what no vendor has yet shipped that survives the June 2024 cyberattack screening criterion.',
      stakeStatement:
        'Each closure is a forced yard-protocol decision at the receiving facility — the inbound trailer pool changes shape with every event. UNFI is shrinking its physical footprint while serving a customer base that did not get smaller (sales outlook raised post-cyberattack). Throughput per surviving dock is the metric that compounds across every consolidation decision. The CEO is selling Wall Street efficiency over growth for FY26 and beyond — yard efficiency translates directly to the margin line, and the operating-model layer is the no-capex lever inside that thesis.',

      heroOverride: {
        headline: 'The operating-model layer above three generations of yard tooling.',
        subheadline:
          'Legacy SuperValu RFID at the conventional-grocery wholesale DCs. Legacy UNFI natural-organic-specialty side. Manchester PA + Sarasota FL new-builds on the third standard. The Great Consolidation closure cadence pushes more trailers per dock through surviving sites every quarter. The operating-model layer above all three is the modernization wedge — and the June 2024 cyberattack made cached-local, graceful-degradation architecture the screening criterion every vendor passes through first.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-level, operator-fluent, concise. Bushway spent 20+ years in DC ops and filters vendor language fast. Acknowledge the cyberattack obliquely — after 2024, every ops-tech proposal has to answer the resilience question first, before the throughput question. Forward-routable to Erin Horvath with a one-line endorsement; acknowledge that yard standardization is now a cross-divisional artifact (Natural/Organic/Specialty/Fresh + Conventional Grocery + Retail). Specific by site name (Allentown, Sturtevant, Fort Wayne, Manchester PA, Sarasota FL, Billings, Bismarck). 4 sentences max in cold-email territory.',
      kpiLanguage: [
        'consolidation throughput per surviving dock',
        'three-generations-of-yard-tooling operating model',
        'cyberattack-resilience screening (cached-local gate decisions, documented degraded operating procedure)',
        'multi-banner outbound rhythm (Whole Foods + independent natural + conventional + Cub Foods/Shoppers)',
        'cold-chain time-to-temp-check at the gate',
        'detention recovery in the post-consolidation network',
        'on-time-out-the-gate rate at multi-banner DCs',
        'efficiency-over-growth attribution to the FY26 margin line',
        'forward-routable to Erin Horvath (CSCTO seat)',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-temp, heterogeneous-yard-tooling-after-acquisition shape, harder freight (water), already running the network-level layer above the existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — same heterogeneous-network-after-acquisition pattern with documented operating-model-above-site-tool deployment.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '52 DCs across US and Canada at the June 2024 cyberattack disclosure (down from 56 at Bushway\'s CSCO appointment Dec 2021); count lower again by FY27 as The Great Consolidation continues. Three generations of yard tooling: legacy SuperValu RFID stack, legacy UNFI natural-organic-specialty footprint, third-generation new-builds (Manchester PA opened Q1 FY25, Sarasota FL scheduled H1 FY26)',
    facilityTypes: ['Distribution Centers (multi-temp ambient + refrigerated + frozen + controlled-environment specialty)', 'Wholesale Grocery Warehouses', 'New-Build Regional Hubs (Manchester PA, Sarasota FL)', 'Retail Banner DCs (Cub Foods / Shoppers replenishment)'],
    geographicSpread: 'North America (HQ: Providence RI; serving ~30,000 customer locations; legacy SuperValu DCs concentrated in Midwest/Plains, legacy UNFI DCs on East and West coasts; new builds at Manchester PA and Sarasota FL)',
    dailyTrailerMoves: 'High-volume — wholesale grocery distribution serving 30,000+ locations across natural/organic, conventional grocery, foodservice, military, and retail (Cub Foods / Shoppers) channels; ~250,000+ SKUs across ambient, refrigerated, and frozen. Each closure compresses more trailers per surviving dock',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Private Fleet (retail-banner outbound)', 'Multi-Temp (ambient + refrigerated + frozen + controlled-environment specialty)'],
    avgLoadsPerDay: 'High-volume — DC network serving supermarkets, natural food stores, independents, foodservice, military, and UNFI\'s own retail banners; 2025 closures (Fort Wayne Feb 2025, two Central region DCs) push more volume through fewer receiving facilities at the same dock count',
    specialRequirements: [
      'Multi-banner outbound (Whole Foods + independent natural + conventional + Cub Foods / Shoppers cadence)',
      'Multi-temperature dock surface (ambient + refrigerated + frozen + controlled-environment specialty)',
      'Three generations of yard tooling across the same enterprise',
      'Cyberattack-resilience-aware architecture (cached-local gate decisions, documented degraded-operating procedure)',
      'Heterogeneous inbound (natural/organic specialty + conventional CPG sharing receiving slots)',
    ],
  },

  signals: {
    recentNews: [
      'The Great Consolidation FY26 strategy: closure cadence Logan Township NJ (2023) → Billings MT + Bismarck ND (2024) → Fort Wayne IN (Feb 2025) + two Central region DCs → Sturtevant WI (443 positions by Aug 2026) → Allentown PA (2026); new capacity Manchester PA (Q1 FY25) + Sarasota FL (H1 FY26).',
      'January 2025 wholesale division split: Natural/Organic/Specialty/Fresh Products (Bushway) + Conventional Grocery Products (separate President) + Retail (David Best from Aug 2025 running Cub Foods / Shoppers).',
      'Erin Horvath joined as Chief Supply Chain Transformation Officer — new role separating "run the network" (Bushway) from "rebuild the operating model" (Horvath).',
      'June 2024 cyberattack disconnected the entire UNFI network; $350M–$425M sales loss disclosed; recovery extended past the initial June 15 target; cyber insurance recovery through FY2026. Resilience under outage is the screening criterion for every operating-tech proposal.',
      'CEO Sandy Douglas FY26 strategic narrative: margin-and-efficiency over growth; Q2 FY26 (March 2026) earnings showed margin gains offsetting sales-line softness; the Street rewarding efficiency over growth at UNFI right now.',
    ],
    urgencyDriver:
      'Three generations of yard tooling are running across the same enterprise simultaneously — the legacy SuperValu RFID stack from 2018, the legacy UNFI natural-organic-specialty footprint, and the new-build third generation at Manchester PA and Sarasota FL. The Great Consolidation closure cadence compresses more trailers per dock through surviving facilities every quarter. The June 2024 cyberattack made cyber-and-operational resilience the screening criterion every vendor has to pass first. The Bushway-Horvath role split (operating + transformation) makes the operating-model layer above the site systems the explicit artifact both seats can sponsor. Efficiency-over-growth is the FY26 thesis the CEO is selling Wall Street, and yard efficiency translates directly to the margin line.',
  },

  theme: {
    accentColor: '#007A33',
  },
};
