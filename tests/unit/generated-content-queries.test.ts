import { describe, expect, it } from 'vitest';
import {
  buildGeneratedContentWorkspaceData,
  computeGenerationQueueStats,
  type GeneratedContentRecord,
  type GenerationJobRecord,
  type PersonaRecord,
} from '@/lib/generated-content/queries';

function ts(value: string) {
  return new Date(value);
}

describe('generated-content queries', () => {
  it('builds account cards with queue counts, campaigns, versions, and recipients', () => {
    const generatedRows: GeneratedContentRecord[] = [
      {
        id: 91,
        account_name: 'Acme Foods',
        version: 2,
        provider_used: 'ai_gateway',
        external_send_count: 1,
        is_published: true,
        content: 'new',
        created_at: ts('2026-05-01T11:00:00.000Z'),
        campaign_id: 7,
        campaign: { name: 'Q2 Launch' },
      },
      {
        id: 90,
        account_name: 'Acme Foods',
        version: 1,
        provider_used: 'openai',
        external_send_count: 0,
        is_published: false,
        content: 'old',
        created_at: ts('2026-05-01T10:00:00.000Z'),
        campaign_id: null,
        campaign: null,
      },
      {
        id: 40,
        account_name: 'Blue Rail',
        version: 1,
        provider_used: null,
        external_send_count: 0,
        is_published: false,
        content: 'blue',
        created_at: ts('2026-05-01T09:00:00.000Z'),
        campaign_id: 3,
        campaign: { name: 'RevOps' },
      },
    ];
    const jobs: GenerationJobRecord[] = [
      { account_name: 'Acme Foods', status: 'pending' },
      { account_name: 'Acme Foods', status: 'processing' },
      { account_name: 'Blue Rail', status: 'pending' },
      { account_name: 'Blue Rail', status: 'completed' },
    ];
    const recipients: PersonaRecord[] = [
      { id: 1, account_name: 'Acme Foods', name: 'Casey', email: 'casey@example.com', title: 'VP Ops' },
      { id: 2, account_name: 'Blue Rail', name: 'Taylor', email: null, title: 'Director' },
    ];

    const result = buildGeneratedContentWorkspaceData(generatedRows, jobs, recipients);

    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].account_name).toBe('Acme Foods');
    expect(result.cards[0].latest_version).toBe(2);
    expect(result.cards[0].pending_jobs).toBe(1);
    expect(result.cards[0].processing_jobs).toBe(1);
    expect(result.cards[0].campaign_names).toEqual(['Q2 Launch']);
    expect(result.cards[0].versions.map((version) => version.version)).toEqual([2, 1]);
    expect(result.recipientsByAccount['Acme Foods']).toEqual([
      {
        id: 1,
        name: 'Casey',
        email: 'casey@example.com',
        title: 'VP Ops',
      },
    ]);
    expect(result.recipientsByAccount['Blue Rail']).toBeUndefined();
  });

  it('computes queue totals from statuses', () => {
    const stats = computeGenerationQueueStats([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'processing' },
      { status: 'completed' },
      { status: 'failed' },
    ]);

    expect(stats).toEqual({
      pending: 2,
      processing: 1,
      completed: 1,
      failed: 1,
    });
  });
});
