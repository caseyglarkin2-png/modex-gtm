/**
 * Internal context (NOT for prospect-facing surfaces):
 *
 * Kroger has no publicly confirmed Lighthouse-equivalent control tower
 * for supply chain. Microsoft Azure is the store-tech foundation
 * (EDGE Shelf, video analytics, Scan-Bag-Go), not a supply-chain
 * control tower. o9 Solutions appears in third-party customer lists
 * as Kroger's integrated business planning vendor (medium confidence —
 * surface as a question, not a fact, in the memo).
 *
 * Recent automation scar tissue is the biggest brief-shaping fact:
 * Kroger took a ~$2.6B impairment and paid Ocado ~$350M to wind down
 * the Smart Platform CFC strategy. Three CFCs (Pleasant Prairie WI,
 * Frederick MD, Groveland FL) close January 2026; the Charlotte CFC
 * was cancelled; the Nashville spoke is closing. Leadership is now
 * highly allergic to "transformational platform" pitches. Lead with
 * incremental, measurable, low-capex yard wins — not "platform."
 *
 * Greg Foran, ex-Walmart U.S. CEO (2014-2019) and most recently CEO
 * of Air New Zealand, was named Kroger's first external CEO in
 * February 2026. He's operator-grade and will arrive with strong
 * opinions about retail supply-chain productivity. The CSCO
 * conversation under Foran should map cleanly to operating margin
 * and labor productivity, not to visionary digital transformation.
 *
 * Source dossier: Foran appointment confirmed via Kroger IR + Bloomberg
 * + Grocery Dive (Feb 2026). Arreaga's Oct 2020 appointment confirmed
 * via Supermarket News. Ocado retreat confirmed via Grocery Dive +
 * Chain Store Age + Retail Tech Innovation Hub. DC count is uncertain
 * (Kroger reports 44; third-party primers estimate 55).
 */

/**
 * Kroger Co. — ABM Microsite Data
 * Quality Tier: A (research-backed, May 2026)
 * Pitch shape: coexistence wedge (network-level yard operating layer
 * beneath the planning stack and ahead of Foran's arriving operating
 * discipline), not displacement and explicitly not "platform."
 * Angle: NETWORK YARD OPERATING MODEL — dock-to-store flow,
 * vendor-inbound discipline across multi-temp DCs, dwell variance as
 * an operating-margin lever — NOT another automation platform.
 */

import type { AccountMicrositeData } from '../schema';

export const kroger: AccountMicrositeData = {
  slug: 'kroger',
  accountName: 'Kroger',
  coverHeadline: 'The yard layer the operating discipline lands on',
  titleEmphasis: 'operating discipline',
  coverFootprint: '~2,730 stores · ~50 DCs · ~33 plants',
  parentBrand: 'The Kroger Co.',
  vertical: 'grocery',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 90,

  pageTitle: 'YardFlow for Kroger — Network Yard Operating Layer',
  metaDescription:
    'How a network-level yard operating model lands across Kroger\'s ~50 DCs, ~33 plants, and inbound-trailer-heavy yards — incremental, measurable, no platform — as Greg Foran\'s operating discipline lands on the supply chain.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Kroger U.S. network',
      composition: [
        { label: 'Store footprint', value: '~2,730 stores across 35 states + D.C., operating under ~20 banners (Kroger, Ralphs, Harris Teeter, Fred Meyer, King Soopers, Smith\'s, Dillons, Mariano\'s, QFC, Food 4 Less, Pick \'n Save, others). New-store builds set to climb ~30% in 2026 against ~60 underperformers closing across the prior 18 months — the network is densifying, not consolidating' },
        { label: 'DC network', value: 'Public counts range from 44 (Kroger corporate) to ~55 (third-party primers); most are multi-temp combining dry, refrigerated, frozen, and GM in one footprint. Newest: $391M Franklin, KY DC announced December 2025, ~430 jobs' },
        { label: 'Owned manufacturing footprint', value: '~33 plants (roughly 18 dairy, 8 grocery/beverage, 9 bakery/deli, plus 5 Home Chef facilities) producing ~40% of Kroger private-label SKUs — outbound to DCs and direct-to-store across the same yards Foran\'s operating discipline now lands on' },
        { label: 'Private fleet', value: '~2,000 tractors (a top-tier U.S. private grocery fleet), mixed with dedicated and common-carrier capacity. Gatik autonomous middle-mile is in pilot in Dallas; Tesla Semi is on order' },
        { label: 'Planning stack', value: 'o9 Solutions appears in published customer lists for integrated business planning at Kroger; the supply-chain digital substrate above the yard layer is therefore a known surface, not an unknown one (worth confirming directly)' },
        { label: 'Post-Ocado posture', value: 'Three CFCs closing January 2026 (Pleasant Prairie, Frederick, Groveland); Charlotte CFC cancelled; ~$350M Ocado wind-down payment; ~$2.6B impairment. The remaining CFCs continue, but e-commerce strategy has decisively pivoted to store-fulfillment-first. Internal allergy to "platform" pitches is the operating reality of any 2026 supply-chain conversation' },
        { label: 'New-CEO context', value: 'Greg Foran (ex-Walmart U.S. CEO 2014-2019, ex-Air New Zealand) named February 2026 — Kroger\'s first-ever external CEO. Operator-grade. The CSCO conversation under Foran resolves to operating-margin and labor-productivity language, not visionary digital transformation' },
        { label: 'Capital posture', value: 'FY2025 capex of $3.6-3.8B; FY2026 guidance includes ~$400M of e-commerce profitability improvement and 30% more new builds. Procurement cost-out is an explicit lever called out on the Q3 FY25 call. Yard operating-margin leverage maps cleanly onto that disclosed posture' },
      ],
      hypothesis:
        'Kroger\'s supply chain just absorbed two of the largest external shocks any grocer has navigated in the last decade: the $864M Albertsons merger termination in December 2024 and the ~$3B all-in cost of unwinding the Ocado CFC strategy. What landed underneath both, organizationally, is a network whose operating discipline has been tested in public — and a new external CEO whose career is built on the proposition that operating discipline is the unsexy thing that wins in retail at scale.\n\nGreg Foran ran Walmart U.S. through 2014-2019. His operating reputation rests on store-level rigor, supply-chain productivity, and a refusal to confuse digital transformation with operating discipline. The CSCO function he\'s inheriting at Kroger has serious bones — a top-tier private fleet, deep multi-temp DC operations, ~33 owned plants — and a layer that has not yet been brought to single-standard discipline: the yard. Inbound vendor trailers at the DC. Outbound store-replenishment trailers leaving the yard. Plant-outbound trailers feeding the same DCs. Today every site runs its own gate cadence, its own dock priority logic, and its own multi-temp dock arbitration. The variance shows up as detention, missed appointments, and dock-to-stock dwell that the planning system cannot see.\n\nThe wedge isn\'t a platform. After Ocado, "platform" is a word that costs us the meeting. The wedge is a single multi-temp DC where a network-level yard operating layer is stood up alongside whatever\'s in place today, measured for 60-90 days against the pre-deployment baseline, and either operates to that standard or doesn\'t. If it does, Foran\'s operating discipline gets a tile it can land on across the rest of the network. If it doesn\'t, the cost is the discovery, the integration, and the configuration — not a $2.6B impairment.',
      pullQuote: 'After Ocado, "platform" is a word that costs us the meeting.',
      caveat:
        'This is built from Kroger\'s public disclosures, the post-merger and post-Ocado record, the Foran appointment, and reasonable inference about the inbound-heavy yard density a grocery DC network of this scale carries. We may be wrong about parts of it. Specifically: whether o9 (or another planning system of record) is what the supply-chain digital substrate actually is today; whether internal yard tooling has already been built on Azure or another platform we haven\'t seen disclosed; how Foran\'s arriving operating priorities are translating into 2026 yard-and-dock specifics. Pushing back on those parts is the most useful thing this brief can do.',
    },
    {
      type: 'artifact',
      headline: 'A coverage map for the operating system Foran is inheriting',
      artifact: {
        imageSrc: '/artifacts/kroger-coverage-map.svg',
        imageAlt: 'Operating-system coverage map for Kroger. Six tiles representing supply-chain operating domains: Planning (o9), Procurement, Inventory, E-Commerce, Transportation, and Yard Network Ops. Yard Network Ops is unfilled, marked with a Kroger blue hairline outline — the layer Foran\'s operating discipline has not yet landed on.',
        caption: 'Operating-system coverage map · 5 tiles covered · 1 unfilled.',
        source: 'Composition modeled from Kroger public disclosures + planning-vendor customer lists + Foran appointment context. Account names redacted.',
      },
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point you can\'t recover with price), and shipped across multi-temp. Primo runs a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs — and they layered a network-level yard operating model on top of their existing site-level yard systems. Two differences matter for Kroger: Primo is CPG (outbound to retail), Kroger is retail (heavily inbound from CPG plus outbound to stores), so the yard-density signature differs — Kroger\'s yards see far more inbound vendor trailers per day. And Primo\'s network is a fraction of Kroger\'s ~50-DC footprint, so the right shape for Kroger is a single-DC pilot, not a turnkey rollout. The operating layer is the same; the wedge is one multi-temp DC under direct observation, not a platform commitment.',
      metrics: [
        { label: 'Avg truck turn time (drop-and-hook)', before: '48 min', after: '24 min', delta: 'up to −50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        'Roughly 90 days kickoff-to-deployed-pilot — discovery, integration with whatever inbound/outbound transportation and DC systems are already in place, configuration to the chosen DC\'s multi-temp arbitration profile, and live deployment. Front-end cadence depends on Kroger resource availability. The first measurable impact is read inside 30-60 days of monitored post-deployment operation against the pre-deployment baseline. The pilot site we would suggest is a single multi-temp DC with high inbound vendor density and an outbound store-replenishment lane to a metro store cluster — explicitly not a CFC, not a perishable-only DC, and not a plant. Once the operating layer is proven at one DC, the network rollout is staged sequentially across the multi-temp DCs. This is not a platform commitment. It is a 90-day pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'kroger-investor',
          source: 'Kroger investor relations (Q3 FY25 earnings, Q4/FY25 release, FY26 guidance)',
          confidence: 'public',
          detail: 'Capex envelope, e-commerce profitability guidance, new-build cadence, procurement cost-out lever all sourced from Kroger\'s own investor disclosures across late 2025 and early 2026.',
          url: 'https://ir.kroger.com/',
        },
        {
          id: 'foran-appointment',
          source: 'Greg Foran CEO appointment (February 2026)',
          confidence: 'public',
          detail: 'Kroger IR + Bloomberg + Grocery Dive coverage of the February 2026 announcement that Greg Foran (ex-Walmart U.S. CEO 2014-2019, ex-Air New Zealand) was named Kroger\'s first-ever external CEO. Operating-discipline reputation directly relevant to the CSCO conversation under him.',
          url: 'https://ir.kroger.com/news/news-details/2026/Kroger-Appoints-Greg-Foran-as-Chief-Executive-Officer/default.aspx',
        },
        {
          id: 'arreaga-appointment',
          source: 'Gabriel Arreaga — Kroger CSCO (since October 2020)',
          confidence: 'public',
          detail: 'Supermarket News + TheOrg confirm Arreaga joined Kroger from Mondelez International in October 2020 as SVP and Chief Supply Chain Officer. MBA from INCAE plus Harvard executive education.',
          url: 'https://www.supermarketnews.com/executive-moves/kroger-names-mondelez-exec-gabriel-arreaga-to-lead-supply-chain',
        },
        {
          id: 'ocado-retreat',
          source: 'Kroger / Ocado CFC strategy wind-down (2024-2026)',
          confidence: 'public',
          detail: '~$2.6B impairment, ~$350M Ocado payout, three CFCs closing January 2026 (Pleasant Prairie WI, Frederick MD, Groveland FL), Charlotte CFC cancelled, Nashville spoke closing. Coverage: Grocery Dive, Chain Store Age, Retail Tech Innovation Hub. Critical context for any 2026 supply-chain conversation — the company is highly allergic to "platform" pitches.',
          url: 'https://www.grocerydive.com/news/kroger-canceling-charlotte-cfc-closing-nashville-spoke-ecommerce-ocado/807167/',
        },
        {
          id: 'albertsons-collapse',
          source: 'Failed Kroger-Albertsons merger (terminated December 2024)',
          confidence: 'public',
          detail: 'Merger blocked December 11, 2024 by federal court in Oregon and King County Superior Court in Washington. Albertsons immediately sued for $6B+ including the $600M termination fee. Combined merger-related spend across both companies hit ~$864M. The post-merger posture is "go alone, optimize productivity" — share buyback over M&A, capex into store growth and e-commerce productivity.',
          url: 'https://en.wikipedia.org/wiki/Attempted_acquisition_of_Albertsons_by_Kroger',
        },
        {
          id: 'network-primer',
          source: 'Kroger network composition (third-party primers + Kroger Supply Chain disclosures)',
          confidence: 'public',
          detail: 'On the Seams primer and Kroger Supply Chain site give plant count (~33), DC count (44-55 range depending on source), private fleet posture, banner list, and the multi-temp DC composition. Romulus MI Penske-built DC documented as a representative multi-temp footprint (-20°F / 35°F / ambient).',
          url: 'https://ontheseams.substack.com/p/a-brief-primer-on-krogers-distribution',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site retail and CPG networks operate under, not Kroger specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact were measured by us across the Primo deployment, then validated with the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether o9 (or another planning system) is the supply-chain digital substrate of record today, and how integrated it is with the DC and transportation operating systems beneath it',
        'Whether internal yard tooling already exists on Azure or another platform that hasn\'t surfaced in public sources',
        'How Foran\'s arriving operating priorities are translating into specific 2026 supply-chain mandates — and how the CSCO function is organizing against them',
        'The standalone Kroger private-fleet count (public figures range from ~2,000 to ~2,400 depending on whether the Albertsons merger projection is included)',
        'Which DC is the right pilot site — multi-temp, high inbound vendor density, outbound to a defined metro store cluster — and who owns the operating relationship to that DC today',
        'Whether post-Ocado contractual cleanup leaves any residual integration constraints on the remaining 5 CFC sites or the inbound vendor receiving lanes feeding them',
        'How procurement cost-out targets (the explicit Q3 FY25 lever) map onto yard-operating-margin specifics across the DC footprint',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Kroger is distinctive in this round because the operating-system thinking is unusually fresh on the floor: a new external CEO whose career is built on operational rigor, a planning substrate that has held through two major external shocks, and a supply-chain organization that has just publicly absorbed the cost of getting "platform" wrong. The wedge that fits this moment is the opposite of a platform.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'Gabriel — the part most worth pushing back on is whether the yard layer beneath your planning stack has actually been brought to a single network standard, or whether each DC and plant still runs its own gate-and-dock logic against local SOPs. That answer reshapes the rest of this. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'kroger-001',
      name: 'Gabriel Arreaga',
      firstName: 'Gabriel',
      lastName: 'Arreaga',
      title: 'SVP & Chief Supply Chain Officer',
      company: 'Kroger',
      linkedinUrl: 'https://www.linkedin.com/in/gabrielarreaga/',
      roleInDeal: 'decision-maker',
      seniority: 'SVP/EVP',
      function: 'Supply Chain',
      currentMandate:
        'Owns logistics, inventory, replenishment, manufacturing, and broader supply-chain organization at Kroger since October 2020. Joined from Mondelez International (SVP Supply Chain). Earlier senior supply-chain roles at Stanley Black & Decker, Unilever, Union Fenosa Gas. MBA from INCAE + Harvard executive education. Reports up to new external CEO Greg Foran as of February 2026.',
      bestIntroPath:
        'Direct outreach to CSCO office, framed against the post-Ocado / Foran-arrival operating context. Cold outreach should explicitly disclaim "platform" framing. If delegated, target VP Logistics or VP Network Operations.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kroger-001',
        name: 'Gabriel Arreaga',
        firstName: 'Gabriel',
        lastName: 'Arreaga',
        title: 'SVP & Chief Supply Chain Officer',
        company: 'Kroger',
        roleInDeal: 'decision-maker',
        seniority: 'SVP/EVP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'Gabriel Arreaga - SVP & Chief Supply Chain Officer',
      variantSlug: 'gabriel-arreaga',

      framingNarrative:
        'Gabriel, the supply chain you\'ve built at Kroger since 2020 has absorbed two of the largest external shocks any grocer has navigated in the last decade — the Albertsons merger termination and the unwinding of Ocado — and held. What lands next is different in kind: an external CEO whose career was built on the proposition that operating discipline at retail scale is the unsexy thing that wins. Greg Foran ran Walmart U.S. through 2014-2019. His operating reputation is rigor, single-standard execution, and refusal to confuse digital transformation with operating discipline. Your CSCO function has serious bones beneath it — a top-tier private fleet, deep multi-temp DC operations, ~33 owned plants — and a layer that has not yet been brought to single-standard discipline: the yard. We think the cheapest moment to fill that layer is before Foran asks why every DC runs its own gate.',
      openingHook:
        'Greg Foran is going to ask why every yard runs its own gate. The cheapest moment to have an answer is now.',
      stakeStatement:
        'The yard layer is the one operating-system tile in front of you that hasn\'t been brought to a single network standard. The wedge isn\'t a platform — after Ocado, "platform" costs us the meeting. It is one multi-temp DC, 60-90 days of monitored operation, measured against the pre-deployment baseline. Either it operates to standard or it doesn\'t. If it does, Foran\'s operating discipline gets a tile it can land on.',

      heroOverride: {
        headline: 'The yard layer is the operating-system tile Foran will ask about first.',
        subheadline:
          'After Ocado, "platform" is a word that costs us the meeting. The wedge is one multi-temp DC, 90 days kickoff-to-deployed-pilot, measured against the pre-deployment baseline. Either it operates to single-standard discipline or it doesn\'t. If it does, the operating layer scales across the multi-temp DC footprint.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer ops framing. Arreaga has been a CSCO for 5+ years; he does not need a glossary. Acknowledge the bones of the supply chain he\'s built. Lead with the Foran operating-discipline context — that\'s the active timing driver. Explicitly disclaim "platform" framing because of Ocado scar tissue. The wedge is one DC, measurable, low-capex, reversible.',
      kpiLanguage: [
        'dock-to-stock cycle',
        'inbound vendor trailer dwell',
        'multi-temp dock arbitration',
        'detention spend',
        'yard cycle time',
        'spotter utilization',
        'operating-margin lever',
        'labor productivity',
        'single-standard execution',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same multi-temp shape, harder freight, deployed YardFlow as the network-level operating layer over site-level yard systems. The proof emphasis Kroger leadership will weight most is incremental, measurable, low-capex — explicitly not "platform." Reference availability of the Primo CFO/ops team is high-leverage given the post-Ocado posture.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '~50 distribution centers (44-55 depending on source) · ~33 owned manufacturing plants · ~2,730 stores across ~20 banners',
    facilityTypes: ['Distribution Centers', 'Manufacturing Plants', 'Customer Fulfillment Centers (Ocado, winding down)', 'Stores'],
    geographicSpread:
      '35 U.S. states + District of Columbia. HQ Cincinnati, OH. Banners include Kroger, Ralphs (CA), Harris Teeter (Mid-Atlantic), Fred Meyer (NW), King Soopers (CO), Smith\'s (Mountain West), Dillons (KS), Mariano\'s (IL), QFC (WA), Food 4 Less, Pick \'n Save, Fry\'s, others. New Franklin, KY DC ($391M) announced December 2025.',
    dailyTrailerMoves: 'High-volume — inbound vendor receipts plus outbound store replenishment across ~50 multi-temp DCs, plus outbound plant trailers from the ~33 owned manufacturing facilities feeding the same yards.',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal/Rail', 'LTL', 'Private Fleet'],
    avgLoadsPerDay: 'High-volume across ambient, refrigerated, frozen, produce, deli, dairy, and bakery. Private fleet of ~2,000 tractors mixed with dedicated and common-carrier capacity. Gatik autonomous middle-mile in pilot in Dallas; Tesla Semi on order for the distribution fleet.',
  },

  signals: {
    recentNews: [
      'Greg Foran named CEO February 2026 — first external CEO in Kroger history. Ex-Walmart U.S. CEO (2014-2019), ex-Air New Zealand.',
      'Ocado CFC strategy wind-down: three CFCs closing January 2026, Charlotte CFC cancelled, Nashville spoke closing. ~$350M Ocado payout, ~$2.6B impairment.',
      'Albertsons merger terminated December 11, 2024; combined merger-related spend ~$864M; Albertsons suing for $6B+.',
      '$391M Franklin, KY DC announced December 2025 — 430 jobs.',
      'FY2026 guidance: 30% increase in new-store builds + ~$400M e-commerce profitability improvement.',
      'Gabriel Arreaga continues as SVP & CSCO (since October 2020, from Mondelez).',
    ],
    urgencyDriver:
      'Greg Foran\'s February 2026 arrival as Kroger\'s first external CEO ever — a Walmart-bred operator whose reputation is built on operating-discipline-first retail at scale — is the active timing driver. The cheapest moment to fill the unfilled yard-network operating tile is before that operating discipline lands across the DC and plant footprint. Combined with the post-Ocado allergy to "platform" pitches, the right wedge is a single multi-temp DC pilot, 90 days, measured against pre-deployment baseline, no platform commitment.',
  },

  marginaliaItems: [
    { mark: 'New CEO', body: 'Greg Foran · ex-Walmart U.S. CEO · named Feb 2026 · first external Kroger CEO ever.' },
    { mark: 'Ocado scar', body: '~$2.6B impairment · ~$350M payout · 3 CFCs closing Jan 2026. "Platform" costs the meeting.' },
    { mark: 'Industry baseline', body: 'Even where site-level yard automation is in place, network-level operating variance — tribal knowledge, inconsistent SOPs, uneven visibility — dominates yard cycle-time loss across multi-site grocery and CPG.' },
    { mark: 'Capex envelope', body: 'FY2025 $3.6-3.8B · FY2026 guidance includes ~$400M e-commerce profitability + 30% more new builds.' },
    { mark: 'Network', body: '~2,730 stores · ~50 DCs · ~33 plants · ~2,000 tractors · ~20 banners.' },
    { mark: 'Network rollout', body: 'Primo · 24 facilities live · >200 contracted.' },
  ],

  theme: {
    accentColor: '#0d4d8b',
  },
};
