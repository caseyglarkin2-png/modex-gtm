export type CampaignGenerationContractInput = {
  objective: string;
  personaHypothesis: string;
  offer: string;
  proof: string;
  cta: string;
  metric: string;
};

export type CampaignGenerationContractEvaluation = {
  score: number;
  missing: Array<keyof CampaignGenerationContractInput>;
  isComplete: boolean;
};

export const GENERATION_CONTRACT_FIELDS: Array<keyof CampaignGenerationContractInput> = [
  'objective',
  'personaHypothesis',
  'offer',
  'proof',
  'cta',
  'metric',
];

export function evaluateCampaignGenerationContract(input: CampaignGenerationContractInput): CampaignGenerationContractEvaluation {
  const missing = GENERATION_CONTRACT_FIELDS.filter((field) => input[field].trim().length < 4);
  const completeness = 1 - (missing.length / GENERATION_CONTRACT_FIELDS.length);
  const density = GENERATION_CONTRACT_FIELDS.reduce((sum, field) => sum + Math.min(1, input[field].trim().length / 120), 0) / GENERATION_CONTRACT_FIELDS.length;
  const score = Math.round((completeness * 0.7 + density * 0.3) * 100);
  return {
    score,
    missing,
    isComplete: missing.length === 0,
  };
}

export function summarizeContractCompleteness(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export function isGenerationContractPolicyEnabled(campaignKeyDates: unknown): boolean {
  if (!campaignKeyDates || typeof campaignKeyDates !== 'object' || Array.isArray(campaignKeyDates)) return false;
  const raw = (campaignKeyDates as Record<string, unknown>).require_generation_contract;
  return raw === true;
}
