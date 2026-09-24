/**
 * GAP API client (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Pins the five wrappers to the Sprint 4 contract: method, URL, JSON body,
 * the 2xx data pass-through, the 400 `{ error, field }` mapping, the 409
 * reason verbatim, and that a thrown fetch never escapes.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  BIDS_URL,
  DISPOSITIONS_URL,
  callBriefUrl,
  createGapApiClient,
  getCallBrief,
  listReplies,
  postBid,
  postDisposition,
  repliesUrl,
  request,
  suggestReply,
  suggestUrl,
  type DispositionBody,
  type FetchLike,
} from '@/lib/gap/ui/gap-api-client';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stub(body: unknown, status = 200) {
  const fetchImpl = vi.fn<FetchLike>(async () => jsonResponse(body, status));
  return { fetchImpl };
}

const DISPOSITION: DispositionBody = {
  hypothesisId: 'hyp_1',
  personaId: 41,
  contactEmail: 'jordan@acme.example',
  channel: 'call',
  responseClass: 'voicemail',
  source: { kind: 'call', id: 'call:41:1' },
};

describe('gap-api-client urls', () => {
  it('builds the replies url with the state and cursor', () => {
    expect(repliesUrl()).toBe('/api/gap/replies?state=undispositioned');
    expect(repliesUrl({ state: 'all', cursor: 'c2' })).toBe('/api/gap/replies?state=all&cursor=c2');
  });

  it('encodes the persona and reply ids', () => {
    expect(callBriefUrl(41)).toBe('/api/gap/call/41');
    expect(callBriefUrl('a/b')).toBe('/api/gap/call/a%2Fb');
    expect(suggestUrl('r 1')).toBe('/api/gap/replies/r%201/suggest');
  });
});

describe('listReplies', () => {
  it('GETs the replies url and normalises the page', async () => {
    const { fetchImpl } = stub({ items: [{ id: 'r1' }], nextCursor: '' });
    const out = await listReplies({ state: 'undispositioned' }, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/gap/replies?state=undispositioned');
    expect(init?.method).toBe('GET');
    expect(out).toEqual({ ok: true, status: 200, data: { items: [{ id: 'r1' }], nextCursor: null } });
  });

  it('maps a 404 (flag off) to ok false with the status', async () => {
    const { fetchImpl } = stub({ error: 'not_found' }, 404);
    const out = await listReplies({}, { fetchImpl });
    expect(out).toEqual({ ok: false, status: 404, error: 'not_found' });
  });
});

describe('getCallBrief', () => {
  it('GETs the brief and passes the body through', async () => {
    const brief = { persona: { id: 41, name: 'Jordan', email: 'j@x.test' }, account: { name: 'Acme' }, hypothesis: null, lastDispositions: [], openBids: [], suggestedQuestions: [] };
    const { fetchImpl } = stub(brief);
    const out = await getCallBrief(41, { fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/gap/call/41');
    expect(out).toEqual({ ok: true, status: 200, data: brief });
  });
});

describe('postDisposition', () => {
  it('POSTs the exact body as JSON to /api/gap/dispositions', async () => {
    const created = { dispositionId: 'd1', bidIds: [], effects: { stopped: [], unsubscribed: false, resolution: null, mirrored: false }, refusals: [] };
    const { fetchImpl } = stub(created, 201);
    const out = await postDisposition(DISPOSITION, { fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(DISPOSITIONS_URL);
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual(DISPOSITION);
    expect(out).toEqual({ ok: true, status: 201, data: created });
  });

  it('maps a 400 invalid_body to ok false with the field', async () => {
    const { fetchImpl } = stub({ error: 'invalid_body', field: 'buyerLanguage' }, 400);
    const out = await postDisposition(DISPOSITION, { fetchImpl });
    expect(out).toEqual({ ok: false, status: 400, error: 'invalid_body', field: 'buyerLanguage' });
  });

  it('maps a 409 to ok false with the reason verbatim and no field', async () => {
    const { fetchImpl } = stub({ error: 'hypothesis_not_active' }, 409);
    const out = await postDisposition(DISPOSITION, { fetchImpl });
    expect(out).toEqual({ ok: false, status: 409, error: 'hypothesis_not_active' });
    expect('field' in out).toBe(false);
  });

  it('falls back to http_<status> when the error body is not JSON', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => new Response('<html>oops</html>', { status: 502 }));
    const out = await postDisposition(DISPOSITION, { fetchImpl });
    expect(out).toEqual({ ok: false, status: 502, error: 'http_502' });
  });

  it('never throws: a network failure becomes ok false, status 0', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => {
      throw new Error('ECONNREFUSED');
    });
    const out = await postDisposition(DISPOSITION, { fetchImpl });
    expect(out).toEqual({ ok: false, status: 0, error: 'ECONNREFUSED' });
  });
});

describe('postBid and suggestReply', () => {
  it('POSTs the BID body to /api/gap/bids', async () => {
    const body = { hypothesisId: 'hyp_1', contactEmail: 'j@x.test', type: 'metric' as const, rawBuyerLanguage: '45 minutes per truck', numericValue: 45, unit: 'minutes per truck', source: 'call' as const };
    const { fetchImpl } = stub({ bidId: 'b1' }, 201);
    const out = await postBid(body, { fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe(BIDS_URL);
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).toEqual(body);
    expect(out).toEqual({ ok: true, status: 201, data: { bidId: 'b1' } });
  });

  it('POSTs the suggest route and returns the suggestion or null', async () => {
    const { fetchImpl } = stub({ suggestion: null });
    const out = await suggestReply('r1', { fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/gap/replies/r1/suggest');
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST');
    expect(out).toEqual({ ok: true, status: 200, data: { suggestion: null } });
  });
});

describe('createGapApiClient and request', () => {
  it('binds fetchImpl once for every wrapper', async () => {
    const { fetchImpl } = stub({ items: [], nextCursor: null });
    const client = createGapApiClient({ fetchImpl });
    await client.listReplies();
    await client.getCallBrief(1);
    await client.suggestReply('r1');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('request reports fetch_unavailable when no fetch exists at all', async () => {
    const saved = globalThis.fetch;
    // @ts-expect-error removing fetch on purpose
    globalThis.fetch = undefined;
    try {
      const out = await request('/x', { method: 'GET' });
      expect(out).toEqual({ ok: false, status: 0, error: 'fetch_unavailable' });
    } finally {
      globalThis.fetch = saved;
    }
  });
});
