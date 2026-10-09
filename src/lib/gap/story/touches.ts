/**
 * WHAT HAS HAPPENED BETWEEN US (account-first UX, UX-05, 2026-10-06): the touches between us and the account, merged
 * from the readers GAP already has and nothing else: the account history (the legacy email log, meetings, replies),
 * GAP's own first-touch ledger, clawd's outreach history (`/api/outreach/history`, the swarm's sends by address) and
 * the classified replies. Pure: the loader fetches; this only merges, newest first, one row per event. A send to our
 * own mailbox is never a touch. Pinned by tests/unit/gap/story-projection.test.ts.
 */
import type { AccountContext } from '../context/context';
import type { AccountInputs } from '../account-intel/build';
import type { ReplyClassKind } from '../replies/classify';
import { isInternalRecipient } from '../context/context';
import { displayName } from '../people/display-name';

export interface ClawdSend {
  type: string;
  date: string;
  subject: string;
  status: string;
  to: string;
}

export interface ClawdOutreach {
  read: 'ok' | 'unavailable' | 'not_configured';
  sends: ClawdSend[];
}

export interface StoryTouch {
  kind: 'send' | 'reply' | 'meeting' | 'asset';
  at: string;
  /** The person as the seller knows them: the record's name when one matches, else the name read from the address. */
  name: string;
  title: string | null;
  address: string | null;
  /** The subject, the meeting objective, the reply's first words. */
  what: string;
  source: 'GAP ledger' | 'clawd ledger' | 'account history';
  replyKind?: ReplyClassKind;
  replyLabel?: string;
  /** C6: the identity path that placed the sender at the account (a thread keyed elsewhere or nowhere); null when the reply list or the history held it. */
  placedVia?: 'thread' | 'persona' | 'crm_contact' | 'alias' | 'domain' | 'family_deal' | null;
}

/** C6: the placement in the story's words ("placed by its domain"). */
export const PLACED_WORDS: Record<NonNullable<StoryTouch['placedVia']>, string> = { thread: 'its thread', persona: 'the GAP contact record', crm_contact: "the CRM contact's company", alias: 'the thread name', domain: 'its domain', family_deal: "the family's deal-holding account" };

/** "michael.jeannotte@fedex.com" -> "Michael Jeannotte"; "kwhite@..." stays "kwhite" (never invented). */
export function nameFromAddress(address: string): string {
  const local = address.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length < 2 || parts.some((p) => /\d/.test(p))) return local;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// R63-A B4: digits stay in the key ("Person1 Scratch" and "Person6 Scratch" are two people, never one).
const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function mergeTouches(x: {
  history: AccountContext['history'];
  firstTouches: AccountInputs['firstTouches'];
  clawd: ClawdOutreach | null;
  /** R63-A B4: `address` is the message's from address; its sender is named by it, never by a name that two people share. */
  replies?: Array<{ from: string; at: string; snippet: string; kind: ReplyClassKind; label: string; address?: string | null; placedVia?: StoryTouch['placedVia'] }>;
  people: Array<{ name: string; title: string | null; email?: string | null }>;
  now: Date;
}): StoryTouch[] {
  const byName = new Map(x.people.map((p) => [nameKey(p.name), p]));
  const byEmail = new Map(x.people.filter((p) => p.email).map((p) => [String(p.email).trim().toLowerCase(), p]));
  const person = (raw: string, from?: string | null): { name: string; title: string | null; address: string | null } => {
    // R63-A B4: the sender's address names them first (the persona on record at that address).
    const sent = from?.trim().toLowerCase() || null;
    const own = sent ? byEmail.get(sent) : undefined;
    if (own) return { name: displayName(own.name), title: own.title ?? null, address: sent };
    const address = raw.includes('@') ? raw.trim().toLowerCase() : sent;
    const guess = address ? nameFromAddress(address) : displayName(raw.trim());
    const hit = byName.get(nameKey(guess));
    return { name: hit ? displayName(hit.name) : guess, title: hit?.title ?? null, address };
  };
  const out: StoryTouch[] = [];

  for (const h of x.history) {
    if (h.visibility !== 'seller') continue;
    if (h.kind === 'email_sent' || h.kind === 'asset_sent') {
      const m = h.text.match(/\bto\s+([^\s:]+@[^\s:]+)\s*:?\s*(.*)$/i);
      if (m && isInternalRecipient(m[1])) continue;
      const who = m ? person(m[1]) : { name: 'someone at the account', title: null, address: null };
      out.push({ kind: h.kind === 'asset_sent' ? 'asset' : 'send', at: h.at, ...who, what: (m?.[2] ?? h.text).trim(), source: 'account history' });
    } else if (h.kind === 'meeting') {
      out.push({ kind: 'meeting', at: h.at, name: 'the account', title: null, address: null, what: h.text, source: 'account history' });
    }
  }
  for (const t of x.firstTouches) {
    if (!t.sentAt || t.state === 'draft outstanding' || isInternalRecipient(t.recipient)) continue;
    out.push({ kind: 'send', at: String(t.sentAt), ...person(t.recipient), what: 'GAP first touch', source: 'GAP ledger' });
  }
  for (const s of x.clawd?.sends ?? []) {
    if (!s.to || !s.date || isInternalRecipient(s.to)) continue;
    if (s.status && /fail|error|skip|blocked|suppress/i.test(s.status)) continue;
    out.push({ kind: 'send', at: new Date(s.date).toISOString(), ...person(s.to), what: s.subject?.trim() || 'email', source: 'clawd ledger' });
  }
  for (const r of x.replies ?? []) {
    out.push({ kind: 'reply', at: r.at, ...person(r.from, r.address ?? null), what: r.snippet.replace(/\s+/g, ' ').trim().slice(0, 80), source: 'GAP ledger', replyKind: r.kind, replyLabel: r.label, ...(r.placedVia ? { placedVia: r.placedVia } : {}) });
  }

  // One row per event: the same person, the same minute, the same kind (the history and the GAP ledger both record a send).
  const seen = new Set<string>();
  return out
    .filter((t) => !Number.isNaN(new Date(t.at).getTime()))
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((t) => {
      const k = `${t.kind}|${nameKey(t.name)}|${t.at.slice(0, 16)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
