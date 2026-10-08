// @vitest-environment node
/**
 * I02 (GAP OS prospecting first, 2026-10-08): POST /api/gap/decide applies one decision through the one service; a
 * signed-out caller is 401, a bad body 400, an unknown item 404; the answer carries the seller line.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';

const h = vi.hoisted(() => ({ client: null as unknown, session: { user: { email: 'casey@freightroll.com' } } as { user: { email: string } } | null }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.client; } }));
vi.mock('@/lib/auth', () => ({ auth: async () => h.session }));
import { POST } from '@/app/api/gap/decide/route';

const post = (body: unknown) => new NextRequest('http://localhost/api/gap/decide', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const NOW = new Date('2026-10-08T16:00:00Z');

describe('POST /api/gap/decide', () => {
  let db: ReturnType<typeof ledgerDb>;
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    h.session = { user: { email: 'casey@freightroll.com' } };
    db = ledgerDb({ accounts: ['Kenco'], signals: [{ id: 's1', url: null, url_hash: null, title: 'A note', source_name: null, source_class: 'note', published_at: null, created_at: NOW, origin: 'casey_share', account_name: 'Kenco', account_hint: null, resolution: 'resolved', research_status: 'none', relevance: 'account_context', categories: [], score: 0, event_id: null, feedback: null, feedback_at: null, note: 'Heard at the show', metadata: null }] }, NOW);
    h.client = db.client();
  });

  it('applies a save, answers the line; 400 on a bad decision; 404 on an unknown item; 401 signed out', async () => {
    const res = await POST(post({ key: 'signal:s1', decision: 'save' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, key: 'signal:s1', decision: 'save', effects: ['saved_as_context'], line: 'Saved the signal as context. It stays on the account; it leaves the day.' });
    expect(db.store.gapSignal[0].feedback).toBe('good_context');
    expect((await POST(post({ key: 'signal:s1', decision: 'maybe' }))).status).toBe(400);
    expect((await POST(post({ key: 'signal:nope', decision: 'skip' }))).status).toBe(404);
    h.session = null;
    expect((await POST(post({ key: 'signal:s1', decision: 'skip' }))).status).toBe(401);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === 'prospect.decision')).toHaveLength(1);
  });
});
