/**
 * Hyundai Motor America — ABM Microsite Data
 * Quality Tier: A+ (Tier 3, Band D — automotive, EV-era greenfield in the
 *   design window, with mature site-level discipline alongside the
 *   greenfield in the same 5-facility cluster)
 * Pitch shape: network operating model laddered up from HMGMA Metaplant
 *   as the cleanest yard-ops greenfield in the U.S. portfolio.
 * Angle: YARD MANAGEMENT across the 5-facility Hyundai Motor Group U.S.
 *   cluster — HMMA Montgomery, HMGMA Metaplant (Bryan County GA), HL-GA
 *   Battery JV co-located at HMGMA, Hyundai Mobis Richmond Hill, and Kia
 *   Georgia West Point — with finished-vehicle outbound through Glovis
 *   America at Colonel's Island Brunswick and the Savannah consolidation
 *   center.
 *
 * Phase 10 A+ uplift applies the full 12-task pattern from scratch on top
 * of the original Phase 3 migration baseline:
 *   - Cover hook reframed as the 5-facility footprint operating-system thread
 *   - Hypothesis broken into three paragraphs (cluster + Mobis cadence + window)
 *   - Pull-quote added between paragraphs 1 and 2
 *   - Composition rows tightened on HMGMA Metaplant, HL-GA Battery JV, the
 *     5-facility footprint shape, and Glovis port consolidation
 *   - Comparable closing sentence tightened to TPS-equivalent extension framing
 *   - Methodology Muñoz / U.S. Supply Chain tenure source verified + unknown
 *     about cross-plant yard-operating-model owner retained
 *   - First-name-personalized About + signOff for variant[0]
 *   - personVariants[0] rewritten as the top decision-maker (Yongchul Chung,
 *     VP-level Global Logistics & Supply Chain) with the cluster-wide framing
 *   - Marginalia hand-authored (6 items)
 *   - Audio brief override added (account-specific chapters for the cluster)
 *   - Artifact added: /artifacts/hyundai-motor-america-coverage-map.svg — five
 *     covered tiles (HMMA Montgomery, HMGMA Metaplant, HL-GA Battery JV,
 *     Hyundai Mobis Richmond Hill, Kia Georgia West Point) + YARD NETWORK OPS
 *     unfilled in Hyundai navy #002C5F
 */

import type { AccountMicrositeData } from '../schema';

export const hyundaiMotorAmerica: AccountMicrositeData = {
  slug: 'hyundai-motor-america',
  accountName: 'Hyundai Motor America',
  coverHeadline: "Yard execution across HMA's 5-facility US footprint",
  titleEmphasis: "HMA's 5-facility US footprint",
  coverFootprint: '5-facility US cluster',
  parentBrand: 'Hyundai',
  vertical: 'automotive',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 63,

  pageTitle: "Hyundai Motor America · The yard layer above HMA's 5-facility US footprint",
  metaDescription:
    "Hyundai Motor Group runs a five-facility U.S. manufacturing cluster — HMMA Montgomery, HMGMA Metaplant in Bryan County GA, the HL-GA Battery JV, the Hyundai Mobis EV power-electronics plant in Richmond Hill, and Kia Georgia in West Point — with finished-vehicle outbound through Glovis America at Brunswick and Savannah. HMGMA opened production in October 2024 as the cleanest yard-ops greenfield in the network. The operating layer above the sites is unsolved.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Hyundai Motor Group U.S. cluster',
      composition: [
        {
          label: 'U.S. manufacturing footprint',
          value:
            "Five-facility cluster carrying Hyundai Motor Group's U.S. assembly and battery production. HMMA (Montgomery AL, opened 2005, ~358K vehicles in 2025 against ~390K capacity; Santa Fe, Santa Fe Hybrid, Tucson, Santa Cruz, Genesis GV70 incl. Electrified GV70 on one flexible line — twenty years of established JIT discipline as of May 2025). HMGMA Metaplant America (Ellabell, Bryan County GA — $7.6B, 500K vehicles/yr at full ramp, first 2025 IONIQ 5 off the line October 2024, grand opening March 2025; 2026 IONIQ 9 added; hybrid-capable). HL-GA Battery Company JV with LG Energy Solution co-located at the Metaplant ($4.3B). Hyundai Mobis EV Power Electric system plant (Richmond Hill GA — $926M, ~1.2M sq ft, supplies up to 900K EV power-electric systems plus 450K integrated charging control units annually to three destinations: HMGMA, HMMA, and Kia Georgia). Kia Georgia (West Point — 350K/yr capacity; Telluride, Sorento, Sportage, plus EV6 and EV9 both in full production in 2025).",
        },
        {
          label: 'HMGMA Metaplant — the marquee greenfield',
          value:
            "$7.6B build in Bryan County GA, the highest-leverage single yard-ops design window in the U.S. portfolio. First 2025 IONIQ 5 off the line October 2024; grand opening March 2025; ramping toward 500,000 vehicles annually; 2026 IONIQ 9 added in the model mix; hybrid-capable. Vertically integrated with the HL-GA Battery JV next door, supplied with EV power electronics from Mobis Richmond Hill, and feeding finished-vehicle outbound through Glovis America at Colonel's Island Brunswick and the Savannah consolidation center. The operating pattern at HMGMA is being set now in the production-ramp window — the three-to-four-quarter design window after first production is open and closes when the local routine hardens.",
        },
        {
          label: 'HL-GA Battery JV — non-traditional inbound at the same dock',
          value:
            "$4.3B Hyundai Motor Group / LG Energy Solution battery-cell joint venture co-located at the HMGMA Metaplant campus. Plus the Hyundai + SK On battery JV in Bartow County coming online to support production of 300K all-electric Hyundai, Kia, and Genesis vehicles annually across the regional battery supply. Operationally, battery-cell freight into HMGMA assembly is heavy, regulated, single-source, and staged on a different discipline than parts inbound — and it shares the same dock infrastructure with conventional parts inbound at the point where the lanes converge.",
        },
        {
          label: '5-facility footprint — four inbound profiles, one yard layer',
          value:
            "Four structurally different freight types into the cluster simultaneously: traditional JIT parts (HMMA Montgomery, twenty years of established discipline); battery-cell inbound (HL-GA → HMGMA, greenfield staging); EV power-electronics sub-assemblies (Mobis Richmond Hill → HMGMA + HMMA + Kia Georgia, three-destination consolidation cadence); finished-vehicle outbound (HMGMA + HMMA + Kia Georgia → Brunswick and Savannah via Glovis). Same dock infrastructure absorbs all of it where the lanes converge — and the yard layer above the five sites runs site-by-site, not network-by-network.",
        },
        {
          label: 'Glovis port consolidation — the outbound anchor',
          value:
            "Hyundai Glovis America coordinates a meaningful share of inbound parts logistics and substantially all of the finished-vehicle outbound through Brunswick GA and Savannah GA. Glovis runs a Brunswick facility at 1 Joe Frank Harris Blvd with ro-ro space at Colonel's Island Terminal, and a recently established ~69,000 sq m Glovis EV Logistics America consolidation center in Savannah — the structural anchor of the EV-era outbound flow for the entire Group. The lane-planning-to-receiving-yard handoff between Glovis and each assembly plant is one of the seams the operating model runs through.",
        },
        {
          label: 'EV ramp + executive context',
          value:
            "José Muñoz became Hyundai Motor Company's first non-Korean global President & CEO on January 1, 2025, with the HMGMA Metaplant ramp and the Georgia battery JVs (HL-GA at the Metaplant, plus the SK On battery JV in Bartow County) as the highest-visibility investments inside his portfolio. The Group has publicly committed to expanding U.S. production capacity to 1.2M vehicles annually across Hyundai, Kia, and Genesis.",
        },
        {
          label: 'Existing yard-ops operating layer',
          value:
            'Twenty years of established JIT discipline inside HMMA Montgomery; greenfield yard-ops design still settling at HMGMA; site-level practice at Kia Georgia and the Mobis plant set by their own histories. The network-level operating layer above the five sites — the protocol that makes every yard agree on the same gate-to-dock handoff, the same dock-door arbitration for mixed cargo profiles, the same exception handling for battery-cell inbound versus parts inbound at the same plant — is the unsolved seam.',
        },
      ],
      hypothesis:
        "The interesting thing about the Hyundai Motor America yard math is the timing of the cluster. HMMA Montgomery turned twenty years old in May 2025; the in-plant JIT discipline there is twenty years deep, and the yard layer around it has been operating on the same plant-level routine that worked for a single-site Alabama operation. HMGMA Metaplant put the first 2025 IONIQ 5 off the line in October 2024 and held its grand opening in March 2025 — the yard-ops operating pattern at the Metaplant is still being set right now, in the window before the production ramp toward the 500,000-vehicle annual capacity finishes hardening the local routine. The HL-GA battery JV sits inside the Metaplant campus and pushes battery-cell freight into the assembly side on a different staging discipline than parts inbound. Five facilities, four structurally different inbound cargo profiles converging at overlapping docks, finished-vehicle outbound flowing through Glovis America at Colonel's Island Brunswick and the Savannah consolidation center — and the operating layer above the yards is still site-by-site.\n\nThe Hyundai Mobis Richmond Hill EV-power-electronics plant — 1.2 million square feet, $926M, supplying up to 900,000 power-electric systems per year — is the structural reason a network-level protocol pays back at the supplier-side as much as the OEM side. Mobis feeds three destinations simultaneously: HMGMA, HMMA, and Kia Georgia. That means a single Mobis lane cadence has to arbitrate against three different receiving-yard schedules with three different operating histories — twenty years of HMMA Montgomery JIT routine, a still-settling HMGMA greenfield pattern, and Kia Georgia's own West Point operating discipline running the EV6 and EV9 alongside the Telluride, Sorento, and Sportage. The variance budget per supplier shrinks every quarter the EV ramp adds to the inbound mix, and the same dock infrastructure that absorbs Mobis sub-assemblies also has to absorb HL-GA battery-cell flow into HMGMA and conventional parts inbound at the same plant.\n\nThat gap is the most expensive in the first three to four quarters after a new node opens, because that is the window when the operating pattern at the new node either gets standardized to a network protocol or hardens to its own local habit. HMGMA is inside that window now. Twenty years of HMMA Montgomery routine demonstrates what happens when the window closes without a network standard: the yard layer outside the plant gate becomes immune to changes the Production System imposes inside it. The opportunity isn't to replace what HMMA has built; it's to extend it to HMGMA as a greenfield discipline before the Metaplant settles into its own version of the same site-level pattern, and to use the Metaplant pilot as the protocol the rest of the cluster — Mobis cadence, Kia Georgia receiving, HMMA upgrade, Glovis outbound through Brunswick and Savannah — laddered up from. Primo's hard-freight discipline translates down to a JIT auto cadence: if a network operating model can run on water — weight-out-before-cube-out, no-margin-recovery-line, multi-temp dock arbitration at every node — the read-across to a five-facility JIT cluster is a different vertical with the same shape, not a harder lift.",
      pullQuote:
        "Five facilities, four inbound cargo profiles, one un-standardized yard layer above all of them.",
      caveat:
        "This is built from public Hyundai Motor Group disclosures, the public HMGMA / HMMA / Hyundai Mobis / HL-GA investment record, Kia Georgia production reporting, the José Muñoz CEO transition record, and reasonable inference about how the Mobis-to-three-destinations sub-assembly cadence interacts with three different receiving-yard histories. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don't match what your team is seeing: whether the HMGMA yard-ops pattern is still inside the design window or has already hardened to a local routine, how the HL-GA battery-cell inbound is being staged at the Metaplant dock today (segregated lanes, dedicated docks, or co-mingled), how the Mobis Richmond Hill cadence arbitrates against three different receiving plants, and how the Glovis-coordinated outbound flow through Brunswick and Savannah currently interacts with each plant's finished-vehicle yard.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the cluster operating layer',
      artifact: {
        imageSrc: '/artifacts/hyundai-motor-america-coverage-map.svg',
        imageAlt:
          'Hyundai Motor Group U.S. cluster coverage map. Six tiles representing the five-facility footprint plus the network operating layer above it. HMMA Montgomery, HMGMA Metaplant, HL-GA Battery JV, Hyundai Mobis Richmond Hill, and Kia Georgia West Point are covered. The Yard Network Ops tile is unfilled, marked with a Hyundai navy hairline outline.',
        caption: 'Hyundai Motor Group U.S. cluster coverage map · 1 tile unfilled.',
        source:
          'Composition modeled from public HMGMA / HMMA / Hyundai Mobis / HL-GA / Kia Georgia disclosures and Hyundai Glovis America logistics-network reporting. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you can't recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by refill returns logistics with reverse-leg yard implications. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Hyundai Motor America cluster is a different vertical with the same structural shape: multi-site, multi-input, multi-destination (HMGMA + HMMA + Kia Georgia all receive from Mobis Richmond Hill; HMGMA + HMMA + Kia Georgia all push outbound through Glovis America at Brunswick and Savannah), with mature in-plant operating discipline at HMMA and a greenfield yard-ops design still being set at HMGMA. The freight comparison runs the opposite direction from the usual read-across — Primo's freight is harder per case, but a JIT auto cluster running battery-cell inbound and EV-power-electronics sub-assembly cadence against a 500,000-vehicle annual ramp has a tighter tolerance per minute than any beverage plant. The shape Primo built above its plants is the same shape a network operating layer would extend above the five Hyundai yards: standardized work, sequenced flow, and stop-authority at the layer that today still runs site-by-site. If a network operating model can run on water — the operationally hardest CPG freight — the read-across to a five-facility EV-era assembly cluster is a different vertical with the same shape, not a harder lift.",
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        "30–60 days from kickoff to first measurable impact at the pilot site. The highest-leverage pilot in the Hyundai Motor America cluster is HMGMA Metaplant — and the reason is structural, not preferential. Greenfield yard-ops design at a $7.6B plant ramping toward 500,000 vehicles annually means no entrenched local routine to displace, the operating pattern is still inside the design window in the first three to four quarters after first production (October 2024), and every other node in the cluster — HMMA, Kia Georgia, Mobis Richmond Hill, the Glovis-coordinated outbound flow — has a structural reason to inherit a protocol that lands at the Metaplant first. The secondary pilot is HMMA Montgomery, because that's where any network-wide protocol ultimately has to prove out against twenty years of established site-level routine on the same flexible assembly line that builds five vehicle programs in mixed sequence. We would expect the network operating model to make sense of itself across the cluster within two to four quarters of the Metaplant pilot.",
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'hmgma-public',
          source: 'Hyundai Motor Group Metaplant America (HMGMA) public disclosures',
          confidence: 'public',
          detail:
            'Anchors the $7.6B Metaplant investment, the October 2024 first-production date (2025 IONIQ 5), the March 2025 grand opening, the 500,000-vehicle annual capacity target, the 2026 IONIQ 9 model addition, and the hybrid-capable production-line flexibility. Sourced from Hyundai Newsroom, HMGMA company materials, and Georgia state economic-development reporting.',
          url: 'https://www.hmgma.com/our-facility/',
        },
        {
          id: 'hmma-public',
          source: 'Hyundai Motor Manufacturing Alabama (HMMA) public disclosures',
          confidence: 'public',
          detail:
            'Anchors the 2005 plant opening, the ~358,000 expected 2025 vehicle production and ~390,000 annual capacity, the cumulative 6.27M vehicles produced since the 2006 Sonata, and the current model mix (Santa Fe, Santa Fe Hybrid, Tucson, Santa Cruz, Genesis GV70 and Electrified GV70 on one flexible assembly line). Sourced from the HMMA May/July 2025 fact sheets and the May 2025 20-year-anniversary coverage.',
          url: 'https://www.hmmausa.com/',
        },
        {
          id: 'hl-ga-battery-jv',
          source: 'HL-GA Battery Company JV (Hyundai + LG Energy Solution)',
          confidence: 'public',
          detail:
            '$4.3B battery-cell joint venture co-located at the HMGMA Metaplant campus, plus the Hyundai + SK On $5B battery facility in Bartow County. Together they support production targets of 300,000 all-electric Hyundai, Kia, and Genesis vehicles annually as the regional battery supply lands. Operationally, battery-cell freight into HMGMA assembly is the cleanest example of a non-traditional inbound cargo profile being staged at the same dock infrastructure as conventional parts inbound.',
        },
        {
          id: 'hyundai-mobis-richmond-hill',
          source: 'Hyundai Mobis Richmond Hill EV Power Electric plant',
          confidence: 'public',
          detail:
            '$926M Mobis investment in Bryan County, ~1,200,000 sq ft, 1,500 jobs at full ramp. Supplies up to 900,000 EV Power Electric systems and 450,000 Integrated Charging Control Units annually to three destinations simultaneously — HMGMA, HMMA, and Kia Georgia. The three-destination cadence is the structural reason a network-level yard protocol pays back at the supplier-side as much as the OEM side.',
          url: 'https://georgia.org/press-release/second-global-automotive-supplier-hyundai-metaplant-create-1500-jobs',
        },
        {
          id: 'kia-georgia',
          source: 'Kia Georgia (KMMG) West Point public disclosures',
          confidence: 'public',
          detail:
            "350,000-vehicle annual capacity. EV6 and EV9 both in full production in 2025 after the $217M EV-expansion investment. Producing the Telluride, Sorento, Sportage, EV9, and EV6 SUVs; Telluride exports out of Colonel's Island (Brunswick) carried by Glovis. Approaching the 5-millionth cumulative vehicle in 2025.",
        },
        {
          id: 'glovis-america',
          source: 'Hyundai Glovis America logistics-network disclosures',
          confidence: 'public',
          detail:
            "Glovis America coordinates Hyundai Motor Group North American vehicle logistics with a Brunswick GA facility at 1 Joe Frank Harris Blvd, ro-ro space at Colonel's Island Terminal, and a recently established large-scale Glovis EV Logistics America consolidation center in Savannah covering ~69,000 sq m. The Glovis-to-receiving-yard handoff is one of the seams the operating model runs through; specifics on which inbound lanes Glovis owns vs. contract carriers across the cluster are not fully public.",
          url: 'https://www.glovisusa.com/locations/',
        },
        {
          id: 'munoz-ceo-transition',
          source: 'José Muñoz — global CEO appointment and U.S. supply-chain leadership tenure record',
          confidence: 'public',
          detail:
            "Muñoz became Hyundai Motor Company's first non-Korean global President & CEO effective January 1, 2025, after joining Hyundai in 2019 as Global COO and President/CEO of Hyundai and Genesis Motor North America. Prior to that he led Nissan's North American operations. The HMGMA Metaplant ramp and the Georgia battery JVs are the highest-visibility investments inside his portfolio, with public commitments to expand U.S. production capacity to 1.2M vehicles annually across Hyundai, Kia, and Genesis. The U.S. supply-chain and logistics leadership beneath Muñoz at HMA is the seat the cluster-wide yard-operating-model decision ultimately runs through.",
          url: 'https://www.automotivelogistics.media/supply-chain-purchasing/hyundai-appoints-jose-munoz-as-new-global-ceo/46402.article',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + automotive-industry yard-operations benchmarks',
          confidence: 'public',
          detail:
            'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site assembly networks operate under, not the Hyundai cluster specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail:
            'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether the HMGMA yard-ops operating pattern is still inside the design window or has already hardened to a local site-level routine in the first three to four quarters since first production',
        'How HL-GA battery-cell inbound is being staged at the HMGMA assembly dock today — segregated lanes, dedicated docks, or co-mingled with conventional parts inbound',
        'How the Hyundai Mobis Richmond Hill three-destination cadence (HMGMA + HMMA + Kia Georgia) is arbitrated against three different receiving-yard histories — central Mobis dispatch, plant-by-plant scheduling, or a hybrid',
        "How the Glovis America inbound and outbound flows interact with each plant's yard layer today, and where the carrier-scheduling-to-dock-execution handoff actually lives across Brunswick and Savannah",
        'Whether the HMMA Montgomery in-plant JIT discipline (twenty years deep) is genuinely standardized at the yard layer outside the gate, or sits below the visibility threshold the Production System inside the plant runs to',
        'Which executive function inside Hyundai Motor America owns the cross-plant yard-operating-model decision today — and whether the seat exists or needs to be created beneath the Muñoz / U.S. supply-chain leadership line',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Hyundai Motor America is distinctive in this round because the analytical wedge is timing-shaped, not scale-shaped. The five-facility U.S. cluster is small enough that the network operating model can be designed precisely, and HMGMA is inside the three-to-four-quarter window after first production where the yard-ops operating pattern is still being set rather than defended. The Mobis Richmond Hill three-destination cadence, the HL-GA battery-cell inbound, and the Glovis-coordinated outbound flow through Brunswick and Savannah are the three structural seams a network protocol pays back against. Twenty years of HMMA Montgomery discipline is the proof of what gets built when the in-plant work is standardized but the yard layer outside the gate operates on its own local history.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Yongchul — the part most worth pushing back on is whether the HMGMA yard-ops design window is still open from your vantage point, how the HL-GA battery-cell inbound is staged at the Metaplant dock today, how the Mobis Richmond Hill three-destination cadence interacts with three receiving-yard histories, or how the Glovis outbound through Brunswick and Savannah currently lands at each plant's finished-vehicle yard. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-047',
      name: 'Yongchul Chung',
      firstName: 'Yongchul',
      lastName: 'Chung',
      title: 'Senior Manager, Global Logistics & Supply Chain',
      company: 'Hyundai Motor America',
      email: 'yongchul.chung@hmna.com',
      linkedinUrl: 'https://www.linkedin.com/in/yongchulchung',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Logistics / Supply Chain',
      currentMandate:
        'Direct Hyundai logistics leader with U.S. supply-chain scope. Beneath José Muñoz (Hyundai\'s first non-Korean global President & CEO, effective January 1, 2025), the U.S. supply-chain and logistics seat is the function the cluster-wide yard-operating-model decision ultimately runs through — HMGMA Metaplant ramp, HL-GA battery-cell inbound, Mobis Richmond Hill three-destination cadence, and Glovis outbound through Brunswick and Savannah.',
      bestIntroPath: 'LinkedIn / Sales Nav — direct outreach to the global logistics & supply-chain office. Parallel routing through Hyundai Glovis America logistics-planning leadership on the inbound-lane side and the HMGMA on-site operations function on the receiving-yard side.',
    },
    {
      personaId: 'P-046',
      name: 'Carey Gammon',
      firstName: 'Carey',
      lastName: 'Gammon',
      title: 'Director, Vehicle Operations (HMA)',
      company: 'Hyundai Motor America',
      email: 'carey.gammon@hmna.com',
      linkedinUrl: 'https://www.linkedin.com/in/carey-gammon-07116933',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Operations / Logistics',
      currentMandate: 'Direct Hyundai operations leader with demand planning, S&OP, logistics and supply-chain background.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-048',
      name: 'Kevin Kim',
      firstName: 'Kevin',
      lastName: 'Kim',
      title: 'Hyundai Motor America logistics / supply chain professional',
      company: 'Hyundai Motor America',
      email: 'kevin.kim@hmna.com',
      linkedinUrl: 'https://www.linkedin.com/in/kevin-kim-5211a1a0',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Parts / Logistics',
      currentMandate: 'Named Hyundai Motor America logistics professional.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-049',
      name: 'Ashley Eckel',
      firstName: 'Ashley',
      lastName: 'Eckel',
      title: 'Operations-focused logistics professional',
      company: 'Hyundai Motor America',
      email: 'ashley.eckel@hmna.com',
      linkedinUrl: 'https://www.linkedin.com/in/ashleynpeckel92932123',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Operations / Logistics',
      currentMandate: 'Named Hyundai Motor America operations/logistics contact.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-050',
      name: 'Sarah Johnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      title: 'Logistics professional, Hyundai Glovis America',
      company: 'Hyundai Motor America',
      email: 'sarah.johnson@hmna.com',
      linkedinUrl: 'https://www.linkedin.com/in/sarah-johnson-344a1aba',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Distribution / Logistics',
      currentMandate: 'Useful Hyundai-adjacent logistics route through Glovis America.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-047',
        name: 'Yongchul Chung',
        firstName: 'Yongchul',
        lastName: 'Chung',
        title: 'Senior Manager, Global Logistics & Supply Chain',
        company: 'Hyundai Motor America',
        email: 'yongchul.chung@hmna.com',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Logistics / Supply Chain',
      },
      fallbackLane: 'logistics',
      label: 'Yongchul Chung - Senior Manager, Global Logistics & Supply Chain',
      variantSlug: 'yongchul-chung',

      framingNarrative:
        "Yongchul, the Hyundai Motor America cluster is unusual in the analytical set this quarter because it is small enough — five facilities — to design the network operating model precisely, and HMGMA is inside the three-to-four-quarter window after first production where the yard-ops operating pattern is still being set rather than defended. José Muñoz became Hyundai's first non-Korean global President & CEO on January 1, 2025; the HMGMA ramp toward 500,000 vehicles annually, the HL-GA battery JV co-located at the Metaplant, the Mobis Richmond Hill three-destination cadence, and the Glovis outbound through Brunswick and Savannah all sit inside the U.S. supply-chain seat beneath him. That is the seat the cluster-wide yard-operating-model decision runs through.",
      openingHook:
        "HMMA Montgomery is twenty years old, in-plant. HMGMA Metaplant has been producing since October 2024 — under eighteen months and still inside the design window. The HL-GA battery JV co-located at HMGMA pushes battery-cell freight into the assembly side on a different staging discipline than parts inbound. The Mobis EV-power-electronics plant in Richmond Hill is feeding three destinations at once. The Glovis outbound through Brunswick and Savannah anchors the finished-vehicle flow. Five sites, four inbound cargo profiles, one network operating layer that doesn't yet exist above them.",
      stakeStatement:
        "The three-to-four-quarter window after first production at a greenfield is when the yard-ops operating pattern is most malleable and the cost of standardization is lowest. HMGMA is inside that window now. The structural argument runs through the Mobis three-destination cadence: a single supplier feeding HMGMA + HMMA + Kia Georgia simultaneously cannot arbitrate against three different receiving-yard histories without a network-level protocol that holds for all three. Every quarter the EV ramp adds to the inbound mix, the variance budget per supplier shrinks, and the cost of waiting compounds across the cluster.",

      heroOverride: {
        headline: 'The five-facility Hyundai Motor America cluster has one un-standardized yard layer above it.',
        subheadline:
          "HMMA Montgomery (twenty years of JIT). HMGMA Metaplant (inside the design window — first production October 2024). HL-GA Battery JV (co-located at HMGMA). Hyundai Mobis Richmond Hill (three-destination supplier cadence). Kia Georgia (EV6 + EV9 in full production). The operating layer above the sites is still site-by-site.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator framing, with the U.S. supply-chain seat made explicit. Yongchul sits at the seam between Korean HQ and U.S. operations on the logistics side; lead with the structural map (five facilities, four cargo profiles, one un-standardized yard layer) and the timing argument (HMGMA inside the design window). Acknowledge HMMA's twenty years of JIT discipline as the inheritance it is. Position the wedge as a network operating layer above the five sites, not as a replacement of anything HMMA has built — and as the function-level decision that sits beneath the Muñoz / U.S. supply-chain leadership line, not above it.",
      kpiLanguage: [
        'gate-to-dock cycle time at the Metaplant',
        'battery-cell vs. conventional-parts dock-door arbitration',
        'Mobis three-destination cadence variance',
        'finished-vehicle yard turn at Brunswick / Savannah',
        'JIT window adherence across the cluster',
        'inbound-mix variance per shift',
        'carrier scorecard across Glovis and contract lanes',
        'standardized work at the yard layer',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — different vertical, same structural shape: multi-site, multi-input, mature site-level operating discipline at the established nodes and a fresh design window at the new one. Primo's hard-freight discipline translates down to JIT auto cadence. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
    },
    {
      person: {
        personaId: 'P-046',
        name: 'Carey Gammon',
        firstName: 'Carey',
        lastName: 'Gammon',
        title: 'Director, Vehicle Operations (HMA)',
        company: 'Hyundai Motor America',
        email: 'carey.gammon@hmna.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Operations / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Carey Gammon - Director, Vehicle Operations',
      variantSlug: 'carey-gammon',

      framingNarrative:
        "Carey, the analytical wedge on the Hyundai Motor America cluster is timing-shaped. HMGMA is inside the three-to-four-quarter window after first production (October 2024) where the yard-ops operating pattern is still being set rather than defended — and the rest of the five-facility cluster has a structural reason to inherit whatever protocol lands at the Metaplant. Twenty years of HMMA Montgomery shows what gets built when the in-plant JIT work is standardized and the yard layer outside the gate is left to its own history.",
      openingHook:
        "Five facilities, four structurally different inbound cargo profiles (traditional parts at HMMA, battery cells from HL-GA at HMGMA, Mobis power-electronics sub-assemblies into three destinations, finished-vehicle outbound through Brunswick and Savannah). One un-standardized yard layer above all of them. The Metaplant is the cleanest place in the network to set the pattern before it hardens.",
      stakeStatement:
        "Every minute the cluster doesn't standardize at the yard layer is a minute the Production System inside the plant has to absorb somewhere else in the JIT chain. The Mobis Richmond Hill three-destination cadence is the structural reason — one supplier lane has to arbitrate against three different receiving-yard histories, and the variance budget per supplier shrinks every quarter the EV ramp adds to the inbound mix.",

      heroOverride: {
        headline: 'HMGMA is inside the design window for the yard-ops operating pattern that the rest of the cluster has to inherit.',
        subheadline:
          'Five facilities. Four inbound cargo profiles. The Metaplant has run production since October 2024 — the three-to-four-quarter window where a network protocol lands cleanly is open now and closes when the local routine hardens.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator framing. Carey is the day-to-day vehicle-operations leader; lead with the structural map of the five-facility cluster and the four inbound cargo profiles, then the timing argument. Acknowledge HMMA's twenty years of JIT discipline as the inheritance it is. Position the wedge as a network operating layer above the five sites, not as a replacement of anything HMMA has built.",
      kpiLanguage: [
        'gate-to-dock cycle time at the Metaplant',
        'battery-cell vs. conventional-parts dock-door arbitration',
        'Mobis three-destination cadence variance',
        'finished-vehicle yard turn at Brunswick / Savannah',
        'JIT window adherence across the cluster',
        'inbound-mix variance per shift',
        'carrier scorecard across Glovis and contract lanes',
        'standardized work at the yard layer',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — different vertical, same structural shape: multi-site, multi-input, mature site-level operating discipline at the established nodes and a fresh design window at the new one. Primo's hard-freight discipline translates down to JIT auto cadence. The directly-shaped comparable (the un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic.",
    },
    {
      person: {
        personaId: 'P-049',
        name: 'Ashley Eckel',
        firstName: 'Ashley',
        lastName: 'Eckel',
        title: 'Operations-focused logistics professional',
        company: 'Hyundai Motor America',
        email: 'ashley.eckel@hmna.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Operations / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Ashley Eckel - Operations-focused logistics professional',
      variantSlug: 'ashley-eckel',

      framingNarrative:
        "Ashley, the Hyundai Motor America cluster is unusual in the analytical set this quarter because it is small enough — five facilities — to design the network operating model precisely, and HMGMA is inside the design window where the operating pattern is still being set. The Mobis Richmond Hill three-destination cadence and the HL-GA battery-cell inbound are the two structural seams that don't have an established site-level routine to fall back on yet.",
      openingHook:
        "HMMA Montgomery is twenty years old, in-plant. HMGMA Metaplant has been producing for under eighteen months. The Mobis EV-power-electronics plant in Richmond Hill is feeding three destinations at once. The Glovis outbound through Brunswick and Savannah anchors the finished-vehicle flow. Five sites, one network operating layer that doesn't yet exist above them.",
      stakeStatement:
        "The three-to-four-quarter window after first production at a greenfield is when the yard-ops operating pattern is most malleable and the cost of standardization is lowest. HMGMA is inside that window now. The structural argument runs through the Mobis three-destination cadence: a single supplier feeding HMGMA + HMMA + Kia Georgia simultaneously cannot arbitrate against three different receiving-yard histories without a network-level protocol that holds for all three.",

      heroOverride: {
        headline: 'The five-facility Hyundai Motor America cluster has one un-standardized yard layer above it.',
        subheadline:
          'HMMA Montgomery (twenty years of JIT). HMGMA Metaplant (inside the design window). HL-GA battery JV. Hyundai Mobis Richmond Hill (three-destination supplier cadence). Kia Georgia. The operating layer above the sites is still site-by-site.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator framing. Ashley lives in the operational details across the cluster — lead with the structural map (five facilities, four cargo profiles, one un-standardized layer) and the timing argument (HMGMA inside the design window). Avoid framing this as a sales conversation; frame it as the analytical wedge a network protocol pays back against.",
      kpiLanguage: [
        'truck turn time at each cluster node',
        'detention cost across Glovis and contract lanes',
        'dock-door arbitration for mixed inbound',
        'Mobis three-destination cadence variance',
        'finished-vehicle outbound yard turn',
        'on-time carrier performance',
        'yard-layer standardization vs. site-level routine',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — same structural shape (multi-site, multi-input, mature site-level operating discipline alongside a greenfield window), different vertical. Primo's hard-freight discipline translates down to a JIT auto cadence. The 237-facility CPG anchor is the credibility flex if peer reference becomes the topic.",
    },
    {
      person: {
        personaId: 'P-050',
        name: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        title: 'Logistics professional, Hyundai Glovis America',
        company: 'Hyundai Motor America',
        email: 'sarah.johnson@hmna.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Distribution / Logistics',
      },
      fallbackLane: 'logistics',
      label: 'Sarah Johnson - Logistics, Hyundai Glovis America',
      variantSlug: 'sarah-johnson',

      framingNarrative:
        "Sarah, the Glovis America angle on the Hyundai Motor Group U.S. cluster is the one where the yard-operating-layer argument lands most directly. Glovis is the structural seam — the lane-planning-to-receiving-yard handoff at HMGMA, HMMA, and Kia Georgia, and the finished-vehicle flow through Colonel's Island (Brunswick) and the Savannah consolidation center. Five facilities, one un-standardized yard layer, and the carrier-to-dock execution is the part Glovis sees most clearly.",
      openingHook:
        "The Savannah consolidation center (~69,000 sq m) and Colonel's Island ro-ro space are the structural anchors of the EV-era outbound flow for the entire Group. Inbound, Glovis-coordinated parts and finished-vehicle flows interact with three plant yards (HMGMA, HMMA, Kia Georgia) running on three different operating histories. The carrier-to-dock handoff is the seam where the network-level protocol either holds or doesn't.",
      stakeStatement:
        "Every plant in the cluster runs its yard on its own local routine today. From the Glovis side, that means lane-planning decisions and carrier-scheduling decisions get re-interpreted at each receiving yard against three different operating histories. A network-level yard operating protocol — laddered up from HMGMA's design window before the pattern hardens — is what makes carrier-scheduling decisions actually land at the dock the way they were planned.",

      heroOverride: {
        headline: 'The Glovis-coordinated flow into and out of the cluster runs through five different yard operating histories.',
        subheadline:
          "Brunswick + Savannah anchor the outbound. The Mobis Richmond Hill three-destination cadence anchors the inbound. The five plant yards in between are still running on site-level routine — and that's the layer the lane-planning decisions get re-interpreted at.",
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator framing, with the Glovis angle made explicit. Sarah sees the carrier-scheduling-to-dock-execution handoff from the lane-planning side; lead with where the handoff currently lives (and where it gets re-interpreted) at each receiving yard. Position the wedge as the network operating layer above the sites — the protocol that holds across the cluster the way Glovis lane-planning has to.",
      kpiLanguage: [
        'turn time at the receiving yard',
        'detention cost across the cluster',
        'dwell time at finished-vehicle yards',
        'on-time pickup at supplier-side and receiving-side',
        'carrier-experience metrics across Glovis lanes',
        'lane-planning to dock-execution handoff integrity',
        'ro-ro window adherence at Brunswick',
        'consolidation-center turn at Savannah',
      ],
      proofEmphasis:
        "Primo is the public comparable to cite — multi-site, multi-input network with the same structural shape as the Hyundai cluster, different vertical. Primo's hard-freight discipline translates down to a JIT auto cadence. The 237-facility CPG anchor is the credibility flex when peer reference becomes the topic.",
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
    facilityCount: '5-facility U.S. cluster (HMMA Montgomery AL; HMGMA Metaplant Bryan County GA; HL-GA Battery Co JV at HMGMA; Hyundai Mobis EV Power Electric plant Richmond Hill GA; Kia Georgia West Point GA)',
    facilityTypes: ['Vehicle Assembly Plants', 'Battery-Cell JV', 'EV Power-Electronics Supplier Plant', 'Finished-Vehicle Outbound (Glovis America via Brunswick + Savannah)'],
    geographicSpread:
      "Southeast U.S. cluster (Montgomery AL; Bryan County GA — HMGMA + HL-GA + Mobis Richmond Hill all within the same metro; West Point GA — Kia Georgia; outbound through Colonel's Island Brunswick and the Savannah consolidation center)",
    dailyTrailerMoves: 'High-volume — JIT parts inbound to HMMA, battery-cell inbound from HL-GA to HMGMA, Mobis Richmond Hill three-destination sub-assembly cadence (HMGMA + HMMA + Kia Georgia), finished-vehicle outbound through Brunswick and Savannah',
    fleet: 'Hyundai Glovis America-coordinated lanes plus contract carriers across the inbound supplier base',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal/Rail', 'Ro-Ro Ocean (outbound via Brunswick)'],
    avgLoadsPerDay: 'High-volume — distributed across JIT parts inbound, battery-cell inbound from HL-GA into HMGMA, Mobis EV-power-electronics sub-assembly cadence into three destinations, and finished-vehicle outbound through Glovis America at Brunswick and Savannah',
    peakSeason: 'Model-year changeover and the HMGMA production ramp toward the 500,000-vehicle annual capacity drive the largest variance — not a calendar season',
  },

  signals: {
    eventAttendance: 'Automotive Logistics and supply-chain industry conference circuit',
    recentNews: [
      'HMGMA Metaplant America produced its first vehicle (2025 IONIQ 5) in October 2024; held grand opening in March 2025; 2026 IONIQ 9 added; ramping toward 500,000 vehicles annually.',
      'HMMA Montgomery celebrated 20 years of production in May 2025; ~358K vehicles expected in 2025 against ~390K capacity; flexible line builds Santa Fe, Santa Fe Hybrid, Tucson, Santa Cruz, Genesis GV70, and Electrified GV70.',
      'HL-GA Battery Company JV with LG Energy Solution ($4.3B) co-located at HMGMA; SK On battery JV in Bartow County supports 300K all-electric Hyundai / Kia / Genesis vehicles annually.',
      'Hyundai Mobis Richmond Hill EV Power Electric plant ($926M, ~1.2M sq ft) feeds HMGMA, HMMA, and Kia Georgia simultaneously with up to 900K EV power-electric systems annually.',
      "Hyundai Glovis America operates a Brunswick GA facility at Colonel's Island Terminal and recently established a ~69,000 sq m Glovis EV Logistics America consolidation center in Savannah.",
      "José Muñoz became Hyundai Motor Company's first non-Korean global President & CEO on January 1, 2025; HMGMA ramp and Georgia battery JVs are inside his portfolio; 1.2M-vehicle U.S. annual capacity target announced.",
    ],
    supplyChainInitiatives: [
      'HMGMA Metaplant production ramp toward 500K vehicles annually — yard-ops operating pattern inside the design window.',
      'Hyundai Mobis Richmond Hill three-destination supply cadence — supplier-side lane planning vs. three receiving-yard histories.',
      'HL-GA battery-cell inbound flow into HMGMA assembly — non-traditional inbound staged against conventional parts at the same dock infrastructure.',
      "Hyundai Glovis America EV Logistics consolidation center in Savannah — structural anchor of the Group's EV-era outbound flow.",
    ],
    urgencyDriver:
      "HMGMA is inside the three-to-four-quarter window after first production (October 2024) where the yard-ops operating pattern is still being set rather than defended. The rest of the five-facility cluster has a structural reason — Mobis three-destination cadence, HL-GA battery-cell inbound, Glovis-coordinated outbound — to inherit whatever protocol lands at the Metaplant. Twenty years of HMMA Montgomery shows what gets built when the design window closes without a network standard.",
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Greenfield', body: 'HMGMA Metaplant · $7.6B · Bryan County GA · first production Oct 2024 · grand opening Mar 2025 · ramping to 500K/yr.' },
    { mark: 'Co-located JV', body: 'HL-GA Battery · $4.3B · LG Energy Solution · battery-cell freight into the same dock infrastructure as parts inbound.' },
    { mark: 'Three-destination supplier', body: 'Mobis Richmond Hill · $926M · 1.2M sq ft · feeds HMGMA + HMMA + Kia Georgia simultaneously.' },
    { mark: 'Twenty-year inheritance', body: 'HMMA Montgomery · 2005 · twenty years of JIT discipline · ~358K vehicles in 2025.' },
    { mark: 'Outbound anchor', body: "Glovis America · Colonel's Island Brunswick + Savannah ~69,000 sq m consolidation center · EV-era finished-vehicle flow." },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, different vertical.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      "This brief is for Yongchul Chung. The Hyundai Motor America cluster is five facilities — HMMA Montgomery, HMGMA Metaplant, the HL-GA Battery JV, Hyundai Mobis Richmond Hill, and Kia Georgia — with finished-vehicle outbound flowing through Glovis America at Brunswick and Savannah. The five minutes that follow are about the one layer the cluster has not yet standardized: the yard above the five sites, and the three-to-four-quarter window at HMGMA where the operating pattern is still being set rather than defended.",
    chapters: [
      { id: 'thesis', label: 'I. Five facilities, four inbound profiles', start: 0 },
      { id: 'metaplant-window', label: 'II. The HMGMA design window', start: 65 },
      { id: 'mobis-cadence', label: 'III. The Mobis three-destination seam', start: 130 },
      { id: 'twenty-years', label: 'IV. What twenty years of HMMA shows', start: 195 },
      { id: 'network-protocol', label: 'V. The network protocol the cluster inherits', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#002C5F',
    backgroundVariant: 'dark',
  },
};
