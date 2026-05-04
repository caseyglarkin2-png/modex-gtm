import { describe, expect, it } from 'vitest';
import { computeChecklistCompleteness, getChecklistTemplate } from '@/lib/revops/content-qa-checklist';

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
});
