import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  messageEvolutionRegistry: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { PATCH } = await import('@/app/api/revops/message-evolution/route');

describe('message evolution route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.messageEvolutionRegistry.findUnique.mockResolvedValue({
      id: 'mer_1',
      status: 'proposed',
      previous_generated_content_id: 101,
      generated_content_id: 102,
      account_name: 'General Mills',
      created_at: new Date('2026-05-01T00:00:00Z'),
    });
    mockedPrisma.messageEvolutionRegistry.update.mockResolvedValue({
      id: 'mer_1',
      status: 'in-review',
      sla_due_at: new Date('2026-05-08T00:00:00Z'),
      reviewed_by: 'Casey',
      reviewed_at: new Date('2026-05-01T01:00:00Z'),
      deployed_at: null,
      rollback_link: '/generated-content?account=General%20Mills&version=101',
    });
  });

  it('updates workflow status based on action transitions', async () => {
    const req = new NextRequest('http://localhost/api/revops/message-evolution', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'mer_1', action: 'review', actor: 'Casey' }),
    });

    const res = await PATCH(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedPrisma.messageEvolutionRegistry.update).toHaveBeenCalled();
  });

  it('rejects invalid transitions', async () => {
    mockedPrisma.messageEvolutionRegistry.findUnique.mockResolvedValue({
      id: 'mer_2',
      status: 'deployed',
      previous_generated_content_id: 98,
      generated_content_id: 102,
      account_name: 'General Mills',
      created_at: new Date('2026-05-01T00:00:00Z'),
    });
    const req = new NextRequest('http://localhost/api/revops/message-evolution', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'mer_2', action: 'approve', actor: 'Casey' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(409);
  });
});
