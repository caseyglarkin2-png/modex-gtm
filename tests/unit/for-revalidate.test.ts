import { describe, it, expect, vi, afterEach } from 'vitest';
import { revalidateForPage } from '@/lib/for/revalidate';

describe('revalidateForPage', () => {
  afterEach(() => vi.restoreAllMocks());
  it('POSTs the flow-state revalidate with token + path', async () => {
    process.env.POUNCE_INGEST_TOKEN = 'tok';
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await revalidateForPage('frito-lay');
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toContain('/api/revalidate?path=/for/frito-lay');
    expect((init as RequestInit).headers).toMatchObject({ 'x-pounce-token': 'tok' });
  });
  it('never throws when fetch fails', async () => {
    process.env.POUNCE_INGEST_TOKEN = 'tok';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    await expect(revalidateForPage('frito-lay')).resolves.toBeUndefined();
  });
});
