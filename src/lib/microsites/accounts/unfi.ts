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
  coverHeadline: 'The yard layer for The Great Consolidation',
  titleEmphasis: 'The Great Consolidation',
  coverFootprint: '52 DCs · US + Canada',
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
        { label: 'The Great Consolidation', value: 'CEO Sandy Douglas\' multi-year structural reset of the post-SuperValu network. 52 DCs at the June 2024 cyberattack disclosure (down from 56 at Bushway\'s CSCO appointment Dec 2021); lower again by FY27. Closure cadence: Logan Township NJ (2023, into Allentown) → Billings MT + Bismarck ND (2024) → Fort Wayne IN (Feb 2025) + two Central region DCs → Sturtevant WI (443 positions by Aug 2026) → Allentown PA closing 2026 (the same site that absorbed Logan Township two years earlier). Pattern: "fewer, larger, more automated." Throughput-per-surviving-dock is the variable every closure event compounds' },
        { label: 'New capacity in parallel', value: 'Manchester PA opened Q1 FY25; Sarasota FL scheduled H1 FY26. The third-generation greenfields built on whatever the current standard is — and the rare moment when a network-level operating-model layer can ship into the building rather than retrofit around it' },
        { label: 'Three generations of yard tooling, one enterprise', value: 'Legacy SuperValu DCs that joined UNFI in 2018 brought a 2010-era yard RFID stack designed for site-by-site trailer tracking at conventional-grocery wholesale scale (first generation). Legacy UNFI natural-organic-specialty side never had the same RFID build-out — smaller-average-facility, refrigerated-heavy, cluster-near-Whole-Foods profile (second generation). Manchester PA + Sarasota FL new-builds are being commissioned on the third standard. The network-level operating-model layer that runs all three as one yard is the unsolved layer — and the closure cadence is shoving more trailers per dock through facilities that inherited different conventions every quarter' },
        { label: 'Mixed-banner outbound through shared docks', value: 'Wholesale to Whole Foods (high-volume, scheduled, multi-temp, predictable cadence) + wholesale to independent natural grocers (lower-volume, more sites per route, brittle SKU mix) + wholesale to conventional grocers (legacy SuperValu customer base, scheduled FTL) + replenishment to UNFI\'s own retail banners (Cub Foods, Shoppers, separate cadence). Yards serving multiple of these patterns simultaneously have to stage trailers for fundamentally different outbound rhythms' },
        { label: 'Cyberattack-resilience screening criterion', value: 'June 5–6, 2024 cyberattack disconnected the entire UNFI network for weeks; Whole Foods stores ran on empty shelves; $350M–$425M sales loss disclosed; cyber insurance recovery extending through FY2026. Bushway was the CSCO of record during the event and led the network walk-back to normal. Every operating-tech proposal in 2026 is screened against "what happens to this if the systems go dark for a week" — vendors without a documented cached-local, graceful-degradation mode lose the meeting in the first conversation' },
        { label: 'Dual chair + transformation seam', value: 'Bushway is President of Natural/Organic/Specialty & Fresh Products AND CSCO since January 2025 — divisional P&L plus enterprise supply chain in one seat. Erin Horvath joined in a new Chief Supply Chain Transformation Officer role separating "run the network" (Bushway) from "rebuild the operating model" (Horvath). Both names belong in any operating-model conversation' },
      ],
      hypothesis:
        'The interesting thing about the UNFI yard math is not whether the legacy site-level yard tools work — they do, at the sites where they still run. The interesting thing is the structural unevenness of what The Great Consolidation now has to run through them. The 2018 SuperValu acquisition brought a 2010-era yard RFID footprint into the company overnight — sized for the conventional-grocery wholesale Plains DC pattern, on a customer mix that included Cub Foods (now UNFI-owned) and a long tail of conventional independents. The legacy UNFI side that pre-dated SuperValu was the natural-organic specialist with a smaller-average-facility, refrigerated-heavy, cluster-near-Whole-Foods profile that never had the same RFID build-out investment. The Manchester PA and Sarasota FL new-builds being commissioned now run on whatever the current standard is. Three generations of yard tooling are running across the same enterprise — and the network-level operating-model layer that turns them into one yard is the layer that is not yet running to a single standard.\n\nThat gap got more expensive in three compounding steps in the last twenty-four months. First, The Great Consolidation closure cadence (Logan Township into Allentown, Billings + Bismarck, Fort Wayne, two Central region DCs, Sturtevant, Allentown closing in 2026) inherently compresses trailers through fewer surviving docks — same demand, fewer DCs, more trucks per surviving yard. Each closure is a forced yard-protocol decision at the receiving facility, because the inbound trailer pool changes shape with every closure. Second, the June 2024 cyberattack — the entire UNFI network disconnected, Whole Foods stores running on empty shelves, $350M–$425M in sales loss, cyber insurance recovery extending through FY2026 — made cyber-and-operational resilience the screening criterion for every operating-technology proposal. Vendors without a documented cached-local, graceful-degradation mode lose the meeting in the first conversation; Bushway was the CSCO of record during the event and walked the network back to normal, which means the screening criterion is now in the room every time he is. Third, the January 2025 division split (Natural/Organic/Specialty/Fresh under Bushway, Conventional Grocery under a separate President, Retail under David Best running the Cub Foods / Shoppers banner business) and the parallel arrival of Erin Horvath as Chief Supply Chain Transformation Officer made the yard the artifact at the seam between three divisional P&Ls and a transformation chair — and there is no network-level yard operating system today that surfaces the right ownership lens at the right moment.\n\nThe modernization wedge writes itself from this combination, and it writes itself in a particular shape. Not rip-and-replace at any site. The operating-model layer above the legacy SuperValu RFID footprint, above the legacy UNFI natural-organic footprint, and above the third-generation new-builds — with documented resilience under outage as a first-class architecture requirement, not a procurement-stage checkbox. The Manchester PA + Sarasota FL greenfield window is the rare moment when that layer can ship into the building rather than retrofit around it, and the timing matters: Manchester PA is open now, Sarasota FL is in commissioning, and the design choices that get baked into both decide what the surviving Plains DCs absorbing closure volume have to integrate against in 2027. The Great Consolidation closure cadence is the math that makes the operating-model layer above all three generations a margin lever, not an operating-cost line — and the efficiency-over-growth narrative the CEO is selling Wall Street for FY26 makes yard efficiency a direct attribution to the margin line the Street is rewarding.',
      pullQuote: 'Three generations of yard tooling are running across the same enterprise — and the closure cadence is shoving more trailers per dock through the surviving facilities every quarter.',
      caveat:
        'This is built from UNFI investor disclosures, the Great Consolidation analyst framing, the June 2024 cyberattack disclosures and recovery commentary, the published DC closure cadence, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how much of the legacy SuperValu yard RFID footprint remains active after 3+ years of UNFI integration and the closure cadence, which surviving DCs are running closest to dock-cycle saturation in 2026, and how the Bushway-Horvath role split is currently coordinating around operating-model decisions vs. operating-network decisions.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/unfi-coverage-map.svg',
        imageAlt: 'Operating-system coverage map. Six tiles representing UNFI enterprise-platform domains. SAP, Procurement, Replenishment, DC Network, and Cyber-resilient are covered. The Yard Network Ops tile is unfilled, marked with a UNFI green hairline outline.',
        caption: 'Operating-system coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public UNFI enterprise-platform + Great Consolidation + post-cyberattack-rebuild disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The UNFI operating profile is shape-similar — multi-site, multi-temp (ambient + refrigerated + frozen + controlled-environment specialty), 3PL-DC-dependent for some flows but private-fleet-dependent for retail-banner replenishment, with the same shape of heterogeneous-yard-tooling-after-acquisition problem the comparable directly resolved — but at wholesale-grocery economics with the Whole Foods, independent natural, conventional, and Cub Foods banner mix that no single CPG peer carries. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a 52-DC mid-consolidation grocery wholesale network running on three generations of yard tooling is the easier lift. The Great-Consolidation question, in one line: is yard execution a network-tier operating layer that survives the cyberattack-resilience screen and absorbs the closure cadence, or a site-by-site bundle of inherited conventions that the FY26 efficiency-over-growth narrative has to route around.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
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
          source: 'Mark Bushway public tenure record — C&S Wholesale Grocers → UNFI (LinkedIn + UNFI executive disclosures + Plymouth State alumni records + UNFI press releases)',
          confidence: 'public',
          detail: '~23 years inside UNFI (joined 2003 from C&S Wholesale Grocers, where he spent 13 years 1989–2003). The internal progression is the part that matters: GM Chesterfield NH DC (2003–2006) → Operations Project Manager (2006–2008) → Director Real Estate & Construction → VP Distribution Atlantic Region (8 DCs) → President Atlantic Region → CSCO Jan 2022 → dual chair President Natural/Organic/Specialty & Fresh Products + CSCO Jan 2025. Plymouth State University 1989. The seat-time shape matters because it explains why operating-model decisions at UNFI move at long-tenure-DC-operator cadence rather than consultant-procurement cadence — and why the cyberattack-rebuild authority is internal, not external.',
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
        'What the documented cyberattack-resilience architecture criteria look like in 2026 procurement — whether the requirement for cached-local gate decisions and graceful-degradation mode is a published architecture standard now, an informal screening pattern in Bushway\'s office, or both, and which seat owns sign-off',
        'Whether the operating-model layer above the three generations of yard tooling is a Bushway-sponsored artifact, a Horvath-sponsored artifact, or a joint-sponsored artifact with a defined ownership split — and how the FY26 efficiency-over-growth narrative the CEO is selling Wall Street is allocating capex authority across those seats',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. UNFI is distinctive in this round because three generations of yard tooling are running across the same enterprise simultaneously, on a consolidation cadence that compresses more trailers through fewer surviving docks every quarter, with a cyberattack-resilience screening criterion that filters out vendors who do not have a documented graceful-degradation mode. Mark, your 23 years inside UNFI — Chesterfield NH DC through 8-DC Atlantic Region VP into the CSCO chair, and then the cyberattack-rebuild leadership of 2024 — is the operator pedigree that recognizes the three-generations-of-yard-tooling problem on the first slide and reads the resilience requirement as architecture, not procurement. The modernization wedge is the operating-model layer above all three generations, not rip-and-replace of any specific tool. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the read-across to a 52-DC mid-consolidation grocery wholesale network with multi-banner outbound is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Mark — the part most worth pushing back on is whether the operating-model layer above the legacy SuperValu RFID footprint, the legacy UNFI natural-organic side, and the Manchester PA + Sarasota FL third generation is a Bushway-sponsored artifact, a Horvath-sponsored artifact, or a jointly-sponsored one with a defined ownership split — and whether the cyberattack-resilience screening criterion that filters every operating-tech proposal in your office today is now a written architecture standard or still an informal pattern. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts: an Atlantic-Region-pattern walkthrough at one consolidation-receiving DC, a Manchester PA greenfield design-phase conversation, or a parallel-track read with Erin Horvath\'s seat on the transformation side — not necessarily a meeting.',
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
        'Mark, the operator discipline you carried through 13 years at C&S and 23 years inside UNFI — Chesterfield NH DC through Operations Project Manager through 8-DC Atlantic Region VP into the President Atlantic seat before the CSCO chair, and then the cyberattack-rebuild leadership of 2024 — is the discipline that recognizes the three-generations-of-yard-tooling problem on the first slide and reads cached-local resilience as architecture rather than procurement-stage box-tick. The modernization wedge is not rip-and-replace at any site. It is the operating-model layer above the legacy SuperValu RFID footprint, the legacy UNFI natural-organic footprint, and the third-generation new-builds at Manchester PA and Sarasota FL — a layer that survives the cyberattack-resilience screening criterion your office now applies to every operating-tech proposal in the room.',
      openingHook:
        'The operator pedigree that walked UNFI back from June 2024 — 23 years inside, eight Atlantic DCs run before the corporate chair — is the pedigree that reads the three-generations-of-yard-tooling problem in one slide. Legacy SuperValu RFID stack. Legacy UNFI natural-organic side. Manchester PA + Sarasota FL third generation. The Great Consolidation closure cadence compresses more trailers per surviving dock every quarter. The operating-model layer above all three is what every closure event quietly asks for, and what no vendor has yet shipped that survives the cached-local resilience screen the cyberattack now requires.',
      stakeStatement:
        'Three windows are open simultaneously, and they are not always open together. The Great Consolidation closure cadence (Sturtevant Aug 2026, Allentown 2026, Central region absorption ongoing) is a forced yard-protocol decision at every receiving facility — the inbound trailer pool changes shape with each event, and UNFI is shrinking the physical footprint while the customer base did not get smaller (sales outlook raised post-cyberattack). The Manchester PA new-build is open now and Sarasota FL is in commissioning — the rare moment the operating-model layer ships into the building rather than retrofits around it. And the FY26 efficiency-over-growth narrative the CEO is selling Wall Street makes yard efficiency a direct attribution to the margin line the Street is rewarding — the operating-model layer is the no-new-DC, no-rip-and-replace lever inside that thesis. Forward-routable to Erin Horvath\'s seat for the transformation-side read.',

      heroOverride: {
        headline: 'The operating-model layer above three generations of yard tooling.',
        subheadline:
          'Legacy SuperValu RFID at the conventional-grocery wholesale DCs. Legacy UNFI natural-organic-specialty side. Manchester PA + Sarasota FL new-builds on the third standard. The Great Consolidation closure cadence pushes more trailers per dock through surviving sites every quarter. The operating-model layer above all three is the modernization wedge — and the June 2024 cyberattack made cached-local, graceful-degradation architecture the screening criterion every vendor passes through first.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

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

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Three generations', body: 'Legacy SuperValu RFID (2018) · legacy UNFI natural-organic · Manchester PA + Sarasota FL new-build standard.' },
    { mark: 'Closure cadence', body: 'Logan Township → Billings + Bismarck → Fort Wayne → Sturtevant → Allentown 2026. Same demand, fewer docks.' },
    { mark: 'Greenfield window', body: 'Manchester PA opened Q1 FY25 · Sarasota FL H1 FY26. The rare moment the operating-model layer ships into the building.' },
    { mark: 'Resilience screen', body: 'June 2024 cyberattack · $350M–$425M sales loss · cached-local, graceful-degradation is now the first filter every vendor passes.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Mark Bushway. Twenty-three years of DC and regional GM seat-time inside UNFI — and the cyberattack-rebuild leadership of 2024 — is the operator discipline The Great Consolidation is being run on. The five minutes that follow are about the one layer above the three generations of yard tooling that is not yet running to a single standard.',
    chapters: [
      { id: 'thesis', label: 'I. Three generations of yard tooling, one enterprise', start: 0 },
      { id: 'consolidation-math', label: 'II. What The Great Consolidation made expensive', start: 65 },
      { id: 'resilience-screen', label: 'III. The cyberattack-resilience screening criterion', start: 130 },
      { id: 'greenfield-window', label: 'IV. The Manchester + Sarasota greenfield window', start: 195 },
      { id: 'first-pilot', label: 'V. What proof at the first consolidation-receiving DC earns', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#007A33',
  },
};
