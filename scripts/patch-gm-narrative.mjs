#!/usr/bin/env node
/**
 * Layer the GTM-authored narrative onto the General Motors demo pack.
 *
 * Same pattern as patch-roi-defaults.mjs / patch-global-footprints.mjs:
 * build-demo-pack.ts emits only audit-derived fields, so the hand-authored
 * dossierIntro / surprisingFindings / roiDefaults / featured-site override
 * live here as an idempotent post-build patch. build-demo-pack.ts also
 * preserves these forward on a plain rebuild, but this script is the canonical
 * source if the GM pack is ever regenerated from scratch.
 *
 * Run: node scripts/patch-gm-narrative.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'public', 'demo-packs', 'general-motors.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
if (!pack.account) throw new Error('general-motors.json has no account object');

// Feature the EV flagship assembly plant (Factory ZERO) rather than the
// auto-picked Memphis PDC: the "parts in, vehicles out" two-queue story is
// GM's signature, and Factory ZERO is the most recognizable plant.
pack.account.featuredSiteId = '01-general-motors';

pack.account.dossierIntro =
  'Auto OEMs run two yards inside every plant: parts in, vehicles out. GM runs 41 freight-relevant US sites. Spring Hill is the largest plant in North America at 720 acres. Factory ZERO is GM\'s $2.2B EV flagship. A coast-to-coast parts network adds 14 processing and distribution hubs, and 24 of the 41 sites are rail-served. The Davison Road hub alone runs 84 docks behind a 132-foot automated tower. YardFlow runs supplier inbound and finished-vehicle outbound as two distinct queues on one protocol, across every site at once.';

pack.account.surprisingFindings = [
  '24 of 41 GM sites are rail-served. The inbound moves on railcars, and every railcar still ends at a truck gate the network cannot see.',
  '3,685 trailer spots sit across 41 yards. That is the parking lot GM\'s network runs blind on today.',
  'GM\'s parts network is 14 sites coast to coast. Davison Road alone runs 84 docks behind a 132-foot automated tower.',
];

// OEM-automotive margin seed for the /roi prefill, matching the Ford anchor.
pack.account.roiDefaults = { averageMarginPerShipment: 2200 };

// Canonical coverage note (no em dash, passes check-pack-voice). The builder's
// preserve-forward block copies the prior note across rebuilds, so this is the
// authoritative copy if a stale note ever sneaks back in.
if (pack.account.coverageNote) {
  pack.account.coverageNote.note =
    "We audited 41 of GM's freight-relevant US facilities: every assembly, powertrain, stamping and casting, Ultium battery, parts-processing, and parts-distribution site with a real truck yard. Pure offices and the Milford R&D campus carry no freight gate and are excluded. The wider footprint follows the same archetype distribution.";
  // Scope marker for the /for builder (ForPackLite types coverageNote as a weak
  // { auditedScope? } type; without a shared property TS2559 fails the build).
  pack.account.coverageNote.auditedScope = 'US';
}

writeFileSync(file, JSON.stringify(pack, null, 2));
console.log('Patched general-motors.json narrative (featured=01, dossierIntro, 3 findings, roiDefaults=2200).');
