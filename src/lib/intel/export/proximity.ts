/**
 * Stream 6: proximity — the seam that fuses modex's corridor + yard-audit
 * intelligence into clawd's homescreen rank (Contract:
 * docs/superpowers/specs/2026-06-14-modex-proximity-export-contract.md).
 *
 * Unlike the five engagement streams (incremental, Prisma-backed, keyset on
 * occurred_at), proximity is STANDING STATE: a full snapshot of the audited
 * accounts, precomputed at author time into proximity-data.json and statically
 * imported (runtime fs reads of output/** are not reliably bundled on Vercel —
 * see src/lib/discovery/data.ts). `since` is ignored; the brain pulls the full
 * set each run and dedups. A recompute bumps `generatedAt`, so the
 * idempotency_key (`<domain|slug>:<generatedAt>`) writes a new ledger row.
 *
 * Regenerate with: npx tsx scripts/intel/gen-proximity-export.ts
 */
import proximityData from './proximity-data.json';
import { encodeCursor, decodeCursor } from './cursor';
import type { IntelRecord } from './records';

interface YardAudit {
  facilities: number | null;
  truck_gated_pct: number | null;
  dock_doors: number | null;
  trailer_cap: number | null;
  top_archetype: string | null;
  recommended_entry: string | null;
}
interface ProximityAccount {
  slug: string;
  account_name: string;
  account_domain: string | null;
  composite_score: number | null;
  proximity_score: number;
  nearest_distance_mi: number;
  corridor_density: number | null;
  fit_score: number | null;
  yard_audit: YardAudit | null;
  dossier_url: string | null;
}
interface ProximitySnapshot {
  generatedAt: string;
  accounts: ProximityAccount[];
}

const SNAPSHOT = proximityData as ProximitySnapshot;

export interface ProximityEnvelope {
  stream: string;
  items: IntelRecord[];
  nextCursor: string | null;
  watermark: string;
}

/** Build the per-account proximity record. Pure over one snapshot account. */
export function buildProximityRecord(a: ProximityAccount, generatedAt: string): IntelRecord {
  const key = a.account_domain ?? a.slug;
  const rec: IntelRecord = {
    idempotency_key: `${key}:${generatedAt}`,
    occurred_at: generatedAt,
  };
  if (a.account_name) rec.account_name = a.account_name;
  if (a.account_domain) rec.account_domain = a.account_domain;
  // composite_score is the COMPLETE discovery score (proximity+fit+density) and
  // the number clawd fuses; null when the account has no scored rows yet, where
  // the brain falls back to proximity_score.
  rec.composite_score = a.composite_score;
  rec.proximity_score = a.proximity_score;
  rec.nearest_distance_mi = a.nearest_distance_mi;
  rec.corridor_density = a.corridor_density;
  rec.fit_score = a.fit_score;
  rec.yard_audit = a.yard_audit;
  rec.dossier_url = a.dossier_url;
  rec.updated_at = generatedAt;
  return rec;
}

/**
 * Full-snapshot export, keyset-paginated by slug (all rows share generatedAt as
 * the occurred_at anchor). `since` is intentionally ignored. Fail-soft: any
 * malformed cursor pages from the start.
 */
export function exportProximity(cursor: string | null | undefined, limit: number): ProximityEnvelope {
  const generatedAt = SNAPSHOT.generatedAt;
  const sorted = [...SNAPSHOT.accounts].sort((a, b) =>
    a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0,
  );
  const c = decodeCursor(cursor);
  const afterSlug = c ? c.id : null;
  const remaining = afterSlug ? sorted.filter((a) => a.slug > afterSlug) : sorted;
  const page = remaining.slice(0, limit);
  const items = page.map((a) => buildProximityRecord(a, generatedAt));
  const pageWasFull = page.length === limit && page.length > 0;
  const last = page[page.length - 1];
  const nextCursor = pageWasFull && last ? encodeCursor(generatedAt, last.slug) : null;
  return { stream: 'proximity', items, nextCursor, watermark: generatedAt };
}
