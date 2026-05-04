import { describe, expect, it } from 'vitest';
import {
  evaluateCampaignGenerationContract,
  isGenerationContractPolicyEnabled,
  summarizeContractCompleteness,
} from '@/lib/revops/campaign-generation-contract';

describe('campaign generation contract', () => {
  it('evaluates completeness and score', () => {
    const result = evaluateCampaignGenerationContract({
      objective: 'Increase meetings in tier-1 logistics accounts.',
      personaHypothesis: 'VP Operations is blocked by yard variance.',
      offer: 'Run a 20-minute benchmark and workflow map.',
      proof: '48 to 24 minute drop-and-hook reference.',
      cta: 'Share current gate/dock cadence for benchmark.',
      metric: 'Meetings booked and proposal conversion.',
    });
    expect(result.isComplete).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(summarizeContractCompleteness(result.score)).toBe('high');
  });

  it('detects policy flag from campaign key_dates', () => {
    expect(isGenerationContractPolicyEnabled({ require_generation_contract: true })).toBe(true);
    expect(isGenerationContractPolicyEnabled({ require_generation_contract: false })).toBe(false);
    expect(isGenerationContractPolicyEnabled(null)).toBe(false);
  });
});
