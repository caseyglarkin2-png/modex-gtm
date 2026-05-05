import { describe, expect, it } from 'vitest';
import { buildCallScriptPrompt, buildEmailPrompt, buildMeetingPrepPrompt, buildOutreachSequencePrompt } from '@/lib/ai/prompts';

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

  it('injects facility facts and research tags when present', () => {
    const prompt = buildEmailPrompt({
      accountName: 'AB InBev',
      tone: 'casual',
      length: 'short',
      facilityCountLabel: '100',
      facilityScope: 'U.S. facilities footprint',
      researchTags: ['Vertical: Food & Beverage', 'Signal: Past attendee list'],
    });

    expect(prompt).toContain('Facility footprint: 100 (U.S. facilities footprint)');
    expect(prompt).toContain('Research tags: Vertical: Food & Beverage • Signal: Past attendee list');
  });

  it('keeps cold sequence and call-script prompts away from meeting asks', () => {
    const sequencePrompt = buildOutreachSequencePrompt({
      accountName: 'Americold',
      personaName: 'Kaushik Sarda',
      tone: 'casual',
      length: 'medium',
    }, 'initial_email');
    const callScriptPrompt = buildCallScriptPrompt({
      accountName: 'Americold',
      personaName: 'Kaushik Sarda',
      tone: 'casual',
      length: 'medium',
    });

    expect(sequencePrompt).toContain('No calendar or time ask');
    expect(callScriptPrompt).toContain('Do not ask for a meeting or calendar time on a cold call script');
    expect(callScriptPrompt).not.toContain('30 minutes at MODEX');
  });

  it('preserves meeting asks only for explicit meeting-prep assets', () => {
    const prompt = buildMeetingPrepPrompt({
      accountName: 'Americold',
      personaName: 'Kaushik Sarda',
      tone: 'casual',
      length: 'medium',
    });

    expect(prompt).toContain('Meeting:');
    expect(prompt).toContain('Ideal next step');
  });
});
