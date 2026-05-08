/**
 * Sprint M5 — reader-aware framing.
 *
 * The /for/[account] route accepts an optional ?p=<variant-slug> query
 * param. When it matches a PersonVariant on the account, we surface a
 * "prepared for {Person}" eyebrow on the memo header and thread the
 * person slug through the ROI deep-link. The body of the memo is left
 * unchanged for now — KPI vocab swaps inside Observation / Comparable
 * are M5 stretch and aren't necessary for the funnel.
 *
 * The matching is forgiving: ?p=dan-poland resolves regardless of the
 * person's variantSlug case and ignores leading/trailing whitespace.
 * Unknown person slugs do NOT 404 — they degrade to the universal
 * memo, which is the right anti-selling default (the brief is useful
 * even without the personal eyebrow).
 */

import type { AccountMicrositeData, PersonVariant } from './schema';

export interface ResolvedReader {
  variant: PersonVariant;
  /** Stable normalized slug — what we'll forward to buildROIDeepLink. */
  personSlug: string;
  /** "Prepared for Dan Poland · VP Supply Chain" — ready to render. */
  eyebrow: string;
}

export function resolveReader(
  data: AccountMicrositeData,
  rawParam: string | string[] | undefined,
): ResolvedReader | null {
  const slug = normalizeSlug(rawParam);
  if (!slug) return null;
  const variant = data.personVariants.find(
    (v) => v.variantSlug.toLowerCase() === slug,
  );
  if (!variant) return null;
  return {
    variant,
    personSlug: variant.variantSlug,
    eyebrow: buildEyebrow(variant),
  };
}

function normalizeSlug(raw: string | string[] | undefined): string | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function buildEyebrow(variant: PersonVariant): string {
  const { person } = variant;
  const title = person.title;
  const name = person.name ?? `${person.firstName} ${person.lastName}`.trim();
  if (title) return `Prepared for ${name} · ${title}`;
  return `Prepared for ${name}`;
}
