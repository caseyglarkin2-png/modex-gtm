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
      status: 'all',
      sent: 'sent',
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
      status: 'draft',
      sent: 'all',
      query: 'revops',
    });

    expect(result).toHaveLength(1);
    expect(result[0].account_name).toBe('Blue Rail');
  });
});
