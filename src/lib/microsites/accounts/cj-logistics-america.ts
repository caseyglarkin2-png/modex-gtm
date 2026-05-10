/**
 * CJ Logistics America (legacy DSC Logistics) — ABM Microsite Data
 * Quality Tier: A (confirmed legacy PINC customer — DSC Logistics Mira Loma deployment documented)
 * Pitch shape: partnership
 */

import type { AccountMicrositeData } from '../schema';

export const cjLogisticsAmerica: AccountMicrositeData = {
  slug: 'cj-logistics-america',
  accountName: 'CJ Logistics America',
  parentBrand: 'CJ Logistics America',
  vertical: 'logistics-3pl',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 83,

  pageTitle: 'YardFlow for CJ Logistics America - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across CJ Logistics America\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'cj-logistics-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'COO',
      company: 'CJ Logistics America',
      roleInDeal: 'decision-maker',
      seniority: 'C-level',
      function: 'Operations',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'cj-logistics-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'COO',
        company: 'CJ Logistics America',
        roleInDeal: 'decision-maker',
        seniority: 'C-level',
        function: 'Operations',
      },
      fallbackLane: 'ops',
      label: 'COO - CJ Logistics America',
      variantSlug: 'coo',

      framingNarrative: 'DSC Logistics selected PINC Solutions\' advanced yard management for its Mira Loma, California Logistics Center. CJ Logistics acquired DSC, inheriting both the 3PL network and the legacy yard tooling. The partnership angle: reframe DSC-era yard visibility into customer-facing network consistency across the CJ Logistics site footprint.',
      openingHook: 'CJ Logistics inherited DSC\'s Mira Loma PINC deployment. The conversation is whether legacy site visibility tools have scaled into a customer-facing network standard.',
      stakeStatement: 'Legacy DSC yard visibility helped control productivity at Mira Loma. The question is whether that model now constrains customer-facing network consistency across the full CJ Logistics footprint.',

      heroOverride: {
        headline: 'CJ Logistics America inherited a legacy yard toolset. YardFlow asks what customer-facing network consistency looks like today.',
        subheadline: 'DSC Logistics Mira Loma PINC deployment. Acquired by CJ Logistics. The partnership conversation: customer-facing network consistency across every contract logistics site.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: '3PL partnership framing. Acknowledge DSC legacy deployment — reframe toward customer-facing network consistency.',
      kpiLanguage: ['customer-facing consistency', 'on-time performance', 'gate-to-dock cycle', 'network productivity', 'customer supply-chain cost'],
    },
  ],

  proofBlocks: [
    {
      type: 'case-result',
      headline: 'SupplyChainMarket: DSC Logistics selected PINC advanced YMS for Mira Loma to improve speed, control, productivity, and visibility',
      quote: {
        text: 'DSC Logistics selected PINC Solutions\' advanced yard management to increase speed, control, productivity, visibility, and lower customer supply-chain costs.',
        company: 'SupplyChainMarket, 2012',
      },
    },
  ],

  network: {
    facilityCount: 'Distributed 3PL network (see dossier)',
    facilityTypes: ['Contract Logistics Warehouses', 'Distribution Centers'],
    geographicSpread: 'North America (HQ: Itasca, IL); Mira Loma, CA as known legacy site',
    dailyTrailerMoves: 'see dossier',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'see dossier',
  },

  signals: {
    recentNews: [
      'DSC Logistics Mira Loma PINC deployment documented in SupplyChainMarket (2012). Age risk — validate current footprint.',
      'CJ Logistics acquisition of DSC creates modernization story for legacy yard tooling.',
    ],
    urgencyDriver: '3PL customer visibility wedge — reframe legacy DSC yard visibility into customer-facing network consistency.',
  },

  theme: {
    accentColor: '#E8401C',
  },
};
