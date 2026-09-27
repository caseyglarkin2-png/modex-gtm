/**
 * GAP MAILBOX INTAKE (red team T9, 2026-09-26).
 *
 * GAP sends from casey@yardflow.ai (GAP_GMAIL_USER_EMAIL) but never read that
 * mailbox back. This consumes it as execution feedback, read-only toward
 * Gmail (nothing is marked, labeled or moved):
 *
 *   DSN, bad address    5.1.x (1, 2, 3, 6, 10); 5.4.1 "recipient address
 *                       rejected" (Office 365 directory-based blocking); 5.2.1
 *                       "disabled"; or an explicit unknown-user diagnostic about
 *                       the failed recipient. For an address GAP sent to or
 *                       drafted: the canonical hard-bounce write
 *                       (src/lib/email/bounce.ts), hard_bounce + do_not_contact
 *                       + bounce notification. A bounce is NEVER a reply.
 *   DSN, policy block   any other permanent status or a bare "550": audited,
 *                       plus a per-recipient `mailbox.delivery_blocked` row that
 *                       holds the person's next touch for a human
 *                       (next-touch.ts). Never do-not-contact: a block says
 *                       something about US, not that the address is bad.
 *   DSN, soft/delayed   4.x.x or Action: delayed: audited only.
 *   human reply         in a GAP thread, from an address GAP emailed, or from
 *                       the account domain of a person GAP emailed, after that
 *                       send: stored as an InboundMessage (+ EmailThread, a
 *                       `reply` notification), and ingestReply pauses the live
 *                       enrollment of the replier AND of the GAP-emailed
 *                       recipient. Its CONTENT is not buyer truth until a human
 *                       records a disposition.
 *   auto reply / OOO    audited only; never a stop, never buyer truth
 *   intake canary       from one of OUR domains with a subject starting
 *                       CANARY_SUBJECT_PREFIX: stored as an InboundMessage and
 *                       audited `mailbox.canary`, so production can prove the
 *                       intake end to end without any prospect's thread. It
 *                       pauses nothing, rings no bell and is never a reply.
 *   anything else       audited `mailbox.unrelated` (sender, thread, time;
 *                       the mail itself stays in Gmail, nothing is stored)
 *
 * Every message gets exactly one verdict row (a `mailbox.*` GapAuditEvent),
 * so a run lists ids, skips the handled ones in ONE database read and fetches
 * only new mail (Release C re-review B1): a dense window of already-handled
 * or unrelated mail can never stall intake.
 *
 *   - The lister returns one COMPLETE window, oldest first (it narrows its
 *     upper bound rather than drop the oldest ids); at most
 *     MAILBOX_RUN_BUDGET new messages are fetched per run, oldest first, and
 *     the watermark (SystemConfig `gap_mailbox_watermark`) moves only past
 *     messages actually processed. A fixed overlap re-lists recent mail for
 *     late indexing; the verdict rows make it free.
 *   - Late attribution (review S4, re-review S2): a reply or a bounce can land
 *     before GAP records its send (a Gmail draft Casey sends is only recorded
 *     when he checks it). Every run re-checks the `mailbox.unrelated` and
 *     `mailbox.bounce_unattributed` rows of the last
 *     MAILBOX_REATTRIBUTE_SECONDS against the current send context, from the
 *     database alone; one that now attributes is fetched and processed.
 *   - A message that fails is retried; after MAILBOX_MAX_ATTEMPTS it is
 *     quarantined (a verdict, surfaced as an error) so one poison message
 *     never halts intake silently. Any error marks the cron run failed.
 *   - An unreadable mailbox throws before anything moves.
 */
import { classifyInboundReply } from '@/lib/email/reply-precision';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { recordHardBounce } from '@/lib/email/bounce';
import { ingestReply } from './ingest';
import { AUTO_REPLY_SUBJECT, DELIVERY_BLOCKED_KIND, FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';
export { DELIVERY_BLOCKED_KIND } from './domains';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, DRAFTED, MANUAL_SENT } from '../execution/draft-ledger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GAP_MAILBOX_WATERMARK_KEY = 'gap_mailbox_watermark';
/** Re-list this much before the watermark every run (late indexing, clock skew). */
export const MAILBOX_OVERLAP_SECONDS = 60 * 60;
/** First run looks back this far. */
export const MAILBOX_FIRST_LOOKBACK_SECONDS = 3 * 24 * 60 * 60;
/** New messages fetched and processed per run, oldest first. */
export const MAILBOX_RUN_BUDGET = 200;
/** A failing message is retried this many times, then quarantined. */
export const MAILBOX_MAX_ATTEMPTS = 3;
/** Unrelated or unattributed mail this young is re-checked every run in case its send is recorded late. */
export const MAILBOX_REATTRIBUTE_SECONDS = 24 * 60 * 60;

export const MAILBOX_KINDS = {
  reply: 'mailbox.reply',
  hardBounce: 'mailbox.hard_bounce',
  policyBounce: 'mailbox.policy_bounce',
  softBounce: 'mailbox.soft_bounce',
  unattributedBounce: 'mailbox.bounce_unattributed',
  autoReply: 'mailbox.auto_reply',
  canary: 'mailbox.canary',
  own: 'mailbox.own',
  unrelated: 'mailbox.unrelated',
  quarantined: 'mailbox.quarantined',
  /** Ops closeout 13A: a quarantined message processed on retry, or read and closed by an operator. */
  quarantineResolved: 'mailbox.quarantine_resolved',
  error: 'mailbox.error',
} as const;
/** Kinds that mean "this message has a verdict". `mailbox.error` is an attempt, not a verdict. */
const HANDLED_KINDS: string[] = Object.values(MAILBOX_KINDS).filter((k) => k !== MAILBOX_KINDS.error);
/** Provisional verdicts the late-attribution sweep may supersede. */
const PROVISIONAL_KINDS: string[] = [MAILBOX_KINDS.unrelated, MAILBOX_KINDS.unattributedBounce];
const FINAL_KINDS: string[] = HANDLED_KINDS.filter((k) => !PROVISIONAL_KINDS.includes(k));
const SUBJECT_TYPE = 'gmail_message';

export { FREEMAIL_DOMAINS } from './domains';

/** The subject prefix of an operator's intake canary (sent from one of our own domains). */
export const CANARY_SUBJECT_PREFIX = '[gap-intake-canary]';

export type DsnClass = 'hard' | 'policy' | 'soft';

export interface DsnFinding {
  action: string | null;
  status: string | null;
  recipients: string[];
  /** Only 'hard' (a bad address) ever writes do-not-contact. */
  dsnClass: DsnClass;
  hard: boolean;
}

const lower = (s: string) => s.trim().toLowerCase();
const domainOf = (email: string) => lower(email.split('@')[1] ?? '');
const ADDRESS = /[^\s<>,;"'()]+@[^\s<>,;"'()]+\.[a-z]{2,}/gi;

/** RFC 3463 X.1.Y codes that say the ADDRESS is bad (not 5.1.7 / 5.1.8, which are about the sender). */
const BAD_ADDRESS_STATUS = /^5\.1\.(1|2|3|6|10)$/;
/** An explicit "this mailbox does not exist". */
const UNKNOWN_USER =
  /(user unknown|unknown user|no such user|no such (mailbox|recipient)|does not exist|doesn'?t exist|address couldn'?t be found|address not found|mailbox not found|recipient not found|user not found|unknown recipient|invalid recipient|RecipNotFound)/i;
/** Sender-side wording ("sender address does not exist"): never about the recipient. */
const SENDER_SIDE = /\b(sender|mail from|return-path|envelope from|domain of)\b/i;
/** Where a notice stops speaking and the returned original message begins. */
const ORIGINAL_MESSAGE =
  /^(-+\s*(original message|forwarded message|below this line is a copy)|-+ ?this is a copy of|received: from|original-envelope-id:|reporting-mta:|the original message was received|your message reads)/im;
/** Non-delivery report subjects, including Exchange's, whose sender is not a daemon mailbox. */
const NDR_SUBJECT = /^(undeliverable|undelivered mail|delivery status notification|mail delivery (failed|failure|subsystem)|returned mail|delivery (has )?failed|failure notice|non-?delivery)/i;

function header(m: MailboxMessage, name: string): string {
  const key = Object.keys(m.headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? m.headers[key] ?? '' : '';
}

/**
 * The text that may say "this recipient does not exist" (re-review S3): the
 * Diagnostic-Code, and the notice's own lines BEFORE the returned original
 * that name a failed recipient. Our quoted email and sender-side wording
 * never count.
 */
/** The notice's own words: snippet and body up to where the returned original begins. */
function humanPart(m: MailboxMessage): string {
  const text = `${m.snippet}\n${m.rawText}`;
  const cut = text.search(ORIGINAL_MESSAGE);
  return (cut >= 0 ? text.slice(0, cut) : text).slice(0, 4000);
}

function unknownUserEvidence(diagnostic: string, human: string, recipients: string[]): boolean {
  if (diagnostic && !SENDER_SIDE.test(diagnostic) && UNKNOWN_USER.test(diagnostic)) return true;
  // A notice often wraps: judge the recipient's line with its neighbour.
  const lines = human.split(/\r?\n/);
  return lines.some((line, i) => {
    const span = `${line} ${lines[i + 1] ?? ''}`;
    const low = span.toLowerCase();
    return recipients.some((r) => low.includes(r)) && UNKNOWN_USER.test(span) && !SENDER_SIDE.test(span);
  });
}

function classOf(action: string | null, status: string | null, diagnostic: string, unknownUser: boolean): DsnClass {
  if (action === 'delayed' || (status && status.startsWith('4.'))) return 'soft';
  if (status && status.startsWith('5.')) {
    if (BAD_ADDRESS_STATUS.test(status)) return 'hard';
    // Office 365 directory-based edge blocking: the tenant has no such user.
    if (status === '5.4.1' && /recipient address rejected/i.test(diagnostic)) return 'hard';
    // Gmail and others: the account exists no longer.
    if (status === '5.2.1' && /\b(disabled|inactive|deactivated|no longer (active|available))\b/i.test(diagnostic)) return 'hard';
    const subject = status.split('.')[1];
    // 5.7 policy, 5.4 routing, 5.2 mailbox state, 5.3 system, 5.6 content,
    // 5.1.7/5.1.8 sender: a block about us, never proof the address is bad.
    if (subject !== '0' && subject !== '5') return 'policy';
    return unknownUser ? 'hard' : 'policy';
  }
  // No machine-readable status: only an explicit unknown-user statement about
  // the recipient is a bad address; a bare "550" or "failed" is a block.
  return unknownUser ? 'hard' : 'policy';
}

/** Pure. A delivery-status notification, or null. */
export function parseDsn(m: MailboxMessage): DsnFinding | null {
  const from = lower(m.fromEmail);
  const local = from.split('@')[0] ?? '';
  const contentType = header(m, 'Content-Type').toLowerCase();
  const failedHeader = header(m, 'X-Failed-Recipients');
  const isDsn =
    m.deliveryStatus !== null ||
    contentType.includes('report-type=delivery-status') ||
    /^(mailer-daemon|postmaster|mail-delivery-subsystem|mail-daemon)$/.test(local) ||
    local.startsWith('microsoftexchange') ||
    failedHeader.length > 0 ||
    NDR_SUBJECT.test((m.subject ?? '').trim());
  if (!isDsn) return null;

  const ds = m.deliveryStatus ?? '';
  const action = (/^Action:\s*([a-z]+)/im.exec(ds)?.[1] ?? null)?.toLowerCase() ?? null;
  const human = humanPart(m);
  // No delivery-status part (Exchange, qmail): the notice's own text may still
  // carry the enhanced code ("Remote Server returned '550 5.1.10 ...'").
  const textCode = ds ? null : /\b([245]\.\d{1,3}\.\d{1,3})\b/.exec(human);
  const status = /^Status:\s*([245]\.\d{1,3}\.\d{1,3})/im.exec(ds)?.[1] ?? textCode?.[1] ?? null;
  const diagnostic = /^Diagnostic-Code:\s*(.+)$/im.exec(ds)?.[1] ?? (textCode ? (human.split(/\r?\n/).find((l) => l.includes(textCode[1])) ?? '') : '');
  const all = new Set<string>();
  for (const line of ds.split(/\r?\n/)) {
    const m1 = /^(?:Final|Original)-Recipient:\s*rfc822;\s*(\S+)/i.exec(line.trim());
    if (m1) all.add(lower(m1[1].replace(/[<>]/g, '')));
  }
  for (const a of failedHeader.match(ADDRESS) ?? []) all.add(lower(a));
  const recipients = [...all].filter((r) => !OWN_DOMAINS.has(domainOf(r)));

  const dsnClass = classOf(action, status, diagnostic, unknownUserEvidence(diagnostic, human, recipients));
  return { action, status, recipients, dsnClass, hard: dsnClass === 'hard' };
}

interface SentRef {
  personaId: number | null;
  recipient: string;
  sentAt: Date;
  threadId: string | null;
}

export interface GapSendContext {
  /** Gmail thread id -> the GAP sends in it. */
  threads: Map<string, SentRef[]>;
  /** Exact recipient address -> GAP sends to it (reply attribution). */
  recipients: Map<string, SentRef[]>;
  /**
   * Exact recipient address -> GAP sends AND Gmail drafts to it (bounce
   * attribution, re-review S2): a draft Casey sends is only recorded when he
   * checks it, but its bounce is about an address GAP put in front of him.
   */
  bounceRecipients: Map<string, SentRef[]>;
  /** Account domain -> GAP sends to it (freemail and own domains excluded). */
  domains: Map<string, SentRef[]>;
}

const push = (map: Map<string, SentRef[]>, key: string, ref: SentRef) => map.set(key, [...(map.get(key) ?? []), ref]);

/** Every GAP send (manual, direct, draft-sent) and draft, with its Gmail thread: the attribution context. */
export async function loadGapSendContext(prisma: PrismaLike): Promise<GapSendContext> {
  const rows: Array<{ kind: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [MANUAL_SENT, DIRECT_SENT, DRAFTED, DRAFT_SENT] } },
    select: { kind: true, payload: true, created_at: true },
  });
  const drafted = new Map<string, SentRef>();
  const refs: SentRef[] = [];
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === DRAFTED && typeof p.gmailDraftId === 'string') {
      drafted.set(p.gmailDraftId, { personaId: typeof p.personaId === 'number' ? p.personaId : null, recipient: lower(String(p.recipient ?? '')), threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : null, sentAt: r.created_at });
    }
  }
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const sentAt = typeof p.sentAt === 'string' ? new Date(p.sentAt) : r.created_at;
    if (r.kind === MANUAL_SENT || r.kind === DIRECT_SENT) {
      refs.push({ personaId: typeof p.personaId === 'number' ? p.personaId : null, recipient: lower(String(p.recipient ?? '')), sentAt, threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : null });
    } else if (r.kind === DRAFT_SENT && typeof p.gmailDraftId === 'string') {
      const d = drafted.get(p.gmailDraftId);
      if (d) refs.push({ ...d, sentAt, threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : d.threadId });
    }
  }
  const ctx: GapSendContext = { threads: new Map(), recipients: new Map(), bounceRecipients: new Map(), domains: new Map() };
  for (const ref of refs) {
    if (!ref.recipient.includes('@')) continue;
    if (ref.threadId) push(ctx.threads, ref.threadId, ref);
    push(ctx.recipients, ref.recipient, ref);
    push(ctx.bounceRecipients, ref.recipient, ref);
    const dom = domainOf(ref.recipient);
    if (dom && !FREEMAIL_DOMAINS.has(dom) && !OWN_DOMAINS.has(dom)) push(ctx.domains, dom, ref);
  }
  for (const d of drafted.values()) if (d.recipient.includes('@')) push(ctx.bounceRecipients, d.recipient, d);
  return ctx;
}

export type ReplyAttribution = 'gap_thread' | 'gap_recipient' | 'account_domain';

export type MailboxVerdict =
  | { kind: 'own' }
  | { kind: 'canary' }
  | { kind: 'bounce'; dsn: DsnFinding }
  | { kind: 'auto_reply'; reason: string; attributedTo: SentRef[] }
  | { kind: 'reply'; attribution: ReplyAttribution; attributedTo: SentRef[] }
  | { kind: 'unrelated'; reason: string };

/** Who a message from `from` in `threadId` at `receivedAt` answers, most specific first. Pure. */
function attribute(ctx: GapSendContext, from: string, threadId: string, receivedAt: Date): { attribution: ReplyAttribution; attributedTo: SentRef[] } | null {
  const before = (s: SentRef) => s.sentAt.getTime() <= receivedAt.getTime();
  const inThread = (ctx.threads.get(threadId) ?? []).filter(before);
  if (inThread.length) return { attribution: 'gap_thread', attributedTo: inThread };
  const byRecipient = (ctx.recipients.get(from) ?? []).filter(before);
  if (byRecipient.length) return { attribution: 'gap_recipient', attributedTo: byRecipient };
  const dom = domainOf(from);
  if (!dom || FREEMAIL_DOMAINS.has(dom) || OWN_DOMAINS.has(dom)) return null;
  const byDomain = (ctx.domains.get(dom) ?? []).filter((s) => s.sentAt.getTime() < receivedAt.getTime());
  return byDomain.length ? { attribution: 'account_domain', attributedTo: byDomain } : null;
}

/** Pure: what one inbox message is to GAP. */
export function classifyMailboxMessage(m: MailboxMessage, ctx: GapSendContext, mailbox: string): MailboxVerdict {
  const from = lower(m.fromEmail);
  if (from === lower(mailbox)) return { kind: 'own' };
  if (OWN_DOMAINS.has(domainOf(from)) && lower(m.subject ?? '').startsWith(CANARY_SUBJECT_PREFIX)) return { kind: 'canary' };
  const dsn = parseDsn(m);
  if (dsn) return { kind: 'bounce', dsn };

  const who = attribute(ctx, from, m.threadId, m.receivedAt);
  if (!who) return { kind: 'unrelated', reason: 'not_a_gap_thread_or_account' };
  if (AUTO_REPLY_SUBJECT.test(m.subject ?? '')) return { kind: 'auto_reply', reason: 'auto_reply_subject_localized', attributedTo: who.attributedTo };
  const verdict = classifyInboundReply({ fromEmail: from, headers: m.headers, subject: m.subject, bodyText: m.bodyText, knownContact: true });
  if (!verdict.isHumanReply) return { kind: 'auto_reply', reason: verdict.reason, attributedTo: who.attributedTo };
  return { kind: 'reply', ...who };
}

export interface MailboxReport {
  since: number;
  /** Ids in the listed window. */
  seen: number;
  /** New messages fetched this run. */
  fetched: number;
  /** New messages left for the next run (over MAILBOX_RUN_BUDGET). */
  backlog: number;
  replies: number;
  hardBounces: number;
  policyBounces: number;
  softBounces: number;
  unattributedBounces: number;
  autoReplies: number;
  unrelated: number;
  own: number;
  canaries: number;
  alreadyHandled: number;
  /** Provisional verdicts that attributed once the send was recorded. */
  reattributed: number;
  quarantined: number;
  /** Ops closeout 13A: quarantined messages still unresolved after this run's retry. Non-empty is an error. */
  unresolvedQuarantine: string[];
  inboundMessagesCreated: number;
  bouncedAddresses: string[];
  /** Any entry marks the cron run failed. */
  errors: string[];
  watermark: number | null;
}

export interface MailboxListing {
  /** Every id in the window, oldest first. */
  ids: string[];
  /** Exclusive upper bound when the window was narrowed; null when it runs to now. */
  windowEnd: number | null;
}

export interface MailboxDeps {
  listIds: (afterEpoch: number) => Promise<MailboxListing>;
  fetch: (id: string) => Promise<MailboxMessage>;
  mailbox: string;
  ingest?: typeof ingestReply;
  bounce?: typeof recordHardBounce;
  budget?: number;
}

async function audit(prisma: PrismaLike, kind: string, actor: string, subjectId: string, payload: Record<string, unknown>, subjectType = SUBJECT_TYPE): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: subjectType, subject_id: subjectId, payload } });
}

async function handleBounce(prisma: PrismaLike, m: MailboxMessage, dsn: DsnFinding, ctx: GapSendContext, actor: string, report: MailboxReport, bounce: typeof recordHardBounce): Promise<void> {
  const base = { status: dsn.status, action: dsn.action, dsnClass: dsn.dsnClass, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() };
  // N1: a notice we cannot tie to any address is an intake error, not a quiet skip.
  if (dsn.recipients.length === 0) {
    report.errors.push(`${m.id}: delivery notice with no parseable recipient`);
    report.unattributedBounces += 1;
    await audit(prisma, MAILBOX_KINDS.unattributedBounce, actor, m.id, { ...base, recipients: [], reason: 'no_recipient' });
    return;
  }
  // N3: act only for an address GAP sent to or drafted. Anything else stays
  // provisional and is re-checked by the late-attribution sweep.
  const ours = dsn.recipients.filter((r) => ctx.bounceRecipients.has(r));
  const others = dsn.recipients.filter((r) => !ctx.bounceRecipients.has(r));
  if (ours.length === 0) {
    report.unattributedBounces += 1;
    await audit(prisma, MAILBOX_KINDS.unattributedBounce, actor, m.id, { ...base, recipients: others, reason: 'not_a_gap_recipient' });
    return;
  }
  if (dsn.dsnClass === 'hard') {
    for (const email of ours) {
      const threadIds = [...new Set([m.threadId, ...(ctx.bounceRecipients.get(email) ?? []).map((s) => s.threadId)].filter((t): t is string => !!t))];
      await bounce(prisma, { email, source: 'gap_mailbox_dsn', sourceId: m.id, subject: m.subject, emailLogScope: { threadIds } });
      report.bouncedAddresses.push(email);
    }
    report.hardBounces += 1;
    await audit(prisma, MAILBOX_KINDS.hardBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  } else if (dsn.dsnClass === 'policy') {
    // Re-review S4: a block is not a bad address (no DNC), but the next touch
    // to that person waits for a human rather than hitting the same wall.
    for (const email of ours) {
      await audit(prisma, DELIVERY_BLOCKED_KIND, actor, email, { gmailMessageId: m.id, status: dsn.status, receivedAt: m.receivedAt.toISOString() }, 'recipient');
    }
    report.policyBounces += 1;
    await audit(prisma, MAILBOX_KINDS.policyBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  } else {
    report.softBounces += 1;
    await audit(prisma, MAILBOX_KINDS.softBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  }
}

async function storeInbound(prisma: PrismaLike, m: MailboxMessage, report: MailboxReport): Promise<void> {
  const from = lower(m.fromEmail);
  await prisma.emailThread.upsert({
    where: { id: m.threadId },
    create: { id: m.threadId, persona_email: from, subject: m.subject, last_message_at: m.receivedAt },
    update: { last_message_at: m.receivedAt },
  });
  const existing = await prisma.inboundMessage.findUnique({ where: { id: m.id }, select: { id: true } });
  if (!existing) {
    await prisma.inboundMessage.create({
      data: { id: m.id, thread_id: m.threadId, rfc_message_id: m.rfcMessageId, from_email: from, from_name: m.fromName, subject: m.subject, body_html: m.bodyHtml || null, body_text: m.bodyText || null, snippet: m.snippet, received_at: m.receivedAt },
    });
    report.inboundMessagesCreated += 1;
  }
}

async function handleReply(prisma: PrismaLike, m: MailboxMessage, v: Extract<MailboxVerdict, { kind: 'reply' }>, now: Date, actor: string, report: MailboxReport, ingest: typeof ingestReply): Promise<void> {
  const from = lower(m.fromEmail);
  await storeInbound(prisma, m, report);
  const bell = await prisma.notification.findFirst({ where: { source_id: m.id, type: 'reply' }, select: { id: true } });
  if (!bell) {
    await prisma.notification.create({ data: { type: 'reply', persona_email: from, subject: m.subject, preview: m.snippet.slice(0, 200), source_id: m.id, read: false } });
  }
  // Pause the replier's live enrollment and, for a colleague or a thread
  // reply, the GAP-emailed recipient's too.
  const contacts = new Set([from, ...v.attributedTo.map((s) => s.recipient)]);
  for (const contactEmail of contacts) {
    await ingest(prisma, { contactEmail, source: 'gmail', inboundMessageId: m.id, receivedAt: m.receivedAt, isAutoresponder: false, now });
  }
  report.replies += 1;
  await audit(prisma, MAILBOX_KINDS.reply, actor, m.id, {
    from,
    attribution: v.attribution,
    recipients: [...new Set(v.attributedTo.map((s) => s.recipient))],
    personaIds: [...new Set(v.attributedTo.map((s) => s.personaId).filter((x) => x !== null))],
    threadId: m.threadId,
    receivedAt: m.receivedAt.toISOString(),
  });
}

/** Classify one message and write its verdict (and effects). */
async function processMessage(prisma: PrismaLike, m: MailboxMessage, ctx: GapSendContext, deps: MailboxDeps, now: Date, actor: string, report: MailboxReport): Promise<void> {
  const v = classifyMailboxMessage(m, ctx, deps.mailbox);
  const at = { threadId: m.threadId, receivedAt: m.receivedAt.toISOString() };
  if (v.kind === 'own') {
    report.own += 1;
    await audit(prisma, MAILBOX_KINDS.own, actor, m.id, at);
  } else if (v.kind === 'canary') {
    await storeInbound(prisma, m, report);
    report.canaries += 1;
    await audit(prisma, MAILBOX_KINDS.canary, actor, m.id, { from: lower(m.fromEmail), subject: m.subject, inboundMessageId: m.id, ...at });
  } else if (v.kind === 'unrelated') {
    report.unrelated += 1;
    // Only what the late-attribution sweep needs; the mail stays in Gmail.
    await audit(prisma, MAILBOX_KINDS.unrelated, actor, m.id, { from: lower(m.fromEmail), ...at });
  } else if (v.kind === 'bounce') await handleBounce(prisma, m, v.dsn, ctx, actor, report, deps.bounce ?? recordHardBounce);
  else if (v.kind === 'auto_reply') {
    report.autoReplies += 1;
    await audit(prisma, MAILBOX_KINDS.autoReply, actor, m.id, { from: lower(m.fromEmail), reason: v.reason, ...at });
  } else await handleReply(prisma, m, v, now, actor, report, deps.ingest ?? ingestReply);
}

/** Quarantined messages with no resolution row: the ones a human has not seen processed. */
async function unresolvedQuarantines(prisma: PrismaLike): Promise<string[]> {
  const q: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { subject_type: SUBJECT_TYPE, kind: MAILBOX_KINDS.quarantined }, select: { subject_id: true } });
  const ids = [...new Set(q.map((r) => r.subject_id))];
  if (ids.length === 0) return [];
  const done: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { subject_type: SUBJECT_TYPE, kind: MAILBOX_KINDS.quarantineResolved, subject_id: { in: ids } }, select: { subject_id: true } });
  const resolved = new Set(done.map((r) => r.subject_id));
  return ids.filter((id) => !resolved.has(id)).sort();
}

/**
 * Ops closeout 13A: an operator read a quarantined message in Gmail and acted
 * on it (or it needs nothing). Only this, or a successful retry, stops it
 * being reported: the cron stays in error until then.
 */
export async function resolveQuarantine(prisma: PrismaLike, gmailMessageId: string, actor: string, note: string): Promise<void> {
  await audit(prisma, MAILBOX_KINDS.quarantineResolved, actor, gmailMessageId, { by: 'operator', note });
}

/** Record a failed attempt; true when the message is now quarantined (a verdict). */
async function recordFailure(prisma: PrismaLike, id: string, message: string, actor: string, report: MailboxReport): Promise<boolean> {
  try {
    const attempts = await prisma.gapAuditEvent.count({ where: { subject_type: SUBJECT_TYPE, subject_id: id, kind: MAILBOX_KINDS.error } });
    await audit(prisma, MAILBOX_KINDS.error, actor, id, { attempt: attempts + 1, error: message.slice(0, 500) });
    if (attempts + 1 >= MAILBOX_MAX_ATTEMPTS) {
      await audit(prisma, MAILBOX_KINDS.quarantined, actor, id, { attempts: attempts + 1, lastError: message.slice(0, 500) });
      report.quarantined += 1;
      return true;
    }
  } catch (auditErr) {
    report.errors.push(`${id}: attempt not recorded: ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
  }
  return false;
}

/**
 * Late attribution (review S4, re-review S2): provisional verdicts of the
 * last MAILBOX_REATTRIBUTE_SECONDS that attribute against the CURRENT send
 * context, judged from the audit payload alone. Returns their message ids.
 */
async function reattributable(prisma: PrismaLike, ctx: GapSendContext, now: Date): Promise<string[]> {
  const since = new Date(now.getTime() - MAILBOX_REATTRIBUTE_SECONDS * 1000);
  const rows: Array<{ kind: string; subject_id: string; payload: unknown }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: SUBJECT_TYPE, kind: { in: PROVISIONAL_KINDS }, created_at: { gte: since } },
    select: { kind: true, subject_id: true, payload: true },
  });
  const candidates = rows.filter((r) => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === MAILBOX_KINDS.unattributedBounce) {
      return Array.isArray(p.recipients) && p.recipients.some((x) => typeof x === 'string' && ctx.bounceRecipients.has(x));
    }
    const receivedAt = typeof p.receivedAt === 'string' ? new Date(p.receivedAt) : null;
    return typeof p.from === 'string' && typeof p.threadId === 'string' && receivedAt !== null && attribute(ctx, p.from, p.threadId, receivedAt) !== null;
  });
  if (candidates.length === 0) return [];
  const ids = [...new Set(candidates.map((r) => r.subject_id))];
  const final: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: SUBJECT_TYPE, subject_id: { in: ids }, kind: { in: FINAL_KINDS } },
    select: { subject_id: true },
  });
  const done = new Set(final.map((r) => r.subject_id));
  return ids.filter((id) => !done.has(id));
}

export async function pollGapMailbox(prisma: PrismaLike, input: { now: Date; actor?: string }, deps: MailboxDeps): Promise<MailboxReport> {
  const actor = input.actor ?? 'cron:gap-mailbox';
  const nowS = Math.floor(input.now.getTime() / 1000);
  const budget = deps.budget ?? MAILBOX_RUN_BUDGET;
  const stored = await prisma.systemConfig.findUnique({ where: { key: GAP_MAILBOX_WATERMARK_KEY } });
  const parsed = stored?.value ? Number.parseInt(stored.value, 10) : NaN;
  const since = Number.isFinite(parsed) ? parsed - MAILBOX_OVERLAP_SECONDS : nowS - MAILBOX_FIRST_LOOKBACK_SECONDS;

  // Throws on an unreadable mailbox: nothing moves.
  const listing = await deps.listIds(since);
  const ctx = await loadGapSendContext(prisma);
  const report: MailboxReport = {
    since, seen: listing.ids.length, fetched: 0, backlog: 0, replies: 0, hardBounces: 0, policyBounces: 0, softBounces: 0, unattributedBounces: 0,
    autoReplies: 0, unrelated: 0, own: 0, canaries: 0, alreadyHandled: 0, reattributed: 0, quarantined: 0, unresolvedQuarantine: [], inboundMessagesCreated: 0,
    bouncedAddresses: [], errors: [], watermark: null,
  };

  // One read for every id in the window: handled mail is never fetched again.
  const handled = new Set<string>();
  for (let i = 0; i < listing.ids.length; i += 1000) {
    const chunk = listing.ids.slice(i, i + 1000);
    const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({
      where: { subject_type: SUBJECT_TYPE, subject_id: { in: chunk }, kind: { in: HANDLED_KINDS } },
      select: { subject_id: true },
    });
    for (const r of rows) handled.add(r.subject_id);
  }
  const pending = listing.ids.filter((id) => !handled.has(id));
  report.alreadyHandled = listing.ids.length - pending.length;
  report.backlog = Math.max(0, pending.length - budget);

  let newest = Number.isFinite(parsed) ? parsed : null;
  let stopped = false;
  for (const id of pending.slice(0, budget)) {
    let receivedS: number | null = null;
    try {
      const m = await deps.fetch(id);
      report.fetched += 1;
      receivedS = Math.floor(m.receivedAt.getTime() / 1000);
      await processMessage(prisma, m, ctx, deps, input.now, actor, report);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.errors.push(`${id}: ${message}`);
      // Under the cap the watermark stops before this message so it is read
      // again next run; at the cap it is quarantined and intake moves on.
      if (!(await recordFailure(prisma, id, message, actor, report))) {
        stopped = true;
        break;
      }
    }
    if (receivedS !== null && (newest === null || receivedS > newest)) newest = Math.min(receivedS, nowS);
  }

  // A narrowed window processed in full: everything before its end is read.
  if (!stopped && report.backlog === 0 && listing.windowEnd !== null) {
    if (Number.isFinite(parsed) && listing.windowEnd <= parsed) {
      report.errors.push(`listing window ending ${listing.windowEnd} is inside the overlap of watermark ${parsed}: more mail than one listing holds`);
    }
    newest = Math.max(newest ?? 0, Math.min(listing.windowEnd - 1, nowS));
  }

  // Late attribution: provisional verdicts whose send has since been recorded.
  if (!stopped) {
    const late = await reattributable(prisma, ctx, input.now);
    for (const id of late.slice(0, Math.max(0, budget - report.fetched))) {
      try {
        const m = await deps.fetch(id);
        report.fetched += 1;
        await processMessage(prisma, m, ctx, deps, input.now, actor, report);
        report.reattributed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        report.errors.push(`${id}: ${message}`);
        await recordFailure(prisma, id, message, actor, report);
      }
    }
  }

  // Ops closeout 13A: a quarantine is never silent. Each run retries the
  // unresolved ones within the budget; what still fails is reported, so the
  // cron stays in error until a retry succeeds or an operator resolves it.
  const quarantined = await unresolvedQuarantines(prisma);
  for (const id of quarantined) {
    if (stopped || report.fetched >= budget) {
      report.unresolvedQuarantine.push(id);
      continue;
    }
    try {
      const m = await deps.fetch(id);
      report.fetched += 1;
      await processMessage(prisma, m, ctx, deps, input.now, actor, report);
      await audit(prisma, MAILBOX_KINDS.quarantineResolved, actor, id, { by: 'retry' });
    } catch {
      report.unresolvedQuarantine.push(id);
    }
  }
  if (report.unresolvedQuarantine.length > 0) {
    report.errors.push(`${report.unresolvedQuarantine.length} quarantined mailbox message(s) unresolved (read them in Gmail, then resolve): ${report.unresolvedQuarantine.join(', ')}`);
  }

  if (newest !== null && newest !== (Number.isFinite(parsed) ? parsed : null)) {
    await prisma.systemConfig.upsert({
      where: { key: GAP_MAILBOX_WATERMARK_KEY },
      create: { key: GAP_MAILBOX_WATERMARK_KEY, value: String(newest) },
      update: { value: String(newest) },
    });
  }
  report.watermark = newest;
  return report;
}
