import { prisma } from './prisma';

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
    activitiesCount,
    meetingsCount,
    generatedCount,
    capturesCount,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.persona.count(),
    prisma.persona.count({ where: { priority: 'P1' } }),
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { opened_at: { not: null } } }),
    prisma.emailLog.count({ where: { clicked_at: { not: null } } }),
    prisma.activity.count(),
    prisma.meeting.count(),
    prisma.generatedContent.count(),
    prisma.mobileCapture.count(),
  ]);

  const accounts = await prisma.account.findMany({
    select: { priority_band: true, outreach_status: true, meeting_status: true, research_status: true },
  });

  const bandCounts = { A: 0, B: 0, C: 0, D: 0 };
  let contacted = 0;
  let meetingsBooked = 0;
  let researched = 0;

  for (const a of accounts) {
    const band = a.priority_band as keyof typeof bandCounts;
    if (band in bandCounts) bandCounts[band]++;
    if (a.outreach_status === 'Contacted' || a.outreach_status === 'In Progress') contacted++;
    if (a.meeting_status === 'Meeting Booked' || a.meeting_status === 'Meeting Held') meetingsBooked++;
    if (a.research_status === 'Ready' || a.research_status === 'Complete') researched++;
  }

  // Recent email logs for send history
  const recentEmails = await prisma.emailLog.findMany({
    orderBy: { sent_at: 'desc' },
    take: 50,
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
    },
  });

  return {
    accountCount,
    personaCount,
    p1Count,
    emailsSent,
    emailsOpened,
    emailsClicked,
    openRate: emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0,
    clickRate: emailsSent > 0 ? Math.round((emailsClicked / emailsSent) * 100) : 0,
    activitiesCount,
    meetingsCount,
    generatedCount,
    capturesCount,
    bandCounts,
    contacted,
    meetingsBooked,
    researched,
    recentEmails,
  };
}
