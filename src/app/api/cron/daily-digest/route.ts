import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import { markCronFailure, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const CRON_NAME = 'daily-digest';
const CRON_PATH = '/api/cron/daily-digest';
const CRON_SCHEDULE = '0 12 * * *';

// YardFlow HubSpot (portal 3819073). Casey is the founding AE / sole deal owner.
const PORTAL_ID = '3819073';
const CASEY_OWNER_ID = '85093129';
const OPEN_STAGES = ['appointmentscheduled', 'qualifiedtobuy', 'presentationscheduled'];
const STAGE_LABEL: Record<string, string> = {
  appointmentscheduled: 'Discovery',
  qualifiedtobuy: 'Solution',
  presentationscheduled: 'Proposal',
};
const DIGEST_TO = process.env.DIGEST_TO_EMAIL || 'casey@freightroll.com';

const dealUrl = (id: string) => `https://app.hubspot.com/contacts/${PORTAL_ID}/record/0-3/${id}`;
const boardUrl = `https://app.hubspot.com/contacts/${PORTAL_ID}/objects/0-3/views/all/board`;
const hotAccountsUrl = `https://app.hubspot.com/contacts/${PORTAL_ID}/objectLists/72`;
const taskQueueUrl = `https://app.hubspot.com/tasks/${PORTAL_ID}/view/all`;

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
function parseHsDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

interface DealDigest {
  count: number;
  totalAmount: number;
  byStage: { label: string; count: number; amount: number }[];
  decisions: { id: string; name: string; amount: number; closedate: Date | null; reason: string }[];
}

/** Pull Casey's open pipeline from HubSpot and flag deals needing a decision. */
async function fetchDealDigest(now: Date): Promise<DealDigest | null> {
  if (!isHubSpotConfigured()) return null;
  const client = getHubSpotClient();
  const res = await withHubSpotRetry(
    () =>
      client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'hubspot_owner_id', operator: FilterOperatorEnum.Eq, value: CASEY_OWNER_ID },
              { propertyName: 'dealstage', operator: FilterOperatorEnum.In, values: OPEN_STAGES },
            ],
          },
        ],
        properties: ['dealname', 'dealstage', 'amount', 'closedate', 'hs_lastmodifieddate'],
        limit: 100,
        after: '0',
        sorts: [],
      }),
    'dailyDigest:openDeals',
  );

  const results = res.results ?? [];
  let totalAmount = 0;
  const stageMap = new Map<string, { count: number; amount: number }>();
  const decisions: DealDigest['decisions'] = [];
  const STALE_DAYS = 14;

  for (const d of results) {
    const p = d.properties as Record<string, string | null>;
    const amount = Number(p.amount ?? 0) || 0;
    totalAmount += amount;
    const stage = p.dealstage ?? '';
    const label = STAGE_LABEL[stage] ?? stage;
    const cur = stageMap.get(label) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += amount;
    stageMap.set(label, cur);

    const close = parseHsDate(p.closedate);
    const modified = parseHsDate(p.hs_lastmodifieddate);
    const staleDays = modified ? Math.floor((now.getTime() - modified.getTime()) / 86_400_000) : null;
    let reason = '';
    if (close && close.getTime() < now.getTime()) reason = `close date passed (${shortDate(close)})`;
    else if (staleDays !== null && staleDays >= STALE_DAYS) reason = `no activity in ${staleDays} days`;
    if (reason) decisions.push({ id: d.id, name: p.dealname ?? 'Untitled deal', amount, closedate: close, reason });
  }

  const byStage = Array.from(stageMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);
  decisions.sort((a, b) => b.amount - a.amount);

  return { count: results.length, totalAmount, byStage, decisions: decisions.slice(0, 6) };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // HubSpot actionable pipeline (best-effort; digest still sends if this fails)
    let deals: DealDigest | null = null;
    try {
      deals = await fetchDealDigest(now);
    } catch (err) {
      console.error('daily-digest: HubSpot deal fetch failed', err);
    }

    // Outreach stats (local DB) — secondary section
    const [totalSent, sentYesterday, openedYesterday, repliesYesterday, bouncedYesterday, campaignFollowUpsReady] =
      await Promise.all([
        prisma.emailLog.count(),
        prisma.emailLog.count({ where: { sent_at: { gte: yesterday } } }),
        prisma.emailLog.count({ where: { opened_at: { gte: yesterday } } }),
        prisma.notification.count({ where: { type: 'reply', created_at: { gte: yesterday } } }),
        prisma.emailLog.count({ where: { status: 'bounced', sent_at: { gte: yesterday } } }),
        prisma.activity.count({
          where: {
            activity_type: 'Follow-up',
            notes: { contains: 'Campaign drip automation' },
            next_step_due: { lte: now },
          },
        }),
      ]);

    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // ── Actionable HubSpot section ───────────────────────────────────
    let pipelineHtml = '';
    if (deals) {
      const stageLine = deals.byStage.map((s) => `${s.label} ${s.count} (${money(s.amount)})`).join(' &middot; ');
      const decisionRows = deals.decisions.length
        ? deals.decisions
            .map(
              (d) => `
          <div style="border:1px solid #eee;border-left:3px solid #b45309;border-radius:6px;padding:10px 14px;margin-bottom:8px">
            <div style="font-weight:700">${d.name} &middot; ${money(d.amount)}</div>
            <div style="color:#666;font-size:13px;margin:2px 0 6px">${d.reason}</div>
            <a href="${dealUrl(d.id)}" style="color:#2563eb;font-size:13px">Open deal</a>
          </div>`,
            )
            .join('')
        : `<p style="color:#666">Nothing past close date or stalled. Clean board.</p>`;

      pipelineHtml = `
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;text-transform:uppercase;margin-bottom:6px">Your pipeline</div>
        <p style="margin:0 0 14px"><b>${money(deals.totalAmount)}</b> across <b>${deals.count}</b> open deals &middot; ${stageLine}
          &middot; <a href="${boardUrl}" style="color:#2563eb">Board</a></p>
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#b45309;text-transform:uppercase;margin-bottom:8px">Deals needing a decision</div>
        ${decisionRows}
      `;
    } else {
      pipelineHtml = `<p style="color:#999">HubSpot pipeline unavailable this run. <a href="${boardUrl}" style="color:#2563eb">Open board</a></p>`;
    }

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;color:#111;line-height:1.5">
        <h2 style="margin:0 0 2px;font-size:20px">YardFlow daily — ${dateStr}</h2>
        <div style="color:#666;font-size:13px;margin-bottom:18px">Your morning standup. Act from here.</div>

        ${pipelineHtml}

        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;text-transform:uppercase;margin:18px 0 6px">Intent &amp; queues</div>
        <p style="margin:0 0 14px;font-size:13px">
          Hot accounts (intent score): <a href="${hotAccountsUrl}" style="color:#2563eb">YardFlow Hot Accounts</a><br>
          Open tasks: <a href="${taskQueueUrl}" style="color:#2563eb">Task queue</a>
        </p>

        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#555;text-transform:uppercase;margin:18px 0 6px">Outreach — last 24h</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:6px 10px;border:1px solid #eee">Sent</td><td style="padding:6px 10px;border:1px solid #eee;text-align:right">${sentYesterday}</td>
              <td style="padding:6px 10px;border:1px solid #eee">Opens</td><td style="padding:6px 10px;border:1px solid #eee;text-align:right">${openedYesterday}</td></tr>
          <tr><td style="padding:6px 10px;border:1px solid #eee">Replies</td><td style="padding:6px 10px;border:1px solid #eee;text-align:right">${repliesYesterday}</td>
              <td style="padding:6px 10px;border:1px solid #eee">Bounces</td><td style="padding:6px 10px;border:1px solid #eee;text-align:right">${bouncedYesterday}</td></tr>
        </table>
        <p style="font-size:12px;color:#888;margin-top:8px">${campaignFollowUpsReady} drip follow-ups queued.</p>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#999;font-size:12px">Sent automatically from YardFlow RevOps OS.</p>
      </div>
    `;

    await sendEmail({
      to: DIGEST_TO,
      subject: `YardFlow daily — ${dateStr}${deals ? ` · ${deals.decisions.length} deal(s) need a decision` : ''}`,
      html,
    });

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Digest sent. Pipeline ${deals ? money(deals.totalAmount) : 'n/a'}, ${deals?.decisions.length ?? 0} decisions, ${sentYesterday} sends.`,
      stats: { openDeals: deals?.count ?? null, decisions: deals?.decisions.length ?? null, sentYesterday, repliesYesterday },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, openDeals: deals?.count ?? null, decisions: deals?.decisions.length ?? null, sentYesterday });
  } catch (error) {
    Sentry.captureException(error);
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);

    return NextResponse.json(
      { error: 'Digest failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
