import { describe, it, expect, vi, beforeEach } from 'vitest';

const getForPage = vi.fn();
vi.mock('@/lib/for/store', () => ({ getForPage: (...a: unknown[]) => getForPage(...a) }));

import { getRemoteDemoPack } from '@/lib/demo/remote-pack';

beforeEach(() => getForPage.mockReset());

it('returns null when the row has no demoPack', async () => {
  getForPage.mockResolvedValue({ slug: 'x', demoPack: null });
  expect(await getRemoteDemoPack('x')).toBeNull();
});

it('returns null when there is no row', async () => {
  getForPage.mockResolvedValue(null);
  expect(await getRemoteDemoPack('x')).toBeNull();
});

it('returns the demoPack object when present', async () => {
  getForPage.mockResolvedValue({ slug: 'x', demoPack: { account: { slug: 'x', displayName: 'X' } } });
  expect(await getRemoteDemoPack('x')).toEqual({ account: { slug: 'x', displayName: 'X' } });
});
