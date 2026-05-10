/**
 * SC Johnson — ABM Microsite Data
 * Quality Tier: C (possible PINC customer — seed account, no source-backed evidence yet)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const scJohnson: AccountMicrositeData = {
  slug: 'sc-johnson',
  accountName: 'SC Johnson',
  parentBrand: 'SC Johnson',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 65,

  pageTitle: 'YardFlow for SC Johnson - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across SC Johnson\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'sc-johnson-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'SC Johnson',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain / Manufacturing',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'sc-johnson-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'SC Johnson',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain / Manufacturing',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - SC Johnson',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'SC Johnson is a large private CPG enterprise with a distributed manufacturing network. No direct PINC/Kaleris source evidence yet — do not assert competitor usage in outreach. Lead with network standardization fit and manufacturing yard orchestration angle.',
      openingHook: 'SC Johnson\'s global household goods manufacturing network is a strong fit for a yard standardization conversation.',
      stakeStatement: 'A distributed private-enterprise manufacturing network without one yard operating standard accumulates untracked variance at every site.',

      heroOverride: {
        headline: 'SC Johnson\'s manufacturing network is ready for a yard standardization conversation.',
        subheadline: 'Distributed household goods manufacturing. One yard operating standard across gate, dock, and driver journey changes the network-wide math on throughput and detention.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'CPG manufacturing operator framing. Do not mention PINC/Kaleris until direct evidence is found.',
      kpiLanguage: ['manufacturing yard throughput', 'truck turn time', 'detention cost', 'dock utilization', 'network variance'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Distributed manufacturing network (see dossier)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Racine, WI)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Seed account — no source-backed PINC/Kaleris evidence. Do not assert competitor usage in outreach.',
    ],
    urgencyDriver: 'Manufacturing yard orchestration wedge — manual review required before PINC/Kaleris assertion.',
  },

  theme: {
    accentColor: '#00539C',
  },
};
