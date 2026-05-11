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

  proofBlocks: [],

  network: {
    facilityCount: '~70+ North America locations; ~30M sq ft+ warehousing (at DSC integration in 2020; materially larger today with post-2020 expansions)',
    facilityTypes: ['Contract Logistics Warehouses', 'Distribution Centers', 'Cold Storage Facilities'],
    geographicSpread: 'North America (HQ: Des Plaines, IL; Mira Loma CA intermodal legacy site; Gainesville GA cold storage 2024; New Century KS cold storage Q3 2025; Elwood IL 1.1M sq ft H1 2026)',
    dailyTrailerMoves: 'High-volume — 500+ active customer engagements; new Elwood IL 1.1M sq ft site (jointly funded with Korea Ocean Business Corp, $457M) going live H1 2026',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'High-volume — food, CPG, and consumer goods dominant; WMS-agnostic architecture (runs Blue Yonder, Korber, SAP EWM) means yard-tech must integrate without WMS exclusivity',
    specialRequirements: ['Cold storage logistics (Gainesville GA, New Century KS)', 'WMS-agnostic integration required'],
  },

  signals: {
    recentNews: [
      'New Century KS cold storage (291,000 sq ft) opened Q3 2025 — connected by conveyor bridge to Upfield manufacturing; serves 85% of US within two days.',
      'Elwood IL 1.1M sq ft new logistics center (H1 2026): jointly funded with Korea Ocean Business Corporation ($457M investment program).',
      'Laura Adams promoted to SVP Technology, Engineering, Systems & Solutions + Continuous Improvement in January 2025.',
      'CJ Logistics America explicitly WMS-agnostic — runs Blue Yonder, Korber, and SAP EWM across the network; yard-tech that doesn\'t demand WMS exclusivity is the architectural fit.',
    ],
    urgencyDriver: 'CJ Logistics is scaling rapidly — three major facility openings in 2024–2026, plus the Elwood mega-center. Each new site needs a yard operating standard at go-live. The TES function under Adams is the technology gatekeeper: a yard-execution layer that lands with her team gets distributed across customer engagements by design, not on a site-by-site basis.',
  },

  theme: {
    accentColor: '#E8401C',
  },
};
