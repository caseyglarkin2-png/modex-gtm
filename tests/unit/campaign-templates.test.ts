import { describe, expect, it } from 'vitest';
import { CAMPAIGN_TEMPLATES, getCampaignTemplate } from '@/lib/campaigns/templates';

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
});
