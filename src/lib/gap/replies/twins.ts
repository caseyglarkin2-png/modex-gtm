/**
 * ONE MESSAGE, TWO IMPORTS (GAP OS execution recovery, R42, 2026-10-06). Pure.
 *
 * The same Gmail message id is stored once (gap-mailbox.ts finds it, or its RFC Message-ID twin) and the same HubSpot
 * engagement once (`hs:<id>`, an upsert). But the GAP mailbox and HubSpot's connected inbox can each import the SAME
 * reply: one Gmail row and one `hs:` row. Without this, that reply is two pieces of work, and recording one leaves the
 * other waiting. Twins are the same sender, the same subject (reply prefixes aside), within ten minutes, with the same
 * opening words (or one side has none). The Gmail copy represents the pair; a disposition on either copy settles both.
 */

export const TWIN_WINDOW_MS = 10 * 60_000;

export interface TwinCandidate {
  id: string;
  from: string;
  subject: string | null;
  snippet: string;
  receivedAt: string;
  /** gmail | hubspot */
  source?: string | null;
}

const subjectKey = (s: string | null) => (s ?? '').replace(/^(?:\s*(?:re|fw|fwd|aw|sv)\s*:\s*)+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
const openingKey = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 48);

export function areTwins(a: TwinCandidate, b: TwinCandidate): boolean {
  if (a.id === b.id) return true;
  if (a.from.trim().toLowerCase() !== b.from.trim().toLowerCase()) return false;
  if (subjectKey(a.subject) !== subjectKey(b.subject)) return false;
  if (Math.abs(new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()) > TWIN_WINDOW_MS) return false;
  const x = openingKey(a.snippet);
  const y = openingKey(b.snippet);
  return !x || !y || x === y || x.startsWith(y) || y.startsWith(x);
}

/** Group twins; each group's representative is the Gmail copy, else the earliest. Order of first appearance kept. */
export function twinGroups<T extends TwinCandidate>(rows: readonly T[]): Array<{ rep: T; members: T[] }> {
  const groups: Array<{ rep: T; members: T[] }> = [];
  for (const r of rows) {
    const g = groups.find((x) => x.members.some((m) => areTwins(m, r)));
    if (g) g.members.push(r);
    else groups.push({ rep: r, members: [r] });
  }
  for (const g of groups) {
    g.rep = [...g.members].sort((a, b) => Number(a.source === 'hubspot') - Number(b.source === 'hubspot') || a.receivedAt.localeCompare(b.receivedAt) || a.id.localeCompare(b.id))[0];
  }
  return groups;
}
