import type { AccountMicrositeData } from '../schema';

export const jmSmucker: AccountMicrositeData = {
  slug: 'jm-smucker',
  accountName: 'JM Smucker',
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
        { label: 'U.S. manufacturing footprint', value: '~20+ plants across coffee (New Orleans consolidation), peanut butter (Lexington KY, Memphis TN), fruit spreads (Orrville OH legacy), pet food, and Hostess sweet baked goods (Columbus GA, Emporia KS, Indianapolis closing early 2026)' },
        { label: 'Hostess integration status', value: 'Acquired November 2023 ($5.6B). Two years in, the network is still being shaped — Columbus GA Hostess plant getting a $120M expansion through early 2027, Indianapolis plant closing, Chicago Cloverhill/Big Texas plant sold to JTM Foods (March 2025)' },
        { label: 'Freight profile mix at the dock', value: 'Ambient palletized (Smucker\'s preserves, Jif, Uncrustables) · Coffee out of New Orleans (Folgers retail + foodservice + warehouse club + Café Bustelo) · Pet food (Milk-Bone, Meow Mix, Nutrish) · Sweet baked goods (Twinkies, Ding Dongs, HoHos) — shorter shelf life, lower density, DSD-adjacent in some channels' },
        { label: 'Coffee network anchor', value: 'New Orleans consolidation — Sherman TX and Kansas City MO coffee plants closed; New Orleans now carries the Folgers and Café Bustelo volume' },
        { label: 'Org structure under change', value: 'Chief Product Supply Officer role created February 2026 (Rob Ferguson) covering operations, distribution, procurement, and transformation. Supply chain and manufacturing organizations being decoupled. COO role eliminated as part of the same restructuring.' },
        { label: 'Public synergy target', value: '$100M Hostess synergies — disclosed and being aggressively pursued at the supply-chain layer' },
      ],
      hypothesis:
        'The Hostess integration is two years in, and the place where the integration math is still unfinished is the yard. Coffee, peanut butter, fruit spreads, and pet food all share the same freight grammar at the dock — ambient, palletized, weight-bounded but cube-tolerant, predictable shelf life, ship to DC, ship to retailer, done. Sweet baked goods is a different grammar. Lower density (you cube out before you weight out), shorter shelf life, retailer expectations that look more like fresh than ambient, and in some channels a DSD-adjacent pattern that the legacy Smucker network was never designed to host. Stack those two grammars in a network that just absorbed a $5.6B acquisition, hasn\'t finished consolidating plants (Indianapolis closing, Columbus GA expanding $120M, Cloverhill divested), and is reorganizing its own supply chain org at the top (Chief Product Supply Officer role newly created, COO eliminated), and the yard is where every one of those moves shows up first. Dock-door arbitration is the most visible surface. When a Twinkies trailer and a Folgers trailer want the same door at the same Columbus or Emporia yard, somebody is deciding by hand which one wins — and that decision is the integration friction made physical. The third piece is forward-looking: the $100M synergy commitment is public, and a meaningful portion of that synergy lives in the trailer-into-the-yard, dock-to-stock, and out-the-door cadence at sites where the two freight profiles share infrastructure. Whatever yard logic the legacy Smucker plants run on, and whatever yard logic the Hostess sites inherited, they were not designed to agree with each other. The integration window is the moment to make them agree.',
      caveat:
        'This is built from public J.M. Smucker disclosures, the Hostess acquisition record, public reporting on the supply chain reorg, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether Hostess yards and legacy Smucker yards already share dock infrastructure or are still operationally separate, where the sweet-baked-goods short-shelf-life cadence is actually colliding with the ambient cadence, and how much of the $100M synergy commitment is being modeled through plant capex versus through execution-layer standardization.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is also years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level yard operating model on top of their existing site-level yard systems. The Smucker operating profile is similar in shape — multi-site, multi-category, 3PL-dependent, mid-integration with a recently-acquired business that brought its own freight grammar — but with freight economics that are friendlier per trailer than water and more forgiving than the bottled-water margin floor. If a network can run this operating model on water, the read-across to ambient food and sweet baked goods is the easier lift, not the harder one.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
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
      ],
      unknowns: [
        'Whether Hostess-inherited yards and legacy Smucker yards currently share dock infrastructure or still operate as separate footprints inside the same network',
        'How sweet-baked-goods short-shelf-life cadence is being sequenced into shared dock queues at sites that handle multiple categories',
        'What portion of the public $100M Hostess synergy target is modeled through execution-layer standardization versus plant capex',
        'How the New Orleans coffee consolidation is changing trailer arrival patterns at that single site',
        'What yard data, if any, currently feeds into the Chief Product Supply Officer\'s enterprise visibility — and what doesn\'t',
        'Where the 2022 Jif Lexington KY recall window left durable investments in upstream supply-chain visibility that the yard layer could ladder into',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. J.M. Smucker is distinctive in this round because the analytical wedge is integration, not steady-state. The Hostess acquisition added a different freight grammar to a network that was built for coffee, peanut butter, and pet food, and the supply-chain reorg that created the Chief Product Supply Officer role is happening at the same time the $100M synergy commitment needs to convert into observable throughput. The yard layer is one of the few places where all three of those threads meet on the same surface every day.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Smucker — particularly whether the Hostess yards have already been operationally absorbed into the legacy network, where the sweet-baked-goods cadence is colliding with the ambient cadence today, or how the $100M synergy target is being modeled at the execution layer — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
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
        'Rob, your role is two months old and the organization underneath it was deliberately reshaped — COO eliminated, supply chain and manufacturing decoupled — to put enterprise execution under a single seat. The Hostess integration is two years in, the $100M synergy commitment is public, and the network is still absorbing a freight profile (sweet baked goods) that wasn\'t in the building when the legacy Smucker yard practices were written. The yard layer is where the integration math becomes visible.',
      openingHook:
        'The Hostess integration\'s next mile of synergy isn\'t a procurement contract or a plant capex line. It\'s the cadence at which trailers turn at the sites where two freight grammars now share dock doors.',
      stakeStatement:
        'Throughput-out-the-door from the $120M Columbus, GA expansion becomes trailer-into-the-yard at the same site over the same window. Legacy Smucker yard logic and inherited Hostess yard logic were not designed to agree with each other. The synergy clock is the timing driver.',

      heroOverride: {
        headline: 'The Hostess integration\'s next mile of synergy lives in the yard.',
        subheadline:
          'The COO role was eliminated and a Chief Product Supply Officer role created in its place — the org structure is now built around the seat that has to make execution agree across coffee, pet, peanut butter, and sweet baked goods. The yard is where those agreements stop being theoretical.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

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
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
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

  theme: {
    accentColor: '#7C3AED',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 4,
  layoutPreset: 'executive',
};
