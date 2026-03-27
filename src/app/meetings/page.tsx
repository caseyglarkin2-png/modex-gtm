import Link from 'next/link';
import { dbGetMeetings, dbGetPersonas } from '@/lib/db';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { MeetingsTable, type MeetingRow } from './meetings-table';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Meetings' };

export default async function MeetingsPage() {
  const [rawMeetings, rawPersonas] = await Promise.all([dbGetMeetings(), dbGetPersonas()]);

  const meetings: MeetingRow[] = rawMeetings.map((m, i) => ({
    _idx: i,
    date: m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : '',
    account: m.account_name ?? '',
    persona: m.persona ?? '',
    meeting_status: m.meeting_status ?? '',
    objective: m.objective ?? '',
    notes: m.notes ?? '',
    slug: slugify(m.account_name ?? ''),
  }));

  const personaNames = rawPersonas.slice(0, 10).map((p) => ({ name: p.name, priority: p.priority ?? '' }));

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
        <MeetingsTable meetings={meetings} />
      )}
    </div>
  );
}
