/**
 * Boston Beer Company — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — Boston Brewing named in HID/RFID.com PINC customer list)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const bostonBeerCompany: AccountMicrositeData = {
  slug: 'boston-beer-company',
  accountName: 'Boston Beer Company',
  parentBrand: 'Boston Beer Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 73,

  pageTitle: 'YardFlow for Boston Beer Company - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Boston Beer Company\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'boston-beer-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Operations',
      company: 'Boston Beer Company',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Operations / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'boston-beer-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Operations',
        company: 'Boston Beer Company',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Operations / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Operations - Boston Beer Company',
      variantSlug: 'vp-operations',

      framingNarrative: 'Boston Brewing is named in the HID/RFID.com PINC/Kaleris passive RFID customer list. Multi-site brewery and distribution network with production-yard complexity. Verify site history before PINC assertion — then use a production-yard modernization angle.',
      openingHook: 'Boston Beer\'s multi-site brewery network runs the same production-yard complexity as the largest beverage manufacturers. Here\'s what one operating standard changes.',
      stakeStatement: 'Production-yard variance at a multi-site brewery compounds into schedule slippage, carrier detention, and dock contention — at every site that runs a different protocol.',

      heroOverride: {
        headline: 'Boston Beer Company\'s brewery network is ready for a production-yard standardization conversation.',
        subheadline: 'Multi-site brewery and distribution. One yard operating standard across gate, dock, and driver journey standardizes throughput and reduces detention across the network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Beverage manufacturing operator framing. Verify PINC site history before naming it in outreach.',
      kpiLanguage: ['production-yard throughput', 'truck turn time', 'detention cost', 'dock utilization', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Multi-site brewery and distribution network (see dossier)',
    facilityTypes: ['Breweries', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Boston, MA)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Boston Brewing named in HID/RFID.com PINC/Kaleris passive RFID customer list (2026). Verify site history.',
    ],
    urgencyDriver: 'Manufacturing yard orchestration wedge — verify PINC footprint before asserting in outreach.',
  },

  theme: {
    accentColor: '#8B1A1A',
  },
};
