/**
 * GAP MAILBOX INTAKE (red team T9, 2026-09-26).
 *
 * GAP sends from casey@yardflow.ai (GAP_GMAIL_USER_EMAIL) but never read that
 * mailbox back. This consumes it as execution feedback, read-only toward
 * Gmail (nothing is marked, labeled or moved):
 *
 *   DSN, bad address    5.1.x (1, 2, 3, 6, 10) or an explicit unknown-user
 *                       diagnostic, for a recipient GAP actually sent to: the
 *                       canonical hard-bounce write (src/lib/email/bounce.ts),
 *                       email_status 'hard_bounce' + do_not_contact + bounce
 *                       notification. A bounce is NEVER a reply.
 *   DSN, policy block   5.7.x, 5.4.x, 5.2.x, a bare 550 with no reason
 *                       (Release C review B1): audited only. A block says
 *                       something about US (reputation, content, a full
 *                       mailbox), never that the address is bad, so it never
 *                       writes do-not-contact.
 *   DSN, soft/delayed   4.x.x or Action: delayed: audited only.
 *   DSN for an address GAP never sent to (N3): audited only.
 *   human reply         in a GAP thread, from an address GAP emailed (S3), or
 *                       from the account domain of a person GAP emailed, after
 *                       that send: stored as an InboundMessage (+ EmailThread,
 *                       a `reply` notification), and the existing ingestReply
 *                       pauses the live enrollment of the replier AND of the
 *                       GAP-emailed recipient. Next touch stops on it
 *                       (next-touch.ts). Its CONTENT is not buyer truth until
 *                       a human records a disposition.
 *   auto reply / OOO    audited only; never a stop, never buyer truth
 *   anything else       ignored (not stored: unrelated mail stays in Gmail)
 *
 * Idempotent per Gmail message id (a `mailbox.*` GapAuditEvent per handled
 * message). Watermark: SystemConfig `gap_mailbox_watermark` (epoch seconds of
 * the newest message handled), read with a fixed overlap so a late-indexed
 * message is never skipped; the per-message key makes the overlap free.
 *
 *   - An unreadable mailbox throws before the watermark moves.
 *   - Messages are handled OLDEST first and the lister returns the oldest of
 *     the window (S1), so a backlog drains forward run by run.
 *   - A message that fails is retried; after MAILBOX_MAX_ATTEMPTS it is
 *     quarantined (audited, surfaced as an error) so one poison message never
 *     halts intake silently (S2). Any error marks the cron run failed.
 *   - Unrelated mail younger than MAILBOX_UNRELATED_HOLD_SECONDS holds the
 *     watermark (S4): a reply that arrived before its send was recorded is
 *     re-classified once the send lands, instead of being lost as unrelated.
 */
import { classifyInboundReply } from '@/lib/email/reply-precision';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { recordHardBounce } from '@/lib/email/bounce';
import { ingestReply } from './ingest';
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, DRAFTED, MANUAL_SENT } from '../execution/draft-ledger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GAP_MAILBOX_WATERMARK_KEY = 'gap_mailbox_watermark';
/** Re-read this much before the watermark every run (late indexing, clock skew). */
export const MAILBOX_OVERLAP_SECONDS = 60 * 60;
/** First run looks back this far. */
export const MAILBOX_FIRST_LOOKBACK_SECONDS = 3 * 24 * 60 * 60;
/** A failing message is retried this many times, then quarantined. */
export const MAILBOX_MAX_ATTEMPTS = 3;
/** Unrelated mail this young holds the watermark, in case its send is recorded late. */
export const MAILBOX_UNRELATED_HOLD_SECONDS = 24 * 60 * 60;

export const MAILBOX_KINDS = {
  reply: 'mailbox.reply',
  hardBounce: 'mailbox.hard_bounce',
  policyBounce: 'mailbox.policy_bounce',
  softBounce: 'mailbox.soft_bounce',
  unattributedBounce: 'mailbox.bounce_unattributed',
  autoReply: 'mailbox.auto_reply',
  quarantined: 'mailbox.quarantined',
  error: 'mailbox.error',
} as const;
/** Kinds that mean "this message is done". `mailbox.error` is an attempt, not a verdict. */
const HANDLED_KINDS = Object.values(MAILBOX_KINDS).filter((k) => k !== MAILBOX_KINDS.error);
const SUBJECT_TYPE = 'gmail_message';

export { FREEMAIL_DOMAINS } from './domains';

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
/** An explicit "this mailbox does not exist" in the diagnostic or the notice text. */
const UNKNOWN_USER =
  /(user unknown|unknown user|no such user|no such (mailbox|recipient)|does not exist|doesn'?t exist|address couldn'?t be found|address not found|mailbox not found|recipient not found|user not found|unknown recipient|invalid recipient|RecipNotFound)/i;
/** Non-delivery report subjects, including Exchange's, whose sender is not a daemon mailbox. */
const NDR_SUBJECT = /^(undeliverable|undelivered mail|delivery status notification|mail delivery (failed|failure|subsystem)|returned mail|delivery (has )?failed|failure notice|non-?delivery)/i;
/** Out-of-office subjects the shared classifier misses: localized and vendor forms. */
const AUTO_REPLY_SUBJECT =
  /^(automatic reply|auto(matic)?[- ]?reply|out of (the )?office|abwesenheit\w*|automatische antwort|r[ée]ponse automatique|absence|absent|respuesta autom[áa]tica|fuera de la oficina|risposta automatica|fuori ufficio|afwezig|automatisch antwoord|resposta autom[áa]tica|ausente|autosvar|automatiskt svar|poza biurem)\b/i;

function header(m: MailboxMessage, name: string): string {
  const key = Object.keys(m.headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? m.headers[key] ?? '' : '';
}

function classOf(action: string | null, status: string | null, evidence: string): DsnClass {
  if (action === 'delayed' || (status && status.startsWith('4.'))) return 'soft';
  if (status && status.startsWith('5.')) {
    if (BAD_ADDRESS_STATUS.test(status)) return 'hard';
    const subject = status.split('.')[1];
    // 5.7 policy, 5.4 routing, 5.2 mailbox state, 5.3 system, 5.6 content,
    // 5.1.7/5.1.8 sender: a block about us, never proof the address is bad.
    if (subject !== '0' && subject !== '5') return 'policy';
    return UNKNOWN_USER.test(evidence) ? 'hard' : 'policy';
  }
  // No machine-readable status: only an explicit unknown-user text is a bad
  // address; a bare "550" or "failed" is a block of unknown cause.
  return UNKNOWN_USER.test(evidence) ? 'hard' : 'policy';
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
  const status = /^Status:\s*([245]\.\d{1,3}\.\d{1,3})/im.exec(ds)?.[1] ?? null;
  const diagnostic = /^Diagnostic-Code:\s*(.+)$/im.exec(ds)?.[1] ?? '';
  const recipients = new Set<string>();
  for (const line of ds.split(/\r?\n/)) {
    const m1 = /^(?:Final|Original)-Recipient:\s*rfc822;\s*(\S+)/i.exec(line.trim());
    if (m1) recipients.add(lower(m1[1].replace(/[<>]/g, '')));
  }
  for (const a of failedHeader.match(ADDRESS) ?? []) recipients.add(lower(a));

  const dsnClass = classOf(action, status, `${diagnostic}\n${m.rawText}\n${m.snippet}`);
  return {
    action,
    status,
    recipients: [...recipients].filter((r) => !OWN_DOMAINS.has(domainOf(r))),
    dsnClass,
    hard: dsnClass === 'hard',
  };
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
  /** Exact recipient address -> GAP sends to it (S3; N3 bounce attribution). */
  recipients: Map<string, SentRef[]>;
  /** Account domain -> GAP sends to it (freemail and own domains excluded). */
  domains: Map<string, SentRef[]>;
}

/** Every GAP send (manual, direct, draft-sent) and its Gmail thread: the attribution context. */
export async function loadGapSendContext(prisma: PrismaLike): Promise<GapSendContext> {
  const rows: Array<{ kind: string; payload: unknown; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [MANUAL_SENT, DIRECT_SENT, DRAFTED, DRAFT_SENT] } },
    select: { kind: true, payload: true, created_at: true },
  });
  const drafted = new Map<string, { personaId: number | null; recipient: string; threadId: string | null }>();
  const refs: SentRef[] = [];
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === DRAFTED && typeof p.gmailDraftId === 'string') {
      drafted.set(p.gmailDraftId, { personaId: typeof p.personaId === 'number' ? p.personaId : null, recipient: lower(String(p.recipient ?? '')), threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : null });
    }
  }
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const sentAt = typeof p.sentAt === 'string' ? new Date(p.sentAt) : r.created_at;
    if (r.kind === MANUAL_SENT || r.kind === DIRECT_SENT) {
      refs.push({ personaId: typeof p.personaId === 'number' ? p.personaId : null, recipient: lower(String(p.recipient ?? '')), sentAt, threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : null });
    } else if (r.kind === DRAFT_SENT && typeof p.gmailDraftId === 'string') {
      const d = drafted.get(p.gmailDraftId);
      if (d) refs.push({ personaId: d.personaId, recipient: d.recipient, sentAt, threadId: typeof p.gmailThreadId === 'string' ? p.gmailThreadId : d.threadId });
    }
  }
  const threads = new Map<string, SentRef[]>();
  const recipients = new Map<string, SentRef[]>();
  const domains = new Map<string, SentRef[]>();
  for (const ref of refs) {
    if (!ref.recipient.includes('@')) continue;
    if (ref.threadId) threads.set(ref.threadId, [...(threads.get(ref.threadId) ?? []), ref]);
    recipients.set(ref.recipient, [...(recipients.get(ref.recipient) ?? []), ref]);
    const dom = domainOf(ref.recipient);
    if (dom && !FREEMAIL_DOMAINS.has(dom) && !OWN_DOMAINS.has(dom)) domains.set(dom, [...(domains.get(dom) ?? []), ref]);
  }
  return { threads, recipients, domains };
}

export type ReplyAttribution = 'gap_thread' | 'gap_recipient' | 'account_domain';

export type MailboxVerdict =
  | { kind: 'own' }
  | { kind: 'bounce'; dsn: DsnFinding }
  | { kind: 'auto_reply'; reason: string; attributedTo: SentRef[] }
  | { kind: 'reply'; attribution: ReplyAttribution; attributedTo: SentRef[] }
  | { kind: 'unrelated'; reason: string };

/** Pure: what one inbox message is to GAP. */
export function classifyMailboxMessage(m: MailboxMessage, ctx: GapSendContext, mailbox: string): MailboxVerdict {
  const from = lower(m.fromEmail);
  if (from === lower(mailbox)) return { kind: 'own' };
  const dsn = parseDsn(m);
  if (dsn) return { kind: 'bounce', dsn };

  const before = (s: SentRef) => s.sentAt.getTime() <= m.receivedAt.getTime();
  // Attribution, most specific first: the GAP thread, then the exact address
  // GAP emailed (a reply on a new thread), then the account domain.
  const inThread = (ctx.threads.get(m.threadId) ?? []).filter(before);
  const byRecipient = inThread.length ? [] : (ctx.recipients.get(from) ?? []).filter(before);
  const dom = domainOf(from);
  const byDomain = !inThread.length && !byRecipient.length && dom && !FREEMAIL_DOMAINS.has(dom) && !OWN_DOMAINS.has(dom)
    ? (ctx.domains.get(dom) ?? []).filter((s) => s.sentAt.getTime() < m.receivedAt.getTime())
    : [];
  const attribution: ReplyAttribution = inThread.length ? 'gap_thread' : byRecipient.length ? 'gap_recipient' : 'account_domain';
  const attributedTo = inThread.length ? inThread : byRecipient.length ? byRecipient : byDomain;
  if (attributedTo.length === 0) return { kind: 'unrelated', reason: 'not_a_gap_thread_or_account' };

  if (AUTO_REPLY_SUBJECT.test((m.subject ?? '').trim())) return { kind: 'auto_reply', reason: 'auto_reply_subject_localized', attributedTo };
  const verdict = classifyInboundReply({ fromEmail: from, headers: m.headers, subject: m.subject, bodyText: m.bodyText, knownContact: true });
  if (!verdict.isHumanReply) return { kind: 'auto_reply', reason: verdict.reason, attributedTo };
  return { kind: 'reply', attribution, attributedTo };
}

export interface MailboxReport {
  since: number;
  seen: number;
  replies: number;
  hardBounces: number;
  policyBounces: number;
  softBounces: number;
  unattributedBounces: number;
  autoReplies: number;
  unrelated: number;
  /** Unrelated messages young enough to hold the watermark (S4). */
  held: number;
  own: number;
  alreadyHandled: number;
  quarantined: number;
  inboundMessagesCreated: number;
  bouncedAddresses: string[];
  /** Any entry marks the cron run failed. */
  errors: string[];
  watermark: number | null;
}

/** A listing of the window, oldest first; `truncated` when the window held more than one run reads. */
export type MailboxListing = MailboxMessage[] & { truncated?: boolean };

export interface MailboxDeps {
  list: (afterEpoch: number) => Promise<MailboxListing>;
  mailbox: string;
  ingest?: typeof ingestReply;
  bounce?: typeof recordHardBounce;
}

async function audit(prisma: PrismaLike, kind: string, actor: string, messageId: string, payload: Record<string, unknown>): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: SUBJECT_TYPE, subject_id: messageId, payload } });
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
  // N3: act only for an address GAP actually sent to.
  const ours = dsn.recipients.filter((r) => ctx.recipients.has(r));
  const others = dsn.recipients.filter((r) => !ctx.recipients.has(r));
  if (ours.length === 0) {
    report.unattributedBounces += 1;
    await audit(prisma, MAILBOX_KINDS.unattributedBounce, actor, m.id, { ...base, recipients: others, reason: 'not_a_gap_recipient' });
    return;
  }
  if (dsn.dsnClass === 'hard') {
    for (const email of ours) {
      const threadIds = [...new Set([m.threadId, ...(ctx.recipients.get(email) ?? []).map((s) => s.threadId)].filter((t): t is string => !!t))];
      await bounce(prisma, { email, source: 'gap_mailbox_dsn', sourceId: m.id, subject: m.subject, emailLogScope: { threadIds } });
      report.bouncedAddresses.push(email);
    }
    report.hardBounces += 1;
    await audit(prisma, MAILBOX_KINDS.hardBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  } else if (dsn.dsnClass === 'policy') {
    report.policyBounces += 1;
    await audit(prisma, MAILBOX_KINDS.policyBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  } else {
    report.softBounces += 1;
    await audit(prisma, MAILBOX_KINDS.softBounce, actor, m.id, { ...base, recipients: ours, ignoredRecipients: others });
  }
}

async function handleReply(prisma: PrismaLike, m: MailboxMessage, v: Extract<MailboxVerdict, { kind: 'reply' }>, input: { now: Date }, actor: string, report: MailboxReport, ingest: typeof ingestReply): Promise<void> {
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
  const bell = await prisma.notification.findFirst({ where: { source_id: m.id, type: 'reply' }, select: { id: true } });
  if (!bell) {
    await prisma.notification.create({ data: { type: 'reply', persona_email: from, subject: m.subject, preview: m.snippet.slice(0, 200), source_id: m.id, read: false } });
  }
  // Pause the replier's live enrollment and, for a colleague or a thread
  // reply, the GAP-emailed recipient's too.
  const contacts = new Set([from, ...v.attributedTo.map((s) => s.recipient)]);
  for (const contactEmail of contacts) {
    await ingest(prisma, { contactEmail, source: 'gmail', inboundMessageId: m.id, receivedAt: m.receivedAt, isAutoresponder: false, now: input.now });
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

export async function pollGapMailbox(prisma: PrismaLike, input: { now: Date; actor?: string }, deps: MailboxDeps): Promise<MailboxReport> {
  const actor = input.actor ?? 'cron:gap-mailbox';
  const nowS = Math.floor(input.now.getTime() / 1000);
  const stored = await prisma.systemConfig.findUnique({ where: { key: GAP_MAILBOX_WATERMARK_KEY } });
  const parsed = stored?.value ? Number.parseInt(stored.value, 10) : NaN;
  const since = Number.isFinite(parsed) ? parsed - MAILBOX_OVERLAP_SECONDS : nowS - MAILBOX_FIRST_LOOKBACK_SECONDS;

  // Throws on an unreadable mailbox: the watermark does not move.
  const messages = await deps.list(since);
  const ctx = await loadGapSendContext(prisma);
  const ingest = deps.ingest ?? ingestReply;
  const bounce = deps.bounce ?? recordHardBounce;
  const report: MailboxReport = {
    since, seen: messages.length, replies: 0, hardBounces: 0, policyBounces: 0, softBounces: 0, unattributedBounces: 0, autoReplies: 0, unrelated: 0, held: 0, own: 0,
    alreadyHandled: 0, quarantined: 0, inboundMessagesCreated: 0, bouncedAddresses: [], errors: [], watermark: null,
  };
  if (messages.truncated) report.errors.push(`listing truncated: more mail since ${since} than one run reads; the backlog drains oldest first`);
  let newest = Number.isFinite(parsed) ? parsed : null;
  /** The watermark may not pass a young unrelated message (S4). */
  let hold: number | null = null;

  for (const m of [...messages].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())) {
    const receivedS = Math.floor(m.receivedAt.getTime() / 1000);
    try {
      const done = await prisma.gapAuditEvent.findFirst({ where: { subject_type: SUBJECT_TYPE, subject_id: m.id, kind: { in: HANDLED_KINDS } }, select: { id: true } });
      if (done) {
        report.alreadyHandled += 1;
      } else {
        const v = classifyMailboxMessage(m, ctx, deps.mailbox);
        if (v.kind === 'own') report.own += 1;
        else if (v.kind === 'unrelated') {
          report.unrelated += 1;
          if (nowS - receivedS < MAILBOX_UNRELATED_HOLD_SECONDS) {
            report.held += 1;
            if (hold === null) hold = receivedS - 1;
          }
        } else if (v.kind === 'bounce') await handleBounce(prisma, m, v.dsn, ctx, actor, report, bounce);
        else if (v.kind === 'auto_reply') {
          report.autoReplies += 1;
          await audit(prisma, MAILBOX_KINDS.autoReply, actor, m.id, { from: lower(m.fromEmail), reason: v.reason, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() });
        } else await handleReply(prisma, m, v, input, actor, report, ingest);
      }
      if (newest === null || receivedS > newest) newest = Math.min(receivedS, nowS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      report.errors.push(`${m.id}: ${message}`);
      // S2: count the attempt. Under the cap the watermark stops before this
      // message so it is re-read next run; at the cap it is quarantined (a
      // handled kind, surfaced in errors) and intake moves on.
      let quarantine = false;
      try {
        const attempts = await prisma.gapAuditEvent.count({ where: { subject_type: SUBJECT_TYPE, subject_id: m.id, kind: MAILBOX_KINDS.error } });
        await audit(prisma, MAILBOX_KINDS.error, actor, m.id, { attempt: attempts + 1, error: message.slice(0, 500), receivedAt: m.receivedAt.toISOString() });
        if (attempts + 1 >= MAILBOX_MAX_ATTEMPTS) {
          await audit(prisma, MAILBOX_KINDS.quarantined, actor, m.id, { attempts: attempts + 1, lastError: message.slice(0, 500), from: lower(m.fromEmail), subject: m.subject, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() });
          report.quarantined += 1;
          quarantine = true;
        }
      } catch (auditErr) {
        report.errors.push(`${m.id}: attempt not recorded: ${auditErr instanceof Error ? auditErr.message : String(auditErr)}`);
      }
      if (!quarantine) break;
      if (newest === null || receivedS > newest) newest = Math.min(receivedS, nowS);
    }
  }

  if (newest !== null && hold !== null) newest = Math.max(Number.isFinite(parsed) ? parsed : hold, Math.min(newest, hold));
  if (newest !== null) {
    await prisma.systemConfig.upsert({
      where: { key: GAP_MAILBOX_WATERMARK_KEY },
      create: { key: GAP_MAILBOX_WATERMARK_KEY, value: String(newest) },
      update: { value: String(newest) },
    });
    report.watermark = newest;
  }
  return report;
}
