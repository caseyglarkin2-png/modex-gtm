/**
 * Caterpillar — ABM Microsite Data
 * Quality Tier: A (Tier 2 Band B, heavy-equipment vertical)
 *
 * Pitch shape: observational diagnosis — the gap between autonomous machines
 * in the field (Cat Digital + the NVIDIA partnership announced at CES 2026)
 * and manual yards between the factory and the dealer. The yard between
 * build and dealer delivery is the unsolved seam.
 *
 * Angle: NETWORK-LEVEL YARD OPERATING MODEL on industrial freight — fewer
 * load events per day than CPG, but each event blocks more dock real estate
 * (D11 dozers weigh 5,000–400,000+ lbs and take multiple parking spots per
 * unit), longer setup/breakdown, more customization staging. Built-to-order
 * means yard sequence = customer delivery sequence; variance compounds into
 * delivery-window misses with bigger consequences than a missed grocery
 * delivery.
 */

import { AUDIO_BRIEF_CHAPTERS, AUDIO_BRIEF_SRC } from '../audio-brief';
import type { AccountMicrositeData } from '../schema';

export const caterpillar: AccountMicrositeData = {
  slug: 'caterpillar',
  accountName: 'Caterpillar',
  coverHeadline: 'The yard between autonomous machines and manual dispatch',
  titleEmphasis: 'between autonomous machines and manual dispatch',
  coverFootprint: '60+ NA plants · 100 global',
  vertical: 'heavy-equipment',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Caterpillar · The gap between autonomous machines and manual yards',
  metaDescription:
    'Caterpillar operates 60+ manufacturing and parts-distribution facilities. The autonomous machines in the field run on JIT principles. The yards between the factory and the dealer still operate on paper logs and radio dispatch.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Caterpillar network',
      composition: [
        { label: 'U.S. + global footprint', value: '60+ manufacturing and parts-distribution facilities; 100+ manufacturing sites globally across 25 countries when the full footprint is counted' },
        { label: 'Parts logistics anchor', value: 'Morton IL parts distribution center — 360,000+ part numbers, 24/7 picks, the operating heart of Cat Logistics' },
        { label: 'Southeast manufacturing node', value: 'Griffin GA plant — Atlanta-area dealer-delivery flow with the regional Southeast freight profile' },
        { label: 'Dealer-delivery network', value: '~160 independent dealers operating thousands of branch locations across 197 countries — every machine has to land in one of those yards' },
        { label: 'Freight profile', value: 'Oversized: D11-class dozers and large mining machines weigh 5,000–400,000+ lbs, take multiple parking spots per unit, flatbed / heavy-haul / low-boy carriers' },
        { label: 'In-field automation posture', value: 'Cat Digital + NVIDIA partnership announced CES 2026 — AI assistant, five autonomous construction machines (excavators, loaders, haul trucks, dozers, compactors); nearly 700 autonomous mining trucks already in operation' },
      ],
      hypothesis:
        'The interesting thing about Caterpillar\'s yard math is that the machines coming off the line are now smarter than the yards they roll into. The CES 2026 unveil — five autonomous machine classes (excavators, loaders, haul trucks, dozers, compactors), the Cat AI Assistant running on NVIDIA Jetson Thor at the edge, nearly 700 autonomous haul trucks already in production mines — is a real industrial-AI program, and it lives downstream of an assembly line that has been continuously modernized for decades. The asset in the field has been digitized. The yard between the factory and the dealer has not. Trailer staging at Morton, dock arbitration at Griffin, yard sequencing for built-to-order machines headed to dealer yards — those still run on radios, paper logs, and tribal knowledge that lives in the heads of the spotters who have been on site the longest.\n\nThat gap matters in heavy equipment in a way it does not matter in CPG. A typical grocery trailer is one truck, one cube, one dock door. A D11 dozer takes multiple parking spots per unit, requires specialized flatbed or low-boy equipment, often arrives with customer-specific customization staged in the yard before dealer handoff, and books a dock for materially longer than a CPG drop-hook. The dock-arbitration math is different in kind: fewer load events per day, but each event blocks more dock real estate, longer setup and breakdown, more staging area committed to one unit. And because most Cat machines are built to order, the yard sequence *is* the customer-delivery sequence — a reshuffle at Morton or Griffin doesn\'t just delay a trailer, it slips a dealer commitment and, one step further, the construction-site or mine-site delivery that dealer made to their customer. Variance at the yard compounds outward through the dealer network in a way that variance at a CPG yard does not. The CPG playbook for yard digitization translates here, but the dock-arbitration logic has to be rebuilt for per-LOAD-hardest freight rather than per-case-hardest freight.',
      pullQuote: 'The machines coming off the line are smarter than the yards they roll into.',
      caveat:
        'This is built from public Caterpillar disclosures, the CES 2026 autonomy announcements, the publicly visible Morton + Griffin operations, the CEVA Logistics supplier-of-the-year recognition for integrated logistics (Sep 2025), and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how much yard-tech is already in place at Morton versus the manufacturing plants, where the autonomous-asset program has touched yard operations (if anywhere), and how dealer-handoff SOPs vary across the ~160 dealer organizations.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water maxes gross vehicle weight before it maxes cube, it is low-margin (so every minute of yard waste is a margin point unrecoverable with price), and it is shipped across multi-temp lanes with refillable return logistics. Primo is also years ahead of every other CPG category on yard automation and network-level digitization — they had to be, because the category cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and regional DCs, and they have layered a network-level yard operating model on top of their site-level yard systems. The read-across to Caterpillar is the inverse of the usual comparable framing: Primo\'s freight is hardest *per case*, Caterpillar\'s freight is hardest *per load*. The dock-arbitration logic is shaped differently — fewer load events for Caterpillar, more dock real estate per event, longer staging windows, customization sequencing — but the operating model is the same shape: one protocol across every yard in the network, one sequencing logic at the dock, one source of truth for trailer location and dwell. If the operating model works on the per-case-hardest freight in CPG, the read-across to per-LOAD-hardest freight in heavy equipment is the harder version of the same problem, not a different problem. The directly-shaped reference for Caterpillar — a Tier-1 CPG anchor running this operating model across 237 facilities on a multi-year, contracted term — is available for peer call if it becomes useful.',
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
          detail: 'Caterpillar Supplier Excellence Recognition event in Grapevine, TX awarded CEVA the Integrated Logistics Supplier of the Year. The award was presented in part by Margaret Poorman, VP Integrated Logistics. Useful as a public signal that the integrated-logistics function is operationally active and externally engaged.',
          url: 'https://www.cevalogistics.com/en/news-and-media/newsroom/press-release/ceva-wins-supplier-of-the-year-for-integrated-logistics-from-caterpillar',
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
        'Whether any of the autonomous-asset program (Cat Digital, the NVIDIA stack) has touched yard operations at the factory side, or whether it lives entirely in the in-field machine',
        'How dealer-handoff yard SOPs actually vary across the ~160 dealer organizations — and which dealer relationships drive the most yard-induced delivery-window slips',
        'How customization staging for built-to-order machines is sequenced today — in yard, in plant, or in a dedicated staging area between the two',
        'Where the largest sustained dock-contention pressure shows up in the network — Morton parts inbound, Morton parts outbound, plant inbound (steel + components), or plant outbound (finished machines to dealer)',
        'How carrier scorecards on detention and dwell are reported into the integrated-logistics function, and which lanes drive the worst metrics',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Caterpillar is distinctive in this round because the contradiction is unusually crisp: the company is, at this moment, one of the most aggressive industrial-AI buyers on the planet (the CES 2026 NVIDIA partnership and the autonomous-machine fleet are the public proof), and at the same time the yards that stage the next D11 dozer for dealer delivery still run on radios. The asset in the field got smart before the yard between the factory and the dealer did. That is not a Caterpillar-specific failure — it is the default state of every heavy-equipment network we have looked at — but the gap is more expensive at Caterpillar than anywhere else in the category because the dealer commitment downstream of the yard is bigger and the recovery margin on a slipped delivery is thinner.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally — particularly the share of yard work that already runs on site-level YMS at Morton, the share that still runs on radios at the plants, and where the autonomous-asset program has (or has not) crossed into yard operations — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
        '~28-year Caterpillar veteran. Owns the integrated-logistics function — the operating layer that runs Cat Logistics (Morton IL) and the dealer/customer delivery network. Publicly visible recently as the executive presenting Caterpillar\'s Supplier of the Year for Integrated Logistics award (CEVA, Sep 2025).',
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
        'Margaret, the integrated-logistics function you have run for the better part of three decades at Caterpillar — Morton, the dealer-delivery network, the supplier integration that the CEVA award called out last fall — is the part of the company that sees the contradiction first. The CES 2026 autonomy unveil is real industrial AI, and it lives inside a machine that still has to be staged in a yard, picked up by a flatbed, and handed to one of ~160 dealers running their own yards on their own protocols. The asset is smart. The yard between the factory and the dealer is not. That gap is the integrated-logistics gap.',
      openingHook:
        'The machines are now smarter than the yards they roll into. The CES unveil is real, the in-field autonomy is real, and the trailer staging at Morton is still being run on radios. That is an integrated-logistics question before it is anything else.',
      stakeStatement:
        'Every built-to-order machine is a dealer commitment downstream of the yard. When yard sequence slips, dealer-delivery slips, and the construction-site or mine-site delivery the dealer committed to slips with it. Per-load freight economics mean fewer events per day than CPG — but each event blocks more dock and stages more customization, and the recovery margin on a missed delivery window is thinner than anywhere in CPG.',

      heroOverride: {
        headline: 'The asset in the field got smart. The yard between the factory and the dealer did not.',
        subheadline:
          'Cat Digital and the CES 2026 autonomy program have digitized the machine. Morton parts distribution, Griffin GA dealer-flow, the customization staging that turns a built-to-order D11 into a delivered machine — those still run on radios and tribal knowledge. The network operating layer above the sites is the unfilled tile.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator. Margaret is a 28-year Cat veteran with an MBA in Logistics from Penn State and a public mandate around dealer/customer delivery integration. She doesn\'t need a glossary, doesn\'t want a pitch, and will recognize the difference between vendor-claim register and observational diagnosis on first read. Lead with the autonomous-vs-manual-yard contradiction; let her decide what to do with it.',
      kpiLanguage: [
        'network dock-arbitration',
        'trailer dwell at Morton',
        'dock-to-dealer cycle time',
        'customization staging duration',
        'dealer-delivery window adherence',
        'detention cost on heavy-haul lanes',
        'spotter dispatch latency',
        'gate-to-flatbed cycle',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful in the conversation.',
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
      'CES 2026 — Caterpillar unveils next era of autonomy in construction: five autonomous machine classes, Cat AI Assistant, NVIDIA partnership for edge-AI and physical-AI on the jobsite.',
      'Q1 2026 — sales and revenues $17.4B with a record backlog; strong order activity across business segments.',
      'September 2025 — CEVA Logistics named Caterpillar Supplier of the Year for Integrated Logistics at the Caterpillar Supplier Excellence Recognition event in Grapevine, TX. Margaret Poorman represented the integrated-logistics function on stage.',
      'Continuing investment in Cat Digital — autonomous mining fleet has now moved 11+ billion tonnes with nearly 700 autonomous haul trucks in operation.',
    ],
    supplyChainInitiatives: [
      'In-field autonomy program (Cat Digital + NVIDIA) is the public industrial-AI initiative; the yard layer between the factory and the dealer is the unsolved seam beside it.',
    ],
    urgencyDriver:
      'The autonomous-machine program is the public proof that Caterpillar can run AI-grade systems thinking on the asset. The yard operating layer above the sites — Morton parts, Griffin and the other plants, customization staging for built-to-order machines, dealer handoff — is the place where the same systems thinking has not yet been applied. The contradiction is unusually visible right now.',
  },

  marginaliaItems: [
    { mark: 'In-field autonomy', body: 'CES 2026 · Cat Digital + NVIDIA · 5 autonomous machine classes · Cat AI Assistant on Jetson Thor.' },
    { mark: 'Mining baseline', body: 'Nearly 700 autonomous haul trucks in production · 11B+ tonnes moved.' },
    { mark: 'Manufacturing footprint', body: '60+ NA plants · 100+ globally across 25 countries · Morton IL parts hub · Griffin GA dealer-flow.' },
    { mark: 'Dealer network', body: '~160 independent dealer organizations · thousands of branches · 197 countries.' },
    { mark: 'Freight profile', body: 'D11-class dozers 5,000–400,000+ lbs · multiple parking spots per unit · per-LOAD-hardest, not per-case-hardest.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: AUDIO_BRIEF_SRC,
    intro:
      'This brief is for Margaret. The integrated-logistics function you have run for the better part of three decades — Morton, the dealer-delivery network, the supplier integration the CEVA award called out — is the part of Caterpillar that sees the contradiction first. The five minutes that follow are about the yard layer above the sites that the autonomous-machine program has not yet reached.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#FFCD11',
    backgroundVariant: 'dark',
  },
};
