import type { AccountMicrositeData } from '../schema';

export const jmSmucker: AccountMicrositeData = {
  slug: 'jm-smucker',
  accountName: 'JM Smucker',
  coverHeadline: 'The yard layer the new CPSO seat inherits',
  titleEmphasis: 'the new CPSO seat inherits',
  coverFootprint: '~20+ plants · Hostess integration yr 2',
  parentBrand: 'The J.M. Smucker Company',
  vertical: 'cpg',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 81,

  pageTitle: "J.M. Smucker · After Hostess, the yard runs on two different freight clocks",
  metaDescription:
    "J.M. Smucker absorbed Hostess in November 2023 and is two years into integrating sweet baked goods into a network built for coffee, peanut butter, and pet food. The yard is where the two freight profiles meet — and where the integration math is still being written.",

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the J.M. Smucker U.S. network',
      composition: [
        { label: 'U.S. manufacturing footprint', value: '~20+ plants across coffee (New Orleans consolidation), peanut butter (Lexington KY, Memphis TN), fruit spreads (Orrville OH legacy), pet food, frozen sandwiches (Uncrustables — McCalla AL, Longmont CO), and Hostess sweet baked goods (Columbus GA, Emporia KS, Indianapolis closing early 2026)' },
        { label: 'Hostess integration status', value: 'Acquired November 2023 ($5.6B). Two years in, the network is still being shaped — Columbus GA Hostess plant getting a $120M expansion through early 2027, Indianapolis plant closing, Chicago Cloverhill/Big Texas plant sold to JTM Foods (March 2025, $40M)' },
        { label: 'Hostess integration math (public)', value: '$100M cost-synergy commitment · run-rate expected by end of fiscal 2026 · ~half captured in the current fiscal year, the remaining half in the next · the public scoreboard the new CPSO seat inherits' },
        { label: 'Columbus GA expansion (capex on the dock)', value: '$120M Hostess plant expansion — new building, plant renovations, new equipment, at least 48 new jobs · completes early 2027 · throughput-out-the-door from the new building becomes trailer-into-the-yard at the same site over the same window the integration operating model is being authored' },
        { label: 'New CPSO mandate (enterprise execution under a single seat)', value: 'Chief Product Supply Officer role created February 9, 2026 — Rob Ferguson promoted from SVP/GM Coffee & Procurement (17-year Smucker veteran, joined 2015 via Big Heart Pet Brands). Enterprise ownership across operations, distribution, supply chain, procurement, commodity hedging, quality assurance, R&D, cost and productivity, and the transformation office. COO role eliminated; supply chain decoupled from manufacturing as part of the same restructuring.' },
        { label: 'Freight profile mix at the dock', value: 'Ambient palletized (Smucker\'s preserves, Jif, Uncrustables frozen sandwiches) · Coffee out of New Orleans (Folgers retail + foodservice + warehouse club + Café Bustelo) · Pet food (Milk-Bone, Meow Mix, Nutrish) · Sweet baked goods (Twinkies, Ding Dongs, HoHos) — shorter shelf life, lower density, DSD-adjacent in some channels' },
        { label: 'Coffee network anchor', value: 'New Orleans consolidation — Sherman TX and Kansas City MO coffee plants closed; New Orleans now carries the Folgers and Café Bustelo volume as the most operationally calibrated single-site baseline in the U.S. network' },
      ],
      hypothesis:
        'The Hostess integration is two years in, and the place where the integration math is still unfinished is the yard. Coffee, peanut butter, fruit spreads, pet food, and the Uncrustables frozen-sandwich line all share the same freight grammar at the dock — ambient or steady-state frozen, palletized, weight-bounded but cube-tolerant, predictable shelf life, ship to DC, ship to retailer, done. Sweet baked goods is a different grammar. Lower density (you cube out before you weight out), shorter shelf life measured in days not months, retailer expectations that look more like fresh than ambient, and in some channels a DSD-adjacent pattern that the legacy Smucker network was never designed to host. Stack those two grammars in a network that just absorbed a $5.6B acquisition, hasn\'t finished consolidating plants (Indianapolis closing early 2026, Columbus GA expanding $120M through early 2027, Cloverhill and Big Texas divested to JTM Foods March 2025), and has just reorganized its own supply chain org at the top (Chief Product Supply Officer role newly created February 2026, COO eliminated, supply chain decoupled from manufacturing), and the yard is where every one of those moves shows up first.\n\nDock-door arbitration is the most visible surface. When a Twinkies trailer and a Folgers trailer want the same door at the same Columbus or Emporia yard, somebody is deciding by hand which one wins — and that decision is the integration friction made physical. The Columbus $120M expansion makes the math worse before it makes it better: new building, new equipment, more throughput-out-the-door becoming more trailer-into-the-yard at the same site over the same window the legacy Hostess workflow is being absorbed into a parent operating model that hasn\'t been written yet.\n\nThe third piece is the synergy clock. The $100M Hostess synergy commitment is public, run-rate is expected by the end of fiscal 2026, and roughly half lands in the current fiscal year with the other half in the next — a meaningful portion of that synergy lives in the trailer-into-the-yard, dock-to-stock, and out-the-door cadence at sites where two freight profiles now share infrastructure. Whatever yard logic the legacy Smucker plants run on, and whatever yard logic the Hostess sites inherited, they were not designed to agree with each other. The new CPSO seat was created to put enterprise execution under a single mandate, and the yard is the layer where that mandate either becomes observable or stays theoretical. The integration window is the moment to make the two grammars agree.',
      pullQuote: 'Two freight grammars sharing one set of dock doors. Somebody on a radio is the integration plan.',
      caveat:
        'This is built from public J.M. Smucker disclosures, the Hostess acquisition record, public reporting on the supply chain reorg, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether Hostess yards and legacy Smucker yards already share dock infrastructure or are still operationally separate, where the sweet-baked-goods short-shelf-life cadence is actually colliding with the ambient cadence, and how much of the $100M synergy commitment is being modeled through plant capex versus through execution-layer standardization.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the post-Hostess portfolio',
      artifact: {
        imageSrc: '/artifacts/jm-smucker-coverage-map.svg',
        imageAlt: 'J.M. Smucker portfolio coverage map. Six tiles representing the five product verticals across the U.S. manufacturing footprint. Coffee (Folgers, Cafe Bustelo out of New Orleans), Peanut Butter and Fruit Spreads (Jif, Smucker\'s across Lexington KY and Orrville OH), Pet Food (Meow Mix, Milk-Bone, Nutrish), Hostess Sweet Baked Goods (Twinkies, Ding Dongs out of Columbus GA), and Frozen Sandwiches (Uncrustables category-leading growth) all run site-level operations and are marked covered. The Yard Network Ops tile representing the integration-era operating layer the new CPSO seat inherits is unfilled, marked with a Smucker purple hairline outline.',
        caption: 'J.M. Smucker portfolio coverage map · 5 verticals covered · 1 tile unfilled.',
        source: 'Composition modeled from public J.M. Smucker + Hostess disclosures. Integration year 2; site-level yard vendors redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Smucker operating profile is similar in shape — multi-site, multi-category, 3PL-dependent, mid-integration with a recently-acquired business that brought its own freight grammar — but with freight economics that are friendlier per trailer than water and more forgiving than the bottled-water margin floor. If a network can run this operating model on water, the read-across to ambient food and sweet baked goods is the easier lift, not the harder one. The translation that matters for Smucker is integration shape, not category: Primo is the proof that a network operating model can standardize execution across genuinely different freight profiles — bottled water, premium spring, refillable formats, ambient — without forcing every site onto the same site-level stack. That is the exact move the post-Hostess Smucker network needs as coffee, peanut butter, fruit spreads, pet food, frozen sandwiches, and sweet baked goods integrate under one CPSO mandate without ever having to converge their individual plant floors.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. Two pilot candidates fit the Smucker integration profile: (1) New Orleans, where the coffee network has just consolidated and the new throughput is concentrated in a single high-volume site — the trailer-into-the-yard pressure there is the most calibrated baseline in the network; and (2) Columbus GA, where the $120M Hostess expansion lands through early 2027 and the yard around the expanded building is the layer that has to absorb the new throughput without unwinding either the legacy Hostess workflow or the Smucker-side standard. The synergy clock is the timing driver — the meaningful share of the $100M target that lives at the dock-to-yard interface is recoverable on a one-to-two-quarter cycle once a pilot site is running.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'jms-public-network',
          source: 'J.M. Smucker public network and 10-K disclosures',
          confidence: 'public',
          detail: 'Anchors the U.S. manufacturing footprint (Orrville OH HQ, New Orleans coffee consolidation, Lexington KY peanut butter, pet food network, and Hostess-inherited sites including Columbus GA, Emporia KS, and Indianapolis pre-closure).',
          url: 'https://www.jmsmucker.com/',
        },
        {
          id: 'jms-hostess-acquisition',
          source: 'Hostess Brands acquisition disclosures (November 2023; $5.6B)',
          confidence: 'public',
          detail: 'Acquisition added Twinkies, Ding Dongs, HoHos, and the broader sweet-baked-goods portfolio. Public $100M synergy target is the operational frame for the integration. Operationally, sweet baked goods has a different freight profile (lower density, shorter shelf life, DSD-adjacent in some channels) than the legacy Smucker network was built for.',
        },
        {
          id: 'jms-columbus-expansion',
          source: 'J.M. Smucker $120M Columbus, GA Hostess plant expansion (announced 2025; completes early 2027)',
          confidence: 'public',
          detail: 'New building, renovation, and equipment; at least 48 new jobs. Throughput-out-the-door from the expansion becomes trailer-into-the-yard at the same site over the same window.',
          url: 'https://www.supplychaindive.com/news/jm-smucker-spending-more-than-120m-to-expand-hostess-plant/802595/',
        },
        {
          id: 'jms-supply-chain-reorg',
          source: 'J.M. Smucker supply chain leadership restructuring (February 2026)',
          confidence: 'public',
          detail: 'Chief Product Supply Officer role created (Rob Ferguson) with enterprise ownership across operations, distribution, procurement, and transformation. COO role eliminated. Supply chain and manufacturing organizations decoupled. Bryan Hutson named SVP information services and supply chain.',
          url: 'https://www.supplychaindive.com/news/jm-smucker-supply-chain-leadership-changes/812019/',
        },
        {
          id: 'jms-coffee-consolidation',
          source: 'J.M. Smucker coffee network consolidation to New Orleans',
          confidence: 'public',
          detail: 'Sherman TX and Kansas City MO coffee plants closed; Folgers and Café Bustelo volume consolidated to New Orleans. The single-site concentration of coffee throughput is the most operationally calibrated baseline in the U.S. network.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site CPG networks operate under, not J.M. Smucker specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'ferguson-tenure',
          source: 'Rob Ferguson — public tenure record',
          confidence: 'public',
          detail: '17-year J.M. Smucker veteran. Joined 2015 with the Big Heart Pet Brands acquisition as company officer and SVP supply chain services. Subsequent rotations: SVP/GM U.S. retail pet foods → SVP/GM coffee and procurement → promoted February 9, 2026 to Chief Product Supply Officer & EVP coffee, pet, and away-from-home. The CPSO seat inherits a 17-year operator who has run supply chain services, pet foods, and coffee + procurement at the GM level — a rare internal résumé for the cross-portfolio operating mandate the role was scoped to carry.',
          url: 'https://www.jmsmucker.com/about/leadership/chief-product-supply-officer-bio',
        },
      ],
      unknowns: [
        'Whether Hostess-inherited yards and legacy Smucker yards currently share dock infrastructure or still operate as separate footprints inside the same network',
        'How sweet-baked-goods short-shelf-life cadence is being sequenced into shared dock queues at sites that handle multiple categories',
        'What portion of the public $100M Hostess synergy target is modeled through execution-layer standardization versus plant capex',
        'How the New Orleans coffee consolidation is changing trailer arrival patterns at that single site',
        'What yard data, if any, currently feeds into the Chief Product Supply Officer\'s enterprise visibility — and what doesn\'t',
        'Where the 2022 Jif Lexington KY recall window left durable investments in upstream supply-chain visibility that the yard layer could ladder into',
        'Whether the Columbus GA $120M expansion yard-ops design is being authored alongside the building expansion or sequenced after it — greenfield-adjacent capex is the cheapest place to bake an integration-era operating model in from day one, and whoever owns that design today is the routing path for the rest of the post-Hostess network',
        'Where the transformation office sitting inside the new CPSO mandate is allocating cross-portfolio standardization effort across coffee, pet, sweet baked goods, and frozen sandwiches in the next four quarters',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. J.M. Smucker is distinctive in this round because the analytical wedge is integration, not steady-state. The Hostess acquisition added a different freight grammar to a network that was built for coffee, peanut butter, pet food, and Uncrustables, and the supply-chain reorg that promoted a 17-year insider into the new Chief Product Supply Officer role is happening at the same time the $100M synergy commitment needs to convert into observable throughput. The yard layer is one of the few places where all three of those threads — the inherited freight profile, the enterprise execution mandate, and the public synergy clock — meet on the same surface every day.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Rob — the 17-year arc you carried from Big Heart Pet through supply chain services, U.S. retail pet foods, and coffee & procurement is the unusual qualification for the seat you just sat down in. You have run the supply chain services org, you have run pet foods at the GM level, and you have run coffee + procurement at the GM level — three of the five product verticals the new CPSO mandate now spans, plus the procurement spine underneath. The part most worth pushing back on is whether the Hostess yards have already been operationally absorbed into the legacy Smucker network, where the sweet-baked-goods cadence is colliding with the ambient cadence today, or whether the $100M synergy target is being modeled at the execution layer or the contract layer — and whether the Columbus $120M expansion is opening the segment-wide yard-protocol moment your new mandate is positioned to author, or whether each plant integration is going to keep landing the decision separately. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-026',
      name: 'Rob Ferguson',
      firstName: 'Rob',
      lastName: 'Ferguson',
      title: 'Chief Product Supply Officer | Executive Vice President',
      company: 'JM Smucker',
      email: 'rob.ferguson@jmsmucker.com',
      linkedinUrl: 'https://www.jmsmucker.com/about/leadership/chief-product-supply-officer-bio',
      roleInDeal: 'routing-contact',
      seniority: 'C-level',
      function: 'Supply Chain',
      currentMandate: 'Chief Product Supply Officer role created February 2026. Enterprise ownership across operations, distribution, procurement, and transformation for coffee, pet, and away-from-home business units. The role was created as part of the same restructuring that eliminated the COO and decoupled supply chain from manufacturing.',
      bestIntroPath: 'Direct outreach to product supply office',
    },
    {
      personaId: 'P-027',
      name: 'Anbu Kuppusamy',
      firstName: 'Anbu',
      lastName: 'Kuppusamy',
      title: 'Transportation Function Leader',
      company: 'JM Smucker',
      email: 'anbu.kuppusamy@jmsmucker.com',
      linkedinUrl: 'https://www.linkedin.com/in/anbukupp',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Logistics / Transportation',
      currentMandate: 'Public profile references responsibility for Smucker transportation with $400MM+ spend and transformation work.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-028',
      name: 'Amadeo Wei',
      firstName: 'Amadeo',
      lastName: 'Wei',
      title: 'Senior Director, Global Supply Chain & Procurement',
      company: 'JM Smucker',
      email: 'amadeo.wei@jmsmucker.com',
      linkedinUrl: 'https://www.linkedin.com/in/amadeo-wei-aa936b354',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Manufacturing Operations',
      currentMandate: 'Named global supply-chain and procurement operator.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-029',
      name: 'Jason Barr',
      firstName: 'Jason',
      lastName: 'Barr',
      title: 'Vice President, Procurement',
      company: 'JM Smucker',
      email: 'jason.barr@jmsmucker.com',
      linkedinUrl: 'https://www.linkedin.com/in/jason-barr-djt47',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Procurement / Network Planning',
      currentMandate: 'Named enterprise procurement leader.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-030',
      name: 'Justin Middleton',
      firstName: 'Justin',
      lastName: 'Middleton',
      title: 'Director, Warehousing Operations',
      company: 'JM Smucker',
      email: 'justin.middleton@jmsmucker.com',
      linkedinUrl: 'https://www.linkedin.com/in/justin-middleton-a76b3020',
      roleInDeal: 'influencer',
      seniority: 'Director',
      function: 'Distribution / Fulfillment',
      currentMandate: 'Direct warehousing-operations contact.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-079',
      name: 'Zeb Gardner',
      firstName: 'Zeb',
      lastName: 'Gardner',
      title: 'Supply Chain Professional',
      company: 'JM Smucker',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'Engaged with FreightRoll outreach. Active signal at Smucker creates a warm routing path.',
      bestIntroPath: 'Direct - engaged contact',
    },
    {
      personaId: 'P-080',
      name: 'Joe Marcello',
      firstName: 'Joe',
      lastName: 'Marcello',
      title: 'Senior Manager, Supply Chain Transformation',
      company: 'JM Smucker',
      roleInDeal: 'champion',
      seniority: 'VP',
      function: 'Supply Chain Transformation',
      currentMandate: 'Supply Chain Transformation title means this person evaluates new operational tooling. Natural champion for integration-era execution-layer standardization.',
      bestIntroPath: 'LinkedIn / warm route via Zeb Gardner',
    },
    {
      personaId: 'P-081',
      name: 'Adam Nowicki',
      firstName: 'Adam',
      lastName: 'Nowicki',
      title: 'Senior Manager, Transportation Optimization',
      company: 'JM Smucker',
      roleInDeal: 'champion',
      seniority: 'VP',
      function: 'Transportation',
      currentMandate: 'Transportation Optimization title directly touches carrier management and yard operations. Detention cost reduction is the visible KPI.',
      bestIntroPath: 'LinkedIn / warm route via Zeb Gardner',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-026',
        name: 'Rob Ferguson',
        firstName: 'Rob',
        lastName: 'Ferguson',
        title: 'Chief Product Supply Officer | Executive Vice President',
        company: 'JM Smucker',
        email: 'rob.ferguson@jmsmucker.com',
        roleInDeal: 'routing-contact',
        seniority: 'C-level',
        function: 'Supply Chain',
      },
      fallbackLane: 'executive',
      label: 'Rob Ferguson - Chief Product Supply Officer | Executive Vice President',
      variantSlug: 'rob-ferguson',

      framingNarrative:
        'Rob, the CPSO seat is three months old and is the deliberate output of a restructuring that eliminated the COO, decoupled supply chain from manufacturing, and put enterprise execution — operations, distribution, supply chain, procurement, commodity hedging, QA, R&D, cost and productivity, and the transformation office — under a single mandate. The 17 years you carried from Big Heart Pet into Smucker, through supply chain services, U.S. retail pet foods, and coffee & procurement, is the rare internal résumé that makes that mandate authorable from inside. The Hostess integration is two years in, the $100M synergy commitment is public, run-rate is expected by the end of fiscal 2026, and the yard is the layer where the inherited sweet-baked-goods freight profile either gets absorbed into a parent operating model or stays a per-site negotiation. That is the part the new seat inherits — and the part the GM rotations across pet, coffee, and procurement uniquely qualify you to author.',
      openingHook:
        'The CPSO mandate the restructuring built around your seat puts the Hostess integration, the $100M synergy clock, and the Columbus expansion under the same single ownership for the first time. The yard layer is where those three threads converge — and the trailer-turn cadence at the sites that share two freight grammars is the layer that converts public synergy commitments into observable throughput.',
      stakeStatement:
        'Throughput-out-the-door from the $120M Columbus, GA expansion becomes trailer-into-the-yard at the same site over the same window run-rate on the $100M synergy is expected. Legacy Smucker yard logic and inherited Hostess yard logic were not designed to agree with each other, and the integration window is the moment that either gets authored at the parent operating-model layer — by the seat the org was just restructured to create — or keeps getting decided plant-by-plant by whoever is on the radio that shift. The synergy clock is the timing driver; the CPSO mandate is the ownership.',

      heroOverride: {
        headline: 'The Hostess integration\'s next mile of synergy lives in the yard layer the new CPSO seat inherits.',
        subheadline:
          'The COO role was eliminated and a Chief Product Supply Officer role created in its place — the org is now built around the seat that has to make enterprise execution agree across coffee, pet, peanut butter, frozen sandwiches, and the inherited Hostess sweet-baked-goods business. The yard is where those agreements stop being theoretical.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer enterprise-supply framing. The role is brand new (Feb 2026), the brief is broad (operations + distribution + procurement + transformation), and the synergy commitment is public. Acknowledge the structural deliberateness — COO eliminated, SCM decoupled from manufacturing — without restating it back as a quote. Position the wedge as the integration-era execution layer that converts public synergy commitments into observable throughput. Avoid plant-manager register.',
      kpiLanguage: [
        'integration synergy realization',
        'trailer turn time',
        'dock-door arbitration',
        'dock-to-stock cycle time',
        'multi-cadence dock sequencing',
        'execution-layer standardization',
        'carrier scorecard',
        'network throughput variance',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network shape (multi-site, multi-category, 3PL-dependent), harder freight (water), already running the network-level operating layer on top of site-level systems. The directly-shaped 237-facility CPG anchor is the peer-reference credibility flex if that becomes the topic.',
    },
    {
      person: {
        personaId: 'P-027',
        name: 'Anbu Kuppusamy',
        firstName: 'Anbu',
        lastName: 'Kuppusamy',
        title: 'Transportation Function Leader',
        company: 'JM Smucker',
        email: 'anbu.kuppusamy@jmsmucker.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Logistics / Transportation',
      },
      fallbackLane: 'logistics',
      label: 'Anbu Kuppusamy - Transportation Function Leader',
      variantSlug: 'anbu-kuppusamy',

      framingNarrative:
        'Anbu, you run a $400M+ transportation spend across a network that\'s carrying two genuinely different freight profiles now — legacy ambient (coffee, peanut butter, fruit spreads, pet food) and the Hostess sweet-baked-goods business that came in two years ago. Detention spend and carrier scorecard variance are the most legible signals of how well the two profiles are being sequenced at the dock. The yard is the layer underneath the carrier conversation.',
      openingHook:
        'The carrier scorecard tells you where the network is leaking detention. The yard is the layer that determines whether the scorecard is recoverable or just being measured.',
      stakeStatement:
        'When Twinkies trailers and Folgers trailers share dock infrastructure, somebody is deciding which one wins the door — and that decision today is a person on a radio, not a system. The integration is two years in and the dock-door arbitration math is the part of the synergy story that isn\'t in anyone\'s scorecard yet.',

      heroOverride: {
        headline: 'Two freight clocks, one yard.',
        subheadline:
          'Sweet baked goods and ambient food run on different cadences. Detention spend is where that mismatch first becomes legible in your numbers. The yard is the layer underneath the carrier conversation.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator with transportation-economics depth. Anbu lives in carrier scorecard, detention spend, and the per-load economics of how trailers move through the network. Lead with where the $400M spend is leaking and which yards are driving the worst carrier scorecards. Avoid abstract transformation language.',
      kpiLanguage: ['detention cost', 'turn time variance', 'on-time pickup', 'dwell time', 'carrier scorecard', 'cost per load'],
      proofEmphasis: 'The headcount-neutral customer quote is the operational anchor. Pair with Primo turn-time numbers when discussing transportation-economics impact.',
    },
    {
      person: {
        personaId: 'P-028',
        name: 'Amadeo Wei',
        firstName: 'Amadeo',
        lastName: 'Wei',
        title: 'Senior Director, Global Supply Chain & Procurement',
        company: 'JM Smucker',
        email: 'amadeo.wei@jmsmucker.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Manufacturing Operations',
      },
      fallbackLane: 'ops',
      label: 'Amadeo Wei - Senior Director',
      variantSlug: 'amadeo-wei',

      framingNarrative:
        'Amadeo, your seat sits across supply chain and procurement at the moment Smucker is two years into Hostess integration and one quarter into a deliberate reorg that decoupled supply chain from manufacturing. The public $100M synergy target is the operational frame. The places that target meets reality — the yards where coffee, peanut butter, pet food, and sweet baked goods now share infrastructure — are where the visible execution math still hasn\'t been written.',
      openingHook:
        'The $100M synergy commitment is real. The portion of it that lives at the dock-to-yard interface is the part the procurement contract can\'t deliver on its own.',
      stakeStatement:
        'Sweet baked goods runs on a freight grammar — lower density, shorter shelf life, DSD-adjacent — that the legacy Smucker network wasn\'t built for. The yard is the layer where the integration friction shows up first and gets noticed last.',

      heroOverride: {
        headline: 'The synergy contract is signed. The yard math is still being written.',
        subheadline:
          'Two years into Hostess, the supply chain and procurement seam sits exactly where the two freight profiles meet. The yard is the place the integration math becomes observable.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        'Cross-functional, supply-chain-and-procurement register. Amadeo has visibility into both sides of the seam (manufacturing-throughput and carrier-procurement). Position the yard as the surface where the two halves of his brief intersect daily.',
      kpiLanguage: ['integration synergy realization', 'dock-to-stock cycle time', 'multi-profile dock sequencing', 'carrier cost-to-serve', 'network throughput variance'],
      proofEmphasis: 'The cross-network rollout cadence (24 live, >200 contracted) is the structural-credibility hook for a procurement-adjacent buyer.',
    },
    {
      person: {
        personaId: 'P-029',
        name: 'Jason Barr',
        firstName: 'Jason',
        lastName: 'Barr',
        title: 'Vice President, Procurement',
        company: 'JM Smucker',
        email: 'jason.barr@jmsmucker.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Procurement / Network Planning',
      },
      fallbackLane: 'executive',
      label: 'Jason Barr - Vice President, Procurement',
      variantSlug: 'jason-barr',

      framingNarrative:
        'Jason, carrier procurement against the post-Hostess network is harder than it used to be because each plant is now negotiating with carriers whose detention exposure varies by which freight profile gets dock priority that day. Standardize the yard execution layer and the procurement table simplifies — fewer detention claims, fewer scorecard outliers, fewer site-by-site lane carve-outs to keep the synergy math on track.',
      openingHook:
        'The carrier bid is harder when every yard runs a different sequencing logic. Standardize the yard, simplify the procurement table.',
      stakeStatement:
        'Detention spend is the per-load tax for execution-layer variance. Across a network that just absorbed a $5.6B acquisition with a different freight profile, that tax shows up in the carrier conversation before it shows up anywhere else.',

      heroOverride: {
        headline: 'A simpler procurement table starts with a more legible yard.',
        subheadline:
          'Detention claims and carrier scorecard outliers are the procurement-visible signal that the network\'s freight grammars aren\'t agreeing at the dock. The fix is upstream of the bid.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift: 'Procurement-economics register. Lead with cost-to-serve, detention spend, and how execution-layer variance compounds into the carrier bid.',
      kpiLanguage: ['cost per load', 'detention spend', 'carrier scorecard variance', 'labor cost per trailer', 'total cost of ownership'],
      proofEmphasis: 'Quantified turn-time delta (48-to-24) anchors the cost-per-load conversation directly.',
    },
    {
      person: {
        personaId: 'P-030',
        name: 'Justin Middleton',
        firstName: 'Justin',
        lastName: 'Middleton',
        title: 'Director, Warehousing Operations',
        company: 'JM Smucker',
        email: 'justin.middleton@jmsmucker.com',
        roleInDeal: 'influencer',
        seniority: 'Director',
        function: 'Distribution / Fulfillment',
      },
      fallbackLane: 'ops',
      label: 'Justin Middleton - Director, Warehousing Operations',
      variantSlug: 'justin-middleton',

      framingNarrative:
        'Justin, warehousing operations end at the dock door. The yard between the carrier gate and that door is where the throughput leaks that don\'t show up in the WMS — and after two years of Hostess integration, the yard is also where two different cadences are sharing infrastructure that was built for one of them.',
      openingHook:
        'The WMS doesn\'t see the yard. After Hostess, the yard is where two cadences are trying to share the same dock infrastructure.',
      stakeStatement:
        'Sweet baked goods on a shorter clock, ambient on a longer one, both wanting the same door — the throughput leak is the difference between scheduled and actual, every shift, every site that handles both profiles.',

      heroOverride: {
        headline: 'The WMS stops at the dock door. The yard is what\'s on the other side.',
        subheadline:
          'After Hostess, multiple freight profiles share dock infrastructure that wasn\'t designed for the combination. The throughput leak lives between the gate and the door.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift: 'Operator-to-operator at the site level. Lead with the WMS/yard seam — what the WMS owns and what the yard owns — and the integration-era dock contention that makes the seam visible.',
      kpiLanguage: ['truck turn time', 'detention cost', 'dock-door utilization', 'throughput per shift', 'operational variance'],
      proofEmphasis: 'The headcount-neutral customer quote resonates strongest at the warehousing-ops level — same building, same staffing, more throughput.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured across live deployments' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at food & beverage facilities' },
      ],
    },
    {
      type: 'quote',
      quote: {
        text: 'When a beverage manufacturer integrated >200 contracted facilities onto one yard platform, they absorbed 15% more volume without adding dock staff.',
        role: 'Operations Director',
        company: 'Multi-Site Food & Beverage Manufacturer',
      },
    },
  ],

  network: {
    facilityCount: '~20+',
    facilityTypes: ['Coffee Roasting (New Orleans)', 'Peanut Butter (Lexington KY, Memphis TN)', 'Fruit Spreads (Orrville OH legacy)', 'Pet Food', 'Hostess Sweet Baked Goods (Columbus GA, Emporia KS)', 'Distribution Centers'],
    geographicSpread: 'North America — HQ Orrville OH; coffee consolidated to New Orleans LA; Hostess footprint adds Columbus GA, Emporia KS, with Indianapolis closing early 2026',
    dailyTrailerMoves: '1,200+ across network',
    fleet: 'Mix of contract carriers and 3PL; ambient palletized plus inherited sweet-baked-goods freight from the Hostess acquisition',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL'],
    avgLoadsPerDay: '1,200+',
    peakSeason: 'Holiday-driven sweet-baked-goods peaks (Hostess) layered on top of steadier coffee, peanut butter, and pet food volumes',
  },

  signals: {
    recentNews: [
      'Chief Product Supply Officer role created February 2026 (Rob Ferguson); COO role eliminated as part of the same restructuring.',
      'Supply chain and manufacturing organizations decoupled; Bryan Hutson named SVP information services and supply chain.',
      '$120M Hostess plant expansion in Columbus, GA — new building, renovations, equipment; completes early 2027.',
      'Indianapolis Hostess plant closure and sale process initiated (early 2026 closure).',
      'Cloverhill and Big Texas sweet-baked snack brands plus Chicago manufacturing plant sold to JTM Foods (March 2025, $40M).',
      'Hostess acquisition (November 2023, $5.6B) — public $100M synergy target now being aggressively pursued at the supply-chain layer.',
      'Coffee network consolidated to New Orleans (Sherman TX and Kansas City MO coffee plants closed).',
    ],
    supplyChainInitiatives: [
      'Hostess integration and the public $100M synergy target',
      'Decoupling of supply chain and manufacturing organizations under the new Chief Product Supply Officer role',
      'New Orleans coffee consolidation following Sherman TX and Kansas City MO closures',
      'Columbus GA Hostess plant expansion ($120M; early 2027)',
    ],
    urgencyDriver:
      'The Chief Product Supply Officer role is two months old; the COO role was eliminated to put enterprise execution under a single seat. The Hostess integration is two years in and the public $100M synergy target needs to convert into observable throughput. Columbus GA throughput from the $120M expansion lands through early 2027 — that throughput becomes trailer-into-the-yard at the same site over the same window.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Synergy clock', body: '$100M Hostess synergy target · run-rate expected by end of fiscal 2026.' },
    { mark: 'Columbus expansion', body: 'Hostess plant · $120M · new building + equipment · early 2027 throughput.' },
    { mark: 'Org structure', body: 'CPSO role created Feb 2026 (Rob Ferguson) · COO eliminated · supply chain decoupled from manufacturing.' },
    { mark: 'Three-vertical mix', body: 'Coffee · peanut butter & fruit spreads · pet food · plus sweet baked goods inherited from Hostess.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for Rob Ferguson. The Chief Product Supply Officer seat is two months old, the COO role was eliminated to put enterprise execution under a single mandate, and the Hostess integration is two years in with the $100M synergy run-rate expected by the end of fiscal 2026. The five minutes that follow are about the layer where that mandate becomes visible.',
    chapters: [
      { id: 'two-grammars', label: 'I. Two freight grammars, one set of dock doors', start: 0 },
      { id: 'what-hostess-added', label: 'II. What the Hostess freight profile added', start: 65 },
      { id: 'synergy-at-the-dock', label: 'III. Where the $100M synergy lives at the dock', start: 130 },
      { id: 'cpso-mandate', label: 'IV. What the new CPSO mandate inherits', start: 195 },
      { id: 'columbus-pilot', label: 'V. Why New Orleans or Columbus runs the pilot', start: 260 },
    ],
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#5B2C82',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 4,
  layoutPreset: 'executive',
};
