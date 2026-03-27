import Link from 'next/link';
import { getOutreachWaves, getMeetingBriefs } from '@/lib/data';
import { dbGetAccounts, dbGetPersonas, dbGetActivities, dbGetMeetings, dbGetMobileCaptures } from '@/lib/db';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Building2, Users, Waves as WavesIcon, FileText, CalendarCheck, Smartphone, Activity, ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
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

export default async function DashboardPage() {
  const [dbAccounts, dbPersonas, dbActivities, dbMeetings, dbCaptures] = await Promise.all([
    dbGetAccounts(), dbGetPersonas(), dbGetActivities(), dbGetMeetings(), dbGetMobileCaptures(),
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
  const personas = dbPersonas;
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
  const captures = dbCaptures.map((c) => ({
    timestamp: c.captured_at ? new Date(c.captured_at).toISOString() : '',
  }));

  const bandCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of accounts) bandCounts[a.priority_band as keyof typeof bandCounts]++;
  const p1 = personas.filter((p) => p.priority === 'P1').length;
  const contacted = accounts.filter((a) => a.outreach_status === 'Contacted' || a.outreach_status === 'In Progress').length;
  const meetingsBooked = accounts.filter((a) => a.meeting_status === 'Meeting Booked' || a.meeting_status === 'Meeting Held').length;

  // Weekly counters
  const meetingsThisWeek = meetings.filter((m) => isThisWeek(m.date)).length;
  const activitiesThisWeek = activities.filter((a) => isThisWeek(a.activity_date)).length;
  const capturesThisWeek = captures.filter((c) => isThisWeek(c.timestamp)).length;

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
    { label: 'Researched', count: accounts.filter((a) => a.research_status === 'Ready' || a.research_status === 'Complete').length, color: 'bg-violet-500' },
    { label: 'Contacted', count: contacted, color: 'bg-blue-500' },
    { label: 'Meetings', count: meetingsBooked, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            MODEX 2026 RevOps Operating System — YardFlow / FreightRoll
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <div className="text-center"><span className="block text-lg font-bold text-[var(--foreground)]">{meetingsThisWeek}</span>meetings</div>
          <div className="h-8 w-px bg-[var(--border)]" />
          <div className="text-center"><span className="block text-lg font-bold text-[var(--foreground)]">{activitiesThisWeek}</span>activities</div>
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
                <p className="mt-1 text-3xl font-bold">{personas.length}</p>
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
                <p className="mt-1 text-3xl font-bold">{meetings.length}</p>
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
                <p className="mt-1 text-3xl font-bold">{captures.length}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{briefs.length} briefs ready</p>
              </div>
              <div className="rounded-lg bg-[var(--accent)] p-2.5">
                <Smartphone className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
            </div>
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
            {funnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="font-semibold">{stage.count}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all`}
                    style={{ width: `${accounts.length ? (stage.count / accounts.length) * 100 : 0}%` }}
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
