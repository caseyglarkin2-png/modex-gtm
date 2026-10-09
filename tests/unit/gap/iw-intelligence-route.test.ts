/**
 * IW05: GET /api/gap/intelligence is session only behind the GAP_ROUTING_ENABLED gate, validates its query, and
 * pages with the cursor it hands back (no overlap, the end reached, a damaged cursor refused).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';
import { intelligenceIdentityHash } from '@/lib/gap/signals/intelligence-record';

const { session, flag, db } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  flag: { off: false },
  db: { client: null as unknown },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
// The route's prisma is whichever client the test installed (a fresh in-memory ledger per test).
vi.mock('@/lib/prisma', () => ({ prisma: new Proxy({}, { get: (_t, p) => (db.client as Record<string | symbol, unknown>)[p] }) }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => (flag.off ? { error: 'not_found' } : null) }));

import { GET } from '@/app/api/gap/intelligence/route';

const NOW = new Date('2026-10-09T18:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const req = (q = '') => new NextRequest(`http://localhost/api/gap/intelligence${q}`);

function row(i: number, created: Date) {
  return { id: `sig${String(i).padStart(3, '0')}`, url: null, url_hash: intelligenceIdentityHash('yards_first_brief', `i${i}`), title: `Item ${i}`, source_name: 'Yards First Brief', published_at: null, origin: 'report_import', source_class: 'report', note: null, account_hint: 'Kenco', account_name: null, resolution: 'needs_account', research_status: 'none', relevance: 'account_context', categories: [], score: 1, event_id: null, feedback: null, feedback_at: null, submitted_by: 'import:yards_first_brief', metadata: { import: { producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'r', producerItemId: `i${i}`, kind: 'development', title: `Item ${i}`, text: 'A passage.', sources: [], sourceRecordIds: [], eventDate: null, reportedOn: '2026-10-09', reportedOnBasis: 'stated', collectedAt: null, importedAt: created.toISOString(), accountHint: 'Kenco', personHints: [], producerStatus: null, uncertainty: null, interpretation: null, suggestions: [], archive: { reportRef: 'r', section: null }, visibility: 'digest', contentHash: `c${i}`, revisions: [] } }, created_at: created };
}

describe('GET /api/gap/intelligence', () => {
  beforeEach(() => {
    session.value = null;
    flag.off = false;
    // Five rows over two shared timestamps.
    db.client = ledgerDb({ signals: [row(1, day(1)), row(2, day(1)), row(3, day(1)), row(4, day(2)), row(5, day(2))] }, NOW).client();
  });

  it('no session: 401', async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it('flag off: 404, even with a session', async () => {
    flag.off = true;
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect((await GET(req())).status).toBe(404);
  });

  it('a query it does not understand is 400 with the field named', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect(await (await GET(req('?kind=person'))).json()).toEqual({ error: 'invalid_query', field: 'kind' });
    expect(await (await GET(req('?limit=abc'))).json()).toEqual({ error: 'invalid_query', field: 'limit' });
    expect(await (await GET(req('?since=yesterday'))).json()).toEqual({ error: 'invalid_query', field: 'since' });
    expect(await (await GET(req('?token=x'))).json()).toEqual({ error: 'invalid_query', field: 'token' });
    expect(await (await GET(req('?cursor=nope'))).json()).toEqual({ error: 'invalid_cursor' });
  });

  it('the cursor round trip: two pages of two, then the last one, no overlap, uncached', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    const first = await GET(req('?limit=2&producer=yards_first_brief&decided=undecided'));
    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('no-store');
    const p1 = await first.json();
    expect(p1.items.map((i: { id: string }) => i.id)).toEqual(['sig003', 'sig002']);
    expect(p1.total).toBe(5);
    expect(p1.applied).toEqual({ kind: 'signal', decided: 'undecided', archive: false, producer: 'yards_first_brief' });
    expect(typeof p1.next).toBe('string');
    const p2 = await (await GET(req(`?limit=2&producer=yards_first_brief&decided=undecided&cursor=${encodeURIComponent(p1.next)}`))).json();
    expect(p2.items.map((i: { id: string }) => i.id)).toEqual(['sig001', 'sig005']);
    const p3 = await (await GET(req(`?limit=2&producer=yards_first_brief&decided=undecided&cursor=${encodeURIComponent(p2.next)}`))).json();
    expect(p3.items.map((i: { id: string }) => i.id)).toEqual(['sig004']);
    expect(p3.next).toBeNull();
    expect(p1.items[0]).toMatchObject({ key: 'signal:sig003', producerLabel: 'Yards First Brief', accountHint: 'Kenco', accountName: null, excerpt: 'A passage.', reportedOn: '2026-10-09' });
  });

  it('archive and kind flags parse: archive=1 includes the archive, kind=trigger pages triggers', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    const a = await (await GET(req('?archive=true'))).json();
    expect(a.applied.archive).toBe(true);
    const t = await (await GET(req('?kind=trigger'))).json();
    expect(t.applied.kind).toBe('trigger');
    expect(t.items).toEqual([]);
    expect(t.total).toBe(0);
  });
});
