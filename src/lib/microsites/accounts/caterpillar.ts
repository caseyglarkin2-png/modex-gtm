/**
 * Caterpillar — ABM Microsite Data
 * Quality Tier: Tier 2 Band B (Phase 9 A+ uplift)
 *
 * Pitch shape: observational diagnosis of a single, unusually crisp
 * contradiction — Caterpillar is in this moment one of the most aggressive
 * industrial-AI buyers on the planet (Cat Digital + the NVIDIA partnership
 * announced at CES 2026, nearly 700 autonomous haul trucks already in
 * production mining, the Cat AI Assistant running on Jetson Thor at the
 * edge), and at the same time the yards that stage the next D11 dozer for
 * dealer delivery still run on radios and paper logs. Five of the operating
 * tiles Caterpillar already runs to a network standard — Cat Digital, the
 * in-field autonomy stack, the mining-autonomy baseline, the ~160-dealer
 * network, the Morton parts-distribution operation — sit above one tile
 * that does not: Yard Network Ops. The asset in the field got smart
 * before the yard between the factory and the dealer did.
 *
 * Angle: NETWORK-LEVEL YARD OPERATING MODEL on industrial freight — fewer
 * load events per day than CPG, but each event blocks more dock real estate
 * (D11 dozers weigh 5,000–400,000+ lbs and take multiple parking spots per
 * unit), longer setup/breakdown, more customization staging. Built-to-order
 * means yard sequence = customer delivery sequence; variance compounds into
 * delivery-window misses with bigger consequences than a missed grocery
 * delivery. The contradiction the memo turns on is autonomy-in-the-field
 * vs. manual-in-the-yard; the operating layer that would close it is the
 * integrated-logistics function Margaret Poorman runs from Peoria.
 */

import { AUDIO_BRIEF_CHAPTERS, AUDIO_BRIEF_SRC } from '../audio-brief';
import type { AccountMicrositeData } from '../schema';

export const caterpillar: AccountMicrositeData = {
  slug: 'caterpillar',
  accountName: 'Caterpillar',
  coverHeadline: 'The yard between autonomous machines and manual dispatch',
  titleEmphasis: 'between autonomous machines and manual dispatch',
  coverFootprint: '60+ NA plants · ~100 global · ~160 dealers · 197 countries',
  vertical: 'heavy-equipment',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Caterpillar · The yard between autonomous machines and manual dispatch',
  metaDescription:
    'Caterpillar runs 60+ NA manufacturing and parts-distribution facilities (~100 globally), nearly 700 autonomous haul trucks in production mining, and the Cat Digital + NVIDIA in-field autonomy stack unveiled at CES 2026. The yard between the factory and the dealer — the layer the integrated-logistics function holds — is the one operating surface where the same systems thinking has not yet been pushed into a measurable network standard.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Caterpillar network',
      composition: [
        { label: 'U.S. + global footprint', value: '60+ manufacturing and parts-distribution facilities in North America; ~100 manufacturing sites globally across 25 countries when the full footprint is counted. Joe Creed (CEO from May 2025) inherited the operating company; Margaret Poorman runs Integrated Logistics from Peoria.' },
        { label: 'Parts logistics anchor', value: 'Morton IL parts distribution center — 360,000+ part numbers, 24/7 picks, the operating heart of Cat Logistics. The volume baseline against which yard variance is immediately visible on a daily-pick scorecard.' },
        { label: 'Southeast manufacturing node', value: 'Griffin GA plant — Atlanta-area dealer-delivery flow with the regional Southeast freight profile and the dealer-bound built-to-order outbound that makes yard sequence equal customer-delivery sequence.' },
        { label: 'Dealer-delivery network', value: '~160 independent dealers operating thousands of branch locations across 197 countries. Every machine has to land in one of those yards before it lands on a jobsite or in a pit — and each handoff has its own yard SOP that the factory yard does not directly see.' },
        { label: 'Freight profile', value: 'Oversized: D11-class dozers and large mining machines weigh 5,000–400,000+ lbs, take multiple parking spots per unit, flatbed / heavy-haul / low-boy carriers. Per-LOAD-hardest, not per-case-hardest — the dock-arbitration math is fewer events per day but materially more dock real estate, longer staging, customization-sequencing windows per event.' },
        { label: 'Cat Digital + NVIDIA partnership (CES 2026)', value: 'Public unveil January 2026 of an expanded NVIDIA collaboration to drive physical AI and robotics into heavy industry. The Cat AI Assistant runs on NVIDIA Jetson Thor at the edge for real-time inference; NVIDIA Riva + Nemotron speech models handle voice; Qwen3 4B served locally via vLLM interprets and generates with no cloud link required. The platform is the operating scaffold for the next generation of autonomy on Cat construction, mining, and power equipment.' },
        { label: 'In-field autonomy — five machine classes', value: 'At CES 2026 Caterpillar unveiled automated excavators, wheel loaders, haul trucks, dozers, and compactors — operator-free trenching, loading, grading, hauling, and rolling across connected jobsites. The five machine classes are the public proof that AI-grade systems thinking already runs on the asset itself, edge-AI sensor stack (LiDAR + radar + GPS + high-res cameras) on board.' },
        { label: 'Mining-autonomy baseline', value: 'Nearly 700 autonomous Cat haul trucks already operating in production mines; 11+ billion tonnes moved cumulatively. The mining baseline is the credibility flex — Caterpillar is not asking what autonomy means at scale, the company is the operator that runs it.' },
        { label: 'Manual-in-yard contradiction', value: 'The trailer staging at Morton, the dock arbitration at Griffin, the customization sequencing for built-to-order machines headed to dealer yards still run on radios, paper logs, and tribal knowledge that lives in the heads of the spotters who have been on site the longest. Five operating surfaces (Cat Digital, in-field autonomy, mining baseline, dealer network, parts distribution) already run to a network standard. The yard between the factory and the dealer is the one operating surface where the same standard has not yet landed.' },
      ],
      hypothesis:
        'The analytically distinctive thing about Caterpillar right now is that the machines coming off the line are smarter than the yards they roll into. The CES 2026 unveil — five autonomous machine classes (excavators, wheel loaders, haul trucks, dozers, compactors), the Cat AI Assistant running on NVIDIA Jetson Thor at the edge with Riva + Nemotron + Qwen3 4B handling speech and reasoning locally, nearly 700 autonomous haul trucks already operating in production mines moving 11+ billion tonnes — is real industrial AI, and it lives downstream of an assembly line that has been continuously modernized for decades. Five of the operating surfaces Caterpillar already runs to a network standard — Cat Digital as the platform, in-field autonomy as the application, the mining baseline as the credibility flex, the ~160-dealer network as the distribution channel, the Morton parts-distribution operation as the spare-parts lifeblood — sit above one operating surface that does not. The asset in the field has been digitized. The yard between the factory and the dealer has not. Trailer staging at Morton, dock arbitration at Griffin, customization sequencing for the D11 dozer headed to a Western mining dealer — those still run on radios, paper logs, and tribal knowledge that lives in the heads of the spotters who have been on site the longest.\n\nThat gap matters in heavy equipment in a way it does not matter in CPG, and the operating arithmetic is what makes the contradiction expensive rather than merely visible. A typical grocery trailer is one truck, one cube, one dock door, and the recovery margin on a missed delivery is a re-route inside an existing route plan. A D11 dozer takes multiple parking spots per unit, requires specialized flatbed or low-boy equipment, often arrives with customer-specific customization staged in the yard before dealer handoff, and books a dock for materially longer than a CPG drop-hook. The dock-arbitration math is different in kind — fewer load events per day, materially more dock real estate per event, longer setup and breakdown, more staging area committed to one unit. And because most Cat machines are built to order, the yard sequence *is* the customer-delivery sequence: a reshuffle at Morton or Griffin does not just delay a trailer, it slips a dealer commitment and, one step further, the construction-site or mine-site delivery that dealer made to their own customer. Variance at the yard compounds outward through the ~160-dealer network in a way that variance at a CPG yard does not, and across 197 countries it compounds asymmetrically — every dealer organization runs its own receiving yard on its own protocol.\n\nThe third thing is the systems-thinking asymmetry itself, and it is the one that gives this analysis its shape. The Cat Digital + NVIDIA stack is the public proof that Caterpillar can run AI-grade systems thinking on the asset — five autonomous machine classes, a fleet of AI agents, an edge-AI sensor stack, an in-cab assistant doing real-time inference on a Jetson Thor with no cloud link required. Five of the five operating tiles already run to that systems standard. The one operating surface where the same systems thinking has not yet been pushed into a measurable network standard is the yard — the gate-to-dock layer between Morton + Griffin and the dealer that arbitrates between built-to-order customization windows, parts-LTL outbound, and oversized finished-machine staging inside the same gate fleet. The integrated-logistics function Margaret Poorman has run inside Caterpillar for the better part of three decades — Morton, the dealer-and-customer-delivery network, the supplier integration that the CEVA Supplier of the Year for Integrated Logistics award called out in September 2025 — is the function that sees this asymmetry first. The yard-layer network operating standard is the kind of operating discipline an integrated-logistics function in this posture gets to author, not one it inherits from the asset-side autonomy program.',
      pullQuote: 'The machines coming off the line are smarter than the yards they roll into.',
      caveat:
        'This is built from public Caterpillar disclosures, the CES 2026 NVIDIA-partnership announcements, the publicly visible Morton + Griffin operations, the CEVA Logistics Supplier of the Year for Integrated Logistics recognition (September 2025), Margaret Poorman\'s public tenure record at Caterpillar, and reasonable network inference. We may be wrong about parts of the picture above — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how much yard-tech is already in place at Morton versus the manufacturing plants like Griffin GA, Decatur IL, and the Lafayette IN engine plant; where the autonomous-asset program has (or has not) crossed into yard operations on the factory side; whether the Cat AI Assistant\'s inference scope has been extended over gate-and-dock event data at any of the sites; and how dealer-handoff yard SOPs actually vary across the ~160 dealer organizations.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating tiles',
      artifact: {
        imageSrc: '/artifacts/caterpillar-coverage-map.svg',
        imageAlt: 'Caterpillar autonomy and network coverage map. Six tiles representing the operating layers Caterpillar already runs at network scale. Cat Digital, In-Field Autonomy, Mining Baseline, Dealer Network, and Parts Distribution are covered. The Yard Network Ops tile is unfilled, marked with a Cat yellow hairline outline.',
        caption: 'Autonomy + network coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Cat Digital + NVIDIA CES 2026 disclosures, the autonomous mining baseline (~700 trucks · 11B+ tonnes), and the publicly disclosed dealer + parts-distribution footprint. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water maxes gross vehicle weight before it maxes cube, it is low-margin (so every minute of yard waste is a margin point unrecoverable with price), and it is shipped across multi-temp lanes with refillable return logistics. Primo is also years ahead of every other CPG category on yard automation and network-level digitization — they had to be, because the category cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and regional DCs, and they have layered a network-level yard operating model on top of their site-level yard systems. The read-across to Caterpillar is the inverse of the usual comparable framing: Primo\'s freight is hardest *per case*, Caterpillar\'s freight is hardest *per load*. The dock-arbitration logic is shaped differently — fewer load events for Caterpillar, more dock real estate per event, longer staging windows, customization sequencing — but the operating model is the same shape: one protocol across every yard in the network, one sequencing logic at the dock, one source of truth for trailer location and dwell. If the operating model works on the per-case-hardest freight in CPG, the read-across to per-LOAD-hardest freight in heavy equipment is the harder version of the same problem, not a different problem. The translation that matters at Caterpillar is at the seam where autonomy meets dispatch: Primo is the public proof that a network operating layer slots cleanly above mature site-level systems without contesting the operating logic of the asset doing the work, which is exactly the entry condition a yard-layer standard at Caterpillar must meet to ratify next to the Cat Digital + NVIDIA in-field autonomy program rather than relitigate it. The directly-shaped reference for Caterpillar — a Tier-1 CPG anchor running this operating model across 237 facilities on a multi-year, contracted term — is available for peer call if it becomes useful.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at Caterpillar are different in kind: (1) Morton IL parts distribution, because the 360,000-part 24/7 volume makes yard variance immediately visible against a daily-pick baseline and the operating-model improvement is measurable inside one quarter; (2) Griffin GA as a single-plant pilot, because the dealer-delivery flow on built-to-order machines is the cleanest place to see whether yard sequencing actually changes delivery-window adherence. We would expect the network to make sense of itself within two to four quarters once the pilot reads as expected.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'cat-10k',
          source: 'Caterpillar Inc. 10-K and investor disclosures',
          confidence: 'public',
          detail: 'Anchors the manufacturing footprint (100+ plants across 25 countries), the ~160 independent dealer organizations operating thousands of branches across 197 countries, and the Q1 2026 sales/backlog posture ($17.4B revenue, record backlog).',
          url: 'https://investors.caterpillar.com/',
        },
        {
          id: 'cat-ces-2026',
          source: 'Caterpillar / NVIDIA CES 2026 autonomy announcements',
          confidence: 'public',
          detail: 'Public unveil of the next era of autonomy in construction (Jan 2026): five autonomous machine classes (excavators, loaders, haul trucks, dozers, compactors), Cat AI Assistant on a fleet of AI agents, edge-AI sensor stack (LiDAR + radar + GPS + high-res cameras). Mining baseline: nearly 700 autonomous Cat haul trucks operating, 11+ billion tonnes moved.',
          url: 'https://www.caterpillar.com/en/news/corporate-press-releases/h/next-era-autonomy.html',
        },
        {
          id: 'cat-morton',
          source: 'Caterpillar Morton IL parts distribution operations',
          confidence: 'public',
          detail: 'Morton is the operating heart of Cat Logistics — the 360,000-part 24/7 distribution center serving the global dealer network. Public facility profile and Cat Logistics operating disclosures anchor the volume and shift cadence.',
        },
        {
          id: 'ceva-supplier-recognition',
          source: 'CEVA Logistics — Caterpillar Supplier of the Year for Integrated Logistics (Sep 2025)',
          confidence: 'public',
          detail: 'Caterpillar Supplier Excellence Recognition event in Grapevine, TX awarded CEVA the Integrated Logistics Supplier of the Year (selection based on performance June 2024 through May 2025) and recognized CEVA for Air Freight Supplier Excellence. Margaret Poorman, VP Integrated Logistics, represented the function at the event. Useful as a public signal that the integrated-logistics function is operationally active, externally engaged, and managing a measured supplier scorecard.',
          url: 'https://www.cevalogistics.com/en/news-and-media/newsroom/press-release/ceva-wins-supplier-of-the-year-for-integrated-logistics-from-caterpillar',
        },
        {
          id: 'poorman-tenure',
          source: 'Margaret Poorman — public tenure record',
          confidence: 'public',
          detail: 'Vice President, Integrated Logistics at Caterpillar Inc., based in Peoria IL. Public career record shows the VP Integrated Logistics role held within the Building Construction Products Division from 2022; prior roles at Caterpillar include Director — Global Transportation (2019–2022) and Global Procurement Manager — Excavation (2016–2019). MBA in Logistics from Penn State (1991–1993). The tenure pattern reads as a roughly three-decade Caterpillar career across procurement, transportation, and integrated logistics — the operating function that runs Cat Logistics (Morton IL) and the dealer-and-customer delivery network.',
          url: 'https://rocketreach.co/margaret-poorman-email_371757055',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks (industrial-freight cuts)',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges, with the heavy-haul / oversized-freight cuts where they exist. These describe the conditions most heavy-equipment networks operate under, not Caterpillar specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'How much yard-tech is already in place at Morton — site-level YMS, dock scheduling, gate automation — versus at the manufacturing plants like Griffin GA, Decatur IL, and the Lafayette IN engine plant',
        'Whether any of the autonomous-asset program (Cat Digital, the NVIDIA stack) has touched yard operations at the factory side today, or whether it lives entirely on the in-field machine and the in-cab assistant — i.e., where the Jetson Thor edge-inference scope stops relative to the gate',
        'Whether the Cat AI Assistant\'s inference scope has been extended over gate-and-dock event data at any of the sites in the network, or whether yard-event data terminates at site-level dispatch and never reaches the network-level scorecard the way machine-telemetry data does',
        'How dealer-handoff yard SOPs actually vary across the ~160 dealer organizations — and which dealer relationships drive the most yard-induced delivery-window slips',
        'How customization staging for built-to-order machines is sequenced today — in yard, in plant, or in a dedicated staging area between the two',
        'Where the largest sustained dock-contention pressure shows up in the network — Morton parts inbound, Morton parts outbound, plant inbound (steel + components), or plant outbound (finished machines to dealer)',
        'How carrier scorecards on detention and dwell are reported into the integrated-logistics function under Margaret Poorman, and which lanes drive the worst metrics',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Caterpillar is distinctive in this round because the contradiction is unusually crisp: the company is at this moment one of the most aggressive industrial-AI buyers on the planet (the CES 2026 NVIDIA partnership, the Cat AI Assistant on Jetson Thor at the edge, five autonomous machine classes, nearly 700 autonomous haul trucks already in production mining are the public proof) and at the same time the yards that stage the next D11 dozer for dealer delivery still run on radios. The asset in the field got smart before the yard between the factory and the dealer did. That is not a Caterpillar-specific failure — it is the default state of every heavy-equipment network we have looked at — but the gap is more expensive at Caterpillar than anywhere else in the category because the dealer commitment downstream of the yard is bigger and the recovery margin on a slipped delivery is thinner. The integrated-logistics function Margaret Poorman has run for the better part of three decades is the part of the company that sees that asymmetry first; her September 2025 representation of the function at the Caterpillar Supplier Excellence Recognition event (where CEVA was named Supplier of the Year for Integrated Logistics on a measured June 2024 – May 2025 scorecard) is the public signal that the function is operationally active and externally engaged on the same supplier-and-network discipline the yard-layer standard would sit inside.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Margaret — the part most worth pushing back on is whether the autonomous-asset program (Cat Digital, the NVIDIA stack, the Cat AI Assistant) has already crossed into yard operations at the factory side in a way the public record does not show, and whether the Jetson Thor edge-inference scope has been extended over gate-and-dock event data at any of the sites in the network or whether it stops at the in-cab assistant today. Those two answers reshape the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting — and ideally one that lands while the CES 2026 unveil is still the operating-context the network is reading itself against.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'caterpillar-001',
      name: 'Margaret Poorman',
      firstName: 'Margaret',
      lastName: 'Poorman',
      title: 'VP Integrated Logistics',
      company: 'Caterpillar',
      email: 'poorman_margaret_s@cat.com',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Operations',
      currentMandate:
        '~30-year Caterpillar career across procurement, transportation, and integrated logistics; Penn State MBA in Logistics (1991–1993). Public role timeline: Global Procurement Manager — Excavation (2016–2019), Director — Global Transportation (2019–2022), VP — Integrated Logistics within Building Construction Products (2022–). Owns the integrated-logistics function — the operating layer that runs Cat Logistics (Morton IL) and the dealer/customer delivery network. Publicly visible recently as the executive representing Caterpillar\'s Supplier of the Year for Integrated Logistics recognition (CEVA, Sep 2025; measured June 2024 – May 2025 scorecard).',
      knownForPhrase: 'specializes in integrating the dealer/customer delivery network',
      bestIntroPath: 'Direct outreach to the VP Integrated Logistics office; if delegated, the operating directors at Morton (parts distribution) and the regional plant logistics leads.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'caterpillar-001',
        name: 'Margaret Poorman',
        firstName: 'Margaret',
        lastName: 'Poorman',
        title: 'VP Integrated Logistics',
        company: 'Caterpillar',
        email: 'poorman_margaret_s@cat.com',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Margaret Poorman - VP Integrated Logistics',
      variantSlug: 'margaret-poorman',

      framingNarrative:
        'Margaret, the integrated-logistics function you have run for the better part of three decades at Caterpillar — Global Procurement on the Excavation side, Global Transportation as Director, the Integrated Logistics VP role inside Building Construction Products, the Morton operation, the dealer-and-customer delivery network, the supplier integration the CEVA Supplier of the Year award called out on its September 2025 scorecard — is the part of Caterpillar that sees the autonomy-meets-manual asymmetry first. The CES 2026 unveil is real industrial AI: Cat AI Assistant on Jetson Thor at the edge, five autonomous machine classes (excavators, wheel loaders, haul trucks, dozers, compactors), the mining baseline at nearly 700 autonomous haul trucks moving 11+ billion tonnes. And the machine still has to be staged in a yard, picked up by a flatbed, and handed to one of ~160 dealers running their own yards on their own protocols across 197 countries. Five of the five operating tiles already run to an AI-grade network standard — Cat Digital, in-field autonomy, mining baseline, dealer network, parts distribution. The yard between the factory and the dealer is the one operating surface where the same systems thinking has not yet been pushed into a measurable network standard, and the integrated-logistics function is the natural author of the standard that would close it.',
      openingHook:
        'The machines are smarter than the yards they roll into. CES 2026 is real, Cat AI Assistant on Jetson Thor is real, nearly 700 autonomous haul trucks at 11+ billion tonnes moved is real — and the trailer staging at Morton is still run on radios. That asymmetry is an integrated-logistics question before it is anything else.',
      stakeStatement:
        'Every built-to-order machine is a dealer commitment downstream of the yard. When yard sequence slips, dealer-delivery slips, and the construction-site or mine-site delivery the dealer committed to slips with it. Per-load freight economics mean fewer events per day than CPG — but each event blocks more dock real estate, stages more customization, and the recovery margin on a missed delivery window is thinner than anywhere in CPG. The autonomy program already proves Caterpillar can run AI-grade systems thinking on the asset; the yard layer is where the integrated-logistics function ratifies the same systems thinking into the network operating standard that scales with throughput rather than gets squeezed by it.',

      heroOverride: {
        headline: 'The asset in the field got smart. The yard between the factory and the dealer did not.',
        subheadline:
          'Cat Digital, the CES 2026 NVIDIA partnership, the Cat AI Assistant on Jetson Thor, five autonomous machine classes, nearly 700 autonomous haul trucks in production mining — five operating tiles already run to a network standard. Morton parts distribution, Griffin GA dealer-flow, the customization staging that turns a built-to-order D11 into a delivered machine still run on radios and tribal knowledge. The yard layer above the sites is the unfilled tile.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Margaret is a ~30-year Caterpillar veteran with an MBA in Logistics from Penn State and a public mandate around dealer-and-customer delivery integration; she presented the integrated-logistics function on stage at the September 2025 CEVA Supplier of the Year recognition, which is a measured scorecard against a 12-month performance window, not a ceremonial award. She doesn\'t need a glossary, doesn\'t want a pitch, and will recognize the difference between vendor-claim register and observational diagnosis on first read. Lead with the autonomous-asset-vs-manual-yard contradiction as a systems-thinking asymmetry, not as a vendor wedge — the asset side is already an AI-grade network standard, the yard side is the one operating surface where the same discipline has not yet landed. Acknowledge the Cat Digital + NVIDIA program as the credibility flex it is. Treat integrated-logistics-authored standards (Morton, dealer-handoff SOPs, supplier scorecards) as the operating context the yard layer ratifies into.',
      kpiLanguage: [
        'network dock-arbitration',
        'trailer dwell at Morton',
        'dock-to-dealer cycle time',
        'customization staging duration',
        'dealer-delivery window adherence',
        'integrated-logistics supplier scorecard',
        'detention cost on heavy-haul lanes',
        'spotter dispatch latency',
        'gate-to-flatbed cycle',
        'autonomy-program inference scope at the gate',
        'network operating standard ratification',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. Frame the translation explicitly: Primo is the public proof that the operating layer slots cleanly above mature site-level systems without contesting the operating logic of the asset doing the work, which is the entry condition a yard-layer standard at Caterpillar must meet to ratify next to the Cat Digital + NVIDIA in-field autonomy program rather than relitigate it. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful in the conversation.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable network operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'When you are running a built-to-order line, the yard is where the customer commitment gets made or missed. We needed one protocol across every site, not 60 versions of the same workaround.',
        role: 'Operations Director',
        company: 'Major Industrial Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '60+ manufacturing and parts-distribution facilities (U.S. + global manufacturing footprint exceeds 100 plants across 25 countries)',
    facilityTypes: ['Manufacturing Plants', 'Parts Distribution Centers', 'Dealer-Delivery Staging'],
    geographicSpread: 'Global — U.S. manufacturing anchors include Morton IL (parts), Griffin GA, Decatur IL, Lafayette IN, East Peoria IL; dealer network spans ~160 independent dealer organizations operating thousands of branch locations across 197 countries',
    dailyTrailerMoves: '1,000+ across the network — heavy on oversized / flatbed / low-boy on the finished-machine side, high-frequency parts LTL out of Morton',
    fleet: 'Specialized carriers — flatbed, heavy-haul, low-boy on finished machines; high-frequency truckload and LTL on parts',
  },

  freight: {
    primaryModes: ['Flatbed / Heavy-Haul', 'Specialized / Low-Boy', 'Truckload', 'Parts LTL'],
    avgLoadsPerDay: '1,000+ across the network — fewer load events per day than CPG, but materially more dock real estate per event',
  },

  signals: {
    eventAttendance: 'Recurring industry-conference attendee',
    recentNews: [
      'CES 2026 (January) — Caterpillar and NVIDIA expand collaboration on physical AI and robotics for heavy industry. Five autonomous machine classes unveiled (automated excavators, wheel loaders, haul trucks, dozers, compactors); Cat AI Assistant on NVIDIA Jetson Thor at the edge with Riva + Nemotron + Qwen3 4B handling local speech and reasoning.',
      'Q1 2026 — sales and revenues ~$17.4B with a record backlog; strong order activity across business segments. Joe Creed in his first full operating year as CEO (effective May 2025).',
      'September 2025 — CEVA Logistics named Caterpillar Supplier of the Year for Integrated Logistics at the Caterpillar Supplier Excellence Recognition event in Grapevine, TX (selection based on the June 2024 – May 2025 performance scorecard). Margaret Poorman, VP Integrated Logistics, represented the function on stage.',
      'Continuing investment in Cat Digital — autonomous mining fleet has now moved 11+ billion tonnes cumulatively with nearly 700 autonomous Cat haul trucks in production operation.',
    ],
    supplyChainInitiatives: [
      'Cat Digital + NVIDIA in-field autonomy program (CES 2026 unveil) is the public industrial-AI initiative — five autonomous machine classes, Cat AI Assistant on Jetson Thor at the edge with Riva + Nemotron + Qwen3 4B handling speech and local inference. The asset-side network operating standard is in production.',
      'Mining-autonomy baseline — nearly 700 autonomous Cat haul trucks in production at customer mines, 11+ billion tonnes moved cumulatively — is the credibility flex behind the construction-side autonomy program.',
      'Integrated-logistics function under Margaret Poorman runs Cat Logistics (Morton IL, 360,000+ part numbers, 24/7) and the dealer-and-customer delivery network. CEVA Supplier of the Year for Integrated Logistics recognition (Sep 2025, June 2024 – May 2025 scorecard) is the public signal that the function operates against measured supplier discipline.',
      'The yard layer between the factory and the dealer — Morton parts staging, Griffin GA outbound, customization sequencing for built-to-order machines, dealer-handoff yard SOPs across ~160 dealer organizations in 197 countries — is the operating surface where the same systems thinking has not yet been pushed into a measurable network standard.',
    ],
    urgencyDriver:
      'The Cat Digital + NVIDIA program is the public proof that Caterpillar can run AI-grade systems thinking on the asset — five autonomous machine classes, an in-cab AI assistant doing real-time inference on Jetson Thor with no cloud link required, a mining baseline at nearly 700 autonomous haul trucks. The yard operating layer above the sites — Morton parts, Griffin and the other plants, customization staging for built-to-order machines, dealer handoff — is the one operating surface where the same systems thinking has not yet been applied. The contradiction is unusually visible right now, and the integrated-logistics function under Margaret Poorman is the natural author of the network operating standard that would close it.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'In-field autonomy', body: 'CES 2026 · Cat Digital + NVIDIA · five autonomous machine classes (excavators · wheel loaders · haul trucks · dozers · compactors) · Cat AI Assistant on Jetson Thor at the edge · Riva + Nemotron + Qwen3 4B local inference.' },
    { mark: 'Mining baseline', body: 'Nearly 700 autonomous Cat haul trucks in production · 11+ billion tonnes moved cumulatively. The credibility flex behind the construction-side program.' },
    { mark: 'Manufacturing footprint', body: '60+ NA plants · ~100 globally across 25 countries · Morton IL parts hub (360,000+ part numbers, 24/7) · Griffin GA dealer-flow.' },
    { mark: 'Dealer network', body: '~160 independent dealer organizations · thousands of branches · 197 countries. Every machine lands in a dealer yard before it reaches the jobsite.' },
    { mark: 'Freight profile', body: 'D11-class dozers 5,000–400,000+ lbs · multiple parking spots per unit · per-LOAD-hardest, not per-case-hardest.' },
    { mark: 'Integrated-logistics signal', body: 'CEVA Supplier of the Year for Integrated Logistics, Sep 2025 · measured June 2024 – May 2025 scorecard · Margaret Poorman represented the function on stage.' },
    { mark: 'Coverage map', body: 'Six operating tiles · five covered (Cat Digital, In-Field Autonomy, Mining Baseline, Dealer Network, Parts Distribution) · one unfilled (Yard Network Ops).' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · per-case-hardest CPG comparable, per-LOAD-hardest is the read-across.' },
  ],

  audioBrief: {
    src: AUDIO_BRIEF_SRC,
    intro:
      'This brief is for Margaret. The integrated-logistics function you have run for the better part of three decades at Caterpillar — Global Procurement on Excavation, Global Transportation as Director, Integrated Logistics as VP inside Building Construction Products, Morton, the dealer-and-customer delivery network, the supplier integration the September 2025 CEVA Supplier of the Year recognition called out on its measured 12-month scorecard — is the part of Caterpillar that sees the autonomy-meets-manual asymmetry first. The five minutes that follow are about the one operating tile the CES 2026 program has not yet reached: the yard layer above the sites where the same systems thinking would ratify into a network operating standard.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#FFCD11',
    backgroundVariant: 'dark',
  },
};
