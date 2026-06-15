import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/for/snapshot', () => ({ buildSnapshot: () => ({ slug: 'acme-foods', totalFacilities: 30, siloTax: { auditedCount: 30 }, annualValueLabel: '$120.0M/yr' }) }));
vi.mock('@/lib/for/hero-map', () => ({ buildHeroMap: () => ({ viewBox: '0 0 975 610', outline: 'M0', borders: 'M0', cities: [{ label: 'Dallas TX', x: 1, y: 2 }], ghost: [{ x: 1, y: 2 }] }) }));
vi.mock('@/lib/for/author-override', () => ({ authorOverride: async () => ({ problemHook: 'Choke.', problemHighlights: [], pilot: { site: 'Acme - Dallas TX', body: 'Start.' } }) }));
const latestForAccount = vi.fn().mockResolvedValue(null);
vi.mock('@/lib/pounce/ranked', () => ({ latestForAccount: (...a: unknown[]) => latestForAccount(...a) }));

import { generatePageRow } from '@/lib/for/generate';

const PACK = { account: { slug: 'acme-foods', displayName: 'Acme Foods', archetype: 'beverage', coverageNote: { auditedScope: 'US' } }, network: { sites: [{ name: 'Acme - Dallas TX' }] } };

it('assembles a complete, live row from a demo pack', async () => {
  const row = await generatePageRow('acme-foods', PACK as never);
  expect(row.slug).toBe('acme-foods');
  expect(row.status).toBe('live');
  expect((row.pack as any).account.displayName).toBe('Acme Foods');
  expect((row.pack as any).network).toBeUndefined();
  expect((row.snap as any).annualValueLabel).toBe('$120.0M/yr');
  expect((row.geo as any).cities.length).toBe(1);
  expect((row.override as any).problemHook).toBe('Choke.');
  expect(row.demoPack).toBe(PACK);
  expect(latestForAccount).toHaveBeenCalledWith('acme-foods');
});
