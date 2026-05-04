import { describe, expect, it } from 'vitest';
import {
  buildContentAttributionRows,
  dedupeRuleLabel,
  deriveAttributionView,
  formatAttributionWindowLabel,
  getAttributionConfidence,
  summarizeContentAttribution,
} from '@/lib/analytics/content-attribution';

describe('content attribution', () => {
  it('builds attribution rows and de-dupes meetings + pipeline movements', () => {
    const rows = buildContentAttributionRows({
      sends: [
        {
          id: 1,
          account_name: 'Acme Foods',
          campaign_id: 10,
          generated_content_id: 100,
          status: 'sent',
          open_count: 1,
          reply_count: 1,
          clicked_at: new Date('2026-05-01T12:10:00.000Z'),
          sent_at: new Date('2026-05-01T12:00:00.000Z'),
        },
        {
          id: 2,
          account_name: 'Acme Foods',
          campaign_id: 10,
          generated_content_id: 100,
          status: 'delivered',
          open_count: 0,
          reply_count: 0,
          clicked_at: null,
          sent_at: new Date('2026-05-02T12:00:00.000Z'),
        },
      ],
      generatedContent: [
        {
          id: 100,
          account_name: 'Acme Foods',
          campaign_id: 10,
          content_type: 'email',
          provider_used: 'ai_gateway',
          version: 2,
          version_metadata: { prompt_template: 'cold_outreach_v2' },
        },
      ],
      recipients: [
        { email_log_id: 1, variant_key: 'control' },
        { email_log_id: 2, variant_key: 'control' },
      ],
      meetings: [
        {
          id: 200,
          account_name: 'Acme Foods',
          meeting_status: 'Booked',
          meeting_date: new Date('2026-05-03T10:00:00.000Z'),
          created_at: new Date('2026-05-03T10:00:00.000Z'),
        },
      ],
      activities: [
        {
          id: 300,
          account_name: 'Acme Foods',
          activity_type: 'Meeting',
          outcome: 'Pipeline stage progressed to proposal',
          activity_date: new Date('2026-05-04T10:00:00.000Z'),
          created_at: new Date('2026-05-04T10:00:00.000Z'),
        },
      ],
      accounts: [
        {
          name: 'Acme Foods',
          priority_score: 22,
          pipeline_stage: 'proposal',
        },
      ],
      campaigns: [
        {
          id: 10,
          name: 'MODEX 2026 Follow-Up',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      variantKey: 'control',
      providerUsed: 'ai_gateway',
      promptTemplate: 'cold_outreach_v2',
      sends: 2,
      delivered: 2,
      replies: 1,
      meetings: 1,
      pipelineMovements: 1,
      campaignName: 'MODEX 2026 Follow-Up',
      confidence: 'low',
    });
  });

  it('summarizes by view and computes confidence badge by sample size', () => {
    const summary = summarizeContentAttribution([
      {
        contentVersionId: 1,
        accountName: 'A',
        campaignId: 10,
        campaignName: 'C',
        variantKey: 'control',
        providerUsed: 'ai_gateway',
        promptTemplate: 'template_a',
        sends: 12,
        delivered: 11,
        opened: 6,
        clicked: 2,
        replies: 3,
        meetings: 1,
        pipelineMovements: 2,
        estimatedDealValue: 10000,
        confidence: 'medium',
        firstSentAt: new Date('2026-05-01T00:00:00.000Z'),
        lastSentAt: new Date('2026-05-02T00:00:00.000Z'),
      },
      {
        contentVersionId: 2,
        accountName: 'B',
        campaignId: 10,
        campaignName: 'C',
        variantKey: 'challenger',
        providerUsed: 'ai_gateway',
        promptTemplate: 'template_a',
        sends: 25,
        delivered: 24,
        opened: 12,
        clicked: 4,
        replies: 8,
        meetings: 3,
        pipelineMovements: 2,
        estimatedDealValue: 15000,
        confidence: 'medium',
        firstSentAt: new Date('2026-05-03T00:00:00.000Z'),
        lastSentAt: new Date('2026-05-04T00:00:00.000Z'),
      },
    ], 'provider');

    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      bucket: 'ai_gateway',
      sends: 37,
      replies: 11,
      meetings: 4,
      confidence: 'high',
    });
  });

  it('exposes attribution view/window/dedupe contracts', () => {
    expect(deriveAttributionView('provider')).toBe('provider');
    expect(deriveAttributionView('prompt_template')).toBe('prompt_template');
    expect(deriveAttributionView('anything-else')).toBe('variant');
    expect(getAttributionConfidence(5)).toBe('low');
    expect(getAttributionConfidence(20)).toBe('medium');
    expect(getAttributionConfidence(45)).toBe('high');
    expect(formatAttributionWindowLabel()).toContain('first-touch');
    expect(dedupeRuleLabel()).toBe('deal_id+stage_entered_at');
  });
});
