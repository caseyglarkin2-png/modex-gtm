/**
 * Mondelez International — ABM Microsite Data
 * Quality Tier: Tier 2 Band B
 *
 * Pitch shape: post-acquisition integration at the yard layer. Mondelez has
 * integrated Hu Kitchen, Chipita, Clif Bar, and Ricolino at the brand layer
 * and largely at the plant layer; the yard layer at sites that received
 * production from acquired SKUs is where integration friction remains.
 * Frame as observational diagnosis, not solution-selling.
 */

import type { AccountMicrositeData } from '../schema';

export const mondelezInternational: AccountMicrositeData = {
  slug: 'mondelez-international',
  accountName: 'Mondelez International',
  vertical: 'cpg',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: "Mondelez North America · The yard layer below 130 plants and post-acquisition integration",
  metaDescription:
    "Mondelez operates 130+ plants globally with North America anchored by integrations of Hu Kitchen, Chipita, Clif Bar, and Ricolino. Each acquired brand brought its own yard-ops history. The network-level yard layer above the sites is where that integration still hasn't converged.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Mondelez North America network',
      composition: [
        { label: 'Global manufacturing footprint', value: '130+ plants and 320 warehouses across ~160 countries; ~30 plants and a deeper warehouse network in North America' },
        { label: 'NA product mix at the dock', value: 'Ambient biscuits and crackers (Oreo, Ritz, Triscuit, Chips Ahoy, belVita) · temperature-sensitive chocolate (Cadbury, Milka, Toblerone) · refrigerated specialty (Philadelphia) · candy and gum derivatives (Sour Patch Kids, Halls)' },
        { label: 'Recent acquisitions absorbed into the NA network', value: 'Hu Kitchen (premium chocolate, 2021) · Chipita (Greek croissants, 2022) · Clif Bar ($2.9B, 2022) · Ricolino ($1.3B Mexican confectionery, 2022) · Tate\'s Bake Shop (2018)' },
        { label: 'Integration status', value: 'Brand layer integrated · plant layer largely integrated · network-level yard standard across acquired-plus-legacy sites still in flight' },
        { label: 'Distribution model tension', value: 'High-velocity snacks run on a mix of DSD and warehouse distribution; chocolate runs on seasonal surge cycles; multi-temp dock arbitration sits underneath both' },
        { label: 'Leadership context', value: 'Claudio Parrotta — 35-year company lifer, NA turnaround leader 2018-2024, author of the North America Supply Chain Master Plan 2030, elevated to global EVP & Chief Supply Chain Officer in 2024' },
      ],
      hypothesis:
        'The interesting thing about the Mondelez yard math is what brand-and-plant integration has not finished. Hu Kitchen came in with a small-batch premium-chocolate operating habit. Chipita came in with a European bakery cadence that didn\'t look like Nabisco\'s. Clif came in with an energy-bar carrier roster and a different appointment culture from biscuit ops. Ricolino came in with a Mexican confectionery operating reality that didn\'t map cleanly onto NA dock SOPs. Each acquisition got rationalized at the brand layer — pricing, packaging, retailer relationships — and largely at the plant layer, where production has been redistributed across the existing footprint. But the yard layer at the sites that absorbed those flows is where the integration is least finished. Different appointment cadences, different carrier preferences inherited from the acquired company\'s shipper, different multi-temp dock priority rules where ambient cookie production now shares a yard with the chocolate or specialty SKUs that came in with the deal. Stack that on top of two structural features of the Mondelez NA network — the seasonal chocolate surge (Halloween through Easter producing 2-4x baseline at chocolate plants) and the DSD-versus-warehouse split at high-velocity biscuit sites — and the yard becomes the surface where post-acquisition operating practice converges or doesn\'t. Claudio is the part of the picture that says this is the kind of seam someone at the top is actively looking for. He spent six years rebuilding the NA supply chain into "industry-leading" before getting the global seat, he wrote the Master Plan 2030 himself, and the yard layer is one of the few remaining domains in CPG ops where the operating-system thinking he applied to safety, quality, service, and productivity hasn\'t been extended yet. Network-level convergence of the inherited yard practices is the unsolved seam, and it sits underneath every acquisition Mondelez has done since 2018.',
      caveat:
        'This is built from Mondelez public disclosures, the Clif Bar / Ricolino / Chipita / Hu Kitchen acquisition records, the NA Master Plan 2030 framing in Claudio\'s public bio, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether acquired-brand yard SOPs have already been collapsed into a single NA standard, where multi-temp dock arbitration is most contested today, and how much of the inherited carrier-and-appointment posture from each deal is still in place.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of the site-level systems each plant inherited. The Mondelez NA operating profile is similar in shape — multi-site, multi-temp, 3PL-dependent, multiple inherited yard postures from a sequence of M&A absorptions — but with more forgiving freight economics per trailer. If a network can run this operating model on water, the harder freight, the read-across to ambient biscuits + temperature-sensitive chocolate + acquired-brand specialty SKUs is the easier lift, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30-60 days from kickoff to first measurable impact at the pilot site. Two pilot shapes make sense at Mondelez: (1) a flagship Oreo or Ritz NA plant where the seasonal-surge plus DSD-versus-warehouse complexity is most visible, so the operating model gets stress-tested on the highest-velocity case first; (2) a site that received Clif or Hu production after the acquisition, where the inherited yard SOPs from the acquired company are still visible against the legacy Mondelez baseline. The second shape is the one most likely to surface where post-acquisition integration is still leaking. We would expect the network to make sense of itself within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'mdlz-public-network',
          source: 'Mondelez International public network disclosures and 10-K filings',
          confidence: 'public',
          detail: 'Anchors the 130+ plants, 320 warehouses, ~160 country footprint, and the ambient + temperature-sensitive + refrigerated product mix that defines NA dock complexity.',
          url: 'https://www.mondelezinternational.com/',
        },
        {
          id: 'mdlz-clif-acquisition',
          source: 'Clif Bar acquisition disclosure ($2.9B, June 2022)',
          confidence: 'public',
          detail: 'Added energy-bar manufacturing and distribution capacity (Twin Falls, ID; Indianapolis, IN) with its own carrier roster and appointment culture inherited from a standalone shipper.',
        },
        {
          id: 'mdlz-ricolino-acquisition',
          source: 'Ricolino acquisition disclosure ($1.3B from Grupo Bimbo, May 2022)',
          confidence: 'public',
          detail: 'Added Mexican confectionery manufacturing into the NA network with operating practice inherited from a Bimbo subsidiary — a different SOP baseline than Nabisco-era Mondelez ops.',
        },
        {
          id: 'mdlz-chipita-acquisition',
          source: 'Chipita acquisition disclosure (Greek croissant maker, January 2022)',
          confidence: 'public',
          detail: 'Added European bakery operations and a baked-goods cadence that doesn\'t map cleanly onto the legacy NA biscuit dock pattern.',
        },
        {
          id: 'mdlz-hu-acquisition',
          source: 'Hu Kitchen acquisition (premium chocolate, 2021)',
          confidence: 'public',
          detail: 'Smaller deal but operationally interesting: a premium small-batch chocolate operation absorbed into a network where chocolate already runs on a seasonal-surge cycle with multi-temp dock arbitration.',
        },
        {
          id: 'mdlz-master-plan-2030',
          source: 'Claudio Parrotta\'s public bio and the North America Supply Chain Master Plan 2030',
          confidence: 'public',
          detail: 'Master Plan 2030 is Claudio\'s signature operating framework — the strategic roadmap he authored as SVP NA before being elevated to global EVP & CSCO in 2024. The yard layer is one of the operating-improvement surfaces that fits the plan\'s service and productivity pillars.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site CPG networks operate under, not Mondelez specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether acquired-brand yard SOPs (Clif, Ricolino, Chipita, Hu) have already been collapsed into a single Mondelez NA standard or still operate under inherited practice at their respective sites',
        'Where multi-temp dock arbitration is most contested today — which plants run ambient biscuit and temperature-sensitive chocolate from the same yard',
        'How the Halloween-through-Easter chocolate surge actually translates into yard-level overflow capacity decisions at affected plants',
        'How the DSD-versus-warehouse split at high-velocity biscuit sites changes dock priority during normal-versus-surge weeks',
        'Whether the Master Plan 2030 has explicit yard-layer rollout milestones or treats the yard as plant-level discretion today',
        'How carrier-experience metrics flow back into procurement decisions at the network level after the sequence of post-2018 acquisitions',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Mondelez is distinctive in this round because the integration story is not a single recent deal — it is a sequence (Tate\'s, Hu, Chipita, Clif, Ricolino) absorbed across five years, each bringing its own yard-ops history into a network that didn\'t exist as a unified operating system at the yard layer before any of those deals closed. Brand-level and plant-level integration has been the visible work. The network-level yard layer above the sites is the quieter seam, and it is the kind of seam an industrial-engineer-by-training, 35-year company lifer who personally wrote the NA Master Plan 2030 is shaped to recognize as operating debt.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Mondelez — particularly whether acquired-brand yard SOPs have already converged into one standard, how multi-temp dock arbitration is decided at the multi-brand plants, or where the chocolate-surge calendar is still producing visible yard-level overflow — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'mondelez-international-001',
      name: 'Claudio Parrotta',
      firstName: 'Claudio',
      lastName: 'Parrotta',
      title: 'EVP & Chief Supply Chain Officer, Mondelez International',
      company: 'Mondelez International',
      email: 'claudio.parrotta@mdlz.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain / Operations',
      currentMandate:
        'Owns the global Mondelez supply chain — 130+ plants, 320 warehouses, ~60,000 supply chain employees across ~160 countries. Elevated from SVP NA to global EVP & CSCO in 2024 after a six-year NA turnaround that elevated regional performance to "industry-leading" against safety, quality, service, and productivity. Personally authored the North America Supply Chain Master Plan 2030. 35-year company lifer who started on the chocolate plant floor in Buenos Aires. Industrial engineer by training (University of Buenos Aires, Darden MBA).',
      bestIntroPath:
        'Direct outreach to the EVP & CSCO office. If delegated, target the NA VP Supply Chain or VP Logistics seat that inherited his prior NA mandate, with a cc to whoever owns the integration program management office for the post-2018 acquisitions.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'mondelez-international-001',
        name: 'Claudio Parrotta',
        firstName: 'Claudio',
        lastName: 'Parrotta',
        title: 'EVP & Chief Supply Chain Officer, Mondelez International',
        company: 'Mondelez International',
        email: 'claudio.parrotta@mdlz.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Claudio Parrotta - EVP & Chief Supply Chain Officer',
      variantSlug: 'claudio-parrotta',

      framingNarrative:
        'Claudio, the operating-system thinking you applied to the NA turnaround — and the Master Plan 2030 you wrote underneath it — is the same thinking that finishes converging the yard layer across the post-acquisition NA network. Brand-level and plant-level integration of Tate\'s, Hu, Chipita, Clif, and Ricolino has happened. The network-level yard layer above the sites is where each of those acquisitions still shows its inherited operating practice, and it\'s the kind of seam the Master Plan was shaped to close.',
      openingHook:
        'You absorbed five acquisitions since 2018 and rebuilt NA supply chain into industry-leading shape while doing it. The quiet remaining seam is the yard layer: appointment cadences, carrier rosters, multi-temp dock priority, and DSD-versus-warehouse arbitration are still partially inherited from each acquired company\'s pre-deal posture at the sites that received their production.',
      stakeStatement:
        'Network-level yard convergence is the operating-debt line item from a five-year acquisition sequence. It doesn\'t show up on a P&L; it shows up as the variance between what the Master Plan 2030 measures at the plant level and what each yard actually delivers during the Halloween-through-Easter chocolate surge and the high-velocity biscuit weeks underneath it.',

      heroOverride: {
        headline: 'The yard layer underneath the post-acquisition NA network is the unfinished part of the Master Plan.',
        subheadline:
          'Brand-level and plant-level integration of Tate\'s, Hu, Chipita, Clif, and Ricolino is done. The yard layer at the sites that absorbed each of those flows is where the inherited operating practice still lives — and where a network-level standard above the sites is the next move.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Claudio is an industrial engineer, a 35-year company lifer, and the author of the Master Plan 2030 — he doesn\'t need a glossary and he doesn\'t need to be sold on why yard matters. Acknowledge the NA turnaround as the real precedent it is. Position the wedge as completing the operating-system thinking he already started, not introducing it.',
      kpiLanguage: [
        'network-level yard standard',
        'dock-door arbitration',
        'multi-temp dock priority',
        'trailer dwell',
        'appointment cadence convergence',
        'carrier-roster integration',
        'DSD-vs-warehouse dock posture',
        'seasonal-surge overflow capacity',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same multi-site, multi-temp, 3PL-dependent shape, harder freight (water), already running a network operating model above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable food & beverage operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at food & beverage facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'It is accurate that your software has enabled us to take on additional volume while remaining headcount neutral in the dock office.',
        role: 'Operations Director',
        company: 'National CPG/Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '130+ plants globally · ~30 in North America · 320 warehouses globally',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread:
      'Global; North America anchored at Chicago, IL (HQ) and East Hanover / Whippany, NJ (NA HQ + Global Innovation Center). NA plants include Richmond VA, Fair Lawn NJ, Portland OR, Chicago-area Nabisco legacy ops, plus the Clif Bar sites in Twin Falls ID and Indianapolis IN and Ricolino sites absorbed from Grupo Bimbo.',
    dailyTrailerMoves: 'High-volume — 1,000+ across the NA network across ambient biscuit, temperature-sensitive chocolate, and acquired-brand specialty flows',
    fleet: 'Contract carriers and 3PL; carrier rosters partially inherited from acquired companies at the sites that absorbed their production',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: '1,000+ across the NA network',
    peakSeason: 'Halloween through Easter chocolate surge (2-4x baseline at chocolate plants); secondary seasonal spikes around Valentine\'s Day and back-to-school biscuit weeks',
  },

  signals: {
    recentNews: [
      'Five-acquisition NA integration sequence — Tate\'s Bake Shop (2018), Hu Kitchen (2021), Chipita (Jan 2022), Clif Bar ($2.9B, June 2022), Ricolino ($1.3B, May 2022). Brand-level and plant-level integration complete; network-level yard convergence is the remaining operating-debt line item.',
      'Gum business divestiture (Oct 2023) — sold Trident, Dentyne, Chiclets, Bubblicious to Perfetti Van Melle. Portfolio simplification on one side; integration absorption on the other.',
      'Claudio Parrotta elevated to global EVP & Chief Supply Chain Officer (2024) after a six-year NA turnaround that elevated regional performance to industry-leading.',
      'North America Supply Chain Master Plan 2030 — Claudio\'s signature operating framework, written while he was SVP NA. The yard layer is one of the productivity-and-service surfaces that fits the plan but isn\'t obviously called out in public framing.',
    ],
    urgencyDriver:
      'The operating-system thinking that produced the NA turnaround and the Master Plan 2030 hasn\'t yet been extended to the yard layer across the post-acquisition network. Each of the last five deals brought its own yard-ops history, and the convergence work above the sites is the kind of seam Claudio is shaped to recognize.',
  },

  theme: {
    accentColor: '#1E40AF',
  },
};
