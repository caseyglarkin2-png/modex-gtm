/**
 * Keyset (seek) pagination cursor for the intel export streams.
 *
 * We page on the composite key `(occurred_at, id)` — NOT OFFSET — so the feed is
 * stable under concurrent inserts. The cursor is opaque to clawd: it is the
 * base64 of `JSON.stringify([occurredAtISO, id])` of the last record returned.
 * On the next pull modex decodes it and applies the strict tuple comparison
 * `(occurred_at, id) > (cursor.occurred_at, cursor.id)`.
 *
 * `id` is a String here to cover both the String-keyed tables (inbound_messages,
 * microsite_engagements, operator_outcomes) and the Int-keyed ones (email_logs,
 * mobile_captures) uniformly; numeric ids are compared as their canonical string.
 */

export interface Cursor {
  occurredAt: string; // ISO8601
  id: string;
}

export function encodeCursor(occurredAt: Date | string, id: string | number): string {
  const iso = occurredAt instanceof Date ? occurredAt.toISOString() : new Date(occurredAt).toISOString();
  const payload = JSON.stringify([iso, String(id)]);
  return Buffer.from(payload, 'utf8').toString('base64');
}

/** Decode an opaque cursor; returns null on any malformed input (fail-soft -> page from start). */
export function decodeCursor(cursor: string | null | undefined): Cursor | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [iso, id] = parsed;
    if (typeof iso !== 'string' || (typeof id !== 'string' && typeof id !== 'number')) return null;
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) return null;
    return { occurredAt: new Date(ms).toISOString(), id: String(id) };
  } catch {
    return null;
  }
}
