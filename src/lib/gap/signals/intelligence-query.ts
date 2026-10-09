/**
 * The browse query (IW05): the same parse for GET /api/gap/intelligence and the /gap/intelligence page, so a filter
 * link and the route agree on every value. Client-safe (zod only).
 */
import { z } from 'zod';
import type { BrowseFilters } from './intelligence-browse';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const flag = z.enum(['1', 'true', '0', 'false']).transform((v) => v === '1' || v === 'true');

export const BrowseQuery = z
  .object({
    cursor: z.string().min(1).max(400).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    producer: z.string().min(1).max(80).optional(),
    origin: z.string().min(1).max(40).optional(),
    kind: z.enum(['signal', 'trigger']).optional(),
    account: z.string().min(1).max(200).optional(),
    decided: z.enum(['undecided', 'decided', 'all']).optional(),
    archive: flag.optional(),
    since: z.string().regex(DATE_ONLY).optional(),
  })
  .strict();

export type BrowseQueryInput = z.infer<typeof BrowseQuery>;

export interface ParsedBrowseQuery {
  limit: number | undefined;
  cursor: string | null;
  filters: BrowseFilters;
}

/** Page search params (string | string[] | undefined) or URLSearchParams entries: empty values are absent. */
export function parseBrowseQuery(raw: Record<string, string | string[] | undefined> | URLSearchParams): { ok: true; query: ParsedBrowseQuery } | { ok: false; field: string } {
  const entries: Record<string, string> = {};
  const pairs = raw instanceof URLSearchParams ? [...raw.entries()] : Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v] as const);
  for (const [k, v] of pairs) if (typeof v === 'string' && v.trim()) entries[k] = v.trim();
  const parsed = BrowseQuery.safeParse(entries);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const unknownKey = issue && issue.code === 'unrecognized_keys' ? (issue as { keys?: string[] }).keys?.[0] : undefined;
    return { ok: false, field: unknownKey || issue?.path.join('.') || 'query' };
  }
  const q = parsed.data;
  return {
    ok: true,
    query: {
      limit: q.limit,
      cursor: q.cursor ?? null,
      filters: {
        ...(q.producer ? { producer: q.producer } : {}),
        ...(q.origin ? { origin: q.origin } : {}),
        ...(q.kind ? { kind: q.kind } : {}),
        ...(q.account ? { account: q.account } : {}),
        ...(q.decided ? { decided: q.decided } : {}),
        ...(q.archive !== undefined ? { archive: q.archive } : {}),
        ...(q.since ? { since: q.since } : {}),
      },
    },
  };
}

/** The page's own link for a filter set (no cursor unless given): `/gap/intelligence/?producer=...`. */
export function browseHref(filters: BrowseFilters, cursor?: string | null): string {
  const q = new URLSearchParams();
  if (filters.kind && filters.kind !== 'signal') q.set('kind', filters.kind);
  if (filters.producer) q.set('producer', filters.producer);
  if (filters.origin) q.set('origin', filters.origin);
  if (filters.account) q.set('account', filters.account);
  if (filters.decided && filters.decided !== 'all') q.set('decided', filters.decided);
  if (filters.archive) q.set('archive', '1');
  if (filters.since) q.set('since', filters.since);
  if (cursor) q.set('cursor', cursor);
  const s = q.toString();
  return `/gap/intelligence/${s ? `?${s}` : ''}`;
}
