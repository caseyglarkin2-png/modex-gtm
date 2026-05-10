/**
 * Universal Logistics Holdings — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — Universal Truckload Services named in Daimler case study list)
 * Pitch shape: partnership
 */

import type { AccountMicrositeData } from '../schema';

export const universalLogisticsHoldings: AccountMicrositeData = {
  slug: 'universal-logistics-holdings',
  accountName: 'Universal Logistics Holdings',
  parentBrand: 'Universal Logistics Holdings',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 68,

  pageTitle: 'YardFlow for Universal Logistics Holdings - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Universal Logistics Holdings\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'universal-logistics-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Operations',
      company: 'Universal Logistics Holdings',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Operations / Transportation',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'universal-logistics-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Operations',
        company: 'Universal Logistics Holdings',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Operations / Transportation',
      },
      fallbackLane: 'ops',
      label: 'VP Operations - Universal Logistics Holdings',
      variantSlug: 'vp-operations',

      framingNarrative: 'Universal Truckload Services appears in the PINC/Kaleris Daimler case study customer list. A carrier and contract logistics network of this size running fragmented yard protocols is a private-fleet trailer-control conversation. Verify before naming PINC — then lead with trailer control and network consistency.',
      openingHook: 'Universal Logistics\' carrier and contract logistics network benefits from one trailer-control standard across every site. Here\'s what that conversation looks like.',
      stakeStatement: 'A distributed truckload and contract logistics network without one trailer-control operating standard is accumulating dwell, detention, and customer-visibility gaps at every facility.',

      heroOverride: {
        headline: 'Universal Logistics Holdings is ready for a trailer-control network conversation.',
        subheadline: 'Truckload, contract logistics, intermodal, and value-added services across a distributed network. One yard operating standard changes trailer dwell, detention, and customer-facing visibility.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Carrier/3PL partnership framing. Lead with trailer control and customer-facing visibility. Verify PINC footprint first.',
      kpiLanguage: ['trailer dwell', 'detention cost', 'private fleet utilization', 'on-time pickup', 'customer visibility'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Distributed logistics network (see dossier)',
    facilityTypes: ['Truckload Terminals', 'Contract Logistics Sites', 'Intermodal Ramps'],
    geographicSpread: 'North America (HQ: Warren, MI)',
    dailyTrailerMoves: 'see dossier',
    fleet: 'Private fleet signal confirmed (yes)',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'Contract Logistics'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Universal Truckload Services named in Kaleris/PINC Daimler case study customer list. Manual review required before asserting PINC usage.',
    ],
    urgencyDriver: 'Private fleet trailer control wedge — validate then approach with customer-facing network consistency angle.',
  },

  theme: {
    accentColor: '#1E3A5F',
  },
};
