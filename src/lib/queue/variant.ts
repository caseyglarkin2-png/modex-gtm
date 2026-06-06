/**
 * A/B variant application + deterministic assignment for the Draft Queue.
 *
 * Mirrors the variant helpers in `src/app/api/email/send-bulk-async/route.ts`
 * (`applyVariantBody` + `resolveVariantSubject`) but for plain-text drafts, and
 * reuses the existing deterministic allocator (`allocateRecipientsDeterministic`)
 * so queue assignment buckets identically to the bulk-send path.
 */
import { allocateRecipientsDeterministic } from '@/lib/experiments/allocate';

export interface QueueVariant {
  variantKey: string;
  subject?: string;
  opening?: string;
  cta?: string;
  isControl?: boolean;
}

/**
 * Apply a variant's subject/opening/cta to a base draft. Mirrors
 * send-bulk-async's applyVariantBody + resolveVariantSubject. Control (no
 * overrides) returns the base unchanged.
 */
export function applyVariant(
  base: { subject: string; body: string; accountName: string | null },
  variant: QueueVariant | null,
): { subject: string; body: string } {
  if (!variant || (!variant.subject && !variant.opening && !variant.cta)) {
    return { subject: base.subject, body: base.body };
  }

  const subject = variant.subject
    ? variant.subject.replaceAll('{{account}}', base.accountName ?? '')
    : base.subject;

  const opening = variant.opening?.trim();
  const cta = variant.cta?.trim();
  let body = base.body;
  if (opening) body = `${opening}\n\n${body}`;
  if (cta) body = `${body}\n\n${cta}`;

  return { subject, body };
}

/**
 * Deterministically assign one variant per email using the existing allocator.
 * Returns a Map<emailLowercased, variantKey>.
 */
export function assignVariants(
  emails: string[],
  variants: Array<{ variantKey: string; split: number }>,
  experimentId: string,
): Map<string, string> {
  const assignments = allocateRecipientsDeterministic(
    emails,
    variants.map((v) => ({ variantId: v.variantKey, variantKey: v.variantKey, split: v.split })),
    experimentId,
  );

  const map = new Map<string, string>();
  for (const assignment of assignments) {
    map.set(assignment.recipientEmail, assignment.variantKey);
  }
  return map;
}
