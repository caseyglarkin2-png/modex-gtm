import fs from 'node:fs';
import path from 'node:path';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { loadLatestScored } from '@/lib/discovery/data';

const ROOT = process.cwd();
const YA = path.join(ROOT, 'output', 'yard-audits');
const OUT = path.join(ROOT, 'src', 'lib', 'intel', 'export');

function slugs(): string[] {
  return fs.readdirSync(YA, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

const dossiers: Record<string, Record<number, string>> = {};
for (const slug of slugs()) {
  const dir = path.join(YA, slug, 'dossiers');
  if (!fs.existsSync(dir)) continue;
  const m: Record<number, string> = {};
  fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().forEach((f, i) => {
    m[i + 1] = fs.readFileSync(path.join(dir, f), 'utf8');
  });
  if (Object.keys(m).length) dossiers[slug] = m;
}

const geometry: Record<string, Array<{ idx: number; name: string; geofences: unknown }>> = {};
for (const slug of slugs()) {
  const dir = path.join(YA, slug, 'sites');
  if (!fs.existsSync(dir)) continue;
  const arr = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f, i) => {
    let d: Record<string, unknown> = {};
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { /* skip */ }
    return { idx: i + 1, name: String(d.name ?? f), geofences: d.geofences ?? null };
  });
  if (arr.length) geometry[slug] = arr;
}

const microsite: Record<string, unknown> = {};
for (const a of getAllAccountMicrositeData()) {
  microsite[a.slug] = {
    painPoints: (a as Record<string, unknown>).painPoints ?? null,
    recentNews: (a as Record<string, unknown>).recentNews ?? null,
    yardFlowAngle: (a as Record<string, unknown>).yardFlowAngle ?? null,
    network: (a as Record<string, unknown>).network ?? null,
  };
}

const write = (name: string, data: unknown) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify({ generatedAt: new Date().toISOString(), data }));
  const kb = Math.round(fs.statSync(path.join(OUT, name)).size / 1024);
  console.log(`${name}: ${kb} KB`);
};
write('account-intel-dossiers.json', dossiers);
write('account-intel-geometry.json', geometry);
write('account-intel-microsite.json', microsite);
console.log(`dossiers: ${Object.keys(dossiers).length} accounts, geometry: ${Object.keys(geometry).length}, microsite: ${Object.keys(microsite).length}`);

const scored = loadLatestScored();
const universe = (scored?.prospects ?? []).map((p: Record<string, any>) => ({
  name: p.name, lat: p.lat, lng: p.lng, tier: p.tier, icp: p.icpScore,
  sub: p.scoreBreakdown, slug: p.existingAccountSlug ?? null,
  nearest: p.nearestPrimoSite, corridor: p.corridor,
}));
write('scored-universe.json', universe);
console.log(`scored-universe: ${universe.length} sites`);
