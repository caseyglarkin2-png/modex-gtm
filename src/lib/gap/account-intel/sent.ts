/**
 * OUR SENT MAIL ON THE ACCOUNT STORY (GAP knowledge program, B1, 2026-10-09). Read-only.
 *
 * Every assignment said "Gmail Sent (not read on the account page)": our own side of every buyer thread was invisible
 * (Casey wrote Craig and Dave at Kenco in the morning; the story said "No answer on record" and nothing of our note).
 * This reads the GAP mailbox's Sent folder for one account: one query per account domain (Gmail's `to:` matches a
 * domain) and one per known address outside those domains (a freemail persona), last SENT_WINDOW_DAYS, merged by
 * message id, newest first, at most SENT_MAX; a few queries at a time under one deadline. Through `listSentTo` with
 * the configured GAP sender (none configured = not read, said). Nothing here writes. Pinned by
 * tests/unit/gap/kn-sent-*.test.ts.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';
import { listSentTo } from '@/lib/email/gmail-inbox';
import { isInternalRecipient } from '../context/context';
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import type { AccountInputs } from './build';

export const SENT_WINDOW_DAYS = 180;
export const SENT_MAX = 50;
/** How many Sent queries one account may cost (domains first, then addresses). */
export const SENT_QUERY_MAX = 12;
export const SENT_CONCURRENCY = 3;
export const SENT_TIMEOUT_MS = 12_000;
export const SENT_EXCERPT_MAX = 300;

export type AccountSent = NonNullable<AccountInputs['sent']>;
export type SentMessage = AccountSent['messages'][number];

/** One Sent query: the reader's rows (gmail-inbox.ts listSentTo; `snippet` when the reader carries it). */
export type SentRow = { id: string; threadId: string | null; internalDate: Date; to: string; subject: string; snippet?: string };
export type ListSent = (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SentRow[]>;

const lower = (s: string) => s.trim().toLowerCase();
const domainOf = (address: string) => (address.includes('@') ? lower(address.split('@')[1]) : '');
const cleanDomain = (d: string) => lower(d).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
/** The addresses in a To header ("Craig Morrison <craig@x.com>, dave@y.com"). */
export const addressesIn = (header: string): string[] => [...new Set((header.match(/[^\s<>,;"']+@[^\s<>,;"']+/g) ?? []).map(lower))];

/**
 * What to ask Sent about for one account: its domains (one query each; every address there is covered) and the known
 * buyer addresses outside them. Our own mailboxes are never a target; a freemail address is asked for only when it is
 * a known person's.
 */
export function sentTargets(x: { domains: readonly string[]; addresses: readonly string[] }): { domains: string[]; addresses: string[] } {
  const domains = [...new Set(x.domains.map(cleanDomain).filter((d) => d && d.includes('.') && !OWN_DOMAINS.has(d) && !FREEMAIL_DOMAINS.has(d)))];
  const covered = new Set(domains);
  const addresses = [...new Set(x.addresses.map(lower).filter((a) => a.includes('@') && !isInternalRecipient(a) && !OWN_DOMAINS.has(domainOf(a)) && !covered.has(domainOf(a))))];
  return { domains, addresses };
}

/** The account's known buyer addresses on its inputs: the GAP contacts, the inbound senders, the first-touch recipients. */
export function accountAddressesOf(i: Pick<AccountInputs, 'personas' | 'firstTouches'> & { inbound?: AccountInputs['inbound'] }): string[] {
  return [...new Set([...i.personas.map((p) => p.email ?? ''), ...(i.inbound?.messages ?? []).map((m) => m.from), ...i.firstTouches.map((t) => t.recipient)].map(lower).filter((a) => a.includes('@')))];
}

export interface LoadAccountSentArgs {
  accountName: string;
  addresses: readonly string[];
  domains: readonly string[];
  now: Date;
  /** The GAP sender (execution/gap-sender.ts gapGmailSender); null means not configured: not read, said. */
  sender: GmailSender | null;
  /** The reader (tests inject; the page uses listSentTo with the sender). */
  listSent?: ListSent;
  timeoutMs?: number;
}

/**
 * Our Sent mail to the account, newest first, at most SENT_MAX. `read` is true only when every query answered; a
 * failed or skipped query (the deadline) leaves `read` true with a `detail` when something was read, false when
 * nothing was. Never throws.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loadAccountSent(_prisma: unknown, args: LoadAccountSentArgs): Promise<AccountSent> {
  const { now, sender } = args;
  if (!sender) return { messages: [], read: false, detail: 'no GAP sender configured' };
  const { domains, addresses } = sentTargets({ domains: args.domains, addresses: args.addresses });
  const targets = [...domains, ...addresses].slice(0, SENT_QUERY_MAX);
  if (!targets.length) return { messages: [], read: true, detail: 'no address or domain on record to look for' };
  const listSent: ListSent = args.listSent ?? ((recipient, after, before) => listSentTo(sender, recipient, after, before, { max: SENT_MAX }));
  const afterEpoch = Math.floor((now.getTime() - SENT_WINDOW_DAYS * 86_400_000) / 1000);
  const beforeEpoch = Math.floor(now.getTime() / 1000) + 60;
  const deadline = Date.now() + (args.timeoutMs ?? SENT_TIMEOUT_MS);
  const wanted = new Set([...domains.map((d) => `@${d}`), ...addresses]);
  const matches = (a: string) => wanted.has(a) || wanted.has(`@${domainOf(a)}`);
  const messages = new Map<string, SentMessage>();
  const failures: string[] = [];
  let skipped = 0;

  const queue = [...targets];
  const worker = async () => {
    for (let t = queue.shift(); t !== undefined; t = queue.shift()) {
      if (Date.now() >= deadline) { skipped += 1; continue; }
      const remaining = Math.max(250, deadline - Date.now());
      try {
        const rows = await Promise.race([listSent(t, afterEpoch, beforeEpoch), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), remaining))]);
        for (const r of rows) {
          const at = new Date(r.internalDate);
          if (Number.isNaN(at.getTime())) continue;
          const to = addressesIn(r.to).find(matches) ?? null;
          // Gmail's `to:` matches loosely (a name, a prefix): the address list is the test.
          if (!to || messages.has(r.id)) continue;
          messages.set(r.id, { id: r.id, to, subject: r.subject?.trim() || null, at: at.toISOString(), excerpt: (r.snippet ?? '').replace(/\s+/g, ' ').trim().slice(0, SENT_EXCERPT_MAX), threadId: r.threadId ?? null });
        }
      } catch (e) {
        failures.push(`${t}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(SENT_CONCURRENCY, targets.length) }, worker));

  const out = [...messages.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, SENT_MAX);
  const detail = [failures.length ? `Gmail Sent read failed for ${failures.length} of ${targets.length} quer${targets.length === 1 ? 'y' : 'ies'} (${failures[0].slice(0, 120)})` : '', skipped ? `${skipped} quer${skipped === 1 ? 'y' : 'ies'} skipped at the deadline` : ''].filter(Boolean).join('; ') || null;
  return { messages: out, read: out.length > 0 || !detail, detail };
}
