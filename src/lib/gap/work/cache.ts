/**
 * A short process-memory cache for the Work read (UX-14, perceived speed). The cockpit's reads take about 25 s on a
 * cold load; the seller comes back to Work every few minutes. The read is remembered per instance for a short while
 * and the page says when it was read, with Refresh (`?fresh=1`) to bypass. Nothing is written anywhere; a cold start
 * is empty. The canonical pursuit summaries are applied at render, never cached with the read.
 */
export const WORK_CACHE_TTL_MS = 2 * 60_000;

interface Entry<T> {
  value: T;
  at: number;
  pending: Promise<T> | null;
}
const entries = new Map<string, Entry<unknown>>();

export interface CachedRead<T> {
  value: T;
  /** When the read happened (ISO). */
  at: string;
  /** Served from memory rather than read now. */
  fromCache: boolean;
}

/** Read through the cache; a concurrent read shares one in-flight promise; `fresh` forces a new read. */
export async function cachedRead<T>(key: string, read: () => Promise<T>, opts: { ttlMs?: number; fresh?: boolean; now?: Date } = {}): Promise<CachedRead<T>> {
  const ttl = opts.ttlMs ?? WORK_CACHE_TTL_MS;
  const now = opts.now ?? new Date();
  const hit = entries.get(key) as Entry<T> | undefined;
  if (hit && !opts.fresh && now.getTime() - hit.at <= ttl) return { value: hit.value, at: new Date(hit.at).toISOString(), fromCache: true };
  if (hit?.pending && !opts.fresh) {
    const value = await hit.pending;
    return { value, at: new Date(hit.at).toISOString(), fromCache: true };
  }
  const pending = read();
  entries.set(key, { value: hit?.value as T, at: hit?.at ?? 0, pending } as Entry<unknown>);
  try {
    const value = await pending;
    const at = Date.now();
    entries.set(key, { value, at, pending: null });
    return { value, at: new Date(at).toISOString(), fromCache: false };
  } catch (e) {
    entries.delete(key);
    throw e;
  }
}

/** Test seam. */
export function clearCachedReads(): void {
  entries.clear();
}

export const agoText = (iso: string, now: Date = new Date()): string => {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  return s < 5 ? 'just now' : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};
