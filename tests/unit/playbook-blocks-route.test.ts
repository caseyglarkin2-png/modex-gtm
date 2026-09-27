import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  playbookBlock: {
    create: vi.fn(),
  },
};
const mockedRankPlaybookBlocks = vi.fn();

const authMock = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: () => authMock() }));
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
  authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
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

  it('ops closeout: a body createdBy is ignored; created_by is the signed-in email', async () => {
    mockedPrisma.playbookBlock.create.mockResolvedValue({ id: 'pb3', title: 'x', block_type: 'cta', tags: [], created_at: new Date() });
    const res = await POST(new NextRequest('http://localhost/api/revops/playbook-blocks', { method: 'POST', body: JSON.stringify({ title: 'CTA block', body: 'Use this CTA when buyer engagement is medium and timing is known.', createdBy: 'someone-else' }) }));
    expect(res.status).toBe(201);
    expect(mockedPrisma.playbookBlock.create.mock.calls[0][0].data.created_by).toBe('casey@freightroll.com');
  });

  it('ops closeout: no session is 401 and nothing is written', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(new NextRequest('http://localhost/api/revops/playbook-blocks', { method: 'POST', body: JSON.stringify({ title: 'CTA block', body: 'Use this CTA when buyer engagement is medium and timing is known.' }) }));
    expect(res.status).toBe(401);
    expect(mockedPrisma.playbookBlock.create).not.toHaveBeenCalled();
  });
});
