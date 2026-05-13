/**
 * Ford Motor Company — ABM Microsite Data
 * Quality Tier: Tier 2 / Band B
 * Pitch shape: network-operating-model wedge framed against the Powertrain
 * Pluralism reset. Jim Farley restructured Ford under three engines in
 * Feb 2026 — Ford Blue (ICE), Ford Model e (battery-electric, profitability
 * moved to 2029), Ford Pro (the commercial profit engine carrying $14.7B
 * revenue at 11.4% EBIT and 879K paid software subscribers; FY2026 Pro EBIT
 * guide $6.5–7.5B). Preceded by $19.5B in special charges Dec 2025 and
 * followed by a $15.5B non-cash EV-asset impairment Feb 2026. BlueOval SK
 * Kentucky began battery production Aug 2025; BlueOval City battery
 * production slipped to 2027 with vehicle production roughly a year after;
 * Lightning Rouge paused indefinitely after the Novelis aluminum-plant fire.
 * The product strategy reshuffled; the ~100-yard footprint did not.
 *
 * The yard problem isn't a clean EV-greenfield design exercise anymore — it's
 * network-wide reconfiguration across ~100 yards while the strategy itself is
 * still moving and Ford Pro carries the network through the transition.
 *
 * Drive dossier intel (FREIGHTROLL BUSINESS CASE MODEL — FORD MOTOR COMPANY +
 * FREIGHTROLL → FORD PILOT PLAN, both Nov 2025) is the source of the
 * 3-site starter pack (Chicago Railhead, Louisville Assembly, Memphis PDC) and
 * the $90–$130M annual value-capture frame.
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const ford: AccountMicrositeData = {
  slug: 'ford',
  accountName: 'Ford',
  coverHeadline: 'The yard layer above the Ford+ reset',
  titleEmphasis: 'above the Ford+ reset',
  coverFootprint: '~100 yards · 15 assembly',
  parentBrand: 'Ford Motor Company',
  vertical: 'automotive',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: "Ford · The yard layer in the middle of a moving strategy",
  metaDescription:
    "Ford runs ~100 yards across vehicle assembly, finished-vehicle distribution, parts, and 3PL overflow while the product strategy itself is reconfiguring — EV pullback, BlueOval City retooled for gas and hybrid, BlueOval SK Kentucky live, F-150 Lightning Rouge paused indefinitely. The network operating layer above those yards is unsolved, and the transition window is when it matters most.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Ford U.S. yard network',
      composition: [
        { label: 'U.S. yard footprint', value: '~100 yards across ~15 vehicle assembly plant yards, ~50 finished-vehicle distribution yards (railhead and dealer-feeder), 22 Parts Distribution Center yards, and 20–30 overflow / 3PL-run yards' },
        { label: 'Powertrain Pluralism reset', value: '$19.5B special charges Dec 2025 plus a further $15.5B non-cash EV-asset impairment Feb 2026 — Jim Farley reframed the company under what he calls Powertrain Pluralism. Ford Blue for ICE, Ford Model e for battery-electric (profitability moved to 2029), Ford Pro as the commercial profit engine. BlueOval City retooled from F-150 Lightning successor to gas and hybrid trucks; full-size electric truck and commercial van plans cancelled. The product strategy reshuffled; the ~100-yard footprint did not' },
        { label: 'Ford Pro operating reality', value: '$14.7B revenue · 11.4% EBIT margin · 879,000 paid software subscribers. FY2026 Pro EBIT guide $6.5–7.5B — larger than Ford Blue and Ford Model e combined. Super Duty just posted its best sales in twenty years; Transit hit a U.S. sales record. Reallocated Model e capital is flowing to Pro; the trailer flows into dealer, fleet-customer, and upfitter yards touch the same ~100-yard footprint as before' },
        { label: 'BlueOval timing seam', value: 'BlueOval SK (Kentucky JV with SK On) began battery production August 2025 — the only fully-live battery node. BlueOval City battery production now scheduled for 2027, vehicle production roughly a year after. F-150 Lightning Rouge Electric Vehicle Center paused indefinitely after the Novelis aluminum-plant fire in Oswego NY. The cell-inbound flow opened up one campus ahead of the vehicle-assembly side it was scoped to feed' },
        { label: 'Inbound profile during the transition', value: 'JIT to ±30-minute windows at assembly plants; mixed inbound at any given dock now spans ICE-only inputs, hybrid-specific components, and EV-cell/battery-pack flows during the transition window — different staging discipline, same dock infrastructure' },
        { label: 'Existing operating layer', value: 'Yard ops today run on XLS + tribal knowledge + terminal radios + clipboards, with dozens of 3PLs operating to plant-by-plant standards. The site-by-site case is real; the network-level operating layer above the sites is unsolved' },
        { label: 'Lean-manufacturing inheritance', value: 'Ford was the original JIT-at-scale manufacturer in North America — the discipline is deep at the plant level. The yard is the link in the chain where that discipline still lives on radios and tribal habit' },
        { label: 'Ford+ coverage seam', value: 'Ford+ is the standing operating-system frame — Ford Pro carrying the commercial engine, Model e on the restructured EV path, Ford Blue on ICE and hybrid, BlueOval Battery as the cell-supply tier. Four of those tiles run to one corporate strategy. The yard layer above the ~100 sites is the one Ford+ tile that does not yet have a network operating standard' },
      ],
      hypothesis:
        'The Powertrain Pluralism reset is the part of the Ford story that has moved the most and the yard layer is the part that has moved the least. For roughly two years the obvious framing on a yard-operating model at Ford would have been BlueOval City — 3,600 acres, $5.6B campus, designed from scratch — as the cleanest greenfield in the network to land the operating model with no legacy displacement cost. That framing changed shape in December 2025 and again in February 2026. Ford booked $19.5B in special charges, paused F-150 Lightning production at the Rouge Electric Vehicle Center indefinitely after the Novelis aluminum-plant fire, retooled BlueOval City from a Lightning successor to gas and hybrid trucks, then took a further $15.5B non-cash EV-asset impairment as Jim Farley reframed the company around Powertrain Pluralism — Ford Blue for ICE, Ford Model e for battery-electric (profitability moved to 2029), Ford Pro as the commercial profit engine that gets the reallocated EV capital. The product strategy reshuffled. The ~100-yard footprint did not.\n\nFord Pro is the operating reality the reset settled on. $14.7B in revenue, an 11.4% EBIT margin, 879,000 paid software subscribers, and a FY2026 EBIT guide of $6.5–7.5B that keeps Pro larger than Ford Blue and Ford Model e combined. Super Duty just printed its best sales in twenty years; Transit hit a U.S. sales record. That is the part of Ford carrying the network through the transition — and the part whose trailer-into-dealer-yard, trailer-into-fleet-customer, and trailer-into-upfitter flows touch the same ~100-yard footprint the Q4 2025 reshuffle did not change. The Pro-and-Blue-and-Model-e mix at any given assembly dock now spans ICE-only inputs, hybrid-specific components, and EV-cell/battery-pack flows — different staging discipline, same dock infrastructure — and the variance budget per supplier inside that dock shrinks as the input set grows.\n\nThe third piece is the timing seam. BlueOval SK Kentucky began cell production in August 2025; BlueOval City battery production slipped to 2027 with vehicle production roughly a year after — the cell-inbound flow opened up at one campus a full vehicle-cycle ahead of the assembly side it was scoped to feed. Ford was the original JIT-at-scale manufacturer in North America; the discipline is deep at the plant level and runs on ±30-minute trailer windows at the dock. The yard layer between the carrier gate and that dock is the link in the chain where the discipline still lives on radios, clipboards, and tribal habit. The two highest-leverage pilot surfaces are different in kind: a railhead like Chicago Auto Distribution Center that absorbs the highest VIN velocity in the network (where unit-level tracking accuracy is the immediate lever) and a plant yard like Louisville where takt-time sensitivity makes carrier-dwell and yard-truck choreography the lever. Memphis PDC is the third — LTL plus TL inbound clustering is the cleanest non-assembly node to prove door-assignment and load-queue logic. The angle isn\'t "yard automation finally arrives at Ford." It\'s that the operating layer above the sites has to exist before the rest of the network reconfiguration finishes — because the transition window is when the value of standardization is highest, the cost of waiting compounds across every plant that\'s mid-pivot, and the next eighteen months are the window where the most plants are mid-pivot at the same time.',
      pullQuote: 'Ford Pro is the operating reality. The yard layer above the ~100 sites is the one part of the network the reset didn\'t change.',
      caveat:
        'This is built from public Ford disclosures (the December 2025 restructuring announcement, the BlueOval City and BlueOval SK timelines, the Lightning pause), the Liz Door appointment record, and reasonable network inference layered onto an internal yard-network business case we maintain on Ford. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the input-mix complexity at the mid-pivot plants is actually showing up as dock arbitration cost, whether the BlueOval City yard-ops design is being scoped to the new product mix or still to the cancelled one, and how much of the ~100-yard footprint is already on a site-level YMS we should treat as installed coverage rather than greenfield.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Ford+ operating layer',
      artifact: {
        imageSrc: '/artifacts/ford-coverage-map.svg',
        imageAlt: 'Ford+ coverage map. Six tiles representing the Ford+ operating surfaces touched by the post-Q4 2025 Powertrain Pluralism reset. Ford+ Strategy, Ford Pro Commercial, Model e EV, Ford Blue ICE and Hybrid, and BlueOval Battery are covered. The Yard Network Ops tile is unfilled, marked with a Ford blue hairline outline.',
        caption: 'Ford+ operating-layer coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Ford+ strategy, Powertrain Pluralism, Ford Pro, Model e, Ford Blue, and BlueOval Battery disclosures. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by refill returns logistics with reverse-leg yard implications. Primo is also years ahead of the rest of CPG on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Ford operating profile is different in vertical but similar in shape: multi-site, multi-input, multi-node (plant → railhead → PDC → dealer), 3PL-dependent, with mature local routines at each site that don\'t arbitrate across the network. The freight inputs are heavier and more safety-regulated than CPG (battery cells in particular), but if a network operating model lands on water — weight-out-before-cube-out, no-recovery-line margin — the read-across to a transitioning automotive network is the easier lift, not the harder one. Primo is the proof that the network operating layer lands on top of existing site-level yard systems without disrupting the stack underneath — exactly the move Powertrain Pluralism now needs as the input mix at every assembly dock keeps shifting and the cost of plant-by-plant local routine compounds across every site mid-pivot.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The Ford-shaped three-site starter pack the internal business case lands on is Chicago Auto Distribution Center (the high-VIN-velocity railhead — fastest place to prove unit-level tracking and lost-unit reduction), Louisville Assembly Plant (high outbound truck density, takt-time-sensitive, where carrier-dwell and yard-dog choreography land hardest), and Memphis PDC (LTL plus TL inbound clustering — the cleanest non-assembly node to prove door-assignment and load-queue logic). The network operating model makes sense of itself across the rest of the ~100 yards within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'ford-public-network',
          source: 'Ford public disclosures on the U.S. manufacturing and distribution footprint',
          confidence: 'public',
          detail: 'Anchors the assembly-plant network (Rouge MI / Dearborn, Kentucky Truck, Louisville, Kansas City, Wayne MI, Chicago, Ohio Assembly), the 22-PDC parts network, and the ~50 finished-vehicle distribution yards.',
          url: 'https://corporate.ford.com/',
        },
        {
          id: 'ford-q4-2025-restructure',
          source: 'Ford Q4 2025 strategic restructuring announcement (December 15, 2025)',
          confidence: 'public',
          detail: '$19.5B in special charges, Model e profitability target moved to 2029, BlueOval City retooled to gas/hybrid trucks, full-size electric truck and commercial van plans cancelled, F-150 Lightning Rouge production paused. This is the single largest operating-context change for Ford\'s yard network in the analytical window.',
          url: 'https://www.businesswire.com/news/home/20251215095165/en/',
        },
        {
          id: 'ford-blueoval-timelines',
          source: 'BlueOval City and BlueOval SK production-timeline reporting',
          confidence: 'public',
          detail: 'BlueOval SK Kentucky began battery production August 2025; BlueOval City battery production pushed to 2027, vehicle production roughly a year after. Published in The Detroit News and Tennessee Lookout coverage of the timeline shifts.',
          url: 'https://eu.detroitnews.com/story/business/autos/ford/2025/08/19/ford-blueoval-sk-ev-battery-joint-venture-begins-production-kentucky-tennessee-delay-2027/85723349007/',
        },
        {
          id: 'ford-liz-door-appointment',
          source: 'Elizabeth Door — Chief Supply Chain Officer tenure record (effective June 12, 2023)',
          confidence: 'public',
          detail: 'Joined as Ford\'s first Chief Supply Chain Officer in June 2023 after a nine-month executive search — making her tenure in seat ~three years through the Q4 2025 restructuring window. Prior: six years leading global strategic sourcing at Whirlpool; fifteen years at General Motors across global purchasing and supply chain (the GM tenure spans the pre-Mary-Barra and Barra-era purchasing reorganizations). Responsible at Ford for ~$90B in annual purchase value across ~20,000 suppliers. The CSCO seat was created as a Ford+ pillar — the operating-system tile that defines supply chain as a competitive-advantage lever — and named executive sponsor of the Transform: Auto supplier-sustainability program. Three years in seat is exactly long enough to have laid the operating standards across planning, sourcing, and supplier sustainability — and short enough that the yard-layer tile above the ~100 sites is the natural next entry rather than a relitigation of an existing roadmap.',
          url: 'https://www.supplychaindive.com/news/ford-chief-supply-chain-officer-liz-door/652485/',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, detention-cost ranges, and JIT-window adherence. These describe the conditions multi-site automotive manufacturing networks operate under in general, not Ford specifically.',
        },
        {
          id: 'freightroll-ford-business-case',
          source: 'FreightRoll internal Ford business-case model (November 2025)',
          confidence: 'estimated',
          detail: 'Maintains the yard-cost-exposure decomposition across the four yard types (assembly, finished-vehicle distribution, PDC, overflow/3PL), the $90–$130M annual value-capture frame across the three impact levers (yard productivity, dwell-time reduction, unit-level tracking and routing accuracy), and the three-site starter pack (Chicago Railhead, Louisville Assembly, Memphis PDC).',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether the BlueOval City yard-ops design has been re-scoped to the new gas/hybrid product mix or is still on the original Lightning-successor specification',
        'How the F-150 Lightning Rouge pause is reshaping inbound trailer patterns at Dearborn through 2026 — and whether that pressure has already shown up at the gate',
        'How battery-cell inbound flow from BlueOval SK Kentucky into assembly-plant docks is being staged today (segregated lanes, dedicated docks, or co-mingled with traditional inputs)',
        'Which of the ~100 yards are already on a site-level YMS we should treat as installed coverage versus genuine clipboard-and-radio greenfield',
        'How carrier scorecards roll up to Elizabeth Door\'s ~20,000-supplier organization today — and which yards drive the worst detention metrics',
        'How much of the dock-contention pain is concentrated at the two or three plants where the input-mix transition has moved fastest',
        'Where the reallocated Model e capital flowing to Ford Pro lands operationally inside the yard footprint — dealer-feeder yards, fleet-customer yards, upfitter yards, or assembly-plant outbound — and whether any of that flow is already changing trailer arrival patterns at the Pro-heavy sites',
        'How the 20–30 overflow / 3PL-run yards arbitrate against each other today across the dozens of 3PL operating standards, and whether any one 3PL relationship covers enough of the network to anchor a starting protocol',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Ford is distinctive in this round because the question isn\'t whether yard execution matters at an automotive JIT plant (it has since the moving assembly line) — it\'s whether the operating layer above the ~100 yards should be standardized during the transition window, when the rest of the manufacturing strategy is still reshuffling and the cost of waiting compounds across every plant mid-pivot. The Ford+ frame is already on the floor — Ford Pro carrying the commercial engine, Model e on the restructured EV path, Ford Blue on ICE and hybrid, BlueOval Battery as the cell-supply tier. The yard layer above the ~100 sites is the one Ford+ tile that does not yet have a network operating standard. This brief sizes that gap, not the site-level work under it.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Elizabeth — the part most worth pushing back on is whether the operating-system discipline you have laid across planning, sourcing, and supplier sustainability in your three years as CSCO has reached the yard layer yet, or whether it has stopped at the supplier-to-line seam without crossing the gate. That answer reshapes the rest of this. Whether BlueOval City\'s yard-ops design has been re-scoped to the post-Q4-2025 product mix, how the Lightning Rouge pause has propagated through Dearborn inbound, where the Pro-heavy input mix is most visible today at the dock, and how much installed YMS coverage already exists across the assembly and PDC footprint are the next things to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'ford-001',
      name: 'Elizabeth Door',
      firstName: 'Elizabeth',
      lastName: 'Door',
      title: 'Chief Supply Chain Officer, Ford Motor Company',
      company: 'Ford',
      email: 'edoor@ford.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain / Operations',
      currentMandate:
        'First Chief Supply Chain Officer in Ford\'s history (effective June 12, 2023, after a nine-month search). Responsible for ~$90B in annual purchase value across ~20,000 suppliers. The CSCO seat was created as a pillar of the Ford+ plan to make supply chain a competitive advantage. Prior: six years leading global strategic sourcing at Whirlpool; 15 years at General Motors in global purchasing and supply chain. Has publicly framed the supply chain remit as quality, cost reduction, and realizing the full potential of Ford+ — and is the named executive investing in the Transform: Auto supplier-sustainability program.',
      bestIntroPath:
        'Direct outreach to the CSCO office. If delegated, the manufacturing, parts logistics, and finished-vehicle logistics organizations (MP&L, FVL, IE, PDC leadership in the Drive business case shorthand) are the operating tiers that own the yard layer day-to-day. The yard-layer pitch should not be routed through procurement — it is a manufacturing-execution conversation, not a sourcing one.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'ford-001',
        name: 'Elizabeth Door',
        firstName: 'Elizabeth',
        lastName: 'Door',
        title: 'Chief Supply Chain Officer, Ford Motor Company',
        company: 'Ford',
        email: 'edoor@ford.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Elizabeth Door - Chief Supply Chain Officer',
      variantSlug: 'elizabeth-door',

      framingNarrative:
        'Elizabeth, the CSCO seat exists at Ford because supply chain is a competitive-advantage lever — that is the Ford+ premise the role was created to deliver on, and three years in seat is exactly long enough to have laid the operating standards across planning, sourcing, and supplier sustainability. The Powertrain Pluralism reset settled the product strategy into three engines (Ford Blue, Ford Model e, Ford Pro) and reallocated EV capital to the commercial side. The yard layer above the ~100 sites is the one Ford+ tile the reset did not change and the one part of the network where the plant-level JIT discipline still stops translating cleanly into network execution. The next eighteen months are the window where the most plants are mid-pivot at the same time — and that window is when the cost of standardization is lowest.',
      openingHook:
        'Powertrain Pluralism settled the product strategy. The ~100-yard footprint is the part of the network that did not move. The plant-level JIT discipline at Ford is genuine and decades-deep; the yard layer between the carrier gate and the assembly dock is where it still runs on radios, clipboards, and tribal habit. Ford Pro is carrying the commercial engine, the input mix at every assembly dock is mid-pivot, and the operating layer above the sites is the one Ford+ tile not yet running to a network standard.',
      stakeStatement:
        'The internal business case sizes the yard-cost exposure at $110–$155M annually across the four yard types. The three-lever value capture (yard productivity, dwell-time reduction, unit-level tracking and routing accuracy) lands at $90–$130M annual value at a Year 1 investment near $30M. The larger point is the timing one. Ford Pro\'s FY2026 EBIT guide of $6.5–7.5B is the operating reality the reset settled on, and the trailer flows into dealer, fleet-customer, and upfitter yards touch the same ~100-yard footprint the reshuffle did not change. Standardizing the operating layer above the sites during the transition window costs less and yields more than standardizing it after the network reconfiguration settles — because every plant mid-pivot is a plant where the local yard routine is already in motion and can absorb a new standard with less unwind cost than it will in eighteen months.',

      heroOverride: {
        headline: 'The Ford+ tile no one has filled yet is the yard network operating layer.',
        subheadline:
          'Powertrain Pluralism settled the product strategy: Ford Blue for ICE, Ford Model e for battery-electric, Ford Pro as the commercial profit engine carrying $14.7B revenue at 11.4% EBIT. BlueOval SK Kentucky is live; BlueOval City battery production is 2027. The yard layer above the ~100 sites — assembly plants, finished-vehicle yards, PDCs, 3PL overflow — is still on plant-by-plant local routine, and the transition window is when standardizing it costs the least.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer manufacturing-execution framing. Elizabeth Door came into the role in June 2023 from Whirlpool and GM with deep purchasing and supply-chain credentials; the conversation should treat her as the operator she is, not the buyer she manages. Acknowledge the plant-level JIT discipline as the inheritance it is. Position the wedge as the network operating layer above the sites, not as replacement of any installed YMS at the sites. Avoid framing the yard problem as a sourcing or procurement problem — it is a manufacturing-execution problem that intersects her remit because she owns the supplier-to-line seam. The credibility move is naming the Powertrain Pluralism timing precisely — the next eighteen months are the window where the most plants are mid-pivot at the same time.',
      kpiLanguage: [
        'network yard OEE',
        'truck turn time',
        'carrier dwell',
        'railcut compliance',
        'VIN-level tracking accuracy',
        'yard-dog productivity',
        'dock-door arbitration',
        'inbound JIT window adherence',
        'Ford Pro trailer-into-dealer cycle',
        'battery-cell inbound staging discipline',
      ],
      proofEmphasis:
        'Primo is the public comparable — same multi-site, multi-node, multi-input network shape, harder freight (water), already running the network-level operating layer above site-level yard systems. The "headcount-neutral while absorbing more volume" proof shape maps to the Pro-heavy transition pressure the ~100-yard footprint is absorbing right now. The directly-shaped reference (the 237-facility CPG anchor) is available for peer calls when the conversation gets to "who else has done this at our scale."',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable multi-site network operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable network facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'When you are running a just-in-time line, the yard is the last mile you cannot afford to lose. YardFlow gave us that back.',
        role: 'Operations Director',
        company: 'Major Industrial Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '~100 yards across the U.S. footprint (~15 vehicle assembly plant yards; ~50 finished-vehicle distribution yards; 22 Parts Distribution Center yards; 20–30 overflow / 3PL-run yards)',
    facilityTypes: ['Vehicle Assembly Plants', 'Finished-Vehicle Distribution Yards', 'Parts Distribution Centers', 'Overflow / 3PL Yards'],
    geographicSpread:
      'North America (HQ: Dearborn, MI; assembly footprint includes Rouge MI / Dearborn, Kentucky Truck, Louisville KY, Kansas City MO, Wayne MI, Chicago IL, Ohio Assembly; BlueOval City Stanton TN — retooled to gas/hybrid trucks post-Q4 2025; BlueOval SK Glendale KY — battery JV with SK On, live since August 2025)',
    dailyTrailerMoves: 'High-volume — 300–800 inbound trailers per day at major assembly plants alone; finished-vehicle, PDC, and overflow yards add a multiple on top of that',
    fleet: 'Contract carriers + 3PL-operated yard equipment at most sites',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: 'High-volume — distributed across JIT inbound parts to assembly plants, finished-vehicle outbound (rail + truck), PDC LTL/TL mix, and battery-cell inbound from BlueOval SK Kentucky',
    peakSeason: 'Model-year changeover windows and the current transition-window reshuffle drive the largest variance — not a calendar season',
  },

  signals: {
    eventAttendance: 'Automotive Logistics and supply-chain industry conference circuit',
    recentNews: [
      '$19.5B in special charges announced December 15, 2025 — Model e restructured for 2029 profitability; BlueOval City retooled from F-150 Lightning successor to gas-powered and hybrid trucks; full-size electric truck and commercial van plans cancelled.',
      'Additional $15.5B non-cash EV-asset impairment booked February 2026; Jim Farley reframed the company under Powertrain Pluralism (Ford Blue / Ford Model e / Ford Pro) with reallocated EV capital flowing to Pro.',
      'Ford Pro posted $14.7B revenue at 11.4% EBIT margin with 879,000 paid software subscribers; 2026 Pro EBIT guidance $6.5–7.5B — larger than Ford Blue and Ford Model e combined.',
      'BlueOval SK joint venture with SK On began battery production at the Kentucky campus in August 2025.',
      'BlueOval City battery production now scheduled for 2027; vehicle production roughly a year after that.',
      'F-150 Lightning production at the Rouge Electric Vehicle Center paused indefinitely following the Novelis aluminum-plant fire in Oswego NY (late 2025).',
      'Liz Door (ex-GM, ex-Whirlpool) is in her third year as Ford\'s first-ever Chief Supply Chain Officer; the CSCO seat is a Ford+ pillar with ~$90B annual purchase value and ~20,000 suppliers in scope.',
    ],
    supplyChainInitiatives: [
      'Ford+ plan — supply chain as a competitive-advantage lever',
      'Transform: Auto — supplier sustainability and carbon-neutrality program led from the CSCO office',
      'Q4 2025 strategic restructuring — retooling BlueOval City, redeploying the EV-unit plant footprint to gas, hybrid, and battery energy storage',
    ],
    urgencyDriver:
      'The transition window itself is the urgency driver. Standardizing the operating layer above the ~100 yards costs less and yields more during the current network reconfiguration than after it settles — and the next eighteen months are the window where the most plants are mid-pivot and the most local yard routines are already in motion.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Powertrain Pluralism', body: '$19.5B special charges Dec 2025 · $15.5B non-cash impairment Feb 2026 · Model e profitability moved to 2029.' },
    { mark: 'Ford Pro', body: '$14.7B revenue · 11.4% EBIT margin · 879,000 paid software subscribers · FY2026 EBIT guide $6.5–7.5B.' },
    { mark: 'BlueOval timing', body: 'BlueOval SK Kentucky live Aug 2025 · BlueOval City battery 2027 · vehicle production roughly a year after.' },
    { mark: 'Lightning Rouge', body: 'F-150 Lightning paused indefinitely after the Novelis aluminum-plant fire — Dearborn inbound is reshuffling.' },
    { mark: 'CSCO tenure', body: 'Elizabeth Door · CSCO since June 2023 · ~$90B annual purchase value · ~20,000 suppliers · prior Whirlpool 6 yrs · GM 15 yrs.' },
    { mark: 'Ford+ tile', body: 'Ford Pro, Model e, Ford Blue, BlueOval Battery run to one strategy. The yard layer above the ~100 sites is the unfilled tile.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, different freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Elizabeth Door. The Ford+ plan created the Chief Supply Chain Officer seat in 2023 to make supply chain a competitive-advantage lever. The five minutes that follow are about the one Ford+ tile above the ~100 yards that the Powertrain Pluralism reset — $19.5B in special charges, the $15.5B impairment, Ford Pro carrying the network at $14.7B and 11.4% EBIT — did not change.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#003478',
    backgroundVariant: 'dark',
  },
};
