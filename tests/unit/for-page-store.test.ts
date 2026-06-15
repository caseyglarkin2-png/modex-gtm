import { describe, it, expect, vi, beforeEach } from 'vitest';

const findUnique = vi.fn();
const upsert = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: { forPage: { findUnique: (...a: unknown[]) => findUnique(...a), upsert: (...a: unknown[]) => upsert(...a) } } }));

import { getForPage, upsertForPage } from '@/lib/for/store';

describe('for-page store', () => {
  beforeEach(() => { findUnique.mockReset(); upsert.mockReset(); });

  it('getForPage returns null for an unknown slug', async () => {
    findUnique.mockResolvedValue(null);
    expect(await getForPage('nope')).toBeNull();
  });

  it('getForPage only returns live rows', async () => {
    findUnique.mockResolvedValue({ slug: 'x', status: 'draft', pack: {}, snap: {}, override: {}, geo: null, demo_pack: null });
    expect(await getForPage('x')).toBeNull();
  });

  it('getForPage maps a live row to ForPageRow', async () => {
    findUnique.mockResolvedValue({ slug: 'x', status: 'live', pack: { a: 1 }, snap: { b: 2 }, override: { c: 3 }, geo: { d: 4 }, demo_pack: { e: 5 } });
    expect(await getForPage('x')).toEqual({ slug: 'x', status: 'live', pack: { a: 1 }, snap: { b: 2 }, override: { c: 3 }, geo: { d: 4 }, demoPack: { e: 5 } });
  });

  it('upsertForPage upserts by slug', async () => {
    upsert.mockResolvedValue({});
    await upsertForPage({ slug: 'x', status: 'live', pack: {}, snap: {}, override: {}, geo: null, demoPack: null });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'x' } }));
  });
});
