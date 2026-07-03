/**
 * General Motors — ABM Microsite Data (registry entry)
 *
 * Generated from the audited demo pack (public/demo-packs/general-motors.json,
 * built June 2026). Every number and claim here is sourced from that
 * satellite audit or the public filings it cites — no additional facts
 * were invented. This entry exists so /demo/general-motors resolves its
 * accountName FK and /for/general-motors renders a real memo instead of the
 * noindex capture page. Hand-author (and flip needsHandTuning to false)
 * when this account gets a full A-tier study.
 */

import type { AccountMicrositeData } from '../schema';

export const generalMotors: AccountMicrositeData = {
  slug: 'general-motors',
  accountName: 'General Motors',
  coverFootprint: '36 sites · 1,687 dock doors',
  vertical: 'automotive',
  tier: 'Tier 2',
  band: 'B',
  priorityScore: 60,

  pageTitle: 'YardFlow for General Motors — Yard Network Audit',
  metaDescription:
    '36 General Motors facilities mapped from public satellite imagery: 1,687 dock doors and room for about 3,370 trailers. What one gate-to-dock standard would change across the network.',

  sections: [
    { type: 'yns-thesis' },
    {
      type: 'observation',
      headline: 'What we observed about the General Motors network',
      composition: [
        { label: 'Audited footprint', value: '36 audited sites of 61 freight-relevant US facilities' },
        { label: 'Facility types', value: 'Vehicle Assembly Plant · Stamping Plant · Propulsion / Powertrain Plant · Battery Assembly Plant · Parts Distribution Center' },
        { label: 'Dock doors (audited sites)', value: '1,687' },
        { label: 'Trailer positions (audited sites)', value: '~3,370' },
        { label: 'Truck gates (audited sites)', value: '54' },
        { label: 'Rail service', value: '21 of the 36 audited sites are rail-served; supplier inbound and finished-vehicle outbound run as two distinct yard flows.' },
        { label: 'Geographic spread', value: 'United States. Assembly, stamping, propulsion, casting, battery, and parts-distribution sites, including Spring Hill TN (720 acres) and Factory ZERO.' },
      ],
      hypothesis:
        'Auto OEMs run two yards inside every plant: parts in, vehicles out. GM runs 61 freight-relevant US sites; we audited 36 of them. Spring Hill is the largest plant in North America at 720 acres. Factory ZERO is GM\'s $2.2B EV flagship. A coast-to-coast parts network shows up as 12 processing and distribution hubs in the audited set, and 21 of the 36 sites are rail-served. The Davison Road hub alone runs 84 docks behind a 132-foot automated tower. YardFlow runs supplier inbound and finished-vehicle outbound as two distinct queues on one protocol, across every site at once.',
      caveat:
        'This entry is generated from our satellite network audit — the same dataset behind the live demo below — not from a hand-authored account study. The numbers are measured from public imagery; the most useful thing you can do is push back on anything that doesn\'t match what you see internally.',
    },
    {
      type: 'demo-embed',
      headline: '36 General Motors facilities, mapped from public satellite imagery',
      accountSlug: 'general-motors',
      caption: 'Click any facility to see the gates, dock aprons, drop yards, and staging areas we observed — overlaid on the live satellite tile.',
      source: 'GM runs 61 freight-relevant US facilities (12 assembly + 24 stamping/propulsion/component/battery + 25 parts distribution centers per gm.com US Operations); the 2 engineering campuses and divested/idled plants are excluded. We audited 36 of these representative facilities.',
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
          source: 'gm.com US Operations (12 vehicle assembly plants + 24 stamping/propulsion/component/battery plants + 25 parts distribution centers)',
          confidence: 'public',
          detail: 'GM runs 61 freight-relevant US facilities (12 assembly + 24 stamping/propulsion/component/battery + 25 parts distribution centers per gm.com US Operations); the 2 engineering campuses and divested/idled plants are excluded. We audited 36 of these representative facilities.',
        },
        {
          id: 'industry-benchmarks',
          source: 'ATA + Aberdeen yard-operations benchmarks',
          confidence: 'public',
          detail: 'Cross-industry baselines on dwell-time variance and detention-cost ranges. These describe multi-site freight networks generally, not General Motors specifically.',
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
        'Casey Larkin builds YardFlow at FreightRoll. The brief above is a working analysis built from our satellite audit of the network, not a sales asset — it is the same shape of memo we would circulate internally before sizing a network engagement.',
      authorEmail: 'casey@freightroll.com',
      signOff:
        'If parts of this read wrong against what you see internally at General Motors, that is the most useful thing to push back on. The next step that makes sense is whatever the analysis prompts, not necessarily a meeting.',
    },
  ],

  // Pack-derived working entry — flip to false only after hand-authoring.
  needsHandTuning: true,

  people: [],
  personVariants: [],
  proofBlocks: [],

  network: {
    facilityCount: '36 audited sites of 61 freight-relevant US facilities',
    facilityTypes: ['Vehicle Assembly Plant', 'Stamping Plant', 'Propulsion / Powertrain Plant', 'Battery Assembly Plant', 'Parts Distribution Center'],
    geographicSpread: 'United States. Assembly, stamping, propulsion, casting, battery, and parts-distribution sites, including Spring Hill TN (720 acres) and Factory ZERO.',
    dailyTrailerMoves: 'Not modeled from public data — the audited footprint holds 1,687 dock doors and room for ~3,370 trailers.',
  },

  freight: {
    primaryModes: ['Truckload', 'Rail'],
    avgLoadsPerDay: 'Not modeled from public data. Audited density: 1,687 dock doors across 36 sites.',
  },

  signals: {},
};
