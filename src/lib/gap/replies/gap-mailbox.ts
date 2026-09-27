/**
 * GAP MAILBOX INTAKE (red team T9, 2026-09-26).
 *
 * GAP sends from casey@yardflow.ai (GAP_GMAIL_USER_EMAIL) but never read that
 * mailbox back. This consumes it as execution feedback, read-only toward
 * Gmail (nothing is marked, labeled or moved):
 *
 *   DSN (hard, 5.x.x)   the canonical hard-bounce write (src/lib/email/bounce.ts):
 *                       email_status 'hard_bounce' + do_not_contact + bounce
 *                       notification. Soft (4.x.x / delayed) is audited only.
 *                       A bounce is NEVER a reply.
 *   human reply         in a GAP thread, or from the account domain of a person
 *                       GAP emailed, after that first send: stored as an
 *                       InboundMessage (+ EmailThread, a `reply` notification),
 *                       and the existing ingestReply pauses the live enrollment
 *                       of the replier AND of the GAP-emailed recipient. Next
 *                       touch stops on it (next-touch.ts). Its CONTENT is not
 *                       buyer truth until a human records a disposition.
 *   auto reply / OOO    audited only; never a stop, never buyer truth
 *   anything else       ignored (not stored: unrelated mail stays in Gmail)
 *
 * Idempotent per Gmail message id (a `mailbox.*` GapAuditEvent per handled
 * message). Watermark: SystemConfig `gap_mailbox_watermark` (epoch seconds of
 * the newest message handled), read with a fixed overlap so a late-indexed
 * message is never skipped; the per-message key makes the overlap free. An
 * unreadable mailbox throws before the watermark moves.
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

export const MAILBOX_KINDS = {
  reply: 'mailbox.reply',
  hardBounce: 'mailbox.hard_bounce',
  softBounce: 'mailbox.soft_bounce',
  autoReply: 'mailbox.auto_reply',
} as const;
const HANDLED_KINDS = Object.values(MAILBOX_KINDS);
const SUBJECT_TYPE = 'gmail_message';

export { FREEMAIL_DOMAINS } from './domains';

export interface DsnFinding {
  action: string | null;
  status: string | null;
  recipients: string[];
  hard: boolean;
}

const lower = (s: string) => s.trim().toLowerCase();
const domainOf = (email: string) => lower(email.split('@')[1] ?? '');
const ADDRESS = /[^\s<>,;"'()]+@[^\s<>,;"'()]+\.[a-z]{2,}/gi;

function header(m: MailboxMessage, name: string): string {
  const key = Object.keys(m.headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? m.headers[key] ?? '' : '';
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
    failedHeader.length > 0;
  if (!isDsn) return null;

  const ds = m.deliveryStatus ?? '';
  const action = (/^Action:\s*([a-z]+)/im.exec(ds)?.[1] ?? null)?.toLowerCase() ?? null;
  const status = /^Status:\s*([245]\.\d{1,3}\.\d{1,3})/im.exec(ds)?.[1] ?? null;
  const recipients = new Set<string>();
  for (const line of ds.split(/\r?\n/)) {
    const m1 = /^(?:Final|Original)-Recipient:\s*rfc822;\s*(\S+)/i.exec(line.trim());
    if (m1) recipients.add(lower(m1[1].replace(/[<>]/g, '')));
  }
  for (const a of failedHeader.match(ADDRESS) ?? []) recipients.add(lower(a));

  const body = `${m.rawText}\n${m.snippet}`;
  const permanentBody = /\b(550|5\.1\.1|address couldn'?t be found|does not exist|no such user|user unknown|recipient address rejected|mailbox unavailable)\b/i.test(body);
  const hard = status ? status.startsWith('5.') && action !== 'delayed' : action === 'failed' || (failedHeader.length > 0 && permanentBody);
  return { action, status, recipients: [...recipients].filter((r) => !OWN_DOMAINS.has(domainOf(r))), hard };
}

interface SentRef {
  personaId: number | null;
  recipient: string;
  sentAt: Date;
}

export interface GapSendContext {
  /** Gmail thread id -> the GAP sends in it. */
  threads: Map<string, SentRef[]>;
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
  const refs: Array<SentRef & { threadId: string | null }> = [];
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
  const domains = new Map<string, SentRef[]>();
  for (const ref of refs) {
    if (!ref.recipient.includes('@')) continue;
    const base: SentRef = { personaId: ref.personaId, recipient: ref.recipient, sentAt: ref.sentAt };
    if (ref.threadId) threads.set(ref.threadId, [...(threads.get(ref.threadId) ?? []), base]);
    const dom = domainOf(ref.recipient);
    if (dom && !FREEMAIL_DOMAINS.has(dom) && !OWN_DOMAINS.has(dom)) domains.set(dom, [...(domains.get(dom) ?? []), base]);
  }
  return { threads, domains };
}

export type MailboxVerdict =
  | { kind: 'own' }
  | { kind: 'bounce'; dsn: DsnFinding }
  | { kind: 'auto_reply'; reason: string; attributedTo: SentRef[] }
  | { kind: 'reply'; attribution: 'gap_thread' | 'account_domain'; attributedTo: SentRef[] }
  | { kind: 'unrelated'; reason: string };

/** Pure: what one inbox message is to GAP. */
export function classifyMailboxMessage(m: MailboxMessage, ctx: GapSendContext, mailbox: string): MailboxVerdict {
  const from = lower(m.fromEmail);
  if (from === lower(mailbox)) return { kind: 'own' };
  const dsn = parseDsn(m);
  if (dsn) return { kind: 'bounce', dsn };

  const inThread = (ctx.threads.get(m.threadId) ?? []).filter((s) => s.sentAt.getTime() <= m.receivedAt.getTime());
  const dom = domainOf(from);
  const byDomain = !inThread.length && dom && !FREEMAIL_DOMAINS.has(dom) && !OWN_DOMAINS.has(dom)
    ? (ctx.domains.get(dom) ?? []).filter((s) => s.sentAt.getTime() < m.receivedAt.getTime())
    : [];
  const attributedTo = inThread.length ? inThread : byDomain;
  if (attributedTo.length === 0) return { kind: 'unrelated', reason: 'not_a_gap_thread_or_account' };

  const verdict = classifyInboundReply({ fromEmail: from, headers: m.headers, subject: m.subject, bodyText: m.bodyText, knownContact: true });
  if (!verdict.isHumanReply) return { kind: 'auto_reply', reason: verdict.reason, attributedTo };
  return { kind: 'reply', attribution: inThread.length ? 'gap_thread' : 'account_domain', attributedTo };
}

export interface MailboxReport {
  since: number;
  seen: number;
  replies: number;
  hardBounces: number;
  softBounces: number;
  autoReplies: number;
  unrelated: number;
  own: number;
  alreadyHandled: number;
  inboundMessagesCreated: number;
  bouncedAddresses: string[];
  errors: string[];
  watermark: number | null;
}

export interface MailboxDeps {
  list: (afterEpoch: number) => Promise<MailboxMessage[]>;
  mailbox: string;
  ingest?: typeof ingestReply;
  bounce?: typeof recordHardBounce;
}

async function audit(prisma: PrismaLike, kind: string, actor: string, messageId: string, payload: Record<string, unknown>): Promise<void> {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: SUBJECT_TYPE, subject_id: messageId, payload } });
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
  const report: MailboxReport = { since, seen: messages.length, replies: 0, hardBounces: 0, softBounces: 0, autoReplies: 0, unrelated: 0, own: 0, alreadyHandled: 0, inboundMessagesCreated: 0, bouncedAddresses: [], errors: [], watermark: null };
  let newest = Number.isFinite(parsed) ? parsed : null;

  for (const m of [...messages].sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())) {
    const receivedS = Math.floor(m.receivedAt.getTime() / 1000);
    try {
      const done = await prisma.gapAuditEvent.findFirst({ where: { subject_type: SUBJECT_TYPE, subject_id: m.id, kind: { in: HANDLED_KINDS } }, select: { id: true } });
      if (done) {
        report.alreadyHandled += 1;
      } else {
        const v = classifyMailboxMessage(m, ctx, deps.mailbox);
        if (v.kind === 'own') report.own += 1;
        else if (v.kind === 'unrelated') report.unrelated += 1;
        else if (v.kind === 'bounce') {
          if (v.dsn.hard && v.dsn.recipients.length > 0) {
            for (const email of v.dsn.recipients) {
              await bounce(prisma, { email, source: 'gap_mailbox_dsn', sourceId: m.id, subject: m.subject });
              report.bouncedAddresses.push(email);
            }
            report.hardBounces += 1;
            await audit(prisma, MAILBOX_KINDS.hardBounce, actor, m.id, { recipients: v.dsn.recipients, status: v.dsn.status, action: v.dsn.action, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() });
          } else {
            report.softBounces += 1;
            await audit(prisma, MAILBOX_KINDS.softBounce, actor, m.id, { recipients: v.dsn.recipients, status: v.dsn.status, action: v.dsn.action, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() });
          }
        } else if (v.kind === 'auto_reply') {
          report.autoReplies += 1;
          await audit(prisma, MAILBOX_KINDS.autoReply, actor, m.id, { from: lower(m.fromEmail), reason: v.reason, threadId: m.threadId, receivedAt: m.receivedAt.toISOString() });
        } else {
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
          // Pause the replier's live enrollment and, for a colleague or a
          // thread reply, the GAP-emailed recipient's too.
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
      }
      if (newest === null || receivedS > newest) newest = Math.min(receivedS, nowS);
    } catch (err) {
      report.errors.push(`${m.id}: ${err instanceof Error ? err.message : String(err)}`);
      // A message that failed is re-read next run: the watermark stops before it.
      break;
    }
  }

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
