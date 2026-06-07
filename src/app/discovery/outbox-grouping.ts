/**
 * One-click multi-send grouping (pure). Buckets sendable Outbox rows by account
 * (a "committee") and by sequence, so the UI can fire a whole committee or
 * sequence in one action instead of hand-checking rows. Purely additive — the
 * flat list, select-all, and per-row send are untouched.
 *
 * A row is sendable under the same rules the per-row Send button uses: not
 * already sent, and not a failed row that already reached Gmail (which needs a
 * manual reconcile, never a re-send).
 */

export interface SendableLike {
  id: number;
  account_name?: string | null;
  status: string;
  provider_message_id?: string | null;
  sequence_id?: number | null;
}

export interface SendGroup {
  /** Stable group key (account name, or `seq:${id}`). */
  key: string;
  /** Human label for the quick-fire button. */
  label: string;
  /** Ids of the sendable rows in this group, in input order. */
  ids: number[];
}

/** Matches the per-row Send eligibility: not sent, not failed-after-Gmail. */
export function isSendable(i: SendableLike): boolean {
  if (i.status === 'sent') return false;
  if (i.status === 'failed' && i.provider_message_id != null) return false;
  return true;
}

const NO_ACCOUNT_LABEL = 'No account';

/** Group sendable rows by account, sorted by sendable count desc then label asc. */
export function groupSendableByAccount(items: SendableLike[]): SendGroup[] {
  const byLabel = new Map<string, number[]>();
  for (const i of items) {
    if (!isSendable(i)) continue;
    const label = i.account_name?.trim() || NO_ACCOUNT_LABEL;
    const ids = byLabel.get(label);
    if (ids) ids.push(i.id);
    else byLabel.set(label, [i.id]);
  }
  return [...byLabel.entries()]
    .map(([label, ids]) => ({ key: label, label, ids }))
    .sort((a, b) => b.ids.length - a.ids.length || a.label.localeCompare(b.label));
}

/** Group sendable, sequence-enrolled rows by sequence id, sorted by count desc then id. */
export function groupSendableBySequence(items: SendableLike[]): SendGroup[] {
  const bySeq = new Map<number, number[]>();
  for (const i of items) {
    if (!isSendable(i) || i.sequence_id == null) continue;
    const ids = bySeq.get(i.sequence_id);
    if (ids) ids.push(i.id);
    else bySeq.set(i.sequence_id, [i.id]);
  }
  return [...bySeq.entries()]
    .map(([id, ids]) => ({ key: `seq:${id}`, label: `Sequence ${id}`, ids }))
    .sort((a, b) => b.ids.length - a.ids.length || a.key.localeCompare(b.key));
}
