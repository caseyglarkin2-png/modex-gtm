/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Cost Plus World Market is a confirmed PINC/Kaleris incumbent per the Kaleris
 * YMS case study archive (2026) and the Kaleris/Daimler case study customer list.
 * The named operating sponsor on-record in the published case study is Steve Ming,
 * Sr. Director of Distribution & Domestic Logistics. Specifics:
 *   - PINC deployed at Stockton CA and Windsor VA distribution centers
 *   - Cited wins: fewer trailers, fewer yard drivers, lower fuel consumption, elimination
 *     of cell phone-based yard coordination
 *   - 2M sq ft total DC footprint, 100+ dock doors, 550 trailer positions across 2 DCs
 *
 * This intel powers the "displacement" cold-email framing (see
 * docs/research/steve-ming-cost-plus-world-market-dossier.md and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section.
 */

/**
 * Cost Plus World Market — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — case study archive; also Daimler case study list)
 * Pitch shape: displacement
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

  pageTitle: 'YardFlow for Cost Plus World Market - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Cost Plus World Market\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'cost-plus-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Cost Plus World Market',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Distribution',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'cost-plus-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Cost Plus World Market',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Distribution',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Cost Plus World Market',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Cost Plus World Market appears in the Kaleris YMS case study archive with documented results: fewer trailers, fewer yard drivers, lower fuel consumption, and elimination of cell phones. The displacement angle: whether the site-level YMS model has aged into a constraint as the retail network evolved.',
      openingHook: 'Cost Plus World Market proved yard automation delivers fewer trailers, fewer drivers, and lower fuel costs at the site level. The question is whether that model scales across the network.',
      stakeStatement: 'A site-level YMS that delivered results a decade ago may now be the constraint — if the yard operating model hasn\'t kept pace with the retail network.',

      heroOverride: {
        headline: 'Cost Plus World Market proved site-level yard automation. YardFlow asks whether the model still fits.',
        subheadline: 'Kaleris documented fewer trailers, fewer yard drivers, lower fuel, and elimination of cell phones. The displacement conversation is whether that site tool is still the right model for the current network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Retail operator framing. Acknowledge the legacy Kaleris win — displacement angle is whether the site model has aged out.',
      kpiLanguage: ['trailer count', 'yard driver count', 'fuel consumption', 'cell phone elimination', 'network-level throughput'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '2 distribution centers, ~2M sq ft total, 100+ dock doors, 550 trailer positions (Stockton CA + Windsor VA); ~250 specialty retail stores',
    facilityTypes: ['Distribution Centers', 'Retail Store Yards'],
    geographicSpread: 'National (HQ: Alameda, CA; DC1: Stockton CA; DC2: Windsor VA)',
    dailyTrailerMoves: 'High-volume — mixed dry and refrigerated trailer fleet serving ~250 specialty retail locations',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Import Container'],
    avgLoadsPerDay: 'High-volume — heavy international inbound (Asia furniture/textiles, Europe wine/food) plus domestic store replenishment',
    specialRequirements: ['International container import', 'Refrigerated wine and gourmet food', 'Bursty seasonal inbound (Q4 holiday)'],
  },

  signals: {
    recentNews: [
      'Kingswood Capital ownership since January 2021 (acquired from Bed Bath & Beyond for $110M).',
      '~250 specialty retail stores; heavy international inbound distinguishes Cost Plus from generic specialty retail.',
    ],
    urgencyDriver: 'A 2-DC network running mixed-temperature flow at 250-store retail throughput has grown structurally since the original site-level deployment. The question is whether the site-level operating model still fits the current network shape — or whether the distribution infrastructure has outgrown what a single-facility YMS was designed to manage.',
  },

  theme: {
    accentColor: '#8B4513',
  },
};
