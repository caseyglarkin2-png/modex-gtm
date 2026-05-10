/**
 * Kimberly-Clark — ABM Microsite Data
 * Quality Tier: B (probable PINC customer — named in 2009 Yard Hound press release; manual review required)
 * Pitch shape: displacement
 */

import type { AccountMicrositeData } from '../schema';

export const kimberlyClark: AccountMicrositeData = {
  slug: 'kimberly-clark',
  accountName: 'Kimberly-Clark',
  parentBrand: 'Kimberly-Clark Corporation',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 78,

  pageTitle: 'YardFlow for Kimberly-Clark - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Kimberly-Clark\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'kimberly-clark-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Supply Chain',
      company: 'Kimberly-Clark',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'kimberly-clark-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Supply Chain',
        company: 'Kimberly-Clark',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Supply Chain - Kimberly-Clark',
      variantSlug: 'vp-supply-chain',

      framingNarrative: 'Kimberly-Clark appears in legacy PINC client lists from 2009. A global CPG manufacturing and distribution network of this size accumulates yard variance at scale. Verify active footprint before naming PINC in outreach.',
      openingHook: 'Kimberly-Clark\'s distributed CPG network is the right profile for a network standardization conversation — starting with the highest-volume facilities.',
      stakeStatement: 'Legacy PINC deployment or not, a global manufacturing network without one yard operating standard is leaving throughput and detention money on the table at every site.',

      heroOverride: {
        headline: 'Kimberly-Clark\'s CPG network is ready for a yard standardization conversation.',
        subheadline: 'Global manufacturing and distribution footprint. One yard operating standard changes dock utilization, detention spend, and driver throughput across the network.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'CPG operator framing. Lead with network-level impact. Verify PINC footprint in discovery before naming legacy tools.',
      kpiLanguage: ['network standardization', 'truck turn time', 'detention cost', 'dock utilization', 'gate-to-dock cycle'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Global manufacturing and distribution network (see dossier)',
    facilityTypes: ['Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Irving, TX)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'Named in 2009 PINC Yard Hound press release (Transfreight/Kraft). Legacy signal — verify active footprint.',
    ],
    urgencyDriver: 'Network standardization wedge — verify PINC/Kaleris footprint before outreach.',
  },

  theme: {
    accentColor: '#005EB8',
  },
};
