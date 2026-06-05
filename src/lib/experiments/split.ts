// NOTE: this module is imported by a client component (bulk-preview-dialog), so
// it must stay free of Node built-ins. The crypto-based deterministic allocation
// lives in ./allocate (server-only). See that file for why.

export type ExperimentMetric = 'reply_rate' | 'meeting_rate' | 'positive_reply_rate';

export type ExperimentVariantInput = {
  variantId: string;
  variantKey: string;
  split: number;
};

export type ExperimentAssignment = {
  recipientEmail: string;
  variantId: string;
  variantKey: string;
};

export function normalizeVariantSplits(variants: ExperimentVariantInput[]): ExperimentVariantInput[] {
  const total = variants.reduce((sum, variant) => sum + variant.split, 0);
  if (total <= 0) {
    const equal = variants.length > 0 ? 1 / variants.length : 0;
    return variants.map((variant) => ({ ...variant, split: equal }));
  }
  return variants.map((variant) => ({ ...variant, split: variant.split / total }));
}

export function previewVariantAllocation(
  recipientCount: number,
  variants: ExperimentVariantInput[],
): Array<{ variantId: string; variantKey: string; expectedCount: number }> {
  const normalized = normalizeVariantSplits(variants);
  let remainder = recipientCount;
  return normalized.map((variant, idx) => {
    const raw = Math.floor(recipientCount * variant.split);
    const expectedCount = idx === normalized.length - 1 ? remainder : raw;
    remainder -= expectedCount;
    return {
      variantId: variant.variantId,
      variantKey: variant.variantKey,
      expectedCount,
    };
  });
}
