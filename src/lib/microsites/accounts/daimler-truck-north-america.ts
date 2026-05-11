/**
 * Daimler Truck North America — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — named case study PDF)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const daimlerTruckNorthAmerica: AccountMicrositeData = {
  slug: 'daimler-truck-north-america',
  accountName: 'Daimler Truck North America',
  parentBrand: 'Daimler Truck',
  vertical: 'industrial',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 80,

  pageTitle: 'YardFlow for Daimler Truck North America - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Daimler Truck North America\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'daimler-truck-na-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'VP Manufacturing',
      company: 'Daimler Truck North America',
      roleInDeal: 'decision-maker',
      seniority: 'VP',
      function: 'Manufacturing / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'daimler-truck-na-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'VP Manufacturing',
        company: 'Daimler Truck North America',
        roleInDeal: 'decision-maker',
        seniority: 'VP',
        function: 'Manufacturing / Supply Chain',
      },
      fallbackLane: 'ops',
      label: 'VP Manufacturing - Daimler Truck North America',
      variantSlug: 'vp-manufacturing',

      framingNarrative: 'Daimler Truck proved RFID-based yard visibility via PINC/Kaleris and achieved a 50% reduction in yard drivers across the network. The modernization question is whether hardware-heavy visibility equals network orchestration.',
      openingHook: 'RFID in the yard tells you where trailers are. YardFlow tells you what happens next — at every gate, dock, and lane across the network.',
      stakeStatement: 'A 50% yard-driver reduction proves the yard matters. The next gain is in the orchestration layer RFID alone can\'t provide.',

      heroOverride: {
        headline: 'Daimler Truck proved yard visibility. YardFlow adds network orchestration.',
        subheadline: 'Your PINC/Kaleris deployment cut yard drivers by 50%. YardFlow standardizes the driver journey, dock assignment, and exception handling across every manufacturing site.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Manufacturing operator framing. Respect the existing RFID investment — position as orchestration layer on top of visibility, not replacement.',
      kpiLanguage: ['yard driver reduction', 'truck turn time', 'dock throughput', 'gate-to-dock cycle', 'operating cost per facility'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: '9 U.S.+Mexico manufacturing plants (Portland OR, Cleveland NC, Mt. Holly NC, Gastonia NC, High Point NC, Gaffney SC, Saltillo MX, Redford MI + one additional) + 10 PDCs + Whitestown IN RDC (605,000 sq ft, opened Aug 2023)',
    facilityTypes: ['Manufacturing Plants', 'Parts Distribution Centers'],
    geographicSpread: 'North America (HQ: Portland, OR; manufacturing concentrated in NC/SC, plus Saltillo MX and Redford MI)',
    dailyTrailerMoves: '500+ trailers in yard at peak (Saltillo); network-wide modeled at high volume across 9 plants',
  },

  freight: {
    primaryModes: ['Flatbed', 'Specialized/Heavy Haul', 'Parts LTL'],
    avgLoadsPerDay: 'High-volume — 9 manufacturing plants with JIT inbound components; finished-vehicle outbound via dealer convoy and rail',
  },

  signals: {
    recentNews: [
      '850,000th truck delivered at Cleveland NC in July 2025 — 70 years of accumulated yard process at the flagship plant.',
      'Q1 2026 incoming orders +85% YoY — production ramp coming on a 14-year-old yard-management footprint.',
      'eCascadia / eM2 battery-electric series production at Portland introduces new yard surfaces (battery handling, charging-bay marshalling) the 2012-era RFID config wasn\'t designed for.',
      'Whitestown IN RDC (605,000 sq ft) opened August 2023 — the aftermarket parts network was reorganized for throughput three years ago; the same logic applies to plant yards.',
    ],
    urgencyDriver: 'A 14-year-old RFID deployment, specified for 2012\'s yard visibility problem, now runs across a network absorbing an 85% order rebound, EV assembly at Portland, and a Thomas Built Bus capacity expansion at High Point. Site-level visibility is not the same as the cross-plant orchestration the ramp requires.',
  },

  theme: {
    accentColor: '#0078D4',
  },
};
