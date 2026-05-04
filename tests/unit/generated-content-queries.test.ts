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
        version_metadata: {
          infographic: {
            infographic_type: 'value_path',
            stage_intent: 'discovery',
            bundle_id: 'bundle_acme',
            sequence_position: 2,
          },
        },
        created_at: ts('2026-05-01T11:00:00.000Z'),
        campaign_id: 7,
        campaign: { name: 'Q2 Launch', campaign_type: 'trade_show' },
        checklist_state: { completed_item_ids: ['clear_value_prop', 'account_specific_proof'] },
      },
      {
        id: 90,
        account_name: 'Acme Foods',
        version: 1,
        provider_used: 'openai',
        external_send_count: 0,
        is_published: false,
        content: 'old',
        version_metadata: {},
        created_at: ts('2026-05-01T10:00:00.000Z'),
        campaign_id: null,
        campaign: null,
        checklist_state: null,
      },
      {
        id: 40,
        account_name: 'Blue Rail',
        version: 1,
        provider_used: null,
        external_send_count: 0,
        is_published: false,
        content: 'blue',
        version_metadata: {
          infographic: {
            infographic_type: 'executive_roi',
            stage_intent: 'proposal',
          },
        },
        created_at: ts('2026-05-01T09:00:00.000Z'),
        campaign_id: 3,
        campaign: { name: 'RevOps', campaign_type: 'outbound' },
        checklist_state: { completed_item_ids: ['clear_value_prop'] },
      },
    ];
    const jobs: GenerationJobRecord[] = [
      { account_name: 'Acme Foods', status: 'pending' },
      { account_name: 'Acme Foods', status: 'processing' },
      { account_name: 'Blue Rail', status: 'pending' },
      { account_name: 'Blue Rail', status: 'completed' },
    ];
    const recipients: PersonaRecord[] = [
      {
        id: 1,
        account_name: 'Acme Foods',
        name: 'Casey',
        email: 'casey@example.com',
        title: 'VP Ops',
        role_in_deal: 'Decision maker',
        email_confidence: 92,
        quality_score: 86,
        last_enriched_at: ts('2026-04-20T00:00:00.000Z'),
      },
      {
        id: 2,
        account_name: 'Blue Rail',
        name: 'Taylor',
        email: null,
        title: 'Director',
        role_in_deal: null,
        email_confidence: 0,
        quality_score: 0,
        last_enriched_at: null,
      },
    ];

    const result = buildGeneratedContentWorkspaceData(generatedRows, jobs, recipients);

    expect(result.cards).toHaveLength(2);
    expect(result.cards[0].account_name).toBe('Acme Foods');
    expect(result.cards[0].latest_version).toBe(2);
    expect(result.cards[0].pending_jobs).toBe(1);
    expect(result.cards[0].processing_jobs).toBe(1);
    expect(result.cards[0].campaign_names).toEqual(['Q2 Launch']);
    expect(result.cards[0].versions.map((version) => version.version)).toEqual([2, 1]);
    expect(result.cards[0].versions[0].quality.score).toBeGreaterThanOrEqual(0);
    expect(result.cards[0].versions[0]).toMatchObject({
      infographic_type: 'value_path',
      stage_intent: 'discovery',
      bundle_id: 'bundle_acme',
      sequence_position: 2,
    });
    expect(result.cards[0].versions[0].quality.scores).toMatchObject({
      clarity: expect.any(Number),
      personalization: expect.any(Number),
      cta_strength: expect.any(Number),
      compliance_risk: expect.any(Number),
      deliverability_risk: expect.any(Number),
    });
    expect(result.recipientsByAccount['Acme Foods']).toEqual([
      {
        id: 1,
        name: 'Casey',
        email: 'casey@example.com',
        title: 'VP Ops',
        role_in_deal: 'Decision maker',
        readiness: expect.objectContaining({
          score: expect.any(Number),
          tier: expect.any(String),
        }),
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
