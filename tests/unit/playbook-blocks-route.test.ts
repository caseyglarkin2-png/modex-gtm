import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  playbookBlock: {
    create: vi.fn(),
  },
};
const mockedRankPlaybookBlocks = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/revops/playbook-library', async () => {
  const actual = await vi.importActual<typeof import('@/lib/revops/playbook-library')>('@/lib/revops/playbook-library');
  return {
    ...actual,
    rankPlaybookBlocks: mockedRankPlaybookBlocks,
  };
});

const { GET, POST } = await import('@/app/api/revops/playbook-blocks/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('playbook blocks route', () => {
  it('returns ranked blocks', async () => {
    mockedRankPlaybookBlocks.mockResolvedValue([
      {
        id: 'pb1',
        title: 'Intro block',
        body: 'Body copy',
        block_type: 'story',
        tags: ['food'],
        industry: 'food',
        persona: 'vp ops',
        stage: 'evaluation',
        motion: 'outbound',
        created_at: new Date('2026-05-01T00:00:00.000Z'),
        performance: { sends: 10, replies: 2, meetings: 1, replyRate: 0.2, meetingRate: 0.1, sampleSize: 10, outcomeWeight: 1, confidence: 0.2, score: 0.3 },
      },
    ]);

    const res = await GET(new NextRequest('http://localhost/api/revops/playbook-blocks'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.blocks).toHaveLength(1);
    expect(json.blocks[0].title).toBe('Intro block');
  });

  it('creates a playbook block', async () => {
    mockedPrisma.playbookBlock.create.mockResolvedValue({
      id: 'pb2',
      title: 'CTA block',
      block_type: 'cta',
      tags: ['retail'],
      created_at: new Date('2026-05-02T00:00:00.000Z'),
    });
    const res = await POST(new NextRequest('http://localhost/api/revops/playbook-blocks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'CTA block',
        body: 'Use this CTA when buyer engagement is medium and timing is known.',
        blockType: 'cta',
        industry: 'Retail',
      }),
    }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockedPrisma.playbookBlock.create).toHaveBeenCalled();
  });
});
