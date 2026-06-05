/**
 * Server-only deterministic recipient → variant allocation.
 *
 * Split out from `./split` because it uses `node:crypto`, and `split.ts` is also
 * imported by a client component (the bulk-preview dialog, which only needs the
 * crypto-free `previewVariantAllocation`). A module-level `node:crypto` import in
 * a client-reachable file fails the webpack client build with
 * `UnhandledSchemeError: node:crypto`. Keeping the crypto here — imported only by
 * the server send route — keeps the client bundle clean while preserving the
 * exact SHA-256 bucketing (no experiment re-assignment).
 */
import crypto from 'node:crypto';
import {
  normalizeVariantSplits,
  type ExperimentVariantInput,
  type ExperimentAssignment,
} from './split';

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
