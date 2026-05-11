/**
 * Internal competitive intelligence (NOT for prospect-facing surfaces):
 * Westrock Coffee is a confirmed PINC/Kaleris incumbent per the Inbound Logistics
 * "Yard Management: Grounds for Improvement" feature (January 2026, pp. 179–181),
 * which quotes J.T. Hinson (Director of Freight Logistics) on the Kaleris YMS
 * deployment at the legacy S&D Coffee & Tea / Westrock Concord NC operation. Specifics:
 *   - Kaleris YMS deployed for visibility, move requests, and driver workflow across
 *     a multi-county facility spread in the Concord NC area (five county-spread locations)
 *   - Yard grew from 120–130 trailers to roughly 400 trailers under the Kaleris deployment
 *   - Hinson quote: "If it's used properly, with supervisors and managers holding teams
 *     accountable, you'll actually have software, not shelfware."
 *   - Phone-based move coordination replaced by shared move-request queue
 *   - Green-coffee staging area relocated to within ~100 yards of the roaster
 *
 * This intel powers the "modernization" cold-email framing (see
 * docs/research/j-t-hinson-westrock-coffee-dossier.md and the cold-email kit at
 * docs/outreach/2026-q2-pinc-displacement-15-cold-emails.md). It must
 * not appear in any prospect-facing surface — including proofBlocks
 * which feed memo-compat's fallback comparable section.
 */

/**
 * Westrock Coffee — ABM Microsite Data
 * Quality Tier: A (confirmed Kaleris customer — Inbound Logistics report on S&D/Westrock yard ops)
 * Pitch shape: modernization
 */

import type { AccountMicrositeData } from '../schema';

export const westrockCoffee: AccountMicrositeData = {
  slug: 'westrock-coffee',
  accountName: 'Westrock Coffee',
  parentBrand: 'Westrock Coffee Company',
  vertical: 'beverage',
  tier: 'Tier 1',
  band: 'A',
  priorityScore: 84,

  pageTitle: 'YardFlow for Westrock Coffee - Yard Network Standardization',
  metaDescription: 'How YardFlow eliminates the yard bottleneck across Westrock Coffee\'s facility network.',

  sections: [
    { type: 'yns-thesis' },
  ],

  needsHandTuning: true,

  people: [
    {
      personaId: 'westrock-coffee-001',
      name: '[verify]',
      firstName: '[verify]',
      lastName: '[verify]',
      title: 'Director Freight Logistics',
      company: 'Westrock Coffee',
      roleInDeal: 'decision-maker',
      seniority: 'Director',
      function: 'Logistics / Supply Chain',
      bestIntroPath: 'Direct outreach',
    },
  ],

  personVariants: [
    {
      person: {
        personaId: 'westrock-coffee-001',
        name: '[verify]',
        firstName: '[verify]',
        lastName: '[verify]',
        title: 'Director Freight Logistics',
        company: 'Westrock Coffee',
        roleInDeal: 'decision-maker',
        seniority: 'Director',
        function: 'Logistics / Supply Chain',
      },
      fallbackLane: 'logistics',
      label: 'Director Freight Logistics - Westrock Coffee',
      variantSlug: 'director-freight-logistics',

      framingNarrative: 'Westrock Coffee inherited S&D Coffee & Tea\'s Kaleris YMS and continues to use it for visibility, move requests, and driver workflow across a multi-county facility spread that grew from 120-130 trailers to roughly 400. The modernization angle: phone-based move coordination was the pain — the next step is a digital driver journey and network-wide standardization.',
      openingHook: 'Westrock Coffee grew from 120 trailers to 400 and replaced phone-based yard coordination with Kaleris. Here\'s what the next layer of the digital driver journey looks like.',
      stakeStatement: 'Phone coordination replaced — but the gap between shared move queues and a fully digital driver journey is where the next throughput gain lives.',

      heroOverride: {
        headline: 'Westrock Coffee replaced phone-based yard coordination. YardFlow adds the digital driver journey.',
        subheadline: 'From 120 to 400 trailers across five county-spread locations. Shared move queues replaced phones — the next step is standardizing the full gate-to-dock-to-checkout driver journey.',
      },
      sectionOrder: ['yns-thesis'],

      toneShift: 'Logistics modernization framing. Acknowledge the Kaleris move-queue win — position YardFlow as the digital driver journey layer on top.',
      kpiLanguage: ['driver journey', 'move request cycle', 'trailer dwell', 'phone coordination reduction', 'network output per resource'],
    },
  ],

  proofBlocks: [],

  network: {
    facilityCount: 'Concord NC legacy operation (5 county-spread locations including remote yard + roasting plant) + Conway AR campus (530,000 sq ft DC + 570,000 sq ft roast-to-RTD facility + 525,000 sq ft single-serve facility) + Little Rock/North Little Rock AR + offices in 10 countries',
    facilityTypes: ['Coffee Roasting Plants', 'Ready-to-Drink Manufacturing', 'Distribution Centers'],
    geographicSpread: 'North America / Global (HQ: Little Rock, AR; major ops: Concord NC, Conway AR)',
    dailyTrailerMoves: '400+ trailers across the Concord NC yard network; Conway DC runs 72 dock doors',
  },

  freight: {
    primaryModes: ['Truckload', 'Intermodal', 'LTL'],
    avgLoadsPerDay: 'High-volume — sourcing ~150M lbs green coffee/year; Conway campus in full operational ramp as of 2026',
  },

  signals: {
    recentNews: [
      'Conway AR campus fully operational as of 2026 — CEO Scott Ford described transition from "construction mode into regular daily operations."',
      'Adjusted EBITDA guidance of $90M–$100M for 2026 (29–44% YoY growth) — the operating-leverage year.',
      '$70M Conway DC (530,000 sq ft, 72 dock doors) opened Dec 2023; single-serve facility ("Clark," 525,000 sq ft) opened July 2025.',
    ],
    urgencyDriver: 'A yard that grew from 120 to 400 trailers at Concord — and a Conway campus adding three major facilities in two years — is a network that has outpaced its yard operating model. Phone-based coordination has been replaced at Concord; the next step is a consistent gate-to-dock driver journey across all campus nodes as volume scales toward the 2026 EBITDA ramp.',
  },

  theme: {
    accentColor: '#6B3A2A',
  },
};
