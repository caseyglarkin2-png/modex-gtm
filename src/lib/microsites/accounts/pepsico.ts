/**
 * PepsiCo, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/pepsico.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/pepsico resolves its
 * accountName FK and /for/pepsico renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const pepsico: AccountMicrositeData = {
  slug: 'pepsico',
  accountName: 'PepsiCo',
  coverFootprint: '30 sites · 1,145 dock doors',
  vertical: 'beverage',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for PepsiCo, Yard Network Audit',
  metaDescription:
    '30 PepsiCo facilities mapped from public satellite imagery: 1,145 dock doors and room for about 2,998 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the PepsiCo network',
      composition: [
        { label: 'Audited footprint', value: '30 audited flagship plants and DCs (PBNA last disclosed ~105 NA plants, FY2017 10-K)' },
        { label: 'Facility types', value: 'Bottling Plant · Manufacturing Plant · Distribution Center' },
        { label: 'Dock doors (audited sites)', value: '1,145' },
        { label: 'Trailer positions (audited sites)', value: '~2,998' },
        { label: 'Truck gates (audited sites)', value: '50' },
        { label: 'Rail service', value: 'Only 3 of 30 audited sites are rail-served; 24 of 30 run drop yards and 26 sit behind long entry drives.' },
        { label: 'Geographic spread', value: 'United States. Company-owned PBNA, Gatorade, and Quaker plants and DCs; Frito-Lay is audited separately.' },
      ],
      hypothesis:
        'We mapped 30 PepsiCo flagship plants and distribution centers from public satellite imagery: 1,145 dock doors, almost 3,000 trailer positions, 990 acres of yard. 24 of these 30 sites run drop yards, and 26 sit behind long entry drives. PepsiCo is scaling driverless freight with Gatik, yet every one of these yards still checks trucks in on guard shacks, radios, and clipboards. That is where one network standard would land first.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '30 PepsiCo facilities, mapped from public satellite imagery',
      accountSlug: 'pepsico',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'PepsiCo\'s company-owned beverage and foods network (PBNA, Gatorade, Quaker) last disclosed ~65 plants and ~440 distribution facilities for the beverage division alone (FY2017 10-K; current counts undisclosed). We audited 30 flagship company-owned plants and DCs. Frito-Lay is audited separately.',
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
          source: 'PepsiCo FY2017 Form 10-K, Item 2 Properties (last filing with division facility counts)',
          confidence: 'public',
          detail: 'PepsiCo\'s company-owned beverage and foods network (PBNA, Gatorade, Quaker) last disclosed ~65 plants and ~440 distribution facilities for the beverage division alone (FY2017 10-K; current counts undisclosed). We audited 30 flagship company-owned plants and DCs. Frito-Lay is audited separately.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not PepsiCo specifically.',
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
        'If parts of this read wrong against what you see internally at PepsiCo, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '30 audited flagship plants and DCs (PBNA last disclosed ~105 NA plants, FY2017 10-K)',
    facilityTypes: ['Bottling Plant', 'Manufacturing Plant', 'Distribution Center'],
    geographicSpread: 'United States. Company-owned PBNA, Gatorade, and Quaker plants and DCs; Frito-Lay is audited separately.',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 1,145 dock doors and room for ~2,998 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,145 dock doors across 30 sites.',
  },

  signals: {},
};
