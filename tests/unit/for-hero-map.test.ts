import { describe, it, expect } from 'vitest';
import { buildHeroMap } from '@/lib/for/hero-map';
import { promises as fs } from 'node:fs';
import path from 'node:path';

it('projects pack sites to a US albers hero map', async () => {
  const pack = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', 'demo-packs', 'pepsico.json'), 'utf8'));
  const geo = buildHeroMap(pack);
  expect(geo.viewBox).toBe('0 0 975 610');
  expect(geo.outline.length).toBeGreaterThan(100);
  expect(geo.borders.length).toBeGreaterThan(100);
  expect(geo.cities.length).toBeGreaterThan(0);
  expect(geo.cities[0]).toHaveProperty('x');
  expect(geo.cities[0]).toHaveProperty('y');
  expect(geo.cities[0]).toHaveProperty('label');
  expect(geo.ghost.length).toBeGreaterThan(0);
});
