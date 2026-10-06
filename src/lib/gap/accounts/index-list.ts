/**
 * ACCOUNTS index (account-first UX, UX-10): every GAP account, searchable, one line each (name, tier, vertical,
 * people on record, the last GAP first touch), the fast way to any account workspace. Pure helpers over rows the
 * page loads with three cheap queries; no pursuit read per account (that is the workspace's job).
 */
import { accountHref } from '../account-intel/href';

export interface AccountIndexRow {
  name: string;
  tier: string | null;
  vertical: string | null;
  priorityBand: string | null;
  people: number;
  /** The newest GAP first touch at the account (ISO), when one exists. */
  lastTouchAt: string | null;
  href: string;
}

/** Name search, case-insensitive, token order free ("gen mills" finds General Mills); the index order is kept. */
export function filterAccounts(rows: readonly AccountIndexRow[], query: string): AccountIndexRow[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [...rows];
  return rows.filter((r) => {
    const hay = `${r.name} ${r.vertical ?? ''}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

/** The accounts GAP has worked most (people on record) first, then Tier 1, then band, then name. */
export function orderAccounts(rows: readonly AccountIndexRow[]): AccountIndexRow[] {
  const tierKey = (t: string | null) => {
    const m = /(\d)/.exec(t ?? '');
    return m ? Number(m[1]) : 9;
  };
  return [...rows].sort((a, b) => Math.min(b.people, 5) - Math.min(a.people, 5) || tierKey(a.tier) - tierKey(b.tier) || (a.priorityBand ?? 'Z').localeCompare(b.priorityBand ?? 'Z') || a.name.localeCompare(b.name));
}

export function toIndexRow(r: { name: string; tier: string | null; vertical: string | null; priority_band: string | null }, people: number, lastTouchAt: string | null): AccountIndexRow {
  return { name: r.name, tier: r.tier, vertical: r.vertical, priorityBand: r.priority_band, people, lastTouchAt, href: accountHref(r.name) };
}
