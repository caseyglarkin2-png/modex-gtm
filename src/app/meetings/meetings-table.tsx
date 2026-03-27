'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

export interface MeetingRow {
  _idx: number;
  date: string;
  account: string;
  persona: string;
  meeting_status: string;
  objective: string;
  notes: string;
  slug: string;
}

const columns: Column<MeetingRow>[] = [
  { key: 'date', label: 'Date', sortable: true, className: 'w-28' },
  {
    key: 'account', label: 'Account', sortable: true,
    render: (m) => (
      <Link href={`/accounts/${m.slug}`} className="font-medium text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
        {m.account}
      </Link>
    ),
  },
  { key: 'persona', label: 'Persona', sortable: true, className: 'hidden sm:table-cell max-w-48 truncate' },
  { key: 'meeting_status', label: 'Status', sortable: true, render: (m) => <StatusBadge status={m.meeting_status} /> },
  { key: 'objective', label: 'Objective', className: 'hidden lg:table-cell max-w-48 truncate text-xs' },
];

export function MeetingsTable({ meetings }: { meetings: MeetingRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={meetings}
      searchKey="account"
      searchPlaceholder="Search meetings..."
      onRowClick={(m) => router.push(`/accounts/${m.slug}`)}
    />
  );
}
