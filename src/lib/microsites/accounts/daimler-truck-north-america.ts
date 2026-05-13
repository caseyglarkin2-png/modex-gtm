/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Daimler Truck NA is a confirmed PINC/Kaleris incumbent per the named
 * Kaleris–Daimler Trucks case study. Specifics:
 *   - Saltillo MX pilot in 2012; rollout to all 9 US+Mexico plants
 *   - Passive UHF RFID on trailers, mobile readers, yard move management,
 *     dock-door utilization, dwell/aging visibility, detention reporting
 *   - Reported wins: 50% reduction in carrier detention fees; 50% reduction
 *     in yard drivers; baseline 3 trailers/hour yard-tractor productivity
 *   - 14-year incumbent relationship; not on Kaleris's R&D priority list
 *     post-acquisition (Kaleris focus has skewed toward marine/intermodal
 *     and the legacy Navis terminal-operations product line)
 *
 * Pitch shape: coexistence wedge — network-tier orchestration layer ABOVE
 * the 9 site-level yard deployments, not replacement. Allen will not
 * displace PINC at Saltillo on a vendor pitch (original deployment site,
 * 14-year emotional investment, most-cited internal proof point).
 * Replacement, if it happens, is year-2 or year-3.
 *
 * This intel powers the displacement / modernization cold-email framing
 * (see docs/research/jeff-allen-daimler-truck-north-america-dossier.md
 * and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section.
 */

/**
 * Daimler Truck North America — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — named case study PDF)
 * Pitch shape: coexistence wedge (network-tier orchestration above
 * site-level yard signals), evolution not displacement
 * Angle: YARD MANAGEMENT (cross-site inbound sequencing, finished-vehicle
 * marshalling as a network problem, exception handling between plants,
 * new yard surfaces for battery-electric series production) — NOT driver
 * experience
 * Stakeholder vocabulary: lean-manufacturing (Allen's 25-year Detroit
 * Diesel pedigree) — takt time, variance reduction, standard work, line
 * readiness, OEE-per-dock
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const daimlerTruckNorthAmerica: AccountMicrositeData = {
  slug: 'daimler-truck-north-america',
  accountName: 'Daimler Truck North America',
  coverHeadline: 'The network layer above 9 plants',
  titleEmphasis: 'above 9 plants',
  coverFootprint: '9 NA plants · Saltillo 2012',
  parentBrand: 'Daimler Truck',
  vertical: 'industrial',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for Daimler Truck NA - Network-Tier Orchestration Above Site-Level Yards',
  metaDescription:
    'How a network-tier orchestration layer lands on top of the 9-plant US+Mexico yard system Daimler Truck NA has run since the 2012 Saltillo pilot — coordinating cross-site inbound sequencing, finished-vehicle marshalling, and new battery-electric yard surfaces as one operating model.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Daimler Truck NA manufacturing network',
      composition: [
        { label: 'Manufacturing footprint', value: '9 U.S. + Mexico plants — Portland OR (Western Star + Freightliner eCascadia/eM2 BEV series), Cleveland NC (Cascadia/Western Star flagship, 850,000th truck delivered July 2025), Mt. Holly NC (M2 medium-duty), Gastonia NC (components), High Point NC (Thomas Built Buses), Gaffney SC (FCCC custom chassis), Saltillo MX (Cascadia — original yard-tech pilot site, 2012), Detroit/Redford MI (Detroit Diesel engines)' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard system in production across all 9 US+Mexico plants since the 2012 Saltillo pilot — 14-year tenure; the network-tier orchestration above it is unsolved' },
        { label: 'eCascadia / eM2 series-production yard', value: 'Battery-electric series production at Portland — eCascadia is in production, Freightliner eM2 joined in series production — introduces battery handling, charging-bay marshalling, and HV-component inbound logistics. New yard surfaces the 2012-era yard config was never designed to track, and a once-per-cycle greenfield spec opportunity where designing network-tier orchestration in is materially cheaper than retrofitting it later at Cleveland' },
        { label: 'Saltillo cross-border pressure', value: 'Saltillo MX runs 500+ trailers in the yard at peak as the highest-volume cross-border lane in the DTNA network. Tariff exposure in low-triple-digit million euros on DTNA converts every minute of Saltillo dwell into landed-cost amplification on components moving from Mexico into the U.S. plants — and the original site-level yard system was specified for 2012\'s detention and yard-driver-productivity problem, not 2026\'s tariff-amplified dwell problem' },
        { label: 'Detroit Diesel → Cleveland engine choreography', value: 'Detroit Diesel engines move from Redford MI to Cleveland NC and Mt. Holly NC truck assembly. When Cleveland is dock-blocked, where does the inbound engine load divert, and how does Cleveland\'s line-readiness signal reach Detroit\'s outbound yard in time to matter? Cross-site inbound sequencing is the canonical network problem the 9 per-site yard logs were never built to coordinate' },
        { label: 'Outbound profile', value: 'Finished-vehicle marshalling for dealer-convoy dispatch and rail-out from select plants — the yard problem is "completed trucks parked in marshalling," not "trailers waiting at the gate." Different yard topology than CPG' },
        { label: 'Demand posture', value: 'Q1 2026 incoming orders +85% YoY at Trucks NA; Q2 2026 sales pacing 50% ahead of Q1. The production network just spent a quarter undershooting capacity; demand is returning into the same dock-door count' },
        { label: 'Margin posture', value: 'Q1 2026 EBIT halved (group €498M vs €1.08B prior year); DTNA EBIT −73%. Tariff overhang in "low triple-digit million" euros on DTNA. No-capex, software-only changes are the only changes that get oxygen this year' },
      ],
      hypothesis:
        'Site-level yard automation has already paid back at Daimler Truck NA — 14 years running, across all 9 US+Mexico plants. The 50% reduction in carrier detention fees and the 50% reduction in yard drivers from the original Saltillo 2012 case record are real, they are not in dispute, and they should not be reframed as failures. They are the proof that yard tech pays back at this network. The site-level case is closed.\n\nWhat is unsolved is the layer above. The 9 plants run as 9 site-level yard systems with their own gate logic, their own dock priorities, their own marshalling cadence, their own appointment-versus-walk-in mix. The system of record gives you 9 yard logs. It does not give you one operating model. And that gap got more expensive in the last twelve months for three reasons that all compound on each other. First, Q1 2026 order intake came in at +85% YoY against a production network that just finished a soft quarter — the binding constraint in the next four quarters is throughput per existing dock door, not new capex. Second, tariff exposure on the Saltillo cross-border lane converts every minute of dwell into landed-cost amplification on components moving from Mexico to the U.S. plants — variance on a single border lane that the 2012 system was never asked to price. Third, the eCascadia and eM2 battery-electric series production at Portland is a greenfield yard surface — battery handling, charging-bay marshalling, HV-component inbound — and specifying network orchestration into a new EV-assembly yard is materially cheaper than retrofitting it later at Cleveland.\n\nThe Detroit Diesel-to-Cleveland engine choreography is the canonical example of what 9 independent site-level yard records can\'t coordinate. When Cleveland is dock-blocked, where does the inbound Detroit engine load divert, and how does Cleveland\'s line-readiness signal reach Detroit\'s outbound yard in time to matter? That is one question. Per-site dock-cycle telemetry across 9 yard logs cannot answer it. A network-tier coordination layer can — and the first pilot that proves it is not at Saltillo and not at Cleveland. It is at one of the smaller yards where the operating model can be proven without disturbing 14 years of incumbent site-level work.',
      pullQuote: 'The system of record gives you 9 yard logs. It does not give you one operating model.',
      caveat:
        'This is built from Daimler Truck Holding AG public investor disclosures, the public yard-tech case record, DTNA press releases, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the Detroit-Diesel-to-Cleveland engine sequencing is currently coordinated through the planning layer or still resolved at the dock, how the eM2 series-production yard is being scoped at Portland, and where the +85% Q1 order intake is loading hardest in the production schedule.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the 9-plant yard system',
      artifact: {
        imageSrc: '/artifacts/daimler-truck-north-america-coverage-map.svg',
        imageAlt: 'DTNA yard-system coverage map. Nine tiles representing the 9 US+Mexico site-level yard systems Daimler Truck NA has run since the 2012 Saltillo pilot. Portland (eCascadia/eM2 BEV), Cleveland flagship, Mt Holly, Gastonia, High Point Thomas Built, Gaffney FCCC, Saltillo, and Detroit Diesel are covered; Network Orchestration above the site-level layer is unfilled, marked with a DTNA blue hairline outline.',
        caption: 'DTNA yard-system coverage map · 9 tiles · 8 covered · 1 unfilled.',
        source: 'Composition modeled from public DTNA disclosures. Site-level yard vendor redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America — bottled water at full weight, low margin, multi-temp at the premium SKU layer, with refill-returns flow. Different freight category than heavy-truck OEM, obviously: Primo ships finished consumer goods on dense weight-out trailers, DTNA assembles trucks from heavy oversized components and ships finished vehicles by dealer convoy. The read-across is not freight-type; it is network shape. Primo runs a multi-site network with mature site-level yard tech already in place, and has layered a network operating model on top of those site-level systems. The DTNA operating profile shares the network shape — 9 manufacturing sites, 14 years of mature site-level yard tech, cross-site sequencing problems the site-level layer was never built to coordinate — and runs on lean-manufacturing vocabulary (takt, line readiness, variance reduction, OEE-per-dock) that maps cleanly to the operating math the comparable demonstrates. If a network operating model can run on the operationally hardest CPG freight in North America, the read-across to a 9-plant heavy-truck OEM network with a 14-year site-level yard incumbency, a tariff-amplified Saltillo cross-border lane, a Detroit-to-Cleveland engine choreography no per-site log can coordinate, and a once-per-cycle Portland EV-yard greenfield spec window is portability of the operating model by network shape — not a category-specific play, and not a vendor swap at the site layer.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot targets at DTNA are different in kind: (1) Portland\'s eCascadia/eM2 series-production yard, where greenfield orchestration spec is materially cheaper than retrofit; (2) the Cleveland + Mt. Holly NC plant pair, where co-located network-tier coordination produces the cleanest A/B against the existing site-level baseline. Saltillo is explicitly not the right first pilot — 14-year incumbent emotional investment makes the original deployment site the wrong place to test the layer above it.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'dtna-operating-committee',
          source: 'Daimler Truck NA Operating Committee disclosures (May 2026)',
          confidence: 'public',
          detail: 'Anchors the SVP Operations & Specialty Vehicles role under CEO John O\'Leary (reappointed May 6, 2026), the 9-plant US+Mexico manufacturing footprint, and the Freightliner + Western Star + Thomas Built + FCCC + Detroit brand structure.',
          url: 'https://www.daimlertruck.com/',
        },
        {
          id: 'dtna-q1-2026',
          source: 'Daimler Truck Holding AG Q1 2026 Investor Relations release (May 6, 2026)',
          confidence: 'public',
          detail: 'Q1 2026 incoming orders +85% YoY at Trucks North America; DTNA Q1 sales 29,432 trucks/buses (−24.5% YoY, lowest Q1 since 2010); group EBIT halved to €498M from €1.08B; tariff overhang in low-triple-digit million euros on DTNA.',
        },
        {
          id: 'dtna-cleveland-milestone',
          source: 'DTNA press release on 850,000th truck delivery (Cleveland NC, July 2025)',
          confidence: 'public',
          detail: 'Cleveland Truck Mfg Plant delivered its 850,000th truck — a Western Star 47X to Alamo Group. Heritage plant with 70 years of accumulated yard process; the kind of facility where a 14-year-old yard-tech config ages worst because workflows have evolved around the system, not the other way around.',
        },
        {
          id: 'dtna-ev-portland',
          source: 'DTNA press releases on eCascadia and eM2 series production at Portland',
          confidence: 'public',
          detail: 'Freightliner eM2 battery-electric joined eCascadia in series production at the Portland Western Star plant. Battery handling, charging-bay marshalling, and HV-component inbound logistics are new yard surfaces the 2012-era yard config was never designed to track.',
        },
        {
          id: 'dtna-whitestown-rdc',
          source: 'DTNA Whitestown IN RDC opening (August 2023)',
          confidence: 'public',
          detail: '605,000+ sq ft Redistribution Center that replenishes the 10-PDC aftermarket parts network. Adjacent to Allen\'s scope (parts depots roll up to SVP Aftermarket Drew Backeberg, not to Operations) but the strongest signal in the public record that DTNA\'s logistics function has been reorganized for network throughput in the last three years.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most multi-site manufacturing networks operate under, not DTNA specifically.',
        },
        {
          id: 'allen-tenure',
          source: 'Jeff Allen — public tenure record',
          confidence: 'public',
          detail: '~25 years at Detroit Diesel ending in plant-leadership roles at the Redford engine plant; moved to DTNA in August 2017; current SVP Operations & Specialty Vehicles with FCCC and Thomas Built reporting in. Lean-Manufacturing / Continuous Improvement / ISO operating pedigree. The takt-time, variance-reduction, standard-work vocabulary in this brief is his vocabulary, not ours.',
          url: 'https://www.linkedin.com/in/jeff-allen-dtna/',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant — with the caveat that DTNA\'s heavy-truck per-trailer economics differ from Primo\'s CPG per-trailer economics; the operating-model read-across is by network shape, not per-trailer math.',
        },
      ],
      unknowns: [
        'How the Detroit-Diesel-to-Cleveland engine sequencing is currently coordinated — through the planning layer with explicit cross-site choreography, or resolved at the dock when the engine load arrives',
        'Where the +85% Q1 2026 order intake is loading hardest in the production schedule — and which plants will hit dock-cycle saturation first as the ramp lands',
        'How the eM2 series-production yard is being scoped at Portland — whether network-tier orchestration is in the design conversation now, or is expected to retrofit later',
        'How Saltillo tariff exposure is being managed at the dock-cycle layer today, vs. being absorbed into landed-cost reporting after the fact',
        'Whether finished-vehicle marshalling for dealer-convoy dispatch is treated as a network problem with cross-plant visibility, or as 9 independent per-plant marshalling lots',
        'How the Cleveland flagship\'s 70 years of accumulated yard process has shaped the gate-dock-marshalling-convoy flow such that re-spec\'ing it as a network-tier process requires what kind of operating change',
        'Whether the lean-manufacturing operating discipline Allen carried out of 25 years at Detroit Diesel — takt time, variance reduction, standard work — has reached the yard layer yet, or whether it stopped at the assembly-line and engine-cell side of the wall',
        'Whether Allen\'s Charlotte base and Portland HQ reporting line means the eM2 yard-design conversation at Portland is being driven through him directly, or arbitrated through the Portland plant manager with Allen consulted late',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. DTNA is distinctive in this round because the case for site-level yard automation is not in dispute and should not be relitigated; it was won at Saltillo in 2012 and the case study is public. The unsolved problem is the operating model that turns 9 site-level yard signals into one network-tier coordination layer — and the timing is unusual in that order intake is recovering hard into a production network that just absorbed a soft quarter, the eM2 series-production yard at Portland is a once-per-cycle greenfield spec opportunity, and the tariff exposure on the Saltillo lane has converted dock-cycle variance into landed-cost amplification. The water comparable is intentional but read-across is by network shape, not freight type — the operating model demonstrated at Primo runs on the operationally hardest CPG freight in North America, which is portability evidence for category, not a per-trailer math analogue.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Jeff — the part most worth pushing back on is whether the lean-manufacturing operating discipline you carried out of twenty-five years at Detroit Diesel — takt time, variance reduction, standard work, line readiness — has reached the yard layer yet at the DTNA network, or whether it stopped at the engine cell and the assembly line. The Saltillo 2012 case won the site-level argument; the layer above the 9 site-level yard logs is the next tier the +85% Q1 order intake now needs, and the eM2 yard at Portland is the once-per-cycle place to write standard work into a yard while the concrete is still wet. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'daimler-truck-na-001',
      name: 'Jeff Allen',
      firstName: 'Jeff',
      lastName: 'Allen',
      title: 'SVP, Operations & Specialty Vehicles',
      company: 'Daimler Truck North America',
      email: 'jeff.allen@daimlertruck.com',
      linkedinUrl: 'https://www.linkedin.com/in/jeff-allen-dtna/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Manufacturing',
      currentMandate:
        'Runs the DTNA manufacturing network plus the two specialty-vehicle subsidiaries (Freightliner Custom Chassis Corporation, Thomas Built Buses). 25-year Detroit Diesel tenure (Redford engine plant) before moving to DTNA in August 2017 — rare dual literacy in both upstream engine-plant yard problems and downstream truck-assembly yard problems. Charlotte-based; reports to Portland HQ. Lean-Manufacturing / CI / ISO pedigree; structured-buyer profile.',
      bestIntroPath:
        'Detroit Diesel alumni network (25-year tenure means his most-trusted operators are in the Redford / Detroit-area engine-manufacturing community). Secondary: Cascadia dealer principal warm intro framed as "we want our trucks faster off the line." Do not pivot to Drew Backeberg (SVP Aftermarket — owns the 10-PDC parts network) without permission; the aftermarket pitch is a parallel motion, not a fallback.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'daimler-truck-na-001',
        name: 'Jeff Allen',
        firstName: 'Jeff',
        lastName: 'Allen',
        title: 'SVP, Operations & Specialty Vehicles',
        company: 'Daimler Truck North America',
        email: 'jeff.allen@daimlertruck.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Manufacturing',
      },
      fallbackLane: 'ops',
      label: 'Jeff Allen - SVP Operations & Specialty Vehicles',
      variantSlug: 'jeff-allen',

      framingNarrative:
        'Jeff, takt time, variance reduction, standard work, line readiness — the lean-manufacturing operating discipline you carried out of twenty-five years at Detroit Diesel — already runs the engine cell at Redford and the assembly line at every DTNA plant. The one operating surface it has not yet reached, fourteen years into the Saltillo yard-tech tenure, is the yard layer above the 9 site-level yard systems. Takt-time-per-plant is currently 9 different definitions on 9 different yards. Variance reduction across the dock cycle stops at the plant gate. Standard work is authored at the site, not at the network. The +85% Q1 order intake landing into the same dock-door count is the timing reason to author it now — and the eM2 series-production yard at Portland is the once-per-cycle greenfield where you can write standard work into a yard while the concrete is still wet.',
      openingHook:
        'Takt time on the assembly line is the same discipline as takt time at the dock door. The 9-plant yard system DTNA has run since Saltillo 2012 measures detention, dwell, and trailer location at every site — but it does not produce one network-wide takt, one variance-reduction baseline across the dock cycle, or one standard-work definition for gate-to-dock-to-marshalling at the network layer. That is the unsolved tier.',
      stakeStatement:
        'Tariff exposure on the Saltillo cross-border lane converts every minute of dwell-cycle variance into landed-cost amplification — variance reduction at the yard layer is now a margin lever, not just an operations one. Q1 2026 order intake came back +85% YoY into a network that just finished a soft quarter; the binding constraint in the next four quarters is throughput per existing dock door, which means takt-per-dock and OEE-per-dock are the throughput math, and no-capex software on top of what DTNA already operates is the only path that gets oxygen in 2026.',

      heroOverride: {
        headline: 'Standard work at the dock. Takt at the network. Variance reduction at the yard.',
        subheadline:
          'Site-level yard tech is proven across the DTNA network — it has been since Saltillo 2012. What is unsolved is the lean-manufacturing operating discipline applied at the yard layer above the 9 sites: one network takt, one variance-reduction baseline across the dock cycle, one standard-work definition for gate-to-dock-to-marshalling. The +85% Q1 order intake is the timing driver; the Portland eM2 yard is where standard work gets written while the concrete is still wet.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Lean-manufacturing vocabulary as the primary register — takt, variance reduction, standard work, line readiness, OEE — not "transformation" register and not "platform" register. Allen ran Detroit Diesel for 25 years; he reads variance reduction faster than narrative. Acknowledge the 14-year site-level yard tenure respectfully — the original selection was correct and the public case numbers (50% detention reduction, 50% yard-driver reduction) are real. Position the wedge as the layer above (network-tier orchestration applying lean-manufacturing discipline to the yard cycle), not as replacement of the site-level system. Specific by name and date — Saltillo 2012, Cleveland 850,000th in July 2025, Portland eM2 series production, Whitestown August 2023. Margin-aware: no capex, software-only on top of what DTNA already operates.',
      kpiLanguage: [
        'takt-time-per-plant',
        'variance reduction across the dock cycle',
        'standard work across the 9 plants',
        'line readiness from the gate inward',
        'OEE-per-dock',
        'network-tier orchestration',
        'cross-site inbound sequencing',
        'finished-vehicle marshalling as a network problem',
        'landed-cost amplification on the Saltillo lane',
      ],
      proofEmphasis:
        'Primo is the *public* comparable but the read-across is by network shape (multi-site, mature site-level yard tech, network operating model laid on top), not by freight type — DTNA per-trailer economics are different from Primo per-trailer economics. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '9 U.S. + Mexico manufacturing plants (Portland OR — Western Star + eCascadia/eM2 BEV; Cleveland NC — flagship Cascadia/Western Star; Mt. Holly NC — M2 medium-duty; Gastonia NC — components; High Point NC — Thomas Built Buses; Gaffney SC — FCCC; Saltillo MX — Cascadia, original yard-tech pilot 2012; Detroit/Redford MI — Detroit Diesel engines) + 10 Parts Distribution Centers (Backeberg\'s org) + Whitestown IN RDC (605,000 sq ft, opened Aug 2023)',
    facilityTypes: ['Manufacturing Plants', 'Engine Plants', 'Parts Distribution Centers', 'Redistribution Center'],
    geographicSpread: 'North America (HQ: Portland OR; manufacturing concentrated in NC/SC; Saltillo MX cross-border lane; Detroit MI engine plant; Allen Charlotte-based)',
    dailyTrailerMoves:
      'High-volume — Saltillo alone runs 500+ trailers in the yard at peak; network-wide modeled at high volume across 9 plants. Per-trailer economic value is well above CPG benchmarks — heavy-haul, oversized-component, and finished-truck per-trailer value runs 5–20× a CPG dry-goods trailer',
  },

  freight: {
    primaryModes: ['Flatbed', 'Specialized / Heavy Haul', 'Parts LTL', 'Dealer-Convoy Outbound', 'Rail (outbound finished vehicles from select plants)'],
    avgLoadsPerDay:
      'High-volume — 9 manufacturing plants with JIT inbound components; Detroit Diesel engines move from Redford to Cleveland and Mt. Holly assembly. Finished-vehicle outbound is dealer-convoy and rail-out — the yard topology is "completed trucks marshalling for dispatch," not "trailers waiting at the gate"',
  },

  signals: {
    recentNews: [
      'Q1 2026 incoming orders +85% YoY at Trucks North America — production ramp coming on the same 9-plant network and the same dock-door count.',
      'Q2 2026 DTNA sales pacing 50% ahead of Q1 — the recovery is landing now, not deferred.',
      'Q1 2026 group EBIT halved to €498M from €1.08B; DTNA EBIT −73%. Tariff exposure in low-triple-digit million euros on DTNA — no-capex changes are the only changes that get oxygen in 2026.',
      '850,000th truck delivered at Cleveland NC in July 2025 — flagship plant with 70 years of accumulated yard process around the existing site-level system.',
      'eCascadia / eM2 battery-electric series production at Portland — new yard surfaces (battery handling, charging-bay marshalling, HV-component inbound) the 2012-era yard config was never designed to track.',
      'Thomas Built Type A Minotour capacity expansion at High Point NC announced December 2025 — more school-bus volume into the same yard.',
      'Whitestown IN RDC (605,000 sq ft) opened August 2023 — the aftermarket parts network was already reorganized for network throughput three years ago; the same network logic applied to plant yards is the unfilled adjacency.',
      'CEO John O\'Leary reappointed by supervisory board May 6, 2026 — executive continuity through the ramp.',
    ],
    urgencyDriver:
      'The site-level yard system is 14 years into production at the 9 US+Mexico plants — the original Saltillo pilot was specified for 2012\'s yard visibility problem, which RFID solved. The unsolved problem now is network-tier orchestration above the site-level signals: the +85% Q1 order intake is landing into the same dock-door count, the Saltillo tariff lane converts every minute of dwell into landed-cost amplification, and the eM2 series-production yard at Portland is a once-per-cycle greenfield spec opportunity where network orchestration is materially cheaper to design in than retrofit later.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Site-level tenure', body: 'Saltillo pilot 2012 · rollout across 9 US+Mexico plants · 14 years in production.' },
    { mark: 'Order intake', body: 'Q1 2026 Trucks NA orders +85% YoY · the ramp lands on the same dock-door count.' },
    { mark: 'Margin posture', body: 'Q1 2026 group EBIT halved · DTNA EBIT −73% · tariff overhang in low-triple-digit million euros.' },
    { mark: 'Greenfield', body: 'eCascadia + eM2 series production at Portland · new yard surfaces the 2012 config was never designed to track.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, different freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Jeff Allen. The lean-manufacturing discipline you carried out of twenty-five years at Detroit Diesel — takt time, variance reduction, standard work, line readiness — proved out the site-level yard case at Saltillo in 2012 and across the 9 US+Mexico plants since. The five minutes that follow are about the layer above the 9 site-level yard logs that the +85% Q1 order intake now needs.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#0078D4',
  },
};
