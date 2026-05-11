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
    facilityCount: 'Newark NJ flagship 55-acre campus (3 yards, ~1M sq ft warehouse, 24/7, ~2,000 containers/week, ~100,000 containers/year) + Florence NJ transload hub + Long Beach CA + Compton CA (260,000 sq ft, 66 dock doors, 20-acre secured yard under construction) + Atlanta, Bakersfield, Charleston SC, Houston, Inland Empire CA, Norfolk VA, Oakland CA, Savannah GA, Tacoma WA',
    facilityTypes: ['Port Logistics Centers', 'Warehouses', 'Distribution Facilities', 'Transload Hubs'],
    geographicSpread: 'Bicoastal US (HQ: Newark NJ + Long Beach CA; operating in 10+ markets)',
    dailyTrailerMoves: '~2,000 containers/week through Newark flagship alone (~150 SalSon drivers in port daily); ~2,500 chassis across the merged network',
    fleet: 'Private fleet signal confirmed (yes)',
  },

  freight: {
    primaryModes: ['Drayage', 'Truckload', 'LTL', 'Warehousing'],
    avgLoadsPerDay: '~2,000 containers/week through Newark flagship alone (~150 SalSon drivers in port daily); aggregate: ~1,000+ tractors, ~1,200 trailers, ~2,500 chassis across the merged network',
    specialRequirements: ['Port logistics', 'Container drayage', 'Food-grade DC capability', 'Chassis management'],
  },

  signals: {
    recentNews: [
      'Sun Capital Partners completed roll-up of 7 companies in August 2024 — SalSon, Sierra Trucking, Vision Logistics, West Group, East Group, Heavy Load Transfer, TriPack Logistics.',
      'Revenue "more than doubled since 2021" from ~$100M baseline; implied 2025/2026 run-rate $250M+.',
      'Compton CA 260,000 sq ft / 66 dock doors / 20-acre secured yard under construction.',
      'Jason Fisk (CEO) flagged Mexico expansion as next strategic geography; William Blair engaged for M&A advisory.',
      'Revenue attributed by Jason Fisk as "more than doubled since 2021" — active M&A flywheel.',
    ],
    urgencyDriver: 'Seven companies merged in August 2024 — each with its own dispatch, yard, and customer mix. The Newark flagship alone processes ~2,000 containers/week across a 55-acre campus with three yards. Port drayage yard variance is more expensive per event than almost any other logistics operation; missed windows and container detention compound faster than at a standard DC. Integration of yard-execution tooling across the seven merged entities is an active workstream.',
  },

  theme: {
    accentColor: '#2D6A9F',
  },
};
