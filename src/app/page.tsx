import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/data';
import {
  getCachedAccounts,
  getCachedActivities,
  getCachedCampaignSummaries,
} from '@/lib/data-cache';
import {
  buildFocusItems,
  formatDueLabel,
  isSameCalendarDay,
  startOfDay,
} from '@/lib/home-cockpit';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FOCUS_LIMIT = 8;
const URGENCY_ORDER = { overdue: 0, today: 1, upcoming: 2 } as const;
const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export default async function DashboardPage() {
  const today = startOfDay(new Date());

  const [accounts, activities, contactedCount, campaigns, replyCount, failureCount] = await Promise.all([
    getCachedAccounts(),
    getCachedActivities(),
    prisma.emailLog
      .findMany({ distinct: ['account_name'], select: { account_name: true } })
      .then((rows) => rows.length),
    getCachedCampaignSummaries(),
    prisma.notification.count({ where: { type: 'reply', read: false } }),
    Promise.all([
      prisma.generationJob.count({ where: { status: 'failed' } }),
      prisma.sendJob.count({ where: { status: { in: ['failed', 'partial'] } } }),
      prisma.sendJobRecipient.count({ where: { status: 'failed' } }),
    ]).then(([gen, send, recipients]) => gen + send + recipients),
  ]);

  const researchedCount = accounts.filter(
    (account) => account.research_status === 'Ready' || account.research_status === 'Complete',
  ).length;
  const meetingsBookedCount = accounts.filter(
    (account) => account.meeting_status === 'Meeting Booked' || account.meeting_status === 'Meeting Held',
  ).length;

  const bandByAccount = new Map(
    accounts.map((account) => [account.name, account.priority_band ?? 'D'] as const),
  );

  const allFocusItems = buildFocusItems(accounts, activities).sort((left, right) => {
    const urgencyDelta = URGENCY_ORDER[left.urgency] - URGENCY_ORDER[right.urgency];
    if (urgencyDelta !== 0) return urgencyDelta;
    const leftBand = BAND_ORDER[bandByAccount.get(left.account) ?? 'D'] ?? 3;
    const rightBand = BAND_ORDER[bandByAccount.get(right.account) ?? 'D'] ?? 3;
    if (leftBand !== rightBand) return leftBand - rightBand;
    return left.due.getTime() - right.due.getTime();
  });

  const overdueCount = allFocusItems.filter((item) => item.urgency === 'overdue').length;
  const focusItems = allFocusItems.slice(0, FOCUS_LIMIT);

  const activeCampaignCount = campaigns.filter((campaign) => campaign.status !== 'archived').length;
  const allClear = overdueCount === 0 && failureCount === 0 && replyCount === 0;

  const healthTone: 'healthy' | 'warning' | 'blocked' =
    failureCount === 0 ? 'healthy' : failureCount > 5 ? 'blocked' : 'warning';
  const healthLabel = healthTone === 'healthy' ? 'Healthy' : healthTone === 'blocked' ? 'Blocked' : 'Warning';

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home' }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Daily cockpit for Casey&apos;s RevOps operating loop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              Pipeline Board <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <AutoRefresh intervalMs={30_000} />
          </Badge>
        </div>
      </div>

      <section aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="sr-only">Alerts</h2>
        {allClear ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">All clear — nothing waiting on you.</span>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <AlertTile
              href="/queue?filter=overdue"
              icon={<Activity className="h-5 w-5" />}
              count={overdueCount}
              label={overdueCount === 1 ? 'overdue item' : 'overdue items'}
              tone={overdueCount > 0 ? 'red' : 'neutral'}
            />
            <AlertTile
              href="/ops"
              icon={<AlertTriangle className="h-5 w-5" />}
              count={failureCount}
              label={failureCount === 1 ? 'failed job' : 'failed jobs'}
              tone={failureCount > 0 ? 'amber' : 'neutral'}
            />
            <AlertTile
              href="/engagement"
              icon={<Inbox className="h-5 w-5" />}
              count={replyCount}
              label={replyCount === 1 ? 'unanswered reply' : 'unanswered replies'}
              tone={replyCount > 0 ? 'blue' : 'neutral'}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="focus-heading">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle id="focus-heading" className="text-base">Today&apos;s Focus</CardTitle>
              <Link href={overdueCount > 0 ? '/queue?filter=overdue' : '/queue'}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all in Work Queue <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {focusItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
                No urgent follow-ups queued.
              </p>
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
                    <Link
                      key={`${item.account}-${item.summary}-${item.due.toISOString()}`}
                      href={`/accounts/${slugify(item.account)}`}
                    >
                      <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--accent)]/40">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{item.account}</p>
                            <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                            {item.summary}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                            Owner: {item.owner}
                          </p>
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
      </section>

      <section
        aria-labelledby="health-heading"
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm"
      >
        <h2 id="health-heading" className="sr-only">Pipeline and system health</h2>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
            Pipeline
          </span>
          <span className="font-medium tabular-nums">
            {accounts.length} target → {researchedCount} researched → {contactedCount} contacted → {meetingsBookedCount} meetings
          </span>
        </div>

        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <Megaphone className="h-4 w-4" />
          <span>
            {activeCampaignCount} active {activeCampaignCount === 1 ? 'campaign' : 'campaigns'}
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          href="/ops"
          className="inline-flex items-center gap-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          {healthTone === 'healthy' ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className={`h-4 w-4 ${healthTone === 'blocked' ? 'text-red-600' : 'text-amber-600'}`} />
          )}
          <Badge
            variant={
              healthTone === 'healthy' ? 'success' : healthTone === 'blocked' ? 'destructive' : 'warning'
            }
          >
            {healthLabel}
          </Badge>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

function AlertTile({
  href,
  icon,
  count,
  label,
  tone,
}: {
  href: string;
  icon: ReactNode;
  count: number;
  label: string;
  tone: 'red' | 'amber' | 'blue' | 'neutral';
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-900'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'blue'
          ? 'border-blue-200 bg-blue-50 text-blue-900'
          : 'border-[var(--border)] bg-[var(--muted)]/40 text-[var(--muted-foreground)]';

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg border p-4 transition-colors hover:opacity-90 ${toneClass}`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tabular-nums">{count}</p>
        <p className="text-xs">{label}</p>
      </div>
      <ArrowRight className="h-4 w-4 opacity-60" />
    </Link>
  );
}
