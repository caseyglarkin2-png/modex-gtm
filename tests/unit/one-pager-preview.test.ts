import { describe, expect, it } from 'vitest';
import { onePagerToHtml, type OnePagerData } from '@/components/ai/one-pager-preview';
import { buildOnePagerPrompt } from '@/lib/ai/prompts';

const sampleData: OnePagerData = {
  headline: 'WHEN DEMAND SPIKES, MARGIN LEAKS IN THE YARD',
  subheadline: 'Seasonal surges expose queue variance and service risk.',
  painPoints: ['Gate backlog compounds detention.'],
  solutionSteps: [
    { step: 1, title: 'Gate Check-in', description: 'Standard intake and ID validation.' },
  ],
  outcomes: ['Reduce dwell volatility and protect service windows.'],
  proofStats: [
    { value: '24', label: 'Facilities Live' },
    { value: '>200', label: 'Contracted Network' },
    { value: 'NEUTRAL', label: 'Headcount Impact' },
    { value: '48→24', label: 'Avg. Drop & Hook (min)' },
    { value: '$1M+', label: 'Per-site Profit Lift' },
  ],
  customerQuote: 'It is accurate that your software has enabled us.',
  bestFit: 'High-volume network with variable arrival patterns.',
  publicContext: 'Investor comments on service reliability targets.',
};

describe('one-pager output quality', () => {
  it('includes stronger commercial framing blocks in exported html', () => {
    const html = onePagerToHtml(sampleData, 'Acme Foods');
    expect(html).toContain('Commercial Impact');
    expect(html).toContain('Executive Visibility');
    expect(html).toContain('Suggested Next Step');
  });

  it('escapes unsafe content in exported html', () => {
    const html = onePagerToHtml(
      {
        ...sampleData,
        painPoints: ['<script>alert(1)</script>'],
      },
      'Acme <Foods>',
    );
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Acme &lt;Foods&gt;');
  });

  it('includes executive commercial guidance in one-pager prompt', () => {
    const prompt = buildOnePagerPrompt({
      accountName: 'Acme Foods',
      parentBrand: 'Acme Holdings',
      vertical: 'Food Manufacturing',
      whyNow: 'Volume spikes',
      primoAngle: 'Dock and yard handoff variance',
      bestIntroPath: 'Ops leader',
      likelyPainPoints: 'Queue bottlenecks',
      primoRelevance: 'Headcount-neutral throughput',
      suggestedAttendees: 'VP Ops',
      score: 90,
      tier: 'Tier 1',
      band: 'A',
    });

    expect(prompt).toContain('Operations buyer');
    expect(prompt).toContain('Executive buyer');
    expect(prompt).toContain('business consequence');
  });

  it('suppresses speculative industry-event public context in exported html', () => {
    const html = onePagerToHtml(
      {
        ...sampleData,
        publicContext: 'MODEX 2026 attendance signal indicates active buying cycle.',
      },
      'Acme Foods',
    );

    expect(html).not.toContain('Public source context:');
    expect(html).not.toContain('MODEX');
  });
});
