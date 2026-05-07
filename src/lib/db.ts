import { prisma } from './prisma';
import {
  buildMicrositeAccountAnalytics,
  buildMicrositeAnalyticsSummary,
  type MicrositeAccountAnalytics,
} from './microsites/analytics';

// ── Accounts ──────────────────────────────────────────────────────────
export async function dbGetAccounts() {
  return prisma.account.findMany({ orderBy: { rank: 'asc' } });
}

export async function dbGetAccountByName(name: string) {
  return prisma.account.findUnique({ where: { name } });
}

// ── Personas ──────────────────────────────────────────────────────────
export async function dbGetPersonas() {
  return prisma.persona.findMany({ orderBy: { account_name: 'asc' } });
}

export async function dbGetPersonasByAccount(accountName: string) {
  return prisma.persona.findMany({ where: { account_name: accountName } });
}

export async function dbGetPersonasByAccounts(accountNames: string[]) {
  return prisma.persona.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: [{ account_name: 'asc' }, { quality_score: 'desc' }, { id: 'asc' }],
  });
}

// ── Activities ────────────────────────────────────────────────────────
export async function dbGetActivities() {
  return prisma.activity.findMany({ orderBy: { created_at: 'desc' } });
}

export async function dbGetActivitiesByAccount(accountName: string) {
  return prisma.activity.findMany({ where: { account_name: accountName }, orderBy: { created_at: 'desc' } });
}

export async function dbGetActivitiesByAccounts(accountNames: string[]) {
  return prisma.activity.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { created_at: 'desc' },
  });
}

export async function dbGetGeneratedContentByAccounts(accountNames: string[], take = 8) {
  return prisma.generatedContent.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { created_at: 'desc' },
    take,
    select: {
      id: true,
      content_type: true,
      persona_name: true,
      provider_used: true,
      is_published: true,
      external_send_count: true,
      version: true,
      campaign_id: true,
      campaign: {
        select: {
          campaign_type: true,
        },
      },
      checklist_state: {
        select: {
          completed_item_ids: true,
        },
      },
      version_metadata: true,
      content: true,
      created_at: true,
    },
  });
}

export async function dbGetEmailLogsByAccounts(accountNames: string[], take = 12) {
  return prisma.emailLog.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { sent_at: 'desc' },
    take,
    select: {
      id: true,
      subject: true,
      status: true,
      to_email: true,
      reply_count: true,
      open_count: true,
      opened_at: true,
      delivered_at: true,
      generated_content_id: true,
      metadata: true,
      sent_at: true,
    },
  });
}

export async function dbGetSendJobsByAccounts(accountNames: string[], take = 4) {
  return prisma.sendJob.findMany({
    where: {
      recipients: {
        some: {
          account_name: { in: accountNames },
        },
      },
    },
    orderBy: { updated_at: 'desc' },
    take,
    select: {
      id: true,
      status: true,
      total_recipients: true,
      sent_count: true,
      failed_count: true,
      skipped_count: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function dbGetSendJobRecipientEventsByAccounts(accountNames: string[], take = 12) {
  return prisma.sendJobRecipient.findMany({
    where: {
      account_name: { in: accountNames },
      status: { in: ['sent', 'failed', 'skipped'] },
    },
    orderBy: { updated_at: 'desc' },
    take,
    select: {
      id: true,
      send_job_id: true,
      generated_content_id: true,
      account_name: true,
      to_email: true,
      status: true,
      error_message: true,
      sent_at: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function dbGetOperatorOutcomesByAccounts(accountNames: string[], take = 12) {
  return prisma.operatorOutcome.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { created_at: 'desc' },
    take,
    select: {
      id: true,
      account_name: true,
      campaign_id: true,
      generated_content_id: true,
      outcome_label: true,
      source_kind: true,
      source_id: true,
      notes: true,
      created_at: true,
    },
  });
}

export async function dbGetMeetingsByAccounts(accountNames: string[], take = 8) {
  return prisma.meeting.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: [{ meeting_date: 'desc' }, { created_at: 'desc' }],
    take,
    select: {
      id: true,
      meeting_status: true,
      persona: true,
      meeting_date: true,
      meeting_time: true,
      location: true,
      objective: true,
      post_next_step: true,
      notes: true,
      created_at: true,
    },
  });
}

export async function dbGetMobileCapturesByAccounts(accountNames: string[], take = 8) {
  return prisma.mobileCapture.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { captured_at: 'desc' },
    take,
    select: {
      id: true,
      title: true,
      intent: true,
      next_step: true,
      captured_at: true,
      owner: true,
      heat_score: true,
    },
  });
}

export async function dbGetMicrositeAccountAnalytics(accountName: string): Promise<MicrositeAccountAnalytics> {
  const sessions = await prisma.micrositeEngagement.findMany({
    where: { account_name: accountName },
    orderBy: { updated_at: 'desc' },
  });

  return buildMicrositeAccountAnalytics(
    sessions.map((session) => ({
      account_name: session.account_name,
      account_slug: session.account_slug,
      person_name: session.person_name,
      person_slug: session.person_slug,
      path: session.path,
      sections_viewed: session.sections_viewed,
      cta_ids: session.cta_ids,
      variant_history: session.variant_history,
      scroll_depth_pct: session.scroll_depth_pct,
      duration_seconds: session.duration_seconds,
      updated_at: session.updated_at,
    })),
  );
}

export async function dbGetMicrositeAccountAnalyticsByAccounts(accountNames: string[]): Promise<MicrositeAccountAnalytics> {
  const sessions = await prisma.micrositeEngagement.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: { updated_at: 'desc' },
  });

  return buildMicrositeAccountAnalytics(
    sessions.map((session) => ({
      account_name: session.account_name,
      account_slug: session.account_slug,
      person_name: session.person_name,
      person_slug: session.person_slug,
      path: session.path,
      sections_viewed: session.sections_viewed,
      cta_ids: session.cta_ids,
      variant_history: session.variant_history,
      scroll_depth_pct: session.scroll_depth_pct,
      duration_seconds: session.duration_seconds,
      updated_at: session.updated_at,
    })),
  );
}

export async function dbGetMicrositeEngagements() {
  return prisma.micrositeEngagement.findMany({ orderBy: { updated_at: 'desc' } });
}

export async function dbGetMicrositeAnalytics() {
  const sessions = await dbGetMicrositeEngagements();

  return buildMicrositeAnalyticsSummary(
    sessions.map((session) => ({
      account_name: session.account_name,
      account_slug: session.account_slug,
      person_name: session.person_name,
      person_slug: session.person_slug,
      path: session.path,
      sections_viewed: session.sections_viewed,
      cta_ids: session.cta_ids,
      variant_history: session.variant_history,
      scroll_depth_pct: session.scroll_depth_pct,
      duration_seconds: session.duration_seconds,
      updated_at: session.updated_at,
    })),
  );
}

// ── Meetings ──────────────────────────────────────────────────────────
export async function dbGetMeetings() {
  return prisma.meeting.findMany({ orderBy: { meeting_date: 'desc' } });
}

// ── Email Logs ────────────────────────────────────────────────────────
export async function dbGetEmailLogs() {
  return prisma.emailLog.findMany({ orderBy: { sent_at: 'desc' } });
}

export async function dbGetEmailLogsByAccount(accountName: string) {
  return prisma.emailLog.findMany({ where: { account_name: accountName }, orderBy: { sent_at: 'desc' } });
}

// ── Outreach Waves ────────────────────────────────────────────────────
export async function dbGetOutreachWaves() {
  return prisma.outreachWave.findMany({ orderBy: { wave_order: 'asc' } });
}

// ── Generated Content ─────────────────────────────────────────────────
export async function dbGetGeneratedContent() {
  return prisma.generatedContent.findMany({ orderBy: { created_at: 'desc' } });
}

// ── Account Context (AI APIs — parallel fetch) ─────────────────────────
export async function getAccountContext(name: string, accountNames?: string[]) {
  const scopedAccountNames = Array.from(new Set(accountNames?.length ? accountNames : [name]));
  const [account, meetingBrief, emailLogs, personas] = await Promise.all([
    prisma.account.findUnique({ where: { name } }),
    prisma.meetingBrief.findFirst({
      where: { account_name: { in: scopedAccountNames } },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.emailLog.findMany({
      where: { account_name: { in: scopedAccountNames } },
      orderBy: { sent_at: 'desc' },
      take: 3,
    }),
    prisma.persona.findMany({
      where: { account_name: { in: scopedAccountNames } },
      orderBy: [{ quality_score: 'desc' }, { id: 'asc' }],
    }),
  ]);
  return { account, meetingBrief, emailLogs, personas };
}

// ── Actionable Intel ──────────────────────────────────────────────────
export async function dbGetActionableIntel() {
  return prisma.actionableIntel.findMany({ orderBy: { id: 'asc' } });
}

// ── Mobile Captures ───────────────────────────────────────────────────
export async function dbGetMobileCaptures() {
  return prisma.mobileCapture.findMany({ orderBy: { captured_at: 'desc' } });
}

// ── Aggregate Stats (for dashboard / analytics) ──────────────────────
export async function dbGetDashboardStats() {
  const [
    accountCount,
    personaCount,
    p1Count,
    emailsSent,
    emailsOpened,
    emailsClicked,
    emailsBounced,
    emailsDelivered,
    activitiesCount,
    meetingsCount,
    generatedCount,
    capturesCount,
    uniqueCompaniesContacted,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.persona.count(),
    prisma.persona.count({ where: { priority: 'P1' } }),
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { opened_at: { not: null } } }),
    prisma.emailLog.count({ where: { clicked_at: { not: null } } }),
    prisma.emailLog.count({ where: { status: 'bounced' } }),
    prisma.emailLog.count({ where: { status: 'delivered' } }),
    prisma.activity.count(),
    prisma.meeting.count(),
    prisma.generatedContent.count(),
    prisma.mobileCapture.count(),
    // Unique companies we've sent at least one email to (true "contacted" count)
    prisma.emailLog.findMany({
      distinct: ['account_name'],
      select: { account_name: true },
    }).then(rows => rows.length),
  ]);

  const accounts = await prisma.account.findMany({
    select: { priority_band: true, outreach_status: true, meeting_status: true, research_status: true },
  });

  const bandCounts = { A: 0, B: 0, C: 0, D: 0 };
  let meetingsBooked = 0;
  let researched = 0;

  for (const a of accounts) {
    const band = a.priority_band as keyof typeof bandCounts;
    if (band in bandCounts) bandCounts[band]++;
    if (a.meeting_status === 'Meeting Booked' || a.meeting_status === 'Meeting Held') meetingsBooked++;
    if (a.research_status === 'Ready' || a.research_status === 'Complete') researched++;
  }

  // Recent email logs for send history - show last 200
  const recentEmails = await prisma.emailLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 200,
    select: {
      id: true,
      account_name: true,
      persona_name: true,
      to_email: true,
      subject: true,
      status: true,
      opened_at: true,
      clicked_at: true,
      sent_at: true,
      created_at: true,
    },
  });

  return {
    accountCount,
    personaCount,
    p1Count,
    emailsSent,
    emailsOpened,
    emailsClicked,
    emailsBounced,
    emailsDelivered,
    openRate: emailsDelivered > 0 ? Math.round((emailsOpened / emailsDelivered) * 100) : 0,
    clickRate: emailsDelivered > 0 ? Math.round((emailsClicked / emailsDelivered) * 100) : 0,
    deliveryRate: emailsSent > 0 ? Math.round((emailsDelivered / emailsSent) * 100) : 0,
    bounceRate: emailsSent > 0 ? Math.round((emailsBounced / emailsSent) * 100) : 0,
    activitiesCount,
    meetingsCount,
    generatedCount,
    capturesCount,
    bandCounts,
    contacted: uniqueCompaniesContacted, // derive from email_logs, not account status
    meetingsBooked,
    researched,
    recentEmails,
  };
}
