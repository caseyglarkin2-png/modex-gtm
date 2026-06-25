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
});
