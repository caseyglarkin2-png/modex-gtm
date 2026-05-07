import Link from 'next/link';
import { getOutreachWaves, getMeetingBriefs, slugify } from '@/lib/data';
import { dbGetAccounts, dbGetActivities, dbGetMeetings, dbGetDashboardStats } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { getCampaignSummaries } from '@/lib/campaigns';
import { computeStuckJobs } from '@/lib/admin/stuck-jobs';
import { buildHomeCockpitSnapshot, formatDueLabel, isSameCalendarDay, startOfDay } from '@/lib/home-cockpit';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { AutoRefresh } from '@/components/auto-refresh';
import { Building2, Users, Waves as WavesIcon, CalendarCheck, Smartphone, Activity, ArrowRight, TrendingUp, BarChart3, Mail, MessageSquare, AlertTriangle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountOutcomeLogger } from '@/components/accounts/account-outcome-logger';
import { loadEvidenceSummaryByAccountScope } from '@/lib/source-backed/evidence';
import { buildWaveTimeRemaining } from '@/lib/wave-time-remaining';

export const dynamic = 'force-dynamic';

// Wave windows are anchored to MODEX (April 13–16). End dates fall just before the
// next wave starts so the time-remaining badge can render an honest urgency signal.
const WAVE_META: Record<number, { label: string; color: string; start: string; end: string }> = {
  0: { label: 'Wave 0 — Warm Intros', color: 'bg-red-500', start: '3/24', end: '3/30' },
  1: { label: 'Wave 1 — Must-Book', color: 'bg-blue-500', start: '3/27', end: '4/2' },
  2: { label: 'Wave 2 — High-Value', color: 'bg-violet-500', start: '3/30', end: '4/9' },
  3: { label: 'Wave 3 — Ecosystem', color: 'bg-emerald-500', start: '4/2', end: '4/16' },
};


function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function isUpcoming(dateStr: string, days: number): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() + days);
  return d >= now && d <= cutoff;
}

export default async function DashboardPage() {
  const [
    dbAccounts,
    dbActivities,
    dbMeetings,
    stats,
    recentReplies,
    emailStats,
    campaigns,
    generationFailures,
    sendFailures,
    failedRecipientCount,
    processingGenerationJobs,
    processingSendJobs,
  ] = await Promise.all([
    dbGetAccounts(), dbGetActivities(), dbGetMeetings(), dbGetDashboardStats(),
    prisma.notification.findMany({
      where: { type: 'reply' },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        account_name: true,
        persona_email: true,
        subject: true,
        preview: true,
        source_id: true,
        created_at: true,
      },
    }),
    prisma.emailLog.aggregate({
      _count: { id: true },
      _sum: { open_count: true, reply_count: true },
    }),
    getCampaignSummaries(),
    prisma.generationJob.count({ where: { status: 'failed' } }),
    prisma.sendJob.count({ where: { status: { in: ['failed', 'partial'] } } }),
    prisma.sendJobRecipient.count({ where: { status: 'failed' } }),
    prisma.generationJob.findMany({
      where: { status: 'processing' },
      select: { id: true, account_name: true, status: true, started_at: true, updated_at: true },
      take: 50,
    }),
    prisma.sendJob.findMany({
      where: { status: 'processing' },
      select: { id: true, status: true, started_at: true, updated_at: true, total_recipients: true, sent_count: true, failed_count: true },
      take: 50,
    }),
  ]);

  // S5-T3 + S5-T4: time-aware callouts for the home page. Both rely on
  // priority A/B accounts as the relevance scope; both run as a single batched
  // query so the home page doesn't get N+1 pressure as the account list grows.
  const priorityAccountNames = dbAccounts
    .filter((a) => a.priority_band === 'A' || a.priority_band === 'B')
    .map((a) => a.name);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [priorityEvidence, recentOutboundForPriority] = await Promise.all([
    priorityAccountNames.length > 0
      ? loadEvidenceSummaryByAccountScope(priorityAccountNames)
      : Promise.resolve(null),
    priorityAccountNames.length > 0
      ? prisma.emailLog.findMany({
          where: {
            account_name: { in: priorityAccountNames },
            sent_at: { gte: fourteenDaysAgo },
          },
          distinct: ['account_name'],
          select: { account_name: true },
        })
      : Promise.resolve([] as Array<{ account_name: string | null }>),
  ]);
  const accountsWithRecentOutbound = new Set(
    recentOutboundForPriority.map((row) => row.account_name).filter(Boolean) as string[],
  );
  // Priority accounts with no fresh evidence: either no evidence summary at all,
  // or all freshness counts are zero/stale. The summary is account-scope-wide,
  // so we approximate by checking the freshness counters; if no fresh records
  // exist across the entire scope, we know every priority account is at risk.
  const stalePriorityCount = priorityEvidence == null || priorityEvidence.freshness.fresh === 0
    ? priorityAccountNames.length
    : 0;
  const untouchedPriorityCount = priorityAccountNames.filter(
    (name) => !accountsWithRecentOutbound.has(name),
  ).length;

  const waves = getOutreachWaves();
  const briefs = getMeetingBriefs();
  const stuckJobs = computeStuckJobs({
    generationJobs: processingGenerationJobs,
    sendJobs: processingSendJobs,
  });
  const cockpit = buildHomeCockpitSnapshot({
    accounts: dbAccounts,
    activities: dbActivities,
    campaigns,
    generationFailures,
    sendFailures: sendFailures + failedRecipientCount,
    stuckJobs: stuckJobs.length,
    engagementAlerts: recentReplies.length,
    proofStatus: {
      sprint: 'Sprint 1',
      status: 'Production browser-proven',
      result: 'pass',
      route: '/ops',
      evidence: 'Canonical navigation click proof passed on Vercel production with skipped 0.',
    },
  });

  // Map DB entities to the shapes used by the template
  const accounts = dbAccounts.map((a) => ({
    ...a,
    priority_band: a.priority_band ?? '',
    research_status: a.research_status ?? '',
    outreach_status: a.outreach_status ?? '',
    meeting_status: a.meeting_status ?? '',
  }));
  const activities = dbActivities.map((a) => ({
    account: a.account_name,
    activity_type: a.activity_type,
    activity_date: a.activity_date ? new Date(a.activity_date).toLocaleDateString() : '',
    persona: a.persona ?? '',
    owner: a.owner,
    outcome: a.outcome,
    notes: a.notes,
    next_step: a.next_step,
    next_step_due: a.next_step_due ? new Date(a.next_step_due).toLocaleDateString() : null,
  }));
  const meetings = dbMeetings.map((m) => ({
    date: m.meeting_date ? new Date(m.meeting_date).toISOString() : '',
    account: m.account_name ?? '',
    persona: m.persona ?? '',
    meeting_status: m.meeting_status ?? '',
    objective: m.objective ?? '',
    notes: m.notes ?? '',
  }));
  const bandCounts = stats.bandCounts;
  const p1 = stats.p1Count;
  const contacted = stats.contacted;
  const meetingsBooked = stats.meetingsBooked;

  const today = startOfDay(new Date());

  const queuedCampaignFollowUps = dbActivities.filter((activity) =>
    activity.activity_type === 'Follow-up' && (activity.notes?.includes('Campaign drip automation') || activity.outcome?.includes('MODEX 2026 Follow-Up')),
  ).length;

  const overdueFocusCount = cockpit.today.overdue;
  const dueTodayCount = cockpit.today.dueToday;
  const dueThisWeekCount = cockpit.today.dueThisWeek;
  // S5-T2: priority-aware sort. Composite key (urgency, priority_band, due asc).
  const bandByAccount = new Map(accounts.map((a) => [a.name, a.priority_band || 'D'] as const));
  const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 } as const;
  const bandOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  const focusItems = [...cockpit.today.focusItems].sort((left, right) => {
    const urgencyDelta = urgencyOrder[left.urgency] - urgencyOrder[right.urgency];
    if (urgencyDelta !== 0) return urgencyDelta;
    const leftBand = bandOrder[bandByAccount.get(left.account) ?? 'D'] ?? 3;
    const rightBand = bandOrder[bandByAccount.get(right.account) ?? 'D'] ?? 3;
    if (leftBand !== rightBand) return leftBand - rightBand;
    return left.due.getTime() - right.due.getTime();
  });

  // Weekly counters
  const meetingsThisWeek = meetings.filter((m) => isThisWeek(m.date)).length;
  const capturesThisWeek = stats.capturesCount;

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = meetings.filter((m) => isUpcoming(m.date, 7)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const waveGroups = [0, 1, 2, 3].map((order) => {
    const items = waves.filter((w) => w.wave_order === order);
    const contactedCount = items.filter((w) => w.status !== 'Not started' && w.status !== 'Planned').length;
    const repliedCount = items.filter((w) => w.status === 'Replied' || w.status === 'Meeting Booked' || w.status === 'Meeting Held').length;
    const meetingCount = items.filter((w) => w.status === 'Meeting Booked' || w.status === 'Meeting Held').length;
    return { order, items, contactedCount, repliedCount, meetingCount, total: items.length };
  });

  // Pipeline funnel
  const funnel = [
    { label: 'Target', count: accounts.length, color: 'bg-neutral-500' },
    { label: 'Researched', count: stats.researched, color: 'bg-violet-500' },
    { label: 'Contacted', count: contacted, color: 'bg-blue-500' },
    { label: 'Meetings', count: meetingsBooked, color: 'bg-emerald-500' },
  ];

  const funnelWidths = [
    accounts.length ? 100 : 0,
    accounts.length ? Math.round((stats.researched / accounts.length) * 100) : 0,
    stats.emailsSent ? Math.round((contacted / stats.emailsSent) * 100) : 0,
    accounts.length ? Math.round((meetingsBooked / accounts.length) * 100) : 0,
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Home' }]} />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Daily cockpit for Casey&apos;s RevOps operating loop.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Pipeline Board <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <AutoRefresh intervalMs={30_000} />
          </Badge>
          <div className="text-center"><span className="block text-lg font-bold text-[var(--foreground)]">{meetingsThisWeek}</span>meetings</div>
          <div className="h-8 w-px bg-[var(--border)]" />
          <div className="text-center"><span className="block text-lg font-bold text-[var(--foreground)]">{stats.activitiesCount}</span>activities</div>
          <div className="h-8 w-px bg-[var(--border)]" />
          <div className="text-center"><span className="block text-lg font-bold text-[var(--foreground)]">{capturesThisWeek}</span>captures</div>
        </div>
      </div>

      {/* Daily Cockpit */}
      <section aria-labelledby="daily-cockpit-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="daily-cockpit-heading" className="text-lg font-semibold">Daily Cockpit</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Priority work, campaign motion, system health, and proof status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/queue">
              <Button size="sm" className="gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Open Work Queue
              </Button>
            </Link>
            <Link href="/capture">
              <Button variant="outline" size="sm">Quick Capture</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>Today</span>
                <Badge variant={overdueFocusCount > 0 ? 'destructive' : 'success'}>
                  {overdueFocusCount > 0 ? `${overdueFocusCount} overdue` : 'On track'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Due Today', value: dueTodayCount },
                  { label: 'Next 7 Days', value: dueThisWeekCount },
                  { label: 'Reply Alerts', value: cockpit.today.engagementAlerts },
                  { label: 'Blocked Jobs', value: cockpit.health.stuckJobs },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              <Link href="/engagement" className="block rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--accent)]/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Engagement alerts</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Replies and buyer signals that need triage.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Active Campaigns</CardTitle>
                <Link href="/campaigns">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Campaigns <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {cockpit.activeCampaigns.length === 0 ? (
                <p className="py-6 text-sm text-[var(--muted-foreground)]">No active campaigns are configured yet.</p>
              ) : (
                cockpit.activeCampaigns.map((campaign) => (
                  <Link key={campaign.slug} href={campaign.href} className="block rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--accent)]/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{campaign.name}</p>
                          <Badge variant="secondary">{campaign.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{campaign.label}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">{campaign.readinessScore}% ready</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <span><strong className="block text-sm">{campaign.targetAccountCount}</strong>targets</span>
                      <span><strong className="block text-sm">{campaign.generatedCount}</strong>assets</span>
                      <span><strong className="block text-sm">{campaign.sentCount}</strong>sent</span>
                      <span><strong className="block text-sm">{campaign.activityCount}</strong>acts</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {cockpit.health.tone === 'healthy' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={cockpit.health.tone === 'healthy' ? 'success' : cockpit.health.tone === 'blocked' ? 'destructive' : 'warning'}>
                  {cockpit.health.label}
                </Badge>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <span><strong className="block text-lg">{cockpit.health.generationFailures}</strong>gen fail</span>
                  <span><strong className="block text-lg">{cockpit.health.sendFailures}</strong>send fail</span>
                  <span><strong className="block text-lg">{cockpit.health.stuckJobs}</strong>stuck</span>
                </div>
                <Link href="/ops" className="mt-4 block text-xs font-medium text-[var(--primary)]">
                  Open Ops health <ArrowRight className="inline h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" /> Proof Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{cockpit.proofStatus.sprint}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{cockpit.proofStatus.status}</p>
                  </div>
                  <Badge variant={cockpit.proofStatus.result === 'pass' ? 'success' : cockpit.proofStatus.result === 'fail' ? 'destructive' : 'warning'}>
                    {cockpit.proofStatus.result}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">{cockpit.proofStatus.evidence}</p>
                <Link href={cockpit.proofStatus.route} className="mt-4 block text-xs font-medium text-[var(--primary)]">
                  Open proof workspace <ArrowRight className="inline h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Accounts</p>
                <p className="mt-1 text-3xl font-bold">{accounts.length}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{contacted} contacted</p>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-2.5">
                <Building2 className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Personas</p>
                <p className="mt-1 text-3xl font-bold">{stats.personaCount}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{p1} P1 priority</p>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-2.5">
                <Users className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Meetings</p>
                <p className="mt-1 text-3xl font-bold">{stats.meetingsCount}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{meetingsBooked} accounts booked</p>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-2.5">
                <CalendarCheck className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Captures</p>
                <p className="mt-1 text-3xl font-bold">{stats.capturesCount}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{briefs.length} briefs ready</p>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-2.5">
                <Smartphone className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Stats + Recent Replies */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Email Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{emailStats._count.id}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Sent</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{emailStats._sum.open_count ?? 0}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Opens</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{emailStats._sum.reply_count ?? 0}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" /> Recent Replies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReplies.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
                No replies yet. Keep sending.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentReplies.map((r) => (
                  <li key={r.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                    <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.persona_email || 'Unknown'}</p>
                      {r.subject && <p className="truncate text-xs text-[var(--muted-foreground)]">{r.subject}</p>}
                      {r.preview && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)]">{r.preview}</p>}
                      {r.account_name ? (
                        <Link
                          href={`/accounts/${slugify(r.account_name)}`}
                          className="mt-0.5 inline-block text-[10px] text-[var(--primary)] hover:underline"
                        >
                          {r.account_name} ↗
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {r.account_name ? (
                        <AccountOutcomeLogger
                          accountName={r.account_name}
                          sources={[{
                            key: `reply-${r.id}`,
                            label: 'Reply received',
                            detail: r.subject ?? r.persona_email ?? 'Reply triage from home',
                            sourceKind: 'reply',
                            sourceId: r.source_id ?? `notification-${r.id}`,
                          }]}
                          trigger={
                            <button
                              type="button"
                              className="text-[10px] font-medium text-[var(--primary)] hover:underline"
                              data-testid={`reply-outcome-${r.id}`}
                            >
                              Log outcome
                            </button>
                          }
                        />
                      ) : null}
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution Pulse */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Execution Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Overdue', value: overdueFocusCount, tone: overdueFocusCount > 0 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Due Today', value: dueTodayCount, tone: dueTodayCount > 0 ? 'text-amber-600' : 'text-[var(--foreground)]' },
                { label: 'Next 7 Days', value: dueThisWeekCount, tone: 'text-[var(--foreground)]' },
                { label: 'Queued Drip', value: queuedCampaignFollowUps, tone: queuedCampaignFollowUps > 0 ? 'text-blue-600' : 'text-[var(--foreground)]' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{item.label}</p>
                  <p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Today&apos;s Focus</CardTitle>
              <Link href={overdueFocusCount > 0 ? '/queue?filter=overdue' : '/queue?filter=week'}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open queue <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* S5-T3 + S5-T4: time-aware callouts surface priority accounts that need
                attention right now — stale source-backed evidence and untouched accounts. */}
            {(stalePriorityCount > 0 || untouchedPriorityCount > 0) ? (
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {stalePriorityCount > 0 ? (
                  <Link
                    href="/accounts?stale_evidence=true"
                    className="rounded-md border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100"
                    data-testid="stale-evidence-callout"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-amber-900">Stale intel</p>
                    <p className="mt-1 text-sm font-medium text-amber-900">
                      {stalePriorityCount} priority account{stalePriorityCount === 1 ? '' : 's'} need fresh intel
                    </p>
                    <p className="mt-1 text-[10px] text-amber-800">Click to filter →</p>
                  </Link>
                ) : null}
                {untouchedPriorityCount > 0 ? (
                  <Link
                    href="/accounts?untouched=14d"
                    className="rounded-md border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
                    data-testid="untouched-accounts-callout"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-red-900">No outbound 14d</p>
                    <p className="mt-1 text-sm font-medium text-red-900">
                      {untouchedPriorityCount} priority account{untouchedPriorityCount === 1 ? '' : 's'} you haven&apos;t touched
                    </p>
                    <p className="mt-1 text-[10px] text-red-800">Click to filter →</p>
                  </Link>
                ) : null}
              </div>
            ) : null}
            {focusItems.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted-foreground)]">No urgent follow-ups are queued right now.</p>
            ) : (
              <div className="space-y-2">
                {focusItems.map((item) => {
                  const dueLabel = formatDueLabel(item.due, today);
                  const dueTone = item.due.getTime() < today.getTime()
                    ? 'destructive'
                    : isSameCalendarDay(item.due, today)
                      ? 'secondary'
                      : 'outline';

                  return (
                    <Link key={`${item.account}-${item.summary}-${item.due.toISOString()}`} href={`/accounts/${slugify(item.account)}`}>
                      <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--accent)]/40">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{item.account}</p>
                            <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{item.summary}</p>
                          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">Owner: {item.owner}</p>
                        </div>
                        <Badge variant={dueTone}>{dueLabel}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel + Priority Bands */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((stage, index) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="font-semibold">{stage.count}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all`}
                    style={{ width: `${funnelWidths[index]}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Priority Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((band) => (
                <div key={band} className="rounded-lg border border-[var(--border)] p-3 text-center">
                  <BandBadge band={band} />
                  <p className="mt-2 text-2xl font-bold">{bandCounts[band]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wave Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <WavesIcon className="h-4 w-4" /> Wave Pipeline
            </CardTitle>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {waveGroups.map((wg) => {
              const meta = WAVE_META[wg.order];
              const pct = wg.total ? Math.round((wg.contactedCount / wg.total) * 100) : 0;
              const remaining = buildWaveTimeRemaining(meta.end);
              return (
                <div key={wg.order} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{meta.label}</p>
                    <Badge
                      className={
                        remaining.tone === 'green'
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100'
                          : remaining.tone === 'amber'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-100'
                            : 'bg-red-100 text-red-900 hover:bg-red-100'
                      }
                      data-testid={`wave-time-remaining-${wg.order}`}
                    >
                      {remaining.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{wg.total}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{meta.start} → {meta.end}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className={`h-full rounded-full ${meta.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{wg.contactedCount}/{wg.total} progressed ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings + Wave Conversion */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck className="h-4 w-4" /> Upcoming Meetings
              </CardTitle>
              <Link href="/pipeline">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No meetings in the next 7 days</p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="shrink-0 text-center">
                      <p className="text-xs text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-lg font-bold">{new Date(m.date).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.account}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{m.persona}</p>
                    </div>
                    <StatusBadge status={m.meeting_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> Wave Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <th className="pb-2 text-left font-medium">Wave</th>
                    <th className="pb-2 text-center font-medium">Total</th>
                    <th className="pb-2 text-center font-medium">Contacted</th>
                    <th className="pb-2 text-center font-medium">Replied</th>
                    <th className="pb-2 text-center font-medium">Meetings</th>
                  </tr>
                </thead>
                <tbody>
                  {waveGroups.map((wg) => {
                    const meta = WAVE_META[wg.order];
                    return (
                      <tr key={wg.order} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2.5 font-medium text-xs">{meta.label.split(' — ')[1]}</td>
                        <td className="py-2.5 text-center">{wg.total}</td>
                        <td className="py-2.5 text-center">{wg.contactedCount}</td>
                        <td className="py-2.5 text-center">{wg.repliedCount}</td>
                        <td className="py-2.5 text-center font-semibold">{wg.meetingCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Recent Activities
            </CardTitle>
            <Link href="/pipeline">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <EmptyState
              title="No activities yet"
              description="Activities will appear here as outreach begins."
              action={
                <Link href="/capture">
                  <Button size="sm">Log a capture</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="mt-0.5 rounded-md bg-[var(--accent)] p-1.5">
                    <Activity className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{a.account}</span>
                      <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                    </div>
                    {a.outcome && <p className="mt-0.5 text-sm text-[var(--muted-foreground)] truncate">{a.outcome}</p>}
                    {a.next_step && (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Next: {a.next_step} {a.next_step_due && `(due ${a.next_step_due})`}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{a.activity_date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
