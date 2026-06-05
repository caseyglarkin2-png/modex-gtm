import { describe, expect, it } from 'vitest';
import { buildBrandIndex, resolveMicrositeSlug } from '@/lib/discovery/assets';

const ENTRIES = [
  { slug: 'nestle-usa', accountName: 'Nestlé USA' },
  { slug: 'gxo', accountName: 'GXO Logistics' },
  { slug: 'dhl-supply-chain', accountName: 'DHL Supply Chain' },
  { slug: 'the-home-depot', accountName: 'The Home Depot' },
  { slug: 'frito-lay', accountName: 'Frito-Lay' },
];
const INDEX = buildBrandIndex(ENTRIES);
const VALID = new Set(ENTRIES.map((e) => e.slug));

describe('resolveMicrositeSlug', () => {
  it('returns the existing-account slug when it maps to a real microsite', () => {
    expect(resolveMicrositeSlug('Some Random DC', 'gxo', INDEX, VALID)).toBe('gxo');
  });

  it('ignores an existing slug that has no microsite', () => {
    expect(resolveMicrositeSlug('Walmart DC', 'walmart', INDEX, VALID)).toBeNull();
  });

  it('matches a net-new prospect on its brand name (accent-insensitive)', () => {
    expect(resolveMicrositeSlug('Nestle Bottled Water Delivery Dallas', undefined, INDEX, VALID)).toBe('nestle-usa');
    expect(resolveMicrositeSlug('Frito-Lay Manufacturing Plant', undefined, INDEX, VALID)).toBe('frito-lay');
  });

  it('does not link an unrelated facility', () => {
    expect(resolveMicrositeSlug('Acme Cold Storage', undefined, INDEX, VALID)).toBeNull();
  });

  it('does not false-match a substring (Homewood ≠ Home Depot)', () => {
    expect(resolveMicrositeSlug('Homewood Suites Warehouse', undefined, INDEX, VALID)).toBeNull();
  });

  it('does not match a US state name to a brand (Georgia ≠ Georgia-Pacific)', () => {
    const idx = buildBrandIndex([{ slug: 'georgia-pacific', accountName: 'Georgia-Pacific' }]);
    const valid = new Set(['georgia-pacific']);
    expect(resolveMicrositeSlug('P & B Cold Storage, Georgia', undefined, idx, valid)).toBeNull();
    // the actual brand still links
    expect(resolveMicrositeSlug('Georgia-Pacific Containerboard Plant', undefined, idx, valid)).toBe('georgia-pacific');
  });

  it('does not match a directional leading word (Southern ≠ Southern Glazer’s)', () => {
    const idx = buildBrandIndex([{ slug: 'southern-glazers', accountName: "Southern Glazer's Wine & Spirits" }]);
    const valid = new Set(['southern-glazers']);
    expect(resolveMicrositeSlug('Second Harvest Foodbank of Southern California', undefined, idx, valid)).toBeNull();
    expect(resolveMicrositeSlug('Goodwill Southern California Distribution', undefined, idx, valid)).toBeNull();
  });
});
