/**
 * Mondelez International — ABM Microsite Data
 * Quality Tier: Tier 2 Band B (A+ uplift Phase 9)
 *
 * Pitch shape: post-acquisition integration at the yard layer. Mondelez has
 * integrated Tate's, Hu Kitchen, Chipita, Clif Bar, and Ricolino at the
 * brand layer and largely at the plant layer; the yard layer at sites that
 * received production from acquired SKUs is where integration friction
 * remains. Frame as observational diagnosis, not solution-selling.
 *
 * A+ uplift (Phase 9):
 *  - Hypothesis refined into a 3-paragraph structure (inherited posture →
 *    Master Plan 2030 productivity surface → acquisition-sequence math).
 *  - Composition rows extended with Master Plan 2030 coverage seam,
 *    acquisition-integration sequence row, and the Halloween-through-Easter
 *    seasonal-surge math row.
 *  - Comparable tightened with closing sentence linking Primo to the
 *    Master Plan 2030 productivity pillar.
 *  - Methodology adds two new unknowns (acquisition integration program
 *    management ownership and Master Plan 2030 yard-layer milestones) and
 *    a tightened Parrotta tenure source citation.
 *  - About + signOff Parrotta-personalized — 35-year company lifer,
 *    Suchard Argentina chocolate-plant industrial engineer origin, NA
 *    Master Plan 2030 author, six-year NA turnaround into the global seat.
 *  - personVariants[0] (Claudio Parrotta) rewritten on the same beats.
 *  - New artifact: public/artifacts/mondelez-international-coverage-map.svg
 *    (Master Plan 2030, Acquisition Integration, Biscuit, Chocolate, Gum &
 *    Candy covered · Yard Network Ops unfilled in Mondelez purple/blue
 *    #1E40AF).
 */

import type { AccountMicrositeData } from '../schema';

export const mondelezInternational: AccountMicrositeData = {
  slug: 'mondelez-international',
  accountName: 'Mondelez International',
  coverHeadline: 'The yard layer underneath the Master Plan 2030',
  titleEmphasis: 'Master Plan 2030',
  coverFootprint: '~30 NA + 130 global plants',
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
        { label: 'Global manufacturing footprint', value: '130+ plants and 320 warehouses across ~160 countries · ~30 plants and a deeper warehouse network in North America · ~60,000 supply chain employees globally' },
        { label: 'NA product mix at the dock', value: 'Ambient biscuits and crackers (Oreo, Ritz, Triscuit, Chips Ahoy, belVita) · temperature-sensitive chocolate (Cadbury, Milka, Toblerone) · refrigerated specialty (Philadelphia) · candy and gum derivatives (Sour Patch Kids, Halls)' },
        { label: 'Acquisition integration sequence', value: 'Tate\'s Bake Shop (2018, premium biscuit) → Hu Kitchen (2021, premium chocolate) → Chipita (Jan 2022, European bakery) → Clif Bar ($2.9B, Jun 2022, energy bar) → Ricolino ($1.3B, May 2022, Mexican confectionery). Five operating-practice baselines absorbed in five years; brand layer rationalized, plant layer largely converged, yard layer above the sites is the part still showing the inheritance' },
        { label: 'Master Plan 2030 coverage seam', value: 'Claudio\'s NA framework, authored as SVP NA before the global seat — safety, quality, service, productivity pillars on a 2030 horizon. Plant-level performance lifted to "industry-leading" against the four pillars; the network-level yard layer above the sites is the operating-system surface the plan has not yet extended into a single standard' },
        { label: 'Seasonal surge math', value: 'Halloween-through-Easter chocolate cycle produces 2-4x baseline at chocolate plants; secondary biscuit spikes at Valentine\'s Day and back-to-school. The surge weeks are exactly when multi-temp dock arbitration, DSD-versus-warehouse priority, and inherited acquired-brand appointment cadences all compete for the same yard at once — and exactly when the operating-system thinking the Master Plan applies to plants has to translate to the yard or doesn\'t' },
        { label: 'Distribution model tension', value: 'High-velocity snacks run on a mix of DSD and warehouse distribution; chocolate runs on seasonal surge cycles; multi-temp dock arbitration sits underneath both' },
        { label: 'Leadership context', value: 'Claudio Parrotta — 35-year company lifer (joined 1991 as a Senior Analyst Industrial Engineer at the Suchard chocolate plant in Argentina), NA turnaround leader 2018-2024, personally authored the North America Supply Chain Master Plan 2030, elevated to global EVP & Chief Supply Chain Officer in 2024' },
      ],
      hypothesis:
        'The interesting thing about the Mondelez yard math is what brand-and-plant integration has not finished. Tate\'s came in with a premium-biscuit operating habit. Hu Kitchen came in with a small-batch premium-chocolate cadence. Chipita came in with a European bakery rhythm that didn\'t look like Nabisco\'s. Clif came in with an energy-bar carrier roster and a different appointment culture from biscuit ops. Ricolino came in with a Mexican confectionery operating reality — inherited from a Bimbo subsidiary — that didn\'t map cleanly onto NA dock SOPs. Each acquisition got rationalized at the brand layer — pricing, packaging, retailer relationships — and largely at the plant layer, where production has been redistributed across the existing footprint. The yard layer at the sites that absorbed those flows is where the integration is least finished: different appointment cadences, different carrier preferences inherited from the acquired company\'s shipper, different multi-temp dock priority rules where ambient cookie production now shares a yard with the chocolate or specialty SKUs that came in with the deal.\n\nStack that on top of two structural features of the Mondelez NA network — the Halloween-through-Easter chocolate surge producing 2-4x baseline at chocolate plants, and the DSD-versus-warehouse split at high-velocity biscuit sites — and the yard becomes the surface where post-acquisition operating practice converges or doesn\'t. The surge weeks are exactly when inherited appointment cadences, inherited carrier rosters, and multi-temp dock priority all compete for the same yard at once. The Master Plan 2030 has already lifted plant-level performance to "industry-leading" against the four pillars — safety, quality, service, productivity. The network-level yard layer above the sites is the operating-system surface the plan has not yet extended into a single standard, and the surge weeks are when that gap becomes the part of the productivity pillar nobody is currently counting.\n\nThe third thing is Claudio himself. He spent six years rebuilding the NA supply chain into industry-leading shape before being elevated to the global seat in 2024, he personally wrote the Master Plan 2030, and he started his Mondelez career in 1991 as an industrial engineer on the Suchard chocolate plant floor in Argentina. A 35-year company lifer with an industrial-engineering origin is the part of the picture that says network-level convergence of inherited yard practices is the kind of seam someone at the top is actively looking for — not as a YMS purchase, but as the next extension of operating-system thinking already applied to plants. The Master Plan 2030 is the framework; the yard layer above the post-2018 acquisition sequence is the remaining surface it has not yet reached.',
      pullQuote: 'The yard is the surface where post-acquisition operating practice converges or doesn\'t.',
      caveat:
        'This is built from Mondelez public disclosures, the Tate\'s / Hu Kitchen / Chipita / Clif Bar / Ricolino acquisition records, the NA Master Plan 2030 framing in Claudio\'s public bio, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the acquired-brand yard SOPs have already been collapsed into a single NA standard, which Master Plan 2030 productivity-pillar milestones already include yard-layer commitments versus treating the yard as plant-level discretion, where multi-temp dock arbitration is most contested during the chocolate-surge weeks, and how much of the inherited carrier-and-appointment posture from each acquisition is still in place at the sites that absorbed the flows.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the Master Plan 2030 operating layer',
      artifact: {
        imageSrc: '/artifacts/mondelez-international-coverage-map.svg',
        imageAlt: 'Master Plan 2030 coverage map. Six tiles representing the Mondelez North America operating surfaces touched by Claudio Parrotta\'s Master Plan 2030. Master Plan 2030, Acquisition Integration, Biscuit, Chocolate, and Gum & Candy are covered. The Yard Network Ops tile is unfilled, marked with a Mondelez purple-blue hairline outline.',
        caption: 'Master Plan 2030 operating-layer coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public Master Plan 2030 framing, the post-2018 acquisition disclosures (Tate\'s, Hu, Chipita, Clif, Ricolino), and public Mondelez NA category breakouts. Site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of the site-level systems each plant inherited. The Mondelez NA operating profile is similar in shape — multi-site, multi-temp, 3PL-dependent, multiple inherited yard postures from a sequence of M&A absorptions — but with more forgiving freight economics per trailer. If a network can run this operating model on water, the harder freight, the read-across to ambient biscuits + temperature-sensitive chocolate + acquired-brand specialty SKUs is the easier lift, not the harder one. The translation that matters for Mondelez is integration shape, not category: Primo is the proof that a network operating layer lands on top of mature site-level systems without disrupting the existing stack — exactly the move the Master Plan 2030 productivity pillar now needs as five post-2018 acquisitions converge through the chocolate-surge weeks and the DSD-versus-warehouse split underneath them.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
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
          url: 'https://www.mondelezinternational.com/about-us/leadership/executive-team/claudio-parrotta/',
        },
        {
          id: 'mdlz-parrotta-tenure',
          source: 'Claudio Parrotta — public tenure record (LinkedIn, Mondelez executive page)',
          confidence: 'public',
          detail: 'Joined the company in 1991 as a Senior Analyst Industrial Engineer at the Suchard chocolate plant in Argentina — 35 years of internal tenure as of 2026. Progression spans Continuous Improvement Engineer (1991-1994), Manufacturing Manager, Plant Manager (2001-2003), Business Development Manager (2003-2007), Manufacturing Area Director Middle East & Africa (2007-2009), Senior Director Manufacturing US Biscuits Division (2010-2011), Senior Director Integrated Supply Chain Brazil (2011-2014), Senior Director Global Operations Chocolate (2015), SVP NA Supply Chain (2018-2024 NA turnaround leader), elevated to global EVP & Chief Supply Chain Officer (2024). Industrial-engineering origin is the lens that shapes the Master Plan 2030 operating-system framing.',
          url: 'https://www.linkedin.com/in/claudio-parrotta-4a59444',
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
        'Whether acquired-brand yard SOPs (Tate\'s, Hu, Chipita, Clif, Ricolino) have already been collapsed into a single Mondelez NA standard or still operate under inherited practice at their respective sites',
        'Where multi-temp dock arbitration is most contested today — which plants run ambient biscuit and temperature-sensitive chocolate from the same yard',
        'How the Halloween-through-Easter chocolate surge actually translates into yard-level overflow capacity decisions at affected plants',
        'How the DSD-versus-warehouse split at high-velocity biscuit sites changes dock priority during normal-versus-surge weeks',
        'Whether the Master Plan 2030 has explicit yard-layer rollout milestones inside its service and productivity pillars, or whether the yard is currently treated as plant-level discretion in the 2030 roadmap',
        'How carrier-experience metrics flow back into procurement decisions at the network level after the sequence of post-2018 acquisitions',
        'Which seat owns the post-2018 acquisition integration program management office (Tate\'s through Ricolino) today — and whether yard-layer convergence is inside that PMO\'s scope or treated as steady-state operations once the brand and plant layers ship',
        'Whether the global EVP & CSCO seat Claudio took in 2024 has formally extended the Master Plan 2030 framing from NA into a global operating standard — and where the yard-layer entry sequences against that extension',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Mondelez is distinctive in this round because the integration story is not a single recent deal — it is a sequence (Tate\'s, Hu, Chipita, Clif, Ricolino) absorbed across five years, each bringing its own yard-ops history into a network that didn\'t exist as a unified operating system at the yard layer before any of those deals closed. Brand-level and plant-level integration has been the visible work. The network-level yard layer above the sites is the quieter seam, and it is the kind of seam an industrial engineer who came up on the Suchard chocolate plant floor in Argentina, spent 35 years inside the company, and personally wrote the NA Master Plan 2030 is shaped to recognize as operating debt — the part of the productivity pillar that has not yet been counted because it has not yet been standardized.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Claudio — the part most worth pushing back on is whether the operating-system thinking you carried out of 35 years inside the company — and codified in the Master Plan 2030 — has already extended to the yard layer above the acquired-plus-legacy sites, or whether the yard is still treated as plant-level discretion underneath a plan that converged everything above it. That answer reshapes the rest of this. The post-2018 acquisition sequence, the chocolate-surge math, and the assumption that network-level yard convergence is the unsolved seam are the next things to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
        'Claudio, the operating-system thinking you took from the Suchard chocolate plant floor in 1991 — through Continuous Improvement, Manufacturing, Plant Manager, Global Operations Chocolate, and the six-year NA turnaround — and codified in the Master Plan 2030 is the same thinking that finishes converging the yard layer across the post-acquisition NA network. Brand-level and plant-level integration of Tate\'s, Hu, Chipita, Clif, and Ricolino has happened. The network-level yard layer above the sites is where each of those acquisitions still shows its inherited operating practice, and it is the kind of seam the Master Plan was shaped to close — the part of the productivity pillar that has not yet been counted because it has not yet been standardized.',
      openingHook:
        'You absorbed five acquisitions in five years and rebuilt NA supply chain into industry-leading shape against safety, quality, service, and productivity while doing it. The quiet remaining seam is the yard layer above the sites: appointment cadences, carrier rosters, multi-temp dock priority, and DSD-versus-warehouse arbitration are still partially inherited from each acquired company\'s pre-deal posture at the sites that received their production.',
      stakeStatement:
        'Network-level yard convergence is the operating-debt line item from a five-year acquisition sequence. It doesn\'t show up on a P&L; it shows up as the variance between what the Master Plan 2030 measures at the plant level and what each yard actually delivers during the Halloween-through-Easter chocolate surge (2-4x baseline at chocolate plants) and the high-velocity biscuit weeks underneath it. The surge weeks are exactly when inherited cadences, inherited carrier rosters, and multi-temp dock priority all compete for the same yard at once — and exactly when the operating-system thinking the Master Plan applies to plants has to translate to the yard or doesn\'t.',

      heroOverride: {
        headline: 'The yard layer underneath the post-acquisition NA network is the unfinished part of the Master Plan.',
        subheadline:
          'Brand-level and plant-level integration of Tate\'s, Hu, Chipita, Clif, and Ricolino is done. The yard layer at the sites that absorbed each of those flows is where the inherited operating practice still lives — and where a network-level standard above the sites is the next extension of the Master Plan 2030 productivity pillar.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Claudio is an industrial engineer who came up on the Suchard chocolate plant floor in 1991, a 35-year company lifer, and the author of the Master Plan 2030 — he doesn\'t need a glossary and he doesn\'t need to be sold on why yard matters. Acknowledge the NA turnaround as the real precedent it is. Position the wedge as the next extension of the operating-system thinking he already started, not introducing it. Master Plan 2030, safety / quality / service / productivity, and "industry-leading" are his own words; use them where they earn the quote.',
      kpiLanguage: [
        'network-level yard standard',
        'dock-door arbitration',
        'multi-temp dock priority',
        'trailer dwell',
        'appointment cadence convergence',
        'carrier-roster integration',
        'DSD-vs-warehouse dock posture',
        'seasonal-surge overflow capacity',
        'Master Plan 2030 productivity pillar',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same multi-site, multi-temp, 3PL-dependent shape, harder freight (water), already running a network operating layer above existing site-level yard systems. The translation that matters for Mondelez is integration shape, not category — a network operating layer landing on top of mature site-level systems without disrupting them, exactly the move the Master Plan 2030 productivity pillar now needs. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes the topic.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable food & beverage operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
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

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Master Plan 2030', body: 'Claudio\'s NA framework · safety, quality, service, productivity · authored as SVP NA before the global seat.' },
    { mark: 'Acquisition sequence', body: 'Tate\'s 2018 · Hu 2021 · Chipita Jan 2022 · Clif $2.9B Jun 2022 · Ricolino $1.3B May 2022.' },
    { mark: 'Network footprint', body: '130+ plants · 320 warehouses · ~160 countries · ~30 plants in North America.' },
    { mark: 'Seasonal surge', body: 'Halloween-to-Easter chocolate cycle · 2-4x baseline at chocolate plants.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same shape, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/mondelez-international.m4a',
    intro:
      'Thirty minutes for Claudio Parrotta. The operating-system thinking you applied to the NA turnaround — and the Master Plan 2030 you authored underneath it — is the thinking what follows builds on. What follows is the layer above the sites where each of the last five acquisitions still shows its inherited operating practice.',
    chapters: [
      { id: 'thesis', label: 'The yard layer as the unfinished part of the Master Plan', start: 0 },
      { id: 'observation', label: 'Five acquisitions in five years, converging through the chocolate-surge weeks', start: 366 },
      { id: 'comparable', label: 'Primo Brands — same shape, harder freight', start: 732 },
      { id: 'methodology', label: 'How the post-2018 acquisition sequence was traced to the yard', start: 1098 },
      { id: 'about', label: 'What the productivity pillar has not yet counted', start: 1464 },
    ],
    videoFollowUp: {
      src: '/audio/mondelez-international-video.mp4',
      intro:
        'Or watch. The same brief, compressed into a few minutes — for the times forwarding a video is easier than describing the memo.',
    },
    generatedAt: '2026-05-14T22:30:00Z',
  },

  theme: {
    accentColor: '#1E40AF',
  },
};
