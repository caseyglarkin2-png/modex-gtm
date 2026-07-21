/**
 * Reply precision gate — decides whether an inbound message is a genuine human reply.
 *
 * WHY THIS EXISTS (2026-07-21)
 * ----------------------------
 * /api/cron/check-inbox queried Gmail with `is:unread in:inbox after:<watermark>` and
 * treated EVERY unread inbox message as a prospect reply. Each one stamped a reply source
 * on the HubSpot contact, and `hasIntent()` in src/lib/revops/qualification/model.ts treats
 * a reply signal as the SQL gate. So a newsletter, a status-page alert, or an out-of-office
 * bounce could manufacture an SQL.
 *
 * Passing this gate is now what MAKES a reply a promotion basis: check-inbox stamps
 * `last_intent_source = VERIFIED_REPLY_INTENT_SOURCE` only on the contact behind the From
 * address, and that is the only reply value hasIntent() accepts. HubSpot's own
 * hs_sales_email_last_replied was dropped from the gate on 2026-07-21 — it is stamped on
 * every participant of a logged thread, so it cannot name a writer.
 *
 * Measured against the real casey@freightroll.com mailbox on 2026-07-21: of 33 inbound
 * "replies" to the "48-minute turns" campaign, only 2 were typed by a human. The rest
 * were out-of-office autoresponders, "no longer with the company" notices, and NDRs —
 * roughly a 15:1 poisoning ratio.
 *
 * This module is PURE: no I/O, no clock, no network. Test it, don't mock it.
 */

export const REPLY_REJECTION_REASONS = {
  NO_SENDER: 'no_sender',
  INTERNAL_SENDER: 'internal_sender',
  AUTO_SUBMITTED: 'auto_submitted_header',
  AUTORESPONDER_HEADER: 'autoresponder_header',
  PRECEDENCE_BULK: 'precedence_bulk',
  LIST_MAIL: 'list_mail',
  AUTOMATED_SENDER: 'automated_sender',
  AUTO_REPLY_SUBJECT: 'auto_reply_subject',
  BOUNCE_SUBJECT: 'bounce_subject',
  AUTO_REPLY_BODY: 'auto_reply_body',
  DEPARTURE_NOTICE: 'departure_notice',
} as const;

export type ReplyRejectionReason =
  (typeof REPLY_REJECTION_REASONS)[keyof typeof REPLY_REJECTION_REASONS];

export interface ReplyPrecisionInput {
  /** Envelope/From address, e.g. "jane@kroger.com". */
  fromEmail: string;
  /** Raw RFC-822 headers. Keys are matched case-insensitively. */
  headers?: Record<string, string>;
  subject?: string;
  /** Plain-text body (quoted history already stripped is fine). */
  bodyText?: string;
  /**
   * Whether a HubSpot contact exists for this sender. An unknown sender is NOT
   * rejected (a new logo knocking is the hottest signal there is) but is returned
   * at low confidence so the caller can hold it out of automated mutation.
   */
  knownContact?: boolean;
}

export interface ReplyPrecisionVerdict {
  isHumanReply: boolean;
  /** `human_reply`, `human_reply_unknown_sender`, or a ReplyRejectionReason. */
  reason: string;
  confidence: 'high' | 'low';
}

/** Domains we own. Mail from these is internal, never a prospect reply. */
export const INTERNAL_DOMAINS = ['freightroll.com', 'yardflow.ai', 'dwtb.dev'] as const;

/**
 * Local parts that are machine mailboxes. Anchored at the start and required to end
 * at a separator or end-of-local-part, so `alertson@` and `j.supportini@` still pass.
 */
const AUTOMATED_LOCAL_PARTS = [
  'no-reply', 'noreply', 'donotreply', 'do-not-reply', 'do_not_reply',
  'notifications', 'notification', 'notify',
  'alerts', 'alert',
  'bounce', 'bounces', 'bounced',
  'mailer-daemon', 'mailerdaemon', 'postmaster', 'mail-daemon',
  'automated', 'autoreply', 'auto-reply', 'noreplies',
  'mailer', 'newsletter', 'news', 'updates', 'update',
  'unsubscribe', 'listserv', 'majordomo',
];

/**
 * Vendor domains whose mail is transactional even from a "human-shaped" mailbox
 * (support@, team@, hello@). Matched as a suffix so `email.easydmarc.com` hits.
 * A genuinely named person at these domains (dana.reeves@hubspot.com) still passes.
 */
const AUTOMATED_VENDOR_DOMAINS = [
  'statuspage.io', 'mailchimp.com', 'mailchimpapp.net', 'sendgrid.net', 'sendgrid.com',
  'easydmarc.com', 'fireflies.ai', 'intercom.io', 'intercom-mail.com', 'zendesk.com',
  'atlassian.com', 'atlassian.net', 'notion.so', 'slack.com', 'calendly.com',
  'docusign.net', 'docusign.com', 'stripe.com', 'github.com', 'gitlab.com',
  'figma.com', 'vercel.com', 'posthog.com', 'sentry.io', 'zoom.us',
  'linkedin.com', 'quickbooks.com', 'intuit.com', 'paypal.com', 'dropbox.com',
  'asana.com', 'monday.com', 'loom.com', 'gong.io', 'outreach.io', 'salesloft.com',
];

/** Generic mailboxes that are transactional when they sit on a vendor domain. */
const VENDOR_GENERIC_LOCAL_PARTS = ['support', 'team', 'hello', 'info', 'help', 'service', 'billing', 'invoices', 'receipts', 'security', 'admin', 'care', 'contact'];

/**
 * Localized "Automatic reply:" prefixes. Verified against the real mailbox — Outlook
 * and Gmail emit the user's locale, so an English-only check misses most of them.
 */
const AUTO_REPLY_SUBJECT_PATTERNS: RegExp[] = [
  /^\s*(re\s*:\s*)?auto(matic)?\s*(-|\s)?reply\s*:/i,
  /^\s*(re\s*:\s*)?auto\s*:/i,
  /^\s*(re\s*:\s*)?out\s+of\s+(the\s+)?office\b/i,
  /^\s*(re\s*:\s*)?automatic\s+response\s*:/i,
  /^\s*(re\s*:\s*)?automatische[rs]?\s+antwort\s*:/i,      // de
  /^\s*(re\s*:\s*)?automatisch\s+antwoord\s*:/i,           // nl
  /^\s*(re\s*:\s*)?r[ée]ponse\s+automatique\s*:/i,         // fr
  /^\s*(re\s*:\s*)?risposta\s+automatica\s*:/i,            // it
  /^\s*(re\s*:\s*)?resposta\s+autom[áa]tica\s*:/i,         // pt
  /^\s*(re\s*:\s*)?respuesta\s+autom[áa]tica\s*:/i,        // es
  /^\s*(re\s*:\s*)?samodejni\s+odgovor\s*:/i,              // sl
  /^\s*(re\s*:\s*)?automaattinen\s+vastaus\s*:/i,          // fi
  /^\s*(re\s*:\s*)?autosvar\s*:/i,                         // sv/da/no
  /^\s*(re\s*:\s*)?automatisk\s+svar\s*:/i,                // sv/da/no
  /^\s*(re\s*:\s*)?avtomatichesk|^\s*автоответ\s*:/i,      // ru
  /^\s*自动答复\s*[:：]/,                                    // zh-CN
  /^\s*自動回覆\s*[:：]/,                                    // zh-TW
  /^\s*自動応答\s*[:：]/,                                    // ja
  /^\s*자동\s*회신\s*[:：]/,                                  // ko
];

/** Non-delivery / bounce subjects. */
const BOUNCE_SUBJECT_PATTERNS: RegExp[] = [
  /^\s*undeliverable\s*:/i,
  /^\s*undelivered\s+mail/i,
  /^\s*delivery\s+status\s+notification/i,
  /^\s*mail\s+delivery\s+(failed|subsystem)/i,
  /^\s*returned\s+mail\s*:/i,
  /^\s*failure\s+notice/i,
  /^\s*message\s+blocked/i,
  /^\s*delivery\s+has\s+failed/i,
  /^\s*unzustellbar\s*:/i,
];

/**
 * Body phrases that mark an autoresponder. Deliberately narrow: they must read as a
 * standing away-message, not a human saying "I'm out Thursday". Each requires the
 * first person plus an absence construction.
 */
const AUTO_REPLY_BODY_PATTERNS: RegExp[] = [
  /\bi\s+am\s+(currently\s+)?out\s+of\s+the\s+office\b/i,
  /\bi'?m\s+(currently\s+)?out\s+of\s+the\s+office\b/i,
  /\bi\s+am\s+(currently\s+)?(away|on\s+(annual\s+)?leave|on\s+holiday|on\s+vacation|on\s+pto)\b/i,
  /\bi\s+am\s+ooo\b/i,
  /\bthank\s+you\s+for\s+your\s+e?-?mail\.?\s+i\s+am\s+(currently\s+)?(out|away)\b/i,
  /\bwill\s+(be\s+)?(have\s+)?(no|limited)\s+access\s+to\s+(my\s+)?e?-?mail\b/i,
  /\bthis\s+is\s+an\s+automated\s+(reply|response|message)\b/i,
  /\bplease\s+do\s+not\s+reply\s+to\s+this\s+e?-?mail\b/i,
];

/** "X is no longer with the company" — a dead-contact signal, not engagement. */
const DEPARTURE_BODY_PATTERNS: RegExp[] = [
  /\bno\s+longer\s+(with|employed\s+(by|at)|works?\s+(at|for)|part\s+of)\b/i,
  /\bhas\s+left\s+the\s+(company|organi[sz]ation|business)\b/i,
  /\bis\s+not\s+longer\s+working\b/i,
  /\bhas\s+retired\s+from\b/i,
];

/** Case-insensitive header lookup. Returns '' when absent. */
function header(headers: Record<string, string> | undefined, name: string): string {
  if (!headers) return '';
  const target = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) return (headers[key] ?? '').trim();
  }
  return '';
}

function hasHeader(headers: Record<string, string> | undefined, name: string): boolean {
  if (!headers) return false;
  const target = name.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === target);
}

/** Lowercase, strip a display name, strip a `+tag`. */
function normalizeAddress(raw: string): { local: string; domain: string } {
  const inAngle = raw.match(/<([^>]+)>/);
  const addr = (inAngle ? inAngle[1] : raw).trim().toLowerCase();
  const at = addr.lastIndexOf('@');
  if (at <= 0 || at === addr.length - 1) return { local: '', domain: '' };
  return { local: addr.slice(0, at).split('+')[0], domain: addr.slice(at + 1) };
}

/** True when `domain` is `suffix` or a subdomain of it. */
function domainMatches(domain: string, suffix: string): boolean {
  return domain === suffix || domain.endsWith(`.${suffix}`);
}

function isAutomatedLocalPart(local: string): boolean {
  return AUTOMATED_LOCAL_PARTS.some(
    (p) => local === p || local.startsWith(`${p}-`) || local.startsWith(`${p}.`) ||
      local.startsWith(`${p}_`) || local.endsWith(`-${p}`) || local.endsWith(`.${p}`) ||
      local.endsWith(`_${p}`),
  );
}

const reject = (reason: ReplyRejectionReason): ReplyPrecisionVerdict => ({
  isHumanReply: false,
  reason,
  confidence: 'high',
});

/**
 * Decide whether an inbound message is a genuine human reply.
 *
 * Order matters: cheap structural checks first, content heuristics last, so the
 * logged reason names the most specific cause.
 */
export function classifyInboundReply(input: ReplyPrecisionInput): ReplyPrecisionVerdict {
  const { local, domain } = normalizeAddress(input.fromEmail ?? '');
  if (!local || !domain) return reject(REPLY_REJECTION_REASONS.NO_SENDER);

  // 1. Our own mail. Internal threads are not prospect replies.
  if (INTERNAL_DOMAINS.some((d) => domainMatches(domain, d))) {
    return reject(REPLY_REJECTION_REASONS.INTERNAL_SENDER);
  }

  // 2. RFC 3834: anything other than "no" means it was machine-generated.
  const autoSubmitted = header(input.headers, 'Auto-Submitted');
  if (autoSubmitted && autoSubmitted.toLowerCase().split(';')[0].trim() !== 'no') {
    return reject(REPLY_REJECTION_REASONS.AUTO_SUBMITTED);
  }

  // 3. Vendor-specific autoresponder headers.
  if (
    hasHeader(input.headers, 'X-Autoreply') ||
    hasHeader(input.headers, 'X-Autorespond') ||
    hasHeader(input.headers, 'X-Auto-Reply-From') ||
    hasHeader(input.headers, 'X-Autoresponder')
  ) {
    return reject(REPLY_REJECTION_REASONS.AUTORESPONDER_HEADER);
  }

  // 4. Precedence: bulk/junk/list/auto_reply.
  const precedence = header(input.headers, 'Precedence').toLowerCase();
  if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) {
    return reject(REPLY_REJECTION_REASONS.PRECEDENCE_BULK);
  }

  // 5. List mail. A personal reply never carries these.
  if (hasHeader(input.headers, 'List-Unsubscribe') || hasHeader(input.headers, 'List-Id')) {
    return reject(REPLY_REJECTION_REASONS.LIST_MAIL);
  }

  // 6. Machine mailboxes.
  if (isAutomatedLocalPart(local)) {
    return reject(REPLY_REJECTION_REASONS.AUTOMATED_SENDER);
  }

  // 7. Generic mailbox on a known transactional vendor domain.
  if (
    AUTOMATED_VENDOR_DOMAINS.some((d) => domainMatches(domain, d)) &&
    VENDOR_GENERIC_LOCAL_PARTS.includes(local)
  ) {
    return reject(REPLY_REJECTION_REASONS.AUTOMATED_SENDER);
  }

  // 8. Bounces and autoresponders by subject.
  const subject = (input.subject ?? '').trim();
  if (subject) {
    if (BOUNCE_SUBJECT_PATTERNS.some((re) => re.test(subject))) {
      return reject(REPLY_REJECTION_REASONS.BOUNCE_SUBJECT);
    }
    if (AUTO_REPLY_SUBJECT_PATTERNS.some((re) => re.test(subject))) {
      return reject(REPLY_REJECTION_REASONS.AUTO_REPLY_SUBJECT);
    }
  }

  // 9. Departure notices and body-only autoresponders.
  const body = (input.bodyText ?? '').trim();
  if (body) {
    if (DEPARTURE_BODY_PATTERNS.some((re) => re.test(body))) {
      return reject(REPLY_REJECTION_REASONS.DEPARTURE_NOTICE);
    }
    if (AUTO_REPLY_BODY_PATTERNS.some((re) => re.test(body))) {
      return reject(REPLY_REJECTION_REASONS.AUTO_REPLY_BODY);
    }
  }

  // Accepted. An unknown sender still passes, but flagged so the caller can
  // withhold automated mutation and route it to a human instead.
  if (input.knownContact === false) {
    return { isHumanReply: true, reason: 'human_reply_unknown_sender', confidence: 'low' };
  }

  return { isHumanReply: true, reason: 'human_reply', confidence: 'high' };
}
