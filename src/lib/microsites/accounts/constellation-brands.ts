/**
 * Constellation Brands — ABM Microsite Data
 * Quality Tier: Tier 2 Band B
 * Pitch shape: cross-border yard-ops wedge. Mexican beer brewed in Mexico,
 * shipped across the border into US DCs, into the three-tier wholesaler
 * network. The yard layer spans two countries, two labor markets, and two
 * regulatory regimes — and Modelo's volume-#1-or-#2 US scale means every
 * minute of yard variance compounds. Veracruz coming online in 2025 is the
 * greenfield yard-ops design window. Wine & Spirits divestiture freed beer
 * operating attention. The cross-border dimension is the differentiator
 * relative to a single-country CPG comparable like Primo Brands.
 */

import type { AccountMicrositeData } from '../schema';

export const constellationBrands: AccountMicrositeData = {
  slug: 'constellation-brands',
  accountName: 'Constellation Brands',
  vertical: 'beverage',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 75,

  pageTitle: 'Constellation Brands · Beer brewed in Mexico, sold in the US — the yard layer crosses a border',
  metaDescription:
    'Constellation Brands brews Modelo, Corona, and Pacifico in Nava, Obregon, and now Veracruz, and ships those hectoliters across the border into US DCs and through the three-tier wholesaler network. The yard layer above that flow spans two countries — and the operating standard isn\'t the same on both sides.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Constellation US-bound beer network',
      composition: [
        { label: 'Mexican brewery footprint', value: 'Nava (Coahuila) ~370M cases/yr · Obregón (Sonora) ~170M cases/yr · Veracruz greenfield ramping into commercial production late 2025 (~30M hL added on completion)' },
        { label: 'US-side network', value: 'Distribution centers + cross-border receiving yards on the US side of the Nava and Obregón corridors; smaller premium wine ops in CA Napa Valley post-divestiture' },
        { label: 'Cross-border flow', value: 'Mexican breweries are the production base for the entire US Mexican-beer category; the 2013 AB-InBev settlement constrains brewing to Mexico, so every Modelo/Corona/Pacifico case ships across the border before reaching a US wholesaler' },
        { label: 'Portfolio shape after divestiture', value: 'Wine & Spirits transaction with The Wine Group closed June 2025 (~$846M cash); retained portfolio is beer-led with premium wine (Robert Mondavi Winery, The Prisoner) and craft spirits (Casa Noble, Mi Campo, High West) on top' },
        { label: 'Demand-side scale', value: 'Modelo Especial held #1 US beer by dollars through 2025 (~$5.2B; ~8% category share). Constellation\'s Mexican imports account for ~92% of the imported-Mexican-beer dollar category' },
        { label: 'Capex posture', value: 'Beer capex run rate ~$1.2B/yr in Mexico through FY26; total ~$4–4.5B FY24–FY26 against the Veracruz buildout and Obregón expansion' },
      ],
      hypothesis:
        'The interesting thing about Constellation\'s yard math is that the question crosses a border. The 2013 settlement with AB InBev fixed the production geography in place — every case of Modelo, Corona, and Pacifico sold in the United States is brewed in Mexico, which means the yard layer Constellation actually operates spans two countries. The outbound side of the brewery yard in Nava and the inbound side of the receiving yard at a US DC sit on either end of a cross-border move with its own customs windowing, its own broker handoff, and its own bridge-congestion variance — and they are not the same yard, run by the same workforce, against the same operating standard. That asymmetry compounds because of scale. Modelo Especial finished 2025 as the #1 US beer by dollars and Constellation\'s Mexican brands account for the overwhelming majority of the imported-Mexican-beer category in the US. At that volume, a one-percent miss on Nava\'s outbound dock-turn cadence isn\'t a local KPI — it\'s a measurable share of the country\'s best-selling beer not in transit on a given afternoon. The second pressure is that Veracruz is ramping into commercial production in late 2025 as the third Mexican brewery, adding capacity on the order of 30 million hectoliters, and a greenfield brewery is also a greenfield brewery yard. There is no entrenched site-level SOP to displace at Veracruz; the operating standard that gets installed in 2026 is the one that defines yard execution at the newest, largest piece of the network for the next decade. The third pressure is portfolio attention. The Wine Group divestiture closed June 2025 and removed mainstream wine from the operating surface — Woodbridge, Meiomi, and the Robert Mondavi Private Selection tier are gone — and the retained beer-led portfolio is now the dominant claim on supply-chain management bandwidth. The combination of those three — fixed cross-border production geography, #1-category volume sensitivity to yard variance, and a divestiture-freed beer-ops focus — is what makes Constellation distinctive against a single-country CPG comparable. The yard layer above the brewery network is not a domestic problem.',
      caveat:
        'This is built from Constellation\'s public capex disclosures, the Mexican-brewery construction press, the Wine Group transaction filings, and reasonable network inference on the US-side DC and wholesaler-handoff layer. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the cross-border customs cadence into the US receiving yards is already smoothed by a current operating standard, whether the Veracruz yard-ops design has been spec\'d yet and who owns it, and how the US-side DC yards relate to the wholesaler-pickup handoff that gates everything downstream of Constellation\'s control.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes out gross-vehicle weight before it maxes cube), low-margin (so every minute of yard waste is a margin point that can\'t be recovered with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization — they had to be — and they run a multi-site bottling and distribution network with high-volume plants, drop-trailer yards, and refrigerated lanes feeding regional DCs, with a network-level yard operating model layered on top of their existing site-level systems. The shape similarities to Constellation are direct: high-volume bottling and packaging, weight-out before cube-out (a beer trailer maxes gross-vehicle-weight at roughly 20 pallets of cases, same constraint Primo runs against on water), multi-site network feeding a wholesaler/distributor handoff, and a category leader\'s sensitivity to dock-turn variance. The freight shape transfers cleanly. What does not transfer is the cross-border dimension — Primo operates inside a single regulatory and labor regime, and Constellation does not. The Mexico-side breweries (Nava, Obregón, Veracruz) sit inside one labor market and one set of customs-clearance dynamics; the US-side DCs sit inside another. That layer is Constellation-specific and not modeled by the Primo comparable. The operating-model read-across covers what happens inside a yard at either end of the cross-border move; the customs-cadence layer between them is its own design conversation.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '-50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The two highest-leverage pilot candidates at Constellation are different in kind: (1) Nava, because it carries the highest throughput in the network and any yard-turn improvement at Nava shows up immediately in the cross-border outbound cadence; (2) Veracruz, because the brewery is ramping into commercial production now, the yard has no entrenched local SOPs to displace, and the operating standard installed there in 2026 is the one that defines the newest piece of the network for a decade. We would expect the network to make sense of itself within two to four quarters of either pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'stz-10k',
          source: 'Constellation Brands annual report and 10-K disclosures',
          confidence: 'public',
          detail: 'Anchors the brewery footprint (Nava, Obregón, Veracruz), the FY24–FY26 capex run rate (~$4–4.5B against beer), and the post-divestiture portfolio composition.',
          url: 'https://ir.cbrands.com/',
        },
        {
          id: 'stz-mexico-capex',
          source: 'Mexican brewery construction and capex disclosures',
          confidence: 'public',
          detail: 'Veracruz greenfield project (~30M hL on completion; commercial production ramping late 2025), Obregón expansion (~70M cases additional capacity), Nava as the ~370M-case anchor brewery.',
          url: 'https://mexiconewsdaily.com/business/constellation-brands-to-invest-over-us-1b-in-mexico-brewery-facilities/',
        },
        {
          id: 'stz-wine-divestiture',
          source: 'Constellation Brands wine portfolio repositioning (April–June 2025)',
          confidence: 'public',
          detail: 'Transaction with The Wine Group closed June 2, 2025 for ~$845.9M cash; divested brands include Woodbridge, Meiomi, Robert Mondavi Private Selection, Cook\'s, SIMI, J. Rogét. Retained premium wine (Robert Mondavi Winery, The Prisoner, Schrader, Mount Veeder) and craft spirits (Casa Noble, Mi Campo, High West, Nelson\'s Green Brier).',
          url: 'https://ir.cbrands.com/news-events/press-releases/detail/314/constellation-brands-repositions-wine-and-spirits-business-to-a-portfolio-of-exclusively-higher-growth-higher-margin-brands',
        },
        {
          id: 'modelo-share',
          source: 'US beer market-share reporting (Circana/IRI scan + retailer trade press)',
          confidence: 'public',
          detail: 'Modelo Especial ranked #1 US beer by dollar sales in 2025 (~$5.2B revenue, ~8% dollar share). Constellation\'s Mexican imports account for ~92% of the imported-Mexican-beer dollar category. The position has tightened against Michelob Ultra in late 2025.',
          url: 'https://www.marketingdive.com/news/modelo-bud-light-controversy-alcohol-beer-sales/654396/',
        },
        {
          id: 'ab-inbev-settlement',
          source: '2013 Anheuser-Busch InBev / DOJ settlement on Mexican beer brands',
          confidence: 'public',
          detail: 'Settlement fixed production of Modelo, Corona, and Pacifico in Mexico for the US market, which is why Constellation\'s US-bound brewing footprint is entirely south of the border. This is the structural fact behind the cross-border yard-ops framing.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-radio prevalence, dwell-time variance, and detention-cost ranges. These describe the conditions most multi-site beverage networks operate under, not Constellation specifically.',
        },
        {
          id: 'primo-operating-data',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'How the cross-border customs cadence (CBP windowing, broker handoff, bridge-crossing variance) interacts with the outbound dock schedule at Nava and Obregón today — and whether either side runs against a shared operating standard or two local ones',
        'Whether the Veracruz yard-ops design has been spec\'d yet, who owns it, and how much of the operating model is still open to first-principles design',
        'How the US-side DC yards interface with the three-tier wholesaler pickup window — and which of the wholesaler-side variance and the Constellation-side variance dominates the handoff',
        'Whether the Wine Group divestiture freed enough supply-chain management bandwidth to take on a network-yard operating-model investment in the FY26 window, or whether the Veracruz ramp itself absorbs the available attention',
        'Whether existing site-level yard tooling (gate, appointment, spotter dispatch) is in place at any of the breweries or US DCs, and at what coverage',
        'How peak-season volume (Memorial Day → Labor Day; Cinco de Mayo week) shows up on the brewery-side outbound yard versus the US-side receiving yard, and which side absorbs the surge',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Constellation is distinctive in this round because the yard layer crosses a border. The 2013 AB-InBev settlement fixed brewing in Mexico for the US Mexican-beer category, which means the operating standard that runs a Modelo case from a Nava dock door to a Texas wholesaler\'s pickup window spans two countries — and most network yard models stop at the customs line. The Primo comparable covers what happens inside a yard at either end; the layer between them is its own design conversation. Veracruz coming online in 2025 is the cleanest place to install a network operating standard from scratch, because greenfield avoids any displacement of entrenched site-level workflows. Nava is the cleanest place to measure throughput sensitivity, because it carries the highest volume in the network and any improvement shows up immediately in the cross-border outbound cadence.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally — particularly how the cross-border customs cadence and the brewery outbound schedule are currently held together, whether the Veracruz yard-ops design is already further along than the public record suggests, or how the US-side DC yards sit against the wholesaler-pickup window — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'constellation-brands-001',
      name: 'John Kester',
      firstName: 'John',
      lastName: 'Kester',
      title: 'SVP & Chief Supply Chain Officer, Constellation Brands',
      company: 'Constellation Brands',
      email: 'john.kester@cbrands.com',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Supply Chain / Operations',
      currentMandate:
        'SVP and Chief Supply Chain Officer at Constellation Brands (NYSE: STZ). Owns end-to-end supply chain for the #1-by-dollars US imported beer franchise (Modelo, Corona, Pacifico) plus the retained premium wine and craft-spirits portfolio. Reports to CEO Bill Newlands. Responsible for the Mexican brewery footprint (Nava, Obregón, Veracruz), cross-border logistics into the US, US-side distribution infrastructure, and the post-divestiture beer-led portfolio focus.',
      bestIntroPath: 'Direct outreach to the CSCO office. If delegated, target VP Logistics or VP US Operations on the supply-chain leadership team.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'constellation-brands-001',
        name: 'John Kester',
        firstName: 'John',
        lastName: 'Kester',
        title: 'SVP & Chief Supply Chain Officer, Constellation Brands',
        company: 'Constellation Brands',
        email: 'john.kester@cbrands.com',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Supply Chain / Operations',
      },
      fallbackLane: 'ops',
      label: 'John Kester — SVP & Chief Supply Chain Officer',
      variantSlug: 'john-kester',

      framingNarrative:
        'John, the 2013 settlement fixed Constellation\'s brewing geography in Mexico, which means the operating standard that runs a Modelo case from a Nava dock door to a US wholesaler pickup spans two countries — and most network yard models stop at the customs line. Veracruz coming online is the cleanest place to install a network standard from scratch; Nava is the cleanest place to measure throughput sensitivity at the #1-category volume level. The Wine Group divestiture freed the operating attention to do this now.',
      openingHook:
        'Every case of Modelo, Corona, and Pacifico sold in the United States is brewed in Mexico. That structural fact — fixed by the 2013 settlement, reinforced by the Veracruz ramp — means Constellation\'s yard layer crosses a border that most network operating models treat as out of scope. The question the analysis below works through is what changes when the layer above the yard runs to a single standard on both sides of that border.',
      stakeStatement:
        'At #1-category US volume, a one-percent miss on Nava\'s outbound dock-turn cadence is a measurable share of the country\'s best-selling beer not in transit on a given afternoon. Veracruz comes online with no entrenched site-level SOP to displace; the operating standard installed in 2026 is the one that defines yard execution at the newest piece of the network for the next decade.',

      heroOverride: {
        headline: 'The yard layer crosses a border. Most operating models stop at the customs line.',
        subheadline:
          'Modelo, Corona, and Pacifico are brewed in Mexico for the US market under the 2013 settlement. Nava and Obregón ship across the border into US DCs and the three-tier wholesaler network. Veracruz comes online in 2025 with no entrenched yard SOP to displace. The operating standard that runs both sides of that flow is the unsolved layer.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Peer-to-peer supply-chain-operator framing. The Wine Group divestiture and the Veracruz ramp are the operating context — name them as facts, not as urgency manufacturing. The cross-border dimension is the analytical wedge; lead with it. Acknowledge the Primo comparable for shape and flag the customs-cadence layer as the thing the comparable does not cover.',
      kpiLanguage: [
        'cross-border dock-turn cadence',
        'outbound brewery yard cycle',
        'US-side DC receiving variance',
        'wholesaler pickup window',
        'multi-site yard operating standard',
        'greenfield yard-ops design',
        'detention spend',
        'gate-to-dock dwell',
      ],
      proofEmphasis:
        'Primo is the public comparable to cite — same beverage-network shape, same weight-out-before-cube-out trailer economics, already running a network-level operating model on top of site-level yard systems. Be explicit that the cross-border layer is what Primo doesn\'t cover and Constellation specifically needs.',
    },
  ],

  proofBlocks: [
    {
      type: 'metric',
      stats: [
        { value: '24', label: 'Facilities Live', context: 'Measured at comparable beverage operations' },
        { value: '>200', label: 'Contracted Network', context: 'Contracted for rollout across comparable verticals' },
        { value: '48-to-24', label: 'Min Truck Turn Time', context: 'Average improvement in drop-hook cycle' },
        { value: '$1M+', label: 'Per-Site Profit Impact', context: 'Measured at beverage facilities' },
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
    facilityCount: 'Three Mexican breweries (Nava ~370M cases/yr; Obregón ~170M cases/yr; Veracruz ramping late 2025, ~30M hL added on completion) + US-side distribution centers and cross-border receiving yards',
    facilityTypes: ['Breweries (Mexico)', 'Cross-Border Receiving Yards (US)', 'Distribution Centers', 'Premium Wine Operations (CA Napa)'],
    geographicSpread:
      'Mexico (Nava, Coahuila · Ciudad Obregón, Sonora · Veracruz) and United States (cross-border DCs serving the three-tier wholesaler network; small premium wine footprint in CA Napa Valley post-divestiture). HQ in Victor, NY.',
    dailyTrailerMoves: 'High-volume cross-border outbound from the Mexican breweries; US-side inbound at the receiving DCs gated by CBP windowing and bridge-crossing variance',
  },

  freight: {
    primaryModes: ['Truckload (cross-border)', 'Intermodal/Rail (cross-border)', 'Truckload (US-side DC-to-wholesaler)'],
    avgLoadsPerDay: 'High-volume — concentrated on the Nava and Obregón corridors today, with Veracruz adding a third outbound corridor as it ramps in 2025–2026',
  },

  signals: {
    recentNews: [
      'Veracruz brewery ramping into commercial production late 2025 — third Mexican brewery, ~30M hL added on completion. Greenfield yard-ops design window.',
      'FY24–FY26 beer capex ~$4–4.5B against the Mexican brewery footprint (Veracruz buildout + Obregón expansion + Nava maintenance).',
      'Wine Group transaction closed June 2025 — ~$846M cash for Woodbridge, Meiomi, Robert Mondavi Private Selection, Cook\'s, SIMI, J. Rogét. Retained portfolio is beer-led with premium wine (Robert Mondavi Winery, The Prisoner) and craft spirits (Casa Noble, Mi Campo, High West).',
      'Modelo Especial held #1 US beer by dollars through 2025 (~$5.2B, ~8% category share) before Michelob Ultra tightened the gap in late 2025.',
      'The 2013 AB-InBev / DOJ settlement remains the structural constraint: Mexican beer brands sold in the US are brewed in Mexico, fixing the cross-border yard-ops question in place.',
    ],
    urgencyDriver:
      'Two converging windows: (1) Veracruz greenfield brewery yard-ops design happens once, in 2025–2026, and the operating standard installed there defines yard execution at the newest piece of the network for the next decade; (2) the Wine Group divestiture closed in mid-2025 and freed supply-chain operating attention back toward the beer franchise at the same moment that the #1-category volume sensitivity to yard variance is most visible.',
  },

  theme: {
    accentColor: '#7C3AED',
    backgroundVariant: 'dark',
  },
};
