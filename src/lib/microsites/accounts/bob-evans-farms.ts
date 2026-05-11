/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Bob Evans Farms is a confirmed PINC/Kaleris incumbent per the Kaleris
 * YMS success stories archive (Kaleris YMS case study archive, 2026) and the
 * Kaleris YMS Archives page listing Bob Evans alongside Kraft Heinz, Daimler, etc.
 * Specifics:
 *   - Kaleris YMS deployed in 2022 across Bob Evans production facilities
 *   - Cited wins: ~40% reduction in loaded reefer hours, equal to 134,000 hours eliminated
 *   - ~$471,000 in year-one fuel and M&R savings attributed to loaded-reefer dwell reduction
 *   - System replaced manual yard management; Springfield OH transportation hub involved
 *
 * This intel powers the "modernization" cold-email framing (see
 * docs/research/john-ash-bob-evans-farms-dossier.md and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section.
 */

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

  proofBlocks: [],

  network: {
    facilityCount: '4 production facilities (Xenia OH, Lima OH, Hillsdale MI, Sulphur Springs TX) + Springfield OH transportation hub',
    facilityTypes: ['Refrigerated Manufacturing Plants', 'Distribution Centers'],
    geographicSpread: 'Midwest/South US (HQ: New Albany, OH; plants in OH, MI, TX)',
    dailyTrailerMoves: 'High-volume — refrigerated finished goods to grocery DCs across all four production sites',
  },

  freight: {
    primaryModes: ['Refrigerated Truckload', 'Temperature-Controlled LTL'],
    avgLoadsPerDay: 'High-volume — cold-chain network serving retail grocery, foodservice, and club channels',
    specialRequirements: ['Refrigerated/cold chain', 'FSMA compliance', 'USDA FSIS-inspected facilities (pork sausage)'],
  },

  signals: {
    recentNews: [
      'Post Holdings acquired Bob Evans in 2018; Refrigerated Retail segment now includes Michael Foods, Crystal Farms, Potato Products of Idaho (closed Mar 2025), and 8th Avenue (closed Jul 2025).',
      'Nicolas Catoggio became Post Holdings EVP/COO in January 2026 — new COO needs cross-portfolio operational wins.',
    ],
    urgencyDriver: 'Three years into the Kaleris deployment, the site-level efficiency curve has flattened. The loaded-reefer dwell win was earned at individual plants — what remains is a network operating model across the full Refrigerated Retail segment, including the newly acquired Post Holdings operating companies.',
  },

  theme: {
    accentColor: '#D4380D',
  },
};
