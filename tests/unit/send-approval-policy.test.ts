import { describe, expect, it } from 'vitest';
import { evaluateApprovalPolicy } from '@/lib/revops/send-approval-policy';

describe('send approval policy engine', () => {
  it('does not require approval for low-risk sends', () => {
    const result = evaluateApprovalPolicy({
      recipientCount: 5,
      qualityScore: 90,
      domains: ['acme.com'],
      knownDomains: ['acme.com'],
      recentBounceRate: 0.01,
    });
    expect(result.required).toBe(false);
    expect(result.triggers).toEqual([]);
  });

  it('requires approval with multi-trigger risk', () => {
    const result = evaluateApprovalPolicy({
      recipientCount: 80,
      qualityScore: 40,
      domains: ['newco.com'],
      knownDomains: ['acme.com'],
      recentBounceRate: 0.12,
    });
    expect(result.required).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.triggers).toContain('volume-threshold');
    expect(result.triggers).toContain('low-score');
  });
});
