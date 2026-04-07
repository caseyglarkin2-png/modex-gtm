import { prisma } from './prisma';
import {
  buildMicrositeAccountAnalytics,
  buildMicrositeAnalyticsSummary,
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

// ── Activities ────────────────────────────────────────────────────────
export async function dbGetActivities() {
  return prisma.activity.findMany({ orderBy: { created_at: 'desc' } });
}

export async function dbGetActivitiesByAccount(accountName: string) {
  return prisma.activity.findMany({ where: { account_name: accountName }, orderBy: { created_at: 'desc' } });
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
export async function getAccountContext(name: string) {
  const [account, meetingBrief, emailLogs, personas] = await Promise.all([
    prisma.account.findUnique({ where: { name } }),
    prisma.meetingBrief.findFirst({ where: { account_name: name } }),
    prisma.emailLog.findMany({ where: { account_name: name }, orderBy: { sent_at: 'desc' }, take: 3 }),
    prisma.persona.findMany({ where: { account_name: name } }),
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

export async function dbGetMicrositeAnalytics() {
  const engagements = await prisma.micrositeEngagement.findMany({
    select: {
      account_name: true,
      account_slug: true,
      person_name: true,
      person_slug: true,
      path: true,
      sections_viewed: true,
      cta_ids: true,
      variant_history: true,
      scroll_depth_pct: true,
      duration_seconds: true,
      updated_at: true,
    },
    orderBy: { updated_at: 'desc' },
  });

  return buildMicrositeAnalyticsSummary(engagements);
}

export async function dbGetMicrositeAccountAnalytics(accountName: string) {
  const engagements = await prisma.micrositeEngagement.findMany({
    where: { account_name: accountName },
    select: {
      account_name: true,
      account_slug: true,
      person_name: true,
      person_slug: true,
      path: true,
      sections_viewed: true,
      cta_ids: true,
      variant_history: true,
      scroll_depth_pct: true,
      duration_seconds: true,
      updated_at: true,
    },
    orderBy: { updated_at: 'desc' },
  });

  return buildMicrositeAccountAnalytics(engagements);
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
