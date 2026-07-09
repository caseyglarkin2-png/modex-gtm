/**
 * Stop & Shop, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/stop-and-shop.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/stop-and-shop resolves its
 * accountName FK and /for/stop-and-shop renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const stopAndShop: AccountMicrositeData = {
  slug: 'stop-and-shop',
  accountName: 'Stop & Shop',
  coverFootprint: '7 DCs · 742 dock doors',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Stop & Shop, Yard Network Audit',
  metaDescription:
    '7 Stop & Shop facilities mapped from public satellite imagery: 742 dock doors and room for about 1,760 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Stop & Shop network',
      composition: [
        { label: 'Audited footprint', value: '7 audited ADUSA DCs of ~8 Northeast DCs supplying the banner' },
        { label: 'Facility types', value: 'Grocery Distribution Center · Fresh DC · Frozen DC · Cross-Dock' },
        { label: 'Dock doors (audited sites)', value: '742' },
        { label: 'Trailer positions (audited sites)', value: '~1,760' },
        { label: 'Truck gates (audited sites)', value: '7' },
        { label: 'Rail service', value: 'No rail at the audited DCs; five of the seven gate the yard but two large grocery DCs sit open to the road.' },
        { label: 'Geographic spread', value: 'Northeast US: MA, CT, NY, and PA, operated by ADUSA Supply Chain (Ahold Delhaize).' },
      ],
      hypothesis:
        'Stop & Shop\'s shelves are filled by ADUSA Supply Chain, Ahold Delhaize\'s in-house logistics arm, out of a cluster of Northeast distribution centers. We mapped seven of them across MA, CT, NY, and PA, holding 742 dock doors and room for about 1,760 trailers. The network splits cleanly by temperature into dry grocery, fresh, and frozen DCs, several of them former C&S buildings ADUSA pulled in-house. Five of the seven gate the yard, but two large grocery DCs sit open to the road. YardFlow gives ADUSA one gate-to-dock view across the whole Stop & Shop network.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '7 Stop & Shop facilities, mapped from public satellite imagery',
      accountSlug: 'stop-and-shop',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Stop & Shop is supplied by ADUSA Supply Chain (Ahold Delhaize) out of ~8 Northeast DCs. We audited 7 ADUSA DCs serving Stop & Shop across MA, CT, NY, and PA.',
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
          source: 'Ahold Delhaize newsroom: ADUSA Supply Chain Northeast DC network',
          confidence: 'public',
          detail: 'Stop & Shop is supplied by ADUSA Supply Chain (Ahold Delhaize) out of ~8 Northeast DCs. We audited 7 ADUSA DCs serving Stop & Shop across MA, CT, NY, and PA.',
          url: 'https://newsroom.aholddelhaize.com/adusa-supply-chain-opens-new-1-million-square-foot-distribution-center-in-ct',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Stop & Shop specifically.',
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
        'If parts of this read wrong against what you see internally at Stop & Shop, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '7 audited ADUSA DCs of ~8 Northeast DCs supplying the banner',
    facilityTypes: ['Grocery Distribution Center', 'Fresh DC', 'Frozen DC', 'Cross-Dock'],
    geographicSpread: 'Northeast US: MA, CT, NY, and PA, operated by ADUSA Supply Chain (Ahold Delhaize).',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 742 dock doors and room for ~1,760 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 742 dock doors across 7 sites.',
  },

  signals: {},
};
