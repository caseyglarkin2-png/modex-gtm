import { describe, it, expect, vi } from 'vitest';
import { fetchClawdExport, clawdExportUrl } from '@/lib/signal-bridge/clawd-export-client';
import type { ClawdAccountExport } from '@/lib/signal-bridge/types';

const SAMPLE: ClawdAccountExport = {
  company: 'Cargill',
  domain: 'cargill.com',
  in_intent_feed: true,
  fit: { facility_count: 80, segment: 'shipper', fit_tier: 'high' },
  signals: [{ title: 'T', url: 'https://x/y', angle: 'A' }],
  roi_hook: null,
  incumbent_vendor: null,
  brief: 'b',
  recommended_play: 'p',
  committee: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('clawdExportUrl', () => {
  it('builds the export path from a bare domain', () => {
    expect(clawdExportUrl('https://clawd.example', 'cargill.com')).toBe(
      'https://clawd.example/api/yardflow/account/cargill.com/export',
    );
  });

  it('normalizes a messy domain (protocol, www, trailing path)', () => {
    expect(clawdExportUrl('https://clawd.example', 'https://www.Cargill.com/about')).toBe(
      'https://clawd.example/api/yardflow/account/cargill.com/export',
    );
  });
});

describe('fetchClawdExport', () => {
  it('calls the export endpoint with a bearer token', async () => {
    const fetchImpl = vi.fn((_url: string | URL, _init?: RequestInit) =>
      Promise.resolve(jsonResponse(SAMPLE)),
    );
    await fetchClawdExport('cargill.com', {
      baseUrl: 'https://clawd.example',
      token: 'secret-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://clawd.example/api/yardflow/account/cargill.com/export');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret-token');
  });

  it('returns the parsed export on 200', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(SAMPLE));
    const result = await fetchClawdExport('cargill.com', {
      baseUrl: 'https://clawd.example',
      token: 't',
      fetchImpl,
    });
    expect(result.company).toBe('Cargill');
    expect(result.committee).toEqual([]);
  });

  it('throws a helpful error on a non-200 response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'not found' }, 404));
    await expect(
      fetchClawdExport('nope.com', { baseUrl: 'https://clawd.example', token: 't', fetchImpl }),
    ).rejects.toThrow(/404/);
  });

  it('throws when the response is missing the company field', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ domain: 'cargill.com' }));
    await expect(
      fetchClawdExport('cargill.com', { baseUrl: 'https://clawd.example', token: 't', fetchImpl }),
    ).rejects.toThrow(/contract|company|invalid/i);
  });

  it('throws when no token is provided', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(SAMPLE));
    await expect(
      fetchClawdExport('cargill.com', { baseUrl: 'https://clawd.example', token: '', fetchImpl }),
    ).rejects.toThrow(/token|MC_API_TOKEN/i);
  });
});
