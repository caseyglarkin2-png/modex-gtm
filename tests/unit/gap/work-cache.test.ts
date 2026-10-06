/**
 * UX-14: the Work read is remembered per instance for a short while, shares one in-flight read, is bypassed by
 * Refresh, and says when it was read; a failed read leaves nothing behind.
 */
import { describe, expect, it, vi } from 'vitest';
import { agoText, cachedRead, clearCachedReads, WORK_CACHE_TTL_MS } from '@/lib/gap/work/cache';

describe('cachedRead', () => {
  it('reads once, serves from memory inside the TTL, re-reads after it, and Refresh bypasses', async () => {
    clearCachedReads();
    const read = vi.fn().mockResolvedValue({ n: 1 });
    const t0 = new Date('2026-10-06T15:00:00Z');
    const a = await cachedRead('k', read, { now: t0 });
    expect(a).toMatchObject({ value: { n: 1 }, fromCache: false });
    const b = await cachedRead('k', read, { now: new Date(t0.getTime() + 30_000) });
    expect(b.fromCache).toBe(true);
    expect(read).toHaveBeenCalledTimes(1);
    const c = await cachedRead('k', read, { now: new Date(Date.now() + WORK_CACHE_TTL_MS + 1000) });
    expect(c.fromCache).toBe(false);
    expect(read).toHaveBeenCalledTimes(2);
    const d = await cachedRead('k', read, { fresh: true });
    expect(d.fromCache).toBe(false);
    expect(read).toHaveBeenCalledTimes(3);
  });
  it('two concurrent reads share one in-flight read; a failure leaves nothing cached', async () => {
    clearCachedReads();
    let resolve: (v: number) => void = () => {};
    const read = vi.fn(() => new Promise<number>((r) => { resolve = r; }));
    const p1 = cachedRead('c', read, { now: new Date() });
    const p2 = cachedRead('c', read, { now: new Date() });
    resolve(7);
    expect((await p1).value).toBe(7);
    expect((await p2).value).toBe(7);
    expect(read).toHaveBeenCalledTimes(1);
    const bad = vi.fn().mockRejectedValue(new Error('down'));
    await expect(cachedRead('bad', bad)).rejects.toThrow('down');
    const ok = vi.fn().mockResolvedValue('up');
    expect((await cachedRead('bad', ok)).value).toBe('up');
  });
  it('says the age in seller words', () => {
    const now = new Date('2026-10-06T15:00:00Z');
    expect(agoText('2026-10-06T14:59:58Z', now)).toBe('just now');
    expect(agoText('2026-10-06T14:59:30Z', now)).toBe('30s ago');
    expect(agoText('2026-10-06T14:55:00Z', now)).toBe('5 min ago');
  });
});
