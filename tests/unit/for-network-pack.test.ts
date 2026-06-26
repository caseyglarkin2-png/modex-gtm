import { describe, it, expect } from 'vitest';
import { buildNetworkPack } from '@/lib/for/network-pack';
import { DemoPackSchema } from '@/lib/demo/pack-schema';

const roster = {
  account: 'Tyson Foods', slug: 'tyson-foods', archetype: 'manufacturer',
  facilities: [
    { name: 'Tyson - Springdale AR', city: 'Springdale', state: 'AR', type: 'Processing Plant', lat: 36.186, lng: -94.128 },
    { name: 'Tyson - Amarillo TX', city: 'Amarillo', state: 'TX', type: 'Beef Plant', lat: 35.20, lng: -101.83 },
  ],
};

describe('buildNetworkPack', () => {
  it('builds a schema-valid DemoPack from a geocoded roster', () => {
    const pack = buildNetworkPack(roster, '2026-06-25T00:00:00.000Z');
    expect(() => DemoPackSchema.parse(pack)).not.toThrow();
    expect(pack.account.slug).toBe('tyson-foods');
    expect(pack.network.sites.length).toBe(2);
    expect(pack.network.sites[0].center.lat).toBe(36.186);
    expect(pack.network.sites[0].geofences.perimeter).toBeTruthy();
    expect(pack.network.sites[0].yardMetrics.dockDoorCount).toBeNull();
    expect(pack.account.coverageNote?.note).toMatch(/not.*audit/i);
  });
  it('computes a bbox covering all sites', () => {
    const pack = buildNetworkPack(roster, '2026-06-25T00:00:00.000Z');
    const [w, s, e, n] = pack.network.bbox;
    expect(w).toBeLessThanOrEqual(-101.83); expect(e).toBeGreaterThanOrEqual(-94.128);
    expect(s).toBeLessThanOrEqual(35.20); expect(n).toBeGreaterThanOrEqual(36.186);
  });
  it('drops facilities lacking coordinates', () => {
    const r2 = { ...roster, facilities: [...roster.facilities, { name: 'X', city: 'Y', state: 'Z', type: 'DC' }] };
    expect(buildNetworkPack(r2, '2026-06-25T00:00:00.000Z').network.sites.length).toBe(2);
  });
});
