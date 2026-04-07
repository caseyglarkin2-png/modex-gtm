import type { MicrositeTrackingSnapshot } from './tracking';

export interface MicrositeEngagementRecordLike {
  sections_viewed?: string[] | null;
  cta_ids?: string[] | null;
  variant_history?: string[] | null;
  last_cta_id?: string | null;
  variant_slug?: string | null;
  scroll_depth_pct?: number | null;
  duration_seconds?: number | null;
  metadata?: unknown;
}

function toStringMap(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string';
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function mergeUniqueValues(existing: string[] = [], incoming: string[] = []): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of [...existing, ...incoming]) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push(value);
  }

  return merged;
}

export function mergeStringMaps(
  existing?: unknown,
  incoming?: Record<string, string> | null,
): Record<string, string> | undefined {
  const merged = { ...(toStringMap(existing) ?? {}), ...(incoming ?? {}) };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function buildMicrositeEngagementUpdate(
  existing: MicrositeEngagementRecordLike | null,
  snapshot: MicrositeTrackingSnapshot,
) {
  return {
    sections_viewed: mergeUniqueValues(existing?.sections_viewed ?? [], snapshot.sectionsViewed),
    cta_ids: mergeUniqueValues(existing?.cta_ids ?? [], snapshot.ctaIds),
    variant_history: mergeUniqueValues(existing?.variant_history ?? [], snapshot.variantHistory),
    last_cta_id: snapshot.lastCtaId ?? existing?.last_cta_id ?? undefined,
    variant_slug: snapshot.variantSlug ?? existing?.variant_slug ?? undefined,
    scroll_depth_pct: Math.max(existing?.scroll_depth_pct ?? 0, snapshot.scrollDepthPct),
    duration_seconds: Math.max(existing?.duration_seconds ?? 0, snapshot.durationSeconds),
    metadata: mergeStringMaps(existing?.metadata, snapshot.metadata),
  };
}

export function shouldLogMicrositeCtaActivity(
  existing: MicrositeEngagementRecordLike | null,
  snapshot: MicrositeTrackingSnapshot,
) {
  if (!snapshot.lastCtaId) return false;
  return !(existing?.cta_ids ?? []).includes(snapshot.lastCtaId);
}

export function buildMicrositeCtaActivity(snapshot: MicrositeTrackingSnapshot, now = new Date()) {
  const viewerLabel = snapshot.personName ? `${snapshot.personName} microsite` : 'overview microsite';

  return {
    activity_date: now,
    account_name: snapshot.accountName,
    persona: snapshot.personName,
    activity_type: 'Microsite CTA Click',
    owner: 'system',
    outcome: 'CTA clicked on microsite',
    next_step: 'Follow up within 24 hours',
    notes: `${viewerLabel} clicked ${snapshot.lastCtaId} on ${snapshot.path}. Scroll depth ${snapshot.scrollDepthPct}%. Time on page ${snapshot.durationSeconds}s.`,
  };
}