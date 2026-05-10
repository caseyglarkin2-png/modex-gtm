/**
 * SalSon Logistics — ABM Microsite Data
 * Quality Tier: C (possible PINC customer — seed account, no source-backed evidence yet)
 * Pitch shape: partnership
 */

import type { AccountMicrositeData } from '../schema';

export const salsonLogistics: AccountMicrositeData = {
  slug: 'salson-logistics',
  accountName: 'SalSon Logistics',
  parentBrand: 'SalSon Logistics',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 66,

  pageTitle: 'YardFlow for SalSon Logistics - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across SalSon Logistics\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'salson-logistics-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'COO',
      company: 'SalSon Logistics',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'salson-logistics-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'COO',
        company: 'SalSon Logistics',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'COO - SalSon Logistics',
      variantSlug: 'coo',

      framingNarrative: 'SalSon Logistics is a port-focused 3PL running drayage, warehousing, and distribution from a NJ base. Strong port-yard ICP fit — no verified PINC/Kaleris source yet. Partnership angle: yard standardization as a customer-facing differentiator at port and drayage operations.',
      openingHook: 'Port and drayage logistics operations have the most complex yard timing requirements in the network. Here\'s what one operating standard looks like for SalSon.',
      stakeStatement: 'Port drayage yard variance is more expensive per event than almost any other logistics operation — missed windows, container detention, and gate backup compound faster than at a standard DC.',

      heroOverride: {
        headline: 'SalSon Logistics\' port and drayage network is ready for a yard standardization conversation.',
        subheadline: 'Port logistics, drayage, warehousing, and distribution from a NJ base. One yard operating standard at port and warehouse yards changes gate timing, container detention, and customer-facing throughput.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Port 3PL partnership framing. Lead with port-yard complexity and customer-facing consistency. Manual review — do not assert PINC/Kaleris.',
      kpiLanguage: ['gate timing', 'container detention', 'drayage throughput', 'port yard efficiency', 'customer-facing consistency'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Port and logistics network (see dossier)',
    facilityTypes: ['Port Logistics Centers', 'Warehouses', 'Distribution Facilities'],
    geographicSpread: 'Northeast US (HQ: South Plainfield, NJ)',
    dailyTrailerMoves: 'see dossier',
    fleet: 'Private fleet signal confirmed (yes)',
  },

  freight: {
    primaryModes: ['Drayage', 'Truckload', 'LTL', 'Warehousing'],
    avgLoadsPerDay: 'see dossier',
    specialRequirements: ['Port logistics', 'Container drayage'],
  },

  signals: {
    recentNews: [
      'Seed account — no source-backed PINC/Kaleris evidence. Manual review required. Strong port-yard ICP fit.',
    ],
    urgencyDriver: '3PL customer visibility wedge — port and drayage yard complexity creates strong YardFlow fit even without PINC signal.',
  },

  theme: {
    accentColor: '#2D6A9F',
  },
};
