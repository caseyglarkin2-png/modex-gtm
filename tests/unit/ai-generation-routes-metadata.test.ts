import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AgentActionResult } from '@/lib/agent-actions/types';

const mockedPrisma = {
  campaign: {
    findUnique: vi.fn(),
  },
  generatedContent: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  activity: {
    create: vi.fn(),
  },
  signalContentLink: {
    upsert: vi.fn(),
  },
  messageEvolutionRegistry: {
    create: vi.fn(),
  },
};

const mockedGetAccountContext = vi.fn();
const mockedGenerateText = vi.fn();
const mockedGenerateTextWithMetadata = vi.fn();
const mockedGetAgentContentContext = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/db', () => ({ getAccountContext: mockedGetAccountContext }));
vi.mock('@/lib/ai/client', () => ({
  generateText: mockedGenerateText,
  generateTextWithMetadata: mockedGenerateTextWithMetadata,
}));
vi.mock('@/lib/agent-actions/content-context', async () => {
  const actual = await vi.importActual<typeof import('@/lib/agent-actions/content-context')>('@/lib/agent-actions/content-context');
  return {
    ...actual,
    getAgentContentContext: mockedGetAgentContentContext,
  };
});

const { POST: generatePOST } = await import('@/app/api/ai/generate/route');
const { POST: onePagerPOST } = await import('@/app/api/ai/one-pager/route');
const { POST: sequencePOST } = await import('@/app/api/ai/sequence/route');

const mockAgentContext: AgentActionResult = {
  action: 'content_context',
  provider: 'clawd',
  status: 'ok',
  summary: 'Americold has cold-chain throughput pressure and weak committee coverage.',
  cards: [
    { title: 'Research Summary', body: 'Cold-chain network complexity is creating throughput pressure.', tone: 'success' },
    { title: 'Committee Coverage', body: 'Committee has not been built yet or is unavailable.', tone: 'warning' },
    { title: 'Buyer Map', body: 'No sales-agent decision-maker suggestions yet.', tone: 'warning' },
    { title: 'Pipeline', body: 'Pipeline snapshot available.', tone: 'success' },
    { title: 'Drafting Signals', body: 'Latest generated asset: one_pager', tone: 'default' },
  ],
  data: {
    salesContacts: [{ name: 'Cindy Thomas' }],
  },
  freshness: {
    fetchedAt: '2026-05-04T00:00:00.000Z',
    stale: false,
    source: 'live',
  },
  nextActions: ['Generate a new one-pager with live intel'],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.campaign.findUnique.mockResolvedValue(null);
  mockedPrisma.generatedContent.findFirst.mockResolvedValue({ version: 2 });
  mockedPrisma.generatedContent.create.mockResolvedValue({ id: 101 });
  mockedPrisma.activity.create.mockResolvedValue({ id: 201 });
  mockedPrisma.signalContentLink.upsert.mockResolvedValue({ id: 301 });
  mockedPrisma.messageEvolutionRegistry.create.mockResolvedValue({ id: 401 });
  mockedGetAgentContentContext.mockResolvedValue(mockAgentContext);
});

describe('AI generation route metadata', () => {
  it('persists generation input contract for generic generation', async () => {
    mockedGetAccountContext.mockResolvedValue({
      account: {
        name: 'Americold',
        priority_band: 'A',
        priority_score: 91,
        why_now: 'Cold-chain throughput pressure',
        vertical: 'Cold storage',
        primo_angle: 'Dock and yard congestion',
        parent_brand: 'Americold',
      },
      personas: [{ name: 'Kaushik Sarda', title: 'VP Supply Chain' }],
    });
    mockedGenerateText.mockResolvedValue('Should we send a short overview?');

    const res = await generatePOST(new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'email',
        accountName: 'Americold',
        personaName: 'Kaushik Sarda',
        tone: 'conversational',
        length: 'short',
        useLiveIntel: true,
      }),
    }));

    expect(res.status).toBe(200);
    expect(mockedPrisma.generatedContent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        version_metadata: expect.objectContaining({
          prompt_policy_version: expect.any(String),
          cta_mode: 'scorecard_reply',
          agent_context_summary: expect.stringContaining('Americold'),
          generation_input_contract: expect.objectContaining({
            account_brief: expect.stringContaining('Americold'),
            cta_mode: 'scorecard_reply',
          }),
        }),
      }),
    }));
  });

  it('persists generation input contract for one-pager generation', async () => {
    mockedGetAccountContext.mockResolvedValue({
      account: {
        name: 'Americold',
        parent_brand: 'Americold',
        vertical: 'Cold storage',
        why_now: 'Cold-chain throughput pressure',
        primo_angle: 'Dock and yard congestion',
        best_intro_path: 'Ops leader',
        priority_score: 91,
        tier: 'Tier 1',
        priority_band: 'A',
      },
      meetingBrief: null,
    });
    mockedGenerateTextWithMetadata.mockResolvedValue({
      provider: 'ai_gateway',
      text: JSON.stringify({
        headline: 'YARD VARIANCE HITS MARGIN',
        subheadline: 'Cold-chain complexity can create dock pressure.',
        painPoints: ['Queue variability'],
        solutionSteps: [{ step: 1, title: 'Gate Check-in', description: 'Standard intake.' }],
        outcomes: ['Reduce dwell volatility.'],
        proofStats: [
          { value: '24', label: 'Facilities Live' },
          { value: '>200', label: 'Contracted Network' },
          { value: 'NEUTRAL', label: 'Headcount Impact' },
          { value: '48→24', label: 'Avg. Drop & Hook (min)' },
          { value: '$1M+', label: 'Per-site Profit Lift' },
        ],
        customerQuote: 'Illustrative quote.',
        bestFit: 'Best fit text.',
        publicContext: '',
        suggestedNextStep: 'If useful, we can send the 1-page Yard Network scorecard.',
      }),
    });

    const res = await onePagerPOST(new NextRequest('http://localhost/api/ai/one-pager', {
      method: 'POST',
      body: JSON.stringify({
        accountName: 'Americold',
        useLiveIntel: true,
      }),
    }));

    expect(res.status).toBe(200);
    expect(mockedPrisma.generatedContent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        version_metadata: expect.objectContaining({
          cta_mode: 'scorecard_reply',
          generation_input_contract: expect.objectContaining({
            account_brief: expect.stringContaining('Americold'),
            proof_context: expect.any(Array),
          }),
        }),
      }),
    }));
  });

  it('persists generation input contract for sequence generation', async () => {
    mockedGetAccountContext.mockResolvedValue({
      account: {
        name: 'Americold',
        priority_band: 'A',
        priority_score: 91,
        why_now: 'Cold-chain throughput pressure',
        vertical: 'Cold storage',
        primo_angle: 'Dock and yard congestion',
        parent_brand: 'Americold',
      },
      personas: [{ name: 'Kaushik Sarda', title: 'VP Supply Chain' }],
    });
    mockedGenerateText.mockResolvedValue('SUBJECT: yard variance\n---\nShould we send a short overview?');

    const res = await sequencePOST(new NextRequest('http://localhost/api/ai/sequence', {
      method: 'POST',
      body: JSON.stringify({
        accountName: 'Americold',
        personaName: 'Kaushik Sarda',
        tone: 'conversational',
        useLiveIntel: true,
        steps: ['initial_email'],
      }),
    }));

    expect(res.status).toBe(200);
    expect(mockedPrisma.generatedContent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        version_metadata: expect.objectContaining({
          cta_mode: 'scorecard_reply',
          generation_input_contract: expect.objectContaining({
            recommended_contacts: expect.any(Array),
          }),
        }),
      }),
    }));
  });
});
