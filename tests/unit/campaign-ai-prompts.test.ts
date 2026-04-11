import { describe, expect, it } from 'vitest';
import { buildEmailPrompt, buildOutreachSequencePrompt } from '@/lib/ai/prompts';

describe('campaign-aware prompt guidance', () => {
  it('injects the campaign angle and suppresses MODEX for cold outbound prompts', () => {
    const prompt = buildEmailPrompt({
      accountName: 'Acme Foods',
      personaName: 'Jordan Lee',
      tone: 'casual',
      length: 'short',
      campaignName: 'Q3 Cold Expansion',
      campaignType: 'cold_outbound',
      campaignAngle: 'Lead with the dock bottleneck and ask for a reaction.',
    });

    expect(prompt).toContain('Campaign angle: Lead with the dock bottleneck and ask for a reaction.');
    expect(prompt).toContain('Do not mention MODEX');
  });

  it('keeps event guidance for trade show follow-up sequences', () => {
    const prompt = buildOutreachSequencePrompt({
      accountName: 'General Mills',
      personaName: 'Pat Taylor',
      tone: 'casual',
      length: 'medium',
      campaignName: 'MODEX 2026 Follow-Up',
      campaignType: 'trade_show',
    }, 'initial_email');

    expect(prompt).toContain('This is a trade show follow-up');
    expect(prompt).toContain('MODEX 2026');
  });
});
