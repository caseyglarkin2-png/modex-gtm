/**
 * OUR SENT MAIL ON THE ACCOUNT STORY (GAP knowledge program, B1, 2026-10-09). Read-only.
 *
 * Every assignment said "Gmail Sent (not read on the account page)": our own side of every buyer thread was invisible
 * (Casey wrote Craig and Dave at Kenco in the morning; the story said "No answer on record" and nothing of our note).
 * This reads the seller's Sent for one account: one query per account domain (Gmail's `to:` matches a domain) and one
 * per known address outside those domains (a freemail persona), last SENT_WINDOW_DAYS, merged by message id, newest
 * first, at most SENT_MAX; a few queries at a time under one deadline. Nothing here writes. Pinned by
 * tests/unit/gap/kn-sent-*.test.ts and tests/unit/gap/account-sent-coverage.test.ts.
 *
 * Account Sent coverage (Casey, 2026-10-10): the read goes through the canonical seller reader (execution/seller-sent.ts):
 * EVERY seller mailbox (casey@yardflow.ai through the GAP delegation, casey@freightroll.com through the app's
 * GOOGLE_REFRESH_TOKEN), never the GAP mailbox alone, each row carrying the mailbox it came from and each query asked of
 * every mailbox. Each mailbox says whether it was read and when (`mailboxes`); a mailbox not configured or not
 * answering makes the read `read: false` with the detail naming it ("casey@freightroll.com: not configured"), so the
 * coverage says "Gmail Sent (casey@yardflow.ai read 14:02; casey@freightroll.com not read: not configured)" and the
 * story says what was not read, never "nothing sent". The assignment's relationship reads the same mailboxes.
 */
import { listSentTo } from '@/lib/email/gmail-inbox';
import { isInternalRecipient } from '../context/context';
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from '../replies/domains';
import type { ListSentFrom, SellerMailboxSlot } from '../execution/seller-sent';
import type { SentMailboxRead } from '../work/truth-text';
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
export type SentRow = { id: string; threadId: string | null; internalDate: Date; to: string; subject: string; snippet?: string; mailbox?: string };

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
  /**
   * The seller's mailboxes, configured or not (execution/seller-sent.ts sellerMailboxSlots, the reader the assignment's
   * relationship uses): each configured one is read; one with no sender is said as not read, never skipped.
   */
  mailboxes: readonly SellerMailboxSlot[];
  /** The per-mailbox reader (tests inject; the page uses listSentTo with each mailbox's sender). */
  listSent?: ListSentFrom;
  timeoutMs?: number;
}

/** The mailbox words live in the client-safe word table (the story and the coverage line say them). */
export { sentMailboxWords, type SentMailboxRead } from '../work/truth-text';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Our Sent mail to the account, newest first, at most SENT_MAX, from every seller mailbox (each row says which).
 * `read` is true only when every mailbox answered: a mailbox not configured, or one whose every query failed, makes it
 * false with `detail` naming the mailbox; a failed or skipped query (the deadline) in a mailbox that answered the rest
 * leaves it true with a `detail`. The rows any mailbox did return stand either way (they are what we wrote). Never throws.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loadAccountSent(_prisma: unknown, args: LoadAccountSentArgs): Promise<AccountSent> {
  const { now } = args;
  const readAt = now.toISOString();
  const slots = args.mailboxes;
  const unconfigured = (address: string): SentMailboxRead => ({ address, status: 'not_configured', at: null, detail: 'not configured' });
  if (!slots.some((s) => s.sender)) {
    const mailboxes = slots.map((s) => unconfigured(s.address));
    return { messages: [], read: false, detail: mailboxes.map((m) => `${m.address}: ${m.detail}`).join('; ') || 'no seller mailbox configured', mailboxes };
  }
  const { domains, addresses } = sentTargets({ domains: args.domains, addresses: args.addresses });
  const targets = [...domains, ...addresses].slice(0, SENT_QUERY_MAX);
  if (!targets.length) return { messages: [], read: true, detail: 'no address or domain on record to look for', mailboxes: slots.map((s) => (s.sender ? { address: s.address, status: 'read', at: readAt, detail: null } : unconfigured(s.address))) };
  const listSent: ListSentFrom = args.listSent ?? ((sender, recipient, after, before) => listSentTo(sender, recipient, after, before, { max: SENT_MAX }));
  const afterEpoch = Math.floor((now.getTime() - SENT_WINDOW_DAYS * 86_400_000) / 1000);
  const beforeEpoch = Math.floor(now.getTime() / 1000) + 60;
  const deadline = Date.now() + (args.timeoutMs ?? SENT_TIMEOUT_MS);
  const wanted = new Set([...domains.map((d) => `@${d}`), ...addresses]);
  const matches = (a: string) => wanted.has(a) || wanted.has(`@${domainOf(a)}`);
  const messages = new Map<string, SentMessage>();
  const tally = new Map(slots.filter((s) => s.sender).map((s) => [s.address, { answered: 0, failures: [] as string[], skipped: 0 }]));

  // Every query is asked of every configured mailbox (the canonical reader's rule), a few at a time under one deadline.
  const queue = slots.filter((s) => s.sender).flatMap((s) => targets.map((t) => ({ slot: s, t })));
  const worker = async () => {
    for (let job = queue.shift(); job !== undefined; job = queue.shift()) {
      const mine = tally.get(job.slot.address)!;
      if (Date.now() >= deadline) { mine.skipped += 1; continue; }
      const remaining = Math.max(250, deadline - Date.now());
      try {
        const rows = await Promise.race([listSent(job.slot.sender!, job.t, afterEpoch, beforeEpoch), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), remaining))]);
        mine.answered += 1;
        for (const r of rows) {
          const at = new Date(r.internalDate);
          if (Number.isNaN(at.getTime())) continue;
          const to = addressesIn(r.to).find(matches) ?? null;
          // Gmail's `to:` matches loosely (a name, a prefix): the address list is the test.
          if (!to || messages.has(r.id)) continue;
          messages.set(r.id, { id: r.id, to, subject: r.subject?.trim() || null, at: at.toISOString(), excerpt: (r.snippet ?? '').replace(/\s+/g, ' ').trim().slice(0, SENT_EXCERPT_MAX), threadId: r.threadId ?? null, mailbox: r.mailbox ?? job.slot.address });
        }
      } catch (e) {
        mine.failures.push(`${job.t}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(SENT_CONCURRENCY, queue.length) }, worker));

  const mailboxes: SentMailboxRead[] = slots.map((s) => {
    const t = tally.get(s.address);
    if (!s.sender || !t) return unconfigured(s.address);
    const detail = [t.failures.length ? `Gmail Sent read failed for ${t.failures.length} of ${plural(targets.length, 'query', 'queries')} (${t.failures[0].slice(0, 120)})` : '', t.skipped ? `${plural(t.skipped, 'query', 'queries')} skipped at the deadline` : ''].filter(Boolean).join('; ') || null;
    if (!detail) return { address: s.address, status: 'read', at: readAt, detail: null };
    return t.answered > 0 ? { address: s.address, status: 'partial', at: readAt, detail } : { address: s.address, status: 'failed', at: null, detail };
  });
  const out = [...messages.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, SENT_MAX);
  const missing = mailboxes.filter((m) => m.status === 'failed' || m.status === 'not_configured');
  const partial = mailboxes.filter((m) => m.status === 'partial');
  const named = (list: SentMailboxRead[]) => list.map((m) => `${m.address}: ${m.detail}`).join('; ');
  if (missing.length) return { messages: out, read: false, detail: named([...missing, ...partial]), mailboxes };
  return { messages: out, read: true, detail: partial.length ? named(partial) : null, mailboxes };
}
