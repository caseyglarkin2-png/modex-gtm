#!/usr/bin/env node
/**
 * Layer the GTM-authored narrative onto the NFI Industries and Tractor Supply
 * demo packs, refreshed to the full audited network.
 *
 * Same pattern as patch-gm-narrative.mjs: build-demo-pack.ts emits only
 * audit-derived fields, so the hand-authored dossierIntro / surprisingFindings
 * / coverageNote prose live here as an idempotent post-build patch. The builder
 * preserves these forward on a plain rebuild, but this script is the canonical
 * source if either pack is regenerated from scratch.
 *
 * Why this exists: the first cut of these two packs was authored against a
 * partial 10-site NFI / 10-site TS audit. The audit later completed at 16 NFI
 * and 11 TS sites, so the prose counts (sites, dock doors, trailer spots, gate
 * and booth tallies) were stale. The numbers below are the final audited
 * figures (build-demo-pack reports them on each rebuild).
 *
 * Voice rules enforced by check-pack-voice.mjs: no em/en dash, no banned
 * fillers, dossierIntro <= 800 chars, each surprisingFinding <= 160, note <= 600.
 * This script asserts those caps before writing.
 *
 * Run: node scripts/patch-nfi-ts-narrative.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const CAPS = { dossierIntro: 800, surprisingFinding: 160, coverageNote: 600 };

const NARRATIVE = {
  nfi: {
    dossierIntro:
      'NFI runs freight yards on behalf of the retailers and manufacturers it serves, across more than 300 North American facilities. We mapped 16 of its largest and most yard-intensive sites, from Lehigh Valley cross-docks to Inland Empire import DCs and Port of Savannah logistics terminals, holding 1,836 dock doors and room for about 4,009 trailers. Control across the network is uneven. Ten of the 16 sit behind a truck gate, but only 4 run a staffed booth, and several sit open to the road. YardFlow puts one gate-to-dock standard across every yard NFI operates, no matter whose freight is moving through it.',
    surprisingFindings: [
      'Only 10 of NFI\'s 16 audited yards sit behind a truck gate, and 4 run a staffed booth. The rest sit open to the road, so trailers roll in unchecked.',
      'The 16 yards hold 1,836 dock doors and room for about 4,009 trailers, and not one is rail-served. Every load moves by truck.',
      'Sixteen sites span five yard types, from Savannah port logistics to Inland Empire DCs and Lehigh Valley cross-docks, each with its own gate routine.',
    ],
    note:
      'NFI operates 300+ North American facilities; we audited 16 of the largest and most yard-intensive (dedicated DCs, port logistics, Port of Savannah import warehouses, a fulfillment center). The rest follow the same gate/dock archetypes.',
    auditedScope: 'US',
  },
  'tractor-supply': {
    dossierIntro:
      'Tractor Supply self-distributes to its stores from a national network of large regional distribution centers. We mapped 11 of them, from the 900,000 square foot Navarre flagship to DCs in Texas, Arizona and Idaho, holding 1,119 dock doors and room for about 2,390 trailers. The yards are tightly run. Nine of the 11 sit behind a truck gate and 7 keep a staffed booth, and every one sits on rural, open-field land where trailers stage outside the fence. YardFlow turns those manual gate stops into one orchestrated gate-to-dock flow across the whole network.',
    surprisingFindings: [
      'Nine of Tractor Supply\'s 11 DCs sit behind a truck gate and 7 run a staffed booth. That is tighter yard control than most grocers we have mapped.',
      'All 11 DCs sit on rural, open-field sites, where trailers stage outside the fence line before a single gate. The check-in pinch is the choke point.',
      'The network holds 1,119 dock doors and about 2,390 trailer spots across 11 sites, and only one touches rail. Nearly everything moves by truck.',
    ],
    note: 'Audited all 11 identifiable distribution centers.',
    auditedScope: 'US',
  },
};

const DASH = /[—–]/; // em / en dash

let patched = 0;
for (const [slug, n] of Object.entries(NARRATIVE)) {
  const file = path.join(process.cwd(), 'public', 'demo-packs', `${slug}.json`);
  const pack = JSON.parse(readFileSync(file, 'utf8'));
  if (!pack.account) throw new Error(`${slug}.json has no account object`);

  // Self-check the voice/length rules before writing.
  if (n.dossierIntro.length > CAPS.dossierIntro) throw new Error(`${slug}: dossierIntro ${n.dossierIntro.length} > ${CAPS.dossierIntro}`);
  if (DASH.test(n.dossierIntro)) throw new Error(`${slug}: dossierIntro has a dash`);
  if (n.surprisingFindings.length !== 3) throw new Error(`${slug}: need exactly 3 findings`);
  n.surprisingFindings.forEach((f, i) => {
    if (f.length > CAPS.surprisingFinding) throw new Error(`${slug}: finding[${i}] ${f.length} > ${CAPS.surprisingFinding}`);
    if (DASH.test(f)) throw new Error(`${slug}: finding[${i}] has a dash`);
  });
  if (n.note.length > CAPS.coverageNote) throw new Error(`${slug}: note ${n.note.length} > ${CAPS.coverageNote}`);
  if (DASH.test(n.note)) throw new Error(`${slug}: note has a dash`);

  pack.account.dossierIntro = n.dossierIntro;
  pack.account.surprisingFindings = n.surprisingFindings;
  if (pack.account.coverageNote) {
    pack.account.coverageNote.note = n.note;
    // Scope marker for the /for builder (ForPackLite types coverageNote as a
    // weak { auditedScope? }; without a shared property TS2559 fails the build).
    pack.account.coverageNote.auditedScope = n.auditedScope;
  }

  writeFileSync(file, JSON.stringify(pack, null, 2));
  patched++;
  console.log(`Patched ${slug}.json narrative (dossierIntro, 3 findings, note, auditedScope=${n.auditedScope}).`);
}
console.log(`Done. ${patched} pack(s) patched.`);
