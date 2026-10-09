// @vitest-environment node
/**
 * IW02 (intelligence wiring, 2026-10-09): the producers' door. Pinned: 404 behind the flag; 401 without a session or
 * the bearer token; a wrong-length or wrong token is refused; the envelope is validated; the import is called with
 * the origin's actor (never a Casey share) and its counts come back; the token path names the producer as the actor.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, flag, imported } = vi.hoisted(() => ({
  session: { value: null as { user: { email: string } } | null },
  flag: { off: false },
  imported: vi.fn(async (_prisma: unknown, input: { records: unknown[]; actor: string; producer?: string | null; runId?: string | null; cursor?: string | null }) => ({ accepted: input.records.length, duplicates: 0, revised: 0, invalid: 0, items: input.records.map((_, index) => ({ index, producer: 'p', producerItemId: `i${index}`, outcome: 'accepted' as const, id: `id${index}` })), runs: [{ producer: input.producer ?? 'p', runId: input.runId ?? null, ledgerId: 'l1' }] })),
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => (flag.off ? { error: 'not_found' } : null) }));
vi.mock('@/lib/gap/signals/intelligence-import', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/signals/intelligence-import')>()), importIntelligenceBatch: imported }));

import { POST } from '@/app/api/gap/intelligence-import/route';

const post = (body: unknown, headers: Record<string, string> = {}) => POST(new NextRequest('http://x/api/gap/intelligence-import', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } }));
const record = { producer: 'yards_first_brief', producerRunId: 'r', producerItemId: '2026-10-09#1', kind: 'development', title: 'Kodiak reaches Laredo', text: 'A safety driver remains.', reportedOn: '2026-10-09' };

describe('POST /api/gap/intelligence-import', () => {
  beforeEach(() => { session.value = null; flag.off = false; imported.mockClear(); delete process.env.GAP_INTEL_IMPORT_TOKEN; });

  it('404 behind the flag; 401 without a session or a token; a wrong token is refused', async () => {
    flag.off = true;
    expect((await post({ records: [record] })).status).toBe(404);
    flag.off = false;
    expect((await post({ records: [record] })).status).toBe(401);
    process.env.GAP_INTEL_IMPORT_TOKEN = 'right-token-value-0123456789';
    expect((await post({ records: [record] }, { authorization: 'Bearer wrong-token-value-0123456789' })).status).toBe(401);
    expect((await post({ records: [record] }, { authorization: 'Bearer short' })).status).toBe(401);
    expect(imported).not.toHaveBeenCalled();
  });

  it('the session path imports with the operator as actor; the envelope is validated', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    const bad = await post({ records: 'nope' });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'invalid_body', field: 'records' });
    const res = await post({ producer: 'yards_first_brief', runId: 'msg-1', records: [record, record] });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ accepted: 2, duplicates: 0, invalid: 0, runs: [{ producer: 'yards_first_brief', runId: 'msg-1' }] });
    expect(imported.mock.calls[0][1]).toMatchObject({ actor: 'casey@freightroll.com', producer: 'yards_first_brief', runId: 'msg-1', cursor: null });
  });

  it('the token path imports with the producer as actor and carries the cursor and the producer state', async () => {
    process.env.GAP_INTEL_IMPORT_TOKEN = 'right-token-value-0123456789';
    const res = await post({ producer: 'clawd_signal_hunter', cursor: 'abc|1', producerState: { status: 'partial', detail: 'page 3 timed out' }, records: [record] }, { authorization: 'Bearer right-token-value-0123456789' });
    expect(res.status).toBe(200);
    expect(imported.mock.calls[0][1]).toMatchObject({ actor: 'import:clawd_signal_hunter', producer: 'clawd_signal_hunter', cursor: 'abc|1', producerState: { status: 'partial', detail: 'page 3 timed out' } });
  });
});
