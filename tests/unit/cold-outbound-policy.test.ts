import { describe, expect, it, vi } from 'vitest';
import {
  COLD_OUTBOUND_PROMPT_POLICY_VERSION,
  DEFAULT_CTA_MODE,
  buildColdOutboundPolicyNotes,
  getCtaPolicy,
  getAllowedCtaFamily,
  getOnePagerSuggestedNextStep,
  isLegacyColdAsset,
} from '@/lib/revops/cold-outbound-policy';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    outreachWave: { count: vi.fn(async () => 0), updateMany: vi.fn(async () => ({})) },
    campaign: { upsert: vi.fn(async (args: { update: { messaging_angle: string } }) => ({ id: 1, ...args.update })) },
    emailLog: { updateMany: vi.fn(async () => ({})) },
    activity: { updateMany: vi.fn(async () => ({})) },
    generatedContent: { updateMany: vi.fn(async () => ({})) },
  },
}));
import { ensureDefaultCampaign } from '@/lib/campaigns';

describe('cold outbound policy', () => {
  it('defaults cold-first-touch assets to scorecard/reply CTA families', () => {
    expect(getAllowedCtaFamily('cold_email')).toBe('scorecard_reply');
    expect(getAllowedCtaFamily('sequence_step_1')).toBe('scorecard_reply');
    expect(getAllowedCtaFamily('one_pager')).toBe('scorecard_reply');
    expect(DEFAULT_CTA_MODE).toBe('scorecard_reply');
  });

  it('keeps meeting asks only for explicit meeting assets', () => {
    expect(getAllowedCtaFamily('meeting_prep')).toBe('meeting_request');
    expect(buildColdOutboundPolicyNotes('cold_email')).toMatch(/Do not ask for a date, time, benchmark call/i);
  });

  it('uses the CTA policy matrix by asset type and journey stage', () => {
    expect(getCtaPolicy('email', 'cold_email').ctaMode).toBe('scorecard_reply');
    expect(getCtaPolicy('outreach_sequence', 'sequence_step_2_plus').allowedFamily).toBe('asset_offer');
    expect(getCtaPolicy('meeting_prep', 'meeting_prep').allowedFamily).toBe('meeting_request');
    expect(getCtaPolicy('call_script', 'cold_email').disallowedFamilies).toContain('meeting_request');
  });

  it('provides a cold-safe one-pager suggested next step', () => {
    expect(getOnePagerSuggestedNextStep('Americold')).toMatch(/1-page Yard Network scorecard/i);
    expect(getOnePagerSuggestedNextStep('Americold')).not.toMatch(/20-minute|benchmark|calendar/i);
  });

  it('marks pre-policy cold assets as legacy', () => {
    expect(isLegacyColdAsset({}, 'one_pager')).toBe(true);
    expect(isLegacyColdAsset({
      prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
      cta_mode: DEFAULT_CTA_MODE,
    }, 'one_pager')).toBe(false);
  });

  it('keeps shared campaign defaults away from meeting-booking language', async () => {
    const campaign = await ensureDefaultCampaign();
    expect(campaign.messaging_angle).toMatch(/earn replies and send the short scorecard/i);
    expect(campaign.messaging_angle).not.toMatch(/book qualified meetings/i);
  });
});
