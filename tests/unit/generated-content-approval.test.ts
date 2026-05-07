import { describe, expect, it, vi } from 'vitest';
import { requiresApprovalForSend } from '@/lib/revops/generated-content-approval';

describe('generated content approval gate', () => {
  it('fails closed when no review row exists', async () => {
    const prisma = {
      messageEvolutionRegistry: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as Parameters<typeof requiresApprovalForSend>[0];

    const decision = await requiresApprovalForSend(prisma, 42);
    expect(decision.approved).toBe(false);
    expect(decision.required).toBe(true);
    expect(decision.status).toBe('missing');
  });

  it('allows approved and deployed review states', async () => {
    const prisma = {
      messageEvolutionRegistry: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: 'mer_1', status: 'approved' })
          .mockResolvedValueOnce({ id: 'mer_2', status: 'deployed' }),
      },
    } as unknown as Parameters<typeof requiresApprovalForSend>[0];

    const approved = await requiresApprovalForSend(prisma, 10);
    const deployed = await requiresApprovalForSend(prisma, 11);

    expect(approved.approved).toBe(true);
    expect(approved.status).toBe('approved');
    expect(deployed.approved).toBe(true);
    expect(deployed.status).toBe('deployed');
  });
});
