import Link from 'next/link';
import { slugify } from '@/lib/data';
import { dbGetActivities } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activities' };

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

type ActivityFilter = 'all' | 'overdue' | 'today' | 'week' | 'follow-up';

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedFilter = (['all', 'overdue', 'today', 'week', 'follow-up'].includes(params.filter ?? '')
    ? params.filter
    : 'all') as ActivityFilter;

  const rawActivities = await dbGetActivities();
  const today = startOfDay(new Date());
  const endToday = endOfDay(today);
  const endOfWeek = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

  const activities = rawActivities.map((a) => {
    const dueDate = a.next_step_due ? new Date(a.next_step_due) : null;
    const hasValidDueDate = dueDate && !Number.isNaN(dueDate.getTime());
    const dueBucket = !hasValidDueDate
      ? 'none'
      : dueDate.getTime() < today.getTime()
        ? 'overdue'
        : dueDate.getTime() <= endToday.getTime()
          ? 'today'
          : dueDate.getTime() <= endOfWeek.getTime()
            ? 'week'
            : 'later';

    return {
      account: a.account_name,
      activity_type: a.activity_type,
      activity_date: a.activity_date ? new Date(a.activity_date).toLocaleDateString() : '',
      activityDateRaw: a.activity_date ? new Date(a.activity_date) : null,
      persona: a.persona ?? '',
      owner: a.owner,
      outcome: a.outcome,
      notes: a.notes,
      next_step: a.next_step,
      next_step_due: hasValidDueDate ? dueDate.toLocaleDateString() : null,
      nextStepDueRaw: hasValidDueDate ? dueDate : null,
      dueBucket,
    };
  });

  const queueActivities = activities
    .filter((activity) => activity.next_step)
    .sort((left, right) => {
      const leftTime = left.nextStepDueRaw?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.nextStepDueRaw?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return (right.activityDateRaw?.getTime() ?? 0) - (left.activityDateRaw?.getTime() ?? 0);
    });

  const queueCounts = {
    overdue: queueActivities.filter((activity) => activity.dueBucket === 'overdue').length,
    today: queueActivities.filter((activity) => activity.dueBucket === 'today').length,
    week: queueActivities.filter((activity) => activity.dueBucket === 'today' || activity.dueBucket === 'week').length,
    followUp: queueActivities.filter((activity) => activity.activity_type === 'Follow-up').length,
  };

  const filteredQueue = queueActivities.filter((activity) => {
    if (selectedFilter === 'overdue') return activity.dueBucket === 'overdue';
    if (selectedFilter === 'today') return activity.dueBucket === 'today';
    if (selectedFilter === 'week') return activity.dueBucket === 'today' || activity.dueBucket === 'week';
    if (selectedFilter === 'follow-up') return activity.activity_type === 'Follow-up';
    return true;
  });

  const queueFilterLinks: Array<{ key: ActivityFilter; label: string; count: number }> = [
    { key: 'all', label: 'All queued', count: queueActivities.length },
    { key: 'overdue', label: 'Overdue', count: queueCounts.overdue },
    { key: 'today', label: 'Due today', count: queueCounts.today },
    { key: 'week', label: 'Due this week', count: queueCounts.week },
    { key: 'follow-up', label: 'Follow-up', count: queueCounts.followUp },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Activities' }]} />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          All outreach and engagement activities logged by owner.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="No Activities Yet"
          description="Activities will appear here as outreach begins."
          action={
            <Link href="/capture">
              <Button size="sm" className="gap-1">Log a capture <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Execution Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <QueueMetricCard label="Overdue" value={queueCounts.overdue} tone={queueCounts.overdue > 0 ? 'text-red-600' : 'text-emerald-600'} />
                <QueueMetricCard label="Due today" value={queueCounts.today} tone={queueCounts.today > 0 ? 'text-amber-600' : 'text-[var(--foreground)]'} />
                <QueueMetricCard label="Due this week" value={queueCounts.week} tone="text-[var(--foreground)]" />
                <QueueMetricCard label="Follow-up" value={queueCounts.followUp} tone="text-blue-600" />
              </div>

              <div className="flex flex-wrap gap-2">
                {queueFilterLinks.map((filter) => (
                  <Link key={filter.key} href={filter.key === 'all' ? '/activities' : `/activities?filter=${filter.key}`}>
                    <Button variant={selectedFilter === filter.key ? 'default' : 'outline'} size="sm" className="h-8 gap-1 text-xs">
                      {filter.label}
                      <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{filter.count}</span>
                    </Button>
                  </Link>
                ))}
              </div>

              {filteredQueue.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No queued items match this filter.</p>
              ) : (
                <div className="space-y-2">
                  {filteredQueue.slice(0, 8).map((activity, index) => (
                    <Card key={`${activity.account}-${activity.activity_type}-${index}`}>
                      <CardContent className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/accounts/${slugify(activity.account)}`} className="truncate font-medium text-sm text-[var(--primary)] hover:underline">
                              {activity.account}
                            </Link>
                            <Badge variant="secondary" className="text-[10px]">{activity.activity_type}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{activity.next_step}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                            <span>Owner: {activity.owner}</span>
                            {activity.persona && <span>Contact: {activity.persona}</span>}
                            {activity.next_step_due && <span>Due: {activity.next_step_due}</span>}
                          </div>
                        </div>
                        <Badge variant={activity.dueBucket === 'overdue' ? 'destructive' : activity.dueBucket === 'today' ? 'secondary' : 'outline'}>
                          {activity.dueBucket === 'overdue'
                            ? 'Overdue'
                            : activity.dueBucket === 'today'
                              ? 'Today'
                              : activity.dueBucket === 'week'
                                ? 'This week'
                                : 'Queued'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Activity Log</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Full history across outreach, replies, page views, and creative handoffs.</p>
            </div>
            {activities.map((a, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="rounded-md bg-[var(--accent)] p-1.5">
                        <Activity className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      </div>
                      <Link href={`/accounts/${slugify(a.account)}`} className="truncate font-medium text-sm text-[var(--primary)] hover:underline">
                        {a.account}
                      </Link>
                      <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                      {a.dueBucket !== 'none' && (
                        <Badge variant={a.dueBucket === 'overdue' ? 'destructive' : a.dueBucket === 'today' ? 'secondary' : 'outline'} className="text-[10px]">
                          {a.dueBucket === 'overdue' ? 'Overdue' : a.dueBucket === 'today' ? 'Today' : a.dueBucket === 'week' ? 'This week' : 'Later'}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{a.activity_date}</span>
                  </div>
                  {a.persona && <p className="mt-1.5 text-sm">Contact: {a.persona}</p>}
                  {a.notes && <p className="mt-1 text-sm text-[var(--muted-foreground)] break-words line-clamp-3" title={a.notes}>{a.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
                    <span>Owner: {a.owner}</span>
                    {a.outcome && <span>Outcome: {a.outcome}</span>}
                    {a.next_step && <span>Next: {a.next_step} {a.next_step_due && `(due ${a.next_step_due})`}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QueueMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
