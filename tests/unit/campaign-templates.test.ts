import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: { findMany: vi.fn().mockResolvedValue([]) },
    account: { findUnique: vi.fn().mockResolvedValue(null) },
    activity: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { CAMPAIGN_TEMPLATES, getCampaignTemplate } from '@/lib/campaigns/templates';
import { runCampaignDripCheck } from '@/lib/campaigns/drip';

describe('campaign templates', () => {
  it('exposes the expected preset keys and defaults', () => {
    expect(CAMPAIGN_TEMPLATES.map((template) => template.key)).toEqual([
      'trade_show_follow_up',
      'cold_outbound',
      'warm_intro',
      'seasonal_push',
    ]);

    for (const template of CAMPAIGN_TEMPLATES) {
      expect(template.defaultTouchCount).toBeGreaterThan(0);
      expect(template.suggestedIntervals.length).toBeGreaterThan(0);
      expect(template.defaultMessagingAngle.length).toBeGreaterThan(10);
      expect(template.requiredFields.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the default template when the key is missing', () => {
    expect(getCampaignTemplate('missing')).toEqual(CAMPAIGN_TEMPLATES[0]);
  });

  it('returns an empty summary when no active campaigns exist', async () => {
    const summary = await runCampaignDripCheck(new Date('2026-04-11T00:00:00Z'));
    expect(summary.campaignsChecked).toBe(0);
    expect(summary.activitiesCreated).toBe(0);
  });
});
