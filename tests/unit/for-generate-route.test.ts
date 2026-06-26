import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/for/generate', () => ({ generatePageRow: vi.fn() }));
vi.mock('@/lib/for/store', () => ({ upsertForPage: vi.fn() }));
vi.mock('@/lib/for/revalidate', () => ({ revalidateForPage: vi.fn() }));
import { generatePageRow } from '@/lib/for/generate';
import { upsertForPage } from '@/lib/for/store';
import { revalidateForPage } from '@/lib/for/revalidate';
import { POST } from '@/app/api/for/generate/route';

const TOKEN = 'tok';
const req = (body: unknown, token?: string) => new Request('http://x/api/for/generate', {
  method: 'POST', body: JSON.stringify(body),
  headers: token ? { 'x-pounce-token': token, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
});

describe('POST /api/for/generate', () => {
  beforeEach(() => {
    process.env.POUNCE_INGEST_TOKEN = TOKEN;
    vi.clearAllMocks();
    (generatePageRow as ReturnType<typeof vi.fn>).mockResolvedValue({ slug: 'frito-lay', status: 'live', snap: { annualValueLabel: '$10.0M/yr', totalFacilities: 5 } });
  });
  it('401s without the token', async () => { expect((await POST(req({ slug: 'frito-lay' }))).status).toBe(401); });
  it('400s without a slug', async () => { expect((await POST(req({}, TOKEN))).status).toBe(400); });
  it('generates, stores, revalidates, returns the url', async () => {
    const res = await POST(req({ slug: 'frito-lay' }, TOKEN));
    expect(res.status).toBe(200);
    expect(generatePageRow).toHaveBeenCalledWith('frito-lay', { override: undefined, status: 'live' });
    expect(upsertForPage).toHaveBeenCalledOnce();
    expect(revalidateForPage).toHaveBeenCalledWith('frito-lay');
    expect((await res.json()).url).toBe('https://yardflow.ai/for/frito-lay');
  });
  it('passes an authored override through', async () => {
    const override = { problemHook: 'x', pilot: { site: 'Dallas', body: 'y' } };
    await POST(req({ slug: 'frito-lay', override }, TOKEN));
    expect(generatePageRow).toHaveBeenCalledWith('frito-lay', { override, status: 'live' });
  });
  it('500s with a clear message when the demo pack is missing', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "nope"'));
    const res = await POST(req({ slug: 'nope' }, TOKEN));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('no demo pack');
  });
  it('builds a research-tier row when no demo-pack but account+facilityCount given', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "newco"'));
    const res = await POST(req({ slug: 'newco', account: { displayName: 'New Co', archetype: 'beverage' }, facilityCount: 30 }, TOKEN));
    expect(res.status).toBe(200);
    expect((await res.json()).tier).toBe('research');
    expect(upsertForPage).toHaveBeenCalledOnce();
    const stored = (upsertForPage as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(stored.demoPack).toBeNull();
    expect(stored.snap.totalFacilities).toBe(30);
    expect(stored.status).toBe('live');
    expect(revalidateForPage).toHaveBeenCalledWith('newco');
  });
  it('still 500s when no demo-pack and no research inputs', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "x"'));
    const res = await POST(req({ slug: 'x' }, TOKEN));
    expect(res.status).toBe(500);
  });
  it('attaches a network demoPack when facilities are provided', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "tyson-foods"'));
    const res = await POST(req({
      slug: 'tyson-foods',
      account: { displayName: 'Tyson Foods', archetype: 'manufacturer' },
      facilityCount: 2,
      facilities: [
        { name: 'Tyson - Springdale AR', city: 'Springdale', state: 'AR', type: 'Plant', lat: 36.186, lng: -94.128 },
        { name: 'Tyson - Amarillo TX', city: 'Amarillo', state: 'TX', type: 'Plant', lat: 35.20, lng: -101.83 },
      ],
    }, TOKEN));
    expect(res.status).toBe(200);
    const stored = (upsertForPage as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(stored.demoPack).not.toBeNull();
    expect(stored.demoPack.network.sites.length).toBe(2);
    expect(stored.snap.totalFacilities).toBe(2);
  });
  it('keeps demoPack null when no facilities given (pure spear)', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "x"'));
    const res = await POST(req({ slug: 'x', account: { displayName: 'X', archetype: 'manufacturer' }, facilityCount: 5 }, TOKEN));
    expect(res.status).toBe(200);
    const stored = (upsertForPage as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
    expect(stored.demoPack).toBeNull();
  });
  it('research response includes perSiteLabel and paybackMonths', async () => {
    (generatePageRow as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no demo pack for "x"'));
    const res = await POST(req({ slug: 'x', account: { displayName: 'X', archetype: 'manufacturer' }, facilityCount: 20 }, TOKEN));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(typeof j.perSiteLabel).toBe('string');
    expect(j.perSiteLabel.length).toBeGreaterThan(0);
    expect(typeof j.paybackMonths).toBe('number');
  });
});
