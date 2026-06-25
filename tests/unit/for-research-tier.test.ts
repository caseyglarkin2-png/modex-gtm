import { describe, it, expect } from 'vitest';
import { buildResearchModel, buildResearchSnapshot, researchTierSpear, DROP_RATIO_BY_VERTICAL } from '@/lib/for/research-tier';

describe('research-tier', () => {
  it('builds a nested 3-bucket facilityMix from count + vertical', () => {
    const m = buildResearchModel('retailer', 50);
    const total = m.facilityMix.reduce((n, x) => n + x.facilityCount, 0);
    expect(total).toBe(50);
    const yms = m.facilityMix.find((x) => x.archetype === 'with-yms')!.facilityCount;
    const drops = m.facilityMix.find((x) => x.archetype === 'drops-no-yms')!.facilityCount;
    expect(yms).toBe(20);          // 50 * 0.4 retailer YMS adoption
    expect(yms + drops).toBe(25);  // 50 * 0.5 default drop ratio
    expect(m.averageMarginPerShipment).toBeGreaterThan(0);
  });
  it('buildResearchSnapshot yields a labeled snapshot with zero siloTax', () => {
    const snap = buildResearchSnapshot('acme-co', { displayName: 'Acme Co', archetype: 'beverage' }, 30);
    expect(snap.slug).toBe('acme-co');
    expect(snap.totalFacilities).toBe(30);
    expect(snap.annualValueLabel).toMatch(/\/yr$/);
    expect(snap.siloTax.auditedCount).toBe(0);
  });
  it('research spear is brand-clean and count-based', () => {
    const snap = buildResearchSnapshot('acme-co', { displayName: 'Acme Co', archetype: 'beverage' }, 30);
    const spear = researchTierSpear('Acme Co', snap, 'beverage');
    expect(spear.problemHook).toBeTruthy();
    expect(spear.pilot.site).toBeTruthy();
    expect(JSON.stringify(spear).includes('—')).toBe(false); // no em dash
  });
});
