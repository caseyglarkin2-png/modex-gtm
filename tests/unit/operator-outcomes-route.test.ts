import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  account: { findUnique: vi.fn() },
  generatedContent: { findUnique: vi.fn() },
  operatorOutcome: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  activity: { create: vi.fn(), findFirst: vi.fn() },
  generationJob: { create: vi.fn() },
  signalContentLink: { upsert: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/operator-outcomes/route');

describe('operator outcomes route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.account.findUnique.mockResolvedValue({ name: 'General Mills' });
    mockedPrisma.operatorOutcome.findUnique.mockResolvedValue(null);
    mockedPrisma.operatorOutcome.create.mockResolvedValue({ id: 'out_1' });
    mockedPrisma.activity.create.mockResolvedValue({ id: 1 });
    mockedPrisma.activity.findFirst.mockResolvedValue(null);
    mockedPrisma.generationJob.create.mockResolvedValue({ id: 55 });
    mockedPrisma.generatedContent.findUnique.mockResolvedValue({
      account_name: 'General Mills',
      campaign_id: 7,
      version_metadata: {
        infographic: {
          infographic_type: 'proof_snapshot',
          stage_intent: 'proposal',
          bundle_id: 'bundle_1',
          sequence_position: 2,
        },
      },
    });
    mockedPrisma.signalContentLink.upsert.mockResolvedValue({ id: 'scl_1' });
  });

  it('creates an operator outcome and activity log', async () => {
    const req = new NextRequest('http://localhost/api/operator-outcomes', {
      method: 'POST',
      body: JSON.stringify({
        accountName: 'General Mills',
        outcomeLabel: 'positive',
        sourceKind: 'queue-item',
        sourceId: 'activity-1',
        campaignId: 7,
        generatedContentId: 101,
        sourceMetadata: {
          candidateTrace: {
            candidateId: 44,
            state: 'promoted',
          },
        },
        createdBy: 'Casey',
      }),
    });

    const res = await POST(req);
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.deduped).toBe(false);
    expect(payload.nextAction).toMatchObject({
      label: 'Convert the warm response into a meeting',
      route: '#meetings',
    });
    expect(payload.nextAsset).toMatchObject({
      route: '#assets',
    });
    expect(payload.queuedGenerationJobId).toBe(55);
    expect(mockedPrisma.operatorOutcome.create).toHaveBeenCalledWith({
      data: {
        account_name: 'General Mills',
        campaign_id: 7,
        generated_content_id: 101,
        outcome_label: 'positive',
        source_kind: 'queue-item',
        source_id: 'activity-1',
        notes: null,
        created_by: 'Casey',
      },
      select: { id: true },
    });
    expect(mockedPrisma.signalContentLink.upsert).toHaveBeenCalled();
    expect(mockedPrisma.signalContentLink.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        signal_context: expect.stringContaining('source_metadata='),
      }),
      update: expect.objectContaining({
        signal_context: expect.stringContaining('"candidateId":44'),
      }),
    }));
    expect(mockedPrisma.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        activity_type: 'Infographic Bundle',
      }),
    }));
  });

  it('returns deduped when existing outcome exists', async () => {
    mockedPrisma.operatorOutcome.findUnique.mockResolvedValue({ id: 'out_existing' });
    const req = new NextRequest('http://localhost/api/operator-outcomes', {
      method: 'POST',
      body: JSON.stringify({
        accountName: 'General Mills',
        outcomeLabel: 'neutral',
        sourceKind: 'queue-item',
        sourceId: 'activity-1',
      }),
    });

    const res = await POST(req);
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.deduped).toBe(true);
    expect(payload.nextAction).toBeTruthy();
    expect(mockedPrisma.operatorOutcome.create).not.toHaveBeenCalled();
  });
});
