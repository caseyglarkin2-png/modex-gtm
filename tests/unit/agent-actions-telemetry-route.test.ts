import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  activity: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

const { POST } = await import('@/app/api/agent-actions/telemetry/route');

describe('agent action telemetry route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.activity.create.mockResolvedValue({});
  });

  it('accepts workflow metric payloads and stores them in activity notes', async () => {
    const req = new NextRequest('http://localhost/api/agent-actions/telemetry', {
      method: 'POST',
      body: JSON.stringify({
        event: 'workflow_metric',
        metric: 'preview_to_send_rate',
        accountName: 'Acme Foods',
        action: 'asset_send',
        status: 'success',
        value: 1,
        count: 3,
        details: { surface: 'account_page' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mockedPrisma.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        account_name: 'Acme Foods',
        activity_type: 'Agent Workflow',
        outcome: 'preview_to_send_rate:workflow_metric',
        notes: expect.stringContaining('"metric":"preview_to_send_rate"'),
      }),
    }));
  });

  it('rejects invalid telemetry payloads', async () => {
    const req = new NextRequest('http://localhost/api/agent-actions/telemetry', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
