/**
 * Kraft Heinz — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — case study PDF)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const kraftHeinz: AccountMicrositeData = {
  slug: 'kraft-heinz',
  accountName: 'Kraft Heinz',
  parentBrand: 'The Kraft Heinz Company',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 89,

  pageTitle: 'YardFlow for Kraft Heinz - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Kraft Heinz\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'kraft-heinz-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Kraft Heinz',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kraft-heinz-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Kraft Heinz',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Kraft Heinz',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Kraft Heinz moved from clipboard-and-spreadsheet yard management to Kaleris and proved 50% reduction in truck and driver resources. The question now is whether site-level YMS visibility is the same as a network operating model.',
      openingHook: 'You already ran the yard automation playbook at the site level. Here\'s what a network-wide standard changes.',
      stakeStatement: 'Demurrage, detention, and manual yard checks don\'t stop at one site — they compound across every facility that still runs its own protocol.',

      heroOverride: {
        headline: 'Kraft Heinz proved site-level yard automation. YardFlow closes the network gap.',
        subheadline: 'Your Kaleris deployment reduced truck and driver resources by 50% at the site level. YardFlow standardizes gate, dock, driver journey, and exceptions across the whole network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Peer-to-peer operator framing. Acknowledge the existing Kaleris deployment — this is displacement from fragmented site tools to a network operating model.',
      kpiLanguage: ['truck turn time', 'detention cost', 'demurrage', 'dock utilization', 'driver resources'],
    },
  ],

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'Kaleris case study: Kraft achieved 50% reduction in truck and driver resources at site level',
      quote: {
        text: 'Kraft moved from clipboard and spreadsheet yard management to Kaleris YMS and achieved yard labor, fleet, fuel, reporting, and detention benefits.',
        company: 'Kaleris case study, 2025',
      },
    },
  ],

  network: {
    facilityCount: 'Large distributed manufacturing and distribution network (see dossier)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Chicago, IL / Pittsburgh, PA)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'LTL', 'Intermodal'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Kaleris case study documents Kraft moved from clipboard/spreadsheet to YMS — network standardization gap remains.',
      'Confirmed Kaleris customer with high fit for displacement to network-wide operating model.',
    ],
    urgencyDriver: 'Network standardization wedge — site-level YMS vs. true network operating model.',
  },

  theme: {
    accentColor: '#C8102E',
  },
};
