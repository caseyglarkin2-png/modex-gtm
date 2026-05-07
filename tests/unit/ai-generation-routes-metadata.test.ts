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
const mockedResolveCanonicalAccountScope = vi.fn();
const mockedRecordSourceBackedMetric = vi.fn(async () => undefined);

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
vi.mock('@/lib/revops/account-identity', () => ({
  resolveCanonicalAccountScope: mockedResolveCanonicalAccountScope,
}));
vi.mock('@/lib/source-backed/metrics', () => ({
  recordSourceBackedMetric: mockedRecordSourceBackedMetric,
}));

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
    status: 'fresh',
    dimensions: {
      summary: { key: 'summary', label: 'Research summary', status: 'fresh', stale: false, source: 'live', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
      signals: { key: 'signals', label: 'Signals', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
      contacts: { key: 'contacts', label: 'Contacts', status: 'aging', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z', ageHours: 24, note: '' },
      generated_content: { key: 'generated_content', label: 'Generated content', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
    },
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
  mockedResolveCanonicalAccountScope.mockResolvedValue({
    requestedName: 'Americold',
    normalizedKeys: ['americold'],
    canonicalCompanyIds: ['domain:americold.com'],
    accountNames: ['Americold Logistics', 'Americold'],
  });
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
    mockedGenerateText.mockResolvedValue('Should we send a short overview?\n\nCITATIONS: [[SRC:signal_1]] [[SRC:proof_1]]');

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
        content: expect.not.stringContaining('[[SRC:'),
        version_metadata: expect.objectContaining({
          prompt_policy_version: expect.any(String),
          cta_mode: 'scorecard_reply',
          agent_context_summary: expect.stringContaining('Americold'),
          generation_input_contract: expect.objectContaining({
            account_brief: expect.stringContaining('Americold'),
            cta_mode: 'scorecard_reply',
          }),
          source_backed_contract_v1: expect.objectContaining({
            contract: 'source_backed_contract_v1',
            citation_threshold: 1,
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
        sourceBacked: {
          accountWedge: 'Cold-chain throughput pressure is compounding.',
          personWedge: 'Ops owner needs lane-level standardization.',
          angles: [
            {
              label: 'Primary angle',
              rationale: 'Standardize gate-to-dock motion before peak swings.',
              evidenceRefIds: ['signal_1', 'proof_1'],
            },
          ],
          citations: ['signal_1', 'proof_1'],
        },
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
        account_name: 'Americold Logistics',
        version_metadata: expect.objectContaining({
          cta_mode: 'scorecard_reply',
          generation_input_contract: expect.objectContaining({
            account_brief: expect.stringContaining('Americold'),
            proof_context: expect.any(Array),
          }),
          source_backed_contract_v1: expect.objectContaining({
            contract: 'source_backed_contract_v1',
          }),
          provenance: expect.objectContaining({
            requested_account_name: 'Americold',
            persisted_account_name: 'Americold Logistics',
            scoped_account_names: ['Americold Logistics', 'Americold'],
            used_live_intel: true,
            signal_count: expect.any(Number),
            recommended_contact_count: expect.any(Number),
            committee_gap_count: expect.any(Number),
            freshness_status: 'fresh',
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
    mockedGenerateText.mockResolvedValue('SUBJECT: yard variance\n---\nShould we send a short overview?\nCITATIONS: [[SRC:signal_1]]');

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
          source_backed_contract_v1: expect.objectContaining({
            contract: 'source_backed_contract_v1',
          }),
        }),
      }),
    }));
  });

  it('emits citation rejection metric when live-intel output lacks required citations', async () => {
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
    mockedGenerateText.mockResolvedValue('No inline citation markers here.');

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

    expect(res.status).toBe(422);
    expect(mockedRecordSourceBackedMetric).toHaveBeenCalledWith(expect.objectContaining({
      metric: 'citation_rejections',
      endpoint: '/api/ai/generate',
      accountName: 'Americold',
    }));
  });

  it('emits sidecar-unavailable metric when live intel is degraded', async () => {
    mockedGetAgentContentContext.mockResolvedValue({
      ...mockAgentContext,
      status: 'partial',
      summary: 'Sidecar provider unavailable for committee coverage.',
    });
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
    mockedGenerateText.mockResolvedValue('A cited claim [[SRC:signal_1]] with proof [[SRC:proof_1]].');

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
    expect(mockedRecordSourceBackedMetric).toHaveBeenCalledWith(expect.objectContaining({
      metric: 'sidecar_unavailable',
      endpoint: '/api/ai/generate',
      accountName: 'Americold',
    }));
  });
});
