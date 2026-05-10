/**
 * Westrock Coffee — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — Inbound Logistics report on S&D/Westrock yard ops)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const westrockCoffee: AccountMicrositeData = {
  slug: 'westrock-coffee',
  accountName: 'Westrock Coffee',
  parentBrand: 'Westrock Coffee Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'YardFlow for Westrock Coffee - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Westrock Coffee\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'westrock-coffee-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'Director Freight Logistics',
      company: 'Westrock Coffee',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Logistics / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'westrock-coffee-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'Director Freight Logistics',
        company: 'Westrock Coffee',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Logistics / Supply Chain',
      },
      fallbackLane: 'logistics',
      label: 'Director Freight Logistics - Westrock Coffee',
      variantSlug: 'director-freight-logistics',

      framingNarrative: 'Westrock Coffee inherited S&D Coffee & Tea\'s Kaleris YMS and continues to use it for visibility, move requests, and driver workflow across a multi-county facility spread that grew from 120-130 trailers to roughly 400. The modernization angle: phone-based move coordination was the pain — the next step is a digital driver journey and network-wide standardization.',
      openingHook: 'Westrock Coffee grew from 120 trailers to 400 and replaced phone-based yard coordination with Kaleris. Here\'s what the next layer of the digital driver journey looks like.',
      stakeStatement: 'Phone coordination replaced — but the gap between shared move queues and a fully digital driver journey is where the next throughput gain lives.',

      heroOverride: {
        headline: 'Westrock Coffee replaced phone-based yard coordination. YardFlow adds the digital driver journey.',
        subheadline: 'From 120 to 400 trailers across five county-spread locations. Shared move queues replaced phones — the next step is standardizing the full gate-to-dock-to-checkout driver journey.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Logistics modernization framing. Acknowledge the Kaleris move-queue win — position YardFlow as the digital driver journey layer on top.',
      kpiLanguage: ['driver journey', 'move request cycle', 'trailer dwell', 'phone coordination reduction', 'network output per resource'],
    },
  ],

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'Inbound Logistics: Westrock Coffee replaced phone-based move coordination; increased output using same resources',
      quote: {
        text: 'Westrock Coffee uses Kaleris YMS shared queues and says efficiencies allow more output using the same resources. Yard grew from 120-130 trailers to roughly 400.',
        company: 'Inbound Logistics, January 2026',
      },
    },
  ],

  network: {
    facilityCount: 'Offices in 10 countries; inherited S&D multi-site yard operation across 5 county-spread locations',
    facilityTypes: ['Coffee Processing Plants', 'Distribution Centers'],
    geographicSpread: 'North America / Global (HQ: Little Rock, AR)',
    dailyTrailerMoves: '400+ trailers across the yard network',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Inbound Logistics January 2026 reports Westrock Coffee uses Kaleris YMS shared move-request queue and real-time visibility.',
      'Digital driver journey wedge — replace phone coordination with full gate-to-dock standardization.',
    ],
    urgencyDriver: 'Modernization wedge — digital driver journey plus network standardization on top of existing Kaleris move queues.',
  },

  theme: {
    accentColor: '#6B3A2A',
  },
};
