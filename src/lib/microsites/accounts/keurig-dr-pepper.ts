/**
 * Keurig Dr Pepper — ABM Microsite Data
 * Quality Tier: A+ (Phase 9 uplift — May 2026, built on Phase 7 baseline)
 *
 * Pitch shape: hybrid-distribution dock-arbitration wedge. KDP is one of
 * the few CPG networks in North America that runs DSD (cold beverage)
 * and warehouse distribution (K-Cups, shelf-stable) at meaningful scale
 * out of the same operating footprint. Many sites load DSD route trucks
 * at dawn AND warehouse trailers across the day, on the same dock
 * surface. That hybrid is the analytical wedge — it is not a freight
 * complexity story, it is a network-coordination story.
 *
 * Angle: network-level yard operating model that arbitrates DSD-vs-
 * warehouse priority on shared dock surfaces. Frame as observational
 * diagnosis, never as pitch.
 *
 * Decision-maker: Kelly Killingsworth, SVP Logistics, KDP. Background
 * spans Walmart (logistics), Nike (Global VP Logistics), Manhattan
 * Associates, Home Depot, i2 Technologies — a multi-channel,
 * multi-vertical operating-system pedigree. Marketing degree, University
 * of Georgia (Terry). The memo speaks past the SVP Logistics chair to
 * the multi-channel coordination problem Kelly's resume is shaped to
 * recognize.
 *
 * Sources (this file's hand-authored prose):
 *   - KDP Kalil Bottling acquisition release (May 2024)
 *   - KDP GHOST Energy acquisition release (October 2024) + Tim Cofer
 *     remarks; mid-2025 DSD transition with up to $250M investment
 *   - KDP / JDE Peet's transaction materials + planned separation
 *     into Refreshment Beverage and Global Coffee companies
 *   - Tim Cofer CEO transition (April 2024) + March 2024 strategy review
 *   - Kelly Killingsworth public LinkedIn / org-chart record
 *     (SVP Logistics, KDP; prior at Nike, Walmart, Manhattan
 *     Associates, Home Depot, i2 Technologies)
 */

import type { AccountMicrositeData } from '../schema';

export const keurigDrPepper: AccountMicrositeData = {
  slug: 'keurig-dr-pepper',
  accountName: 'Keurig Dr Pepper',
  coverHeadline: 'The yard layer between K-Cup pods and the DSD dawn',
  titleEmphasis: 'between K-Cup pods and the DSD dawn',
  coverFootprint: '30+ sites · DSD + warehouse',
  vertical: 'beverage',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: "Keurig Dr Pepper · The dock arbitration between DSD and warehouse distribution",
  metaDescription:
    "Keurig Dr Pepper runs two distribution models out of the same operating footprint — DSD route trucks loading at dawn, warehouse trailers running shelf-stable and K-Cup volume across the day. The yard is where those two rhythms compete for the same doors.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Keurig Dr Pepper network',
      composition: [
        { label: 'Corporate structure', value: 'Dual headquarters: Burlington MA (Keurig legacy) and Plano TX (Dr Pepper Snapple legacy); merged 2018 from Keurig Green Mountain + Dr Pepper Snapple' },
        { label: 'Distribution model', value: 'Hybrid — Company-owned DSD for cold-beverage brands; warehouse distribution for K-Cup pods and shelf-stable; a third lane for Dr Pepper volume routed via Coca-Cola and PepsiCo bottling partners' },
        { label: 'Brand portfolio at the dock', value: 'Dr Pepper · Snapple · 7UP · Mott\'s · Schweppes · Bai · A&W · Sunkist · Canada Dry · Core Hydration · Keurig K-Cup' },
        { label: 'K-Cup manufacturing footprint', value: 'Continuous-process pod plants in Essex VT · Knoxville TN · Sumner WA, plus Spartanburg SC roasting — warehouse-distribution outbound at every site' },
        { label: 'Kalil West DSD expansion', value: 'Kalil Bottling acquisition (May 2024) — first KDP-owned production, sales, and distribution operation in Arizona; Tucson production + Tucson/Tempe distribution; ~4,500 outlets, 7.4M consumers, ~425 employees absorbed. The cleanest place to embed a hybrid-dock standard before legacy local routine hardens' },
        { label: 'GHOST acquisition onto DSD', value: 'GHOST Energy acquisition announced October 2024 (60% stake, ~$990M; remainder by 2028 based on 2027 performance). Tim Cofer publicly framed the deal at a $1.65B implied valuation; KDP committed up to $250M starting mid-2025 to transition GHOST off existing third-party agreements and onto KDP-owned DSD — a new high-velocity LRB SKU set landing on the same yards already running K-Cup continuous outbound' },
        { label: 'Multi-channel cadence at the dock', value: 'DSD route trucks dispatched in the pre-dawn window for retail open · warehouse-distribution outbound to retailer DCs running across the day · K-Cup e-commerce direct-to-consumer pulling from the same outbound surface · partner-bottler trailers (Coca-Cola and PepsiCo bottlers) touching KDP yards in Dr Pepper territories. Four channels, one set of doors' },
        { label: 'LRB platform stack-up', value: 'GHOST joins an LRB portfolio that already includes C4 (acquired stake 2022, full DSD transition completed), Black Rifle Coffee Company partnership, Polar Seltzer, Core Hydration, Electrolit (distribution deal), and Bai — all sharing the cold-beverage DSD operating layer the GHOST onboarding now extends' },
        { label: 'Active corporate change', value: 'Tim Cofer assumed CEO April 2024 with a March 2024 strategy review emphasizing DSD growth and disciplined network optimization; JDE Peet\'s acquisition announced with planned separation into a Refreshment Beverage company and a Global Coffee company, targeting ~$200M coffee-side supply chain savings as part of a $400M total post-separation cost program' },
      ],
      hypothesis:
        'The thing that makes Keurig Dr Pepper structurally unusual in CPG is that the company actually runs two different distribution models at meaningful scale out of the same operating footprint, and the seam between them lives in the yard. Cold-beverage DSD has its own rhythm: route trucks have to be sequenced and dispatched in a tight pre-dawn window so they hit retail at opening, which means the inbound line-haul from a bottling plant or partner-bottler depot has to land overnight and stage in dock-door order before the first driver arrives. Warehouse distribution for K-Cup pods and shelf-stable runs the opposite shape: continuous-process production feeding palletized outbound to retailer DCs and e-commerce nodes across the day, where the cost of a dock-door not being available shows up as a slowed production line, not a missed retail morning. At any KDP site that does both — and many of the larger ones do — the same doors get arbitrated against two operating rhythms with different urgency profiles, different trailer types, different staging discipline, and different financial consequences for getting it wrong.\n\nThat gap got more expensive over the last twelve months for three structural reasons that all converge on the same shared dock surface. First, the Kalil West acquisition (May 2024) put production, sales, and distribution under KDP roof in Arizona for the first time — ~4,500 outlets, 7.4M consumers, ~425 employees, a Tucson production plant feeding Tucson and Tempe distribution centers. That is a complete hybrid-distribution footprint to absorb in a region where KDP had no prior owned dock standard to inherit. Second, the GHOST Energy acquisition (October 2024) layers a high-velocity LRB SKU set onto KDP\'s own DSD network starting mid-2025, with up to $250M earmarked for the distribution transition; that SKU set has to land on yards that in many cases are already running K-Cup continuous warehouse outbound, which means the multi-channel arbitration at those sites tightens before it standardizes. Third, the JDE Peet\'s acquisition and planned coffee/beverage separation puts every cross-modal handoff under scrutiny: which doors belong to which company after the split, which yard standards survive it, and where the $200M coffee-side supply chain savings actually have to come from in practice.\n\nThe bottling-partner overlay — Dr Pepper volume flowing through Coca-Cola and PepsiCo bottlers in different territories — adds a fourth carrier-flow profile into KDP-owned yards at the sites that touch the partner network. None of those four flows is hard in isolation. The arbitration between them on a shared dock surface is the part where local routine and tribal knowledge currently does the work — and the four-channel coordination problem (DSD dawn, K-Cup continuous outbound, GHOST onboarding mid-2025, partner-bottler trailers) is exactly the shape of operating-system work the multi-channel logistics pedigree Kelly Killingsworth brought from Walmart, Nike, and Home Depot is built to solve. Kalil West is the cleanest place to set that standard before legacy routine hardens; the GHOST DSD onboarding is the timing driver for the rest.',
      pullQuote: 'DSD at dawn, K-Cup continuous outbound across the day, GHOST onto the same network mid-2025, partner-bottler trailers on top. The arbitration between those four rhythms is still a site-level operator decision.',
      caveat:
        'This is built from public KDP disclosures (the Kalil acquisition release, the GHOST transaction materials and Tim Cofer\'s public remarks, the JDE Peet\'s deal materials, the K-Cup manufacturing footprint, the March 2024 strategy review) and reasonable network inference about how DSD and warehouse rhythms interact on shared dock surfaces. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: how DSD-versus-warehouse dock priority is actually arbitrated today, how the mid-2025 GHOST DSD onboarding is being staged across the yards that already do K-Cup outbound, whether the Kalil Arizona footprint is being absorbed with a yard standard from day one or inheriting legacy Kalil routines first, and how much of the $200M coffee-side savings runs through the yard layer.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/keurig-dr-pepper-coverage-map.svg',
        imageAlt: 'Operating-system coverage map. Six tiles representing Keurig Dr Pepper hybrid-distribution operating-system domains. K-Cup Manufacturing, DSD Distribution, LRB Warehouse, GHOST Onboarding, and Multi-Channel Orchestration are covered. The Yard Network Ops tile is unfilled, marked with a KDP burgundy hairline outline.',
        caption: 'Operating-system coverage map · 1 tile unfilled.',
        source: 'Composition modeled from public KDP K-Cup manufacturing, DSD acquisition, GHOST distribution-transition, and Cofer strategy disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium spring and alkaline SKUs sit alongside ambient), and complicated by refillable-format returns logistics. Primo is also years ahead of every other CPG category on yard automation — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level systems. The shape overlap with Keurig Dr Pepper is in the structural seams, not in the freight itself: multi-site, multi-temp, mix of company-owned and partner-distributed volume, plants feeding both retail and DC, yard layer still running on local routines before the network-operating layer landed. Primo\'s freight is genuinely harder per trailer than KDP\'s. KDP\'s distribution model is genuinely more complex than Primo\'s. If a network operating model can run on the harder freight at Primo, the read-across to hybrid-distribution beverage at KDP is the easier lift in the freight dimension and a parallel lift in the coordination dimension — same operating model, different seam to arbitrate, and the Primo deployment is the public proof that the coordination layer can hold across multi-site beverage at scale.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at KDP are different in kind: (1) the newly acquired Arizona Kalil footprint, because the production plant + DSD distribution + sales operation under one roof in Tucson is the cleanest place to set a hybrid-distribution dock standard before legacy local routine hardens; (2) a K-Cup pod plant doing continuous warehouse-distribution outbound, because the production-stoppage cost of an unavailable dock is the most quantifiable single number in the network. We would expect the hybrid-distribution arbitration to become a measurable network metric within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'kdp-10k-network',
          source: 'Keurig Dr Pepper 10-K and public network disclosures',
          confidence: 'public',
          detail: 'Anchors the dual-HQ structure (Burlington MA + Plano TX), the brand portfolio, the hybrid DSD + warehouse-distribution model, and the post-2018 merger operating footprint.',
          url: 'https://www.keurigdrpepper.com/',
        },
        {
          id: 'kdp-kalil-2024',
          source: 'KDP Kalil Bottling acquisition (May 2024)',
          confidence: 'public',
          detail: 'First KDP-owned production, sales, and distribution operation in Arizona. Adds bottling and distribution rights for Canada Dry, 7UP, A&W, Snapple, and Core Hydration across ~4,500 outlets / 7.4M consumers. Operates a production facility in Tucson and sales/distribution centers in Tucson and Tempe; ~425 employees absorbed.',
          url: 'https://news.keurigdrpepper.com/2024-05-31-Keurig-Dr-Pepper-Strengthens-National-Direct-Store-Delivery-Operations-with-Acquisition-of-Strategic-Assets-from-Kalil-Bottling-Company',
        },
        {
          id: 'kdp-cofer-strategy',
          source: 'Tim Cofer CEO transition and 2024 strategy review',
          confidence: 'public',
          detail: 'Cofer assumed CEO April 2024 with a strategy review and investor update in March 2024. Operating mandate has explicitly emphasized DSD growth (anchored by the Kalil acquisition) and disciplined network optimization across both distribution lanes.',
          url: 'https://www.keurigdrpepper.com/leading-with-vision-tim-cofer-assumes-ceo-role-at-kdp/',
        },
        {
          id: 'kdp-jde-peets',
          source: 'KDP JDE Peet\'s acquisition + planned separation into Refreshment Beverage and Global Coffee companies',
          confidence: 'public',
          detail: 'Public investor materials cite ~$200M in coffee-side supply chain savings as part of a $400M total cost program post-separation, with explicit attention to manufacturing footprint and logistics network optimization. The split makes every cross-modal yard handoff a measured cost.',
          url: 'https://www.supplychaindive.com/news/keurig-dr-pepper-jde-peets-acquisition-supply-chain-benefits/804822/',
        },
        {
          id: 'kdp-ghost',
          source: 'KDP GHOST Energy acquisition (October 2024)',
          confidence: 'public',
          detail: 'Initial 60% stake for ~$990M with the remaining 40% to follow by 2028 based on 2027 performance. Public release commits up to $250M in distribution-transition investment to move GHOST Energy off existing third-party distribution agreements and onto KDP\'s own DSD network beginning mid-2025 — an incremental high-velocity LRB SKU set landing on KDP-owned yards.',
          url: 'https://news.keurigdrpepper.com/2024-10-24-Keurig-Dr-Pepper-to-Acquire-Disruptive-Energy-Drink-Business-GHOST',
        },
        {
          id: 'kdp-bottler-overlay',
          source: 'Dr Pepper bottling-partner distribution (Coca-Cola + PepsiCo bottlers)',
          confidence: 'public',
          detail: 'Public reporting cites approximately 45% of Dr Pepper sales moving through Coca-Cola bottlers and ~35% through PepsiCo bottlers, with the remainder running on KDP-owned DSD or warehouse routes. Partner-bottler flows touching KDP yards add a fourth carrier-flow profile to sites that interact with the partner network.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site beverage and CPG networks operate under, not KDP specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'killingsworth-tenure',
          source: 'Kelly Killingsworth — public tenure and remit',
          confidence: 'public',
          detail: 'SVP Logistics, Keurig Dr Pepper. Prior remit includes Global Vice President of Logistics at Nike and senior logistics roles at Walmart, Manhattan Associates, Home Depot, and i2 Technologies. Marketing degree, University of Georgia, Terry College of Business. The career arc — apparel velocity at Nike, retail-omnichannel scale at Walmart and Home Depot, planning-platform fluency from Manhattan and i2 — is the multi-channel operating-system pedigree the KDP hybrid-distribution coordination problem is shaped to recognize.',
          url: 'https://www.linkedin.com/in/kelly-killingsworth-5a68a4b',
        },
      ],
      unknowns: [
        'How DSD route-loading priority versus warehouse-distribution outbound priority is arbitrated today at sites that do both — site policy, system logic, or operator judgment',
        'Whether the newly acquired Kalil Arizona footprint is being set up with a yard-ops standard from day one, or absorbing legacy Kalil routines first',
        'How the mid-2025 GHOST DSD transition is being staged across the network — which yards absorb the SKU set first, and how dock priority is being arbitrated against existing K-Cup outbound at those sites',
        'Where in the K-Cup pod plant network production-stoppage events from dock unavailability concentrate today',
        'How much of the $200M coffee-side supply chain savings target depends on logistics-network and dock-execution improvements versus pure manufacturing footprint consolidation',
        'How Dr Pepper partner-bottler trailer flows interact with KDP-owned yards in the territories where both touch — and whether the carrier scorecards for those flows roll up to the same operator',
        'Where the operating-system seam will sit after the coffee/beverage separation: which yards belong to which company, and which yard standards survive the split',
        'Whether the C4 Energy DSD transition (completed earlier in the LRB platform build) left a reusable playbook for the GHOST onboarding, or whether each LRB-onto-DSD migration has been treated as a fresh integration',
        'How the SVP Logistics office is staging yard-standard rollout against the Kalil West integration, the GHOST onboarding, and the coffee/beverage separation — single program, parallel workstreams, or sequenced waves',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Keurig Dr Pepper is distinctive in this round because the question is not whether a yard operating model pays back (it does, the comparable is public, the math is repeatable) but whether a network that genuinely runs two distribution models — DSD at dawn, warehouse across the day, GHOST onboarding mid-2025, partner-bottler flows on top in Dr Pepper territories — can stabilize the four-channel dock arbitration as one operating standard. The Primo comparable is intentional: water is harder freight per trailer than anything in the KDP portfolio, and a network operating model already runs there. The freight delta is the easier lift; the coordination delta is the interesting one — and it is the same shape of multi-channel coordination problem the operating-system pedigree from Walmart, Nike, and Home Depot is built to recognize.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Kelly — the part most worth pushing back on is whether the multi-channel coordination discipline you carried out of the Walmart and Nike logistics organizations, and through the Manhattan Associates and i2 planning-platform years, has reached the KDP yard layer yet, or whether it has reached the SVP Logistics chair and is now waiting on the right operating-model seam to land against. The Kalil West integration, the mid-2025 GHOST DSD onboarding, and the eventual coffee/beverage separation each independently make the dock arbitration between DSD, K-Cup continuous outbound, and partner-bottler flows a measured network metric rather than a local routine. If any of the hypothesis math reads wrong — the four-channel framing, the Kalil-as-cleanest-pilot read, the GHOST onboarding as the timing driver, the $200M coffee-side savings dependency on yard execution — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'keurig-dr-pepper-001',
      name: 'Kelly Killingsworth',
      firstName: 'Kelly',
      lastName: 'Killingsworth',
      title: 'SVP Logistics, Keurig Dr Pepper (KDP)',
      company: 'Keurig Dr Pepper',
      email: 'kelly.killingsworth@kdrp.com',
      linkedinUrl: 'https://www.linkedin.com/in/kelly-killingsworth-5a68a4b',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain / Operations',
      previousCompanies: ['Nike', 'Walmart', 'Manhattan Associates', 'Home Depot', 'i2 Technologies'],
      educationHighlight: 'University of Georgia, Terry College of Business (Marketing)',
      currentMandate:
        'SVP Logistics with remit across KDP\'s hybrid distribution network — DSD cold-beverage routes and warehouse distribution for K-Cup pods and shelf-stable. Operating under Tim Cofer\'s post-April-2024 strategy mandate, with the Kalil West integration, the mid-2025 GHOST DSD onboarding, and the JDE Peet\'s acquisition / planned coffee-beverage separation as the three large structural changes in flight. Career pedigree spans Walmart and Home Depot retail-omnichannel scale, Nike apparel velocity, and Manhattan Associates / i2 planning-platform fluency — a multi-channel operating-system arc.',
      bestIntroPath: 'Direct outreach to the SVP Logistics office; routing through plant operations leadership if delegated.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'keurig-dr-pepper-001',
        name: 'Kelly Killingsworth',
        firstName: 'Kelly',
        lastName: 'Killingsworth',
        title: 'SVP Logistics, Keurig Dr Pepper (KDP)',
        company: 'Keurig Dr Pepper',
        email: 'kelly.killingsworth@kdrp.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'Kelly Killingsworth - SVP Logistics',
      variantSlug: 'kelly-killingsworth',

      framingNarrative:
        'Kelly, the multi-channel coordination discipline you carried out of Walmart and Nike — and built on the Manhattan Associates and i2 planning-platform years before that — is the same discipline KDP\'s hybrid distribution network now needs at the yard layer. DSD route loading at dawn, K-Cup continuous warehouse outbound across the day, GHOST Energy moving onto the same network mid-2025, partner-bottler flows on top in the Dr Pepper territories. Four channels, one set of doors, and the arbitration between them is still a site-level operator decision. The Kalil West acquisition just put a full DSD + production + distribution footprint under KDP roof in Arizona — the cleanest place to set that standard before legacy local routine hardens. The JDE Peet\'s separation will eventually force every cross-modal yard handoff to declare which side of the coffee/beverage split it belongs to.',
      openingHook:
        'Four distribution rhythms, the same dock surface. DSD has to be sequenced before retail opens; K-Cup warehouse outbound has to keep continuous-process production from stalling; the GHOST onboarding adds a new high-velocity LRB SKU set onto yards already running K-Cup outbound; partner-bottler trailers touch KDP yards in Dr Pepper territories on top. That is the same multi-channel coordination shape Walmart, Nike, and Home Depot all had to solve at the operating-system layer — KDP\'s version of it lives in the yard.',
      stakeStatement:
        'A K-Cup pod line that produces a thousand pods a minute does not have time to wait for an unavailable dock. A DSD route truck that misses the 5 AM dispatch window misses the retail morning. The mid-2025 GHOST DSD onboarding lands a new SKU set onto yards already arbitrating those two rhythms, with up to $250M earmarked for the transition. Those failure modes don\'t sit on the same P&L line, which is part of why the arbitration between them has been allowed to live as a site-level operator decision — and why the network-level layer above the sites is the operating-system tile the Cofer-era mandate now has the runway to install.',

      heroOverride: {
        headline: 'The yard layer is the multi-channel coordination tile KDP\'s hybrid distribution model has not laid yet.',
        subheadline:
          'Site-level DSD and warehouse routines work today, plant by plant. The network operating model above them — the one Kalil West, the mid-2025 GHOST DSD onboarding, and the JDE Peet\'s coffee/beverage separation each independently make a measured network metric instead of a local routine — is the unfilled tile. Kalil West is the cleanest place to embed it before legacy routine hardens; the K-Cup pod plants are where production-stoppage math makes the case quantifiable.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer network-operator framing. Kelly owns the hybrid model — don\'t explain DSD-versus-warehouse to her, name it back to her as the analytical wedge. The Walmart, Nike, Manhattan Associates, Home Depot, and i2 pedigree is a multi-channel operating-system arc; reference it as context for why the coordination problem is the part she will recognize, not as flattery. The Kalil West integration, the mid-2025 GHOST DSD onboarding, and the JDE Peet\'s separation are the three operating-environment facts she lives inside; reference them as context, not news.',
      kpiLanguage: [
        'DSD route-dispatch on-time',
        'warehouse outbound dock availability',
        'production-line stoppage minutes from yard',
        'trailer dwell on shared dock surfaces',
        'GHOST DSD onboarding cadence',
        'partner-bottler carrier scorecard',
        'multi-channel dock arbitration',
        'dock-office headcount during volume growth',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same network shape (multi-site, multi-temp, mix of owned and partner-distributed volume), harder freight per trailer, already running the network-level layer above site-level systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic. The headcount-neutral-during-volume-growth quote is the operational proof that most likely lands with a multi-channel logistics operator who has lived the Walmart and Nike scale-up math. Lead with the Kalil West greenfield embed; the GHOST DSD onboarding math is the urgency line.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Running the full network-level yard operating model at comparable beverage and CPG operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across similar multi-site networks' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at comparable beverage facilities' },
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
    facilityCount: '30+ U.S. manufacturing plants and distribution centers; K-Cup pod plants in Essex VT, Knoxville TN, Sumner WA; Spartanburg SC coffee roasting; recently added Tucson AZ production + Tucson/Tempe distribution (Kalil)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers', 'DSD Depots', 'K-Cup Pod Plants'],
    geographicSpread:
      'North America (dual HQ: Burlington MA / Plano TX; manufacturing footprint includes Vermont, Tennessee, Washington, South Carolina, Texas, Arizona, and additional U.S. sites)',
    dailyTrailerMoves: '1,000+ across the network — split between DSD route loading and warehouse-distribution outbound',
    fleet: 'KDP-owned DSD fleet for cold-beverage routes; contract carriers and 3PL for warehouse-distribution outbound; Coca-Cola and PepsiCo bottler-partner flows for portions of Dr Pepper volume',
  },

  freight: {
    primaryModes: ['Truckload', 'DSD Route', 'LTL', 'Intermodal/Rail'],
    avgLoadsPerDay: '1,000+ — split across DSD route trucks (dawn dispatch) and warehouse-distribution outbound (continuous through the day)',
    specialRequirements: ['Hybrid DSD + warehouse-distribution dock arbitration', 'Continuous-process K-Cup outbound dock availability', 'GHOST Energy DSD onboarding onto existing yards (mid-2025)', 'Partner-bottler carrier coordination in Dr Pepper territories'],
  },

  signals: {
    recentNews: [
      'Tim Cofer assumed CEO April 2024; March 2024 strategy review framed DSD growth and disciplined network optimization as the operating priorities.',
      'Kalil Bottling acquisition (May 2024) — first KDP-owned production, sales, and distribution operation in Arizona; ~4,500 outlets, 7.4M consumers, ~425 employees absorbed; Tucson production + Tucson/Tempe distribution.',
      'GHOST Energy acquisition (October 2024) — 60% stake for ~$990M with the remaining 40% by 2028; up to $250M earmarked to transition GHOST distribution onto KDP-owned DSD beginning mid-2025.',
      'JDE Peet\'s acquisition announced with planned separation into a Refreshment Beverage company and a Global Coffee company; ~$200M in coffee-side supply chain savings targeted as part of a $400M total post-separation cost program.',
      'Hybrid distribution model — Company-owned DSD for cold beverages, warehouse distribution for K-Cup pods and shelf-stable, partner-bottler distribution for portions of Dr Pepper volume across Coca-Cola and PepsiCo bottler networks.',
    ],
    urgencyDriver:
      'The hybrid-distribution operating model is unique enough at scale that the dock-arbitration math between DSD route loading and warehouse-distribution outbound has been allowed to live as a site-level operator decision for years. The Cofer strategy mandate, the Kalil integration, the GHOST DSD onboarding starting mid-2025, and the JDE Peet\'s coffee/beverage separation each independently make that arbitration a measured network metric rather than a local routine.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Hybrid distribution', body: 'DSD at dawn + K-Cup continuous outbound across the day on the same dock surface. Most CPG networks run one model; KDP runs both.' },
    { mark: 'Kalil West', body: 'Kalil Bottling (May 2024) — first KDP-owned production, sales, and distribution in Arizona. ~4,500 outlets · 7.4M consumers · ~425 employees absorbed. The cleanest place to embed a hybrid-dock standard.' },
    { mark: 'GHOST onto DSD', body: 'October 2024 announcement · up to $250M to transition GHOST Energy onto KDP-owned DSD starting mid-2025. A new LRB SKU set onto yards already running K-Cup continuous outbound.' },
    { mark: 'Cofer operating reset', body: 'CEO April 2024 · DSD growth + disciplined network optimization framed as the operating priorities.' },
    { mark: 'Killingsworth pedigree', body: 'SVP Logistics · prior at Nike (Global VP Logistics), Walmart, Manhattan Associates, Home Depot, i2 Technologies. A multi-channel operating-system arc the KDP coordination problem is shaped to recognize.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/keurig-dr-pepper.m4a',
    intro:
      'This brief is for Kelly Killingsworth. KDP runs one of the only true hybrid-distribution networks in CPG at scale — DSD at dawn, K-Cup continuous warehouse outbound across the day, GHOST Energy moving onto the same network mid-2025, partner-bottler trailers on top in the Dr Pepper territories. The roughly 46 minutes that follow are about where the arbitration between those four rhythms stops being a site-level operator decision.',
    chapters: [
      { id: 'thesis', label: 'Four distribution rhythms, the same dock surface', start: 0 },
      { id: 'what-hybrid-made', label: 'The seam between two distribution models lives in the yard', start: 553 },
      { id: 'kalil-and-ghost', label: 'Kalil West and the mid-2025 GHOST DSD onboarding', start: 1106 },
      { id: 'comparable', label: 'Primo Brands: harder freight, the operating layer already runs', start: 1659 },
      { id: 'about', label: 'The multi-channel coordination tile KDP has not laid yet', start: 2212 },
    ],
    generatedAt: '2026-05-14T23:55:00Z',
  },

  theme: {
    accentColor: '#9F1239',
  },
};
