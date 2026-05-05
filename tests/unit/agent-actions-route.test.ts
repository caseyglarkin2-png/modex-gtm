import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockedRunAgentAction = vi.fn();
const mockedListCapabilities = vi.fn(() => []);

vi.mock('@/lib/agent-actions/broker', () => ({
  runAgentAction: mockedRunAgentAction,
  listAgentActionCapabilities: mockedListCapabilities,
}));

const { POST } = await import('@/app/api/agent-actions/route');
const { GET } = await import('@/app/api/agent-actions/capabilities/route');

describe('agent action routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLAWD_CONTROL_PLANE_URL;
    delete process.env.SALES_AGENT_BASE_URL;
  });

  it('parses defaults and delegates to the broker', async () => {
    mockedRunAgentAction.mockResolvedValue({
      action: 'content_context',
      provider: 'modex',
      status: 'ok',
      summary: 'Loaded',
      cards: [],
      data: {},
      freshness: {
        fetchedAt: new Date().toISOString(),
        stale: false,
        source: 'live',
        status: 'fresh',
        dimensions: {
          summary: { key: 'summary', label: 'Research summary', status: 'fresh', stale: false, source: 'live', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          signals: { key: 'signals', label: 'Signals', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          contacts: { key: 'contacts', label: 'Contacts', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
          generated_content: { key: 'generated_content', label: 'Generated content', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
        },
      },
      nextActions: [],
    });

    const req = new NextRequest('http://localhost/api/agent-actions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'content_context',
        target: { accountName: 'John Deere' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.summary).toBe('Loaded');
    expect(mockedRunAgentAction).toHaveBeenCalledWith({
      action: 'content_context',
      target: { accountName: 'John Deere' },
      refresh: false,
      depth: 'quick',
    });
  });

  it('returns configured service flags from capabilities', async () => {
    process.env.CLAWD_CONTROL_PLANE_URL = 'https://clawd.example.com';
    mockedListCapabilities.mockReturnValue([{ action: 'content_context', preferredProvider: 'modex' }] as never);

    const res = await GET();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.configured).toEqual({ clawd: true, salesAgent: false });
    expect(payload.capabilities).toHaveLength(1);
  });
});
