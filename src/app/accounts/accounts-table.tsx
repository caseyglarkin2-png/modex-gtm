'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/data-table';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { AccountRowActions } from '@/components/accounts/account-row-actions';

export interface AccountRow {
  rank: number;
  name: string;
  vertical: string | null;
  priority_band: string | null;
  tier: string | null;
  priority_score: number | null;
  persona_count: number;
  owner: string | null;
  research_status: string | null;
  outreach_status: string | null;
  meeting_status: string | null;
  slug: string;
}

const columns: Column<AccountRow>[] = [
  { key: 'rank', label: '#', sortable: true, className: 'w-12 text-center' },
  { key: 'name', label: 'Account', sortable: true, render: (a) => <span className="font-medium">{a.name}</span> },
  { key: 'vertical', label: 'Vertical', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'priority_band', label: 'Band', sortable: true, render: (a) => <BandBadge band={a.priority_band ?? ''} /> },
  { key: 'tier', label: 'Tier', sortable: true, className: 'hidden md:table-cell' },
  { key: 'priority_score', label: 'Score', sortable: true, render: (a) => <span className="font-mono font-semibold">{a.priority_score}</span> },
  { key: 'persona_count', label: 'Personas', sortable: true, className: 'text-center hidden sm:table-cell' },
  { key: 'owner', label: 'Owner', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'research_status', label: 'Research', sortable: true, className: 'hidden xl:table-cell', render: (a) => <StatusBadge status={a.research_status ?? ''} /> },
  { key: 'outreach_status', label: 'Outreach', sortable: true, className: 'hidden xl:table-cell', render: (a) => <StatusBadge status={a.outreach_status ?? ''} /> },
  { key: 'meeting_status', label: 'Meeting', sortable: true, render: (a) => <StatusBadge status={a.meeting_status ?? ''} /> },
  {
    key: 'slug',
    label: '',
    render: (a) => <AccountRowActions account={{ name: a.name, slug: a.slug }} />,
    className: 'w-12',
  },
];

export function AccountsTable({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={accounts}
      searchKey="name"
      searchPlaceholder="Search accounts..."
      onRowClick={(item) => router.push(`/accounts/${item.slug}`)}
    />
  );
}
