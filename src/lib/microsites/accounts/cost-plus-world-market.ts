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

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'Kaleris case study: Cost Plus achieved fewer trailers, fewer yard drivers, lower fuel, and cell phone elimination',
      quote: {
        text: 'Kaleris archive references fewer trailers, fewer yard drivers, lower fuel consumption, and elimination of cell phones at Cost Plus World Market.',
        company: 'Kaleris YMS case study archive, 2026',
      },
    },
  ],

  network: {
    facilityCount: 'National store network; distribution footprint see dossier',
    facilityTypes: ['Distribution Centers', 'Retail Store Yards'],
    geographicSpread: 'North America (HQ: Alameda, CA)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Import Container'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Confirmed in Kaleris YMS archive and Daimler case study customer list. Legacy YMS modernization wedge applies.',
    ],
    urgencyDriver: 'Legacy YMS modernization wedge — assess whether site-level Kaleris model still fits the current network.',
  },

  theme: {
    accentColor: '#8B4513',
  },
};
