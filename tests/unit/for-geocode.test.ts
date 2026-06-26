import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeFacilities } from '@/lib/for/geocode';

const okResp = (lat: number, lng: number) => ({ ok: true, json: async () => ({ status: 'OK', results: [{ geometry: { location: { lat, lng } } }] }) });

describe('geocodeFacilities', () => {
  beforeEach(() => { process.env.GOOGLE_MAPS_STATIC_API_KEY = 'k'; });
  afterEach(() => { vi.restoreAllMocks(); });

  it('keeps existing coords, geocodes the rest', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResp(40, -90));
    vi.stubGlobal('fetch', fetchMock);
    const out = await geocodeFacilities([
      { name: 'A', city: 'X', state: 'TX', lat: 1, lng: 2 },
      { name: 'B', city: 'Dallas', state: 'TX' },
    ]);
    expect(out[0].lat).toBe(1);          // untouched
    expect(out[1].lat).toBe(40);         // geocoded
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the coordless one
  });

  it('drops facilities that fail to geocode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ZERO_RESULTS', results: [] }) }));
    const out = await geocodeFacilities([{ name: 'B', city: 'Nowhere', state: 'ZZ' }]);
    expect(out.length).toBe(0);
  });

  it('returns coordless input unchanged when no API key (fail-soft)', async () => {
    delete process.env.GOOGLE_MAPS_STATIC_API_KEY;
    const out = await geocodeFacilities([{ name: 'B', city: 'Dallas', state: 'TX' }]);
    expect(out.length).toBe(0); // no key -> cannot geocode -> dropped (coordless)
  });

  it('caps at 25 facilities', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResp(40, -90)));
    const many = Array.from({ length: 40 }, (_, i) => ({ name: `F${i}`, city: 'Dallas', state: 'TX' }));
    const out = await geocodeFacilities(many);
    expect(out.length).toBeLessThanOrEqual(25);
  });
});
