/**
 * The truth label words the intelligence panel renders. Client-safe on purpose: `work/intel.ts` is a server
 * module (it reaches Gmail, DNS and node:crypto through its readers), so the one value a client component
 * needs from it lives here and intel.ts re-exports it.
 */
export type TruthLabel = 'historical_observation' | 'verified_fact' | 'unverified_status' | 'contradicted';
export const TRUTH_TEXT: Record<TruthLabel, string> = {
  historical_observation: 'Historical observation',
  verified_fact: 'Verified fact',
  unverified_status: 'Unverified present-day status',
  contradicted: 'Contradicted or superseded',
};

/**
 * The people fix (2026-10-10): the words for a sender's `never` (not a prospect), on the briefing's links and the
 * panel's button alike. Client-safe for the same reason as TRUTH_TEXT; intel.ts re-exports them.
 */
export const NEVER_WORDS = 'Not a prospect: never list this sender again';
export const neverDomainWords = (domain: string) => `Not a prospect: never list anyone at ${domain}`;

/**
 * PAUSED REPLY (Casey, 2026-10-10): "A reply paused by the send gate must show its actual condition and reason,
 * consistently across Gmail, the account page and the work queue. Preserve the buyer's message and distinguish a
 * received reply from a paused proposed action. Don't leave 'Someone replied' as the only explanation or imply anything
 * was sent." The send gate holds the account's proposed first touch (or follow-up) while a message from the account is
 * not recorded (motion/load.ts loadReplyHolds, the gate's own reader; the motion is then `paused_reply`). Two facts,
 * said as two sentences and never one: the reply RECEIVED, with the buyer's own words, and the proposed action PAUSED,
 * with the gate's reason and that nothing was sent. One source for the pursuit state (the account page's NOW), the Work
 * card and the assignment packet (pursuit/state.ts, work/list.ts, ask/grounding.ts). Client-safe, like the rest here.
 * Pinned by tests/unit/gap/paused-reply.test.ts.
 */
export type PausedActionKind = 'first_touch' | 'follow_up';
export type PausedReason = 'reply_unrecorded';
export interface PausedReply {
  accountName: string;
  /** The reply on record: who wrote (their name, else their address), when (ISO), their own words (null when GAP holds none). */
  reply: { name: string; from: string | null; at: string; words: string | null; id?: string | null };
  /** The action the gate holds: its kind and the person it would go to (null: anyone else at the account). */
  proposed: { kind: PausedActionKind; to: string | null };
  reason: PausedReason;
}

export const PAUSED_ACTION_WORDS: Record<PausedActionKind, string> = { first_touch: 'first touch', follow_up: 'follow-up' };
export const PAUSED_REASON_WORDS: Record<PausedReason, string> = { reply_unrecorded: 'the reply is not recorded yet' };
/** The buyer's words are kept to this many characters on the sentence (the whole message stays on the reply panel). */
export const PAUSED_WORDS_MAX = 160;

const pausedDay = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'an unknown date' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
};

/** Their own words, short: the quoted history dropped, double quotes made single, cut at a word past the bound. */
export function pausedWords(s: string | null | undefined, max = PAUSED_WORDS_MAX): string | null {
  const own = (s ?? '').replace(/\s+/g, ' ').trim().split(/\s(?:From|Sent|To):\s|\sOn .{5,80}? wrote:/)[0].replace(/["“”]/g, "'").trim();
  if (!own) return null;
  if (own.length <= max) return own;
  const head = own.slice(0, max + 1);
  const space = head.lastIndexOf(' ');
  return `${own.slice(0, space > max / 2 ? space : max).trim()}...`;
}

/** The reply received, with their words: 'A reply from Jane Doe on Oct 9 is on record ("We are looking at gate dwell").' */
export function pausedReceivedSentence(p: PausedReply): string {
  const words = pausedWords(p.reply.words);
  return `A reply from ${p.reply.name} on ${pausedDay(p.reply.at)} is on record (${words ? `"${words}"` : "its words are not in GAP's synced inbox"}).`;
}

/** The action paused: "The proposed first touch to Phil Smith is paused by the send gate: the reply is not recorded yet; nothing was sent." */
export function pausedActionSentence(p: PausedReply): string {
  const to = p.proposed.to?.trim() || `anyone else at ${p.accountName}`;
  return `The proposed ${PAUSED_ACTION_WORDS[p.proposed.kind]} to ${to} is paused by the send gate: ${PAUSED_REASON_WORDS[p.reason]}; nothing was sent.`;
}

/** Both, in order and apart: the reply received, then the action paused. */
export function pausedReplySentences(p: PausedReply): [string, string] {
  return [pausedReceivedSentence(p), pausedActionSentence(p)];
}

export const pausedReplyText = (p: PausedReply): string => pausedReplySentences(p).join(' ');

/** The state line (the card's title, the plan item, the subject): "Reply on record: Jane Doe, Oct 9. First touch to Phil Smith paused, nothing sent". */
export function pausedStateLine(p: PausedReply): string {
  const kind = PAUSED_ACTION_WORDS[p.proposed.kind];
  const to = p.proposed.to?.trim();
  return `Reply on record: ${p.reply.name}, ${pausedDay(p.reply.at)}. ${kind.charAt(0).toUpperCase()}${kind.slice(1)}${to ? ` to ${to}` : ''} paused, nothing sent`;
}

/**
 * ACCOUNT SENT COVERAGE (Casey, 2026-10-10: "Show which sources were read and when; missing access means unknown, never
 * 'nothing sent.'"): one seller mailbox's Sent read (account-intel/sent.ts), and every mailbox in words, read or not and
 * when: "casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured". The coverage line and the story
 * say it as it is. Client-safe, like the rest here. Pinned by tests/unit/gap/account-sent-coverage.test.ts.
 */
export interface SentMailboxRead {
  address: string;
  status: 'read' | 'partial' | 'failed' | 'not_configured';
  /** When it was read (ISO), null when it was not. */
  at: string | null;
  detail: string | null;
}
/** "14:02" on the seller's clock (America/New_York, 24 hours). */
const sentClock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/New_York' });
export function sentMailboxWords(mailboxes: readonly SentMailboxRead[]): string {
  return mailboxes
    .map((m) => {
      const when = m.at ? ` ${sentClock(m.at)}` : '';
      if (m.status === 'read') return `${m.address} read${when}`;
      if (m.status === 'partial') return `${m.address} partly read${when} (${m.detail ?? 'some queries failed'})`;
      return `${m.address} not read: ${m.detail ?? 'not configured'}`;
    })
    .join('; ');
}
/** Was any seller mailbox left unread or partly read? Then a silence in our Sent is unknown, never "nothing sent". */
export const sentIncomplete = (sent: { read: boolean; detail: string | null; mailboxes?: readonly SentMailboxRead[] } | null | undefined): boolean =>
  !!sent && (!sent.read || (sent.mailboxes ?? []).some((m) => m.status !== 'read'));
