import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/for/snapshot', () => ({
  buildSnapshot: () => ({ slug: 'acme-foods', totalFacilities: 30, annualValueLabel: '$120.0M/yr', siloTax: { auditedCount: 30, dropReady: 24 } }),
}));
vi.mock('@/lib/for/hero-map', () => ({
  buildHeroMap: () => ({ viewBox: '0 0 975 610', outline: 'M0', borders: 'M0', cities: [{ label: 'Dallas TX', x: 1, y: 2 }], ghost: [{ x: 1, y: 2 }] }),
}));

import { generatePageRow, templateOverride } from '@/lib/for/generate';

const PACK = {
  account: { slug: 'acme-foods', displayName: 'Acme Foods', archetype: 'beverage', coverageNote: { auditedScope: 'US' }, featuredSiteId: 's1' },
  network: { totals: { dockDoors: 1145, trailerCapacity: 2998 }, sites: [{ id: 's1', name: 'Acme - Dallas TX' }, { id: 's2', name: 'Acme - Tolleson AZ' }] },
};

it('assembles a complete, live row with a deterministic baseline spear (no LLM, no key)', async () => {
  const row = await generatePageRow('acme-foods', { pack: PACK });
  expect(row.slug).toBe('acme-foods');
  expect(row.status).toBe('live');
  expect((row.pack as any).account.displayName).toBe('Acme Foods');
  expect((row.pack as any).network).toBeUndefined(); // lean pack, network stripped
  expect((row.snap as any).annualValueLabel).toBe('$120.0M/yr');
  expect((row.geo as any).cities.length).toBe(1);
  expect(row.demoPack).toBe(PACK); // full pack kept for /demo
  // baseline spear is data-driven from the audit numbers
  expect((row.override as any).problemHook).toContain('30 Acme Foods sites');
  expect((row.override as any).problemHook).toContain('1,145 dock doors');
  expect((row.override as any).pilot.site).toBe('Acme - Dallas TX'); // featured site
});

it('injects an authored override when provided (the pimp-out seam) and stays live', async () => {
  const authored = { problemHook: 'A sharp authored hook.', pilot: { site: 'Acme - Tolleson AZ', body: 'Authored body.' } };
  const row = await generatePageRow('acme-foods', { pack: PACK, override: authored });
  expect((row.override as any).problemHook).toBe('A sharp authored hook.');
  expect(row.status).toBe('live');
});

it('templateOverride is data-driven and follows the writing law (no em dashes)', () => {
  const o = templateOverride(PACK as never, { slug: 'acme-foods', siloTax: { auditedCount: 30, dropReady: 24 } } as never);
  expect(o.problemHook).not.toContain('—');
  expect(o.pilot.body).not.toContain('—');
  expect(o.pilot.site).toBe('Acme - Dallas TX');
  expect(o.problemHighlights).toContain('guard shacks, radios, and clipboards');
});
