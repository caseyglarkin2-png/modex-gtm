/**
 * John Deere — ABM Microsite Data
 * Quality Tier: A (Tier 3 Band D — heavy-equipment reach account uplifted
 * to A+ memo treatment because the Smart Industrial contradiction is
 * unusually crisp and the named decision-maker has 28+ years of tenure
 * including authorship of the precision-ag stack).
 *
 * Pitch shape: observational diagnosis — the gap between in-field
 * autonomy (See & Spray on 5M acres in 2025, autonomy retrofit kits
 * unveiled CES 2025 with broader 2026 availability, 1M+ connected
 * machines on the John Deere Operations Center) and the manual yards
 * between the Waterloo / Davenport / Dubuque / East Moline assembly
 * halls and the dealer-delivery network. The yard between build and
 * dealer delivery is the unsolved seam beside the Smart Industrial
 * operating model.
 *
 * Angle: NETWORK-LEVEL YARD OPERATING MODEL on heavy-equipment freight.
 * Built-to-order tractors and construction machines mean yard sequence
 * = customer delivery sequence; variance compounds outward into dealer
 * commitments and the farmer's planting window or the contractor's
 * jobsite start date.
 *
 * Phase 10 A+ uplift adds: cover hook on Smart Industrial as the
 * operating-system thread; observation pull-quote; coverage-map artifact
 * (5 Smart Industrial layers covered + YARD NETWORK OPS unfilled in
 * Deere green #367C2B); composition rows on Smart Industrial coverage +
 * See & Spray + 5M-acres + Milan parts DC scale + Quad Cities density;
 * Cory Reed tenure source; first-name personalized about + signOff;
 * marginalia; per-account audio brief intro.
 */
import { AUDIO_BRIEF_CHAPTERS, AUDIO_BRIEF_SRC } from '../audio-brief';
import type { AccountMicrositeData } from '../schema';

export const johnDeere: AccountMicrositeData = {
  slug: 'john-deere',
  accountName: 'John Deere',
  coverHeadline: 'The yard layer above Smart Industrial',
  titleEmphasis: 'above Smart Industrial',
  coverFootprint: '~60 US sites · Quad Cities',
  parentBrand: 'John Deere',
  vertical: 'heavy-equipment',
  tier: 'Tier 3',
  band: 'D',
  priorityScore: 63,

  pageTitle: 'John Deere · Smart Industrial in the field, manual gate at the yard',
  metaDescription:
    'Deere has connected 1M+ machines and runs See & Spray autonomy across 5M acres. The yards between Waterloo, Davenport, Dubuque, and the 2.8M sq ft Milan parts DC still operate on paper logs and radio dispatch.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the John Deere network',
      composition: [
        {
          label: 'Smart Industrial coverage',
          value: 'Smart Industrial operating model launched 2020 — production systems, technology stack, and lifecycle solutions on a single operating thread. Five years in, the asset and the parts catalog are inside the model; the yard layer between Waterloo, Davenport, Dubuque, East Moline, Milan, and the dealer network sits beside it, not inside it',
        },
        {
          label: 'See & Spray + in-field autonomy',
          value: 'See & Spray ran across 5M acres in 2025 with ~50% herbicide reduction and 31M gallons of mix saved per public Deere reporting; autonomy retrofit kits unveiled at CES 2025 with broader 2026 availability across tractors, tillage tools, and orchard sprayers. The asset is on the operating system; the yard between the factory and the dealer is not',
        },
        {
          label: 'Operations Center connectivity',
          value: '1M+ connected machines reporting in to the John Deere Operations Center; 500M engaged acres on the platform per the December 2025 investor day. The data tier above the asset is mature; the data tier above the yard between the asset and the dealer is empty',
        },
        {
          label: 'U.S. manufacturing + Quad Cities density',
          value: '~60 U.S. facilities; Moline IL global HQ; Quad Cities region density across Moline, East Moline, and Milan — the Harvester Works combine line at East Moline, the Milan parts DC, and HQ on one regional corridor. The Cedar Valley anchor at Waterloo IA (Tractor Operations, the largest John Deere complex globally) is one cleat north',
        },
        {
          label: 'Construction & forestry anchors',
          value: 'Davenport IA (articulated dump trucks, motor graders, 4WD loaders, skidders, attachments distribution); Dubuque IA (backhoes, crawler dozers, skid-steers, compact track loaders) — built-to-order finished machines staged in the yard before flatbed pickup',
        },
        {
          label: 'Milan IL parts DC scale',
          value: 'Milan IL Parts Distribution Center — 2.8M sq ft, 800,000+ unique part numbers, ~80,000 lines shipped daily / ~450,000 lines per week serving the global dealer network. The multi-year dealer-parts-inventory build has put more lines through Milan than at any point in its history',
        },
        {
          label: 'Dealer network',
          value: 'Independent dealer organizations across North America operating hundreds of branches — every finished machine has to land in one of those yards, and every Milan outbound parts line has to clear the Milan dock before it reaches them',
        },
      ],
      hypothesis:
        "The interesting thing about John Deere’s yard math is the same shape as the Caterpillar contradiction, but louder. Deere is now five years into the Smart Industrial operating model. The asset in the field is connected — over a million machines reporting in to the Operations Center, See & Spray running AI on 5M acres in 2025 and trimming herbicide use by roughly half, autonomy retrofit kits unveiled at CES 2025 with broader 2026 availability. The dealer-parts inventory build that has run for the last several years has put more SKUs through Milan IL than at any point in the company’s history — 800,000+ unique parts, ~80,000 lines a day, ~450,000 lines a week, on a 2.8M sq ft floor. That is operating-system-grade thinking on the machine and on the parts catalog. The yard outside the machine and outside the warehouse has not moved at the same pace.\n\nThat gap matters in heavy equipment in a way it does not matter in CPG. A typical grocery trailer is one truck, one cube, one dock door. A 9RX tractor — including the 9RX830 at 830 HP, the largest tractor Deere has ever built — is a multi-spot footprint on a specialized flatbed or low-boy, with delivery customization (front weights, duals, GPS receivers, See & Spray heads if specced) often staged in the yard between the line and the dealer pickup. A combine coming out of East Moline Harvester Works is bigger. A 4WD articulated dump truck out of Davenport is bigger still. Fewer load events per day than a CPG plant, but each event blocks more dock real estate, longer setup and breakdown, and almost every machine is built to a specific dealer order on a specific customer commitment. That means yard sequence at Waterloo or Davenport *is* dealer-delivery sequence, and dealer-delivery sequence *is* the farmer’s planting window or the contractor’s jobsite start date. A reshuffle at the gate doesn’t just delay a trailer; it slips a commitment two layers downstream.\n\nParallel pressure is showing up on the other side of the network. The Milan parts DC, by virtue of the multi-year dealer-inventory build, has more outbound velocity than at any time in its history — and the dock-and-yard math at a 2.8M sq ft facility moving 80,000 lines a day is materially harder than at any single comparable site we have looked at in the category. Trailer staging at Milan, dock arbitration at Waterloo Works, yard sequencing for the 9RX onto a flatbed, dealer-handoff staging across the Quad Cities corridor — those still run on radios, paper logs, and the tribal knowledge of the spotters who have been on site the longest. The CPG playbook for network-level yard digitization translates here; the dock-arbitration logic has to be rebuilt for per-LOAD-hardest freight (Waterloo, Davenport, Dubuque, East Moline) and per-VELOCITY-hardest parts (Milan) running on the same operating model.",
      pullQuote:
        "The asset is on the operating system. The yard between the asset and the dealer is not.",
      caveat:
        "This is built from public John Deere disclosures, the CES 2025 autonomy announcements, the publicly visible Milan / Waterloo / Davenport / Dubuque / East Moline operations, public Deere reporting on the Smart Industrial strategy and the Operations Center connected-machine count, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don’t match what your team is seeing: how much yard-tech is already in place at Milan versus the assembly plants, whether the Operations Center / Smart Industrial digital stack has touched any yard operations on the factory side, and how dealer-handoff staging is actually orchestrated across the Quad Cities corridor and the Greeneville / Augusta / Coffeyville specialty plants.",
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system',
      artifact: {
        imageSrc: '/artifacts/john-deere-coverage-map.svg',
        imageAlt:
          'Smart Industrial coverage map. Six tiles representing John Deere operating-system layers. Smart Industrial, See & Spray, Operations Center, Autonomy Retrofit, and Parts DC Scale are covered. The Yard Network Ops tile is unfilled, marked with a John Deere green hairline outline.',
        caption: 'Smart Industrial coverage map · 1 layer unfilled.',
        source:
          'Composition modeled from public Smart Industrial + Operations Center + CES 2025 disclosures. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        "Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water maxes gross vehicle weight before it maxes cube, it is low-margin (so every minute of yard waste is a margin point unrecoverable with price), and it is shipped across multi-temp lanes with refillable return logistics. Primo is also years ahead of every other CPG category on yard automation and network-level digitization — they had to be, because the category cost them first. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and regional DCs, and they have layered a network-level yard operating model on top of their site-level yard systems. The read-across to John Deere is the inverse of the usual comparable framing: Primo’s freight is hardest *per case*, John Deere’s freight is hardest *per load* on the finished-machine side and *per velocity* on the parts side. Primo’s hard-freight discipline — multi-temp dock arbitration, weight-out trailer mix, refill returns, drop-trailer yards feeding regional DCs — translates DOWN to heavy-equipment freight, which is structurally easier per case but harder per event. The operating model is the same shape: one protocol across every yard in the network, one sequencing logic at the dock, one source of truth for trailer location and dwell. If the operating model works on the per-case-hardest freight in CPG, the read-across to per-load-hardest finished machines coming out of Waterloo and Davenport — and to per-velocity parts coming out of a 2.8M sq ft Milan DC — is the harder version of the same problem, not a different problem. The shape Primo built above its plants is the same shape Smart Industrial would extend above the gate: one operating model, one protocol, one source of truth at the layer that today runs on radios. The directly-shaped reference for John Deere — a Tier-1 CPG anchor running this operating model across 237 facilities on a multi-year, contracted term — is available for peer call if peer reference becomes useful.",
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at John Deere are different in kind: (1) Milan IL parts distribution — the 2.8M sq ft, 800,000-part, 80,000-line-per-day operating heart of Deere logistics — because outbound parts velocity makes yard variance immediately visible against a daily-pick baseline and the operating-model improvement is measurable inside one quarter; (2) Waterloo Tractor Operations as a single-plant pilot, because the built-to-order finished-machine flow on 7R/8R/9R/9RX tractors is the cleanest place to see whether yard sequencing actually changes dealer-delivery-window adherence. We would expect the network to make sense of itself within two to four quarters once the pilot reads as expected.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'deere-10k',
          source: 'Deere & Company 10-K and investor disclosures',
          confidence: 'public',
          detail:
            'Anchors the U.S. manufacturing footprint (~60 facilities), the Smart Industrial operating model (launched June 2020), and Q4/full-year 2025 sales posture. December 2025 investor day at the NYSE reaffirmed the Smart Industrial framework; CEO John May highlighted the 1M+ connected machines and 500M engaged acres on the Operations Center.',
          url: 'https://investor.deere.com/',
        },
        {
          id: 'deere-ces-2025',
          source: 'John Deere CES 2025 autonomy announcements',
          confidence: 'public',
          detail:
            'Public unveil (Jan 2025) of the next-generation autonomy retrofit kits for tractors, tillage tools, and orchard sprayers. Limited dealer availability in 2025; broader rollout planned for 2026.',
          url: 'https://www.prnewswire.com/news-releases/john-deere-reveals-new-autonomous-machines--technology-at-ces-2025-302342436.html',
        },
        {
          id: 'deere-see-spray',
          source: 'See & Spray 2025 deployment data',
          confidence: 'public',
          detail:
            'See & Spray ran across 5M+ acres in 2025; ~50% herbicide reduction reported; 31M gallons of mix saved per public Deere reporting. Operating-system evidence on the asset, not on the yard.',
        },
        {
          id: 'deere-waterloo',
          source: 'John Deere Waterloo IA Tractor Operations',
          confidence: 'public',
          detail:
            'Largest John Deere manufacturing complex globally; builds 7R / 8R / 9R / 9RX series including the 9RX830 (830 HP); ~$500M invested over five years. Public facility profile and Cedar Valley business reporting anchor the volume and capex.',
        },
        {
          id: 'deere-milan-parts',
          source: 'John Deere Milan IL Parts Distribution Center',
          confidence: 'public',
          detail:
            'Public facility profile: 2,800,000 sq ft, 800,000+ unique part numbers, ~80,000 lines shipped daily / ~450,000 lines per week. Adjacent to Moline HQ and the Quad Cities assembly footprint; operating heart of Deere parts logistics.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks (industrial-freight cuts)',
          confidence: 'public',
          detail:
            'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges, with the heavy-haul / oversized-freight cuts where they exist. These describe the conditions most heavy-equipment networks operate under, not John Deere specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail:
            'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
        {
          id: 'reed-tenure',
          source: 'Cory Reed — public tenure record',
          confidence: 'public',
          detail:
            '28+ years at Deere (joined 1998, never worked anywhere else as an executive). Stepped into the President, Lifecycle Solutions, Supply Management, and Customer Success role on November 3, 2025 — the title combines aftermarket parts, customer support, the supply chain function, precision-ag upgrade, and business transformation under one P&L. Public Deere communications credit him with laying the foundation for See & Spray, ExactShot, and FurrowVision during his 2014–2018 tenure as SVP, Intelligent Solutions Group.',
          url: 'https://about.deere.com/en-us/explore-john-deere/leadership/cory-reed',
        },
      ],
      unknowns: [
        'How much yard-tech is already in place at Milan parts distribution — site-level YMS, dock scheduling, gate automation — versus at the assembly plants (Waterloo, Davenport, Dubuque, East Moline)',
        'Whether any of the Smart Industrial digital stack (Operations Center, the connected-machine telemetry layer) has touched yard operations on the factory side, or whether it lives entirely in the in-field machine and the dealer-service tooling',
        'How dealer-handoff yard SOPs vary across the independent dealer organizations — and which dealer relationships drive the most yard-induced delivery-window slips during planting or harvest peak',
        'How customization staging for built-to-order machines (front weights, duals, GPS receivers, See & Spray heads, autonomy retrofit kits) is sequenced today — in yard, in plant, or in a dedicated staging area between the two',
        'Whether the multi-year dealer-parts-inventory build has put sustained dock-contention pressure on Milan that is visible in outbound carrier scorecards, and how that pressure is being managed today',
        'How carrier scorecards on detention and dwell are reported into the global logistics function, and which lanes (Waterloo outbound, Milan outbound, Davenport heavy-haul) drive the worst metrics',
        'Whether the Lifecycle Solutions / Supply Management / Customer Success consolidation under one P&L has changed the operating cadence for yard-layer questions — or whether yard sits below the visibility threshold of that combined seat today',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        "Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. John Deere is distinctive in this round because the contradiction is unusually visible: the company is one of the most aggressive industrial-AI operators on the planet — 1M+ connected machines on the Operations Center, See & Spray running AI on 5M acres in 2025, autonomy retrofit kits unveiled at CES 2025 with broader 2026 availability — and at the same time the yards that stage the next 9RX tractor for dealer delivery, or the next 80,000 parts lines out of Milan, still run on radios. The asset in the field got smart before the yard between the factory and the dealer did. That is not a Deere-specific failure — it is the default state of every heavy-equipment network we have looked at — but the gap is more expensive at Deere than anywhere else in the category because the dealer commitment downstream of the yard is bigger, the planting and jobsite windows the dealer commitments roll up into are time-bound in a way grocery is not, and the parts-velocity pressure at Milan is materially higher than at any single comparable site.",
      authorEmail: 'casey@freightroll.com',
      signOff:
        "Cory — you have been at Deere since 1998 and the precision-ag stack that See & Spray and ExactShot rode out of the Intelligent Solutions Group seat is one of the cleanest pieces of operating-system thinking in the industry. The Lifecycle Solutions, Supply Management, and Customer Success seat now puts aftermarket parts, supply chain, and customer-delivery commitment under one P&L — which is exactly the seat where the yard layer between the factory and the dealer first becomes a single accountable seam. The part most worth pushing back on is whether the operating discipline that took the asset onto Smart Industrial has reached the yard layer yet, or whether it stopped at the machine and the parts catalog. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.",
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'P-056',
      name: 'Cory Reed',
      firstName: 'Cory',
      lastName: 'Reed',
      title: 'President, Lifecycle Solutions, Supply Management, and Customer Success',
      company: 'John Deere',
      email: 'cory.reed@johndeere.com',
      linkedinUrl: 'https://about.deere.com/en-us/explore-john-deere/leadership/cory-reed',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Management',
      currentMandate:
        '28+ years at Deere (joined 1998). Stepped into the President, Lifecycle Solutions, Supply Management, and Customer Success role on November 3, 2025 — the title combines aftermarket parts, customer support, the supply chain function, precision-ag upgrade, and business transformation under one P&L. Architect of the precision-ag platform (See & Spray, ExactShot, FurrowVision) during his 2014–2018 tenure as SVP, Intelligent Solutions Group.',
      bestIntroPath: 'Direct outreach to the President, Lifecycle Solutions office.',
    },
    {
      personaId: 'P-057',
      name: 'David Panjwani',
      firstName: 'David',
      lastName: 'Panjwani',
      title: 'Director, Logistics and Global Trade',
      company: 'John Deere',
      email: 'david.panjwani@johndeere.com',
      linkedinUrl: 'https://www.linkedin.com/in/david-panjwani-a5431a11',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Logistics / Distribution',
      currentMandate: 'Public profile states he is responsible for John Deere logistics on a global basis.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-058',
      name: 'Gia Duke',
      firstName: 'Gia',
      lastName: 'Duke',
      title: 'Director, Global Supply Management',
      company: 'John Deere',
      email: 'gia.duke@johndeere.com',
      linkedinUrl: 'https://www.linkedin.com/in/gia-duke-362b8a19',
      roleInDeal: 'routing-contact',
      seniority: 'VP',
      function: 'Manufacturing / Supply Management',
      currentMandate: 'Named Deere supply management director.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-059',
      name: 'Kevin Akers',
      firstName: 'Kevin',
      lastName: 'Akers',
      title: 'International Logistics and Operations Strategy Leader',
      company: 'John Deere',
      email: 'kevin.akers@johndeere.com',
      linkedinUrl: 'https://www.linkedin.com/in/kevin-akers-1746391a',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Aftermarket / Operations',
      currentMandate: 'Named Deere leader for international logistics and operations strategy.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-060',
      name: 'Catherine Pham',
      firstName: 'Catherine',
      lastName: 'Pham',
      title: 'Supply Chain Management and Logistics Strategy Lead',
      company: 'John Deere',
      email: 'catherine.pham@johndeere.com',
      linkedinUrl: 'https://www.linkedin.com/in/catherine-pham-cscp-4428a43a',
      roleInDeal: 'routing-contact',
      seniority: 'Director',
      function: 'Transformation',
      currentMandate: 'Named lead for global supply management and logistics strategy execution.',
      bestIntroPath: 'LinkedIn / Sales Nav',
    },
    {
      personaId: 'P-082',
      name: 'Bhalchandra Kadam',
      firstName: 'Bhalchandra',
      lastName: 'Kadam',
      title: 'Supply Chain Professional',
      company: 'John Deere',
      roleInDeal: 'routing-contact',
      seniority: 'Manager',
      function: 'Supply Chain',
      currentMandate: 'In active outreach sequence AND attended webinar. Strongest engagement signal at Deere.',
      bestIntroPath: 'Direct - in sequence, webinar engaged',
    },
    {
      personaId: 'P-083',
      name: 'Maryanne Graves',
      firstName: 'Maryanne',
      lastName: 'Graves',
      title: 'Global Manager, Production',
      company: 'John Deere',
      roleInDeal: 'champion',
      seniority: 'VP',
      function: 'Production / Manufacturing',
      currentMandate: 'Global production role touches every assembly plant yard. Natural champion for yard standardization across the manufacturing network.',
      bestIntroPath: 'LinkedIn / warm route via Bhalchandra Kadam',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'P-056',
        name: 'Cory Reed',
        firstName: 'Cory',
        lastName: 'Reed',
        title: 'President, Lifecycle Solutions, Supply Management, and Customer Success',
        company: 'John Deere',
        email: 'cory.reed@johndeere.com',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Management',
      },
      fallbackLane: 'executive',
      label: 'Cory Reed - President, Lifecycle Solutions, Supply Management, and Customer Success',
      variantSlug: 'cory-reed',

      framingNarrative:
        "Cory, you have been at Deere since 1998, you built the precision-ag stack out of the Intelligent Solutions Group seat from 2014–2018, and on November 3, 2025 the Lifecycle Solutions, Supply Management, and Customer Success P&L put aftermarket parts, supply chain, and customer-delivery commitment under a single seat. Smart Industrial has the asset on the operating system — 1M+ connected machines on the Operations Center, See & Spray running AI on 5M acres in 2025, autonomy retrofit kits unveiled at CES 2025 and broadening in 2026. The yard between the assembly plants and the dealer is the one layer the operating model has not yet covered — not because Smart Industrial doesn’t have an opinion about it, but because the yard layer has been operating below the visibility threshold the rest of the operating model runs to. The seat you stepped into is the first one where that gap is a single accountable seam.",
      openingHook:
        "Smart Industrial digitized the asset and the parts catalog. The yard between Waterloo / Davenport / Dubuque / East Moline / Milan and the dealer has not moved at the same pace. From the Lifecycle Solutions seat — aftermarket parts, supply chain, customer-delivery commitment under one P&L — that gap is the customer-success gap before it is anything else.",
      stakeStatement:
        "Every built-to-order machine and every 80,000-line parts day is a dealer commitment downstream of the yard. When yard sequence at Waterloo or Milan slips, dealer-delivery slips, and the planting window or jobsite start date the dealer committed to slips with it. Per-load freight economics mean fewer events per day than CPG — but each event blocks more dock and stages more customization, and the recovery margin on a missed planting-window commitment is thinner than anywhere in CPG. The seat you stepped into on November 3 is the first one where the asset, the parts catalog, and the customer-delivery commitment share a single P&L — which makes the yard layer between them a single accountable seam for the first time.",

      heroOverride: {
        headline: 'Cory, Smart Industrial sees the machine. It does not see the yard the machine left.',
        subheadline:
          '1M+ connected machines. 5M acres of See & Spray. CES 2025 autonomy retrofit kits broadening in 2026. And the yards at Waterloo, Davenport, Dubuque, East Moline, and Milan still run on radios. The Lifecycle Solutions seat is the seam where that gap is most visible.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Peer-to-peer operator framing. Reed is a 28-year Deere lifer with the precision-ag architect credit on his ledger; he doesn’t need a glossary on See & Spray, the Operations Center, or autonomy retrofit — he built the foundations. Acknowledge Smart Industrial as the operating-system win it is. Position the wedge as an extension of Smart Industrial above the gate, not a replacement of anything inside the model. The credibility move is naming the contradiction precisely (asset on the operating system, yard layer off it) and treating the yard as the piece of the operating system that has been running below the Smart Industrial visibility threshold, not outside its philosophy.",
      kpiLanguage: [
        'network dock-arbitration',
        'trailer dwell at Milan',
        'dock-to-dealer cycle time',
        'customization staging duration',
        'dealer-delivery window adherence',
        'parts-line outbound velocity',
        'detention cost on heavy-haul lanes',
        'planting-window slip risk',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful.',
    },
    {
      person: {
        personaId: 'P-057',
        name: 'David Panjwani',
        firstName: 'David',
        lastName: 'Panjwani',
        title: 'Director, Logistics and Global Trade',
        company: 'John Deere',
        email: 'david.panjwani@johndeere.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Logistics / Distribution',
      },
      fallbackLane: 'logistics',
      label: 'David Panjwani - Director',
      variantSlug: 'david-panjwani',

      framingNarrative:
        "David, global logistics at Deere has to absorb two things at once right now. The dealer-parts inventory build has put more lines through Milan than at any time in the DC’s history — ~80,000 a day on a 2.8M sq ft floor — and the finished-machine plants (Waterloo, Davenport, Dubuque, East Moline) are running built-to-order at scale with customization staged in the yard before flatbed pickup. Both are velocity problems the yard sees first. The logistics-and-global-trade function is where dock-arbitration logic, carrier scorecards, and detention pressure on heavy-haul lanes all roll up — and where the absence of a network-level yard operating model is most felt.",
      openingHook:
        "Milan moves 450,000 parts lines a week. Waterloo loads built-to-order tractors onto specialized flatbeds. The dock arbitration on both still runs on radios and tribal knowledge. That’s a logistics-and-global-trade question before it is anything else.",
      stakeStatement:
        "Per-load economics on heavy-haul finished machines mean fewer events but more dock real estate per event. Per-line economics on Milan parts mean velocity that compounds the dock-contention math during the multi-year inventory build. Network-level dock arbitration is the place where both pressures meet, and right now it lives in 60 sites’ worth of tribal knowledge instead of a single operating model.",

      heroOverride: {
        headline: 'David, 60 sites. ~80,000 parts lines a day out of Milan. Specialized flatbeds out of Waterloo. The dock arbitration still runs on radios.',
        subheadline:
          'Global logistics at Deere is absorbing a parts-velocity build at Milan and a built-to-order finished-machine flow at Waterloo, Davenport, Dubuque, and East Moline at the same time. The network-level yard operating layer is the seam where both pressures land.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. David lives in the global-logistics detail — carrier scorecards, detention pressure on heavy-haul lanes, parts-outbound velocity at Milan, dealer-delivery cycle on finished machines. Lead with the dock-arbitration math; let him decide what to do with it.",
      kpiLanguage: [
        'truck turn time at Milan',
        'detention on heavy-haul lanes',
        'dwell variance Waterloo outbound',
        'on-time pickup at the gate',
        'carrier scorecard exposure',
        'dock-to-stock at Milan',
        'parts-line outbound velocity',
        'dealer-delivery window adherence',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful.',
    },
    {
      person: {
        personaId: 'P-058',
        name: 'Gia Duke',
        firstName: 'Gia',
        lastName: 'Duke',
        title: 'Director, Global Supply Management',
        company: 'John Deere',
        email: 'gia.duke@johndeere.com',
        roleInDeal: 'routing-contact',
        seniority: 'VP',
        function: 'Manufacturing / Supply Management',
      },
      fallbackLane: 'ops',
      label: 'Gia Duke - Director',
      variantSlug: 'gia-duke',

      framingNarrative:
        "Gia, global supply management at Deere has to keep Waterloo, Davenport, Dubuque, East Moline, Greeneville, Augusta, and Coffeyville fed across the Smart Industrial program. Supplier inbound at those plants and finished-machine outbound to the dealer network share the same yards and the same dock doors. Site-by-site visibility is in place; the network operating layer that arbitrates across those sites — that decides who docks first when Waterloo inbound and Waterloo outbound collide on the same gate — is the seam the function feels first.",
      openingHook:
        "Global supply management runs on what is happening at the dock at each plant today. The network operating layer above the sites — the one that arbitrates across them when capacity is tight — is the layer that hasn’t been built.",
      stakeStatement:
        "When a Waterloo or Davenport supplier-inbound trailer waits for a dock while a finished-machine outbound flatbed waits for a spotter, the math compounds into a line stop on the inbound side and a dealer-delivery slip on the outbound side. The visibility is local; the arbitration is network-level — and right now it is improvised at the gatehouse instead of run from a single operating model.",

      heroOverride: {
        headline: 'Gia, supplier inbound and finished-machine outbound share the same dock doors. The arbitration is improvised.',
        subheadline:
          'Smart Industrial moves the asset and the parts catalog. The yard layer where supplier inbound and finished-machine outbound collide at Waterloo, Davenport, Dubuque, and East Moline is the layer above the sites — and the one without an operating model yet.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. Gia owns global supply management — supplier inbound flow at every assembly plant. The pitch here is dock arbitration across inbound and outbound at the same gate, not yard tech as a feature.",
      kpiLanguage: [
        'dock utilization',
        'supplier inbound dwell',
        'line-stop risk attributable to dock contention',
        'throughput per shift',
        'inbound-outbound arbitration latency',
        'gate-to-dock cycle time',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful.',
    },
    {
      person: {
        personaId: 'P-059',
        name: 'Kevin Akers',
        firstName: 'Kevin',
        lastName: 'Akers',
        title: 'International Logistics and Operations Strategy Leader',
        company: 'John Deere',
        email: 'kevin.akers@johndeere.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Aftermarket / Operations',
      },
      fallbackLane: 'ops',
      label: 'Kevin Akers - International Logistics and Operations Strategy Leader',
      variantSlug: 'kevin-akers',

      framingNarrative:
        "Kevin, operations strategy at Deere has to make Smart Industrial real at the execution layer. The in-field digital story — 1M+ connected machines, See & Spray on 5M acres, autonomy retrofit kits at CES 2025 and broadening in 2026 — is sharp. The execution layer between the factory and the dealer is where the contradiction shows up: per-load-hardest finished machines and per-velocity-hardest parts running on yard protocols that haven’t moved at the same pace as the asset. Operations strategy is exactly where that gap gets diagnosed and where the rollout sequence gets decided.",
      openingHook:
        "Smart Industrial has digitized the machine and the parts catalog. The yard layer between Waterloo / Milan and the dealer is the execution gap nobody designed.",
      stakeStatement:
        "Dealer-delivery cycle is the integration test for Smart Industrial. When yard sequence at Waterloo or Milan slips, the dealer commitment slips, and the customer’s planting window or jobsite start slips with it. The recovery margin on those windows is thinner than anywhere in CPG — and the network operating layer that would make yard sequence durable across 60 sites does not yet exist.",

      heroOverride: {
        headline: 'Kevin, Smart Industrial digitized the machine. The execution layer between the factory and the dealer is the next move.',
        subheadline:
          'Operations strategy is the seat where the contradiction between Smart Industrial in the field and manual yards between Waterloo, Davenport, Dubuque, East Moline, Milan, and the dealer network gets resolved. The yard is the execution layer.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. Kevin owns operations strategy across international logistics; he frames decisions in terms of where the next leg of Smart Industrial actually shows up at the execution layer. Don’t pitch features — diagnose the layer that hasn’t been touched yet.",
      kpiLanguage: [
        'dealer-delivery window adherence',
        'truck turn time at Milan',
        'dock utilization at Waterloo',
        'detention cost on heavy-haul lanes',
        'customization staging duration',
        'gate-to-flatbed cycle',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful.',
    },
    {
      person: {
        personaId: 'P-060',
        name: 'Catherine Pham',
        firstName: 'Catherine',
        lastName: 'Pham',
        title: 'Supply Chain Management and Logistics Strategy Lead',
        company: 'John Deere',
        email: 'catherine.pham@johndeere.com',
        roleInDeal: 'routing-contact',
        seniority: 'Director',
        function: 'Transformation',
      },
      fallbackLane: 'ops',
      label: 'Catherine Pham - Supply Chain Management and Logistics Strategy Lead',
      variantSlug: 'catherine-pham',

      framingNarrative:
        "Catherine, supply-chain strategy at Deere is the seat that maps Smart Industrial onto operational execution. The asset side has had the headline investment — 1M+ connected machines, See & Spray on 5M acres, autonomy retrofit kits broadening in 2026. The execution layer between Waterloo / Davenport / Dubuque / East Moline / Milan and the dealer network has not had the same operating-system treatment. Strategy is where the question of which layer gets touched next gets answered.",
      openingHook:
        "Strategy is only as good as the execution layer it lands on. The yard layer between Smart Industrial in the field and the dealer commitment downstream is the layer nobody designed.",
      stakeStatement:
        "Built-to-order machines and 80,000-line parts days collide in the yards at Waterloo, Milan, and the rest of the assembly footprint. Smart Industrial pulled the asset and the parts catalog onto an operating system; the yards between them and the dealer haven’t moved at the same pace. The strategy question is whether the next layer of operating-system thinking lands on the yard or on something else.",

      heroOverride: {
        headline: 'Catherine, Smart Industrial digitized the machine and the parts catalog. The yard layer between them is the unsolved seam.',
        subheadline:
          'Supply-chain strategy is the seat that decides which layer gets the next leg of operating-system investment. The yard between Waterloo / Milan and the dealer is the layer that hasn’t been touched.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'artifact', 'comparable', 'methodology', 'about'],

      toneShift:
        "Operator-to-operator. Catherine owns supply-chain strategy execution; she’ll evaluate the brief by whether it diagnoses a real seam in the operating model or just describes yard-tech features. Lead with the diagnosis.",
      kpiLanguage: [
        'truck turn time',
        'dock-to-stock cycle time',
        'detention on heavy-haul lanes',
        'dealer-delivery window adherence',
        'parts-line outbound velocity',
        'operating-model rollout cadence',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same network-operating-model shape, harder per-case freight (water), already running the layer above site-level yard systems. The directly-shaped 237-facility CPG anchor is the credibility flex if peer reference becomes useful.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable network operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Truck Turn Time (drop-and-hook)', context: 'Average improvement in drop-hook cycle' },
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
    facilityCount: '~60 U.S. facilities; global footprint spans the Quad Cities region (Moline HQ, East Moline Harvester Works, Milan parts DC), the Cedar Valley (Waterloo Tractor Operations), Davenport and Dubuque IA on the construction & forestry side, plus Greeneville TN, Augusta GA, Coffeyville KS specialty plants',
    facilityTypes: ['Assembly Plants', 'Parts Distribution Centers', 'Foundries / Component Plants', 'Dealer-Delivery Staging'],
    geographicSpread: 'North America-anchored with global manufacturing; U.S. core in the Quad Cities + Cedar Valley corridor with specialty plants in the Southeast and central U.S.; dealer network across hundreds of branches in North America and globally',
    dailyTrailerMoves: '~80,000 parts lines per day out of Milan IL alone; specialized flatbed / heavy-haul / low-boy outbound on finished machines from Waterloo, Davenport, Dubuque, and East Moline',
    fleet: 'Specialized carriers — flatbed, heavy-haul, low-boy on finished machines; high-frequency truckload and parcel/LTL on Milan parts outbound',
  },

  freight: {
    primaryModes: ['Flatbed / Heavy-Haul', 'Specialized / Low-Boy', 'Truckload', 'Parts LTL / Parcel'],
    avgLoadsPerDay: 'Heavy outbound from Milan IL parts (~80,000 lines/day, ~450,000 lines/week); per-load specialized flatbed and low-boy outbound on built-to-order finished machines from Waterloo, Davenport, Dubuque, and East Moline',
  },

  signals: {
    eventAttendance: 'Recurring industry-conference attendee',
    recentNews: [
      'CES 2025 — John Deere unveils next-generation autonomy retrofit kits for tractors, tillage tools, and orchard sprayers; broader 2026 availability planned.',
      'See & Spray ran across 5M+ acres in 2025 with ~50% herbicide reduction; 31M gallons of mix saved per public Deere reporting.',
      'December 2025 investor day at the NYSE — CEO John May reaffirmed the Smart Industrial operating model; cited 1M+ connected machines and 500M engaged acres on the Operations Center.',
      'Waterloo IA Tractor Operations — ~$500M invested over five years; new 9RX assembly line including the 9RX830 (830 HP), the largest tractor Deere has ever built.',
      'Milan IL Parts Distribution Center operating at scale through the multi-year dealer-parts-inventory build — 800,000+ unique SKUs, ~80,000 lines per day across a 2.8M sq ft floor.',
      'Cory Reed stepped into President, Lifecycle Solutions, Supply Management, and Customer Success on November 3, 2025 — the first Deere seat to combine aftermarket parts, supply chain, and customer-delivery commitment under a single P&L.',
    ],
    supplyChainInitiatives: [
      'Smart Industrial operating model (launched 2020) — production systems, technology stack, and lifecycle solutions; the public industrial-AI initiative that the yard layer sits beside, not inside.',
    ],
    urgencyDriver:
      'Smart Industrial is the public proof that Deere can run AI-grade systems thinking on the asset and on the parts catalog. The yard operating layer above the sites — Waterloo, Davenport, Dubuque, East Moline finished-machine outbound, Milan parts outbound, dealer handoff across hundreds of branches — is the place where the same systems thinking has not yet been applied. The contradiction is unusually visible right now, and the Lifecycle Solutions / Supply Management / Customer Success P&L consolidation on November 3, 2025 puts the yard layer under a single accountable seat for the first time.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Operating model', body: 'Smart Industrial launched 2020 · production systems + technology stack + lifecycle solutions on one thread.' },
    { mark: 'In-field autonomy', body: 'See & Spray · 5M acres in 2025 · ~50% herbicide reduction · 31M gallons of mix saved.' },
    { mark: 'Connected fleet', body: 'Operations Center · 1M+ connected machines · 500M engaged acres.' },
    { mark: 'Parts velocity', body: 'Milan IL · 2.8M sq ft · 800,000+ SKUs · ~80,000 lines per day.' },
    { mark: 'Coverage map', body: '5 Smart Industrial layers covered. 1 unfilled. The yard between the factory and the dealer.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same network shape, different freight.' },
  ],

  audioBrief: {
    src: AUDIO_BRIEF_SRC,
    intro:
      "This brief is for Cory Reed. You have been at Deere since 1998 and built the precision-ag stack out of the Intelligent Solutions Group seat — See & Spray and ExactShot rode out of that work. On November 3, 2025 the Lifecycle Solutions, Supply Management, and Customer Success P&L put aftermarket parts, supply chain, and customer-delivery commitment under a single seat. The five minutes that follow are about the one layer Smart Industrial has not yet reached — the yard between the factory and the dealer — and why your seat is the first one where that gap is a single accountable seam.",
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#367C2B',
    backgroundVariant: 'dark',
  },

  showcase: true,
  showcaseOrder: 5,
  layoutPreset: 'industrial',
};
