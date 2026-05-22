#!/usr/bin/env node
/**
 * Patch all demo packs with `totalGlobalFootprint` and `auditedScope`
 * so the demo header reads "X of ~Y facilities (scope)" instead of
 * just "X facilities" for accounts whose real network is larger than
 * what we audited.
 *
 * Numbers below are public-knowledge approximations from annual reports
 * / press releases / Wikipedia. They don't need 4-digit precision — they
 * need to be directionally honest about scope. If any single number is
 * off, edit it here and rerun this script. The schema lives in
 * src/lib/demo/pack-schema.ts.
 *
 * Schema:
 *   - totalGlobalFootprint: worldwide facility count. Omit when account
 *     is US-only and `estimatedFootprint` already captures the network.
 *   - auditedScope: 'US' | 'NA' | 'global' — what geography we audited.
 *   - estimatedFootprint: in-scope (within auditedScope) count. Already
 *     set on some packs; we update where missing.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

/**
 * For each account: [scope, inScopeEstimate, totalGlobal | null, note]
 *
 *   scope = the geography we mapped (US | NA | global)
 *   inScopeEstimate = approx total facilities within that scope
 *   totalGlobal = approx worldwide total; null if US/NA-only company
 *   note = string appended to coverageNote.note, or null to keep existing
 */
const PATCHES = {
  'ab-inbev': {
    scope: 'NA',
    inScope: 30,
    global: 200,
    note: 'AB InBev operates ~200 breweries across 50+ countries; we audited 21 NA breweries + DCs (US/Mexico/Canada). International scope on request.',
  },
  'barnes-noble': {
    scope: 'US',
    inScope: 6,
    global: null,
    note: 'Barnes & Noble has ~600 US stores fed by ~6 regional DCs; we mapped the DC network (the only sites where trailer ops matter).',
  },
  'bob-evans-farms': {
    scope: 'US',
    inScope: 6,
    global: null,
    note: 'Bob Evans Farms operates ~6 US food-manufacturing plants supplying the retail brand + restaurant chain.',
  },
  'boston-beer-company': {
    scope: 'NA',
    inScope: 5,
    global: 6,
    note: 'Boston Beer (Sam Adams, Truly, Twisted Tea) operates ~5 NA breweries + 1 UK; we audited the NA breweries.',
  },
  'campbell-s': {
    scope: 'NA',
    inScope: 25,
    global: 25,
    note: "Campbell's Soup Company operates ~25 NA plants (mostly US + 2 Canada). Network is NA-only post-2019 Asia divestiture.",
  },
  caterpillar: {
    scope: 'NA',
    inScope: 30,
    global: 110,
    note: 'Caterpillar operates ~110 manufacturing facilities across 23 countries; we audited 21 NA plants. International scope on request.',
  },
  'cj-logistics-america': {
    scope: 'US',
    inScope: 50,
    global: 250,
    note: 'CJ Logistics America is the NA subsidiary of CJ Logistics (Korea, ~250 sites globally). We audited the NA DC/transload network.',
  },
  'coca-cola': {
    scope: 'US',
    inScope: 80,
    global: 270,
    note: 'The Coca-Cola Company operates ~270 bottling plants worldwide (including independent licensed bottlers) and ~80 across the US bottler system. We audited 30 US sites in the audit window.',
  },
  'constellation-brands': {
    scope: 'NA',
    inScope: 12,
    global: 12,
    note: 'Constellation Brands operates ~12 NA production facilities (US + Mexico) + a few in Italy / NZ. We audited 11 NA sites; the international count is small enough to call.',
  },
  'cost-plus-world-market': {
    scope: 'US',
    inScope: 4,
    global: null,
    note: 'World Market (Cost Plus) operates ~250 US retail stores fed by a handful of DCs; we mapped the DC sites where yard ops matter.',
  },
  crowley: {
    scope: 'US',
    inScope: 40,
    global: 270,
    note: 'Crowley Maritime operates ~270 terminals/ports globally across container, fuel, marine services; we audited 14 US trailer-relevant sites.',
  },
  'daimler-truck-north-america': {
    scope: 'NA',
    inScope: 20,
    global: 40,
    note: 'Daimler Truck North America (Freightliner / Western Star / Detroit) operates ~20 NA plants + parts/DC sites. Global Daimler Truck operates ~40 production sites.',
  },
  dannon: {
    scope: 'US',
    inScope: 15,
    global: 190,
    note: 'Dannon (US subsidiary of Danone) operates ~15 US plants. Parent Danone operates ~190 plants globally; international scope on request.',
  },
  'dhl-supply-chain': {
    scope: 'US',
    inScope: 100,
    global: 1500,
    note: 'DHL Supply Chain operates ~1,500 sites in 50+ countries; we audited 24 US sites in the audit window. International scope on request.',
  },
  diageo: {
    scope: 'NA',
    inScope: 12,
    global: 150,
    note: 'Diageo operates ~150 production sites across 30+ countries (Johnnie Walker, Smirnoff, Guinness, Tanqueray, Captain Morgan). We audited 10 NA sites; international scope on request.',
  },
  fedex: {
    scope: 'US',
    inScope: 1800,
    global: 5000,
    note: 'FedEx operates ~5,000 facilities globally (Express + Ground + Freight + Office); the US network is ~1,800 sites. We audited 30 representative US hubs/terminals.',
  },
  ford: {
    scope: 'NA',
    inScope: 30,
    global: 65,
    note: 'Ford operates ~65 assembly and stamping plants globally; ~30 are in North America. We audited 24 NA plants. International scope on request.',
  },
  'frito-lay': {
    scope: 'US',
    inScope: 200,
    global: null,
    note: 'Frito-Lay (PepsiCo NA subsidiary) operates ~200 US manufacturing + DC sites. We audited 29 representative sites.',
  },
  'general-mills': {
    scope: 'NA',
    inScope: 30,
    global: 35,
    note: 'General Mills operates ~35 plants globally (~30 in NA). We audited 26 NA sites.',
  },
  'georgia-pacific': {
    scope: 'NA',
    inScope: 150,
    global: 150,
    note: 'Georgia-Pacific operates ~150 NA manufacturing facilities (paper, packaging, pulp, building products). We audited 30 representative sites.',
  },
  gxo: {
    scope: 'US',
    inScope: 300,
    global: 970,
    note: 'GXO Logistics operates ~970 warehouses across 27 countries (US: ~300). We audited 30 representative US sites.',
  },
  'h-e-b': {
    scope: 'US',
    inScope: 15,
    global: null,
    note: 'H-E-B operates ~430 stores fed by ~15 DC + production facilities, primarily in Texas + Mexico. We audited the DC/manufacturing network.',
  },
  honda: {
    scope: 'NA',
    inScope: 22,
    global: 100,
    note: 'Honda operates ~100 manufacturing plants in 30+ countries; ~22 are in North America (US + Canada + Mexico, incl. Alliston, Celaya, Marysville, East Liberty, Lincoln, Greensburg, parts/engine plants). We audited 18 NA sites. International scope on request.',
  },
  'hormel-foods': {
    scope: 'NA',
    inScope: 50,
    global: 50,
    note: 'Hormel Foods operates ~50 manufacturing facilities, almost entirely in NA. We audited 27 representative sites.',
  },
  'hyundai-motor-america': {
    scope: 'NA',
    inScope: 22,
    global: 30,
    note: 'Hyundai Motor Company operates ~30 plants globally; Hyundai Motor America (the NA arm) operates ~22 NA facilities (HMMA Montgomery, HMMC Cibolo TX, HMG Metaplant America in Georgia, Kia Georgia, Genesis suppliers, parts DCs). We audited 17. International scope on request.',
  },
  'jm-smucker': {
    scope: 'NA',
    inScope: 30,
    global: 30,
    note: 'J.M. Smucker operates ~30 NA plants (Jif, Folgers, Smucker, Milk-Bone, etc.). We audited 17 representative sites.',
  },
  'john-deere': {
    scope: 'NA',
    inScope: 30,
    global: 60,
    note: 'John Deere operates ~60 manufacturing/parts facilities globally; ~30 are in NA. We audited 21 NA sites. International scope on request.',
  },
  'kenco-logistics-services': {
    scope: 'US',
    inScope: 100,
    global: null,
    note: 'Kenco Logistics operates ~100 US warehouse + transload sites. We audited 28 representative locations.',
  },
  'keurig-dr-pepper': {
    scope: 'NA',
    inScope: 35,
    global: 35,
    note: 'Keurig Dr Pepper operates ~35 manufacturing + DC sites, almost entirely NA. We audited 20 representative sites.',
  },
  'kimberly-clark': {
    scope: 'NA',
    inScope: 30,
    global: 150,
    note: 'Kimberly-Clark operates ~150 manufacturing facilities across 35 countries; we audited 18 NA sites. International scope on request.',
  },
  'mondelez-international': {
    scope: 'NA',
    inScope: 26,
    global: 160,
    note: 'We audited 22 of an estimated 26 Mondelez NA manufacturing and DC facilities. Mondelez operates ~160 plants globally; international scope (130+ sites across 80 countries) is available on request. The 4 NA sites not shown are co-manufacturer / contract sites that operate inside other companies’ footprints.',
  },
  'nestle-usa': {
    scope: 'US',
    inScope: 80,
    global: 340,
    note: 'Nestlé USA operates ~80 US sites; parent Nestlé S.A. operates ~340 factories worldwide across 77 countries. We audited 12 US sites.',
  },
  'niagara-bottling': {
    scope: 'US',
    inScope: 35,
    global: 35,
    note: 'Niagara Bottling operates ~35 US bottling plants (private-label water). We audited 30.',
  },
  'pactiv-evergreen': {
    scope: 'NA',
    inScope: 80,
    global: 80,
    note: 'Pactiv Evergreen operates ~80 NA manufacturing facilities (foodservice packaging, fresh-foods, dairy cartons). We audited 30 representative sites.',
  },
  'performance-food-group': {
    scope: 'US',
    inScope: 150,
    global: null,
    note: 'Performance Food Group operates ~150 US distribution centers (Vistar, PFG Foodservice, Reinhart). We audited 30 representative sites.',
  },
  'salson-logistics': {
    scope: 'US',
    inScope: 40,
    global: null,
    note: 'Salson Logistics operates ~40 US warehouse + transload + drayage sites. We audited 13.',
  },
  'sc-johnson': {
    scope: 'US',
    inScope: 10,
    global: 70,
    note: 'SC Johnson operates ~70 manufacturing facilities across 40+ countries; ~10 in the US. We audited 10. International scope on request.',
  },
  'the-home-depot': {
    scope: 'NA',
    inScope: 70,
    global: 70,
    note: 'The Home Depot operates ~70 distribution centers across the US + Mexico + Canada (serving ~2,300 stores). We audited 30 representative DCs.',
  },
  toyota: {
    scope: 'NA',
    inScope: 22,
    global: 50,
    note: 'Toyota Motor Corporation operates ~50 production plants globally; ~22 in NA (TMMK Kentucky, TMMI Indiana, TMMTX Texas, TMMMS Mississippi, TMMAL Alabama, TMMWV West Virginia, TMMC Cambridge ON, TMMBC Tijuana, TMMGT Guanajuato, parts DCs, R&D, NAMC HQ). We audited 17. International scope on request.',
  },
  unfi: {
    scope: 'US',
    inScope: 56,
    global: null,
    note: 'United Natural Foods Inc. operates ~56 US distribution centers (UNFI, SUPERVALU acquired 2018). We audited 27.',
  },
  'universal-logistics-holdings': {
    scope: 'US',
    inScope: 80,
    global: null,
    note: 'Universal Logistics Holdings operates ~80 US sites across truckload, intermodal, contract logistics, and value-added services. We audited 22.',
  },
  'westrock-coffee': {
    scope: 'US',
    inScope: 10,
    global: 10,
    note: 'Westrock Coffee operates ~10 facilities (US + Rwanda + Tanzania for green-coffee sourcing). We audited 6 US sites.',
  },
};

const dir = 'public/demo-packs';
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
let updated = 0;
let skipped = 0;
const unknown = [];

for (const file of files) {
  const slug = file.replace('.json', '');
  const patch = PATCHES[slug];
  const path = `${dir}/${file}`;
  const pack = JSON.parse(readFileSync(path, 'utf8'));

  if (!patch) {
    unknown.push(slug);
    skipped++;
    continue;
  }

  if (!pack.account.coverageNote) {
    pack.account.coverageNote = {
      auditedCount: pack.account.siteCount,
      estimatedFootprint: patch.inScope,
      droppedStubCount: 0,
      capHit: false,
      note: patch.note,
    };
  } else {
    pack.account.coverageNote.estimatedFootprint = patch.inScope;
    pack.account.coverageNote.note = patch.note;
  }
  pack.account.coverageNote.auditedScope = patch.scope;
  if (patch.global !== null) {
    pack.account.coverageNote.totalGlobalFootprint = patch.global;
  } else {
    // Explicitly remove the field for US-only accounts
    delete pack.account.coverageNote.totalGlobalFootprint;
  }

  writeFileSync(path, JSON.stringify(pack, null, 2));
  console.log(
    `  ${slug.padEnd(32)} audited=${String(pack.account.siteCount).padStart(3)} | scope=${patch.scope.padEnd(7)} | inscope=${String(patch.inScope).padStart(4)} | global=${patch.global ?? 'n/a'}`,
  );
  updated++;
}

console.log(`\nUpdated ${updated} packs, skipped ${skipped}.`);
if (unknown.length > 0) {
  console.log('Unknown / no patch defined:', unknown.join(', '));
}
