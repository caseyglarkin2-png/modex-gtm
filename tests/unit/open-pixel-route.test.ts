import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';

const updateMany = vi.fn((_args: { where: any; data: any }) => Promise.resolve({ count: 1 }));

vi.mock('@/lib/prisma', () => ({
  prisma: { emailLog: { updateMany } },
}));

const { GET } = await import('@/app/api/e/open/route');
const { generateOpenToken } = await import('@/lib/email/open-token');

function req(query: string) {
  return new Request(`https://modex-gtm.vercel.app/api/e/open/${query}`);
}

describe('GET /api/e/open (open-tracking pixel)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it('returns a 1x1 gif with no-cache headers and 200 for a valid token', async () => {
    const token = generateOpenToken('track-xyz');
    const res = await GET(req(`/?l=${encodeURIComponent(token)}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/gif');
    expect(res.headers.get('cache-control')).toContain('no-store');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.slice(0, 3).toString('ascii')).toBe('GIF');
  });

  it('first-touch only: sets opened_at when null and increments open_count', async () => {
    const token = generateOpenToken('track-1');
    await GET(req(`/?l=${encodeURIComponent(token)}`));

    // first updateMany scopes on opened_at: null and sets opened_at + increments.
    const firstTouch = updateMany.mock.calls.find(
      (c) => (c[0] as any).where?.opened_at === null,
    );
    expect(firstTouch).toBeDefined();
    expect((firstTouch![0] as any).where.tracking_id).toBe('track-1');
    expect((firstTouch![0] as any).data.opened_at).toBeInstanceOf(Date);
    expect((firstTouch![0] as any).data.open_count).toEqual({ increment: 1 });

    // second updateMany scopes on opened_at NOT null and only bumps the count
    // (never overwrites an earlier opened_at).
    const repeat = updateMany.mock.calls.find(
      (c) => (c[0] as any).where?.opened_at && (c[0] as any).where.opened_at.not === null,
    );
    expect(repeat).toBeDefined();
    expect((repeat![0] as any).data.opened_at).toBeUndefined();
    expect((repeat![0] as any).data.open_count).toEqual({ increment: 1 });
  });

  it('still returns the gif on a bad/missing token (no DB write)', async () => {
    const res = await GET(req('/?l=garbage'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/gif');
    expect(updateMany).not.toHaveBeenCalled();

    const res2 = await GET(req('/'));
    expect(res2.status).toBe(200);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('fail-soft: returns the gif even when the DB write throws', async () => {
    updateMany.mockRejectedValueOnce(new Error('db down'));
    const token = generateOpenToken('track-err');
    const res = await GET(req(`/?l=${encodeURIComponent(token)}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/gif');
  });
});
