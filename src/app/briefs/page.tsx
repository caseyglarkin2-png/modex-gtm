import Link from 'next/link';
import { dbGetMeetings } from '@/lib/db';
import { getMeetingBriefs, slugify } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

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

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meeting Briefs' };

export default async function BriefsPage() {
  const briefs = getMeetingBriefs();
  const rawMeetings = await dbGetMeetings();
  const briefsBySlug = new Map(briefs.map((brief) => [slugify(brief.account), brief]));
  const today = startOfDay(new Date());
  const endOfWeek = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

  const upcomingMeetings = rawMeetings
    .map((meeting, index) => {
      const slug = slugify(meeting.account_name ?? '');
      const dateRaw = meeting.meeting_date ? new Date(meeting.meeting_date) : null;
      const hasValidDate = dateRaw && !Number.isNaN(dateRaw.getTime());
      const status = meeting.meeting_status ?? '';
      const isCompleted = /held|completed/i.test(status);

      return {
        id: `${slug}-${index}`,
        slug,
        account: meeting.account_name ?? 'Unknown account',
        persona: meeting.persona ?? '',
        status,
        objective: meeting.objective ?? '',
        notes: meeting.notes ?? '',
        dateRaw: hasValidDate ? dateRaw : null,
        dateLabel: hasValidDate ? dateRaw.toLocaleDateString() : 'Date TBD',
        brief: briefsBySlug.get(slug),
        hasBrief: briefsBySlug.has(slug),
        isUpcomingThisWeek: Boolean(
          hasValidDate && !isCompleted && dateRaw.getTime() >= today.getTime() && dateRaw.getTime() <= endOfWeek.getTime(),
        ),
      };
    })
    .filter((meeting) => meeting.isUpcomingThisWeek)
    .sort((left, right) => (left.dateRaw?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.dateRaw?.getTime() ?? Number.MAX_SAFE_INTEGER));

  const coverageGapCount = upcomingMeetings.filter((meeting) => !meeting.hasBrief).length;
  const verticalCounts = Array.from(
    briefs.reduce((acc, brief) => {
      acc.set(brief.vertical, (acc.get(brief.vertical) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).sort((left, right) => right[1] - left[1]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Meeting Briefs' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meeting Briefs ({briefs.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pre-meeting preparation documents for each target account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Brief Library" value={briefs.length} tone="text-[var(--foreground)]" />
        <MetricCard label="Upcoming This Week" value={upcomingMeetings.length} tone={upcomingMeetings.length > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
        <MetricCard label="Coverage Gap" value={coverageGapCount} tone={coverageGapCount > 0 ? 'text-amber-600' : 'text-emerald-600'} />
        <MetricCard label="Verticals Covered" value={verticalCounts.length} tone="text-[var(--foreground)]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Prep Priority Board</CardTitle>
              <Link href="/meetings">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Open meetings <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No meetings are scheduled in the next 7 days. Use the brief library below to stay ahead of the next reply.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/accounts/${meeting.slug}`} className="truncate text-sm font-medium text-[var(--primary)] hover:underline">
                          {meeting.account}
                        </Link>
                        <Badge variant="outline" className={meeting.hasBrief ? 'text-emerald-700' : 'text-amber-700'}>
                          {meeting.hasBrief ? 'Brief ready' : 'Coverage gap'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {meeting.persona || 'TBD'} · {meeting.dateLabel}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                        {meeting.brief?.why_now || meeting.brief?.why_this_account || meeting.objective || meeting.notes || 'Prep notes still needed before the meeting.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {meeting.hasBrief ? (
                        <Link href={`/briefs/${meeting.slug}`}>
                          <Button variant="outline" size="sm">Open brief</Button>
                        </Link>
                      ) : (
                        <Link href={`/accounts/${meeting.slug}`}>
                          <Button size="sm">Prep account</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Coverage Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/40 p-3 text-sm text-[var(--muted-foreground)]">
              {coverageGapCount > 0 ? (
                <span className="inline-flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" /> {coverageGapCount} upcoming meeting{coverageGapCount === 1 ? '' : 's'} still need a brief.
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <CalendarCheck className="h-4 w-4" /> Every meeting on deck this week already has prep coverage.
                </span>
              )}
            </div>

            <div className="space-y-2">
              {verticalCounts.slice(0, 4).map(([vertical, count]) => (
                <div key={vertical} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <span className="text-[var(--foreground)]">{vertical}</span>
                  <Badge variant="outline">{count} brief{count === 1 ? '' : 's'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Brief Library</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Open any account brief for talking points, pain hypotheses, and next-step prep.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((b) => (
            <Link key={b.account} href={`/briefs/${slugify(b.account)}`}>
              <Card className="h-full transition-colors hover:border-[var(--primary)] hover:bg-[var(--accent)]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-md bg-[var(--accent)] p-2">
                      <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                    <Badge variant="outline" className="text-xs">{b.vertical}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{b.account}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{b.why_this_account}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
                    View brief <ArrowRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

