import { prisma } from '@/lib/prisma';

/**
 * Campaign cohort stats, keyed off the free-form `campaign_tag` carried from
 * DraftQueueItem onto EmailLog at send. Computed from:
 *  - DraftQueueItem (by campaign_tag) -> the outbox funnel (draft/approved/sent/failed)
 *  - EmailLog (by campaign_tag) -> realized sends + engagement
 *      opened  = opened_at not null
 *      replied = reply_count > 0
 *      bounced = status 'bounced'
 *  - Account.meeting_status (for the accounts in this cohort) -> best-effort booked
 *
 * Reusable so the stats route and any server component can call it without an
 * HTTP hop. Fail-soft: a DB error resolves to a zeroed shape with an `error`
 * note rather than throwing.
 */

const DRAFT = 'draft';
const APPROVED = 'approved';
const SENT = 'sent';
const FAILED = 'failed';
const NO_MEETING = 'No meeting';

export interface CampaignStats {
  campaign: string;
  drafts: { total: number; draft: number; approved: number; sent: number; failed: number };
  sends: { sent: number; opened: number; replied: number; bounced: number };
  openRate: number;
  replyRate: number;
  perAccount: Array<{ account: string; sent: number; opened: number; replied: number }>;
  booked?: number;
  updatedAt: string;
  error?: string;
}

function emptyStats(campaign: string, error?: string): CampaignStats {
  return {
    campaign,
    drafts: { total: 0, draft: 0, approved: 0, sent: 0, failed: 0 },
    sends: { sent: 0, opened: 0, replied: 0, bounced: 0 },
    openRate: 0,
    replyRate: 0,
    perAccount: [],
    updatedAt: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

export async function getCampaignStats(tag: string): Promise<CampaignStats> {
  const campaign = tag;
  try {
    const [draftRows, logRows] = await Promise.all([
      prisma.draftQueueItem.findMany({
        where: { campaign_tag: campaign },
        select: { status: true, account_name: true },
      }),
      prisma.emailLog.findMany({
        where: { campaign_tag: campaign },
        select: { account_name: true, status: true, opened_at: true, reply_count: true },
      }),
    ]);

    const drafts = { total: draftRows.length, draft: 0, approved: 0, sent: 0, failed: 0 };
    for (const row of draftRows) {
      if (row.status === DRAFT) drafts.draft += 1;
      else if (row.status === APPROVED) drafts.approved += 1;
      else if (row.status === SENT) drafts.sent += 1;
      else if (row.status === FAILED) drafts.failed += 1;
    }

    const sends = { sent: logRows.length, opened: 0, replied: 0, bounced: 0 };
    // account -> { sent, opened, replied }
    const perAccountMap = new Map<string, { account: string; sent: number; opened: number; replied: number }>();
    const accountNames = new Set<string>();

    for (const row of logRows) {
      const account = row.account_name || '';
      accountNames.add(account);
      const opened = row.opened_at != null;
      const replied = (row.reply_count ?? 0) > 0;
      const bounced = row.status === 'bounced';
      if (opened) sends.opened += 1;
      if (replied) sends.replied += 1;
      if (bounced) sends.bounced += 1;

      const entry = perAccountMap.get(account) ?? { account, sent: 0, opened: 0, replied: 0 };
      entry.sent += 1;
      if (opened) entry.opened += 1;
      if (replied) entry.replied += 1;
      perAccountMap.set(account, entry);
    }

    const perAccount = [...perAccountMap.values()].sort((a, b) => b.sent - a.sent);

    // Best-effort booked: accounts in this cohort whose meeting_status has moved
    // off the default. A clean, reachable signal; omitted (left 0) if it errors.
    let booked = 0;
    try {
      const realAccounts = [...accountNames].filter((name) => name.length > 0);
      if (realAccounts.length > 0) {
        booked = await prisma.account.count({
          where: { name: { in: realAccounts }, meeting_status: { not: NO_MEETING } },
        });
      }
    } catch {
      // Leave booked at 0; reported as 0 rather than guessed.
    }

    return {
      campaign,
      drafts,
      sends,
      openRate: rate(sends.opened, sends.sent),
      replyRate: rate(sends.replied, sends.sent),
      perAccount,
      booked,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    return emptyStats(campaign, err instanceof Error ? err.message : 'stats_failed');
  }
}
