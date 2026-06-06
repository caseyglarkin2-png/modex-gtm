import { describe, it, expect, vi } from 'vitest';
import {
  buildDraftBatchPayload,
  dispatchDraftBatch,
  type DraftBatchTarget,
} from '@/lib/discovery/clawd-dispatch';

// A minimal structural row — only the fields buildDraftBatchPayload reads.
// `nearestPrimoName` is an exact REFERENCE_SITES name so resolution succeeds.
const ROW = {
  name: 'Acme Foods Distribution',
  cityState: 'Madison, WI',
  segment: 'shipper' as const,
  tier: 'A' as const,
  nearestPrimoName: 'US PL Madison Factory', // resolves to "Madison, WI"
  nearestPrimoDistance: 3.42,
  corridor: 'WI-Madison',
};

const DASH_RE = /[–—]/; // en dash, em dash

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('buildDraftBatchPayload', () => {
  it('maps a row to the correct target incl. exact hook + resolved nearestLiveSite', () => {
    const payload = buildDraftBatchPayload([ROW], 'casey');
    expect(payload.owner).toBe('casey');
    expect(payload.requestedBy).toBe('casey');
    expect(payload.source).toBe('discovery-worklist');
    expect(payload.targets).toHaveLength(1);

    const t: DraftBatchTarget = payload.targets[0];
    expect(t.account).toBe('Acme Foods Distribution');
    expect(t.facilityCityState).toBe('Madison, WI');
    expect(t.nearestLiveSite).toBe('Madison, WI');
    expect(t.distanceMi).toBe(3.42);
    expect(t.icpTier).toBe('A');
    expect(t.segment).toBe('shipper');
    expect(t.corridor).toBe('WI-Madison');
    expect(t.hook).toBe(
      "we're live 3.4 mi away at the Primo Brands site in Madison, WI",
    );
  });

  it('leaves nearestLiveSite empty when the site name does not resolve', () => {
    const payload = buildDraftBatchPayload(
      [{ ...ROW, nearestPrimoName: 'Nonexistent Site' }],
      'casey',
    );
    expect(payload.targets[0].nearestLiveSite).toBe('');
    expect(payload.targets[0].hook).toBe(
      "we're live 3.4 mi away at the Primo Brands site in ",
    );
  });

  it('produces no em dash or en dash characters in any string', () => {
    const payload = buildDraftBatchPayload([ROW], 'casey');
    const blob = JSON.stringify(payload);
    expect(DASH_RE.test(blob)).toBe(false);
  });
});

describe('dispatchDraftBatch', () => {
  const payload = buildDraftBatchPayload([ROW], 'casey');

  // The not-configured branch is hit deterministically by passing an explicit
  // empty-string token. `token = opts.token ?? resolveClawdToken()` keeps ''
  // (?? only falls through on null/undefined), so an explicit '' means
  // "configured? no" without touching env or the network.
  it('returns clawd_not_configured and does NOT call fetch when token is empty', async () => {
    const fetchImpl = vi.fn();
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example',
      token: '',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, reason: 'clawd_not_configured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('on 200 posts to the right URL with a Bearer header and returns accepted/batchId', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ accepted: 1, batchId: 'b-123' }),
    );
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example/',
      token: 'secret-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://clawd.example/api/yardflow/draft-batch');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Accept).toBe('application/json');
    expect(headers.Authorization).toBe('Bearer secret-token');
    expect(JSON.parse(init.body as string)).toEqual(payload);

    expect(result).toEqual({ ok: true, accepted: 1, batchId: 'b-123' });
  });

  it('on 404 returns clawd_endpoint_not_ready', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 404));
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, reason: 'clawd_endpoint_not_ready' });
  });

  it('on 401 returns unauthorized', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 401));
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('on 403 returns unauthorized', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 403));
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('on other non-ok returns body.error or request_failed_<status>', async () => {
    const withError = vi.fn(async () => jsonResponse({ error: 'boom' }, 500));
    expect(
      await dispatchDraftBatch(payload, {
        baseUrl: 'https://clawd.example',
        token: 't',
        fetchImpl: withError as unknown as typeof fetch,
      }),
    ).toEqual({ ok: false, reason: 'boom' });

    const noError = vi.fn(async () => jsonResponse({}, 503));
    expect(
      await dispatchDraftBatch(payload, {
        baseUrl: 'https://clawd.example',
        token: 't',
        fetchImpl: noError as unknown as typeof fetch,
      }),
    ).toEqual({ ok: false, reason: 'request_failed_503' });
  });

  it('never throws; a rejected fetch becomes network_error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection reset');
    });
    const result = await dispatchDraftBatch(payload, {
      baseUrl: 'https://clawd.example',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, reason: 'network_error' });
  });
});
