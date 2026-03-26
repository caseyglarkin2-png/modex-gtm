'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMeetings, getAccounts, getPersonas, slugify } from '@/lib/data';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

interface MeetingRow {
  _idx: number;
  date: string;
  account: string;
  attendees: string;
  meeting_type: string;
  status: string;
  outcome: string;
  notes: string;
}

const columns: Column<MeetingRow>[] = [
  { key: 'date', label: 'Date', sortable: true, className: 'w-28' },
  {
    key: 'account', label: 'Account', sortable: true,
    render: (m) => (
      <Link href={`/accounts/${m.account.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="font-medium text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
        {m.account}
      </Link>
    ),
  },
  { key: 'attendees', label: 'Attendees', sortable: true, className: 'hidden sm:table-cell max-w-48 truncate' },
  {
    key: 'meeting_type', label: 'Type', sortable: true, className: 'hidden md:table-cell',
    render: (m) => <Badge variant="outline" className="text-xs">{m.meeting_type}</Badge>,
  },
  { key: 'status', label: 'Status', sortable: true, render: (m) => <StatusBadge status={m.status} /> },
  { key: 'outcome', label: 'Outcome', className: 'hidden lg:table-cell max-w-48 truncate text-xs' },
];

export default function MeetingsPage() {
  const router = useRouter();
  const rawMeetings = getMeetings();
  const accounts = getAccounts();
  const personas = getPersonas();

  const meetings: MeetingRow[] = rawMeetings.map((m, i) => ({ ...m, _idx: i }));

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
          personas={personas.slice(0, 10).map((p) => ({ name: p.name, priority: p.priority }))}
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
        <DataTable
          columns={columns}
          data={meetings}
          searchKey="account"
          searchPlaceholder="Search meetings..."
          onRowClick={(m) => router.push(`/accounts/${slugify(m.account)}`)}
        />
      )}
    </div>
  );
}
