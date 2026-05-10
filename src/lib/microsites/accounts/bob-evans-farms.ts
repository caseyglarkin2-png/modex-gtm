/**
 * Bob Evans Farms — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — 40% reefer hour reduction case study)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const bobEvansFarms: AccountMicrositeData = {
  slug: 'bob-evans-farms',
  accountName: 'Bob Evans Farms',
  parentBrand: 'Post Holdings',
  vertical: 'cpg',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'YardFlow for Bob Evans Farms - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Bob Evans Farms\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'bob-evans-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'COO',
      company: 'Bob Evans Farms',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'bob-evans-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'COO',
        company: 'Bob Evans Farms',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'COO - Bob Evans Farms',
      variantSlug: 'coo',

      framingNarrative: 'Bob Evans Farms reduced loaded reefer hours by nearly 40% (134,000 hours) using Kaleris YMS. The modernization angle: the cold chain / reefer dwell win proves the yard matters — the next step is widening that win across network-wide yard variance reduction.',
      openingHook: 'You already proved reefer dwell reduction matters. Here\'s what network-wide yard variance reduction looks like at scale.',
      stakeStatement: '134,000 hours of loaded reefer time eliminated at the site level. The question is how much remains across the rest of the network.',

      heroOverride: {
        headline: 'Bob Evans Farms proved reefer dwell reduction. YardFlow extends it network-wide.',
        subheadline: 'Your Kaleris YMS deployment eliminated 134,000 loaded reefer hours. YardFlow standardizes the cold chain yard protocol across every manufacturing and distribution site.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Cold chain operator framing. Lead with the proven reefer win — expand to network-wide standardization.',
      kpiLanguage: ['loaded reefer hours', 'dwell time', 'cold chain yield', 'truck turn time', 'network variance'],
    },
  ],

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'Kaleris case study: Bob Evans reduced loaded reefer hours by nearly 40% (134,000 hours)',
      quote: {
        text: 'Reduced loaded reefer hours by nearly 40%, equal to 134,000 hours, according to Kaleris archive.',
        company: 'Kaleris YMS case study archive, 2026',
      },
    },
  ],

  network: {
    facilityCount: 'Multi-site refrigerated food manufacturing and distribution (see dossier)',
    facilityTypes: ['Refrigerated Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'Midwest US (HQ: Columbus, OH)',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Refrigerated Truckload', 'Temperature-Controlled LTL'],
    avgLoadsPerDay: 'see dossier',
    specialRequirements: ['Refrigerated/cold chain', 'FSMA compliance'],
  },

  signals: {
    recentNews: [
      'Confirmed Kaleris YMS customer — reefer dwell reduction case study. Cold chain / reefer dwell wedge applies.',
    ],
    urgencyDriver: 'Modernization wedge — extend proven reefer dwell win to network-wide yard variance reduction.',
  },

  theme: {
    accentColor: '#D4380D',
  },
};
