/**
 * Sam's Club, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/sams-club.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/sams-club resolves its
 * accountName FK and /for/sams-club renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const samsClub: AccountMicrositeData = {
  slug: 'sams-club',
  accountName: 'Sam\'s Club',
  coverFootprint: '10 sites · 1,083 dock doors',
  vertical: 'retail',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Sam\'s Club, Yard Network Audit',
  metaDescription:
    '10 Sam\'s Club facilities mapped from public satellite imagery: 1,083 dock doors and room for about 2,530 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Sam\'s Club network',
      composition: [
        { label: 'Audited footprint', value: '10 audited sites of 45 dedicated US freight facilities (Walmart FY2025 10-K)' },
        { label: 'Facility types', value: 'Distribution Center · Fulfillment Center' },
        { label: 'Dock doors (audited sites)', value: '1,083' },
        { label: 'Trailer positions (audited sites)', value: '~2,530' },
        { label: 'Truck gates (audited sites)', value: '10' },
        { label: 'Rail service', value: '1 of 10 audited sites rail-served; eight sit behind a controlled truck gate but two DCs sit open to the road.' },
        { label: 'Geographic spread', value: 'South and Midwest US. Mix of owned cross-docks and dedicated 3PL DCs (Saddle Creek, Prologis) feeding roughly 600 clubs.' },
      ],
      hypothesis:
        'Sam\'s Club runs a lean distribution network separate from its Walmart parent, a mix of owned cross-docks and dedicated 3PL DCs (Saddle Creek, Prologis) feeding roughly 600 warehouse clubs. We mapped 10 of them across the South and Midwest, holding 1,083 dock doors and room for about 2,530 trailers. Eight of the ten sit behind a controlled truck gate and five run a staffed guard booth, but the control is uneven and two DCs sit open to the road. YardFlow gives Sam\'s Club one gate-to-dock view across owned and 3PL yards alike.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '10 Sam\'s Club facilities, mapped from public satellite imagery',
      accountSlug: 'sams-club',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Sam\'s Club U.S. operates 45 dedicated freight facilities (31 distribution centers + 14 eCommerce fulfillment centers per Walmart\'s FY2025 10-K), several 3PL-operated by Saddle Creek / Prologis, feeding ~600 clubs. We audited 10 representative facilities.',
    },
    {
      type: 'methodology',
      headline: 'How this analysis was built',
      sources: [
        {
          id: 'satellite-audit',
          source: 'YardFlow satellite network audit (June 2026)',
          confidence: 'public',
          detail: 'Dock doors, trailer positions, truck gates, rail service, and acreage measured site-by-site from public satellite imagery. The full audited dataset renders in the live network demo on this page.',
        },
        {
          id: 'network-count',
          source: 'Walmart Inc. FY2025 Form 10-K: Sam\'s Club U.S. operates 31 dedicated distribution facilities + 14 eCommerce fulfillment centers',
          confidence: 'public',
          detail: 'Sam\'s Club U.S. operates 45 dedicated freight facilities (31 distribution centers + 14 eCommerce fulfillment centers per Walmart\'s FY2025 10-K), several 3PL-operated by Saddle Creek / Prologis, feeding ~600 clubs. We audited 10 representative facilities.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Sam\'s Club specifically.',
        },
      ],
      unknowns: [
        'Actual detention cost and carrier mix without TMS data',
        'Spotter and gate staffing per site',
        'Which sites concentrate the exception volume today',
        'Internal yard systems already in place at individual sites',
      ],
    },
    {
      type: 'about',
      headline: 'About this analysis',
      authorBio:
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis built from our satellite audit of the network, not a sales asset, it is the same shape of memo we would circulate internally before sizing a network engagement.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally at Sam\'s Club, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '10 audited sites of 45 dedicated US freight facilities (Walmart FY2025 10-K)',
    facilityTypes: ['Distribution Center', 'Fulfillment Center'],
    geographicSpread: 'South and Midwest US. Mix of owned cross-docks and dedicated 3PL DCs (Saddle Creek, Prologis) feeding roughly 600 clubs.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 1,083 dock doors and room for ~2,530 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,083 dock doors across 10 sites.',
  },

  signals: {},
};
