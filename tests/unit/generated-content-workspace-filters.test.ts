import { describe, expect, it } from 'vitest';
import { filterGeneratedContentCards } from '@/lib/generated-content/workspace-filters';
import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

const cards: QueueGeneratedAccountCard[] = [
  {
    account_name: 'Acme Foods',
    account_slug: 'acme-foods',
    latest_version: 2,
    pending_jobs: 0,
    processing_jobs: 0,
    campaign_names: ['Q2 Launch'],
    versions: [
      {
        id: 11,
        version: 2,
        provider_used: 'ai_gateway',
        external_send_count: 2,
        is_published: true,
        content: 'x',
        created_at: '2026-05-01T00:00:00.000Z',
        quality: {
          score: 82,
          scores: { clarity: 82, personalization: 78, cta_strength: 80, compliance_risk: 15, deliverability_risk: 18 },
          flags: [],
          fixes: [],
          blockedByThreshold: false,
        },
        checklist: {
          complete: true,
          requiredComplete: 5,
          requiredTotal: 5,
          missingRequired: [],
        },
        checklist_completed_item_ids: ['clear_value_prop'],
        infographic_type: 'cold_hook',
        stage_intent: 'cold',
      },
    ],
  },
  {
    account_name: 'Blue Rail',
    account_slug: 'blue-rail',
    latest_version: 1,
    pending_jobs: 1,
    processing_jobs: 0,
    campaign_names: ['RevOps'],
    versions: [
      {
        id: 21,
        version: 1,
        provider_used: 'openai',
        external_send_count: 0,
        is_published: false,
        content: 'x',
        created_at: '2026-05-01T00:00:00.000Z',
        quality: {
          score: 51,
          scores: { clarity: 50, personalization: 50, cta_strength: 52, compliance_risk: 42, deliverability_risk: 30 },
          flags: ['low_clarity'],
          fixes: ['Tighten structure with a short summary and explicit next steps.'],
          blockedByThreshold: true,
        },
        checklist: {
          complete: false,
          requiredComplete: 2,
          requiredTotal: 5,
          missingRequired: ['cta_specific'],
        },
        checklist_completed_item_ids: ['clear_value_prop'],
        infographic_type: 'executive_roi',
        stage_intent: 'proposal',
      },
    ],
  },
];

describe('filterGeneratedContentCards', () => {
  it('filters by provider and send state', () => {
    const result = filterGeneratedContentCards(cards, {
      account: 'all',
      campaign: 'all',
      provider: 'ai_gateway',
      infographicType: 'all',
      stageIntent: 'all',
      status: 'all',
      sent: 'sent',
      advisory: 'all',
      query: '',
    });

    expect(result).toHaveLength(1);
    expect(result[0].account_name).toBe('Acme Foods');
  });

  it('filters by status and search query', () => {
    const result = filterGeneratedContentCards(cards, {
      account: 'all',
      campaign: 'all',
      provider: 'all',
      infographicType: 'all',
      stageIntent: 'all',
      status: 'draft',
      sent: 'all',
      advisory: 'all',
      query: 'revops',
    });

    expect(result).toHaveLength(1);
    expect(result[0].account_name).toBe('Blue Rail');
  });

  it('filters by advisory state', () => {
    const result = filterGeneratedContentCards(cards, {
      account: 'all',
      campaign: 'all',
      provider: 'all',
      infographicType: 'all',
      stageIntent: 'all',
      status: 'all',
      sent: 'all',
      advisory: 'clear',
      query: '',
    });
    expect(result).toHaveLength(1);
    expect(result[0].account_name).toBe('Acme Foods');
  });

  it('filters by infographic type and stage intent', () => {
    const result = filterGeneratedContentCards(cards, {
      account: 'all',
      campaign: 'all',
      provider: 'all',
      infographicType: 'executive_roi',
      stageIntent: 'proposal',
      status: 'all',
      sent: 'all',
      advisory: 'all',
      query: '',
    });

    expect(result).toHaveLength(1);
    expect(result[0].account_name).toBe('Blue Rail');
  });
});
