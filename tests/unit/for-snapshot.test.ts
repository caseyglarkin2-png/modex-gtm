import { describe, it, expect } from 'vitest';
import { buildSnapshot } from '@/lib/for/snapshot';
import { promises as fs } from 'node:fs';
import path from 'node:path';

it('reproduces a sane prize snapshot for pepsico from its pack', async () => {
  const pack = JSON.parse(await fs.readFile(path.join(process.cwd(), 'public', 'demo-packs', 'pepsico.json'), 'utf8'));
  const snap = buildSnapshot(pack);
  expect(snap.slug).toBe('pepsico');
  expect(snap.totalFacilities).toBeGreaterThan(0);
  expect(snap.annualValueLabel).toMatch(/^\$[\d.]+[KMB]\/yr$/);
  expect(snap.siloTax.auditedCount).toBe(pack.network.sites.length);
  expect(typeof snap.paybackAllSavingsMonths === 'number' || snap.paybackAllSavingsMonths === null).toBe(true);
  expect(Array.isArray(snap.facilityMix)).toBe(true);
});
