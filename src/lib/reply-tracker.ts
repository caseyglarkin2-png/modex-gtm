/**
 * Reply Tracker — operator view of HubSpot email engagement for the 40 named accounts.
 *
 * Data flow:
 *   1. Collect all PersonProfiles from the account microsite data (the canonical list).
 *   2. For each person with an email, query HubSpot Emails Object API to find:
 *      - Most recent outbound email sent (direction = FORWARDED_EMAIL / EMAIL)
 *      - Whether any inbound reply exists from that contact (direction = INCOMING_EMAIL)
 *   3. Compute derived fields: daysSinceLastActivity, needsFollowUp, suggestedNextStep.
 *   4. Return enriched rows — never throw; surface per-row errors gracefully.
 *
 * HubSpot Emails Object API: POST /crm/v3/objects/emails/search
 * (NOT the deprecated Engagements API)
 */

import { isHubSpotConfigured, getHubSpotClient, withHubSpotRetry } from '@/lib/hubspot/client';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/Filter';

// ── Days threshold for "needs follow-up" ─────────────────────────────────────
const FOLLOW_UP_THRESHOLD_DAYS = 10;

// ── Exported types ────────────────────────────────────────────────────────────

export interface NamedAccountContact {
  /** Account slug (e.g. "ab-inbev") */
  accountSlug: string;
  /** Account display name */
  accountName: string;
  /** Person's full name */
  personName: string;
  /** Person's title */
  personTitle: string;
  /** Contact email */
  email: string;
  /** HubSpot contact ID (if known from persona data) — not used for lookup currently */
  hubspotContactId: string | null;

  // ── Latest email sent ─────────────────────────────────────────────────────
  /** ISO timestamp of the most recent outbound email to this contact */
  lastEmailSentAt: string | null;
  /** Subject of the most recent outbound email */
  lastEmailSubject: string | null;

  // ── Engagement state ──────────────────────────────────────────────────────
  /** Whether the contact has opened any email we sent (hs_email_status = OPENED) */
  opened: boolean;
  /** Whether the contact has replied (inbound email from this address exists) */
  replied: boolean;

  // ── Derived fields ────────────────────────────────────────────────────────
  /** Calendar days since the most recent outbound email (null = never emailed) */
  daysSinceLastActivity: number | null;
  /** True when: sent ≥ FOLLOW_UP_THRESHOLD_DAYS days ago, no reply */
  needsFollowUp: boolean;
  /**
   * Template-driven next step suggestion:
   *  - "send cold v1"       — never emailed
   *  - "send follow-up 2"   — sent ≥10 days ago, no reply, not opened
   *  - "resend — no open"   — sent ≥10 days ago, no reply, not opened (same trigger as above; kept distinct for clarity)
   *  - "warm — schedule call" — has replied
   *  - "follow up soon"     — sent <10 days ago, opened, no reply
   *  - "monitor"            — sent <10 days ago, no open
   */
  suggestedNextStep: string;

  /** Per-row error message if the HubSpot lookup failed for this contact */
  error: string | null;
}

// ── Internal HubSpot shape ────────────────────────────────────────────────────

interface RawEmailProperties {
  hs_timestamp?: string | null;
  hs_email_direction?: string | null;
  hs_email_subject?: string | null;
  hs_email_status?: string | null;
  hs_email_from_email?: string | null;
  hs_email_to_email?: string | null;
}

interface RawEmailObject {
  id: string;
  properties: RawEmailProperties;
}

// ── Helper: derive suggestedNextStep ─────────────────────────────────────────

export function deriveSuggestedNextStep(params: {
  lastEmailSentAt: string | null;
  opened: boolean;
  replied: boolean;
  daysSinceLastActivity: number | null;
}): string {
  const { lastEmailSentAt, opened, replied, daysSinceLastActivity } = params;

  if (!lastEmailSentAt) return 'send cold v1';
  if (replied) return 'warm — schedule call';

  const days = daysSinceLastActivity ?? 0;

  if (days >= FOLLOW_UP_THRESHOLD_DAYS) {
    return 'send follow-up 2';
  }

  if (opened) return 'follow up soon';
  return 'monitor';
}

// ── Helper: compute daysSince ─────────────────────────────────────────────────

export function computeDaysSince(isoTimestamp: string | null, now: Date = new Date()): number | null {
  if (!isoTimestamp) return null;
  const sent = new Date(isoTimestamp);
  if (isNaN(sent.getTime())) return null;
  const diffMs = now.getTime() - sent.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ── Helper: compute needsFollowUp ─────────────────────────────────────────────

export function computeNeedsFollowUp(params: {
  lastEmailSentAt: string | null;
  replied: boolean;
  daysSinceLastActivity: number | null;
}): boolean {
  const { lastEmailSentAt, replied, daysSinceLastActivity } = params;
  if (!lastEmailSentAt) return false;
  if (replied) return false;
  return (daysSinceLastActivity ?? 0) >= FOLLOW_UP_THRESHOLD_DAYS;
}

// ── HubSpot email lookup per contact ─────────────────────────────────────────

/**
 * Query HubSpot for all email objects associated with a given contact email.
 * Searches outbound sends (to the address) and inbound replies (from the address).
 *
 * Returns null on 401 (let the caller handle global disconnect).
 */
async function fetchContactEmailActivity(email: string): Promise<{
  lastSentAt: string | null;
  lastSentSubject: string | null;
  opened: boolean;
  replied: boolean;
} | null> {
  const client = getHubSpotClient();
  const lowerEmail = email.toLowerCase().trim();

  // Search for outbound emails TO this contact
  const outboundResult = await withHubSpotRetry(
    () =>
      client.crm.objects.emails.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_email_to_email',
                operator: FilterOperatorEnum.Eq,
                value: lowerEmail,
              },
            ],
          },
        ],
        properties: [
          'hs_timestamp',
          'hs_email_direction',
          'hs_email_subject',
          'hs_email_status',
          'hs_email_from_email',
          'hs_email_to_email',
        ],
        sorts: ['-hs_timestamp'],
        limit: 10,
        after: '0',
      }),
    `reply-tracker:outbound(${lowerEmail})`,
  );

  // Search for inbound emails FROM this contact (replies)
  const inboundResult = await withHubSpotRetry(
    () =>
      client.crm.objects.emails.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_email_from_email',
                operator: FilterOperatorEnum.Eq,
                value: lowerEmail,
              },
              {
                propertyName: 'hs_email_direction',
                operator: FilterOperatorEnum.Eq,
                value: 'INCOMING_EMAIL',
              },
            ],
          },
        ],
        properties: ['hs_timestamp', 'hs_email_direction', 'hs_email_from_email'],
        sorts: ['-hs_timestamp'],
        limit: 1,
        after: '0',
      }),
    `reply-tracker:inbound(${lowerEmail})`,
  );

  const outboundEmails = (outboundResult.results ?? []) as RawEmailObject[];
  const inboundEmails = (inboundResult.results ?? []) as RawEmailObject[];

  // Most recent outbound
  const mostRecentSend = outboundEmails[0] ?? null;
  const lastSentAt = mostRecentSend?.properties.hs_timestamp ?? null;
  const lastSentSubject = mostRecentSend?.properties.hs_email_subject ?? null;

  // Opened: any email with status OPENED
  const opened = outboundEmails.some((e) => {
    const status = (e.properties.hs_email_status ?? '').toUpperCase();
    return status === 'OPENED' || status === 'OPEN';
  });

  // Replied: any inbound email from this contact
  const replied = inboundEmails.length > 0;

  return { lastSentAt, lastSentSubject, opened, replied };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Pull all 40 accounts' personas and query HubSpot for latest email activity.
 *
 * Graceful degradation:
 *   - HubSpot not configured → return []
 *   - Global 401 → return []
 *   - Single contact lookup fails → record error on that row, continue
 */
export async function getNamedAccountActivity(): Promise<NamedAccountContact[]> {
  if (!isHubSpotConfigured()) {
    return [];
  }

  const allAccounts = getAllAccountMicrositeData();
  const now = new Date();
  const rows: NamedAccountContact[] = [];

  // Detect global 401 — if we get one, bail out for the rest
  let globalDisconnected = false;

  for (const account of allAccounts) {
    const people = account.people ?? [];

    for (const person of people) {
      const email = person.email;
      if (!email) continue;

      const baseRow: Omit<NamedAccountContact, 'lastEmailSentAt' | 'lastEmailSubject' | 'opened' | 'replied' | 'daysSinceLastActivity' | 'needsFollowUp' | 'suggestedNextStep' | 'error'> = {
        accountSlug: account.slug,
        accountName: account.accountName,
        personName: person.name,
        personTitle: person.title ?? '',
        email,
        hubspotContactId: null, // PersonProfile does not carry hubspotContactId in microsite data
      };

      if (globalDisconnected) {
        // Surface a consistent disconnected error for remaining rows
        rows.push({
          ...baseRow,
          lastEmailSentAt: null,
          lastEmailSubject: null,
          opened: false,
          replied: false,
          daysSinceLastActivity: null,
          needsFollowUp: false,
          suggestedNextStep: 'send cold v1',
          error: 'HubSpot disconnected',
        });
        continue;
      }

      try {
        const activity = await fetchContactEmailActivity(email);

        const lastEmailSentAt = activity?.lastSentAt ?? null;
        const lastEmailSubject = activity?.lastSentSubject ?? null;
        const opened = activity?.opened ?? false;
        const replied = activity?.replied ?? false;
        const daysSinceLastActivity = computeDaysSince(lastEmailSentAt, now);
        const needsFollowUp = computeNeedsFollowUp({ lastEmailSentAt, replied, daysSinceLastActivity });
        const suggestedNextStep = deriveSuggestedNextStep({ lastEmailSentAt, opened, replied, daysSinceLastActivity });

        rows.push({
          ...baseRow,
          lastEmailSentAt,
          lastEmailSubject,
          opened,
          replied,
          daysSinceLastActivity,
          needsFollowUp,
          suggestedNextStep,
          error: null,
        });
      } catch (error: unknown) {
        // Detect 401 → set global flag
        const statusCode = getStatusCodeFromError(error);
        if (statusCode === 401) {
          globalDisconnected = true;
          rows.push({
            ...baseRow,
            lastEmailSentAt: null,
            lastEmailSubject: null,
            opened: false,
            replied: false,
            daysSinceLastActivity: null,
            needsFollowUp: false,
            suggestedNextStep: 'send cold v1',
            error: 'HubSpot disconnected (401)',
          });
          continue;
        }

        const message = error instanceof Error ? error.message : String(error);
        rows.push({
          ...baseRow,
          lastEmailSentAt: null,
          lastEmailSubject: null,
          opened: false,
          replied: false,
          daysSinceLastActivity: null,
          needsFollowUp: false,
          suggestedNextStep: 'send cold v1',
          error: message,
        });
      }
    }
  }

  return rows;
}

function getStatusCodeFromError(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    for (const key of ['code', 'status', 'statusCode'] as const) {
      const val = (error as Record<string, unknown>)[key];
      if (typeof val === 'number') return val;
    }
  }
  return undefined;
}
