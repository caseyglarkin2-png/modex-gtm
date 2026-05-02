export type MergeSource = 'hubspot' | 'apollo' | 'manual';
export type MergeDecision = 'keep_existing' | 'accept_candidate' | 'reject_candidate';

export type MergeInput = {
  existingValue: string | null;
  candidateValue: string | null;
  existingSource: MergeSource | null;
  candidateSource: MergeSource;
  existingConfidence: number | null;
  candidateConfidence: number;
  minConfidenceForOverwrite: number;
  existingUpdatedAt: Date | null;
  candidateUpdatedAt: Date;
};

export function decideMerge(input: MergeInput): MergeDecision {
  if (!input.candidateValue || !input.candidateValue.trim()) return 'reject_candidate';
  if (!input.existingValue || !input.existingValue.trim()) return 'accept_candidate';

  const existingConfidence = input.existingConfidence ?? 0;
  const candidateConfidence = input.candidateConfidence;
  if (candidateConfidence < input.minConfidenceForOverwrite) return 'keep_existing';

  if (input.existingSource === 'manual') return 'keep_existing';

  if (candidateConfidence > existingConfidence) return 'accept_candidate';
  if (candidateConfidence < existingConfidence) return 'keep_existing';

  if (!input.existingUpdatedAt) return 'accept_candidate';
  if (input.candidateUpdatedAt > input.existingUpdatedAt) return 'accept_candidate';
  return 'keep_existing';
}
