import Link from 'next/link';
import { dbGetMeetings, dbGetPersonas } from '@/lib/db';
import { getMeetingBriefs, slugify } from '@/lib/data';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { CalendarCheck, ArrowRight, FileText } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { MeetingsTable, type MeetingRow } from './meetings-table';

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
export const metadata = { title: 'Meetings' };

export default async function MeetingsPage() {
  const [rawMeetings, rawPersonas] = await Promise.all([dbGetMeetings(), dbGetPersonas()]);
  const briefsBySlug = new Set(getMeetingBriefs().map((brief) => slugify(brief.account)));
  const today = startOfDay(new Date());
  const endOfWeek = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

  const meetings: Array<MeetingRow & {
    dateRaw: Date | null;
    hasBrief: boolean;
    isUpcomingThisWeek: boolean;
    isCompleted: boolean;
  }> = rawMeetings.map((m, i) => {
    const dateRaw = m.meeting_date ? new Date(m.meeting_date) : null;
    const hasValidDate = dateRaw && !Number.isNaN(dateRaw.getTime());
    const status = m.meeting_status ?? '';
    const isCompleted = /held|completed/i.test(status);
    const isUpcomingThisWeek = Boolean(
      hasValidDate && !isCompleted && dateRaw.getTime() >= today.getTime() && dateRaw.getTime() <= endOfWeek.getTime(),
    );

    return {
      _idx: i,
      date: hasValidDate ? dateRaw.toLocaleDateString() : '',
      account: m.account_name ?? '',
      persona: m.persona ?? '',
      meeting_status: status,
      objective: m.objective ?? '',
      notes: m.notes ?? '',
      slug: slugify(m.account_name ?? ''),
      dateRaw: hasValidDate ? dateRaw : null,
      hasBrief: briefsBySlug.has(slugify(m.account_name ?? '')),
      isUpcomingThisWeek,
      isCompleted,
    };
  });

  const personaNames = rawPersonas.slice(0, 10).map((p) => ({ name: p.name, priority: p.priority ?? '' }));
  const upcomingMeetings = meetings
    .filter((meeting) => meeting.isUpcomingThisWeek)
    .sort((left, right) => (left.dateRaw?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.dateRaw?.getTime() ?? Number.MAX_SAFE_INTEGER));
  const bookedCount = meetings.filter((meeting) => /scheduled|booked|requested/i.test(meeting.meeting_status)).length;
  const completedCount = meetings.filter((meeting) => meeting.isCompleted).length;
  const prepNeededCount = upcomingMeetings.filter((meeting) => meeting.hasBrief || meeting.objective || meeting.notes).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Meetings' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings ({meetings.length})</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Scheduled and completed meetings linked to accounts and briefs.
          </p>
        </div>
        <BookMeetingDialog
          accountName=""
          personas={personaNames}
          calendlyLink={process.env.NEXT_PUBLIC_CALENDLY_LINK}
        />
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-10 w-10" />}
          title="No Meetings Yet"
          description="Meetings will appear here once booked. Start outreach to fill the pipeline."
          action={
            <Link href="/waves">
              <Button size="sm" className="gap-1">View Outreach Waves <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MeetingMetricCard label="Upcoming This Week" value={upcomingMeetings.length} tone={upcomingMeetings.length > 0 ? 'text-blue-600' : 'text-[var(--foreground)]'} />
            <MeetingMetricCard label="Booked / Scheduled" value={bookedCount} tone="text-[var(--foreground)]" />
            <MeetingMetricCard label="Prep Ready" value={prepNeededCount} tone={prepNeededCount > 0 ? 'text-emerald-600' : 'text-[var(--foreground)]'} />
            <MeetingMetricCard label="Completed" value={completedCount} tone="text-[var(--foreground)]" />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Meeting Prep Queue</CardTitle>
                <Link href="/briefs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Open briefs <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No meetings are scheduled in the next 7 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMeetings.slice(0, 5).map((meeting) => (
                    <div key={`${meeting.slug}-${meeting._idx}`} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/accounts/${meeting.slug}`} className="truncate font-medium text-sm text-[var(--primary)] hover:underline">
                            {meeting.account}
                          </Link>
                          <StatusBadge status={meeting.meeting_status} />
                          {meeting.hasBrief && (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <FileText className="h-3 w-3" /> Brief ready
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {meeting.persona || 'TBD'} · {meeting.date || 'Date TBD'}
                        </p>
                        {meeting.objective && <p className="mt-1 text-xs text-[var(--muted-foreground)]">Objective: {meeting.objective}</p>}
                        {meeting.notes && <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{meeting.notes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {meeting.hasBrief && (
                          <Link href={`/briefs/${meeting.slug}`}>
                            <Button variant="outline" size="sm">Brief</Button>
                          </Link>
                        )}
                        <Link href={`/accounts/${meeting.slug}`}>
                          <Button size="sm">Account</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <MeetingsTable meetings={meetings} />
        </div>
      )}
    </div>
  );
}

function MeetingMetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
