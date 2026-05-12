/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Bob Evans Farms is a confirmed PINC/Kaleris incumbent per the Kaleris
 * YMS success-stories archive. The published case study credits the 2022
 * deployment with:
 *   - ~40% reduction in loaded reefer hours, ~134,000 hours eliminated
 *   - ~$471,000 in year-one fuel + M&R savings attributed to loaded-reefer
 *     dwell reduction
 *   - Replaced manual yard management across the four production plants and
 *     the Springfield, OH transportation hub
 *
 * John Ash (Sr. Director, Transportation & Warehousing) is the operating
 * executive of record. He is unusual: carrier (J.B. Hunt) → 3PL (Exel/DHL)
 * → shipper (Weston Foods → Bob Evans). The Kaleris case is HIS win.
 *
 * Pitch shape: MODERNIZATION (operating model above the YMS, not replacement).
 * The case study win is real; the next layer is network operating model
 * across the full Post Holdings Refrigerated Retail segment (Michael Foods,
 * Crystal Farms, Potato Products of Idaho, 8th Avenue) — none of which is
 * standardized onto a parent yard stack today because there isn't one.
 *
 * Post Holdings reshuffle context: Nicolas Catoggio EVP/COO Jan 2026; needs
 * cross-portfolio operational wins. Greg Pearson appointed Post Consumer
 * Brands CEO April 2026. New COO + recent acquisitions = the operating-model
 * slot at the segment level is open.
 *
 * This intel powers cold-email modernization framing (see
 * docs/research/john-ash-bob-evans-farms-dossier.md). It must not appear in
 * any prospect-facing surface. The memo references "your existing site-level
 * yard automation" / "the cold-chain reefer-dwell win the network already
 * proved" — never Kaleris/PINC.
 */

/**
 * Bob Evans Farms — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — published case study, ~$471K
 *                  year-one savings, 134,000 reefer hours)
 * Pitch shape: modernization — operating model above the existing site-level
 *              YMS, extending the reefer-dwell win across the Refrigerated
 *              Retail segment
 * Angle: YARD MANAGEMENT (loaded-reefer dwell, multi-OpCo standardization,
 *        cold-chain Scope 1, USDA lot-and-trailer chain-of-custody) —
 *        NOT driver experience
 * Stakeholder vocabulary: carrier-then-3PL-then-shipper-fluent
 *        (Ash's J.B. Hunt → Exel → Weston Foods → Bob Evans arc) —
 *        dollars per hour, dwell math, FSIS-aware
 */

import type { AccountMicrositeData } from '../schema';
import { AUDIO_BRIEF_CHAPTERS } from '../audio-brief';

export const bobEvansFarms: AccountMicrositeData = {
  slug: 'bob-evans-farms',
  accountName: 'Bob Evans Farms',
  coverHeadline: 'The yard layer above Refrigerated Retail',
  titleEmphasis: 'above Refrigerated Retail',
  parentBrand: 'Post Holdings',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'YardFlow for Bob Evans Farms - The Operating Model Above the Reefer-Dwell Win',
  metaDescription:
    'How a network-level yard operating model extends the loaded-reefer dwell win Bob Evans proved at the four production plants across the full Post Holdings Refrigerated Retail segment — Michael Foods, Crystal Farms, Potato Products of Idaho, 8th Avenue — without disrupting the existing site-level yard automation.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Bob Evans / Post Refrigerated Retail network',
      composition: [
        { label: 'Bob Evans manufacturing footprint', value: '4 production plants — Xenia OH and Lima OH (refrigerated potato sides, mashed potato core line), Hillsdale MI (pork sausage, ~25M lbs/year, USDA FSIS-inspected), Sulphur Springs TX (refrigerated sides + mac & cheese) — plus the Springfield OH transportation hub' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard automation in production at the four plants since 2022; the published cold-chain dwell win is real (~40% reduction in loaded-reefer hours, ~134,000 hours, ~$471K year-one fuel + M&R) — the operating model layered above the site system across the Refrigerated Retail segment is unsolved' },
        { label: 'Cold-chain reality', value: 'Every plant ships refrigerated finished goods. Mashed potatoes, sausage, pasta sides, breakfast bowls all live in the reefer between dock and grocery DC — loaded-reefer hours are fuel-burning hours (genset on temp) and product-clock hours (shelf life ticking)' },
        { label: 'Multi-temp dock complexity', value: 'Sausage chilled, potato sides chilled, breakfast bowls and sandwiches frozen → ambient. Different SKUs share the same dock surface; temp-zone integrity is preserved or lost at the yard, not on the line' },
        { label: 'Regulatory posture', value: 'USDA FSIS-inspected facilities (pork sausage, sausage-containing breakfast SKUs). Recall-response time is upstream of the yard — lot-and-trailer chain-of-custody at the yard layer is the cheapest material lever' },
        { label: 'Post Holdings Refrigerated Retail segment', value: 'Michael Foods (eggs, refrigerated potatoes — much larger cold-chain footprint than Bob Evans alone), Crystal Farms (refrigerated dairy), Potato Products of Idaho (closed March 2025), 8th Avenue (pasta + peanut butter + granola, closed July 2025). No shared parent yard stack across these OpCos today — the slot is open' },
      ],
      hypothesis:
        'The interesting thing about the Bob Evans yard math is what the site-level win has not yet done. The cold-chain dwell program that started in 2022 worked. The four-plant footprint runs cleaner reefer hours, fewer fuel-burning gensets, and an attributable year-one number — those are real, they are not in dispute, and they should not be reframed as failures. They are the proof that yard discipline pays back at this network — and at the site level that part of the conversation is closed.\n\nWhat is unsolved is the layer above. Bob Evans is one operating company inside Post Holdings Refrigerated Retail. Michael Foods alone is a materially larger cold-chain footprint than Bob Evans, with the same Refrigerated Retail leadership above it and the same loaded-reefer dwell problem at every plant. Crystal Farms sits next door. Potato Products of Idaho closed into Refrigerated Retail in March 2025; 8th Avenue closed in July 2025 — two newly acquired plant networks running on whatever they were running on at close, neither standardized onto a parent yard stack because there is not yet one. That is the gap.\n\nTwo things made it more expensive in the last twelve months. First, the new EVP/COO at Post (in seat since January 2026) is the kind of executive who needs cross-portfolio operating wins he can credit himself with — and a Refrigerated-Retail-wide cold-chain yard story is one no single OpCo leader can claim alone. Second, the FY2026 capex envelope is $350M–$390M with most of that earmarked elsewhere; the residual is plenty for a software-and-operating-model line item that is by-definition sub-million-per-site implementation against a nine-figure capex envelope. The decision-rights conversation is harder than the ROI conversation. The yard math is favorable.',
      pullQuote: 'At the site level, that part of the conversation is closed.',
      caveat:
        'This is built from Bob Evans / Post Holdings public disclosures, the published cold-chain yard-automation case record, Refrigerated Retail segment reporting, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the Michael Foods plants run on the same yard stack as Bob Evans or a different one, where the Potato Products of Idaho and 8th Avenue acquisition integrations are landing the yard-protocol decision, and how the FY2026 capex envelope is being allocated between cage-free egg expansion and everything else.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be. They run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, and they have layered a network-level operating model on top of their existing site-level yard systems. The Bob Evans / Post Refrigerated Retail operating profile is shape-similar — multi-site, multi-OpCo, cold-chain-dominant, mature site-level yard automation already in place at Bob Evans — but with significantly more forgiving freight economics per trailer (refrigerated sides and sausage are not weight-out at the same intensity as water). If a network operating model can run on water — the hardest CPG freight in the country — the read-across to refrigerated sides, sausage, and breakfast bowls flowing across a multi-OpCo Refrigerated Retail segment is the easier lift.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The cleanest first pilot at Bob Evans is the existing four-plant footprint, where the site-level yard automation already runs the records layer and the operating-model layer above it produces the marginal hour the site system can no longer extract on its own. The second move is Michael Foods at a single plant — same Refrigerated Retail segment leadership, same loaded-reefer dwell problem, same parent capex envelope. From there the rollout cadence into Crystal Farms, Potato Products of Idaho, and 8th Avenue is shape-replicating, not site-by-site reinvention.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'bef-public-network',
          source: 'Bob Evans Farms public manufacturing disclosures',
          confidence: 'public',
          detail: 'Anchors the four-plant production footprint (Xenia OH, Lima OH, Hillsdale MI, Sulphur Springs TX) and the Springfield OH transportation hub. Sourced from Bob Evans corporate "About" pages and Refrigerated & Frozen Foods / Industry Week trade press.',
          url: 'https://www.bobevansgrocery.com/',
        },
        {
          id: 'post-refrigerated-retail',
          source: 'Post Holdings Refrigerated Retail segment disclosures',
          confidence: 'public',
          detail: 'Anchors the Bob Evans Farms operating-company structure inside Post Holdings Refrigerated Retail alongside Michael Foods, Crystal Farms, Potato Products of Idaho (acquired March 2025), and 8th Avenue Food & Provisions (acquired July 2025). Post FY2026 capex guidance of $350M–$390M.',
        },
        {
          id: 'cold-chain-yard-automation-case',
          source: 'Published cold-chain yard-automation case record (2022 deployment)',
          confidence: 'public',
          detail: 'The Bob Evans site-level yard automation deployment is publicly documented. Cited wins: ~40% reduction in loaded-reefer hours (~134,000 hours eliminated), ~$471,000 year-one fuel and maintenance/repair savings attributed to reefer-dwell reduction. Manual yard coordination eliminated; the Springfield OH hub was part of the rollout.',
        },
        {
          id: 'post-executive-reshuffle',
          source: 'Post Holdings executive disclosures',
          confidence: 'public',
          detail: 'Nicolas Catoggio assumed EVP / Chief Operating Officer at Post Holdings in January 2026; Greg Pearson named President & CEO of Post Consumer Brands April 1, 2026. New COO sponsorship for cross-portfolio operating-model investments is in seat.',
        },
        {
          id: 'usda-fsis-modernization',
          source: 'USDA FSIS continuing 2025–2026 traceability guidance',
          confidence: 'public',
          detail: 'Pork-containing facilities (sausage, sausage-containing breakfast SKUs) are FSIS-inspected and face ongoing modernization pressure on recall-response time. Lot-and-trailer chain-of-custody at the yard layer is upstream of recall-response math.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, loaded-reefer dwell, and detention-cost ranges. These describe the conditions most multi-site refrigerated CPG networks operate under, not Bob Evans specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether Michael Foods and Crystal Farms plants run the same site-level yard stack as Bob Evans or a different one — and which OpCo is most receptive to a parent-level operating-model layer right now',
        'Where Potato Products of Idaho and 8th Avenue (closed March and July 2025) are landing in the post-acquisition yard-protocol decision — and whether the integration teams have a deadline for standardizing onto a parent stack',
        'How the new EVP/COO is sequencing cross-portfolio operating wins, and which segments are first on his FY2026 list',
        'Whether the multi-OpCo carrier mix (dedicated, asset-based common, brokered) currently shares a network-level dwell-and-detention scorecard or whether each OpCo measures independently',
        'How USDA FSIS recall-response data and yard data are currently joined at Bob Evans plants — and whether Quality & Food Safety is already part of the buying committee for any yard-related change',
        'Where the FY2026 residual capex envelope ($260M–$310M after the cage-free / Norwalk earmarks) is being allocated, and whether an operating-model line item has executive sponsorship',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a multi-OpCo segment engagement. Bob Evans is distinctive in this round because the case for site-level cold-chain yard automation is not in dispute and should not be relitigated; it was won at the four-plant footprint in 2022 and the case is public. The unsolved problem is the operating-model layer above the site system across the full Refrigerated Retail segment — Michael Foods, Crystal Farms, Potato Products of Idaho, 8th Avenue — none of which is standardized onto a parent yard stack today, with a new EVP/COO in seat at the parent who needs cross-portfolio operating wins he can credit. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and if a network operating model lands on water, refrigerated sides and sausage and breakfast bowls flowing across a multi-OpCo Refrigerated Retail segment is the easier read-across.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Bob Evans and the broader Refrigerated Retail segment — particularly whether Michael Foods runs the same site-level yard stack as Bob Evans, where the 2025 acquisition integrations are landing the yard-protocol decision, or how the new EVP/COO is sequencing cross-portfolio operating wins — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'bob-evans-001',
      name: 'John Ash',
      firstName: 'John',
      lastName: 'Ash',
      title: 'Senior Director, Transportation & Warehousing',
      company: 'Bob Evans Farms',
      email: 'john.ash@bobevansfoods.com',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Logistics / Supply',
      currentMandate:
        'Owns Bob Evans Farms transportation and warehousing across the four production plants and the Springfield OH transportation hub. Career arc is unusual: J.B. Hunt → Exel/DHL Supply Chain → Weston Foods → Bob Evans — carrier, 3PL, and shipper experience in sequence. Personally championed the 2022 site-level yard automation rollout that delivered the published ~40% loaded-reefer-hours reduction; reports up through Bob Evans supply chain into the Post Refrigerated Retail segment leadership.',
      bestIntroPath:
        'Direct outreach to the Senior Director, Transportation & Warehousing seat. If delegated, the VP Supply Chain at the operating-company level above, or the Director of Logistics / Director of Distribution directly below, are the right alternates. Post Holdings COO sponsorship (Nicolas Catoggio) is the right seat for the cross-portfolio Refrigerated Retail conversation; do not pitch at the parent level without first arming the operating-company sponsor with the segment-wide framing.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'bob-evans-001',
        name: 'John Ash',
        firstName: 'John',
        lastName: 'Ash',
        title: 'Senior Director, Transportation & Warehousing',
        company: 'Bob Evans Farms',
        email: 'john.ash@bobevansfoods.com',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Logistics / Supply',
      },
      fallbackLane: 'logistics',
      label: 'John Ash - Senior Director, Transportation & Warehousing',
      variantSlug: 'john-ash',

      framingNarrative:
        'John, the carrier-then-3PL-then-shipper arc you carried from J.B. Hunt through Exel through Weston Foods into Bob Evans is the arc that turns the site-level cold-chain yard automation win into a Refrigerated-Retail-segment operating model. The four-plant case is closed at Bob Evans — the ~134,000-hour, ~40% loaded-reefer-hours reduction, ~$471K year-one number is public and is your win. The unsolved layer is the operating model above the site system across Michael Foods, Crystal Farms, Potato Products of Idaho, and 8th Avenue — and a new EVP/COO at Post in seat since January 2026 needs exactly the kind of cross-portfolio operating story your win is the proof case for.',
      openingHook:
        'You proved at the four plants — twice over — that site-level cold-chain yard automation pays back at Bob Evans scale. The unsolved layer is the operating model above the site system: how Michael Foods, Crystal Farms, Potato Products of Idaho, and 8th Avenue land on the same reefer-dwell discipline you ran for three years at Bob Evans, without each acquisition rebuilding the yard from scratch and without a parent-level stack to standardize onto.',
      stakeStatement:
        'Site-level yard automation has done what it was bought to do — and the marginal hour at the four Bob Evans plants gets harder every quarter. The next slice lives in the operating model above the site system, and the multi-OpCo extension across Refrigerated Retail is where the segment-wide number gets large enough to land on the parent COO\'s scorecard.',

      heroOverride: {
        headline: 'The operating-model layer above the cold-chain yard win — at Refrigerated Retail scale.',
        subheadline:
          'Site-level yard automation is proven at the four Bob Evans plants — the case study is public, the year-one number is real. The Refrigerated-Retail-wide operating model above it — Michael Foods, Crystal Farms, Potato Products of Idaho, 8th Avenue — is the unfilled tile. A new EVP/COO at Post is in seat since January 2026 with a cross-portfolio mandate.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator, carrier-fluent. Ash has worked the dwell cost from three sides — as the carrier eating it, as the 3PL absorbing it, as the shipper paying for it. He does not need the cold-chain pain story told to him. Acknowledge the site-level yard automation win as a win — it is one, and the ~134,000-hour number is his. Position the wedge as the layer above (cross-OpCo operating model), not as replacement. Number-dense, low-adjective. USDA-aware (FSIS lot-and-trailer chain-of-custody framing is the Quality and Food Safety joining-the-committee hook).',
      kpiLanguage: [
        'loaded-reefer dwell',
        'cold-chain genset hours',
        'multi-OpCo operating model',
        'segment-wide standardization',
        'USDA lot-and-trailer chain-of-custody',
        'cross-portfolio cost-out attribution',
        'site-level vs. network-level operating model',
        'Refrigerated Retail Scope 1 lever',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-temp shape, harder freight (water), already running the network-level layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — multi-OpCo holding-co network with cold-chain reefer dwell as the binding constraint.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount:
      '4 Bob Evans production plants (Xenia OH, Lima OH, Hillsdale MI, Sulphur Springs TX) + Springfield OH transportation hub; Refrigerated Retail segment also includes Michael Foods, Crystal Farms, Potato Products of Idaho (closed March 2025), and 8th Avenue (closed July 2025) — no shared parent yard stack across the OpCos today',
    facilityTypes: ['Refrigerated Manufacturing Plants', 'USDA FSIS-Inspected Plants (pork sausage)', 'Distribution Centers', 'Transportation Hub'],
    geographicSpread: 'Midwest / South US (HQ: New Albany OH; plants in OH, MI, TX; Springfield OH hub) — Post Refrigerated Retail segment extends across Michael Foods / Crystal Farms / Potato Products of Idaho / 8th Avenue footprints in the same geographies',
    dailyTrailerMoves:
      'High-volume — refrigerated finished goods to grocery DCs across the four production sites, with the Springfield OH hub as the cold-chain transportation anchor. Refrigerated Retail-segment trailer count is materially larger than Bob Evans alone',
  },

  freight: {
    primaryModes: ['Refrigerated Truckload', 'Temperature-Controlled LTL', 'Multi-Temp Dock (chilled + frozen)'],
    avgLoadsPerDay:
      'High-volume — refrigerated network serving retail grocery, foodservice, and club channels; mixed chilled (sausage, potato sides) and frozen (breakfast bowls and sandwiches) SKUs share the same dock surface at the plants',
    specialRequirements: [
      'Refrigerated cold chain (loaded-reefer dwell is fuel-burning and product-clock time)',
      'USDA FSIS-inspected facilities (pork sausage, sausage-containing breakfast SKUs)',
      'Multi-temp dock complexity (chilled and frozen on the same yard surface)',
      'Carrier mix heterogeneity (dedicated, asset-based common, brokered)',
    ],
  },

  signals: {
    recentNews: [
      'Post Holdings acquired Bob Evans in 2018; the Refrigerated Retail segment now also includes Michael Foods, Crystal Farms, Potato Products of Idaho (closed March 2025), and 8th Avenue Food & Provisions (closed July 2025).',
      'Nicolas Catoggio assumed Post Holdings EVP / Chief Operating Officer in January 2026 — a new COO at the parent level needs cross-portfolio operating wins he can credit himself with.',
      'Greg Pearson named President & CEO of Post Consumer Brands April 1, 2026 (succeeding Catoggio at the operating-company seat).',
      'FY2026 capex envelope $350M–$390M (cage-free egg expansion + Norwalk IA precooked-egg facility account for $80M–$90M; the residual $260M–$310M covers software, automation, and yard work across the portfolio).',
      'USDA FSIS continuing 2025–2026 modernization guidance on recall-response time keeps lot-and-trailer chain-of-custody on the Quality and Food Safety agenda.',
    ],
    urgencyDriver:
      'The site-level cold-chain yard automation deployment has done what it was bought to do at the four Bob Evans plants — the published numbers (~134,000 hours, ~$471K year-one) are real and the marginal hour gets harder every quarter. The unsolved layer is the operating model above the site system across the full Refrigerated Retail segment: Michael Foods, Crystal Farms, Potato Products of Idaho, and 8th Avenue all running on different operating models post-acquisition, no shared parent yard stack today. A new EVP/COO at Post (in seat since January 2026) is the cross-portfolio sponsor the segment-wide operating model needs.',
  },

  marginaliaItems: [
    { mark: 'Industry baseline', body: '75% of yards still run on radios and clipboards.' },
    { mark: 'Site-level scoreboard', body: '~40% loaded-reefer-hours reduction · ~134,000 hours · ~$471K year-one fuel + M&R.' },
    { mark: 'Refrigerated Retail segment', body: 'Bob Evans · Michael Foods · Crystal Farms · Potato Products of Idaho · 8th Avenue — no shared parent yard stack today.' },
    { mark: 'Cross-portfolio sponsor', body: 'New EVP/COO at Post in seat since January 2026 · cross-portfolio operating wins on the scorecard.' },
    { mark: 'Ash in his own words', body: 'J.B. Hunt → Exel → Weston Foods → Bob Evans. The site-level case is his. The layer above is the next one.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted · same coordinates, harder freight.' },
  ],

  audioBrief: {
    src: '/audio/yard-network-brief.mp3',
    intro:
      'This brief is for John Ash. The cold-chain yard discipline you put on the four-plant scoreboard — ~134,000 reefer hours eliminated, ~$471K year-one — is the proof case the next five minutes builds on. What follows is the layer above the site system the Refrigerated Retail segment now needs.',
    chapters: AUDIO_BRIEF_CHAPTERS,
    generatedAt: '2026-05-12T00:00:00Z',
  },

  theme: {
    accentColor: '#D4380D',
  },
};
