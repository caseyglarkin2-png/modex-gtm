import { decideMerge, type MergeDecision, type MergeSource } from '@/lib/enrichment/merge-policy';

export type ExistingFieldState = {
  value: string | null;
  source: MergeSource | null;
  confidence: number | null;
  updatedAt: Date | null;
};

export type CandidateFieldState = {
  value: string | null;
  source: MergeSource;
  confidence: number;
  updatedAt: Date;
};

export type WritebackPreviewItem = {
  field: string;
  decision: MergeDecision;
  existingValue: string | null;
  candidateValue: string | null;
  existingSource: MergeSource | null;
  candidateSource: MergeSource;
};

export function buildWritebackPreview(args: {
  existing: Record<string, ExistingFieldState>;
  candidate: Record<string, CandidateFieldState>;
  minConfidenceForOverwrite: number;
}): WritebackPreviewItem[] {
  return Object.entries(args.candidate).map(([field, candidateField]) => {
    const existingField = args.existing[field] ?? {
      value: null,
      source: null,
      confidence: null,
      updatedAt: null,
    };

    const decision = decideMerge({
      existingValue: existingField.value,
      candidateValue: candidateField.value,
      existingSource: existingField.source,
      candidateSource: candidateField.source,
      existingConfidence: existingField.confidence,
      candidateConfidence: candidateField.confidence,
      minConfidenceForOverwrite: args.minConfidenceForOverwrite,
      existingUpdatedAt: existingField.updatedAt,
      candidateUpdatedAt: candidateField.updatedAt,
    });

    return {
      field,
      decision,
      existingValue: existingField.value,
      candidateValue: candidateField.value,
      existingSource: existingField.source,
      candidateSource: candidateField.source,
    };
  });
}
