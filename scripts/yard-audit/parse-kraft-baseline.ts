/**
 * Phase 0.1 — Parse Jake's Kraft Location Breakdown into a structured baseline.
 *
 * Reads scripts/yard-audit/kraft-baseline.csv (Jake's original 42-column sheet),
 * emits:
 *   - output/yard-audits/kraft-heinz/baseline.json   (27 classified sites)
 *   - a console report of the archetype -> flag-pattern mapping used to
 *     calibrate assign-archetype.ts.
 *
 * Run: npx tsx scripts/yard-audit/parse-kraft-baseline.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Scripts are always run from the repo root: `npx tsx scripts/yard-audit/...`
const ROOT = process.cwd();
const CSV = join(ROOT, 'scripts', 'yard-audit', 'kraft-baseline.csv');

/** Minimal RFC-4180 CSV row parser (handles quoted fields with commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Column index map (0-based) — matches Jake's exact sheet layout.
const COL = {
  name: 0, type: 1, archetype: 2, archetypeName: 3,
  wms: 5, tms: 6, yms: 7, ebol: 8,
  connectivityAvailable: 9, shipmentVolume: 10, shiftsPerDay: 11,
  guardsPerShift: 12, dcsPerShift: 13,
  truckGate: 14, guardShack: 15, remoteGs: 16,
  preGate: 17, postGate: 18, drivewayLong: 19, drivewayShort: 20,
  backupSensitive: 21, entryExitTogether: 22, entryExitSeparate: 23,
  entryLanes: 24, exitLanes: 25, fastLaneOpportunity: 26,
  dock0_10: 27, dock10_25: 28, dock25_50: 29, dock50plus: 30,
  drop0_10: 31, drop10_25: 32, drop25_50: 33, drop50plus: 34,
  shipRcvSeparate: 35, urbanRural: 36, connectivityIssue: 37,
  multipleFacilities: 38, scale: 39, dropYard: 40, url: 41,
} as const;

const yes = (v: string) => (v || '').trim().toUpperCase() === 'YES';
const band = (r: string[], lo: number) => {
  const labels = ['0-10', '10-25', '25-50', '50+'];
  for (let i = 0; i < 4; i++) if (yes(r[lo + i])) return labels[i];
  return 'NONE';
};

const raw = readFileSync(CSV, 'utf8');
const rows = parseCsv(raw);

// Data rows start at index 2; stop at first row with no Name.
const sites: any[] = [];
for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  const name = (r[COL.name] || '').trim();
  if (!name) break;
  sites.push({
    name,
    type: (r[COL.type] || '').trim(),
    archetype: (r[COL.archetype] || '').trim(),
    archetypeName: (r[COL.archetypeName] || '').trim(),
    classification: {
      truckGate: yes(r[COL.truckGate]),
      guardShack: yes(r[COL.guardShack]),
      remoteGs: yes(r[COL.remoteGs]),
      preGateStaging: yes(r[COL.preGate]),
      postGateStaging: yes(r[COL.postGate]),
      drivewayLong: yes(r[COL.drivewayLong]),
      drivewayShort: yes(r[COL.drivewayShort]),
      backupSensitive: yes(r[COL.backupSensitive]),
      entryExitTogether: yes(r[COL.entryExitTogether]),
      entryExitSeparate: yes(r[COL.entryExitSeparate]),
      entryLanes: Number(r[COL.entryLanes]) || null,
      exitLanes: Number(r[COL.exitLanes]) || null,
      fastLaneOpportunity: yes(r[COL.fastLaneOpportunity]),
      dockDoors: band(r, COL.dock0_10),
      dropArea: band(r, COL.drop0_10),
      shipRcvSeparate: yes(r[COL.shipRcvSeparate]),
      urbanRural: (r[COL.urbanRural] || '').trim() || null,
      connectivityIssue: yes(r[COL.connectivityIssue]),
      multipleFacilities: yes(r[COL.multipleFacilities]),
      scale: yes(r[COL.scale]),
      dropYard: yes(r[COL.dropYard]),
    },
    operational: {
      shiftsPerDay: (r[COL.shiftsPerDay] || '').trim() || null,
    },
    mapsUrl: (r[COL.url] || '').trim(),
  });
}

// --- Archetype -> flag pattern report -------------------------------------
const flagKeys = [
  'truckGate', 'guardShack', 'remoteGs', 'backupSensitive',
  'entryExitSeparate', 'fastLaneOpportunity', 'multipleFacilities',
  'scale', 'shipRcvSeparate',
] as const;

console.log(`Parsed ${sites.length} Kraft sites.\n`);
console.log('Archetype -> distinguishing flag patterns (from Jake\'s data):');
const byArch = new Map<string, any[]>();
for (const s of sites) {
  if (!byArch.has(s.archetype)) byArch.set(s.archetype, []);
  byArch.get(s.archetype)!.push(s);
}
for (const a of [...byArch.keys()].sort((x, y) => Number(x.slice(1)) - Number(y.slice(1)))) {
  const group = byArch.get(a)!;
  const on = flagKeys.filter((k) => group.every((s) => s.classification[k]));
  console.log(`  ${a} (${group[0].archetypeName})  n=${group.length}  always-on: [${on.join(', ')}]`);
}

mkdirSync(join(ROOT, 'output', 'yard-audits', 'kraft-heinz'), { recursive: true });
writeFileSync(
  join(ROOT, 'output', 'yard-audits', 'kraft-heinz', 'baseline.json'),
  JSON.stringify({ account: 'Kraft Heinz', source: "Jake's Kraft Location Breakdown", siteCount: sites.length, sites }, null, 2),
);
console.log(`\nWrote output/yard-audits/kraft-heinz/baseline.json (${sites.length} sites).`);
