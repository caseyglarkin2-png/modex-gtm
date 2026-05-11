/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Cost Plus World Market is a confirmed PINC/Kaleris incumbent per the
 * Kaleris published case study (Kaleris.com). Steve Ming (Sr. Director,
 * Distribution & Domestic Logistics) is the named on-record operating
 * sponsor. Specifics:
 *   - 2 DCs (Stockton CA + Windsor VA), ~2M sq ft total, 100+ dock doors,
 *     550 trailer positions
 *   - Cited wins: cut yard-driver headcount to one-per-shift-per-facility;
 *     eliminated daily yard checks; reduced fleet pool; reduced fuel; ended
 *     cellphone yard coordination; refrigerated-trailer prioritization is
 *     a documented soft saving
 *   - PINC tractor-mounted RFID Tracker hardware in use on yard trucks —
 *     hardware footprint factor for any successor system
 *   - Likely 2014–2016 vintage deployment; ~10+ year incumbent
 *
 * Ownership: Kingswood Capital Management (acquired from Bed Bath & Beyond
 * January 2021 for $110M). Year 5 of PE hold; CIM-friendly hard-savings
 * narrative is the language Kingswood operating partners speak.
 *
 * Pitch shape: COEXISTENCE WEDGE (the in-yard execution + multi-temp
 * arbitration layer above the existing site-level RFID gate-and-locate
 * system). Steve is the named buyer of the incumbent — any displacement
 * pitch goes through him, not around him. Position as continuation of his
 * trajectory, not as criticism of the prior decision.
 *
 * This intel powers the cold-email coexistence framing (see
 * docs/research/steve-ming-cost-plus-world-market-dossier.md). It must not
 * appear in any prospect-facing surface. The memo references "your existing
 * site-level yard automation" / "the gate-and-locate layer you already
 * operate" — never Kaleris/PINC.
 */

/**
 * Cost Plus World Market — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — published case study with
 *                  Steve Ming on the record; 2-DC, 550-trailer, mixed-temp
 *                  retail network)
 * Pitch shape: coexistence wedge — operating-model layer above the existing
 *              site-level YMS, evolution not displacement
 * Angle: YARD MANAGEMENT (refrigerated-trailer prioritization at the dock,
 *        mixed dry + reefer 2-DC network, retail-store-replenishment cadence,
 *        bursty international-import inbound) — NOT driver experience
 * Stakeholder vocabulary: hard-savings operator register
 *        (Ming's carrier-to-shipper crossover background; PE-owned
 *        portfolio company; Kingswood operating-partner review cadence) —
 *        IRR, hard savings, operating-partner review, capex justification
 */

import type { AccountMicrositeData } from '../schema';

export const costPlusWorldMarket: AccountMicrositeData = {
  slug: 'cost-plus-world-market',
  accountName: 'Cost Plus World Market',
  parentBrand: 'World Market',
  vertical: 'retail',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 73,

  pageTitle: 'YardFlow for Cost Plus World Market - The Layer Above the Stockton and Windsor Yards',
  metaDescription:
    'How a network-level yard operating model lands on top of the existing 2-DC site-level yard automation Cost Plus World Market has run at Stockton CA and Windsor VA — extending the published hard-savings curve under Kingswood ownership without re-implementing the existing trailer-mounted RFID hardware.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Cost Plus World Market network',
      composition: [
        { label: 'DC footprint', value: '2 distribution centers — Stockton CA (west-coast DC; west-coast store replenishment + import receiving from Port of Oakland / LA-Long Beach) and Windsor VA (east-coast DC; east-coast store replenishment + import receiving from Norfolk / Savannah ports). 2 million sq ft total, 100+ dock doors, 550 trailer positions combined' },
        { label: 'Retail surface', value: '~250 specialty retail locations across the US (range across sources 243–258; ~277 pre-2021-sale peak); roughly 125 stores apiece east-west split' },
        { label: 'Inbound profile', value: 'Heavy international import — furniture, textiles, ceramics from Southeast Asia and India; food and wine from Europe and South America; home decor globally. Ocean container → port → DC dominant. Bursty seasonality (Q4 holiday, Q1 spring resets, mid-summer back-to-school)' },
        { label: 'Mixed-temperature dock', value: 'Mixed dry and refrigerated trailer fleet at both DCs. Wine, beer, and gourmet food run alongside furniture and home decor. Refrigerated-trailer prioritization is the documented soft-saving from the site-level yard automation' },
        { label: 'Existing yard-tech layer', value: 'Site-level yard automation has been in production at both DCs for roughly a decade. Published wins are real: yard-driver headcount cut to one-per-shift-per-facility, daily yard checks eliminated, fleet pool reduced, fuel reduced, cellphone yard coordination ended. Trailer-mounted RFID Tracker hardware in use on yard trucks. The network-operating-model layer above the site system is unsolved' },
        { label: 'Ownership posture', value: 'Kingswood Capital Management since January 2021 (acquired from Bed Bath & Beyond for $110M). Middle-market operational-PE shop; year 5 of hold. Operating-partner reviews speak hard savings, IRR, and operating-partner-review cadence — the same dialect the original case-study justification spoke' },
      ],
      hypothesis:
        'The interesting thing about the Cost Plus yard math is what site-level success has not yet done. The yard automation deployment at Stockton and Windsor worked. Yard-driver headcount came down to one-per-shift-per-facility, daily yard checks went away, fleet pool reduction was earned, fuel came out, and the cellphone yard coordination model ended. Those are real wins; the case study is public; the operating sponsor is named. That part of the conversation is closed at the site level, and it has been closed for roughly a decade. What is unsolved is the layer above. Two DCs running site-level operating models against a 250-store retail surface accumulates a different problem than the one yard automation solved a decade ago. First, the mixed-temperature dock complexity at both Stockton and Windsor is structurally harder than the dry-DC norm the original deployment was sized against — refrigerated wine, cheese, and gourmet food share dock surface with furniture and ambient home decor, and the marginal minute of dwell on a reefer is a margin point you cannot recover with price. Second, bursty international-inbound seasonality (Q4 holiday, Q1 spring resets, mid-summer back-to-school) compresses port-to-DC trailer flow into narrow windows; the site-level system arbitrates inside-a-DC priority, not cross-DC capacity arbitration. Third, year 5 of Kingswood ownership is the moment operational PE shops underwrite a fresh hard-savings story — Kingswood operating partners run quarterly P&L reviews where DC operating cost is a recurring line item, and yard-related costs are exactly the category most-frequently questioned. The original case study justification is the dialect Kingswood speaks. The same dialect justifies the layer above the site system, in the same format, ten years later.',
      caveat:
        'This is built from Cost Plus / Kingswood public disclosures, the published yard-automation case study, third-party retail-data sources, and reasonable network inference. We may be wrong about parts of it — the most useful thing you can do with this is push back on the parts that don\'t match what your team is seeing: whether the Stockton vs. Windsor mixed-temp dock contention is biting harder at one DC than the other right now, how the bursty Q4 international-inbound waves are being arbitrated against west-coast vs. east-coast capacity, and whether the trailer-mounted RFID hardware footprint is in a refresh window in 2026.',
    },
    {
      type: 'comparable',
      headline: 'What a comparable network did when they closed the same gap',
      comparableName: 'Primo Brands',
      comparableProfile:
        'Primo Brands runs what is, by most operating measures, the hardest CPG freight in North America. Bottled water is heavy (a fully loaded trailer maxes gross-vehicle weight before it maxes cube), low-margin (every minute of yard waste is a margin point you cannot recover with price), shipped across multi-temp (premium SKUs sit alongside ambient), and complicated by return-flow logistics for refillable formats. Primo is years ahead of every other CPG category on yard automation and digitization, and they have layered a network-level operating model on top of their existing site-level yard systems. The Cost Plus operating profile is shape-similar at the mixed-temperature 2-DC level — refrigerated wine and gourmet food running alongside dry furniture and home decor through the same yard surface, with high-bursty international-import seasonality — but at a more forgiving per-trailer margin profile than water. If a network operating model can run on water — the hardest CPG freight in the country — the read-across to a 2-DC mixed-temp specialty-retail network with bursty international inbound is the easier lift.',
      metrics: [
        { label: 'Avg truck turn time', before: '48 min', after: '24 min', delta: '−50%' },
        { label: 'Per-site profit impact', before: 'Pre-deployment baseline', after: '$1M+ measured', delta: 'measured' },
        { label: 'Dock-office headcount during volume growth', before: 'Scaled with volume', after: 'Held flat while absorbing more volume', delta: 'qualitative' },
        { label: 'Network rollout cadence', before: 'Site-by-site reinvention', after: '24 facilities live · >200 contracted', delta: 'measured' },
      ],
      timeline:
        '30–60 days from kickoff to first measurable impact at the pilot site. The cleanest first pilot at Cost Plus is Stockton — west-coast DC, west-coast import-receiving anchor, and the site where the published hard-savings curve is most documented. Windsor follows as the east-coast mirror, with the bursty international-inbound Q4 seasonality as the natural cross-DC arbitration test. We would expect the network to make sense of itself within two to four quarters of the pilot.',
      referenceAvailable: true,
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'cpwm-public-network',
          source: 'Cost Plus World Market + Kingswood Capital public disclosures',
          confidence: 'public',
          detail: 'Anchors the 2-DC footprint (Stockton CA + Windsor VA), the ~250-store specialty retail count, the Kingswood Capital acquisition from Bed Bath & Beyond (January 2021, $110M), and the Steve Ming Sr. Director of Distribution & Domestic Logistics seat.',
          url: 'https://www.worldmarket.com/',
        },
        {
          id: 'cpwm-published-case-study',
          source: 'Published yard-automation case record (Cost Plus World Market)',
          confidence: 'public',
          detail: 'The 2-DC site-level yard automation deployment is publicly documented. Published scope: 2 million sq ft, 100+ dock doors, 550 trailer positions, mixed dry and refrigerated trailer fleet. Cited wins: cut yard-driver headcount to one-per-shift-per-facility; eliminated daily yard checks; reduced fleet pool; reduced fuel; ended cellphone yard coordination. Refrigerated-trailer prioritization documented as a soft saving.',
        },
        {
          id: 'kingswood-acquisition',
          source: 'Kingswood Capital Management acquisition disclosures',
          confidence: 'public',
          detail: 'Kingswood completed the $110M acquisition from Bed Bath & Beyond in January 2021. Kingswood is a middle-market operational-PE shop, not a financial-engineering shop — operating-partner reviews on a quarterly P&L cadence are the recurring forum where DC operating cost is questioned.',
        },
        {
          id: 'cpwm-mixed-temp-import',
          source: 'Cost Plus specialty-retail assortment + international inbound public references',
          confidence: 'public',
          detail: 'Heavy international inbound (Southeast Asia, India, Europe, South America) — ocean container → port → DC dominant. Mixed-temperature trailer fleet (wine, beer, gourmet food alongside ambient). Bursty seasonality at Q4 holiday, Q1 spring resets, mid-summer back-to-school.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dock-cycle variance, dwell-time distributions, and detention-cost ranges. These describe the conditions most multi-DC retail networks operate under, not Cost Plus specifically.',
        },
        {
          id: 'primo-q1-2025',
          source: 'Primo Brands operating data (under NDA)',
          confidence: 'measured',
          detail: 'Post-deployment turn time, dock-office headcount during volume growth, and per-site profit impact have been shared with us by the Primo CFO and ops team. Specific numbers are referenceable in a peer call when relevant.',
        },
      ],
      unknowns: [
        'Whether mixed-temp dock contention is biting harder at Stockton or Windsor today — and which DC is closest to dock-cycle saturation in the Q4 inbound window',
        'How bursty Q4 international-inbound waves are being arbitrated against the 550 combined trailer positions today — and whether cross-DC capacity is balanced or absorbed locally',
        'Whether the existing trailer-mounted RFID hardware footprint is approaching a natural refresh cycle in 2026 — and what the migration path looks like for the existing tractor-mounted hardware',
        'How refrigerated-trailer prioritization currently runs day-to-day — whether the workflow is whatever the existing system enables, or whatever the operating team has built around it',
        'How carrier-experience metrics for the common-carrier-dominated inbound currently surface — and where the worst carrier scorecards land at the gate',
        'How Kingswood operating-partner reviews currently treat DC operating cost as a recurring line item, and what the format of the most recent quarterly hard-savings ask was',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement. Cost Plus is distinctive in this round because the case for site-level yard automation is not in dispute and should not be relitigated; it was won at Stockton and Windsor roughly a decade ago and the hard-savings list is one of the cleanest YMS ROI cases on the public record. The unsolved problem is the operating model that sits above the two site-level systems — the mixed-temp dock arbitration logic, the cross-DC capacity arbitration during Q4 bursty inbound, and the next slice of hard savings that falls to the operating-model layer rather than the YMS layer. The water comparable is intentional: Primo Brands runs the operationally hardest CPG freight in the country, and the mixed-temp 2-DC retail read-across is the easier lift.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally for Cost Plus — particularly which DC is running closer to mixed-temp dock-cycle saturation today, how Q4 international inbound is being arbitrated across Stockton and Windsor, or where the trailer-mounted RFID hardware footprint sits in the 2026 refresh window — that\'s the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  needsHandTuning: false,

  people: [
    {
      personaId: 'cost-plus-001',
      name: 'Steve Ming',
      firstName: 'Steve',
      lastName: 'Ming',
      title: 'Senior Director, Distribution & Domestic Logistics',
      company: 'Cost Plus World Market',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Logistics / Supply',
      currentMandate:
        'Owns Cost Plus distribution operations and domestic logistics across the 2-DC network (Stockton CA + Windsor VA). ~17+ year tenure at Cost Plus (joined December 2008). Based in Acampo CA, 30 miles from the Stockton DC. Carrier-side background before crossing over to the BCO side — sharp view of driver wait, detention math, and carrier scorecards. Named operating sponsor of record on the published site-level yard automation case study — the existing deployment is his win.',
      bestIntroPath:
        'Warm carrier-side network is the most reliable door (Ming is geographically grounded in the Stockton / Central Valley logistics community). Specialty-retail supply-chain peer network (Crate & Barrel, Pier 1 alumni, Williams-Sonoma) is the second route. Going to the Kingswood operating-partner team or to Eric Hunter / Barry J. Feld (current CEO unclear across sources) without Steve\'s awareness will end this account immediately — he is the path, not the obstacle.',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'cost-plus-001',
        name: 'Steve Ming',
        firstName: 'Steve',
        lastName: 'Ming',
        title: 'Senior Director, Distribution & Domestic Logistics',
        company: 'Cost Plus World Market',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Logistics / Supply',
      },
      fallbackLane: 'logistics',
      label: 'Steve Ming - Senior Director, Distribution & Domestic Logistics',
      variantSlug: 'steve-ming',

      framingNarrative:
        'Steve, the operator discipline you carried from the carrier side into the BCO seat — driver wait math, detention dollars, fleet-pool economics — is the discipline you applied at Stockton and Windsor a decade ago to stand up the site-level yard automation deployment. The published hard-savings list (yard-driver headcount to one-per-shift, daily yard checks eliminated, fleet pool reduced, fuel reduced, cellphone yard coordination ended, refrigerated-trailer prioritization as the documented soft-saving) is one of the cleanest YMS ROI cases on the public record. That work is the starting point for the layer above — and Kingswood\'s year-5 operating-partner review cadence is the dialect that recognizes the same hard-savings format ten years later.',
      openingHook:
        'The site-level yard automation you stood up at Stockton and Windsor cut yard-driver headcount to one-per-shift-per-facility, eliminated daily yard checks, reduced fleet pool, reduced fuel, and ended cellphone yard coordination. The case study is one of the cleanest YMS ROI stories on the public record and the work is yours. The unsolved layer is the operating model above the two site systems: mixed-temp dock arbitration logic, cross-DC capacity arbitration during Q4 bursty inbound, and the next slice of hard savings that falls to the operating-model layer rather than the YMS layer.',
      stakeStatement:
        'Year 5 of Kingswood ownership is the moment operational PE shops underwrite a fresh hard-savings story for the CIM. Kingswood operating-partner reviews run on a quarterly P&L cadence where DC operating cost is a recurring line item — and yard-related costs are exactly the category most-frequently questioned. You can either bring the partners a fresh hard-savings story in the same format that justified the original deployment, or wait until they ask why DC operating cost has not moved in three years.',

      heroOverride: {
        headline: 'The hard-savings list at Stockton and Windsor was the start. The layer above is the next.',
        subheadline:
          'Site-level yard automation is proven at Cost Plus — the case study is public, the yard-driver headcount and fleet-pool numbers are real. The mixed-temp 2-DC operating model layer above it — the one Kingswood\'s year-5 operating-partner review cadence recognizes in the same hard-savings format — is where the next slice lives.',
      },
      sectionOrder: ['yns-thesis', 'observation', 'comparable', 'methodology', 'about'],

      toneShift:
        'Operator-to-operator, hard-savings dialect. Steve sells results internally in dollars, not narratives. PE-portfolio capex discipline is real; Kingswood IRR and operating-partner-review language lands. Acknowledge the existing site-level yard automation as a win — it is one. Position the wedge as the layer above (network-level operating model + mixed-temp arbitration + cross-DC capacity arbitration), not as replacement. Specific by name — Stockton west-coast, Windsor east-coast, refrigerated-trailer prioritization, trailer-mounted RFID hardware migration plan. Pre-empt the hardware-investment objection: keep the existing tractor-mounted hardware, here is the migration path.',
      kpiLanguage: [
        'hard savings',
        'yard-driver headcount',
        'fleet pool',
        'fuel and M&R',
        'detention recovery',
        'refrigerated-trailer prioritization',
        'cross-DC capacity arbitration',
        'mixed-temp dock-cycle envelope',
        'Kingswood operating-partner review cadence',
        'IRR and capex justification',
      ],
      proofEmphasis:
        'Primo is the *public* comparable to cite — same multi-site, multi-temp shape, harder freight (water), already running the network-level layer above existing site-level yard systems. The directly-shaped comparable (un-name-able 237-facility CPG anchor) is the credibility flex if peer reference becomes the topic — same mixed-temp, multi-DC, retail-cadence-pressure shape with a documented displacement of an incumbent yard system.',
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '2 distribution centers — Stockton CA (west-coast DC, west-coast store replenishment + port import receiving) and Windsor VA (east-coast DC, east-coast store replenishment + port import receiving). 2 million sq ft total, 100+ dock doors, 550 trailer positions combined. ~250 specialty retail store locations',
    facilityTypes: ['Distribution Centers', 'Retail Store Yards'],
    geographicSpread: 'National (HQ: Alameda CA; DC1: Stockton CA; DC2: Windsor VA; ~250 store locations split roughly half-and-half east-west)',
    dailyTrailerMoves: 'High-volume — mixed dry and refrigerated trailer fleet across 550 trailer positions; bursty seasonal compression at Q4 holiday, Q1 spring resets, mid-summer back-to-school',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'International Container (ocean → port → DC)', 'Refrigerated (wine, gourmet food)'],
    avgLoadsPerDay: 'High-volume — heavy international inbound (Asia furniture/textiles, Europe wine/food) plus domestic store replenishment across ~250 specialty retail locations',
    specialRequirements: [
      'International container import (Port of Oakland / LA-Long Beach at Stockton; Norfolk / Savannah at Windsor)',
      'Refrigerated trailer prioritization (wine, beer, gourmet food)',
      'Mixed-temperature dock surface (reefer alongside ambient furniture and home decor)',
      'Bursty seasonal inbound (Q4 holiday, Q1 spring resets, mid-summer back-to-school)',
      'Trailer-mounted RFID hardware on existing yard tractors (migration consideration for any successor)',
    ],
  },

  signals: {
    recentNews: [
      'Kingswood Capital ownership since January 2021 (acquired from Bed Bath & Beyond for $110M); year 5 of PE hold positions a fresh hard-savings narrative for the next CIM.',
      'Specialty retail margin compression is industry-wide (Crate & Barrel, HomeGoods/TJX, Amazon for the same imported-decor share of wallet); DC operating cost is one of the few levers that does not trade off against merchandising.',
      'Imported-goods tariff exposure: structural exposure to any port disruption or tariff shift on Southeast Asian / European imports. Yard-execution agility becomes more valuable in volatile-import periods.',
      'Site-level yard automation case study (~2 million sq ft, 100+ dock doors, 550 trailer positions, mixed dry + reefer) is one of the cleanest YMS ROI cases on the public record — the dialect the original justification spoke is the dialect Kingswood operating partners speak today.',
    ],
    urgencyDriver:
      'A 2-DC mixed-temperature network running roughly a decade into a site-level yard automation deployment has earned the published hard-savings list — and the marginal hour at the site level gets harder every quarter. Year 5 of Kingswood ownership is the moment operational PE shops underwrite a fresh hard-savings story for the next CIM, in the same format that justified the original deployment a decade ago. The operating-model layer above the two site systems — mixed-temp dock arbitration, cross-DC capacity arbitration during Q4 bursty inbound, and the next slice of hard savings that falls to operating-model logic rather than YMS records — is the no-capex margin lever that compounds the original win.',
  },

  theme: {
    accentColor: '#8B4513',
  },
};
