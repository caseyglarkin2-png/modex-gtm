/**
 * GAP HubSpot reply poller (S2-T9). READ-ONLY against HubSpot.
 *
 * Replies to a HubSpot-sent sequence never reach the Gmail inbox that
 * /api/cron/check-inbox polls: HubSpot logs them as INCOMING_EMAIL engagements
 * on the contact. This job reads those engagements and lands them in the same
 * local shape check-inbox writes for a Gmail reply (InboundMessage +
 * EmailThread + Notification), so routing's `undispositionedInbound` input
 * sees a HubSpot reply exactly as it sees a Gmail one.
 *
 * What it deliberately does NOT do:
 *   - write anything to HubSpot (no engagement, no contact property, no
 *     sequence change). The single HubSpot call is the emails object SEARCH,
 *     which is an HTTP POST by API design but a pure read: it returns rows and
 *     changes nothing. The structural test greps this file for every write
 *     helper name the codebase owns and asserts the only `client.crm.*` call is
 *     `objects.emails.searchApi.doSearch`.
 *   - write an Activity, change Persona email_status, or stop a sequence run.
 *     Dispositions are Sprint 4; until then a reply is a fact in the inbox
 *     table and nothing else.
 *   - treat an autoresponder as a reply. The same precision gate check-inbox
 *     runs (classifyInboundReply) runs here; a non-human verdict lands as a
 *     `filtered_inbound` notification (apply mode only) and never as an
 *     InboundMessage, so an out-of-office can never become a disposition.
 *
 * Scope choice (Sprint 2): an engagement is in scope when its sender address
 * matches ANY local Persona that carries a hubspot_contact_id. The narrower
 * "Top100 program only" filter was considered and not taken: the routing
 * inputs key off the persona anyway, and a reply from a HubSpot contact we
 * hold outside the Top100 lane is still a reply worth seeing. Senders that
 * match no such persona are counted `unknownSender` and skipped without a row
 * (check-inbox admits unknown senders at low confidence; this poller does not,
 * because a HubSpot contact with no local persona has no account to route).
 *
 * Watermark: SystemConfig key `gap_hubspot_replies_watermark` (ISO 8601).
 * First run defaults to now minus DEFAULT_LOOKBACK_DAYS. An apply run advances
 * it to the newest hs_timestamp seen (capped at `now`, so a clock-skewed
 * engagement cannot push the floor into the future). A dry run never writes
 * it. The search uses GTE, so the newest engagement is re-read on the next
 * run and counted `existing`; that overlap is the price of never missing one.
 */

import { classifyInboundReply } from '@/lib/email/reply-precision';
import { getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';

export const WATERMARK_KEY = 'gap_hubspot_replies_watermark';
export const DEFAULT_LOOKBACK_DAYS = 7;
export const DEFAULT_LIMIT = 200;

/** Mirrors check-inbox: the type must NOT contain the substring "reply". */
const FILTERED_TYPE = 'filtered_inbound';
const SNIPPET_LENGTH = 200;
const SUBJECT_LENGTH = 500;
const HUBSPOT_PAGE_SIZE = 100;

/** One INCOMING_EMAIL engagement, already normalised off the HubSpot row. */
export interface HubSpotEmailEngagement {
  /** HubSpot email object id. The local row id is `hs:<id>`. */
  id: string;
  fromEmail: string;
  toEmail?: string | null;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  /** hs_timestamp */
  timestamp: Date;
}

export interface PollOptions {
  now: Date;
  /** Explicit floor; overrides the stored watermark when given. */
  since?: Date | null;
  dryRun: boolean;
  /** Max engagements to read per run. Default DEFAULT_LIMIT. */
  limit?: number;
}

export interface PollDeps {
  searchIncomingEmails: (args: { since: Date; limit: number }) => Promise<HubSpotEmailEngagement[]>;
  classify?: typeof classifyInboundReply;
}

export interface PollReport {
  /** ISO of the floor the search ran from. */
  since: string;
  /** ISO of the newest hs_timestamp seen, or null when nothing was returned. */
  newest: string | null;
  seen: number;
  created: number;
  existing: number;
  unknownSender: number;
  /** Non-human verdicts keyed by the classifier's reason string. */
  filtered: Record<string, number>;
  dryRun: boolean;
}

interface ScopedPersona {
  email: string;
  account_name: string;
  hubspot_contact_id: string;
}

export function messageIdFor(engagementId: string): string {
  return `hs:${engagementId}`;
}

/** HubSpot has no Gmail thread id, so every contact gets one synthetic thread. */
export function threadIdFor(contactId: string): string {
  return `hs-thread:${contactId}`;
}

/** Plain-text rendering of an HTML body: enough for the classifier and a snippet. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseWatermark(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function resolveSince(prisma: any, opts: PollOptions): Promise<Date> {
  if (opts.since) return opts.since;
  const row = await prisma.systemConfig.findUnique({ where: { key: WATERMARK_KEY } });
  const stored = parseWatermark(row?.value);
  if (stored) return stored;
  return new Date(opts.now.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
}

async function loadScopedPersonas(prisma: any): Promise<Map<string, ScopedPersona>> {
  const rows: Array<{ email: string | null; account_name: string; hubspot_contact_id: string | null }> =
    await prisma.persona.findMany({
      where: { hubspot_contact_id: { not: null }, email: { not: null } },
      select: { email: true, account_name: true, hubspot_contact_id: true },
    });
  const byEmail = new Map<string, ScopedPersona>();
  for (const row of rows) {
    if (!row.email || !row.hubspot_contact_id) continue;
    const key = row.email.trim().toLowerCase();
    if (!key || byEmail.has(key)) continue;
    byEmail.set(key, { email: key, account_name: row.account_name, hubspot_contact_id: row.hubspot_contact_id });
  }
  return byEmail;
}

/**
 * Read INCOMING_EMAIL engagements since a floor and land the human ones locally.
 * Every write is local (Prisma). The only outbound call is `deps.searchIncomingEmails`.
 */
export async function pollHubSpotReplies(prisma: any, opts: PollOptions, deps: PollDeps): Promise<PollReport> {
  const classify = deps.classify ?? classifyInboundReply;
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const since = await resolveSince(prisma, opts);

  const engagements = await deps.searchIncomingEmails({ since, limit });
  const personas = await loadScopedPersonas(prisma);

  const report: PollReport = {
    since: since.toISOString(),
    newest: null,
    seen: engagements.length,
    created: 0,
    existing: 0,
    unknownSender: 0,
    filtered: {},
    dryRun: opts.dryRun,
  };

  let newest: Date | null = null;

  for (const engagement of engagements) {
    if (!newest || engagement.timestamp > newest) newest = engagement.timestamp;

    const messageId = messageIdFor(engagement.id);

    // Idempotency covers BOTH notification types, mirroring check-inbox, so a
    // filtered engagement is not re-recorded on every run.
    const already = await prisma.notification.findFirst({
      where: { source_id: messageId, type: { in: ['reply', FILTERED_TYPE] } },
    });
    if (already) {
      report.existing += 1;
      continue;
    }

    const fromEmail = (engagement.fromEmail ?? '').trim().toLowerCase();
    const persona = fromEmail ? personas.get(fromEmail) : undefined;
    if (!persona) {
      report.unknownSender += 1;
      continue;
    }

    const subject = (engagement.subject ?? '').trim();
    const bodyText = (engagement.text ?? '').trim() || (engagement.html ? stripHtml(engagement.html) : '');
    const snippet = bodyText.slice(0, SNIPPET_LENGTH);

    const verdict = classify({ fromEmail, subject, bodyText, knownContact: true });

    if (!verdict.isHumanReply) {
      report.filtered[verdict.reason] = (report.filtered[verdict.reason] ?? 0) + 1;
      if (!opts.dryRun) {
        // Recorded and labeled so the filter can be audited, read=true so it
        // never sits in the bell. Not an InboundMessage: routing must not see it.
        await prisma.notification.create({
          data: {
            type: FILTERED_TYPE,
            account_name: persona.account_name,
            persona_email: fromEmail,
            subject: `[filtered: ${verdict.reason}] ${subject}`.slice(0, SUBJECT_LENGTH),
            preview: snippet,
            source_id: messageId,
            read: true,
          },
        });
      }
      continue;
    }

    report.created += 1;
    if (opts.dryRun) continue;

    const threadId = threadIdFor(persona.hubspot_contact_id);
    await prisma.$transaction(async (tx: any) => {
      const thread = await tx.emailThread.findUnique({ where: { id: threadId } });
      const lastMessageAt =
        thread?.last_message_at && thread.last_message_at > engagement.timestamp
          ? thread.last_message_at
          : engagement.timestamp;

      await tx.emailThread.upsert({
        where: { id: threadId },
        create: {
          id: threadId,
          account_name: persona.account_name,
          persona_email: fromEmail,
          subject: subject || null,
          last_message_at: lastMessageAt,
        },
        update: {
          account_name: persona.account_name,
          persona_email: fromEmail,
          last_message_at: lastMessageAt,
        },
      });

      await tx.inboundMessage.upsert({
        where: { id: messageId },
        create: {
          id: messageId,
          thread_id: threadId,
          source: 'hubspot',
          hubspot_engagement_id: engagement.id,
          from_email: fromEmail,
          subject: subject || null,
          body_text: bodyText || null,
          body_html: engagement.html || null,
          snippet: snippet || null,
          received_at: engagement.timestamp,
        },
        update: {},
      });

      await tx.notification.create({
        data: {
          type: 'reply',
          account_name: persona.account_name,
          persona_email: fromEmail,
          subject: subject || null,
          preview: snippet,
          source_id: messageId,
          read: false,
        },
      });
    });
  }

  report.newest = newest ? newest.toISOString() : null;

  if (!opts.dryRun && newest) {
    const advanced = newest > opts.now ? opts.now : newest;
    const value = advanced.toISOString();
    await prisma.systemConfig.upsert({
      where: { key: WATERMARK_KEY },
      update: { value },
      create: { key: WATERMARK_KEY, value },
    });
  }

  return report;
}

// ---------------------------------------------------------------------------
// Default search: the one HubSpot surface this module touches
// ---------------------------------------------------------------------------

/** The subset of the HubSpot client the search needs; injectable for tests. */
export interface EmailsSearchClient {
  crm: {
    objects: {
      emails: {
        searchApi: {
          doSearch: (request: {
            filterGroups: Array<{ filters: Array<{ propertyName: string; operator: any; value?: string }> }>;
            properties: string[];
            sorts: string[];
            limit: number;
            after?: string;
          }) => Promise<{ results: Array<{ id: string; properties: Record<string, string | null> }>; paging?: { next?: { after?: string } } }>;
        };
      };
    };
  };
}

const SEARCH_PROPERTIES = [
  'hs_timestamp',
  'hs_email_direction',
  'hs_email_from_email',
  'hs_email_sender_email',
  'hs_email_to_email',
  'hs_email_subject',
  'hs_email_text',
  'hs_email_html',
  'hs_email_headers',
];

function parseTimestamp(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const asNumber = /^\d{10,}$/.test(trimmed) ? new Date(Number(trimmed)) : new Date(trimmed);
  return Number.isNaN(asNumber.getTime()) ? null : asNumber;
}

function senderFrom(props: Record<string, string | null>): string {
  const direct = (props.hs_email_from_email ?? props.hs_email_sender_email ?? '').trim();
  if (direct) return direct;
  const rawHeaders = props.hs_email_headers;
  if (!rawHeaders) return '';
  try {
    const headers = JSON.parse(rawHeaders) as { from?: { email?: string }; sender?: { email?: string } };
    return (headers.from?.email ?? headers.sender?.email ?? '').trim();
  } catch {
    return '';
  }
}

/**
 * Search HubSpot for INCOMING_EMAIL engagements at or after `since`, oldest
 * first, up to `limit`. Pages through the search cursor. This is a POST to
 * /crm/v3/objects/emails/search, which is read-only: nothing in HubSpot changes.
 */
export async function searchIncomingEmailsFromHubSpot(
  args: { since: Date; limit: number },
  client: EmailsSearchClient = getHubSpotClient() as unknown as EmailsSearchClient,
): Promise<HubSpotEmailEngagement[]> {
  const out: HubSpotEmailEngagement[] = [];
  let after: string | undefined;

  while (out.length < args.limit) {
    const pageLimit = Math.min(HUBSPOT_PAGE_SIZE, args.limit - out.length);
    const page = await withHubSpotRetry(
      () =>
        client.crm.objects.emails.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                { propertyName: 'hs_email_direction', operator: 'EQ', value: 'INCOMING_EMAIL' },
                { propertyName: 'hs_timestamp', operator: 'GTE', value: String(args.since.getTime()) },
              ],
            },
          ],
          properties: SEARCH_PROPERTIES,
          sorts: ['hs_timestamp'],
          limit: pageLimit,
          ...(after ? { after } : {}),
        }),
      'gap-hubspot-replies:search',
    );

    for (const row of page.results ?? []) {
      const props = row.properties ?? {};
      const timestamp = parseTimestamp(props.hs_timestamp);
      const fromEmail = senderFrom(props);
      if (!timestamp || !fromEmail) continue;
      out.push({
        id: String(row.id),
        fromEmail,
        toEmail: props.hs_email_to_email ?? null,
        subject: props.hs_email_subject ?? null,
        text: props.hs_email_text ?? null,
        html: props.hs_email_html ?? null,
        timestamp,
      });
      if (out.length >= args.limit) break;
    }

    after = page.paging?.next?.after;
    if (!after) break;
  }

  return out;
}
