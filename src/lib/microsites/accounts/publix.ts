/**
 * Publix Super Markets, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/publix.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/publix resolves its
 * accountName FK and /for/publix renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const publix: AccountMicrositeData = {
  slug: 'publix',
  accountName: 'Publix Super Markets',
  coverFootprint: '11 DCs · 1,395 dock doors',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Publix Super Markets, Yard Network Audit',
  metaDescription:
    '11 Publix Super Markets facilities mapped from public satellite imagery: 1,395 dock doors and room for about 2,550 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Publix Super Markets network',
      composition: [
        { label: 'Audited footprint', value: '11 audited DCs, the full self-distribution network (10 primary DCs per FY2025 10-K)' },
        { label: 'Facility types', value: 'Grocery Distribution Center · Refrigerated DC · Frozen DC · Produce DC · Distribution Campus' },
        { label: 'Dock doors (audited sites)', value: '1,395' },
        { label: 'Trailer positions (audited sites)', value: '~2,550' },
        { label: 'Truck gates (audited sites)', value: '13' },
        { label: 'Rail service', value: '1 of 11 audited sites rail-served; every DC sits behind a controlled truck gate and seven run a staffed guard booth.' },
        { label: 'Geographic spread', value: 'Southeast US, anchored on the Lakeland FL headquarters complex.' },
      ],
      hypothesis:
        'Publix self-distributes almost everything its stores sell, out of a Florida-anchored DC network it owns and runs end to end. We mapped 11 of those distribution centers, from the Lakeland headquarters complex across the Southeast, holding 1,395 dock doors and room for about 2,550 trailers. Every one of the 11 sits behind a controlled truck gate, and seven run a staffed guard booth, so Publix already treats the yard as a checkpoint. YardFlow turns those manual gate stops into one orchestrated gate-to-dock flow across the whole network.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '11 Publix Super Markets facilities, mapped from public satellite imagery',
      accountSlug: 'publix',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Audited all 11 identifiable facilities.',
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
          source: 'Publix FY2025 Form 10-K, Item 2 Properties',
          confidence: 'public',
          detail: 'Audited all 11 identifiable facilities.',
          url: 'https://www.sec.gov/Archives/edgar/data/81061/000008106126000038/ck0000081061-20251227.htm',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Publix Super Markets specifically.',
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
        'If parts of this read wrong against what you see internally at Publix Super Markets, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '11 audited DCs, the full self-distribution network (10 primary DCs per FY2025 10-K)',
    facilityTypes: ['Grocery Distribution Center', 'Refrigerated DC', 'Frozen DC', 'Produce DC', 'Distribution Campus'],
    geographicSpread: 'Southeast US, anchored on the Lakeland FL headquarters complex.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 1,395 dock doors and room for ~2,550 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,395 dock doors across 11 sites.',
  },

  signals: {},
};
