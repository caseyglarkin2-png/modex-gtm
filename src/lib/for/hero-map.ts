import { createRequire } from 'node:module';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';

const require = createRequire(import.meta.url);
const W = 975, H = 610;

export interface HeroMapData {
  viewBox: string; outline: string; borders: string;
  cities: { label: string; x: number; y: number }[];
  ghost: { x: number; y: number }[];
}

function cityLabel(name: string): string {
  const clean = name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const m = clean.match(/,\s*([A-Za-z .'\/-]+?)\s+([A-Z]{2})\s*$/);
  if (m && m[1].trim()) return `${m[1].trim()} ${m[2]}`;
  const tail = (clean.includes(' - ') ? clean.slice(clean.lastIndexOf(' - ') + 3) : clean).split(',')[0].trim();
  return tail.length > 22 ? `${tail.slice(0, 22)}…` : tail;
}

/** Project an account's real plant lat/lngs onto the US map, offline. Same
 *  output shape as Flow-State's _geo/<slug>-map.ts (gen-hero-map.mjs). */
export function buildHeroMap(pack: any): HeroMapData {
  const topo: any = JSON.parse(require('node:fs').readFileSync(require.resolve('us-atlas/states-10m.json'), 'utf8'));
  const nation = feature(topo, topo.objects.nation) as any;
  const projection = geoAlbersUsa().fitSize([W, H], nation);
  const path = geoPath(projection);
  const outline = path(nation) ?? '';
  const borders = path(mesh(topo, topo.objects.states, (a: any, b: any) => a !== b)) ?? '';

  const cities: HeroMapData['cities'] = [];
  for (const s of pack.network?.sites ?? []) {
    const c = s.center || s.coords || {};
    if (!Number.isFinite(c.lng) || !Number.isFinite(c.lat)) continue;
    const xy = projection([c.lng, c.lat]); if (!xy) continue;
    cities.push({ label: cityLabel(s.name || ''), x: +xy[0].toFixed(1), y: +xy[1].toFixed(1) });
  }

  let seed = 1337; const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const ghost: HeroMapData['ghost'] = []; let tries = 0;
  while (ghost.length < 230 && tries < 20000) {
    tries++;
    const lng = -124 + rand() * (-67 - -124), lat = 25 + rand() * (49 - 25);
    const xy = projection([lng, lat]); if (xy) ghost.push({ x: +xy[0].toFixed(1), y: +xy[1].toFixed(1) });
  }
  return { viewBox: `0 0 ${W} ${H}`, outline, borders, cities, ghost };
}
