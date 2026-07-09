/**
 * Niagara Bottling, ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/niagara-bottling.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites, no additional facts
 * were invented. This entry exists so /demo/niagara-bottling resolves its
 * accountName FK and /for/niagara-bottling renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const niagaraBottling: AccountMicrositeData = {
  slug: 'niagara-bottling',
  accountName: 'Niagara Bottling',
  coverFootprint: '30 plants · 1,703 dock doors',
  vertical: 'beverage',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for Niagara Bottling, Yard Network Audit',
  metaDescription:
    '30 Niagara Bottling facilities mapped from public satellite imagery: 1,703 dock doors and room for about 2,518 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the Niagara Bottling network',
      composition: [
        { label: 'Audited footprint', value: '30 audited plants of 50+ US bottling plants' },
        { label: 'Facility types', value: 'Bottling / Manufacturing Plant' },
        { label: 'Dock doors (audited sites)', value: '1,703' },
        { label: 'Trailer positions (audited sites)', value: '~2,518' },
        { label: 'Truck gates (audited sites)', value: '33' },
        { label: 'Rail service', value: 'No rail at the audited plants; a single SKU moves at high velocity through high-density truck yards.' },
        { label: 'Geographic spread', value: 'United States. Audited set includes Jeffersonville IN (100 dock doors) and Hazle Township PA (110 acres).' },
      ],
      hypothesis:
        'Niagara Bottling runs the largest private-label water network. More than 50 US plants; we audited 30. Jeffersonville IN has 100 dock doors. Hazle Township PA is 110 acres. 1,703 total dock doors and 2,518 trailer spots. YardFlow runs bottled water at scale: a single SKU at high velocity through a high-density yard.',
      caveat:
        'This entry is generated from our satellite network audit, the same dataset behind the live demo below, not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '30 Niagara Bottling facilities, mapped from public satellite imagery',
      accountSlug: 'niagara-bottling',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed, overlaid on the live satellite tile.',
      source: 'Niagara Bottling operates more than 50 US bottling plants (private-label water), with several more announced or under construction. We audited 30.',
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
          source: 'NY Governor\'s Office release citing Niagara\'s company boilerplate (2026-04-24): more than 50 US bottling plants',
          confidence: 'public',
          detail: 'Niagara Bottling operates more than 50 US bottling plants (private-label water), with several more announced or under construction. We audited 30.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not Niagara Bottling specifically.',
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
        'If parts of this read wrong against what you see internally at Niagara Bottling, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry, flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '30 audited plants of 50+ US bottling plants',
    facilityTypes: ['Bottling / Manufacturing Plant'],
    geographicSpread: 'United States. Audited set includes Jeffersonville IN (100 dock doors) and Hazle Township PA (110 acres).',
    dailyTrailerMoves: 'Not modeled from public data, the audited footprint holds 1,703 dock doors and room for ~2,518 trailers.',
  },

  freight: {
    primaryModes: ['Truckload'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,703 dock doors across 30 sites.',
  },

  signals: {},
};
