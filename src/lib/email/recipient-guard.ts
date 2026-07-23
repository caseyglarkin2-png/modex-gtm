import type { PrismaClient } from '@prisma/client';
import { INTERNAL_DOMAINS } from './reply-precision';

export interface RecipientGuardDecision {
  ok: boolean;
  reason?: string;
  domain: string;
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

export function getEmailLocalPart(email: string): string {
  return email.split('@')[0]?.toLowerCase().trim() || '';
}

// Role / shared / machine mailboxes: never a single named person. Sending a
// "truly individual" 1:1 to one of these is off-strategy (it is not a person on
// the buying committee) AND a reputation risk — shared inboxes report spam
// liberally, and machine mailboxes (no-reply@, postmaster@) can trigger loops.
// The inbound classifier keeps its OWN copy of a similar list tuned for reply
// detection (reply-precision.ts AUTOMATED_LOCAL_PARTS + VENDOR_GENERIC_LOCAL_PARTS);
// this set is the OUTBOUND policy and evolves independently, so the two are
// deliberately not shared.
const ROLE_LOCAL_PARTS = new Set([
  // machine mailboxes
  'no-reply', 'noreply', 'donotreply', 'do-not-reply', 'do_not_reply', 'noreplies',
  'postmaster', 'mailer-daemon', 'mailerdaemon', 'mail-daemon', 'bounce', 'bounces', 'bounced',
  'notifications', 'notification', 'notify', 'alerts', 'alert', 'automated', 'autoreply', 'auto-reply',
  'mailer', 'newsletter', 'news', 'updates', 'update', 'unsubscribe', 'listserv', 'majordomo',
  // shared / role mailboxes
  'info', 'sales', 'support', 'help', 'helpdesk', 'service', 'services', 'contact', 'contactus',
  'hello', 'team', 'admin', 'office', 'general', 'inquiries', 'enquiries', 'feedback',
  'billing', 'invoices', 'receipts', 'accounts', 'accounting', 'ar', 'ap', 'payments',
  'security', 'care', 'customercare', 'customerservice',
  'marketing', 'press', 'media', 'pr', 'communications',
  'hr', 'careers', 'jobs', 'recruiting', 'recruitment', 'talent',
  'legal', 'privacy', 'compliance', 'abuse', 'webmaster', 'it', 'sysadmin',
]);

// A local part is a role mailbox when it matches exactly, or its leading segment
// (before a +, ., -, or _ tag) does: `sales.us`, `info+lead`, `support-team` are
// shared aliases; a person's `john.sales` (name first) is not caught because the
// leading segment `john` is not a role word.
export function isRoleMailbox(localPart: string): boolean {
  const lp = localPart.toLowerCase();
  if (ROLE_LOCAL_PARTS.has(lp)) return true;
  const lead = lp.split(/[+.\-_]/)[0];
  return ROLE_LOCAL_PARTS.has(lead);
}

// Window + ceiling for the per-person frequency cap. Generous by default: it is a
// reputation backstop against runaway over-contact (the same person enqueued by
// two motions, a loop), NOT a cadence controller — a normal warm 1:1 is 1-2
// touches, well under the ceiling. Env-tunable so Casey can tighten it.
const FREQ_WINDOW_DAYS = Number(process.env.RECIPIENT_FREQ_WINDOW_DAYS ?? 30);
const FREQ_MAX_SENDS = Number(process.env.RECIPIENT_FREQ_MAX_SENDS ?? 8);

/**
 * Gate a single outbound recipient. Called for every recipient (to + cc) inside
 * evaluateSendGuards, so it protects BOTH the manual /discovery route and the
 * automated Draft-Queue drain. Blocks (ok:false) on: a malformed address, a
 * role/shared/machine mailbox, a prior hard bounce, or the per-person frequency
 * cap. Internal domains bypass every check (trusted test/CC sends). The two DB
 * lookups FAIL OPEN: a query error allows the send, because the guard is a
 * backstop, not the only gate — the send itself, and the queue's other guards,
 * still run, and blocking every send on a transient DB blip is worse than the
 * rare miss it would prevent.
 */
export async function evaluateRecipientEligibility(
  prisma: PrismaClient,
  email: string,
  _options?: { allowPayloadReady?: boolean; payloadReady?: boolean; payloadDoNotContact?: boolean }
): Promise<RecipientGuardDecision> {
  void _options;
  const domain = getEmailDomain(email);
  if (!domain) {
    return { ok: false, reason: 'Invalid email domain', domain };
  }

  // Internal domains (freightroll.com / yardflow.ai / dwtb.dev) are us — never a
  // prospect. Skip the role + bounce + frequency checks so a test or CC to an
  // internal alias (sales@freightroll.com) is never blocked.
  if ((INTERNAL_DOMAINS as readonly string[]).includes(domain)) {
    return { ok: true, domain };
  }

  const localPart = getEmailLocalPart(email);
  if (isRoleMailbox(localPart)) {
    return { ok: false, reason: `Role or shared mailbox (not an individual): ${localPart}@`, domain };
  }

  try {
    const hardBounces = await prisma.emailLog.count({
      where: { to_email: { equals: email, mode: 'insensitive' }, bounce_type: 'hard' },
    });
    if (hardBounces > 0) {
      return { ok: false, reason: 'Previously hard-bounced; permanently suppressed', domain };
    }

    const since = new Date(Date.now() - FREQ_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recentSends = await prisma.emailLog.count({
      where: { to_email: { equals: email, mode: 'insensitive' }, sent_at: { gte: since } },
    });
    if (recentSends >= FREQ_MAX_SENDS) {
      return { ok: false, reason: `Frequency cap: ${recentSends} sends in last ${FREQ_WINDOW_DAYS}d (max ${FREQ_MAX_SENDS})`, domain };
    }
  } catch {
    // Fail open: a lookup error must not block the send. See the doc comment.
    return { ok: true, domain };
  }

  return { ok: true, domain };
}
