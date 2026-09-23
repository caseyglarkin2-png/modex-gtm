/**
 * Signal routes (GAP Prospecting OS, Sprint 2, S2-T10).
 *
 * POST /api/gap/signals registers a fact; POST/DELETE
 * /api/gap/hypotheses/[id]/signals link and unlink it. The registry and the
 * link service are mocked: these tests pin the HTTP contract (gate, auth,
 * shape, status codes) and the exact signal input the route builds for each
 * kind. `fromOperatorKnowledge` is NOT mocked, so the operator path proves
 * the adapter's `externalOk: false` and `no_evidence_text` end to end.
 */

import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedAuth = vi.fn();
const mockedRegister = vi.fn();
const mockedLink = vi.fn();
const mockedUnlink = vi.fn();
const mockedAccountFind = vi.fn();
const fakePrisma = { __tag: 'fake-prisma', account: { findUnique: mockedAccountFind } };

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));
vi.mock('@/lib/gap/signals/registry', () => ({ registerSignal: mockedRegister }));
vi.mock('@/lib/gap/hypothesis/service', () => ({ linkSignals: mockedLink, unlinkSignal: mockedUnlink }));

const { POST: registerPOST } = await import('@/app/api/gap/signals/route');
const { POST: linkPOST, DELETE: unlinkDELETE } = await import('@/app/api/gap/hypotheses/[id]/signals/route');

const SIGNALS = 'http://localhost/api/gap/signals';
const LINKS = 'http://localhost/api/gap/hypotheses/hyp_1/signals';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED'] as const;

let savedEnv: Record<string, string | undefined>;

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function idParams(id = 'hyp_1') {
  return { params: Promise.resolve({ id }) };
}

function writes(): number {
  return mockedRegister.mock.calls.length + mockedLink.mock.calls.length + mockedUnlink.mock.calls.length;
}

beforeEach(() => {
  vi.clearAllMocks();
  savedEnv = {};
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.GAP_OS_ENABLED = '1';
  process.env.GAP_HYPOTHESIS_ENABLED = '1';
  mockedAuth.mockResolvedValue(SESSION);
  mockedAccountFind.mockResolvedValue({ name: 'Acme Foods' });
  mockedRegister.mockResolvedValue({ id: 'sig_new', created: true });
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

// ---------------------------------------------------------------------------
// Flag gate and auth
// ---------------------------------------------------------------------------

describe('flag gate', () => {
  it('POST /signals: GAP_OS_ENABLED off -> 404 skip payload, nothing written', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'https://x.test/a' }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(writes()).toBe(0);
  });

  it('POST /signals: hypothesis flag off -> 404 naming GAP_HYPOTHESIS_ENABLED', async () => {
    delete process.env.GAP_HYPOTHESIS_ENABLED;
    const res = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'https://x.test/a' }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_HYPOTHESIS_ENABLED=false' });
    expect(writes()).toBe(0);
  });

  it('POST and DELETE /hypotheses/[id]/signals: flags off -> 404 skip payload', async () => {
    process.env.GAP_OS_ENABLED = '0';
    const linked = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_1'] }), idParams());
    expect(linked.status).toBe(404);
    expect(await linked.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    const unlinked = await unlinkDELETE(new NextRequest(`${LINKS}?signalId=sig_1`, { method: 'DELETE' }), idParams());
    expect(unlinked.status).toBe(404);
    expect(writes()).toBe(0);
  });
});

describe('auth', () => {
  it('POST /signals: 401 without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'https://x.test/a' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(writes()).toBe(0);
  });

  it('link and unlink: 401 without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const linked = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_1'] }), idParams());
    expect(linked.status).toBe(401);
    const unlinked = await unlinkDELETE(new NextRequest(`${LINKS}?signalId=sig_1`, { method: 'DELETE' }), idParams());
    expect(unlinked.status).toBe(401);
    expect(writes()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// POST /api/gap/signals
// ---------------------------------------------------------------------------

describe('POST /api/gap/signals', () => {
  it('malformed JSON -> 400 field body; bad kind -> 400 field kind', async () => {
    const broken = await registerPOST(jsonRequest(SIGNALS, 'POST', '{not json'));
    expect(broken.status).toBe(400);
    expect(await broken.json()).toEqual({ error: 'invalid_body', field: 'body' });

    const badKind = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'rumor' }));
    expect(badKind.status).toBe(400);
    expect(await badKind.json()).toEqual({ error: 'invalid_body', field: 'kind' });
    expect(writes()).toBe(0);
  });

  it('operator knowledge with blank text -> 422 no_evidence_text from the adapter, nothing registered', async () => {
    const res = await registerPOST(
      jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'operator_knowledge', text: '   ' }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'no_evidence_text' });
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('public with a bad url -> 400 field url (not a URL, and a non-http scheme)', async () => {
    const notUrl = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'notaurl' }));
    expect(notUrl.status).toBe(400);
    expect(await notUrl.json()).toEqual({ error: 'invalid_body', field: 'url' });

    const ftp = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'ftp://x.test/a' }));
    expect(ftp.status).toBe(400);
    expect(await ftp.json()).toEqual({ error: 'invalid_body', field: 'url' });

    const missing = await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public' }));
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({ error: 'invalid_body', field: 'url' });
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('unparseable observedAt -> 400 field observedAt', async () => {
    const res = await registerPOST(
      jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'https://x.test/a', observedAt: 'yesterday-ish' }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'observedAt' });
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('unknown account -> 404 account_not_found, looked up by the trimmed name, nothing registered', async () => {
    mockedAccountFind.mockResolvedValue(null);
    const res = await registerPOST(
      jsonRequest(SIGNALS, 'POST', { accountName: ' Nobody Inc ', kind: 'operator_knowledge', text: 'They run paper gates.' }),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'account_not_found' });
    expect(mockedAccountFind).toHaveBeenCalledWith({ where: { name: 'Nobody Inc' }, select: { name: true } });
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('operator knowledge happy path: registerSignal gets the adapter row with registeredBy = session email and externalOk false', async () => {
    const res = await registerPOST(
      jsonRequest(SIGNALS, 'POST', {
        accountName: 'Acme Foods',
        kind: 'operator_knowledge',
        text: 'Their Reno DC still runs a paper gate log.',
        title: 'Paper gate log at Reno',
        observedAt: '2026-09-20',
        hubspotCompanyId: '9001',
        personaId: 7,
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'sig_new', created: true });

    expect(mockedRegister).toHaveBeenCalledTimes(1);
    const [client, input] = mockedRegister.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(client).toBe(fakePrisma);
    expect(input).toMatchObject({
      accountName: 'Acme Foods',
      hubspotCompanyId: '9001',
      personaId: 7,
      sourceKind: 'operator_knowledge',
      type: 'manual_research',
      title: 'Paper gate log at Reno',
      sourceType: 'first_party',
      evidenceUrl: null,
      evidenceText: 'Their Reno DC still runs a paper gate log.',
      externalOk: false,
      confidence: 85,
      observedAt: new Date('2026-09-20'),
      metadata: { by: 'casey@freightroll.com' },
      registeredBy: 'casey@freightroll.com',
    });
    expect(String(input.sourceId)).toMatch(/^casey@freightroll\.com:[0-9a-f]{40}$/);
  });

  it('operator knowledge: the same operator typing the same fact for the same account yields the same sourceId', async () => {
    const body = { accountName: 'Acme Foods', kind: 'operator_knowledge', text: 'Same fact.' };
    await registerPOST(jsonRequest(SIGNALS, 'POST', body));
    await registerPOST(jsonRequest(SIGNALS, 'POST', { ...body, text: '  Same fact.  ' }));
    const first = (mockedRegister.mock.calls[0] as [unknown, Record<string, unknown>])[1].sourceId;
    const second = (mockedRegister.mock.calls[1] as [unknown, Record<string, unknown>])[1].sourceId;
    expect(first).toBe(second);
  });

  it('public happy path: manual source keyed by sha1(url), externalOk true, excerpt as evidenceText, type honored, 201 with created false when it already existed', async () => {
    mockedRegister.mockResolvedValue({ id: 'sig_old', created: false });
    const res = await registerPOST(
      jsonRequest(SIGNALS, 'POST', {
        accountName: 'Acme Foods',
        kind: 'public',
        url: 'https://news.test/acme-opens-reno-dc',
        title: 'Acme opens Reno DC',
        excerpt: 'The 400,000 sq ft site opened in August.',
        observedAt: '2026-08-15T00:00:00.000Z',
        type: 'new_site',
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'sig_old', created: false });

    const [, input] = mockedRegister.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(input).toMatchObject({
      accountName: 'Acme Foods',
      sourceKind: 'manual',
      sourceId: `manual:${createHash('sha1').update('https://news.test/acme-opens-reno-dc').digest('hex')}`,
      type: 'new_site',
      title: 'Acme opens Reno DC',
      sourceType: 'public_secondary',
      evidenceUrl: 'https://news.test/acme-opens-reno-dc',
      evidenceText: 'The 400,000 sq ft site opened in August.',
      externalOk: true,
      confidence: 60,
      observedAt: new Date('2026-08-15T00:00:00.000Z'),
      registeredBy: 'casey@freightroll.com',
    });
    expect(String(input.sourceId)).toMatch(/^manual:[0-9a-f]{40}$/);
    // new_site keeps 120 days of freshness.
    expect(input.freshnessExpiresAt).toEqual(new Date('2026-12-13T00:00:00.000Z'));
  });

  it('public defaults: type manual_research, title from the url, observedAt now, no excerpt -> evidenceText null', async () => {
    const before = Date.now();
    await registerPOST(jsonRequest(SIGNALS, 'POST', { accountName: 'Acme Foods', kind: 'public', url: 'https://x.test/a' }));
    const [, input] = mockedRegister.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(input).toMatchObject({ type: 'manual_research', title: 'https://x.test/a', evidenceText: null, externalOk: true });
    const observedAt = input.observedAt as Date;
    expect(observedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(observedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

// ---------------------------------------------------------------------------
// POST / DELETE /api/gap/hypotheses/[id]/signals
// ---------------------------------------------------------------------------

describe('POST /api/gap/hypotheses/[id]/signals', () => {
  it('empty signalIds -> 400 field signalIds', async () => {
    const res = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: [] }), idParams());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_body', field: 'signalIds' });
    expect(mockedLink).not.toHaveBeenCalled();
  });

  it('200 {linked, already} and the service gets the id, ids and the session email as actor', async () => {
    mockedLink.mockResolvedValue({ ok: true, id: 'hyp_1', status: 'draft', linked: ['sig_2'], already: ['sig_1'] });
    const res = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_1', 'sig_2'] }), idParams());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ linked: ['sig_2'], already: ['sig_1'] });
    expect(mockedLink).toHaveBeenCalledWith(fakePrisma, 'hyp_1', ['sig_1', 'sig_2'], 'casey@freightroll.com');
  });

  it('409 narrative_frozen, 422 unknown_signal:<id>, 404 not_found', async () => {
    mockedLink.mockResolvedValueOnce({ ok: false, reason: 'narrative_frozen' });
    const frozen = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_1'] }), idParams());
    expect(frozen.status).toBe(409);
    expect(await frozen.json()).toEqual({ error: 'narrative_frozen' });

    mockedLink.mockResolvedValueOnce({ ok: false, reason: 'unknown_signal:sig_9' });
    const unknown = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_9'] }), idParams());
    expect(unknown.status).toBe(422);
    expect(await unknown.json()).toEqual({ error: 'unknown_signal:sig_9' });

    mockedLink.mockResolvedValueOnce({ ok: false, reason: 'not_found' });
    const missing = await linkPOST(jsonRequest(LINKS, 'POST', { signalIds: ['sig_1'] }), idParams('hyp_0'));
    expect(missing.status).toBe(404);
  });
});

describe('DELETE /api/gap/hypotheses/[id]/signals', () => {
  it('missing signalId -> 400 invalid_query field signalId', async () => {
    const res = await unlinkDELETE(new NextRequest(LINKS, { method: 'DELETE' }), idParams());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'signalId' });
    expect(mockedUnlink).not.toHaveBeenCalled();
  });

  it('200 {unlinked} with the actor from the session', async () => {
    mockedUnlink.mockResolvedValue({ ok: true, id: 'hyp_1', status: 'draft', unlinked: 'sig_2' });
    const res = await unlinkDELETE(new NextRequest(`${LINKS}?signalId=sig_2`, { method: 'DELETE' }), idParams());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unlinked: 'sig_2' });
    expect(mockedUnlink).toHaveBeenCalledWith(fakePrisma, 'hyp_1', 'sig_2', 'casey@freightroll.com');
  });

  it('409 narrative_frozen, 409 unlinked_citation, 422 not_linked', async () => {
    for (const [reason, status] of [
      ['narrative_frozen', 409],
      ['unlinked_citation', 409],
      ['not_linked', 422],
    ] as const) {
      mockedUnlink.mockResolvedValueOnce({ ok: false, reason });
      const res = await unlinkDELETE(new NextRequest(`${LINKS}?signalId=sig_2`, { method: 'DELETE' }), idParams());
      expect(res.status).toBe(status);
      expect(await res.json()).toEqual({ error: reason });
    }
  });
});
