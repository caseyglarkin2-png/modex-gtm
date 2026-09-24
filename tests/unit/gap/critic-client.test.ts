/**
 * Critic client (GAP Prospecting OS, Sprint 3, S3-T9).
 *
 * Wraps clawd `POST /api/critic/score` (clawd-control-plane
 * scripts/routes/critic_routes.py, scripts/critic/congruence.py). Every test
 * injects fetch; nothing here reaches the network.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { CRITIC_TIMEOUT_MS, makeCriticClient } from '@/lib/gap/critic-client';

const BASE = 'https://clawd.example.test';
const TOKEN = 'mc-token-never-logged-8f3a';
const INPUT = { subject: 'Ohio gate roles', body: 'Hi Kara,\n\nYour Ohio DC posted roles.', type: 'cold_email' as const };

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

function clawdOk(overrides: Record<string, unknown> = {}) {
  return {
    verdict: 'pass',
    hard_block: false,
    score: 100,
    counts: { block: 0, warn: 0 },
    violations: [],
    artifact_type: 'email',
    used_llm: true,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('makeCriticClient: configuration', () => {
  it('missing baseUrl -> critic_unconfigured without a network call', async () => {
    const fetchImpl = vi.fn();
    const client = makeCriticClient({ baseUrl: undefined, token: TOKEN, fetchImpl });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_unconfigured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('missing token -> critic_unconfigured without a network call', async () => {
    const fetchImpl = vi.fn();
    const client = makeCriticClient({ baseUrl: BASE, token: '', fetchImpl });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_unconfigured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('defaults the timeout to five seconds', () => {
    expect(CRITIC_TIMEOUT_MS).toBe(5000);
  });
});

describe('makeCriticClient: request shape', () => {
  it('POSTs the clawd shape with a Bearer token, subject folded into the text, type email', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(clawdOk()));
    const client = makeCriticClient({ baseUrl: `${BASE}/`, token: TOKEN, fetchImpl });
    await client.score(INPUT);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/critic/score`);
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({
      text: `Subject: ${INPUT.subject}\n\n${INPUT.body}`,
      type: 'email',
      use_llm: true,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('makeCriticClient: verdict mapping', () => {
  it('pass -> ok pass with the score and no findings', async () => {
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(clawdOk()) });
    expect(await client.score(INPUT)).toEqual({ ok: true, verdict: 'pass', score: 100, findings: [] });
  });

  it('warn -> review, violations mapped to findings', async () => {
    const payload = clawdOk({
      verdict: 'warn',
      score: 94,
      counts: { block: 0, warn: 1 },
      violations: [{ rule: 'hedge-missing', severity: 'warn', message: 'no hedge', excerpt: 'you are' }],
    });
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(payload) });
    const r = await client.score(INPUT);
    expect(r).toEqual({
      ok: true,
      verdict: 'review',
      score: 94,
      findings: [{ source: 'congruence', rule: 'hedge-missing', severity: 'warn', message: 'no hedge' }],
    });
  });

  it('block -> reject', async () => {
    const payload = clawdOk({
      verdict: 'block',
      hard_block: true,
      score: 75,
      violations: [{ rule: 'canon-260-live', severity: 'block', message: '260 as live' }],
    });
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(payload) });
    const r = await client.score(INPUT);
    expect(r).toMatchObject({ ok: true, verdict: 'reject', score: 75 });
  });

  it('hard_block true is a reject even when the verdict field says pass', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => jsonResponse(clawdOk({ hard_block: true })),
    });
    expect(await client.score(INPUT)).toMatchObject({ ok: true, verdict: 'reject' });
  });

  it('edge (voice) block -> reject even when congruence passes, edge findings attached', async () => {
    const payload = clawdOk({
      edge: { verdict: 'block', hard_block: true, score: 50, violations: [{ rule: 'no-edge', severity: 'block', message: 'flat' }] },
    });
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(payload) });
    const r = await client.score(INPUT);
    expect(r).toMatchObject({ ok: true, verdict: 'reject' });
    if (!r.ok) throw new Error('unreachable');
    expect(r.findings).toEqual([{ source: 'edge', rule: 'no-edge', severity: 'block', message: 'flat' }]);
  });

  it('edge warn -> review when congruence passes', async () => {
    const payload = clawdOk({ edge: { verdict: 'warn', hard_block: false, score: 90, violations: [] } });
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(payload) });
    expect(await client.score(INPUT)).toMatchObject({ ok: true, verdict: 'review' });
  });

  it('a malformed edge block is ignored (congruence verdict stands)', async () => {
    const payload = clawdOk({ edge_error: 'edge critic failed' });
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse(payload) });
    expect(await client.score(INPUT)).toMatchObject({ ok: true, verdict: 'pass' });
  });
});

describe('makeCriticClient: failures never throw and never pass', () => {
  it('non-2xx -> critic_http_<status>', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => jsonResponse({ error: 'critic failed: boom' }, 500),
    });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_http_500' });
  });

  it('401 -> critic_http_401 (the token is wrong, not the copy)', async () => {
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse({}, 401) });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_http_401' });
  });

  it('fetch rejects -> critic_unreachable', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => {
        throw new TypeError('fetch failed');
      },
    });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_unreachable' });
  });

  it('timeout aborts the request -> critic_timeout', async () => {
    const fetchImpl = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl, timeoutMs: 10 });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_timeout' });
  });

  it('non-JSON body -> critic_malformed', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => new Response('<html>cloudflare</html>', { status: 200 }),
    });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_malformed' });
  });

  it('unknown verdict word -> critic_malformed', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => jsonResponse(clawdOk({ verdict: 'approved' })),
    });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_malformed' });
  });

  it('non-numeric score -> critic_malformed', async () => {
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => jsonResponse(clawdOk({ score: 'high' })),
    });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_malformed' });
  });

  it('a JSON array or null body -> critic_malformed', async () => {
    const client = makeCriticClient({ baseUrl: BASE, token: TOKEN, fetchImpl: async () => jsonResponse([1, 2]) });
    expect(await client.score(INPUT)).toEqual({ ok: false, reason: 'critic_malformed' });
  });

  it('never logs the token, even on failure', async () => {
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
    ];
    const client = makeCriticClient({
      baseUrl: BASE,
      token: TOKEN,
      fetchImpl: async () => {
        throw new Error(`unauthorized for ${TOKEN}`);
      },
    });
    const r = await client.score(INPUT);
    expect(JSON.stringify(r)).not.toContain(TOKEN);
    for (const spy of spies) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(TOKEN);
      }
    }
  });
});
