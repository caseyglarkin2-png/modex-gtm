/**
 * Microsite resolution helpers (post-M7).
 *
 * The /for/[account] route renders memo content via `resolveMemoSections`
 * (in memo-compat.ts) and reader-aware framing via `resolveReader`
 * (in reader-context.ts). Both paths bypass the legacy section-ordering
 * engine that lived here. This file is intentionally minimal — it now
 * only exports the variant-route lookup that the studio tab still needs.
 */

import type { AccountMicrositeData } from './schema';

export function getVariantRoutes(data: AccountMicrositeData): {
  slug: string;
  label: string;
  personName: string;
  title: string;
}[] {
  return data.personVariants.map((v) => ({
    slug: v.variantSlug,
    label: v.label,
    personName: v.person.name,
    title: v.person.title,
  }));
}
