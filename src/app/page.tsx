import Link from 'next/link';
import { getOutreachWaves, getMeetingBriefs, slugify } from '@/lib/data';
import { dbGetAccounts, dbGetActivities, dbGetMeetings, dbGetDashboardStats } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { AutoRefresh } from '@/components/auto-refresh';
import { Building2, Users, Waves as WavesIcon, CalendarCheck, Smartphone, Activity, ArrowRight, TrendingUp, BarChart3, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const WAVE_META: Record<number, { label: string; color: string; start: string }> = {
  0: { label: 'Wave 0 — Warm Intros', color: 'bg-red-500', start: '3/24' },
  1: { label: 'Wave 1 — Must-Book', color: 'bg-blue-500', start: '3/27' },
  2: { label: 'Wave 2 — High-Value', color: 'bg-violet-500', start: '3/30' },
  3: { label: 'Wave 3 — Ecosystem', color: 'bg-emerald-500', start: '4/2' },
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

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameCalendarDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function formatDueLabel(due: Date, today: Date) {
  const diffDays = Math.round((startOfDay(due).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}

export default async function DashboardPage() {
  const [dbAccounts, dbActivities, dbMeetings, stats, recentReplies, emailStats] = await Promise.all([
    dbGetAccounts(), dbGetActivities(), dbGetMeetings(), dbGetDashboardStats(),
    prisma.notification.findMany({
      where: { type: 'reply' },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
    prisma.emailLog.aggregate({
      _count: { id: true },
      _sum: { open_count: true, reply_count: true },
    }),
  ]);
  const waves = getOutreachWaves();
  const briefs = getMeetingBriefs();

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
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);

  const queuedCampaignFollowUps = dbActivities.filter((activity) =>
    activity.activity_type === 'Follow-up' && (activity.notes?.includes('Campaign drip automation') || activity.outcome?.includes('MODEX 2026 Follow-Up')),
  ).length;

  const allFocusItems = [
    ...dbAccounts
      .filter((account) => account.next_action && account.due_date)
      .map((account) => ({
        type: 'Account' as const,
        account: account.name,
        owner: account.owner,
        summary: account.next_action ?? 'Next action ready',
        due: new Date(account.due_date as Date | string),
      })),
    ...dbActivities
      .filter((activity) => activity.account_name && activity.next_step && activity.next_step_due)
      .map((activity) => ({
        type: 'Activity' as const,
        account: activity.account_name ?? 'Unknown account',
        owner: activity.owner,
        summary: activity.next_step ?? 'Follow up',
        due: new Date(activity.next_step_due as Date | string),
      })),
  ]
    .filter((item) => !Number.isNaN(item.due.getTime()))
    .sort((left, right) => left.due.getTime() - right.due.getTime())
    .filter((item, index, items) => index === items.findIndex((candidate) => (
      candidate.account === item.account && candidate.summary === item.summary && candidate.due.getTime() === item.due.getTime()
    )));

  const overdueFocusCount = allFocusItems.filter((item) => item.due.getTime() < today.getTime()).length;
  const dueTodayCount = allFocusItems.filter((item) => isSameCalendarDay(item.due, today)).length;
  const dueThisWeekCount = allFocusItems.filter((item) => item.due.getTime() >= today.getTime() && item.due.getTime() <= sevenDaysOut.getTime()).length;
  const focusItems = allFocusItems.slice(0, 6);

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
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            YardFlow by FreightRoll RevOps OS
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
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-[var(--muted-foreground)]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
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
              <Link href={overdueFocusCount > 0 ? '/activities?filter=overdue' : '/activities?filter=week'}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open queue <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
            <Link href="/waves">
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
              return (
                <div key={wg.order} className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="mt-1 text-2xl font-bold">{wg.total}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Start: {meta.start}</p>
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
              <Link href="/meetings">
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
            <Link href="/activities">
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
