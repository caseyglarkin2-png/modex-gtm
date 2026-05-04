import crypto from 'node:crypto';

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

function bucket(seed: string): number {
  const hex = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8);
  const int = Number.parseInt(hex, 16);
  return (int % 10000) / 10000;
}

export function allocateRecipientsDeterministic(
  recipientEmails: string[],
  variants: ExperimentVariantInput[],
  seed: string,
): ExperimentAssignment[] {
  const normalized = normalizeVariantSplits(variants);
  const cutoffs: Array<{ variantId: string; variantKey: string; threshold: number }> = [];
  let running = 0;
  normalized.forEach((variant, idx) => {
    running += variant.split;
    cutoffs.push({
      variantId: variant.variantId,
      variantKey: variant.variantKey,
      threshold: idx === normalized.length - 1 ? 1 : running,
    });
  });

  return [...recipientEmails].sort().map((email) => {
    const b = bucket(`${seed}:${email.toLowerCase()}`);
    const selected = cutoffs.find((cutoff) => b <= cutoff.threshold) ?? cutoffs[cutoffs.length - 1];
    return {
      recipientEmail: email.toLowerCase(),
      variantId: selected.variantId,
      variantKey: selected.variantKey,
    };
  });
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
