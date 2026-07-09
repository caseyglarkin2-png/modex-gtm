/**
 * Harris Teeter, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/harris-teeter.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/harris-teeter resolves its
 * accountName FK and /for/harris-teeter renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const harrisTeeter: AccountMicrositeData = {
  slug: 'harris-teeter',
  accountName: 'Harris Teeter',
  coverFootprint: '3 DCs · 223 dock doors',
  vertical: 'grocery',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Harris Teeter, Yard Network Audit',
  metaDescription:
    '3 Harris Teeter facilities mapped from public satellite imagery: 223 dock doors and room for about 590 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Harris Teeter network',
      composition: [
        { label: 'Audited footprint', value: '3 audited DCs, the full self-distribution network' },
        { label: 'Facility types', value: 'Grocery Distribution Center · Perishable DC · Frozen DC' },
        { label: 'Dock doors (audited sites)', value: '223' },
        { label: 'Trailer positions (audited sites)', value: '~590' },
        { label: 'Truck gates (audited sites)', value: '3' },
        { label: 'Rail service', value: 'No rail at any audited site.' },
        { label: 'Geographic spread', value: 'Two North Carolina campuses: Indian Trail (near Charlotte) and Greensboro.' },
      ],
      hypothesis:
        'Harris Teeter, Kroger\'s Carolinas grocery banner, runs a compact, tightly held distribution network out of two North Carolina campuses: Indian Trail near Charlotte and Greensboro. We mapped three DCs across them, holding 223 dock doors and room for about 590 trailers, with no rail at any site. Unlike most grocery yards we audit, every Harris Teeter DC sits behind a controlled truck gate, and the Indian Trail campus runs a staffed guard booth. YardFlow turns those manual gate checks into one orchestrated gate-to-dock flow across the network.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '3 Harris Teeter facilities, mapped from public satellite imagery',
      accountSlug: 'harris-teeter',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Audited all 3 identifiable facilities.',
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
          source: 'North Carolina Department of Commerce press release (Harris Teeter Union County DC expansion)',
          confidence: 'public',
          detail: 'Audited all 3 identifiable facilities.',
          url: 'https://www.commerce.nc.gov/news/press-releases/harris-teeter-expand-existing-distribution-center-union-county',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Harris Teeter specifically.',
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
        'If parts of this read wrong against what you see internally at Harris Teeter, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '3 audited DCs, the full self-distribution network',
    facilityTypes: ['Grocery Distribution Center', 'Perishable DC', 'Frozen DC'],
    geographicSpread: 'Two North Carolina campuses: Indian Trail (near Charlotte) and Greensboro.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 223 dock doors and room for ~590 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 223 dock doors across 3 sites.',
  },

  signals: {},
};
