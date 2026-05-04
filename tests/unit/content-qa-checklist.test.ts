import { describe, expect, it } from 'vitest';
import { computeChecklistCompleteness, getChecklistTemplate, resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';

describe('content qa checklist templates', () => {
  it('returns campaign-type template and computes completeness', () => {
    const template = getChecklistTemplate('trade_show');
    const completeness = computeChecklistCompleteness(template, [
      'clear_value_prop',
      'account_specific_proof',
      'cta_specific',
      'compliance_checked',
      'deliverability_checked',
    ]);
    expect(template.campaignType).toBe('trade_show');
    expect(completeness.complete).toBe(true);
    expect(completeness.requiredComplete).toBe(completeness.requiredTotal);
  });

  it('flags missing required items', () => {
    const template = getChecklistTemplate('default');
    const completeness = computeChecklistCompleteness(template, ['clear_value_prop']);
    expect(completeness.complete).toBe(false);
    expect(completeness.missingRequired.length).toBeGreaterThan(0);
  });

  it('automatically resolves required checklist items from content quality', () => {
    const content = `
      John Deere overview summary implementation outcome next step timeline.
      John Deere is operating across complex industrial campuses and dealer-facing service expectations.
      Your team needs tighter yard visibility, better trailer prioritization, clearer dock execution, and stronger operating control.
      This overview explains how YardFlow standardizes gate-to-dock moves, improves team coordination, and gives leadership a usable performance baseline.
      We can map the current process, identify dwell loss, and document where scheduling and dispatch handoffs are creating delay.
      The outcome is a cleaner operating rhythm, clearer accountability, and faster issue resolution across the network.
      If this is relevant, reply this week and we can book a 15-minute working session next week to review the current flow and confirm the right benchmark scope.
    `.trim();

    const checklist = resolveContentQaChecklist({
      campaignType: 'trade_show',
      content,
      accountName: 'John Deere',
    });

    expect(checklist.complete).toBe(true);
    expect(checklist.requiredComplete).toBe(checklist.requiredTotal);
    expect(checklist.items.every((item) => item.completed)).toBe(true);
  });
});
