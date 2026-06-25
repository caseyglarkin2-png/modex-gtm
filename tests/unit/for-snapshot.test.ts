import { describe, it, expect } from 'vitest';
import { buildSnapshot, snapshotFromModel } from '@/lib/for/snapshot';
import type { AccountROIModel } from '@/lib/microsites/schema';
import { promises as fs } from 'node:fs';
import path from 'node:path';

it('snapshotFromModel builds a labeled ForSnapshot from a model alone', () => {
  const model: AccountROIModel = {
    sourceOfTruth: 'shared-engine',
    averageMarginPerShipment: 2400,
    facilityMix: [
      { archetype: 'with-yms', facilityCount: 20 },
      { archetype: 'drops-no-yms', facilityCount: 5 },
      { archetype: 'without-drops', facilityCount: 25 },
    ],
  };
  const zeroSilo = { auditedCount: 0, dropReady: 0, gated: 0, longDrive: 0, fastLane: 0, multiCampus: 0 };
  const snap = snapshotFromModel('acme-co', model, zeroSilo);
  expect(snap.slug).toBe('acme-co');
  expect(snap.totalFacilities).toBe(50);
  expect(snap.annualValueLabel).toMatch(/^\$[\d.]+[KMB]\/yr$/);
  expect(snap.facilityMix).toEqual(model.facilityMix);
  expect(snap.siloTax).toEqual(zeroSilo);
});

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
