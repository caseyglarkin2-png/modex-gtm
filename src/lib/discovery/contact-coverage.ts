/**
 * Per-row contact coverage for the discovery worklist. Counts the distinct
 * reachable people we already hold for each prospect — Persona research rows,
 * clawd-sourced draft-queue recipients, plus saved drawer finds
 * (DiscoveryContact: manual add + AI research) — unioned by lowercased email
 * so the same person never counts twice across sources. A record without an
 * email still counts as 1: a known person without an address is a contact
 * lead, not a gap.
 *
 * Attribution reuses the existing matchers (no new fuzzy logic): exact
 * normalized-name match first (covers every DraftQueueItem row — clawd stages
 * items under the worklist row's name verbatim), then the conservative
 * brand-key match from assets.ts for Persona account names (e.g. a Persona
 * under "PepsiCo" attaches to a "PepsiCo Beverages North America" row).
 *
 * Fail-soft by design: any Prisma error returns an empty Map so /discovery
 * renders without the database.
 */
import { prisma } from '@/lib/prisma';
import { buildBrandIndex, resolveMicrositeSlug } from './assets';
import { pipelineKey } from './pipeline';
import type { CuratedRow } from './types';

export interface ContactSourceRecord {
  /** account_name as written in the source table. */
  accountName: string;
  /** The contact's email (any case), or null when no address is known yet. */
  email: string | null;
  /** Stable identity for email-less records so each known person counts once. */
  fallbackId?: string;
}

/**
 * Pure attribution: contact records → distinct-contact counts per worklist row,
 * keyed by placeId (the row key the rest of the worklist uses). Rows with no
 * attributed contacts are absent from the Map — readers treat missing as 0.
 */
export function computeContactCoverage(
  rows: CuratedRow[],
  records: ContactSourceRecord[],
): Map<string, number> {
  // Aggregate contact tokens per normalized account name. A token is the
  // lowercased email (deduping the same person across Persona and the draft
  // queue) or a fallback identity for personas without an address.
  const tokensByAccount = new Map<string, Set<string>>();
  const namesByAccount = new Map<string, string>();
  for (const rec of records) {
    const key = pipelineKey(rec.accountName);
    if (!key) continue;
    const email = rec.email?.trim().toLowerCase();
    const token = email || (rec.fallbackId ? `person:${rec.fallbackId}` : null);
    if (!token) continue;
    let tokens = tokensByAccount.get(key);
    if (!tokens) {
      tokens = new Set();
      tokensByAccount.set(key, tokens);
      namesByAccount.set(key, rec.accountName);
    }
    tokens.add(token);
  }
  if (tokensByAccount.size === 0) return new Map();

  // Brand index over the source account names (the small set), mirroring how
  // enrich.ts indexes deals and resolves each row name against it. The
  // normalized account key doubles as the pseudo-slug.
  const index = buildBrandIndex(
    [...namesByAccount].map(([key, accountName]) => ({ slug: key, accountName })),
  );
  const valid = new Set(tokensByAccount.keys());

  const coverage = new Map<string, number>();
  for (const row of rows) {
    const matched = new Set<string>();
    const exact = pipelineKey(row.name);
    if (tokensByAccount.has(exact)) matched.add(exact);
    const brand = resolveMicrositeSlug(row.name, undefined, index, valid);
    if (brand && tokensByAccount.has(brand)) matched.add(brand);
    if (matched.size === 0) continue;
    const union = new Set<string>();
    for (const key of matched) {
      for (const token of tokensByAccount.get(key)!) union.add(token);
    }
    coverage.set(row.placeId, union.size);
  }
  return coverage;
}

/**
 * Loads contact coverage for the worklist: one bounded select/groupBy per
 * source table, attribution in memory. Empty Map on any database error — the
 * page must render without the DB (e.g. local dev without DATABASE_URL).
 */
export async function loadContactCoverage(rows: CuratedRow[]): Promise<Map<string, number>> {
  if (rows.length === 0) return new Map();
  try {
    const [personas, drafts, saved] = await Promise.all([
      prisma.persona.findMany({
        select: { persona_id: true, account_name: true, email: true },
      }),
      prisma.draftQueueItem.groupBy({
        by: ['account_name', 'to_email'],
        where: { status: { not: 'skipped' } },
      }),
      prisma.discoveryContact.findMany({
        select: { id: true, prospect_name: true, email: true },
      }),
    ]);
    const records: ContactSourceRecord[] = [
      ...personas.map((p) => ({
        accountName: p.account_name,
        email: p.email,
        fallbackId: p.persona_id,
      })),
      ...drafts.map((d) => ({ accountName: d.account_name, email: d.to_email })),
      // Drawer finds (manual add + AI research): the email dedups against the
      // other sources; an email-less find still counts as one known person.
      ...saved.map((s) => ({
        accountName: s.prospect_name,
        email: s.email,
        fallbackId: `saved:${s.id}`,
      })),
    ];
    return computeContactCoverage(rows, records);
  } catch (err) {
    console.warn('[discovery] contact coverage unavailable, rendering without it:', err);
    return new Map();
  }
}
